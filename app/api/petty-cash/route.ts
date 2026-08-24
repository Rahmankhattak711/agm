import {
  forbidden,
  getAuthUser,
  hasRole,
  unauthorized,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

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
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

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

    const shouldApprove = Boolean(isApproved);
    if (shouldApprove && !hasRole(authUser, "ACCOUNTANT")) {
      return forbidden(
        "Forbidden: Only Accountants and Admins can approve petty cash vouchers",
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
        approvedBy: shouldApprove ? authUser.id : null,
        isApproved: shouldApprove,
        approvedAt: shouldApprove ? new Date() : null,
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
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const body = await request.json();
    const {
      id,
      isApproved,
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

    const existing = await prisma.pettyCashTransaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Petty cash transaction not found" },
        { status: 404 },
      );
    }

    const isApprovalChange = isApproved !== undefined;
    if (isApprovalChange && !hasRole(authUser, "ACCOUNTANT")) {
      return forbidden(
        "Forbidden: Only Accountants and Admins can approve or reject petty cash vouchers",
      );
    }

    const dataToUpdate: any = {};

    if (isApproved !== undefined) {
      dataToUpdate.isApproved = Boolean(isApproved);
      dataToUpdate.approvedAt = isApproved ? new Date() : null;
      dataToUpdate.approvedBy = isApproved ? authUser.id : null;
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
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    if (!hasRole(authUser, "ACCOUNTANT")) {
      return forbidden(
        "Forbidden: Only Accountants and Admins can delete petty cash vouchers",
      );
    }

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
