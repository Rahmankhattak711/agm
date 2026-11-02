import prisma from "@/lib/prisma";
import { getStandardAccounts } from "@/lib/commercial-accounting";
import { microCache } from "../cache/micro-cache";
import { FiscalLockService } from "../services/fiscal-lock.service";

export interface UpdatePostedInvoiceCommandInput {
  invoiceId: string;
  subtotal: number;
  discount: number;
  discountAccountId?: string | null;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  userId: string;
}

export class UpdatePostedInvoiceCommandHandler {
  static async execute(input: UpdatePostedInvoiceCommandInput) {
    const {
      invoiceId,
      subtotal,
      discount,
      discountAccountId,
      vatAmount,
      totalAmount,
    } = input;

    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: invoiceId },
      include: { journalEntry: true },
    });

    if (!invoice) {
      throw new Error("Sales invoice not found");
    }

    if (!invoice.journalEntryId) {
      // If invoice was not posted to GL yet, no journal entry to sync
      return null;
    }

    // Assert that the period is not locked
    await FiscalLockService.assertPeriodNotLocked(invoice.invoiceDate);

    const accounts = await getStandardAccounts();

    const discountAmount = Math.max(0, Math.round(Number(discount || 0) * 100) / 100);
    const vatAmt = Math.max(0, Math.round(Number(vatAmount || 0) * 100) / 100);
    const totAmt = Math.round(Number(totalAmount || 0) * 100) / 100;
    const netSubtotal = Math.round((totAmt - vatAmt) * 100) / 100;
    const grossSubtotal = Math.round((netSubtotal + discountAmount) * 100) / 100;

    const newLines: any[] = [];

    // 1. Debit Accounts Receivable
    newLines.push({
      accountId: accounts.ar.id,
      debit: totAmt,
      credit: 0,
      currency: "AED",
      fxRate: 1,
      debitAed: totAmt,
      creditAed: 0,
      contactId: invoice.customerId || null,
      contactName: invoice.customerName || null,
      description: `Sales Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
    });

    // 2. Debit Sales Discount
    let discountApplied = false;
    if (discountAmount > 0) {
      const discountAcc = discountAccountId
        ? await prisma.chartOfAccount.findUnique({ where: { id: discountAccountId } })
        : accounts.salesDiscount;
      const targetAccountId = discountAcc?.id || accounts.salesDiscount?.id || accounts.expenseDiscount?.id;

      if (targetAccountId) {
        newLines.push({
          accountId: targetAccountId,
          debit: discountAmount,
          credit: 0,
          currency: "AED",
          fxRate: 1,
          debitAed: discountAmount,
          creditAed: 0,
          contactId: invoice.customerId || null,
          contactName: invoice.customerName || null,
          description: `Sales Discount granted on Invoice ${invoice.invoiceNumber}`,
        });
        discountApplied = true;
      }
    }

    // 3. Credit Sales Revenue
    const revenueCredit = discountApplied ? grossSubtotal : netSubtotal;
    newLines.push({
      accountId: accounts.salesRevenue.id,
      debit: 0,
      credit: revenueCredit,
      currency: "AED",
      fxRate: 1,
      debitAed: 0,
      creditAed: revenueCredit,
      contactId: invoice.customerId || null,
      contactName: invoice.customerName || null,
      description: `Gross Sales Revenue - Invoice ${invoice.invoiceNumber}`,
    });

    // 4. Credit Output VAT
    if (vatAmt > 0) {
      newLines.push({
        accountId: accounts.outputVat.id,
        debit: 0,
        credit: vatAmt,
        currency: "AED",
        fxRate: 1,
        debitAed: 0,
        creditAed: vatAmt,
        taxRate: 5,
        taxType: "STANDARD_SALES",
        taxAmount: vatAmt,
        contactId: invoice.customerId || null,
        contactName: invoice.customerName || null,
        description: `Output VAT 5% for ${invoice.invoiceNumber}`,
      });
    }

    // Validate double-entry balance
    const totalDebit = newLines.reduce((s, l) => s + Number(l.debitAed), 0);
    const totalCredit = newLines.reduce((s, l) => s + Number(l.creditAed), 0);
    const diff = Math.abs(totalDebit - totalCredit);
    if (diff > 0.01) {
      throw new Error(
        `Cannot update journal entry: unbalanced lines. Total Debit: AED ${totalDebit.toFixed(2)}, Total Credit: AED ${totalCredit.toFixed(2)} (Diff: ${diff.toFixed(2)})`
      );
    }

    // Atomically replace journal lines in General Ledger
    await prisma.$transaction(async (tx) => {
      await tx.journalEntryLine.deleteMany({
        where: { journalEntryId: invoice.journalEntryId! },
      });

      await tx.journalEntry.update({
        where: { id: invoice.journalEntryId! },
        data: {
          description: `Sales Invoice ${invoice.invoiceNumber} - ${invoice.customerName} (Updated)`,
          lines: {
            create: newLines,
          },
        },
      });

      // Update customer balance delta
      if (invoice.customerId) {
        const oldTotal = Number(invoice.totalAmount || 0);
        const delta = totAmt - oldTotal;
        if (delta !== 0) {
          await tx.customer.update({
            where: { id: invoice.customerId },
            data: {
              currentBalance: { increment: delta },
            },
          });
        }
      }
    });

    // Invalidate query caches
    microCache.invalidatePrefix("gl:");
    microCache.invalidatePrefix("pnl:");
    microCache.invalidatePrefix("bs:");
    microCache.invalidatePrefix("tb:");
    microCache.invalidatePrefix("vat:");
    microCache.invalidatePrefix("tax:");
    microCache.invalidatePrefix("ct:");

    return true;
  }
}
