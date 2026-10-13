import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  getAuthUser,
  hasRole,
  unauthorized,
  forbidden,
} from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, "ACCOUNTANT")) return forbidden();

    const [salesInvoices, quotations, journalLines] = await Promise.all([
      prisma.salesInvoice.findMany({
        orderBy: { invoiceDate: "desc" },
        include: {
          customerRel: true,
          createdBy: {
            select: { id: true, fullName: true, email: true, role: true },
          },
          payments: true,
        },
      }),
      prisma.quotation.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
      }),
      prisma.journalEntryLine.findMany({
        where: {
          account: {
            OR: [
              { accountCode: "1200" },
              { accountCode: "1020" },
              { accountName: { contains: "Receivable", mode: "insensitive" } },
            ],
          },
        },
        include: { journalEntry: true, account: true },
      }),
    ]);

    const totalArLedger = journalLines.reduce(
      (sum, l) => sum + Number(l.debit || 0) - Number(l.credit || 0),
      0,
    );

    const now = new Date();

    const invoiceItems = salesInvoices.map((inv) => {
      const invDate = inv.invoiceDate ? new Date(inv.invoiceDate) : now;
      const diffTime = Math.abs(now.getTime() - invDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let agingBucket: "current" | "days30" | "days60" | "days90Plus" =
        "current";
      if (diffDays <= 30) agingBucket = "current";
      else if (diffDays <= 60) agingBucket = "days30";
      else if (diffDays <= 90) agingBucket = "days60";
      else agingBucket = "days90Plus";

      const totalAmount = Number(inv.totalAmount || 0);
      const remainingBalance = Number(inv.remainingBalance ?? inv.totalAmount);
      const paidAmount = Number(inv.paidAmount || 0);

      return {
        id: inv.id,
        reference: inv.invoiceNumber,
        type: "SALES_INVOICE",
        customer: inv.customerName || inv.customerRel?.name || "Client",
        customerEmail: inv.customerRel?.email || "—",
        customerPhone: inv.customerRel?.phone || "—",
        customerTrn: inv.customerTrn || "—",
        project: inv.projectScope || "Commercial Fitout Contract",
        date: invDate.toISOString().slice(0, 10),
        status: inv.status,
        totalAmount,
        paidAmount,
        remainingBalance,
        daysOutstanding: diffDays,
        agingBucket,
        accountCode: "1200",
        accountName: "Accounts Receivable",
        createdByUser: inv.createdBy?.fullName || "Admin User",
        createdUserEmail: inv.createdBy?.email || "admin@agm.ae",
        createdUserRole: inv.createdBy?.role || "ACCOUNTANT",
      };
    });

    const items =
      invoiceItems.length > 0
        ? invoiceItems
        : quotations.map((q) => {
            const qDate = q.createdAt ? new Date(q.createdAt) : now;
            const diffTime = Math.abs(now.getTime() - qDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let agingBucket: "current" | "days30" | "days60" | "days90Plus" =
              "current";
            if (diffDays <= 30) agingBucket = "current";
            else if (diffDays <= 60) agingBucket = "days30";
            else if (diffDays <= 90) agingBucket = "days60";
            else agingBucket = "days90Plus";

            return {
              id: q.id,
              reference: q.quotationNo,
              type: "QUOTATION",
              customer: q.customer || "Valued Client",
              customerEmail: (q as any).email || "—",
              customerPhone: (q as any).mobile || "—",
              customerTrn: (q as any).trn || "—",
              project: (q as any).project || "Commercial Fitout Proposal",
              date: q.date || qDate.toISOString().slice(0, 10),
              status: q.status,
              totalAmount: Number(q.totalAmount || 0),
              paidAmount: 0,
              remainingBalance: Number(q.totalAmount || 0),
              daysOutstanding: diffDays,
              agingBucket,
              accountCode: "1200",
              accountName: "Accounts Receivable",
              createdByUser: q.createdBy?.fullName || "Admin User",
              createdUserEmail: q.createdBy?.email || "admin@agm.ae",
              createdUserRole: q.createdBy?.role || "ACCOUNTANT",
            };
          });

    const totalReceivables = items.reduce((s, i) => s + i.remainingBalance, 0);
    const currentBucket = items
      .filter((i) => i.agingBucket === "current")
      .reduce((s, i) => s + i.remainingBalance, 0);
    const days30Bucket = items
      .filter((i) => i.agingBucket === "days30")
      .reduce((s, i) => s + i.remainingBalance, 0);
    const days60Bucket = items
      .filter((i) => i.agingBucket === "days60")
      .reduce((s, i) => s + i.remainingBalance, 0);
    const days90PlusBucket = items
      .filter((i) => i.agingBucket === "days90Plus")
      .reduce((s, i) => s + i.remainingBalance, 0);

    return NextResponse.json({
      companyName: "AGM FITOUT TECHNICAL SERVICES LLC",
      reportTitle: "Accounts Receivable & Aging Report",
      totalReceivables,
      totalArLedger,
      aging: {
        current: currentBucket,
        days30: days30Bucket,
        days60: days60Bucket,
        days90Plus: days90PlusBucket,
      },
      items,
      count: items.length,
    });
  } catch (error: any) {
    console.error("GET /api/reports/receivables error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate receivables report",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
