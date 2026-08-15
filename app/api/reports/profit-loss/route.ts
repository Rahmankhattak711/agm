import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const lines = await prisma.journalEntryLine.findMany({
      include: { account: true },
    });

    let revenue = 0;
    let expenses = 0;

    for (const l of lines) {
      const type = (l as any).account?.type;
      if (type === "REVENUE")
        revenue += Number(l.credit || 0) - Number(l.debit || 0);
      if (type === "EXPENSE")
        expenses += Number(l.debit || 0) - Number(l.credit || 0);
    }

    const netIncome = revenue - expenses;

    return NextResponse.json({ revenue, expenses, netIncome });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
