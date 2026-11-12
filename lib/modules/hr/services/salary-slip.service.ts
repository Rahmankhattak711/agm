import prisma from "@/lib/prisma";
import { PayrollEngineService } from "./payroll-engine.service";

export interface SalarySlipDto {
  id: string;
  slipNumber: string;
  batchNumber: string;
  month: number;
  year: number;
  periodLabel: string;
  companyInfo: {
    companyName: string;
    tradeLicense: string;
    trn: string;
    address: string;
    phone: string;
  };
  employeeInfo: {
    employeeId: string;
    employeeCode: string;
    employeeName: string;
    designation: string;
    department: string;
    bankName?: string | null;
    iban?: string | null;
  };
  earnings: {
    basicSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    otherAllowances: number;
    overtimeHours: number;
    overtimeAmount: number;
    grossSalary: number;
  };
  deductions: {
    daysAbsent: number;
    absenceDeductions: number;
    otherDeductions: number;
    totalDeductions: number;
  };
  netSalary: number;
  netSalaryInWords: string;
  status: "PAID" | "APPROVED" | "PENDING";
  paymentDate?: string | null;
}

function numberToWordsAED(num: number): string {
  const integerPart = Math.floor(num);
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (integerPart === 0) return "Zero AED Only";

  let words = "";

  if (Math.floor(integerPart / 1000) > 0) {
    const thousands = Math.floor(integerPart / 1000);
    if (thousands < 20) {
      words += ones[thousands] + " Thousand ";
    } else {
      words += tens[Math.floor(thousands / 10)] + " " + ones[thousands % 10] + " Thousand ";
    }
  }

  const remainder = integerPart % 1000;
  if (Math.floor(remainder / 100) > 0) {
    words += ones[Math.floor(remainder / 100)] + " Hundred ";
  }

  const lastTwo = remainder % 100;
  if (lastTwo > 0) {
    if (words !== "") words += "and ";
    if (lastTwo < 20) {
      words += ones[lastTwo] + " ";
    } else {
      words += tens[Math.floor(lastTwo / 10)] + " " + ones[lastTwo % 10] + " ";
    }
  }

  return `${words.trim()} Dirhams Only`;
}

export class SalarySlipService {
  /**
   * Generates or retrieves immutable salary slip objects for employees in period
   */
  public static async getSalarySlips(filter?: {
    month?: number;
    year?: number;
    employeeId?: string;
    search?: string;
  }): Promise<SalarySlipDto[]> {
    const now = new Date();
    const month = filter?.month || now.getMonth() + 1;
    const year = filter?.year || now.getFullYear();

    const batch = await PayrollEngineService.getPayrollBatch(month, year);
    const periodLabel = `${batch.monthName} ${year}`;

    const companyInfo = {
      companyName: "ARJT TRANSPORT LLC (AGM)",
      tradeLicense: "CN-2948210",
      trn: "10043245234522",
      address: "Al Quoz Industrial Area 3, Dubai, United Arab Emirates",
      phone: "+971 4 347 8890",
    };

    let items = batch.items;
    if (filter?.employeeId) {
      items = items.filter((i) => i.employeeId === filter.employeeId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.employeeName.toLowerCase().includes(q) ||
          i.employeeCode.toLowerCase().includes(q) ||
          i.department.toLowerCase().includes(q)
      );
    }

    return items.map((item) => {
      const slipNumber = `SLIP-${year}${String(month).padStart(2, "0")}-${item.employeeCode}`;

      return {
        id: `slip_${item.employeeId}_${year}_${month}`,
        slipNumber,
        batchNumber: batch.batchNumber,
        month,
        year,
        periodLabel,
        companyInfo,
        employeeInfo: {
          employeeId: item.employeeId,
          employeeCode: item.employeeCode,
          employeeName: item.employeeName,
          designation: item.designation,
          department: item.department,
          bankName: item.bankName,
          iban: item.iban,
        },
        earnings: {
          basicSalary: item.basicSalary,
          housingAllowance: item.housingAllowance,
          transportAllowance: item.transportAllowance,
          otherAllowances: item.otherAllowances,
          overtimeHours: item.overtimeHours,
          overtimeAmount: item.overtimeAmount,
          grossSalary: item.grossSalary,
        },
        deductions: {
          daysAbsent: item.daysAbsent,
          absenceDeductions: item.absenceDeductions,
          otherDeductions: item.otherDeductions,
          totalDeductions: item.totalDeductions,
        },
        netSalary: item.netSalary,
        netSalaryInWords: numberToWordsAED(item.netSalary),
        status: batch.status === "PAID" ? "PAID" : batch.status === "APPROVED" ? "APPROVED" : "PENDING",
        paymentDate: batch.paymentDate,
      };
    });
  }
}
