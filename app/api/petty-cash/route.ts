import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rows = await prisma.pettyCashTransaction.findMany({
      orderBy: { transactionDate: "desc" },
      include: {
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        account: {
          select: {
            id: true,
            accountCode: true,
            accountName: true,
          },
        },
      },
    });
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      transactionDate,
      voucherNumber,
      category,
      categoryType = "OPERATIONAL_EXPENSE",
      amount,
      transactionType,
      receiptImageUrl,
      notes,
      accountId,
      approvedBy,
      isApproved = false,
    } = body;

    if (
      !transactionDate ||
      !voucherNumber ||
      !category ||
      !amount ||
      !transactionType
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const created = await prisma.pettyCashTransaction.create({
      data: {
        transactionDate: new Date(transactionDate),
        voucherNumber,
        category,
        categoryType,
        amount: Number(amount),
        transactionType,
        receiptImageUrl: receiptImageUrl || null,
        notes: notes || null,
        accountId: accountId || null,
        approvedBy: approvedBy || null,
        isApproved: Boolean(isApproved),
        approvedAt: isApproved ? new Date() : null,
      },
      include: {
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      isApproved,
      approvedBy,
      category,
      categoryType,
      amount,
      transactionType,
      receiptImageUrl,
      notes,
      transactionDate,
      voucherNumber,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Voucher ID is required" },
        { status: 400 },
      );
    }

    const dataToUpdate: any = {};

    if (isApproved !== undefined) {
      dataToUpdate.isApproved = Boolean(isApproved);
      dataToUpdate.approvedAt = isApproved ? new Date() : null;
      if (approvedBy !== undefined) {
        dataToUpdate.approvedBy = approvedBy || null;
      }
    }

    if (category !== undefined) dataToUpdate.category = category;
    if (categoryType !== undefined) dataToUpdate.categoryType = categoryType;
    if (amount !== undefined) dataToUpdate.amount = Number(amount);
    if (transactionType !== undefined)
      dataToUpdate.transactionType = transactionType;
    if (receiptImageUrl !== undefined)
      dataToUpdate.receiptImageUrl = receiptImageUrl || null;
    if (notes !== undefined) dataToUpdate.notes = notes || null;
    if (transactionDate !== undefined)
      dataToUpdate.transactionDate = new Date(transactionDate);
    if (voucherNumber !== undefined) dataToUpdate.voucherNumber = voucherNumber;

    const updated = await prisma.pettyCashTransaction.update({
      where: { id },
      data: dataToUpdate,
      include: {
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paramId = searchParams.get("id");
    let id = paramId;

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json(
        { error: "Voucher ID is required" },
        { status: 400 },
      );
    }

    await prisma.pettyCashTransaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Voucher deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
