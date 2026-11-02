import prisma from "@/lib/prisma";
import { getStandardAccounts } from "@/lib/commercial-accounting";
import { microCache } from "../cache/micro-cache";
import { FiscalLockService } from "../services/fiscal-lock.service";

export interface RecordCustomerPaymentCommandInput {
  salesInvoiceId?: string | null;
  customerId?: string | null;
  customerName?: string;
  amount: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CHEQUE" | "CARD";
  paymentDate?: Date | string;
  referenceNumber?: string | null;
  notes?: string | null;
  settlementDiscount?: number;
  discountAccountId?: string | null;
  userId: string;
}

export class RecordCustomerPaymentCommandHandler {
  static async execute(input: RecordCustomerPaymentCommandInput) {
    const {
      salesInvoiceId,
      customerId,
      amount,
      paymentMethod,
      paymentDate,
      referenceNumber,
      notes,
      settlementDiscount = 0,
      discountAccountId,
      userId,
    } = input;

    const payAmount = Math.round(Number(amount) * 100) / 100;
    const discountAmt = Math.max(0, Math.round(Number(settlementDiscount || 0) * 100) / 100);
    const totalCreditToAr = Math.round((payAmount + discountAmt) * 100) / 100;

    let custId = customerId;
    let custName = input.customerName;
    let invNumber = "";
    let invoiceToUpdate: any = null;

    if (salesInvoiceId) {
      invoiceToUpdate = await prisma.salesInvoice.findUnique({
        where: { id: salesInvoiceId },
      });
      if (invoiceToUpdate) {
        invNumber = invoiceToUpdate.invoiceNumber;
        if (!custId) custId = invoiceToUpdate.customerId;
        if (!custName) custName = invoiceToUpdate.customerName;
      }
    }

    if (custId && !custName) {
      const c = await prisma.customer.findUnique({ where: { id: custId } });
      if (c) custName = c.name;
    }

    // Generate clean sequential receipt number: REC-0004
    const count = await prisma.customerPayment.count();
    const recNo = `REC-${(count + 1).toString().padStart(4, "0")}`;
    const pmtDate = paymentDate ? new Date(paymentDate) : new Date();

    // 0. Verify Fiscal Period is not closed
    await FiscalLockService.assertPeriodNotLocked(pmtDate);

    // Accounts for Journal Entry
    const accounts = await getStandardAccounts();
    const debitAccount = paymentMethod === "CASH" ? accounts.cash : accounts.bank;

    const cleanRec = recNo.replace(/^REC-(?:20\d{2}-)?/i, "").replace(/^REC-/i, "");
    const entryNumber = `JE-REC-${cleanRec}`;

    const journalLines: any[] = [];

    // 1. Debit Bank or Cash for the actual received amount
    journalLines.push({
      accountId: debitAccount.id,
      debit: payAmount,
      credit: 0,
      currency: "AED",
      fxRate: 1,
      debitAed: payAmount,
      creditAed: 0,
      contactId: custId || null,
      contactName: custName || null,
      description: `Receipt ${recNo} - Payment received via ${paymentMethod}`,
    });

    // 2. Debit Discounts Allowed / Cash Settlement Discount (if applicable)
    if (discountAmt > 0) {
      const discountAcc = discountAccountId
        ? await prisma.chartOfAccount.findUnique({ where: { id: discountAccountId } })
        : accounts.salesDiscount;
      const targetAccountId = discountAcc?.id || accounts.salesDiscount?.id || accounts.expenseDiscount?.id;

      if (targetAccountId) {
        journalLines.push({
          accountId: targetAccountId,
          debit: discountAmt,
          credit: 0,
          currency: "AED",
          fxRate: 1,
          debitAed: discountAmt,
          creditAed: 0,
          contactId: custId || null,
          contactName: custName || null,
          description: `Early Payment Settlement Discount on Receipt ${recNo}`,
        });
      }
    }

    // 3. Credit Accounts Receivable for the full settled amount (paid + discount)
    journalLines.push({
      accountId: accounts.ar.id,
      debit: 0,
      credit: totalCreditToAr,
      currency: "AED",
      fxRate: 1,
      debitAed: 0,
      creditAed: totalCreditToAr,
      contactId: custId || null,
      contactName: custName || null,
      description: `Customer payment applied: ${recNo}${invNumber ? ` (Inv: ${invNumber})` : ""}`,
    });

    // Validate double-entry
    const totalDebit = journalLines.reduce((s, l) => s + Number(l.debitAed), 0);
    const totalCredit = journalLines.reduce((s, l) => s + Number(l.creditAed), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Unbalanced payment journal entry. Total Debit: ${totalDebit}, Total Credit: ${totalCredit}`);
    }

    // Atomic execution of payment, journal voucher, invoice balance, and customer balance
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Journal Entry
      const je = await tx.journalEntry.create({
        data: {
          entryNumber,
          entryDate: pmtDate,
          description: `Customer Receipt ${recNo} - ${custName || "Customer"}${invNumber ? ` (Inv: ${invNumber})` : ""}`,
          reference: recNo,
          isPosted: true,
          createdBy: userId,
          lines: {
            create: journalLines,
          },
        },
      });

      // 2. Create Payment Record
      const payment = await tx.customerPayment.create({
        data: {
          receiptNumber: recNo,
          customerId: custId || null,
          customerName: custName || "Valued Customer",
          salesInvoiceId: salesInvoiceId || null,
          paymentDate: pmtDate,
          amount: payAmount,
          paymentMethod: paymentMethod as any,
          referenceNumber,
          notes: notes ? `${notes}${discountAmt > 0 ? ` (Settlement Discount: AED ${discountAmt.toFixed(2)})` : ""}` : null,
          journalEntryId: je.id,
          createdById: userId,
        },
        include: {
          salesInvoice: true,
          customerRel: true,
        },
      });

      // 3. Update Invoice Paid Amount & Status
      if (invoiceToUpdate) {
        const newPaid = Number(invoiceToUpdate.paidAmount || 0) + totalCreditToAr;
        const newRem = Math.max(0, Number(invoiceToUpdate.totalAmount || 0) - newPaid);
        const newStatus =
          newRem <= 0
            ? "PAID"
            : newPaid > 0
              ? "PARTIALLY_PAID"
              : invoiceToUpdate.status;

        await tx.salesInvoice.update({
          where: { id: salesInvoiceId! },
          data: {
            paidAmount: newPaid,
            remainingBalance: newRem,
            status: newStatus as any,
          },
        });
      }

      // 4. Decrement Customer Balance
      if (custId) {
        await tx.customer.update({
          where: { id: custId },
          data: {
            currentBalance: { decrement: totalCreditToAr },
          },
        });
      }

      return payment;
    });

    // Invalidate query caches
    microCache.invalidatePrefix("gl:");
    microCache.invalidatePrefix("pnl:");
    microCache.invalidatePrefix("bs:");
    microCache.invalidatePrefix("tb:");
    microCache.invalidatePrefix("vat:");
    microCache.invalidatePrefix("tax:");
    microCache.invalidatePrefix("ct:");

    return result;
  }
}
