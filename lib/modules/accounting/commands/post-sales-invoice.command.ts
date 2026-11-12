import prisma from "@/lib/prisma";
import { postSalesInvoiceJournalEntry } from "@/lib/commercial-accounting";
import { microCache } from "../cache/micro-cache";
import { FiscalLockService } from "../services/fiscal-lock.service";

export interface PostSalesInvoiceCommandInput {
  invoiceId: string;
  userId: string;
}

export class PostSalesInvoiceCommandHandler {
  static async execute(input: PostSalesInvoiceCommandInput) {
    const { invoiceId, userId } = input;

    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error("Sales invoice not found");
    }

    if (invoice.status === "POSTED" || invoice.status === "PAID") {
      throw new Error("Invoice is already posted to General Ledger");
    }

    // 0. Verify Fiscal Period is not closed
    await FiscalLockService.assertPeriodNotLocked(invoice.invoiceDate);

    // Atomic execution of status transition, journal voucher, and customer balance
    const result = await prisma.$transaction(async (tx) => {
      // 1. Optimistic locking on status to prevent duplicate concurrent posting
      const lockRes = await tx.salesInvoice.updateMany({
        where: { id: invoiceId, status: "DRAFT" },
        data: {
          status: "POSTED",
          postedAt: new Date(),
        },
      });

      if (lockRes.count === 0) {
        const recheck = await tx.salesInvoice.findUnique({ where: { id: invoiceId } });
        if (recheck?.status === "POSTED" || recheck?.status === "PAID") {
          throw new Error("Invoice is already posted to General Ledger");
        }
        throw new Error("Concurrency conflict: Invoice was modified concurrently");
      }

      // 2. Generate & Post Balanced Double-Entry Journal Voucher inside transaction
      const je = await postSalesInvoiceJournalEntry(
        {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          customerName: invoice.customerName,
          subtotal: Number(invoice.subtotal) + Number(invoice.discount || 0),
          discount: Number(invoice.discount || 0),
          discountAccountId: invoice.discountAccountId,
          vatAmount: Number(invoice.vatAmount),
          totalAmount: Number(invoice.totalAmount),
          userId,
        },
        tx
      );

      // 3. Link Journal Entry back to Invoice
      const updatedInvoice = await tx.salesInvoice.update({
        where: { id: invoiceId },
        data: {
          journalEntryId: je.id,
        },
      });

      // 4. Update Customer Balance atomically
      if (invoice.customerId) {
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: {
            currentBalance: { increment: Number(invoice.totalAmount) },
          },
        });
      }

      return {
        invoice: updatedInvoice,
        journalEntry: je,
      };
    });

    // 5. Invalidate Query Caches so reports update instantaneously
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
