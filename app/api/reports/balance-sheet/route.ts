import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

type Account = Awaited<
  ReturnType<typeof prisma.chartOfAccount.findMany>
>[number];
type BalanceItem = {
  id: string;
  section: string;
  accountCode: string;
  accountName: string;
  amount: number;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const endDateStr = searchParams.get("endDate") || searchParams.get("asOfDate");

    const whereCondition: any = {};
    if (endDateStr) {
      const eParts = endDateStr.split("-").map(Number);
      if (eParts.length === 3) {
        const endDate = new Date(Date.UTC(eParts[0], eParts[1] - 1, eParts[2], 23, 59, 59, 999));
        whereCondition.journalEntry = { entryDate: { lte: endDate } };
      }
    }

    const [accounts, lines] = await Promise.all([
      prisma.chartOfAccount.findMany({
        orderBy: { accountCode: "asc" },
      }),
      prisma.journalEntryLine.findMany({
        where: whereCondition,
        include: { account: true, journalEntry: true },
      }),
    ]);

    const balanceMap = new Map<string, number>();
    let netRevenue = 0;
    let netExpense = 0;

    for (const l of lines) {
      const type = l.account?.type;
      const current = balanceMap.get(l.accountId) || 0;
      const debit = Number(l.debit || 0);
      const credit = Number(l.credit || 0);

      if (type === "ASSET") {
        balanceMap.set(l.accountId, current + debit - credit);
      } else if (type === "LIABILITY" || type === "EQUITY") {
        balanceMap.set(l.accountId, current + credit - debit);
      } else if (type === "REVENUE") {
        netRevenue += credit - debit;
      } else if (type === "EXPENSE") {
        netExpense += debit - credit;
      }
    }

    const currentYearEarnings = netRevenue - netExpense;

    const assetAccounts = accounts.filter((a: Account) => a.type === "ASSET");
    const liabilityAccounts = accounts.filter(
      (a: Account) => a.type === "LIABILITY",
    );
    const equityAccounts = accounts.filter((a: Account) => a.type === "EQUITY");

    const isFixedAsset = (acc: {
      accountCode: string;
      accountName: string;
    }) => {
      const code = parseInt(acc.accountCode, 10);
      const name = acc.accountName.toLowerCase();
      return (
        (code >= 1500 && code < 2000) ||
        name.includes("car") ||
        name.includes("chair") ||
        name.includes("computer") ||
        name.includes("printer") ||
        name.includes("table") ||
        name.includes("fixed asset") ||
        name.includes("equipment") ||
        name.includes("vehicle")
      );
    };

    const currentAssetItems: BalanceItem[] = assetAccounts
      .filter((acc: Account) => !isFixedAsset(acc))
      .map((acc: Account) => ({
        id: acc.id,
        section: "Current Asset",
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        amount: balanceMap.get(acc.id) || 0,
      }));

    const fixedAssetItems: BalanceItem[] = assetAccounts
      .filter(isFixedAsset)
      .map((acc: Account) => ({
        id: acc.id,
        section: "Fixed Asset",
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        amount: balanceMap.get(acc.id) || 0,
      }));

    const currentLiabilityItems: BalanceItem[] = liabilityAccounts.map(
      (acc: Account) => ({
        id: acc.id,
        section: "Current Liability",
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        amount: balanceMap.get(acc.id) || 0,
      }),
    );

    const equityItems: BalanceItem[] = equityAccounts.map((acc: Account) => {
      let amt = balanceMap.get(acc.id) || 0;
      let section = "Capital";
      if (
        acc.accountCode === "3100" ||
        acc.accountName.toLowerCase().includes("earning") ||
        acc.accountName.toLowerCase().includes("retained")
      ) {
        amt = currentYearEarnings;
        section = "Retained Earnings";
      }
      return {
        id: acc.id,
        section,
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        amount: amt,
      };
    });

    if (
      !equityItems.some((e: BalanceItem) => e.section === "Retained Earnings")
    ) {
      equityItems.push({
        id: "current-year-earnings",
        section: "Retained Earnings",
        accountCode: "3100",
        accountName: "Current Year Earnings",
        amount: currentYearEarnings,
      });
    }

    const totalCurrentAssets = currentAssetItems.reduce(
      (s: number, i: BalanceItem) => s + i.amount,
      0,
    );
    const totalFixedAssets = fixedAssetItems.reduce(
      (s: number, i: BalanceItem) => s + i.amount,
      0,
    );
    const totalAssets = totalCurrentAssets + totalFixedAssets;

    const totalCurrentLiabilities = currentLiabilityItems.reduce(
      (s: number, i: BalanceItem) => s + i.amount,
      0,
    );
    const totalLiabilities = totalCurrentLiabilities;

    const totalEquity = equityItems.reduce(
      (s: number, i: BalanceItem) => s + i.amount,
      0,
    );
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const balanceCheck = totalAssets - totalLiabilitiesAndEquity;
    const balanced = Math.abs(balanceCheck) < 0.01;

    return NextResponse.json({
      companyName: "AGM FITOUT TECHNICAL SERVICES LLC",
      reportTitle: "Balance Sheet",
      currentAssets: currentAssetItems,
      totalCurrentAssets,
      fixedAssets: fixedAssetItems,
      totalFixedAssets,
      totalAssets,
      currentLiabilities: currentLiabilityItems,
      totalCurrentLiabilities,
      totalLiabilities,
      equity: equityItems,
      totalEquity,
      totalLiabilitiesAndEquity,
      balanceCheck,
      balanced,

      assets: totalAssets,
      liabilities: totalLiabilities,
      equityAmount: totalEquity,
    });
  } catch (error: any) {
    console.error("GET /api/reports/balance-sheet error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
