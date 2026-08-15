import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      transactionDate,
      voucherNumber,
      category,
      amount,
      transactionType,
      receiptImageUrl,
      approvedBy,
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
        amount: Number(amount),
        transactionType,
        receiptImageUrl,
        approvedBy: approvedBy || null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const rows = await prisma.pettyCashTransaction.findMany({
      orderBy: { transactionDate: "desc" },
    });
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
