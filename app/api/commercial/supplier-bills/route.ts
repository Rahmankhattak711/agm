import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { postSupplierBillJournalEntry } from "@/lib/commercial-accounting";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const bills = await prisma.supplierBill.findMany({
      where: {
        AND: [
          status && status !== "ALL" ? { status: status as any } : {},
          search
            ? {
                OR: [
                  { billNumber: { contains: search, mode: "insensitive" } },
                  { supplierName: { contains: search, mode: "insensitive" } },
                  { supplierTrn: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      include: {
        supplier: true,
        purchaseOrder: true,
        goodsReceipt: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
        debitNotes: true,
        journalEntry: {
          include: {
            lines: {
              include: {
                account: true,
              },
            },
          },
        },
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

    return NextResponse.json(bills);
  } catch (error: any) {
    console.error("GET /api/commercial/supplier-bills error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch supplier bills" },
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
        "INVENTORY_MANAGER",
      ])
    ) {
      return forbidden();
    }

    const body = await request.json();
    const {
      billNumber,
      supplierId,
      supplierName,
      supplierTrn,
      purchaseOrderId,
      goodsReceiptId,
      billDate,
      dueDate,
      items = [],
      discount = 0,
      autoPost = false,
    } = body;

    if (!supplierId && !supplierName) {
      return NextResponse.json(
        { error: "Supplier is required" },
        { status: 400 },
      );
    }

    let supName = supplierName;
    let supTrn = supplierTrn;
    if (supplierId) {
      const s = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (s) {
        if (!supName) supName = s.name;
        if (!supTrn) supTrn = s.trn;
      }
    }

    let bNo = billNumber;
    if (!bNo) {
      const count = await prisma.supplierBill.count();
      bNo = `BILL-2026-${(count + 1).toString().padStart(4, "0")}`;
    }

    let subtotal = 0;
    const formattedItems = items.map((item: any) => {
      const qty = parseFloat(item.quantity) || 1;
      const cost = parseFloat(item.unitCost || item.unitPrice) || 0;
      const total = qty * cost;
      subtotal += total;

      return {
        productId: item.productId || null,
        description: item.description || "Procured materials / service",
        quantity: qty,
        unit: item.unit || "PCS",
        unitCost: cost,
        totalAmount: total,
      };
    });

    const discTotal = parseFloat(discount) || 0;
    const netSubtotal = Math.max(0, subtotal - discTotal);
    const vatRate = 5.0;
    const vatAmount = (netSubtotal * vatRate) / 100;
    const totalAmount = netSubtotal + vatAmount;

    const bDate = billDate ? new Date(billDate) : new Date();

    const bill = await prisma.supplierBill.create({
      data: {
        billNumber: bNo,
        supplierId: supplierId || null,
        supplierName: supName || "Vendor",
        supplierTrn: supTrn || null,
        purchaseOrderId: purchaseOrderId || null,
        goodsReceiptId: goodsReceiptId || null,
        billDate: bDate,
        dueDate: dueDate
          ? new Date(dueDate)
          : new Date(bDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: autoPost ? "POSTED" : "DRAFT",
        subtotal: netSubtotal,
        discount: discTotal,
        vatRate,
        vatAmount,
        totalAmount,
        paidAmount: 0,
        remainingBalance: totalAmount,
        createdById: authUser.id,
        items: {
          create: formattedItems,
        },
      },
      include: {
        items: true,
        supplier: true,
      },
    });

    if (autoPost) {
      const je = await postSupplierBillJournalEntry({
        billId: bill.id,
        billNumber: bill.billNumber,
        billDate: bDate,
        supplierName: bill.supplierName,
        subtotal: netSubtotal,
        vatAmount,
        totalAmount,
        userId: authUser.id,
      });

      await prisma.supplierBill.update({
        where: { id: bill.id },
        data: {
          journalEntryId: je.id,
          postedAt: new Date(),
        },
      });
    }

    return NextResponse.json(bill, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/commercial/supplier-bills error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create supplier bill" },
      { status: 500 },
    );
  }
}
