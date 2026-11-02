import { getAuthUser, unauthorized } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || "2026", 10);
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    // Fetch all posted journal lines
    const lines = await prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          isPosted: true,
          entryDate: { gte: startDate, lte: endDate },
        },
      },
      include: {
        account: true,
      },
    });

    let operatingCashInflow = 0; // Customer receipts
    let operatingCashOutflow = 0; // Supplier & expense payments
    let investingCashOutflow = 0; // Fixed asset purchases
    let financingCashFlow = 0; // Capital & loans

    for (const l of lines) {
      const isBankOrCash =
        l.account.accountCode.startsWith("111") ||
        l.account.accountName.toLowerCase().includes("cash") ||
        l.account.accountName.toLowerCase().includes("bank");

      if (isBankOrCash) {
        const d = Number(l.debit);
        const c = Number(l.credit);

        // Net movement on cash account
        if (d > 0) {
          // Cash inflow
          operatingCashInflow += d;
        }
        if (c > 0) {
          // Cash outflow
          operatingCashOutflow += c;
        }
      }
    }

    const netOperating = operatingCashInflow - operatingCashOutflow;
    const netInvesting = -investingCashOutflow;
    const netFinancing = financingCashFlow;
    const netChangeInCash = netOperating + netInvesting + netFinancing;

    // Get current cash & bank balance from DB
    const cashAccounts = await prisma.chartOfAccount.findMany({
      where: {
        OR: [
          { accountCode: { startsWith: "111" } },
          { accountName: { contains: "Cash", mode: "insensitive" } },
          { accountName: { contains: "Bank", mode: "insensitive" } },
        ],
      },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              isPosted: true,
              entryDate: { lte: endDate },
            },
          },
        },
      },
    });

    let closingCash = 0;
    for (const acc of cashAccounts) {
      for (const l of acc.journalLines) {
        closingCash += Number(l.debit) - Number(l.credit);
      }
    }

    const openingCash = closingCash - netChangeInCash;

    return NextResponse.json({
      year,
      operating: {
        inflows: Math.round(operatingCashInflow * 100) / 100,
        outflows: Math.round(operatingCashOutflow * 100) / 100,
        net: Math.round(netOperating * 100) / 100,
      },
      investing: {
        outflows: Math.round(investingCashOutflow * 100) / 100,
        net: Math.round(netInvesting * 100) / 100,
      },
      financing: {
        net: Math.round(netFinancing * 100) / 100,
      },
      netChangeInCash: Math.round(netChangeInCash * 100) / 100,
      openingCash: Math.round(openingCash * 100) / 100,
      closingCash: Math.round(closingCash * 100) / 100,
    });
  } catch (error: any) {
    console.error("GET /api/finance/reports/cash-flow error:", error);
    return NextResponse.json(
      { error: "Failed to generate cash flow statement", details: error.message },
      { status: 500 }
    );
  }
}
