import type { AttendanceStatus, UserRole } from "@/app/generated/prisma";

export type RoleCategory = "ADMINISTRATION" | "MANAGEMENT" | "OPERATIONS_FIELD";

export interface RoleDefinition {
  id: string;
  name: string;
  code: string;
  category: RoleCategory;
  description: string;
  defaultRoute: string;
  isFieldWorker: boolean;
  capabilities: {
    canAccessERP: boolean;
    canManageUsers: boolean;
    canApprovePayroll: boolean;
    canPostToLedger: boolean;
    canRecordAttendance: boolean;
    canViewFinancialReports: boolean;
  };
  permissions: {
    module: string;
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve?: boolean;
    export?: boolean;
  }[];
}

export interface WorkerProfile {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  department?: string | null;
  designation?: string | null;
  todayShift?: {
    attendanceId?: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    status: AttendanceStatus;
    workingHours?: number | null;
    overtimeHours?: number | null;
    location?: string | null;
  } | null;
}

export type AttendanceRangeType = "daily" | "weekly" | "monthly" | "custom";

export interface AttendanceFilterParams {
  rangeType?: AttendanceRangeType;
  date?: string; // YYYY-MM-DD
  month?: number; // 1-12
  year?: number; // YYYY
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  department?: string;
  employeeId?: string;
  search?: string;
}

export interface AttendanceRecordDto {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  designation: string;
  attendanceDate: string; // YYYY-MM-DD
  checkInTime: string | null; // HH:mm or ISO
  checkOutTime: string | null;
  status: AttendanceStatus;
  workingHours: number | null;
  overtimeHours: number;
  lateMinutes: number;
  location?: string | null;
  notes?: string | null;
  accountingImpact: {
    overtimeRateMultiplier: number; // 1.25 or 1.5
    estimatedOvertimeCost: number; // in AED
    glOvertimeAccount: string; // "5104 Overtime Pay Expense"
    isUnexcusedAbsence: boolean;
    absenceDeductionAmount: number; // in AED
  };
}

export interface AttendanceRegisterSummary {
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalEmployees: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  leaveCount: number;
  totalWorkingHours: number;
  totalOvertimeHours: number;
  estimatedTotalOvertimeCost: number;
}

export {
  publicEmployeeSelect,
  accountantEmployeeSelect,
  selfEmployeeSelect,
  accountantAttendanceSelect,
  accountantLeaveSelect,
  accountantBonusSelect,
} from "@/lib/auth-server";
