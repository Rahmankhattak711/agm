import { prisma } from "@/lib/prisma";
import { LedgerPostingService } from "./ledger-posting.service";

export interface FiscalClosingSummary {
  year: number;
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalExpense: number;
  netProfitLoss: number;
  isClosed: boolean;
  closedAt?: Date | null;
}

export class YearEndClosingService {
  /**
   * Preview annual P&L result before closing
   */
  static async calculateYearSummary(year: number): Promise<FiscalClosingSummary> {
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    // Fetch all posted journal lines for the year
    const lines = await prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          isPosted: true,
          entryDate: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        account: true,
      },
    });

    let totalRevenue = 0;
    let totalExpense = 0;

    for (const line of lines) {
      const type = line.account.type;
      const code = line.account.accountCode;
      const netAmount = Number(line.credit) - Number(line.debit);

      if (type === "REVENUE" || code.startsWith("4")) {
        totalRevenue += netAmount;
      } else if (type === "EXPENSE" || code.startsWith("5")) {
        // Expenses are debit-normal (Debit - Credit)
        totalExpense += Number(line.debit) - Number(line.credit);
      }
    }

    const netProfitLoss = Math.round((totalRevenue - totalExpense) * 100) / 100;

    const existingClosing = await prisma.fiscalYearClosing.findUnique({
      where: { year },
    });

    return {
      year,
      startDate,
      endDate,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      netProfitLoss,
      isClosed: existingClosing?.isClosed ?? false,
      closedAt: existingClosing?.closedAt,
    };
  }

  /**
   * Performs Annual Fiscal Roll-Forward:
   * 1. Zeros out Revenue (4xxx) & Expense (5xxx) balances.
   * 2. Posts net difference into '331 - Retained Earnings'.
   * 3. Locks fiscal year.
   */
  static async closeFiscalYear(year: number, closedById: string) {
    const summary = await this.calculateYearSummary(year);

    if (summary.isClosed) {
      throw new Error(`Fiscal Year ${year} is already closed.`);
    }

    // Find Retained Earnings account (331 or code 3300)
    const retainedEarningsAccount = await prisma.chartOfAccount.findFirst({
      where: {
        OR: [
          { accountCode: "331" },
          { accountCode: "3300" },
          { accountName: { contains: "Retained Earnings", mode: "insensitive" } },
        ],
      },
    });

    if (!retainedEarningsAccount) {
      throw new Error("Account '331 - Retained Earnings' not found in Chart of Accounts.");
    }

    // Create closing journal entry on 31-Dec of the year
    const closingDate = new Date(`${year}-12-31T23:59:59.000Z`);

    // Fetch individual account net balances for 4xxx and 5xxx
    const accounts = await prisma.chartOfAccount.findMany({
      where: {
        OR: [
          { type: "REVENUE" },
          { type: "EXPENSE" },
          { accountCode: { startsWith: "4" } },
          { accountCode: { startsWith: "5" } },
        ],
      },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              isPosted: true,
              entryDate: {
                gte: summary.startDate,
                lte: summary.endDate,
              },
            },
          },
        },
      },
    });

    const closingLines = [];

    for (const acc of accounts) {
      let balance = 0;
      for (const line of acc.journalLines) {
        balance += Number(line.debit) - Number(line.credit);
      }

      if (Math.abs(balance) > 0.001) {
        if (balance > 0) {
          // Has debit balance (e.g. Expense) -> Credit it to zero out
          closingLines.push({
            accountId: acc.id,
            description: `Year-End ${year} Closeout - Zero out ${acc.accountName}`,
            debit: 0,
            credit: Math.abs(balance),
          });
        } else {
          // Has credit balance (e.g. Revenue) -> Debit it to zero out
          closingLines.push({
            accountId: acc.id,
            description: `Year-End ${year} Closeout - Zero out ${acc.accountName}`,
            debit: Math.abs(balance),
            credit: 0,
          });
        }
      }
    }

    // The balancing leg goes into Retained Earnings:
    // If Net Profit > 0 (Revenue > Expense), Retained Earnings is CREDITED.
    // If Net Loss < 0 (Expense > Revenue), Retained Earnings is DEBITED.
    if (summary.netProfitLoss > 0) {
      closingLines.push({
        accountId: retainedEarningsAccount.id,
        description: `Transfer of FY ${year} Net Profit to Retained Earnings`,
        debit: 0,
        credit: summary.netProfitLoss,
      });
    } else if (summary.netProfitLoss < 0) {
      closingLines.push({
        accountId: retainedEarningsAccount.id,
        description: `Transfer of FY ${year} Net Loss to Retained Earnings`,
        debit: Math.abs(summary.netProfitLoss),
        credit: 0,
      });
    }

    // Post Closing Journal Entry
    const closingJournal = await LedgerPostingService.createJournalEntry({
      entryDate: closingDate,
      reference: `CLOSE-FY-${year}`,
      description: `Automated Fiscal Year-End ${year} Closing & Retained Earnings Transfer`,
      isPosted: true,
      createdBy: closedById,
      lines: closingLines,
    });

    // Record in FiscalYearClosing table
    const record = await prisma.fiscalYearClosing.upsert({
      where: { year },
      create: {
        year,
        startDate: summary.startDate,
        endDate: summary.endDate,
        isClosed: true,
        closedAt: new Date(),
        closedById,
        netProfitLoss: summary.netProfitLoss,
        retainedEarningsTransfer: summary.netProfitLoss,
        closingJournalId: closingJournal.id,
        notes: `Successfully closed FY ${year}. Net P&L: AED ${summary.netProfitLoss} transferred to Retained Earnings.`,
      },
      update: {
        isClosed: true,
        closedAt: new Date(),
        closedById,
        netProfitLoss: summary.netProfitLoss,
        retainedEarningsTransfer: summary.netProfitLoss,
        closingJournalId: closingJournal.id,
      },
    });

    return record;
  }
}
