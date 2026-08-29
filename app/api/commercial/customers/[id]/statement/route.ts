import { getAuthUser, unauthorized } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        salesInvoices: {
          orderBy: { invoiceDate: "asc" },
          include: {
            items: true,
          },
        },
        customerPayments: {
          orderBy: { paymentDate: "asc" },
        },
        creditNotes: {
          orderBy: { returnDate: "asc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // Build chronological Statement Ledger
    type StatementRow = {
      date: string;
      type: "INVOICE" | "PAYMENT" | "CREDIT_NOTE";
      reference: string;
      description: string;
      debit: number;
      credit: number;
      runningBalance: number;
    };

    const rawEvents: {
      date: Date;
      type: "INVOICE" | "PAYMENT" | "CREDIT_NOTE";
      reference: string;
      description: string;
      debit: number;
      credit: number;
    }[] = [];

    customer.salesInvoices.forEach((inv) => {
      rawEvents.push({
        date: new Date(inv.invoiceDate),
        type: "INVOICE",
        reference: inv.invoiceNumber,
        description: `Tax Invoice - ${inv.projectScope || "General Fitout"}`,
        debit: Number(inv.totalAmount),
        credit: 0,
      });
    });

    customer.customerPayments.forEach((pmt) => {
      rawEvents.push({
        date: new Date(pmt.paymentDate),
        type: "PAYMENT",
        reference: pmt.receiptNumber,
        description: `Payment Receipt (${pmt.paymentMethod})${pmt.referenceNumber ? ` Ref: ${pmt.referenceNumber}` : ""}`,
        debit: 0,
        credit: Number(pmt.amount),
      });
    });

    customer.creditNotes.forEach((cn) => {
      rawEvents.push({
        date: new Date(cn.returnDate),
        type: "CREDIT_NOTE",
        reference: cn.creditNoteNumber,
        description: `Credit Note - ${cn.reason || "Scope Reduction"}`,
        debit: 0,
        credit: Number(cn.totalAmount),
      });
    });

    // Sort by date ascending
    rawEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    let running = 0;
    const ledger: StatementRow[] = rawEvents.map((evt) => {
      running += evt.debit - evt.credit;
      return {
        date: evt.date.toISOString().slice(0, 10),
        type: evt.type,
        reference: evt.reference,
        description: evt.description,
        debit: evt.debit,
        credit: evt.credit,
        runningBalance: running,
      };
    });

    const totalBilled = customer.salesInvoices.reduce(
      (s, i) => s + Number(i.totalAmount),
      0,
    );
    const totalPaid = customer.customerPayments.reduce(
      (s, p) => s + Number(p.amount),
      0,
    );
    const totalCredits = customer.creditNotes.reduce(
      (s, c) => s + Number(c.totalAmount),
      0,
    );
    const currentOutstanding = totalBilled - totalPaid - totalCredits;

    return NextResponse.json({
      customer,
      statement: ledger,
      summary: {
        totalBilled,
        totalPaid,
        totalCredits,
        currentOutstanding,
      },
    });
  } catch (error: any) {
    console.error("GET customer statement error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch customer statement" },
      { status: 500 },
    );
  }
}
