import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const paymentMethod = searchParams.get("paymentMethod");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    const where: any = {};

    if (category && category !== "ALL") {
      where.category = category;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (paymentMethod && paymentMethod !== "ALL") {
      where.paymentMethod = paymentMethod;
    }
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) where.expenseDate.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { expenseNumber: { contains: search, mode: "insensitive" } },
        { payee: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
      ];
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        expenseAccount: {
          select: { id: true, accountCode: true, accountName: true },
        },
        paymentAccount: {
          select: { id: true, accountCode: true, accountName: true },
        },
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
        journalEntry: {
          select: { id: true, entryNumber: true, isPosted: true },
        },
      },
      orderBy: { expenseDate: "desc" },
    });

    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.totalAmount), 0);
    const totalTax = expenses.reduce((sum, e) => sum + Number(e.taxAmount || 0), 0);

    return NextResponse.json({
      expenses,
      summary: {
        totalAmount,
        totalTax,
        count: expenses.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses", details: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return unauthorized();
    }

    const body = await req.json();
    const {
      expenseDate,
      category,
      payee,
      description,
      amount,
      taxAmount = 0,
      paymentMethod = "BANK_TRANSFER",
      reference,
      receiptUrl,
      expenseAccountId,
      paymentAccountId,
      status = "PAID",
      createJournal = true,
    } = body;

    if (!category || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "Category and valid amount are required" },
        { status: 400 },
      );
    }

    const numAmount = Number(amount);
    const numTax = Number(taxAmount || 0);
    const totalAmount = numAmount + numTax;

    const expenseCount = await prisma.expense.count();
    const expenseNumber = `EXP-${new Date().getFullYear()}-${String(
      expenseCount + 1,
    ).padStart(5, "0")}`;

    // Execute in transaction
    const result = await prisma.$transaction(async (tx) => {
      let journalEntryId: string | null = null;

      // Create balanced Journal Entry if requested & accounts are provided
      if (createJournal && expenseAccountId && paymentAccountId) {
        const entryCount = await tx.journalEntry.count();
        const entryNumber = `JE-${new Date().getFullYear()}-${String(
          entryCount + 1,
        ).padStart(5, "0")}`;

        const lines: any[] = [
          {
            accountId: expenseAccountId,
            debit: numAmount,
            credit: 0,
          },
          {
            accountId: paymentAccountId,
            debit: 0,
            credit: totalAmount,
          },
        ];

        // If tax is involved, record tax line (VAT Input)
        if (numTax > 0) {
          const vatInputAccount = await tx.chartOfAccount.findFirst({
            where: { accountCode: "2200" },
          });
          if (vatInputAccount) {
            lines.splice(1, 0, {
              accountId: vatInputAccount.id,
              debit: numTax,
              credit: 0,
            });
          }
        }

        const journal = await tx.journalEntry.create({
          data: {
            entryNumber,
            entryDate: expenseDate ? new Date(expenseDate) : new Date(),
            description: `Expense: ${category} - ${payee || description || "Direct Claim"}`,
            reference: reference || expenseNumber,
            isPosted: true,
            createdBy: user.id,
            lines: {
              create: lines,
            },
          },
        });

        journalEntryId = journal.id;
      }

      const expense = await tx.expense.create({
        data: {
          expenseNumber,
          expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
          category,
          payee: payee || null,
          description: description || null,
          amount: numAmount,
          taxAmount: numTax,
          totalAmount,
          paymentMethod,
          reference: reference || null,
          receiptUrl: receiptUrl || null,
          status,
          expenseAccountId: expenseAccountId || null,
          paymentAccountId: paymentAccountId || null,
          createdById: user.id,
          journalEntryId,
        },
        include: {
          expenseAccount: true,
          paymentAccount: true,
          createdBy: { select: { id: true, fullName: true } },
          journalEntry: true,
        },
      });

      return expense;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense", details: error.message },
      { status: 500 },
    );
  }
}
