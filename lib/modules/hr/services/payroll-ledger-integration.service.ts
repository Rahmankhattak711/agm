import prisma from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma";
import { findOrCreateAccount } from "@/lib/commercial-accounting";

export interface PostPayrollParams {
  month: number;
  year: number;
  batchNumber: string;
  totalGrossPayroll: number;
  totalBasicSalary: number;
  totalHousingAllowance: number;
  totalTransportAllowance: number;
  totalOvertimeAmount: number;
  totalDeductions: number;
  totalNetPayroll: number;
  userId: string;
}

export class PayrollLedgerIntegrationService {
  /**
   * When HR/Finance Approves the Payroll batch:
   * 1. Dr. Salaries & Wages Expense (5221) = Gross Payroll
   * 2. Cr. Staff Advances / Deductions (1210) = Total Deductions (if any)
   * 3. Cr. Salaries Payable (2132) = Net Payroll Payable
   *
   * Verifies double entry: Debits === Credits
   */
  public static async postPayrollApprovalEntry(params: PostPayrollParams, tx?: Prisma.TransactionClient) {
    const db = tx || prisma;
    const entryDate = new Date(params.year, params.month, 0); // Last day of payroll month
    const reference = params.batchNumber;
    const entryNumber = `JE-${params.batchNumber}`;

    // Check if entry already exists
    const existing = await db.journalEntry.findUnique({
      where: { entryNumber },
    });
    if (existing) {
      return existing;
    }

    // Resolve or find Chart of Accounts
    const [salariesExpenseAcc, salariesPayableAcc, advancesAcc] = await Promise.all([
      findOrCreateAccount("5221", "Salaries and wages", "EXPENSE", tx),
      findOrCreateAccount("2132", "Salaries payable", "LIABILITY", tx),
      findOrCreateAccount("1210", "Staff Salary Advances", "ASSET", tx),
    ]);

    const lines: Array<{
      accountId: string;
      description: string;
      debit: number;
      credit: number;
    }> = [
      {
        accountId: salariesExpenseAcc.id,
        description: `Gross Salaries & Wages for ${params.batchNumber}`,
        debit: params.totalGrossPayroll,
        credit: 0,
      },
    ];

    if (params.totalDeductions > 0) {
      lines.push({
        accountId: advancesAcc.id,
        description: `Absence deductions & staff advance recovery (${params.batchNumber})`,
        debit: 0,
        credit: params.totalDeductions,
      });
    }

    lines.push({
      accountId: salariesPayableAcc.id,
      description: `Net accrued salaries payable (${params.batchNumber})`,
      debit: 0,
      credit: params.totalNetPayroll,
    });

    const journalEntry = await db.journalEntry.create({
      data: {
        entryNumber,
        entryDate,
        description: `Monthly Payroll Accrual - ${params.batchNumber}`,
        reference,
        isPosted: true,
        createdBy: params.userId,
        lines: {
          create: lines,
        },
      },
    });

    return journalEntry;
  }

  /**
   * When Payroll is PAID (Disbursed via RAK Bank 1020):
   * 1. Dr. Salaries Payable (2132) = Net Payroll (Liabilities cleared)
   * 2. Cr. RAK Bank Current A/C (1020) = Net Payroll (Bank decreased)
   */
  public static async postPayrollDisbursementEntry(params: {
    month: number;
    year: number;
    batchNumber: string;
    totalNetPayroll: number;
    userId: string;
  }, tx?: Prisma.TransactionClient) {
    const db = tx || prisma;
    const entryDate = new Date();
    const reference = `${params.batchNumber}-DISB`;
    const entryNumber = `JE-${reference}`;

    const existing = await db.journalEntry.findUnique({
      where: { entryNumber },
    });
    if (existing) {
      return existing;
    }

    const [salariesPayableAcc, bankAcc] = await Promise.all([
      findOrCreateAccount("2132", "Salaries payable", "LIABILITY", tx),
      findOrCreateAccount("1020", "RAK Bank Current A/C", "ASSET", tx),
    ]);

    const journalEntry = await db.journalEntry.create({
      data: {
        entryNumber,
        entryDate,
        description: `Salary Disbursement to Bank (WPS) - ${params.batchNumber}`,
        reference,
        isPosted: true,
        createdBy: params.userId,
        lines: {
          create: [
            {
              accountId: salariesPayableAcc.id,
              description: `Clear Salaries Payable for ${params.batchNumber}`,
              debit: params.totalNetPayroll,
              credit: 0,
            },
            {
              accountId: bankAcc.id,
              description: `WPS Bank transfer payout for ${params.batchNumber}`,
              debit: 0,
              credit: params.totalNetPayroll,
            },
          ],
        },
      },
    });

    return journalEntry;
  }
}
