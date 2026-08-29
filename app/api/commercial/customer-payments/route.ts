import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { postCustomerPaymentJournalEntry } from "@/lib/commercial-accounting";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const payments = await prisma.customerPayment.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { receiptNumber: { contains: search, mode: "insensitive" } },
                  { customerName: { contains: search, mode: "insensitive" } },
                  { referenceNumber: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      include: {
        customerRel: true,
        salesInvoice: true,
        journalEntry: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error: any) {
    console.error("GET /api/commercial/customer-payments error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch customer payments" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (
      !hasRole(authUser, [
        "SUPER_ADMIN",
        "ADMIN",
        "ACCOUNTANT",
      ])
    ) {
      return forbidden();
    }

    const body = await request.json();
    const {
      receiptNumber,
      customerId,
      customerName,
      salesInvoiceId,
      paymentDate,
      amount,
      paymentMethod = "BANK_TRANSFER",
      referenceNumber,
      notes,
    } = body;

    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) {
      return NextResponse.json(
        { error: "Valid payment amount is required" },
        { status: 400 },
      );
    }

    let custId = customerId;
    let custName = customerName;
    let invNumber = "";

    // If linked to an invoice, fetch invoice details
    if (salesInvoiceId) {
      const invoice = await prisma.salesInvoice.findUnique({
        where: { id: salesInvoiceId },
      });
      if (invoice) {
        invNumber = invoice.invoiceNumber;
        if (!custId) custId = invoice.customerId;
        if (!custName) custName = invoice.customerName;
      }
    }

    if (!custName && custId) {
      const c = await prisma.customer.findUnique({ where: { id: custId } });
      if (c) custName = c.name;
    }

    // Auto-generate receipt number
    let recNo = receiptNumber;
    if (!recNo) {
      const count = await prisma.customerPayment.count();
      recNo = `REC-2026-${(count + 1).toString().padStart(4, "0")}`;
    }

    const pmtDate = paymentDate ? new Date(paymentDate) : new Date();

    // 1. Create General Ledger Entry
    const je = await postCustomerPaymentJournalEntry({
      paymentId: "",
      receiptNumber: recNo,
      paymentDate: pmtDate,
      customerName: custName || "Customer",
      amount: payAmount,
      paymentMethod,
      invoiceNumber: invNumber,
      userId: authUser.id,
    });

    // 2. Create Payment Record
    const payment = await prisma.customerPayment.create({
      data: {
        receiptNumber: recNo,
        customerId: custId || null,
        customerName: custName || "Valued Customer",
        salesInvoiceId: salesInvoiceId || null,
        paymentDate: pmtDate,
        amount: payAmount,
        paymentMethod: paymentMethod as any,
        referenceNumber,
        notes,
        journalEntryId: je.id,
        createdById: authUser.id,
      },
      include: {
        salesInvoice: true,
        customerRel: true,
      },
    });

    // 3. Update Invoice Balance if attached
    if (salesInvoiceId) {
      const invoice = await prisma.salesInvoice.findUnique({
        where: { id: salesInvoiceId },
      });
      if (invoice) {
        const newPaid = Number(invoice.paidAmount) + payAmount;
        const newRem = Math.max(0, Number(invoice.totalAmount) - newPaid);
        const newStatus =
          newRem <= 0
            ? "PAID"
            : newPaid > 0
            ? "PARTIALLY_PAID"
            : invoice.status;

        await prisma.salesInvoice.update({
          where: { id: salesInvoiceId },
          data: {
            paidAmount: newPaid,
            remainingBalance: newRem,
            status: newStatus as any,
          },
        });
      }
    }

    // 4. Update Customer Balance
    if (custId) {
      await prisma.customer.update({
        where: { id: custId },
        data: {
          currentBalance: { decrement: payAmount },
        },
      });
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/commercial/customer-payments error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record customer payment" },
      { status: 500 },
    );
  }
}
