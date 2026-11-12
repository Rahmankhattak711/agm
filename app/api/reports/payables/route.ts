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

    const [supplierBills, purchaseOrders, journalLines] = await Promise.all([
      prisma.supplierBill.findMany({
        orderBy: { billDate: "desc" },
        include: {
          supplier: true,
          createdBy: {
            select: { id: true, fullName: true, email: true, role: true },
          },
          payments: true,
        },
      }),
      prisma.purchaseOrder.findMany({
        orderBy: { orderDate: "desc" },
        include: {
          items: true,
        },
      }),
      prisma.journalEntryLine.findMany({
        where: {
          account: {
            OR: [
              { accountCode: "2000" },
              { accountCode: "2010" },
              { accountName: { contains: "Payable", mode: "insensitive" } },
            ],
          },
        },
        include: { journalEntry: true, account: true },
      }),
    ]);

    const totalApLedger = journalLines.reduce(
      (sum, l) => sum + Number(l.credit || 0) - Number(l.debit || 0),
      0,
    );

    const now = new Date();

    const billItems = supplierBills.map((b) => {
      const bDate = b.billDate ? new Date(b.billDate) : now;
      const diffTime = Math.abs(now.getTime() - bDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let agingBucket: "current" | "days30" | "days60" | "days90Plus" =
        "current";
      if (diffDays <= 30) agingBucket = "current";
      else if (diffDays <= 60) agingBucket = "days30";
      else if (diffDays <= 90) agingBucket = "days60";
      else agingBucket = "days90Plus";

      const totalAmount = Number(b.totalAmount || 0);
      const remainingBalance = Number(b.remainingBalance ?? b.totalAmount);
      const paidAmount = Number(b.paidAmount || 0);

      return {
        id: b.id,
        poNumber: b.billNumber,
        type: "SUPPLIER_BILL",
        supplierName: b.supplierName || b.supplier?.name || "Vendor",
        supplierTrn: b.supplierTrn || b.supplier?.trn || "—",
        supplierContact: b.supplier?.contactPerson || b.supplier?.phone || "—",
        supplierEmail: b.supplier?.email || "—",
        orderDate: bDate.toISOString().slice(0, 10),
        dueDate: b.dueDate
          ? new Date(b.dueDate).toISOString().slice(0, 10)
          : "—",
        status: b.status,
        totalAmount,
        paidAmount,
        remainingBalance,
        daysOutstanding: diffDays,
        agingBucket,
        accountCode: "2000",
        accountName: "Accounts Payable",
        createdByUser: b.createdBy?.fullName || "Admin User",
        createdUserEmail: b.createdBy?.email || "admin@agm.ae",
        createdUserRole: b.createdBy?.role || "ACCOUNTANT",
      };
    });

    const items =
      billItems.length > 0
        ? billItems
        : purchaseOrders.map((po) => {
            const orderDate = po.orderDate ? new Date(po.orderDate) : now;
            const diffTime = Math.abs(now.getTime() - orderDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let agingBucket: "current" | "days30" | "days60" | "days90Plus" =
              "current";
            if (diffDays <= 30) agingBucket = "current";
            else if (diffDays <= 60) agingBucket = "days30";
            else if (diffDays <= 90) agingBucket = "days60";
            else agingBucket = "days90Plus";

            const totalAmount = Number(po.totalAmount || 0);

            return {
              id: po.id,
              poNumber: po.poNumber,
              type: "PURCHASE_ORDER",
              supplierName: "Registered Vendor",
              supplierTrn: "—",
              supplierContact: "—",
              supplierEmail: "—",
              orderDate: orderDate.toISOString().slice(0, 10),
              dueDate: "—",
              status: po.status,
              totalAmount,
              paidAmount: 0,
              remainingBalance: totalAmount,
              daysOutstanding: diffDays,
              agingBucket,
              accountCode: "2000",
              accountName: "Accounts Payable",
              createdByUser: "Admin User",
              createdUserEmail: "admin@agm.ae",
              createdUserRole: "ACCOUNTANT",
            };
          });

    const totalPayables = items.reduce((s, i) => s + i.remainingBalance, 0);
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
      reportTitle: "Accounts Payable & Aging Report",
      totalPayables,
      totalApLedger,
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
    console.error("GET /api/reports/payables error:", error);
    return NextResponse.json(
      { error: "Failed to generate payables report" },
      { status: 500 },
    );
  }
}
