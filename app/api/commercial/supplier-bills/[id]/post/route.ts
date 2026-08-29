import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { postSupplierBillJournalEntry } from "@/lib/commercial-accounting";
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

    const bill = await prisma.supplierBill.findUnique({
      where: { id },
    });

    if (!bill) {
      return NextResponse.json(
        { error: "Supplier bill not found" },
        { status: 404 },
      );
    }

    if (bill.status === "POSTED" || bill.status === "PAID") {
      return NextResponse.json(
        { error: "Bill is already posted" },
        { status: 400 },
      );
    }

    const je = await postSupplierBillJournalEntry({
      billId: bill.id,
      billNumber: bill.billNumber,
      billDate: bill.billDate,
      supplierName: bill.supplierName,
      subtotal: Number(bill.subtotal),
      vatAmount: Number(bill.vatAmount),
      totalAmount: Number(bill.totalAmount),
      userId: authUser.id,
    });

    const updated = await prisma.supplierBill.update({
      where: { id },
      data: {
        status: "POSTED",
        journalEntryId: je.id,
        postedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      bill: updated,
      journalEntryId: je.id,
    });
  } catch (error: any) {
    console.error("POST post supplier bill error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to post supplier bill" },
      { status: 500 },
    );
  }
}
