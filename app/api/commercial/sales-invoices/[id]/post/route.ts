import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { postSalesInvoiceJournalEntry } from "@/lib/commercial-accounting";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"])) {
      return forbidden();
    }

    const { id } = await params;

    const invoice = await prisma.salesInvoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Sales invoice not found" },
        { status: 404 },
      );
    }

    if (invoice.status === "POSTED" || invoice.status === "PAID") {
      return NextResponse.json(
        { error: "Invoice is already posted" },
        { status: 400 },
      );
    }

    const je = await postSalesInvoiceJournalEntry({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      customerName: invoice.customerName,
      subtotal: Number(invoice.subtotal),
      vatAmount: Number(invoice.vatAmount),
      totalAmount: Number(invoice.totalAmount),
      userId: authUser.id,
    });

    const updated = await prisma.salesInvoice.update({
      where: { id },
      data: {
        status: "POSTED",
        journalEntryId: je.id,
        postedAt: new Date(),
      },
    });

    // Update customer outstanding balance
    if (invoice.customerId) {
      await prisma.customer.update({
        where: { id: invoice.customerId },
        data: {
          currentBalance: { increment: Number(invoice.totalAmount) },
        },
      });
    }

    return NextResponse.json({
      success: true,
      invoice: updated,
      journalEntryId: je.id,
    });
  } catch (error: any) {
    console.error("POST post sales invoice error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to post sales invoice" },
      { status: 500 },
    );
  }
}
