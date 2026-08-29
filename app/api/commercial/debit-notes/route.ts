import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { postDebitNoteJournalEntry } from "@/lib/commercial-accounting";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const debitNotes = await prisma.debitNote.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { debitNoteNumber: { contains: search, mode: "insensitive" } },
                  { supplier: { name: { contains: search, mode: "insensitive" } } },
                  { reason: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      include: {
        supplier: true,
        supplierBill: true,
        purchaseOrder: true,
        items: true,
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

    return NextResponse.json(debitNotes);
  } catch (error: any) {
    console.error("GET /api/commercial/debit-notes error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch debit notes" },
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
      debitNoteNumber,
      supplierId,
      supplierName,
      supplierBillId,
      purchaseOrderId,
      returnDate,
      reason,
      items = [],
      subtotal = 0,
      vatAmount = 0,
      totalAmount = 0,
      autoPost = true,
    } = body;

    let supId = supplierId;
    let supName = supplierName;

    if (supplierBillId && !supId) {
      const bill = await prisma.supplierBill.findUnique({
        where: { id: supplierBillId },
      });
      if (bill) {
        supId = bill.supplierId;
        if (!supName) supName = bill.supplierName;
      }
    }

    if (!supName && supId) {
      const s = await prisma.supplier.findUnique({ where: { id: supId } });
      if (s) supName = s.name;
    }

    let dnNo = debitNoteNumber;
    if (!dnNo) {
      const count = await prisma.debitNote.count();
      dnNo = `DN-2026-${(count + 1).toString().padStart(4, "0")}`;
    }

    const netSub = parseFloat(subtotal) || 0;
    const netVat = parseFloat(vatAmount) || netSub * 0.05;
    const netTot = parseFloat(totalAmount) || netSub + netVat;
    const retDate = returnDate ? new Date(returnDate) : new Date();

    let journalEntryId: string | null = null;
    if (autoPost) {
      const je = await postDebitNoteJournalEntry({
        debitNoteId: "",
        debitNoteNumber: dnNo,
        returnDate: retDate,
        supplierName: supName || "Vendor",
        subtotal: netSub,
        vatAmount: netVat,
        totalAmount: netTot,
        userId: authUser.id,
      });
      journalEntryId = je.id;
    }

    const debitNote = await prisma.debitNote.create({
      data: {
        debitNoteNumber: dnNo,
        supplierId: supId || null,
        supplierBillId: supplierBillId || null,
        purchaseOrderId: purchaseOrderId || null,
        returnDate: retDate,
        reason: reason || "Damaged material / Defective batch return",
        subtotal: netSub,
        vatAmount: netVat,
        totalAmount: netTot,
        status: autoPost ? "POSTED" : "DRAFT",
        journalEntryId,
        createdById: authUser.id,
        items: {
          create: items.map((i: any) => ({
            description: i.description || "Returned item",
            quantity: parseFloat(i.quantity) || 1,
            unitCost: parseFloat(i.unitCost || i.unitPrice) || 0,
            totalAmount:
              (parseFloat(i.quantity) || 1) *
              (parseFloat(i.unitCost || i.unitPrice) || 0),
          })),
        },
      },
      include: {
        items: true,
        supplier: true,
        supplierBill: true,
      },
    });

    return NextResponse.json(debitNote, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/commercial/debit-notes error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create debit note" },
      { status: 500 },
    );
  }
}
