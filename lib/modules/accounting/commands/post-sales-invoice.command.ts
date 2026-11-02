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

    // 1. Generate & Post Balanced Double-Entry Journal Voucher
    const je = await postSalesInvoiceJournalEntry({
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
    });

    // 2. Update Invoice Status atomically
    const updatedInvoice = await prisma.salesInvoice.update({
      where: { id: invoiceId },
      data: {
        status: "POSTED",
        journalEntryId: je.id,
        postedAt: new Date(),
      },
    });

    // 3. Update Customer Balance
    if (invoice.customerId) {
      await prisma.customer.update({
        where: { id: invoice.customerId },
        data: {
          currentBalance: { increment: Number(invoice.totalAmount) },
        },
      });
    }

    // 4. Invalidate Query Caches so reports update instantaneously
    microCache.invalidatePrefix("gl:");
    microCache.invalidatePrefix("pnl:");
    microCache.invalidatePrefix("bs:");
    microCache.invalidatePrefix("tb:");
    microCache.invalidatePrefix("vat:");
    microCache.invalidatePrefix("tax:");
    microCache.invalidatePrefix("ct:");

    return {
      invoice: updatedInvoice,
      journalEntry: je,
    };
  }
}
