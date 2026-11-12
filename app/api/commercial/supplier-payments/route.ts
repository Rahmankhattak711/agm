import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { postSupplierPaymentJournalEntry } from "@/lib/commercial-accounting";
import { getNextPaymentNumber } from "@/lib/utils/sequence";
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
      { error: "Failed to fetch supplier payments" },
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

    const pmtDate = paymentDate ? new Date(paymentDate) : new Date();

    const payment = await prisma.$transaction(async (tx) => {
      let supId = supplierId;
      let supName = supplierName;
      let billNo = "";
      let currentBill: any = null;

      if (supplierBillId) {
        currentBill = await tx.supplierBill.findUnique({
          where: { id: supplierBillId },
        });
        if (currentBill) {
          billNo = currentBill.billNumber;
          if (!supId) supId = currentBill.supplierId;
          if (!supName) supName = currentBill.supplierName;
        }
      }

      if (!supName && supId) {
        const s = await tx.supplier.findUnique({ where: { id: supId } });
        if (s) supName = s.name;
      }

      let pmtNo = paymentNumber;
      if (!pmtNo) {
        pmtNo = await getNextPaymentNumber(tx);
      }

      const je = await postSupplierPaymentJournalEntry(
        {
          paymentId: "",
          paymentNumber: pmtNo,
          paymentDate: pmtDate,
          supplierName: supName || "Vendor",
          amount: payAmount,
          paymentMethod,
          billNumber: billNo,
          userId: authUser.id,
        },
        tx
      );

      const createdPayment = await tx.supplierPayment.create({
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

      if (currentBill) {
        const newPaid = Number(currentBill.paidAmount) + payAmount;
        const newRem = Math.max(0, Number(currentBill.totalAmount) - newPaid);
        const newStatus =
          newRem <= 0 ? "PAID" : newPaid > 0 ? "PARTIALLY_PAID" : currentBill.status;

        const updateRes = await tx.supplierBill.updateMany({
          where: {
            id: supplierBillId,
            paidAmount: currentBill.paidAmount,
          },
          data: {
            paidAmount: newPaid,
            remainingBalance: newRem,
            status: newStatus as any,
          },
        });

        if (updateRes.count === 0) {
          throw new Error("Concurrency conflict: Supplier bill was modified concurrently. Please retry.");
        }
      }

      return createdPayment;
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/commercial/supplier-payments error:", error);
    return NextResponse.json(
      { error: "Failed to record supplier payment" },
      { status: 500 },
    );
  }
}
