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

    const { updated, je } = await prisma.$transaction(async (tx) => {
      const lockRes = await tx.supplierBill.updateMany({
        where: { id, status: "DRAFT" },
        data: { status: "POSTED", postedAt: new Date() },
      });

      if (lockRes.count === 0) {
        const recheck = await tx.supplierBill.findUnique({ where: { id } });
        if (recheck?.status === "POSTED" || recheck?.status === "PAID") {
          throw new Error("Bill is already posted");
        }
        throw new Error("Concurrency conflict: Bill was modified concurrently");
      }

      const journalEntry = await postSupplierBillJournalEntry(
        {
          billId: bill.id,
          billNumber: bill.billNumber,
          billDate: bill.billDate,
          supplierName: bill.supplierName,
          subtotal: Number(bill.subtotal),
          vatAmount: Number(bill.vatAmount),
          totalAmount: Number(bill.totalAmount),
          userId: authUser.id,
        },
        tx
      );

      const upd = await tx.supplierBill.update({
        where: { id },
        data: {
          journalEntryId: journalEntry.id,
        },
      });

      return { updated: upd, je: journalEntry };
    });

    return NextResponse.json({
      success: true,
      bill: updated,
      journalEntryId: je.id,
    });
  } catch (error: any) {
    console.error("POST post supplier bill error:", error);
    return NextResponse.json(
      { error: "Failed to post supplier bill" },
      { status: 500 },
    );
  }
}
