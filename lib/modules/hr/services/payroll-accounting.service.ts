import prisma from "@/lib/prisma";

export interface PayrollAccountingPostingResult {
  journalEntryId?: string;
  entryNumber?: string;
  totalDebits: number;
  totalCredits: number;
  status: "POSTED" | "SIMULATED";
  breakdown: {
    basicSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    overtime: number;
    grossPayroll: number;
    deductions: number;
    netPayrollPayable: number;
  };
}

export class PayrollAccountingService {
  // Standard AGM Chart of Accounts codes
  public static readonly GL_SALARIES_EXPENSE = "5101"; // Basic Salary
  public static readonly GL_HOUSING_EXPENSE = "5102"; // Housing Allowance
  public static readonly GL_TRANSPORT_EXPENSE = "5103"; // Transport Allowance
  public static readonly GL_OVERTIME_EXPENSE = "5104"; // Overtime Pay Expense
  public static readonly GL_SALARIES_PAYABLE = "2105"; // Accrued Payroll & Salaries Payable
  public static readonly GL_STAFF_ADVANCES = "1105"; // Advances to Employees
  public static readonly GL_BANK_ACCOUNT = "1102"; // Main Bank Account

  /**
   * Calculates monthly payroll aggregation for accounting posting
   */
  public static async calculateMonthlyPayrollAccounting(month: number, year: number): Promise<{
    breakdown: {
      basicSalary: number;
      housingAllowance: number;
      transportAllowance: number;
      overtime: number;
      grossPayroll: number;
      deductions: number;
      netPayrollPayable: number;
    };
    employeeCount: number;
  }> {
    const payrollRecords = await prisma.payrollRecord.findMany({
      where: { month, year },
      include: { employee: true },
    });

    let basicSalary = 0;
    let allowances = 0;
    let overtime = 0;
    let deductions = 0;
    let netPayroll = 0;

    for (const p of payrollRecords) {
      basicSalary += Number(p.basicSalary || 0);
      allowances += Number(p.allowances || 0);
      overtime += Number(p.overtimeAmount || 0);
      deductions += Number(p.deductions || 0) + Number(p.absenceDeduction || 0);
      netPayroll += Number(p.netSalary || 0);
    }

    const housing = Math.round(allowances * 0.6 * 100) / 100;
    const transport = Math.round(allowances * 0.4 * 100) / 100;
    const grossPayroll = basicSalary + housing + transport + overtime;

    return {
      breakdown: {
        basicSalary: Math.round(basicSalary * 100) / 100,
        housingAllowance: housing,
        transportAllowance: transport,
        overtime: Math.round(overtime * 100) / 100,
        grossPayroll: Math.round(grossPayroll * 100) / 100,
        deductions: Math.round(deductions * 100) / 100,
        netPayrollPayable: Math.round(netPayroll * 100) / 100,
      },
      employeeCount: payrollRecords.length,
    };
  }
}
