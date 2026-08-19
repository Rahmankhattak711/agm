import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [accounts, lines] = await Promise.all([
      prisma.chartOfAccount.findMany({
        orderBy: { accountCode: "asc" },
      }),
      prisma.journalEntryLine.findMany({
        include: { account: true },
      }),
    ]);

    const balanceMap = new Map<string, number>();
    for (const l of lines) {
      const type = l.account?.type;
      const current = balanceMap.get(l.accountId) || 0;
      if (type === "REVENUE") {
        balanceMap.set(
          l.accountId,
          current + Number(l.credit || 0) - Number(l.debit || 0),
        );
      } else if (type === "EXPENSE") {
        balanceMap.set(
          l.accountId,
          current + Number(l.debit || 0) - Number(l.credit || 0),
        );
      }
    }

    const incomeAccounts = accounts.filter((a) => a.type === "REVENUE");
    const expenseAccounts = accounts.filter((a) => a.type === "EXPENSE");

    const isDirectExpense = (acc: {
      accountCode: string;
      accountName: string;
    }) => {
      const name = acc.accountName.toLowerCase();
      return (
        acc.accountCode === "5010" ||
        name.includes("purchase material") ||
        name.includes("direct material") ||
        name.includes("direct expense") ||
        name.includes("cogs") ||
        name.includes("cost of goods")
      );
    };

    const incomeItems = incomeAccounts.map((acc) => ({
      id: acc.id,
      section: "Income",
      accountCode: acc.accountCode,
      accountName: acc.accountName,
      amount: balanceMap.get(acc.id) || 0,
    }));

    const directExpenseItems = expenseAccounts
      .filter(isDirectExpense)
      .map((acc) => ({
        id: acc.id,
        section: "Direct Material Expense",
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        amount: balanceMap.get(acc.id) || 0,
      }));

    const operatingExpenseItems = expenseAccounts
      .filter((acc) => !isDirectExpense(acc))
      .map((acc) => ({
        id: acc.id,
        section: "Operating Expense",
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        amount: balanceMap.get(acc.id) || 0,
      }));

    const totalIncome = incomeItems.reduce((s, i) => s + i.amount, 0);
    const totalDirectExpenses = directExpenseItems.reduce(
      (s, i) => s + i.amount,
      0,
    );
    const grossProfit = totalIncome - totalDirectExpenses;
    const totalOperatingExpenses = operatingExpenseItems.reduce(
      (s, i) => s + i.amount,
      0,
    );
    const totalExpenses = totalOperatingExpenses;
    const netProfit = grossProfit - totalOperatingExpenses;

    return NextResponse.json({
      companyName: "AGM FITOUT TECHNICAL SERVICES LLC",
      reportTitle: "Profit & Loss",
      income: incomeItems,
      totalIncome,
      directExpenses: directExpenseItems,
      totalDirectExpenses,
      grossProfit,
      operatingExpenses: operatingExpenseItems,
      totalOperatingExpenses,
      totalExpenses,
      netProfit,
      netIncome: netProfit,
      revenue: totalIncome,
      expenses: totalDirectExpenses + totalOperatingExpenses,
    });
  } catch (error: any) {
    console.error("GET /api/reports/profit-loss error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
