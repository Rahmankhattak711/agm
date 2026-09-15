import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Account = Awaited<
  ReturnType<typeof prisma.chartOfAccount.findMany>
>[number];

type ProfitItem = {
  id: string;
  section: string;
  accountCode: string;
  accountName: string;
  amount: number;
  prevAmount?: number;
  variance?: number;
  variancePct?: number;
};

function calculateBalances(
  lines: any[],
  accounts: Account[],
  prevLines: any[] = [],
) {
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

  const prevBalanceMap = new Map<string, number>();
  for (const l of prevLines) {
    const type = l.account?.type;
    const current = prevBalanceMap.get(l.accountId) || 0;
    if (type === "REVENUE") {
      prevBalanceMap.set(
        l.accountId,
        current + Number(l.credit || 0) - Number(l.debit || 0),
      );
    } else if (type === "EXPENSE") {
      prevBalanceMap.set(
        l.accountId,
        current + Number(l.debit || 0) - Number(l.credit || 0),
      );
    }
  }

  const incomeAccounts = accounts.filter((a: Account) => a.type === "REVENUE");
  const expenseAccounts = accounts.filter((a: Account) => a.type === "EXPENSE");

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

  const createItem = (acc: Account, section: string): ProfitItem => {
    const amount = balanceMap.get(acc.id) || 0;
    const prevAmount = prevBalanceMap.get(acc.id) || 0;
    const variance = amount - prevAmount;
    const variancePct =
      prevAmount !== 0
        ? ((amount - prevAmount) / Math.abs(prevAmount)) * 100
        : 0;

    return {
      id: acc.id,
      section,
      accountCode: acc.accountCode,
      accountName: acc.accountName,
      amount,
      prevAmount,
      variance,
      variancePct,
    };
  };

  const incomeItems: ProfitItem[] = incomeAccounts.map((acc: Account) =>
    createItem(acc, "Income"),
  );

  const directExpenseItems: ProfitItem[] = expenseAccounts
    .filter(isDirectExpense)
    .map((acc: Account) => createItem(acc, "Direct Material Expense"));

  const operatingExpenseItems: ProfitItem[] = expenseAccounts
    .filter((acc: Account) => !isDirectExpense(acc))
    .map((acc: Account) => createItem(acc, "Operating Expense"));

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

  const prevTotalIncome = incomeItems.reduce(
    (s, i) => s + (i.prevAmount || 0),
    0,
  );
  const prevTotalDirectExpenses = directExpenseItems.reduce(
    (s, i) => s + (i.prevAmount || 0),
    0,
  );
  const prevGrossProfit = prevTotalIncome - prevTotalDirectExpenses;
  const prevTotalOperatingExpenses = operatingExpenseItems.reduce(
    (s, i) => s + (i.prevAmount || 0),
    0,
  );
  const prevNetProfit = prevGrossProfit - prevTotalOperatingExpenses;

  return {
    income: incomeItems,
    totalIncome,
    prevTotalIncome,
    directExpenses: directExpenseItems,
    totalDirectExpenses,
    prevTotalDirectExpenses,
    grossProfit,
    prevGrossProfit,
    operatingExpenses: operatingExpenseItems,
    totalOperatingExpenses,
    prevTotalOperatingExpenses,
    totalExpenses,
    netProfit,
    prevNetProfit,
    netIncome: netProfit,
    revenue: totalIncome,
    expenses: totalDirectExpenses + totalOperatingExpenses,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "all";
    const customStart = searchParams.get("startDate");
    const customEnd = searchParams.get("endDate");
    const compare = searchParams.get("compare") === "true";

    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let prevStartDate: Date | null = null;
    let prevEndDate: Date | null = null;
    let periodLabel = "All Time";

    if (customStart && customEnd) {
      const sParts = customStart.split("-").map(Number);
      const eParts = customEnd.split("-").map(Number);
      if (sParts.length === 3 && eParts.length === 3) {
        startDate = new Date(
          Date.UTC(sParts[0], sParts[1] - 1, sParts[2], 0, 0, 0, 0),
        );
        endDate = new Date(
          Date.UTC(eParts[0], eParts[1] - 1, eParts[2], 23, 59, 59, 999),
        );
      } else {
        startDate = new Date(customStart);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);
      }

      const durationMs = endDate.getTime() - startDate.getTime();
      prevEndDate = new Date(startDate.getTime() - 1);
      prevStartDate = new Date(prevEndDate.getTime() - durationMs);

      periodLabel = `Custom Range (${customStart} - ${customEnd})`;
    } else if (period === "daily") {
      const targetDate = customStart ? new Date(customStart) : new Date(now);
      startDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        0,
        0,
        0,
      );
      endDate = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        23,
        59,
        59,
      );

      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 1);
      prevEndDate = new Date(endDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);

      periodLabel = `Daily (${startDate.toLocaleDateString("en-GB")})`;
    } else if (period === "weekly") {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        diffToMonday,
        0,
        0,
        0,
      );
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59);

      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 7);
      prevEndDate = new Date(endDate);
      prevEndDate.setDate(prevEndDate.getDate() - 7);

      periodLabel = `Weekly (${startDate.toLocaleDateString("en-GB")} - ${endDate.toLocaleDateString("en-GB")})`;
    } else if (period === "monthly") {
      const year = customStart
        ? new Date(customStart).getFullYear()
        : now.getFullYear();
      const month = customStart
        ? new Date(customStart).getMonth()
        : now.getMonth();
      startDate = new Date(year, month, 1, 0, 0, 0);
      endDate = new Date(year, month + 1, 0, 23, 59, 59);

      prevStartDate = new Date(year, month - 1, 1, 0, 0, 0);
      prevEndDate = new Date(year, month, 0, 23, 59, 59);

      periodLabel = `Monthly (${startDate.toLocaleString("default", { month: "long", year: "numeric" })})`;
    } else if (period === "quarterly" || period === "quarter") {
      const year = customStart
        ? new Date(customStart).getFullYear()
        : now.getFullYear();
      const month = customStart
        ? new Date(customStart).getMonth()
        : now.getMonth();
      const qMonth = Math.floor(month / 3) * 3;
      startDate = new Date(year, qMonth, 1, 0, 0, 0);
      endDate = new Date(year, qMonth + 3, 0, 23, 59, 59);

      const qNum = Math.floor(qMonth / 3) + 1;
      const prevQMonth = qMonth - 3;
      const prevYear = prevQMonth < 0 ? year - 1 : year;
      const normalizedPrevQMonth = (prevQMonth + 12) % 12;
      prevStartDate = new Date(prevYear, normalizedPrevQMonth, 1, 0, 0, 0);
      prevEndDate = new Date(prevYear, normalizedPrevQMonth + 3, 0, 23, 59, 59);

      periodLabel = `Quarter Q${qNum} (${year})`;
    } else if (period === "yearly") {
      const year = customStart
        ? new Date(customStart).getFullYear()
        : now.getFullYear();
      startDate = new Date(year, 0, 1, 0, 0, 0);
      endDate = new Date(year, 11, 31, 23, 59, 59);

      prevStartDate = new Date(year - 1, 0, 1, 0, 0, 0);
      prevEndDate = new Date(year - 1, 11, 31, 23, 59, 59);

      periodLabel = `Yearly / Fiscal Year (${year})`;
    }

    const whereCondition: any = {};
    if (startDate && endDate) {
      whereCondition.journalEntry = {
        entryDate: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    const prevWhereCondition: any = {};
    if (compare && prevStartDate && prevEndDate) {
      prevWhereCondition.journalEntry = {
        entryDate: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      };
    }

    const [accounts, currentLines, prevLines] = await Promise.all([
      prisma.chartOfAccount.findMany({
        orderBy: { accountCode: "asc" },
      }),
      prisma.journalEntryLine.findMany({
        where: whereCondition,
        include: { account: true, journalEntry: true },
      }),
      compare && prevStartDate && prevEndDate
        ? prisma.journalEntryLine.findMany({
            where: prevWhereCondition,
            include: { account: true, journalEntry: true },
          })
        : Promise.resolve([]),
    ]);

    const result = calculateBalances(currentLines, accounts, prevLines);

    return NextResponse.json({
      companyName: "AGM FITOUT TECHNICAL SERVICES LLC",
      reportTitle: "Statement of Profit & Loss",
      period,
      periodLabel,
      startDate: startDate ? startDate.toISOString().split("T")[0] : null,
      endDate: endDate ? endDate.toISOString().split("T")[0] : null,
      prevStartDate: prevStartDate
        ? prevStartDate.toISOString().split("T")[0]
        : null,
      prevEndDate: prevEndDate ? prevEndDate.toISOString().split("T")[0] : null,
      compare,
      ...result,
    });
  } catch (error: any) {
    console.error("GET /api/reports/profit-loss error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
