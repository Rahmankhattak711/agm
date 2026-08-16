import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const lines = await prisma.journalEntryLine.findMany({
      include: { account: true },
    });

    let assets = 0;
    let liabilities = 0;
    let equity = 0;

    for (const l of lines) {
      const type = (l as any).account?.type;
      const amount = Number(l.debit || 0) - Number(l.credit || 0);
      if (type === "ASSET") assets += amount;
      if (type === "LIABILITY") liabilities += amount;
      if (type === "EQUITY") equity += amount;
    }

    return NextResponse.json({
      assets,
      liabilities,
      equity,
      balanced: Math.abs(assets - (liabilities + equity)) < 0.01,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
