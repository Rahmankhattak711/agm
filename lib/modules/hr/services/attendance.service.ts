import prisma from "@/lib/prisma";
import type { AttendanceStatus } from "@/app/generated/prisma";
import type {
  AttendanceFilterParams,
  AttendanceRecordDto,
  AttendanceRegisterSummary,
} from "../types";

export class AttendanceService {
  /**
   * Standard shift duration in hours before overtime begins
   */
  public static readonly STANDARD_SHIFT_HOURS = 8.0;

  /**
   * Overtime multipliers per UAE Labor Law
   */
  public static readonly OVERTIME_NORMAL_MULTIPLIER = 1.25;
  public static readonly OVERTIME_WEEKEND_MULTIPLIER = 1.5;

  /**
   * Retrieves attendance register records enriched with accounting impact
   */
  public static async getAttendanceRegister(
    params: AttendanceFilterParams
  ): Promise<{
    records: AttendanceRecordDto[];
    summary: AttendanceRegisterSummary;
  }> {
    const { rangeType = "daily", date, month, year, from, to, department, employeeId } = params;

    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let periodLabel = "";

    if (rangeType === "daily" || (!month && !from && date)) {
      const target = date ? new Date(date) : now;
      startDate = new Date(target);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(target);
      endDate.setHours(23, 59, 59, 999);
      periodLabel = `Daily Sheet: ${startDate.toISOString().slice(0, 10)}`;
    } else if (rangeType === "weekly") {
      const target = date ? new Date(date) : now;
      endDate = new Date(target);
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      periodLabel = `Weekly Sheet: ${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}`;
    } else if (rangeType === "monthly" || (month && year)) {
      const y = year || now.getFullYear();
      const m = month || now.getMonth() + 1;
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 0, 23, 59, 59, 999);
      periodLabel = `Monthly Sheet: ${startDate.toLocaleString("default", { month: "long" })} ${y}`;
    } else if (from && to) {
      startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      periodLabel = `Custom Range: ${from} to ${to}`;
    } else {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      periodLabel = `Daily Sheet: ${startDate.toISOString().slice(0, 10)}`;
    }

