import prisma from "@/lib/prisma";
import { microCache } from "../cache/micro-cache";
import {
  ProfitLossQueryParams,
  ProfitLossDto,
  ProfitLossAccountRowDto,
  TopEntryItemDto,
} from "./types";

export class GetProfitLossQueryHandler {
  static async execute(params: ProfitLossQueryParams): Promise<ProfitLossDto> {
    const fromParam = params.from || "2026-07";
    const toParam = params.to || "2026-10";

    const cacheKey = `pnl:${fromParam}:${toParam}`;
    const cached = microCache.get<ProfitLossDto>(cacheKey);
    if (cached) {
      return cached;
    }

    // Generate list of months between fromParam and toParam
    const [startYear, startMonth] = fromParam.split("-").map(Number);
    const [endYear, endMonth] = toParam.split("-").map(Number);

    const monthKeys: string[] = [];
    const monthLabels: string[] = [];
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    let curY = startYear;
    let curM = startMonth;

    while (curY < endYear || (curY === endYear && curM <= endMonth)) {
      const mStr = curM.toString().padStart(2, "0");
      const key = `${curY}-${mStr}`;
      monthKeys.push(key);
      monthLabels.push(`${monthNames[curM - 1]} ${curY}`);

      curM++;
      if (curM > 12) {
        curM = 1;
        curY++;
      }
    }

    if (monthKeys.length === 0) {
      monthKeys.push("2026-10");
      monthLabels.push("Oct 2026");
    }

    // Date bounds for query
    const firstKey = monthKeys[0];
    const lastKey = monthKeys[monthKeys.length - 1];
    const fromDate = new Date(`${firstKey}-01T00:00:00.000Z`);

    const [lYear, lMonth] = lastKey.split("-").map(Number);
    const daysInLastMonth = new Date(lYear, lMonth, 0).getDate();
    const toDate = new Date(`${lastKey}-${daysInLastMonth}T23:59:59.999Z`);

    // Fetch posted journal lines utilizing index [isPosted, entryDate]
    const lines = await prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          isPosted: true,
          entryDate: {
            gte: fromDate,
            lte: toDate,
          },
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
      include: {
        account: true,
        journalEntry: {
          include: {
            lines: {
              include: {
                account: true,
              },
            },
          },
        },
      },
      orderBy: {
        journalEntry: {
          entryDate: "desc",
        },
      },
    });

    // Group lines by account
    const accountMap = new Map<string, ProfitLossAccountRowDto>();

    for (const l of lines) {
      const acc = l.account;
      if (!acc) continue;

      if (!accountMap.has(acc.id)) {
        const monthlyInit: Record<string, number> = {};
        const topEntriesByMonthInit: Record<string, TopEntryItemDto[]> = {};
        for (const k of monthKeys) {
          monthlyInit[k] = 0;
          topEntriesByMonthInit[k] = [];
        }

        accountMap.set(acc.id, {
          id: acc.id,
          code: acc.accountCode,
          name: acc.accountName,
          type: acc.type,
          subtype: acc.accountSubtype || null,
          monthly: monthlyInit,
          total: 0,
          topEntriesByMonth: topEntriesByMonthInit,
          topEntriesTotal: [],
        });
      }

      const item = accountMap.get(acc.id)!;
      const entryDateObj = new Date(l.journalEntry.entryDate);
      const y = entryDateObj.getFullYear();
      const m = (entryDateObj.getMonth() + 1).toString().padStart(2, "0");
      const entryKey = `${y}-${m}`;

      let amt = 0;
      if (acc.type === "REVENUE" || acc.accountCode.startsWith("4")) {
        amt = Number(l.credit) - Number(l.debit);
      } else {
        amt = Number(l.debit) - Number(l.credit);
      }

      if (item.monthly[entryKey] !== undefined) {
        item.monthly[entryKey] += amt;
      }
      item.total += amt;

      // Detect source document
      const entryNumber = l.journalEntry.entryNumber || "";
      const ref = l.journalEntry.reference || "";
      const desc = (l.journalEntry.description || "").toLowerCase();

      let source = "Manual journal";
      let sourceUrl = `/finance/journal-entries?search=${encodeURIComponent(entryNumber)}`;

      if (entryNumber.startsWith("JE-INV-") || ref.startsWith("INV-") || desc.includes("sales invoice")) {
        source = "Sales invoice";
        const invMatch = ref.match(/INV-(?:\d{4}-)?\d+/i) || entryNumber.match(/INV-(?:\d{4}-)?\d+/i) || desc.match(/INV-(?:\d{4}-)?\d+/i);
        const invNum = invMatch ? invMatch[0] : (ref || entryNumber);
        sourceUrl = `/commercial/sales-invoices/${encodeURIComponent(invNum)}`;
      } else if (
        entryNumber.startsWith("JE-REC-") ||
        ref.startsWith("REC-") ||
        desc.includes("customer receipt") ||
        desc.includes("payment received")
      ) {
        source = "Customer payment";
        sourceUrl = `/commercial/sales-invoices?search=${encodeURIComponent(ref || entryNumber)}`;
      } else if (entryNumber.startsWith("JE-BILL-") || ref.startsWith("BILL-") || desc.includes("supplier bill")) {
        source = "Bill";
        sourceUrl = `/commercial/supplier-bills?search=${encodeURIComponent(ref || entryNumber)}`;
      } else if (entryNumber.startsWith("JE-PAY-") || ref.startsWith("PAY-") || desc.includes("supplier payment")) {
        source = "Bill payment";
        sourceUrl = `/commercial/supplier-bills?search=${encodeURIComponent(ref || entryNumber)}`;
      }

      const otherLines = l.journalEntry.lines
        .filter((sibling: any) => sibling.id !== l.id)
        .map((sibling: any) => ({
          id: sibling.id,
          accountId: sibling.accountId,
          accountCode: sibling.account?.accountCode || "—",
          accountName: sibling.account?.accountName || "Account",
          debit: Number(sibling.debit || 0),
          credit: Number(sibling.credit || 0),
        }));

      const entryPayload: TopEntryItemDto = {
        lineId: l.id,
        journalEntryId: l.journalEntry.id,
        journalNumber: entryNumber,
        reference: ref || "—",
        date: entryDateObj.toISOString().split("T")[0],
        description: l.description || l.journalEntry.description || "—",
        source,
        sourceUrl,
        amount: Math.abs(amt),
        isCredit: Number(l.credit) > 0,
        selectedLine: {
          accountId: acc.id,
          accountCode: acc.accountCode,
          accountName: acc.accountName,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
        },
        otherLines,
      };

      if (item.topEntriesByMonth[entryKey]) {
        item.topEntriesByMonth[entryKey].push(entryPayload);
      }
      item.topEntriesTotal.push(entryPayload);
    }

    // Structure into categories
    const incomeAccounts: ProfitLossAccountRowDto[] = [];
    const costOfSalesAccounts: ProfitLossAccountRowDto[] = [];
    const operatingExpenseAccounts: ProfitLossAccountRowDto[] = [];
    const otherIncomeAccounts: ProfitLossAccountRowDto[] = [];
    const nonOperatingExpenseAccounts: ProfitLossAccountRowDto[] = [];

    const allAccounts = Array.from(accountMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code, undefined, { numeric: true })
    );

    for (const item of allAccounts) {
      item.total = Math.round(item.total * 100) / 100;
      for (const k of monthKeys) {
        item.monthly[k] = Math.round((item.monthly[k] || 0) * 100) / 100;
      }

      if (item.code.startsWith("41")) {
        incomeAccounts.push(item);
      } else if (item.code.startsWith("51")) {
        costOfSalesAccounts.push(item);
      } else if (item.code.startsWith("52")) {
        operatingExpenseAccounts.push(item);
      } else if (item.code.startsWith("42")) {
        otherIncomeAccounts.push(item);
      } else if (item.code.startsWith("53")) {
        nonOperatingExpenseAccounts.push(item);
      } else if (item.type === "REVENUE") {
        incomeAccounts.push(item);
      } else {
        operatingExpenseAccounts.push(item);
      }
    }

    const sumMonthly = (list: ProfitLossAccountRowDto[]) => {
      const res: Record<string, number> = {};
      let total = 0;
      for (const k of monthKeys) {
        let s = 0;
        for (const item of list) {
          s += item.monthly[k] || 0;
        }
        res[k] = Math.round(s * 100) / 100;
        total += s;
      }
      return { monthly: res, total: Math.round(total * 100) / 100 };
    };

    const incomeTotals = sumMonthly(incomeAccounts);
    const costOfSalesTotals = sumMonthly(costOfSalesAccounts);
    const opExpenseTotals = sumMonthly(operatingExpenseAccounts);
    const otherIncomeTotals = sumMonthly(otherIncomeAccounts);
    const nonOpExpenseTotals = sumMonthly(nonOperatingExpenseAccounts);

    const grossProfitMonthly: Record<string, number> = {};
    let grossProfitTotal = 0;
    for (const k of monthKeys) {
      const gp = (incomeTotals.monthly[k] || 0) - (costOfSalesTotals.monthly[k] || 0);
      grossProfitMonthly[k] = Math.round(gp * 100) / 100;
      grossProfitTotal += gp;
    }

    const operatingProfitMonthly: Record<string, number> = {};
    let operatingProfitTotal = 0;
    for (const k of monthKeys) {
      const op = (grossProfitMonthly[k] || 0) - (opExpenseTotals.monthly[k] || 0);
      operatingProfitMonthly[k] = Math.round(op * 100) / 100;
      operatingProfitTotal += op;
    }

    const netProfitMonthly: Record<string, number> = {};
    let netProfitTotal = 0;
    for (const k of monthKeys) {
      const np =
        (operatingProfitMonthly[k] || 0) +
        (otherIncomeTotals.monthly[k] || 0) -
        (nonOpExpenseTotals.monthly[k] || 0);
      netProfitMonthly[k] = Math.round(np * 100) / 100;
      netProfitTotal += np;
    }

    const pnlReport: ProfitLossDto = {
      monthKeys,
      monthLabels,
      income: { accounts: incomeAccounts, totals: incomeTotals },
      costOfSales: { accounts: costOfSalesAccounts, totals: costOfSalesTotals },
      grossProfit: {
        monthly: grossProfitMonthly,
        total: Math.round(grossProfitTotal * 100) / 100,
      },
      operatingExpenses: {
        accounts: operatingExpenseAccounts,
        totals: opExpenseTotals,
      },
      operatingProfit: {
        monthly: operatingProfitMonthly,
        total: Math.round(operatingProfitTotal * 100) / 100,
      },
      otherIncome: {
        accounts: otherIncomeAccounts,
        totals: otherIncomeTotals,
      },
      nonOperatingExpenses: {
        accounts: nonOperatingExpenseAccounts,
        totals: nonOpExpenseTotals,
      },
      netProfit: {
        monthly: netProfitMonthly,
        total: Math.round(netProfitTotal * 100) / 100,
      },
    };

    // Cache results for 45s
    microCache.set(cacheKey, pnlReport, 45);

    return pnlReport;
  }
}
