import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const groups = await prisma.journalEntryLine.groupBy({
      by: ["accountId"],
      _sum: { debit: true, credit: true },
    });

    const accounts = await prisma.chartOfAccount.findMany({
      where: { id: { in: groups.map((g) => g.accountId) } },
    });

    const rows = groups.map((g) => {
      const acct = accounts.find((a) => a.id === g.accountId);
      return {
        accountId: g.accountId,
        accountName: acct?.accountName || null,
        debit: Number(g._sum.debit || 0),
        credit: Number(g._sum.credit || 0),
      };
    });

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

    return NextResponse.json({ rows, totalDebit, totalCredit });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
