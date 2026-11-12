import {
  forbidden,
  getAuthUser,
  hasRole,
  isHRorAdmin,
  unauthorized,
} from "@/lib/auth-server";
import { AttendanceService } from "@/lib/modules/hr/services/attendance.service";
import type { AttendanceRangeType } from "@/lib/modules/hr/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const isHrOrAdmin = isHRorAdmin(user);
    const isAccountant = hasRole(user, "ACCOUNTANT");

    if (!isHrOrAdmin && !isAccountant) {
      return forbidden("Forbidden: Only HR, Admins, or Accountants can access attendance records");
    }

    const { searchParams } = new URL(request.url);
    const rangeType = (searchParams.get("rangeType") || "daily") as AttendanceRangeType;
    const date = searchParams.get("date") || undefined;
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!, 10) : undefined;
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined;
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;
    const department = searchParams.get("department") || undefined;
    const employeeId = searchParams.get("employeeId") || undefined;
    const search = searchParams.get("search") || undefined;

    const result = await AttendanceService.getAttendanceRegister({
      rangeType,
      date,
      month,
      year,
      from,
      to,
      department,
      employeeId,
      search,
    });

    // Accountants must not see sensitive physical location or confidential notes
    if (isAccountant && !isHrOrAdmin) {
      result.records = result.records.map((r) => ({
        ...r,
        location: null,
        notes: null,
      }));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching HR attendance register:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    if (!isHRorAdmin(user)) {
      return forbidden("Forbidden: Only HR or Admins can record or modify attendance records");
    }

    const body = await request.json();

    // Check for bulk standard day mark
    if (body.action === "BULK_STANDARD_DAY") {
      const targetDate = body.date || new Date().toISOString().slice(0, 10);
      const results = await AttendanceService.bulkMarkStandardDay(targetDate, user.id);
      return NextResponse.json({ success: true, count: results.length, records: results });
    }

    // Single or batch record
    if (Array.isArray(body)) {
      const created = [];
      for (const item of body) {
        if (!item.employeeId || !item.attendanceDate) continue;
        const res = await AttendanceService.recordAttendance({
          ...item,
          markedById: user.id,
        });
        created.push(res);
      }
      return NextResponse.json(created, { status: 201 });
    }

    const {
      employeeId,
      attendanceDate,
      checkInTime,
      checkOutTime,
      status,
      workingHours,
      overtimeHours,
      location,
      notes,
      reopenShift,
    } = body;

    if (!employeeId || !attendanceDate) {
      return NextResponse.json(
        { error: "Employee ID and Attendance Date are required" },
        { status: 400 }
      );
    }

    const record = await AttendanceService.recordAttendance({
      employeeId,
      attendanceDate,
      checkInTime,
      checkOutTime,
      status,
      workingHours: workingHours !== undefined && workingHours !== null ? Number(workingHours) : workingHours,
      overtimeHours: overtimeHours !== undefined && overtimeHours !== null ? Number(overtimeHours) : overtimeHours,
      location,
      notes,
      markedById: user.id,
      reopenShift,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Error recording attendance:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
