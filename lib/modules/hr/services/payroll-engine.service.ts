import prisma from "@/lib/prisma";
import { AttendanceService } from "./attendance.service";

export interface PayrollItemDto {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  bankName?: string | null;
  iban?: string | null;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  daysPresent: number;
  daysAbsent: number;
  overtimeHours: number;
  overtimeAmount: number;
  absenceDeductions: number;
  otherDeductions: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
}

export interface PayrollBatchDetailsDto {
  batchNumber: string;
  month: number;
  year: number;
  monthName: string;
  status: "DRAFT" | "REVIEWED" | "APPROVED" | "PAID";
  approvedAt: string | null;
  paymentDate: string | null;
  totalEmployees: number;
  totalBasicSalary: number;
  totalHousingAllowance: number;
  totalTransportAllowance: number;
  totalOtherAllowances: number;
  totalOvertimeAmount: number;
  totalGrossPayroll: number;
  totalDeductions: number;
  totalNetPayroll: number;
  items: PayrollItemDto[];
  accountingGlEntries: {
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }[];
}

// In-memory status store for batch state transition persistence
const batchStateStore = new Map<string, { status: "DRAFT" | "REVIEWED" | "APPROVED" | "PAID"; approvedAt?: string; paymentDate?: string }>();

export class PayrollEngineService {
  /**
   * Calculates or retrieves the comprehensive monthly payroll batch
   */
  public static async getPayrollBatch(month: number, year: number): Promise<PayrollBatchDetailsDto> {
    const batchKey = `${year}-${String(month).padStart(2, "0")}`;
    const batchNumber = `PAY-${year}${String(month).padStart(2, "0")}`;
    const monthName = new Date(year, month - 1, 1).toLocaleString("default", { month: "long" });

    const state = batchStateStore.get(batchKey) || { status: "DRAFT" };

    // 1. Fetch active employees
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        department: true,
        designation: true,
        basicSalary: true,
        housingAllowance: true,
        transportAllowance: true,
        otherAllowances: true,
        bankName: true,
        iban: true,
      },
      orderBy: { employeeCode: "asc" },
    });

    // 2. Fetch attendance for this month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const attendances = await prisma.dailyAttendance.findMany({
      where: {
        attendanceDate: { gte: startOfMonth, lte: endOfMonth },
      },
      select: {
        employeeId: true,
        status: true,
        overtimeHours: true,
      },
    });

    // Aggregate attendance per employee
    const attMap = new Map<string, { present: number; absent: number; otHours: number }>();
    for (const a of attendances) {
      const cur = attMap.get(a.employeeId) || { present: 0, absent: 0, otHours: 0 };
      if (a.status === "PRESENT" || a.status === "LATE" || a.status === "HALF_DAY") {
        cur.present++;
      } else if (a.status === "ABSENT") {
        cur.absent++;
      }
      cur.otHours += Number(a.overtimeHours || 0);
      attMap.set(a.employeeId, cur);
    }

    // 3. Fetch approved unpaid leaves in this month
    const unpaidLeaves = await prisma.leaveRequest.findMany({
      where: {
        leaveType: "UNPAID",
        status: "APPROVED",
        startDate: { lte: endOfMonth },
        endDate: { gte: startOfMonth },
      },
      select: {
        employeeId: true,
        totalDays: true,
      },
    });

    const unpaidDaysMap = new Map<string, number>();
    for (const ul of unpaidLeaves) {
      unpaidDaysMap.set(ul.employeeId, (unpaidDaysMap.get(ul.employeeId) || 0) + Number(ul.totalDays || 0));
    }

    // 4. Calculate line items
    const items: PayrollItemDto[] = [];
    let totBasic = 0;
    let totHousing = 0;
    let totTransport = 0;
    let totOther = 0;
    let totOvertime = 0;
    let totDeductions = 0;
    let totGross = 0;
    let totNet = 0;

    for (const emp of employees) {
      const fullName = `${emp.firstName} ${emp.lastName}`.trim();
      const basic = Number(emp.basicSalary || 0);
      const housing = Number(emp.housingAllowance || 0);
      const transport = Number(emp.transportAllowance || 0);
      const other = Number(emp.otherAllowances || 0);

      const att = attMap.get(emp.id) || { present: 26, absent: 0, otHours: 0 };
      const unpaidDays = unpaidDaysMap.get(emp.id) || 0;
      const totalAbsentDays = att.absent + unpaidDays;

      // Hourly wage = Basic / (30 * 8)
      const hourlyRate = basic / (30 * 8);
      const overtimePay = Math.round(att.otHours * hourlyRate * 1.25 * 100) / 100;

      // Daily wage = Basic / 30
      const absenceDeduction = Math.round((basic / 30) * totalAbsentDays * 100) / 100;
      const otherDed = 0;
      const employeeDeductions = absenceDeduction + otherDed;

      const gross = basic + housing + transport + other + overtimePay;
      const net = Math.max(0, gross - employeeDeductions);

      totBasic += basic;
      totHousing += housing;
      totTransport += transport;
      totOther += other;
      totOvertime += overtimePay;
      totGross += gross;
      totDeductions += employeeDeductions;
      totNet += net;

      items.push({
        id: `item_${emp.id}_${batchKey}`,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: fullName,
        department: emp.department || "Operations",
        designation: emp.designation || "Staff",
        bankName: emp.bankName,
        iban: emp.iban,
        basicSalary: basic,
        housingAllowance: housing,
        transportAllowance: transport,
        otherAllowances: other,
        daysPresent: att.present,
        daysAbsent: totalAbsentDays,
        overtimeHours: att.otHours,
        overtimeAmount: overtimePay,
        absenceDeductions: absenceDeduction,
        otherDeductions: otherDed,
        grossSalary: Math.round(gross * 100) / 100,
        totalDeductions: Math.round(employeeDeductions * 100) / 100,
        netSalary: Math.round(net * 100) / 100,
      });
    }

    // Double entry GL journal breakdown
    const accountingGlEntries = [
      { accountCode: "5101", accountName: "Basic Salaries Expense", debit: Math.round(totBasic * 100) / 100, credit: 0 },
      { accountCode: "5102", accountName: "Housing Allowance Expense", debit: Math.round(totHousing * 100) / 100, credit: 0 },
      { accountCode: "5103", accountName: "Transport Allowance Expense", debit: Math.round(totTransport * 100) / 100, credit: 0 },
      { accountCode: "5104", accountName: "Overtime Pay Expense", debit: Math.round(totOvertime * 100) / 100, credit: 0 },
      { accountCode: "2105", accountName: "Accrued Salaries & Payroll Payable", debit: 0, credit: Math.round(totNet * 100) / 100 },
    ];

    if (totDeductions > 0) {
      accountingGlEntries.push({
        accountCode: "1105",
        accountName: "Staff Advances / Absence Offsets",
        debit: 0,
        credit: Math.round(totDeductions * 100) / 100,
      });
    }

    return {
      batchNumber,
      month,
      year,
      monthName,
      status: state.status,
      approvedAt: state.approvedAt || null,
      paymentDate: state.paymentDate || null,
      totalEmployees: employees.length,
      totalBasicSalary: Math.round(totBasic * 100) / 100,
      totalHousingAllowance: Math.round(totHousing * 100) / 100,
      totalTransportAllowance: Math.round(totTransport * 100) / 100,
      totalOtherAllowances: Math.round(totOther * 100) / 100,
      totalOvertimeAmount: Math.round(totOvertime * 100) / 100,
      totalGrossPayroll: Math.round(totGross * 100) / 100,
      totalDeductions: Math.round(totDeductions * 100) / 100,
      totalNetPayroll: Math.round(totNet * 100) / 100,
      items,
      accountingGlEntries,
    };
  }

  /**
   * Transition batch lifecycle state (REVIEWED -> APPROVED -> PAID)
   */
  public static async updateBatchStatus(
    month: number,
    year: number,
    newStatus: "REVIEWED" | "APPROVED" | "PAID",
    userId: string
  ) {
    const batchKey = `${year}-${String(month).padStart(2, "0")}`;
    const current = batchStateStore.get(batchKey) || { status: "DRAFT" };

    const now = new Date().toISOString();
    const updated = {
      status: newStatus,
      approvedAt: newStatus === "APPROVED" || newStatus === "PAID" ? current.approvedAt || now : undefined,
      paymentDate: newStatus === "PAID" ? now.slice(0, 10) : undefined,
    };

    batchStateStore.set(batchKey, updated);
    return updated;
  }
}