    // 1. Fetch all active employees (optionally filtered by department or employeeId)
    const employeeWhere: any = { isActive: true };
    if (department && department !== "ALL") {
      employeeWhere.department = department;
    }
    if (employeeId) {
      employeeWhere.id = employeeId;
    }

    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        department: true,
        designation: true,
        basicSalary: true,
      },
      orderBy: { employeeCode: "asc" },
    });

    // 2. Fetch attendance records in the specified date range
    const attendanceRecords = await prisma.dailyAttendance.findMany({
      where: {
        attendanceDate: {
          gte: startDate,
          lte: endDate,
        },
        ...(employeeId ? { employeeId } : {}),
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: true,
            designation: true,
            basicSalary: true,
          },
        },
      },
      orderBy: [{ attendanceDate: "asc" }, { employee: { employeeCode: "asc" } }],
    });

    // Create a lookup: key = `${employeeId}_${attendanceDateFormatted}`
    const attendanceMap = new Map<string, any>();
    for (const rec of attendanceRecords) {
      const dateKey = rec.attendanceDate.toISOString().slice(0, 10);
      attendanceMap.set(`${rec.employeeId}_${dateKey}`, rec);
    }

    // 4. Generate the enriched DTO list
    const dtos: AttendanceRecordDto[] = [];
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalLeave = 0;
    let totalWorkHours = 0;
    let totalOvertimeHours = 0;
    let totalEstimatedOvertimeCost = 0;

    // For single-day view, iterate over each employee to guarantee a row even if not marked
    const isSingleDay = startDate.toISOString().slice(0, 10) === endDate.toISOString().slice(0, 10);

    if (isSingleDay) {
      const dayKey = startDate.toISOString().slice(0, 10);
      for (const emp of employees) {
        const fullName = `${emp.firstName} ${emp.lastName}`.trim();
        const existing = attendanceMap.get(`${emp.id}_${dayKey}`);

        const workingHours =
          existing?.workingHours !== null && existing?.workingHours !== undefined
            ? Number(existing.workingHours)
            : null;
        const overtimeHours = existing ? Number(existing.overtimeHours || 0) : 0;
        const lateMinutes = existing ? Number(existing.lateMinutes || 0) : 0;
        const status: AttendanceStatus = existing ? existing.status : "ABSENT";

        // Hourly basic wage calculation: Basic / (30 days * 8 hours)
        const hourlyRate = Number(emp.basicSalary || 0) / (30 * 8);
        const dayOfWeek = startDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday in UAE
        const otMultiplier = isWeekend ? AttendanceService.OVERTIME_WEEKEND_MULTIPLIER : AttendanceService.OVERTIME_NORMAL_MULTIPLIER;
        const estimatedOtCost = Math.round(overtimeHours * hourlyRate * otMultiplier * 100) / 100;
        const absenceDeduction = status === "ABSENT" ? Math.round((Number(emp.basicSalary || 0) / 30) * 100) / 100 : 0;

        if (status === "PRESENT") totalPresent++;
        else if (status === "LATE" || status === "HALF_DAY") { totalPresent++; totalLate++; }
        else if (status === "ON_LEAVE") totalLeave++;
        else totalAbsent++;

        if (workingHours !== null) {
          totalWorkHours += workingHours;
        }
        totalOvertimeHours += overtimeHours;
        totalEstimatedOvertimeCost += estimatedOtCost;

        dtos.push({
          id: existing?.id || `draft_${emp.id}_${dayKey}`,
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          employeeName: fullName,
          department: emp.department || "General",
          designation: emp.designation || "Staff",
          attendanceDate: dayKey,
          checkInTime: existing?.checkInTime ? new Date(existing.checkInTime).toISOString() : null,
          checkOutTime: existing?.checkOutTime ? new Date(existing.checkOutTime).toISOString() : null,
          status,
          workingHours,
          overtimeHours,
          lateMinutes,
          location: existing?.location || null,
          notes: existing?.notes || null,
          accountingImpact: {
            overtimeRateMultiplier: otMultiplier,
            estimatedOvertimeCost: estimatedOtCost,
            glOvertimeAccount: "5104 Overtime Pay Expense",
            isUnexcusedAbsence: status === "ABSENT",
            absenceDeductionAmount: absenceDeduction,
          },
        });
      }
    } else {
      // Multi-day view: include all recorded records
      for (const rec of attendanceRecords) {
        const emp = rec.employee;
        const fullName = `${emp.firstName} ${emp.lastName}`.trim();
        const dateKey = rec.attendanceDate.toISOString().slice(0, 10);

        const workingHours =
          rec.workingHours !== null && rec.workingHours !== undefined
            ? Number(rec.workingHours)
            : null;
        const overtimeHours = Number(rec.overtimeHours || 0);
        const lateMinutes = Number(rec.lateMinutes || 0);
        const status = rec.status;

        const hourlyRate = Number(emp.basicSalary || 0) / (30 * 8);
        const d = rec.attendanceDate.getDay();
        const isWeekend = d === 0 || d === 6;
        const otMultiplier = isWeekend ? AttendanceService.OVERTIME_WEEKEND_MULTIPLIER : AttendanceService.OVERTIME_NORMAL_MULTIPLIER;
        const estimatedOtCost = Math.round(overtimeHours * hourlyRate * otMultiplier * 100) / 100;
        const absenceDeduction = status === "ABSENT" ? Math.round((Number(emp.basicSalary || 0) / 30) * 100) / 100 : 0;

        if (status === "PRESENT") totalPresent++;
        else if (status === "LATE" || status === "HALF_DAY") { totalPresent++; totalLate++; }
        else if (status === "ON_LEAVE") totalLeave++;
        else totalAbsent++;

        if (workingHours !== null) {
          totalWorkHours += workingHours;
        }
        totalOvertimeHours += overtimeHours;
        totalEstimatedOvertimeCost += estimatedOtCost;

        dtos.push({
          id: rec.id,
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          employeeName: fullName,
          department: emp.department || "General",
          designation: emp.designation || "Staff",
          attendanceDate: dateKey,
          checkInTime: rec.checkInTime ? new Date(rec.checkInTime).toISOString() : null,
          checkOutTime: rec.checkOutTime ? new Date(rec.checkOutTime).toISOString() : null,
          status,
          workingHours,
          overtimeHours,
          lateMinutes,
          location: rec.location || null,
          notes: rec.notes || null,
          accountingImpact: {
            overtimeRateMultiplier: otMultiplier,
            estimatedOvertimeCost: estimatedOtCost,
            glOvertimeAccount: "5104 Overtime Pay Expense",
            isUnexcusedAbsence: status === "ABSENT",
            absenceDeductionAmount: absenceDeduction,
          },
        });
      }
    }

    return {
      records: dtos,
      summary: {
        periodLabel,
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        totalEmployees: employees.length,
        presentCount: totalPresent,
        absentCount: totalAbsent,
        lateCount: totalLate,
        leaveCount: totalLeave,
        totalWorkingHours: Math.round(totalWorkHours * 10) / 10,
        totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
        estimatedTotalOvertimeCost: Math.round(totalEstimatedOvertimeCost * 100) / 100,
      },
    };
  }

  /**
   * Upsert single attendance record with calculated hours or explicit HR overrides
   */
  public static async recordAttendance(input: {
    employeeId: string;
    attendanceDate: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    status?: AttendanceStatus;
    workingHours?: number | null;
    overtimeHours?: number | null;
    location?: string | null;
    notes?: string | null;
    markedById?: string | null;
    reopenShift?: boolean;
  }) {
    const {
      employeeId,
      attendanceDate,
      checkInTime,
      checkOutTime,
      status,
      workingHours: explicitWorkingHours,
      overtimeHours: explicitOvertimeHours,
      location,
      notes,
      markedById,
      reopenShift,
    } = input;
    const date = new Date(attendanceDate);

    let workingHours: number | null = explicitWorkingHours !== undefined ? explicitWorkingHours : null;
    let overtimeHours: number = explicitOvertimeHours !== undefined && explicitOvertimeHours !== null ? explicitOvertimeHours : 0;
    let computedStatus: AttendanceStatus = status || "PRESENT";

    // If explicit hours were NOT provided, auto-calculate from timestamps if both exist
    if (explicitWorkingHours === undefined && checkInTime && checkOutTime) {
      const inTime = new Date(checkInTime).getTime();
      const outTime = new Date(checkOutTime).getTime();
      if (outTime > inTime) {
        const diffHours = (outTime - inTime) / (1000 * 60 * 60);
        const elapsed = Math.round(diffHours * 100) / 100;
        if (elapsed <= AttendanceService.STANDARD_SHIFT_HOURS) {
          workingHours = elapsed;
          overtimeHours = 0;
        } else {
          // Flagged for HR review if auto-calculated without explicit HR input
          workingHours = null;
          overtimeHours = 0;
        }
      }
    }

    const updateData: any = {
      status: computedStatus,
      markedBy: markedById || null,
    };

    if (checkInTime !== undefined) {
      updateData.checkInTime = checkInTime ? new Date(checkInTime) : null;
    }

    // Only update checkOutTime if explicitly provided or reopenShift is true
    if (checkOutTime !== undefined) {
      updateData.checkOutTime = checkOutTime ? new Date(checkOutTime) : null;
    } else if (reopenShift) {
      updateData.checkOutTime = null;
    }

    if (workingHours !== undefined) {
      updateData.workingHours = workingHours;
    }
    if (explicitOvertimeHours !== undefined || (checkInTime && checkOutTime)) {
      updateData.overtimeHours = overtimeHours;
    }
    if (location !== undefined) {
      updateData.location = location || null;
    }
    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    const createData: any = {
      employeeId,
      attendanceDate: date,
      checkInTime: checkInTime ? new Date(checkInTime) : null,
      checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
      status: computedStatus,
      workingHours: workingHours ?? null,
      overtimeHours: overtimeHours ?? 0,
      location: location || null,
      notes: notes || null,
      markedBy: markedById || null,
    };

    return prisma.dailyAttendance.upsert({
      where: {
        employeeId_attendanceDate: {
          employeeId,
          attendanceDate: date,
        },
      },
      update: updateData,
      create: createData,
    });
  }

  /**
   * Bulk marks all active employees as present for standard 08:00 - 17:00 shift (Asia/Dubai)
   */
  public static async bulkMarkStandardDay(dateStr: string, markedById: string) {
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const date = new Date(dateStr);
    // 08:00 - 17:00 Asia/Dubai (UTC+4) is 04:00:00.000Z to 13:00:00.000Z
    const inTime = new Date(`${dateStr}T04:00:00.000Z`);
    const outTime = new Date(`${dateStr}T13:00:00.000Z`);

    const results = [];
    for (const emp of employees) {
      const rec = await prisma.dailyAttendance.upsert({
        where: {
          employeeId_attendanceDate: {
            employeeId: emp.id,
            attendanceDate: date,
          },
        },
        update: {
          checkInTime: inTime,
          checkOutTime: outTime,
          status: "PRESENT",
          workingHours: 8.0,
          overtimeHours: 0.0,
          notes: "Auto-marked standard workday shift (08:00 - 17:00)",
          markedBy: markedById,
        },
        create: {
          employeeId: emp.id,
          attendanceDate: date,
          checkInTime: inTime,
          checkOutTime: outTime,
          status: "PRESENT",
          workingHours: 8.0,
          overtimeHours: 0.0,
          notes: "Auto-marked standard workday shift (08:00 - 17:00)",
          markedBy: markedById,
        },
      });
      results.push(rec);
    }
    return results;
  }
}
