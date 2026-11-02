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
          where: {
            status: { in: ["POSTED", "PARTIALLY_PAID", "PAID"] },
          },
          orderBy: { invoiceDate: "asc" },
          include: {
            items: true,
          },
        },
        customerPayments: {
          orderBy: { paymentDate: "asc" },
          include: {
            journalEntry: {
              include: {
                lines: true,
              },
            },
          },
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
      // Exclude DRAFT and CANCELLED invoices from official customer statement
      if (inv.status === "DRAFT" || inv.status === "CANCELLED") return;

      rawEvents.push({
        date: new Date(inv.invoiceDate),
        type: "INVOICE",
        reference: inv.invoiceNumber,
        description: `Tax Invoice - ${inv.projectScope || "General Fitout"}`,
        debit: Number(inv.totalAmount),
        credit: 0,
      });
    });

    let totalSettlementDiscounts = 0;

    customer.customerPayments.forEach((pmt) => {
      let settledCredit = Number(pmt.amount);
      let discAmt = 0;

      if (pmt.journalEntry && pmt.journalEntry.lines) {
        // Find AR credit line
        const arLine = pmt.journalEntry.lines.find(
          (l) => Number(l.credit || 0) > 0 && Number(l.debit || 0) === 0
        );
        if (arLine && Number(arLine.credit) >= Number(pmt.amount)) {
          settledCredit = Number(arLine.credit);
          discAmt = Math.round((settledCredit - Number(pmt.amount)) * 100) / 100;
        }
      }

      if (discAmt > 0) {
        totalSettlementDiscounts += discAmt;
      }

      rawEvents.push({
        date: new Date(pmt.paymentDate),
        type: "PAYMENT",
        reference: pmt.receiptNumber,
        description: `Payment Receipt (${pmt.paymentMethod})${
          pmt.referenceNumber ? ` Ref: ${pmt.referenceNumber}` : ""
        }${discAmt > 0 ? ` [Incl. AED ${discAmt.toFixed(2)} Early Settlement Discount]` : ""}`,
        debit: 0,
        credit: settledCredit,
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
        runningBalance: Math.round(running * 100) / 100,
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
    const currentOutstanding = Math.round(
      (totalBilled - totalPaid - totalCredits - totalSettlementDiscounts) * 100
    ) / 100;

    // Self-heal and sync customer.currentBalance with AR ledger
    if (Math.abs(Number(customer.currentBalance) - currentOutstanding) > 0.01) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { currentBalance: currentOutstanding },
      });
      customer.currentBalance = currentOutstanding as any;
    }

    return NextResponse.json({
      customer,
      statement: ledger,
      summary: {
        totalBilled,
        totalPaid,
        totalDiscounts: totalSettlementDiscounts,
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
