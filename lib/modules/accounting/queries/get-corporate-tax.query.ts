import prisma from "@/lib/prisma";
import { microCache } from "../cache/micro-cache";

export interface MonthlyCorporateTaxColumn {
  monthKey: string;
  monthLabel: string;
  accountingNetProfit: number;
  exemptRevenue: number;
  nonDeductibleExpenses: number;
  taxableIncome: number;
  calculatedTaxDue: number; // 9% above 375,000 threshold
}

export interface CorporateTaxResult {
  year: number;
  months: MonthlyCorporateTaxColumn[];
  totals: {
    accountingNetProfit: number;
    exemptRevenue: number;
    nonDeductibleExpenses: number;
    taxableIncome: number;
    taxThreshold: number; // AED 375,000 in UAE
    taxableIncomeAboveThreshold: number;
    corporateTaxDue: number; // 9% on amount above threshold
    statutoryTaxRate: number; // 9%
  };
}

export class GetCorporateTaxQueryHandler {
  static async execute(params?: { year?: number }): Promise<CorporateTaxResult> {
    const year = params?.year || new Date().getFullYear();
    const cacheKey = `tax:corporate:${year}`;
    const cached = microCache.get<CorporateTaxResult>(cacheKey);
    if (cached) return cached;

    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    // Fetch posted journal lines for revenue and expenses
    const lines = await prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          isPosted: true,
          entryDate: { gte: startDate, lte: endDate },
        },
      },
      include: {
        account: true,
        journalEntry: true,
      },
    });

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const monthlyMap: Record<number, { revenue: number; expense: number; nonDeductible: number; exempt: number }> = {};
    for (let i = 0; i < 12; i++) {
      monthlyMap[i] = { revenue: 0, expense: 0, nonDeductible: 0, exempt: 0 };
    }

    for (const l of lines) {
      const d = l.journalEntry?.entryDate ? new Date(l.journalEntry.entryDate) : null;
      if (!d) continue;
      const m = d.getMonth();
      const dr = Number(l.debit || 0);
      const cr = Number(l.credit || 0);
      const accType = l.account?.type;
      const accName = l.account?.accountName?.toLowerCase() || "";

      if (accType === "REVENUE") {
        const netRev = cr - dr;
        monthlyMap[m].revenue += netRev;
        if (accName.includes("dividend") || accName.includes("exempt")) {
          monthlyMap[m].exempt += netRev;
        }
      } else if (accType === "EXPENSE") {
        const netExp = dr - cr;
        monthlyMap[m].expense += netExp;
        if (
          accName.includes("fine") ||
          accName.includes("penalty") ||
          accName.includes("entertainment") ||
          accName.includes("donation")
        ) {
          monthlyMap[m].nonDeductible += netExp;
        }
      }
    }

    const months: MonthlyCorporateTaxColumn[] = monthNames.map((name, idx) => {
      const data = monthlyMap[idx];
      const netProfit = Math.round((data.revenue - data.expense) * 100) / 100;
      const taxable = Math.round((netProfit - data.exempt + data.nonDeductible) * 100) / 100;

      return {
        monthKey: `${year}-${(idx + 1).toString().padStart(2, "0")}`,
        monthLabel: `${name} ${year}`,
        accountingNetProfit: netProfit,
        exemptRevenue: Math.round(data.exempt * 100) / 100,
        nonDeductibleExpenses: Math.round(data.nonDeductible * 100) / 100,
        taxableIncome: taxable,
        calculatedTaxDue: taxable > 0 ? Math.round(taxable * 0.09 * 100) / 100 : 0,
      };
    });

    const totalNetProfit = months.reduce((s, m) => s + m.accountingNetProfit, 0);
    const totalExempt = months.reduce((s, m) => s + m.exemptRevenue, 0);
    const totalNonDeductible = months.reduce((s, m) => s + m.nonDeductibleExpenses, 0);
    const totalTaxable = Math.round((totalNetProfit - totalExempt + totalNonDeductible) * 100) / 100;

    const threshold = 375_000;
    const taxableAboveThreshold = Math.max(0, totalTaxable - threshold);
    const taxDue = Math.round(taxableAboveThreshold * 0.09 * 100) / 100;

    const result: CorporateTaxResult = {
      year,
      months,
      totals: {
        accountingNetProfit: Math.round(totalNetProfit * 100) / 100,
        exemptRevenue: Math.round(totalExempt * 100) / 100,
        nonDeductibleExpenses: Math.round(totalNonDeductible * 100) / 100,
        taxableIncome: totalTaxable,
        taxThreshold: threshold,
        taxableIncomeAboveThreshold: Math.round(taxableAboveThreshold * 100) / 100,
        corporateTaxDue: taxDue,
        statutoryTaxRate: 9,
      },
    };

    microCache.set(cacheKey, result, 60_000);
    return result;
  }
}
