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
    const fromStr = searchParams.get("from") || "2026-01-01";
    const toStr = searchParams.get("to") || todayStr;
    const forceRefresh = searchParams.get("refresh") === "true";

    const cacheKey = `tb:${fromStr}:${toStr}`;
    const cached = microCache.get<any>(cacheKey);
    if (cached && !forceRefresh) return NextResponse.json(cached);

    const fromDate = new Date(`${fromStr}T00:00:00.000Z`);
    const toDate = new Date(`${toStr}T23:59:59.999Z`);

    // Fetch all accounts with posted journal lines
    const accounts = await prisma.chartOfAccount.findMany({
      orderBy: { accountCode: "asc" },
      include: {
        children: {
          select: { id: true, accountCode: true },
        },
        journalLines: {
          where: {
            journalEntry: { isPosted: true },
          },
          include: {
            journalEntry: {
              select: { entryDate: true },
            },
          },
        },
      },
    });

    const accountMap = new Map<string, any>();
    const childToParentMap = new Map<string, string>();
    const parentToChildrenMap = new Map<string, string[]>();

    for (const acc of accounts) {
      if (acc.parentId) {
        childToParentMap.set(acc.id, acc.parentId);
        const existing = parentToChildrenMap.get(acc.parentId) || [];
        existing.push(acc.id);
        parentToChildrenMap.set(acc.parentId, existing);
      }
    }

    // Step 1: Calculate direct transactions per account
    for (const acc of accounts) {
      let openingDr = 0;
      let openingCr = 0;
      let movementDr = 0;
      let movementCr = 0;

      for (const line of acc.journalLines) {
        const entryDate = line.journalEntry.entryDate;
        const dr = Number(line.debit || 0);
        const cr = Number(line.credit || 0);

        if (entryDate < fromDate) {
          openingDr += dr;
          openingCr += cr;
        } else if (entryDate <= toDate) {
          movementDr += dr;
          movementCr += cr;
        }
      }

      // Standard GAAP/IFRS Opening Balance: Net opening for the account as of fromDate
      const netOpening = openingDr - openingCr;
      const finalOpeningDr = netOpening > 0 ? netOpening : 0;
      const finalOpeningCr = netOpening < 0 ? Math.abs(netOpening) : 0;

      // Closing Balance: Net Opening + (Period Movements Dr - Cr)
      const netClosing = netOpening + (movementDr - movementCr);
      const closingDr = netClosing > 0 ? netClosing : 0;
      const closingCr = netClosing < 0 ? Math.abs(netClosing) : 0;

      const subtype =
        acc.accountSubtype ||
        (acc.type === "ASSET"
          ? "Current Assets"
          : acc.type === "LIABILITY"
            ? "Current Liabilities"
            : acc.type === "REVENUE"
              ? "Income"
              : acc.type === "EXPENSE"
                ? "Operating Expenses"
                : "Equity");

      accountMap.set(acc.id, {
        id: acc.id,
        code: acc.accountCode,
        name: acc.accountName,
        subtype,
        type: acc.type,
        level: acc.level,
        parentId: acc.parentId,
        hasChildren: (acc.children && acc.children.length > 0) || false,
        openingDebit: Math.round(finalOpeningDr * 100) / 100,
        openingCredit: Math.round(finalOpeningCr * 100) / 100,
        movementDebit: Math.round(movementDr * 100) / 100,
        movementCredit: Math.round(movementCr * 100) / 100,
        closingDebit: Math.round(closingDr * 100) / 100,
        closingCredit: Math.round(closingCr * 100) / 100,
        fxAdjustmentDebit: 0,
        fxAdjustmentCredit: 0,
        revaluedClosingDebit: Math.round(closingDr * 100) / 100,
        revaluedClosingCredit: Math.round(closingCr * 100) / 100,
        hasDirectActivity:
          finalOpeningDr > 0 ||
          finalOpeningCr > 0 ||
          movementDr > 0 ||
          movementCr > 0,
      });
    }

    // Identify active accounts and their ancestors
    const activeAndAncestorIds = new Set<string>();
    for (const [id, acc] of accountMap) {
      if (acc.hasDirectActivity) {
        activeAndAncestorIds.add(id);
        let pid = acc.parentId;
        while (pid) {
          activeAndAncestorIds.add(pid);
          pid = childToParentMap.get(pid);
        }
      }
    }

    // Step 2: Rollup totals for parent accounts whose children have amounts
    // (This allows parent header rows to show rolled-up sum when collapsed)
    for (const acc of accounts) {
      const stats = accountMap.get(acc.id);
      if (stats && stats.hasChildren && !stats.hasDirectActivity) {
        // Find all descendants recursively
        const getDescendants = (parentId: string): string[] => {
          const direct = parentToChildrenMap.get(parentId) || [];
          let res = [...direct];
          for (const d of direct) {
            res = res.concat(getDescendants(d));
          }
          return res;
        };

        const descendants = getDescendants(acc.id);
        let rollOpDr = 0,
          rollOpCr = 0,
          rollMovDr = 0,
          rollMovCr = 0;

        for (const descId of descendants) {
          const dStat = accountMap.get(descId);
          if (dStat && dStat.hasDirectActivity) {
            rollOpDr += dStat.openingDebit;
            rollOpCr += dStat.openingCredit;
            rollMovDr += dStat.movementDebit;
            rollMovCr += dStat.movementCredit;
          }
        }

        const netRollClosing =
          rollOpDr - rollOpCr + (rollMovDr - rollMovCr);
        stats.rollupOpeningDebit = Math.round(rollOpDr * 100) / 100;
        stats.rollupOpeningCredit = Math.round(rollOpCr * 100) / 100;
        stats.rollupMovementDebit = Math.round(rollMovDr * 100) / 100;
        stats.rollupMovementCredit = Math.round(rollMovCr * 100) / 100;
        stats.rollupClosingDebit =
          netRollClosing > 0 ? Math.round(netRollClosing * 100) / 100 : 0;
        stats.rollupClosingCredit =
          netRollClosing < 0
            ? Math.round(Math.abs(netRollClosing) * 100) / 100
            : 0;
        stats.rollupRevaluedDebit = stats.rollupClosingDebit;
        stats.rollupRevaluedCredit = stats.rollupClosingCredit;
      }
    }

    // Filter relevant rows (only accounts that have activity or are ancestors of active accounts)
    // If no transactions exist, fall back to showing top accounts
    const relevantRows =
      activeAndAncestorIds.size > 0
        ? accounts
            .filter(
              (a) =>
                activeAndAncestorIds.has(a.id) && a.accountCode.length > 1,
            )
            .map((a) => accountMap.get(a.id))
        : accounts
            .filter((a) => a.accountCode.length > 1)
            .slice(0, 15)
            .map((a) => accountMap.get(a.id));

    // Calculate Grand Totals strictly across direct posting accounts
    let totalOpDr = 0;
    let totalOpCr = 0;
    let totalMovDr = 0;
    let totalMovCr = 0;
    let totalCloseDr = 0;
    let totalCloseCr = 0;

    for (const [id, s] of accountMap) {
      if (s.hasDirectActivity) {
        totalOpDr += s.openingDebit;
        totalOpCr += s.openingCredit;
        totalMovDr += s.movementDebit;
        totalMovCr += s.movementCredit;
        totalCloseDr += s.closingDebit;
        totalCloseCr += s.closingCredit;
      }
    }

    const difference =
      Math.round(Math.abs(totalCloseDr - totalCloseCr) * 100) / 100;

    const fromFormatted = new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
    }).format(fromDate);
    const toFormatted = new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
    }).format(toDate);

    const responsePayload = {
      fromDate: fromStr,
      toDate: toStr,
      dateLabel: `${fromFormatted} → ${toFormatted}`,
      rows: relevantRows,
      totals: {
        openingDebit: Math.round(totalOpDr * 100) / 100,
        openingCredit: Math.round(totalOpCr * 100) / 100,
        movementDebit: Math.round(totalMovDr * 100) / 100,
        movementCredit: Math.round(totalMovCr * 100) / 100,
        closingDebit: Math.round(totalCloseDr * 100) / 100,
        closingCredit: Math.round(totalCloseCr * 100) / 100,
        fxAdjustmentDebit: 0,
        fxAdjustmentCredit: 0,
        revaluedClosingDebit: Math.round(totalCloseDr * 100) / 100,
        revaluedClosingCredit: Math.round(totalCloseCr * 100) / 100,
        difference,
        isBalanced: difference < 0.01,
      },
    };

    microCache.set(cacheKey, responsePayload, 60_000);
    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error("GET /api/finance/reports/trial-balance error:", error);
    return NextResponse.json(
      { error: "Failed to generate trial balance" },
      { status: 500 },
    );
  }
}
