import { getAuthUser, unauthorized } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const asAtDate = searchParams.get("asAt")
      ? new Date(searchParams.get("asAt")!)
      : new Date("2026-10-31T23:59:59.999Z");

    // Fetch all accounts
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

    // Compute balance per account
    const accountsWithBalance = accounts.map((acc) => {
      let balance = 0;
      for (const l of acc.journalLines) {
        const isAssetOrExpense = acc.type === "ASSET" || acc.accountCode.startsWith("1");
        const isLiabilityOrEquityOrRevenue =
          acc.type === "LIABILITY" ||
          acc.type === "EQUITY" ||
          acc.accountCode.startsWith("2") ||
          acc.accountCode.startsWith("3");

        if (isAssetOrExpense) {
          balance += Number(l.debit) - Number(l.credit);
        } else if (isLiabilityOrEquityOrRevenue) {
          balance += Number(l.credit) - Number(l.debit);
        } else {
          balance += Number(l.debit) - Number(l.credit);
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

    // Also calculate Retained Earnings (Net Profit/Loss up to asAtDate)
    const pnlLines = await prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          isPosted: true,
          entryDate: { lte: asAtDate },
        },
        account: {
          OR: [
            { type: "REVENUE" },
            { type: "EXPENSE" },
            { accountCode: { startsWith: "4" } },
            { accountCode: { startsWith: "5" } },
          ],
        },
      },
      include: { account: true },
    });

    let currentYearNetProfit = 0;
    for (const l of pnlLines) {
      if (l.account.type === "REVENUE" || l.account.accountCode.startsWith("4")) {
        currentYearNetProfit += Number(l.credit) - Number(l.debit);
      } else {
        currentYearNetProfit -= Number(l.debit) - Number(l.credit);
      }
    }
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

    const totalAssets = assetAccounts.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = liabilityAccounts.reduce((s, a) => s + a.balance, 0);
    const baseEquity = equityAccounts.reduce((s, a) => s + a.balance, 0);
    const totalEquity = baseEquity + currentYearNetProfit;

    return NextResponse.json({
      asAt: asAtDate.toISOString().split("T")[0],
      assets: {
        accounts: assetAccounts,
        total: Math.round(totalAssets * 100) / 100,
      },
      liabilities: {
        accounts: liabilityAccounts,
        total: Math.round(totalLiabilities * 100) / 100,
      },
      equity: {
        accounts: equityAccounts,
        currentYearNetProfit,
        total: Math.round(totalEquity * 100) / 100,
      },
      totalLiabilitiesAndEquity: Math.round((totalLiabilities + totalEquity) * 100) / 100,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    });
  } catch (error: any) {
    console.error("GET /api/finance/reports/balance-sheet error:", error);
    return NextResponse.json(
      { error: "Failed to generate balance sheet", details: error.message },
      { status: 500 }
    );
  }
}
