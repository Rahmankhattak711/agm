import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return unauthorized();
    }

    const { id } = await params;
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        expenseAccount: true,
        paymentAccount: true,
        createdBy: { select: { id: true, fullName: true, email: true } },
        journalEntry: {
          include: {
            lines: {
              include: { account: true },
            },
          },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch expense", details: error.message },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return unauthorized();
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (body.category !== undefined) updateData.category = body.category;
    if (body.payee !== undefined) updateData.payee = body.payee;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
    if (body.reference !== undefined) updateData.reference = body.reference;
    if (body.receiptUrl !== undefined) updateData.receiptUrl = body.receiptUrl;
    if (body.expenseAccountId !== undefined) updateData.expenseAccountId = body.expenseAccountId;
    if (body.paymentAccountId !== undefined) updateData.paymentAccountId = body.paymentAccountId;
    if (body.expenseDate !== undefined) updateData.expenseDate = new Date(body.expenseDate);

    if (body.amount !== undefined || body.taxAmount !== undefined) {
      const amount = body.amount !== undefined ? Number(body.amount) : Number(existing.amount);
      const taxAmount = body.taxAmount !== undefined ? Number(body.taxAmount) : Number(existing.taxAmount);
      updateData.amount = amount;
      updateData.taxAmount = taxAmount;
      updateData.totalAmount = amount + taxAmount;
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        expenseAccount: true,
        paymentAccount: true,
        createdBy: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update expense", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return unauthorized();
    }

    const { id } = await params;
    const existing = await prisma.expense.findUnique({
      where: { id },
      select: { id: true, journalEntryId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.expense.delete({ where: { id } });
      if (existing.journalEntryId) {
        await tx.journalEntry.delete({ where: { id: existing.journalEntryId } }).catch(() => {});
      }
    });

    return NextResponse.json({ success: true, message: "Expense deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete expense", details: error.message },
      { status: 500 },
    );
  }
}
