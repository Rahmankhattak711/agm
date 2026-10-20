import {
  MonthlySheetDailyRecord,
  WorkforceMonthlySheetItem,
  EmploymentStatus,
} from "@/lib/hooks/types";

export const MONTH_NAMES: readonly string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const WEEKDAY_SHORT_NAMES: readonly string[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

export function getMonthName(month: number): string {
  const index = Math.max(1, Math.min(12, month)) - 1;
  return MONTH_NAMES[index] || "";
}

export function getPrevPeriod(
  month: number,
  year: number,
): { month: number; year: number } {
  if (month === 1) {
    return { month: 12, year: year - 1 };
  }
  return { month: month - 1, year };
}

export function getNextPeriod(
  month: number,
  year: number,
): { month: number; year: number } {
  if (month === 12) {
    return { month: 1, year: year + 1 };
  }
  return { month: month + 1, year };
}

export function getAttendanceStatusBadge(status: string): string {
  switch (status) {
    case "PRESENT":
      return "bg-agm-green-soft text-agm-green-dark border-agm-green/30";
    case "LATE":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "HALF_DAY":
      return "bg-agm-box-bg text-agm-navy border-agm-box-border";
    case "ABSENT":
      return "bg-rose-50 text-rose-800 border-rose-200";
    case "ON_LEAVE":
      return "bg-purple-50 text-purple-800 border-purple-200";
    case "WEEKEND":
    case "HOLIDAY":
      return "bg-agm-box-bg text-agm-muted border-agm-box-border";
    default:
      return "bg-agm-box-bg text-agm-text border-agm-box-border";
  }
}

export function getEmploymentStatusBadge(
  status: EmploymentStatus | string,
): string {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "ON_LEAVE":
      return "bg-sky-50 text-sky-800 border-sky-200";
    case "SUSPENDED":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "TERMINATED":
    case "RESIGNED":
      return "bg-rose-50 text-rose-800 border-rose-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export interface CalendarSlot {
  isPadding: boolean;
  key: string;
  record: MonthlySheetDailyRecord | null;
}

export function generateCalendarGrid(
  dailyRecords: MonthlySheetDailyRecord[] | undefined,
  month: number,
  year: number,
): CalendarSlot[] {
  if (!dailyRecords?.length) return [];

  const firstDate = new Date(year, month - 1, 1);
  const startWeekday = (firstDate.getDay() + 6) % 7;

  const leadingPadding: CalendarSlot[] = Array.from({
    length: startWeekday,
  }).map((_, i) => ({
    isPadding: true,
    key: `pad-${i}`,
    record: null,
  }));

  const days: CalendarSlot[] = dailyRecords.map((record) => ({
    isPadding: false,
    key: record.date,
    record,
  }));

  return [...leadingPadding, ...days];
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportWorkforceWpsCsv(
  rows: WorkforceMonthlySheetItem[],
  monthName: string,
  year: number,
): void {
  const headers = [
    "Employee Code",
    "Full Name",
    "Department",
    "Designation",
    "Days Present",
    "Days Absent",
    "Overtime Hours",
    "Basic Salary (AED)",
    "Allowances (AED)",
    "Gross Salary (AED)",
    "Overtime Pay (AED)",
    "Bonuses (AED)",
    "Deductions (AED)",
    "Net Payable Salary (AED)",
    "Payment Method",
    "Bank Name",
    "IBAN",
    "Payment Status",
  ];

  const dataRows = rows.map((e) => [
    e.employeeCode,
    `"${e.firstName} ${e.lastName}"`,
    `"${e.department}"`,
    `"${e.designation}"`,
    e.daysPresent,
    e.daysAbsent,
    e.overtimeHours,
    e.basicSalary,
    e.allowances,
    e.grossSalary,
    e.overtimeAmount,
    e.bonusAmount,
    e.deductions,
    e.netSalary,
    e.paymentMethod,
    `"${e.bankName}"`,
    e.iban,
    e.isPaid ? "PAID" : "UNPAID",
  ]);

  downloadCsv(
    `AGM_WPS_Workforce_Payroll_${monthName}_${year}.csv`,
    headers,
    dataRows,
  );
}

export function exportEmployeeTimesheetCsv(
  dailyRecords: MonthlySheetDailyRecord[],
  employeeCode: string,
  monthName: string,
  year: number,
): void {
  const headers = [
    "Day",
    "Date",
    "Weekday",
    "Status",
    "Check In",
    "Check Out",
    "Working Hours",
    "Overtime Hours",
    "Late Minutes",
    "Notes",
  ];

  const rows = dailyRecords.map((r) => [
    r.dayNumber,
    r.date,
    r.dayName,
    r.status,
    r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString() : "",
    r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString() : "",
    r.workingHours,
    r.overtimeHours,
    r.lateMinutes,
    `"${r.notes || ""}"`,
  ]);

  downloadCsv(
    `timesheet_${employeeCode}_${monthName}_${year}.csv`,
    headers,
    rows,
  );
}
