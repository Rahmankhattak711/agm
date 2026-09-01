import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { postSupplierPaymentJournalEntry } from "@/lib/commercial-accounting";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const payments = await prisma.supplierPayment.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { paymentNumber: { contains: search, mode: "insensitive" } },
                  { supplierName: { contains: search, mode: "insensitive" } },
                  {
                    referenceNumber: { contains: search, mode: "insensitive" },
                  },
                ],
              }
            : {},
        ],
      },
      include: {
        supplier: true,
        supplierBill: true,
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
    console.error("GET /api/commercial/supplier-payments error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch supplier payments" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"])) {
      return forbidden();
    }

    const body = await request.json();
    const {
      paymentNumber,
      supplierId,
      supplierName,
      supplierBillId,
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

    let supId = supplierId;
    let supName = supplierName;
    let billNo = "";

    if (supplierBillId) {
      const bill = await prisma.supplierBill.findUnique({
        where: { id: supplierBillId },
      });
      if (bill) {
        billNo = bill.billNumber;
        if (!supId) supId = bill.supplierId;
        if (!supName) supName = bill.supplierName;
      }
    }

    if (!supName && supId) {
      const s = await prisma.supplier.findUnique({ where: { id: supId } });
      if (s) supName = s.name;
    }

    let pmtNo = paymentNumber;
    if (!pmtNo) {
      const count = await prisma.supplierPayment.count();
      pmtNo = `SP-2026-${(count + 1).toString().padStart(4, "0")}`;
    }

    const pmtDate = paymentDate ? new Date(paymentDate) : new Date();

    const je = await postSupplierPaymentJournalEntry({
      paymentId: "",
      paymentNumber: pmtNo,
      paymentDate: pmtDate,
      supplierName: supName || "Vendor",
      amount: payAmount,
      paymentMethod,
      billNumber: billNo,
      userId: authUser.id,
    });

    const payment = await prisma.supplierPayment.create({
      data: {
        paymentNumber: pmtNo,
        supplierId: supId || null,
        supplierName: supName || "Vendor",
        supplierBillId: supplierBillId || null,
        paymentDate: pmtDate,
        amount: payAmount,
        paymentMethod: paymentMethod as any,
        referenceNumber,
        notes,
        journalEntryId: je.id,
        createdById: authUser.id,
      },
      include: {
        supplierBill: true,
        supplier: true,
      },
    });

    if (supplierBillId) {
      const bill = await prisma.supplierBill.findUnique({
        where: { id: supplierBillId },
      });
      if (bill) {
        const newPaid = Number(bill.paidAmount) + payAmount;
        const newRem = Math.max(0, Number(bill.totalAmount) - newPaid);
        const newStatus =
          newRem <= 0 ? "PAID" : newPaid > 0 ? "PARTIALLY_PAID" : bill.status;

        await prisma.supplierBill.update({
          where: { id: supplierBillId },
          data: {
            paidAmount: newPaid,
            remainingBalance: newRem,
            status: newStatus as any,
          },
        });
      }
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/commercial/supplier-payments error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record supplier payment" },
      { status: 500 },
    );
  }
}
