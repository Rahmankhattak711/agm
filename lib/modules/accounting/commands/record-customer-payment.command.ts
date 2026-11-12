import prisma from "@/lib/prisma";
import { getStandardAccounts, extractCleanSeq } from "@/lib/commercial-accounting";
import { getNextReceiptNumber } from "@/lib/utils/sequence";
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

    const pmtDate = paymentDate ? new Date(paymentDate) : new Date();

    // 0. Verify Fiscal Period is not closed
    await FiscalLockService.assertPeriodNotLocked(pmtDate);

    // Accounts for Journal Entry
    const accounts = await getStandardAccounts();
    const debitAccount = paymentMethod === "CASH" ? accounts.cash : accounts.bank;

    // Atomic execution of payment, journal voucher, invoice balance, and customer balance
    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate clean atomic sequential receipt number inside transaction
      const recNo = await getNextReceiptNumber(tx);
      const cleanRec = extractCleanSeq(recNo);
      const entryNumber = `JE-REC-${cleanRec}`;

      let currentInvoice: any = null;
      if (salesInvoiceId) {
        currentInvoice = await tx.salesInvoice.findUnique({
          where: { id: salesInvoiceId },
        });
        if (currentInvoice) {
          invNumber = currentInvoice.invoiceNumber;
          if (!custId) custId = currentInvoice.customerId;
          if (!custName) custName = currentInvoice.customerName;
        }
      }

      if (custId && !custName) {
        const c = await tx.customer.findUnique({ where: { id: custId } });
        if (c) custName = c.name;
      }

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
          ? await tx.chartOfAccount.findUnique({ where: { id: discountAccountId } })
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

      // 3. Update Invoice with optimistic lock
      if (currentInvoice) {
        const newPaid = Number(currentInvoice.paidAmount || 0) + totalCreditToAr;
        const newRem = Math.max(0, Number(currentInvoice.totalAmount || 0) - newPaid);
        const newStatus =
          newRem <= 0
            ? "PAID"
            : newPaid > 0
              ? "PARTIALLY_PAID"
              : currentInvoice.status;

        const updateRes = await tx.salesInvoice.updateMany({
          where: {
            id: salesInvoiceId!,
            paidAmount: currentInvoice.paidAmount,
          },
          data: {
            paidAmount: newPaid,
            remainingBalance: newRem,
            status: newStatus as any,
          },
        });

        if (updateRes.count === 0) {
          throw new Error("Concurrency conflict: Invoice balance was concurrently modified. Please retry.");
        }
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
