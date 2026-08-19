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

    // Aggregate balances for each account
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

    const assetAccounts = accounts.filter((a) => a.type === "ASSET");
    const liabilityAccounts = accounts.filter((a) => a.type === "LIABILITY");
    const equityAccounts = accounts.filter((a) => a.type === "EQUITY");

    const isFixedAsset = (acc: { accountCode: string; accountName: string }) => {
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

    // Current Assets
    const currentAssetItems = assetAccounts
      .filter((acc) => !isFixedAsset(acc))
      .map((acc) => ({
        id: acc.id,
        section: "Current Asset",
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        amount: balanceMap.get(acc.id) || 0,
      }));

    // Fixed Assets
    const fixedAssetItems = assetAccounts
      .filter(isFixedAsset)
      .map((acc) => ({
        id: acc.id,
        section: "Fixed Asset",
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        amount: balanceMap.get(acc.id) || 0,
      }));

    // Current Liabilities
    const currentLiabilityItems = liabilityAccounts.map((acc) => ({
      id: acc.id,
      section: "Current Liability",
      accountCode: acc.accountCode,
      accountName: acc.accountName,
      amount: balanceMap.get(acc.id) || 0,
    }));

    // Equity items
    const equityItems = equityAccounts.map((acc) => {
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

    // If Retained Earnings / Current Year Earnings account isn't explicitly in chart of accounts, append it
    if (!equityItems.some((e) => e.section === "Retained Earnings")) {
      equityItems.push({
        id: "current-year-earnings",
        section: "Retained Earnings",
        accountCode: "3100",
        accountName: "Current Year Earnings",
        amount: currentYearEarnings,
      });
    }

    const totalCurrentAssets = currentAssetItems.reduce((s, i) => s + i.amount, 0);
    const totalFixedAssets = fixedAssetItems.reduce((s, i) => s + i.amount, 0);
    const totalAssets = totalCurrentAssets + totalFixedAssets;

    const totalCurrentLiabilities = currentLiabilityItems.reduce((s, i) => s + i.amount, 0);
    const totalLiabilities = totalCurrentLiabilities;

    const totalEquity = equityItems.reduce((s, i) => s + i.amount, 0);
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
      // For backwards compatibility with dashboard
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
