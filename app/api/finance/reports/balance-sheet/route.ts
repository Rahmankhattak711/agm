import {
  getAuthUser,
  isFinancialUser,
  unauthorized,
  forbidden,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { microCache } from "@/lib/modules/accounting/cache/micro-cache";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!isFinancialUser(authUser)) return forbidden();

    const { searchParams } = new URL(request.url);
    const todayStr = new Date().toISOString().split("T")[0];
    const asAtParam = searchParams.get("asAt") || todayStr;
    const forceRefresh = searchParams.get("refresh") === "true";

    const cacheKey = `bs:${asAtParam}`;
    const cached = microCache.get<any>(cacheKey);
    if (cached && !forceRefresh) {
      return NextResponse.json(cached);
    }

    const asAtDate = new Date(`${asAtParam}T23:59:59.999Z`);

    // Single-query fetch: All accounts with posted journal lines up to asAtDate
    const accounts = await prisma.chartOfAccount.findMany({
      orderBy: { accountCode: "asc" },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              isPosted: true,
              entryDate: { lte: asAtDate },
            },
          },
        },
      },
    });

    let currentYearNetProfit = 0;

    // Compute balance per account and aggregate P&L net profit in a single in-memory pass
    const accountsWithBalance = accounts.map((acc) => {
      let balance = 0;
      const isAsset = acc.type === "ASSET" || acc.accountCode.startsWith("1");
      const isLiability = acc.type === "LIABILITY" || acc.accountCode.startsWith("2");
      const isEquity = acc.type === "EQUITY" || acc.accountCode.startsWith("3");
      const isRevenue = acc.type === "REVENUE" || acc.accountCode.startsWith("4");
      const isExpense = acc.type === "EXPENSE" || acc.accountCode.startsWith("5");

      for (const l of acc.journalLines) {
        const dr = Number(l.debit || 0);
        const cr = Number(l.credit || 0);

        if (isAsset) {
          balance += dr - cr;
        } else if (isLiability || isEquity) {
          balance += cr - dr;
        } else {
          balance += dr - cr;
        }

        // P&L Contribution
        if (isRevenue) {
          currentYearNetProfit += cr - dr;
        } else if (isExpense) {
          currentYearNetProfit -= dr - cr;
        }
      }

      return {
        id: acc.id,
        code: acc.accountCode,
        name: acc.accountName,
        type: acc.type,
        subtype: acc.accountSubtype,
        level: acc.level,
        parentId: acc.parentId,
        balance: Math.round(balance * 100) / 100,
      };
    });

    currentYearNetProfit = Math.round(currentYearNetProfit * 100) / 100;

    // Filter into 3 Balance Sheet Pillars: Assets (1), Liabilities (2), Equity (3)
    const assetAccounts = accountsWithBalance.filter(
      (a) => a.type === "ASSET" || a.code.startsWith("1")
    );
    const liabilityAccounts = accountsWithBalance.filter(
      (a) => a.type === "LIABILITY" || a.code.startsWith("2")
    );
    const equityAccounts = accountsWithBalance.filter(
      (a) => a.type === "EQUITY" || a.code.startsWith("3")
    );

    // Classify into Current vs Non-Current Assets
    const currentAssetAccounts = assetAccounts.filter((a) => {
      const code = a.code;
      const sub = (a.subtype || "").toLowerCase();
      if (sub.includes("fixed") || sub.includes("non-current") || code.startsWith("12") || code.startsWith("15")) {
        return false;
      }
      return true;
    });

    const fixedAssetAccounts = assetAccounts.filter((a) => {
      const code = a.code;
      const sub = (a.subtype || "").toLowerCase();
      return sub.includes("fixed") || sub.includes("non-current") || code.startsWith("12") || code.startsWith("15");
    });

    // Classify into Current vs Non-Current Liabilities
    const currentLiabilityAccounts = liabilityAccounts.filter((a) => {
      const code = a.code;
      const sub = (a.subtype || "").toLowerCase();
      if (sub.includes("non-current") || sub.includes("long-term") || code.startsWith("25")) {
        return false;
      }
      return true;
    });

    const nonCurrentLiabilityAccounts = liabilityAccounts.filter((a) => {
      const code = a.code;
      const sub = (a.subtype || "").toLowerCase();
      return sub.includes("non-current") || sub.includes("long-term") || code.startsWith("25");
    });

    const currentAssetsTotal = Math.round(currentAssetAccounts.reduce((s, a) => s + a.balance, 0) * 100) / 100;
    const fixedAssetsTotal = Math.round(fixedAssetAccounts.reduce((s, a) => s + a.balance, 0) * 100) / 100;
    const currentLiabilitiesTotal = Math.round(currentLiabilityAccounts.reduce((s, a) => s + a.balance, 0) * 100) / 100;
    const nonCurrentLiabilitiesTotal = Math.round(nonCurrentLiabilityAccounts.reduce((s, a) => s + a.balance, 0) * 100) / 100;

    const totalAssets = Math.round((currentAssetsTotal + fixedAssetsTotal) * 100) / 100;
    const totalLiabilities = Math.round((currentLiabilitiesTotal + nonCurrentLiabilitiesTotal) * 100) / 100;
    const baseEquity = Math.round(equityAccounts.reduce((s, a) => s + a.balance, 0) * 100) / 100;
    const totalEquity = Math.round((baseEquity + currentYearNetProfit) * 100) / 100;
    const totalLiabilitiesAndEquity = Math.round((totalLiabilities + totalEquity) * 100) / 100;
    const difference = Math.round(Math.abs(totalAssets - totalLiabilitiesAndEquity) * 100) / 100;

    const result = {
      asAt: asAtParam,
      assets: {
        accounts: assetAccounts,
        currentAccounts: currentAssetAccounts,
        fixedAccounts: fixedAssetAccounts,
        currentTotal: currentAssetsTotal,
        fixedTotal: fixedAssetsTotal,
        total: totalAssets,
      },
      liabilities: {
        accounts: liabilityAccounts,
        currentAccounts: currentLiabilityAccounts,
        nonCurrentAccounts: nonCurrentLiabilityAccounts,
        currentTotal: currentLiabilitiesTotal,
        nonCurrentTotal: nonCurrentLiabilitiesTotal,
        total: totalLiabilities,
      },
      equity: {
        accounts: equityAccounts,
        currentYearNetProfit,
        total: totalEquity,
      },
      totalLiabilitiesAndEquity,
      difference,
      isBalanced: difference < 0.05,
    };

    microCache.set(cacheKey, result, 45);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/finance/reports/balance-sheet error:", error);
    return NextResponse.json(
      { error: "Failed to generate balance sheet" },
      { status: 500 }
    );
  }
}
