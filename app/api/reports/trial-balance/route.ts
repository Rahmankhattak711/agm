import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

type Account = Awaited<ReturnType<typeof prisma.chartOfAccount.findMany>>[number];
type TrialRow = { accountId: string; accountCode: string; accountName: string; type: string; debit: number; credit: number; netBalance: number };

export async function GET() {
  try {
    const [accounts, groups] = await Promise.all([
      prisma.chartOfAccount.findMany({
        orderBy: { accountCode: "asc" },
      }),
      prisma.journalEntryLine.groupBy({
        by: ["accountId"],
        _sum: { debit: true, credit: true },
      }),
    ]);

    const groupMap = new Map<string, { debit: number; credit: number }>();
    for (const g of groups) {
      groupMap.set(g.accountId, {
        debit: Number(g._sum.debit || 0),
        credit: Number(g._sum.credit || 0),
      });
    }

    const rows: TrialRow[] = accounts.map((acct: Account) => {
      const g = groupMap.get(acct.id) || { debit: 0, credit: 0 };
      return {
        accountId: acct.id,
        accountCode: acct.accountCode,
        accountName: acct.accountName,
        type: acct.type,
        debit: g.debit,
        credit: g.credit,
        netBalance:
          acct.type === "ASSET" || acct.type === "EXPENSE"
            ? g.debit - g.credit
            : g.credit - g.debit,
      };
    });

    const totalDebit = rows.reduce((s: number, r: TrialRow) => s + r.debit, 0);
    const totalCredit = rows.reduce((s: number, r: TrialRow) => s + r.credit, 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01;

    return NextResponse.json({
      rows,
      totalDebit,
      totalCredit,
      difference,
      isBalanced,
    });
  } catch (error: any) {
    console.error("GET /api/reports/trial-balance error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
