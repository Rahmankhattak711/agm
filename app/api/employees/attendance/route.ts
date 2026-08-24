import {
  canModifyResource,
  forbidden,
  getAuthUser,
  hasRole,
  unauthorized,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const date = searchParams.get("date");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    if (date) {
      const targetDate = new Date(date);
      where.attendanceDate = targetDate;
    } else if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      const startOfMonth = new Date(y, m - 1, 1);
      const endOfMonth = new Date(y, m, 0);
      where.attendanceDate = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    }

    const records = await prisma.dailyAttendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: true,
            designation: true,
          },
        },
        marker: { select: { fullName: true, email: true } },
      },
      orderBy: [{ attendanceDate: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const body = await request.json();

    if (Array.isArray(body)) {
      if (!hasRole(user, "HR")) {
        return forbidden(
          "Forbidden: Only HR and Admins can perform batch attendance operations",
        );
      }

      const results = [];
      for (const item of body) {
        const {
          employeeId,
          attendanceDate,
          checkInTime,
          checkOutTime,
          status,
          workingHours,
          overtimeHours,
          lateMinutes,
          location,
          notes,
        } = item;

        if (!employeeId || !attendanceDate) continue;

        const date = new Date(attendanceDate);
        const record = await prisma.dailyAttendance.upsert({
          where: {
            employeeId_attendanceDate: {
              employeeId,
              attendanceDate: date,
            },
          },
          update: {
            checkInTime: checkInTime ? new Date(checkInTime) : null,
            checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
            status: status || "PRESENT",
            workingHours:
              workingHours !== undefined ? Number(workingHours) : null,
            overtimeHours:
              overtimeHours !== undefined ? Number(overtimeHours) : 0,
            lateMinutes: lateMinutes !== undefined ? Number(lateMinutes) : 0,
            location: location?.trim() || null,
            notes: notes?.trim() || null,
            markedBy: user.id,
          },
          create: {
            employeeId,
            attendanceDate: date,
            checkInTime: checkInTime ? new Date(checkInTime) : null,
            checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
            status: status || "PRESENT",
            workingHours:
              workingHours !== undefined ? Number(workingHours) : null,
            overtimeHours:
              overtimeHours !== undefined ? Number(overtimeHours) : 0,
            lateMinutes: lateMinutes !== undefined ? Number(lateMinutes) : 0,
            location: location?.trim() || null,
            notes: notes?.trim() || null,
            markedBy: user.id,
          },
        });
        results.push(record);
      }
      return NextResponse.json(results, { status: 201 });
    }

    const {
      employeeId,
      attendanceDate,
      checkInTime,
      checkOutTime,
      status,
      workingHours,
      overtimeHours,
      lateMinutes,
      location,
      notes,
    } = body;

    if (!employeeId || !attendanceDate) {
      return NextResponse.json(
        { error: "Employee ID and Attendance Date are required" },
        { status: 400 },
      );
    }

    if (employeeId !== user.id && !hasRole(user, "HR")) {
      return forbidden(
        "Forbidden: You can only record your own attendance unless you are HR or Admin",
      );
    }

    const date = new Date(attendanceDate);
    const created = await prisma.dailyAttendance.upsert({
      where: {
        employeeId_attendanceDate: {
          employeeId,
          attendanceDate: date,
        },
      },
      update: {
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
        status: status || "PRESENT",
        workingHours: workingHours !== undefined ? Number(workingHours) : null,
        overtimeHours: overtimeHours !== undefined ? Number(overtimeHours) : 0,
        lateMinutes: lateMinutes !== undefined ? Number(lateMinutes) : 0,
        location: location?.trim() || null,
        notes: notes?.trim() || null,
        markedBy: user.id,
      },
      create: {
        employeeId,
        attendanceDate: date,
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
        status: status || "PRESENT",
        workingHours: workingHours !== undefined ? Number(workingHours) : null,
        overtimeHours: overtimeHours !== undefined ? Number(overtimeHours) : 0,
        lateMinutes: lateMinutes !== undefined ? Number(lateMinutes) : 0,
        location: location?.trim() || null,
        notes: notes?.trim() || null,
        markedBy: user.id,
      },
      include: {
        employee: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("Error creating attendance:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json(
        { error: "Missing attendance ID" },
        { status: 400 },
      );

    const existing = await prisma.dailyAttendance.findUnique({
      where: { id },
      select: { id: true, markedBy: true, employeeId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 },
      );
    }

    if (
      !canModifyResource(user, existing.markedBy || existing.employeeId, ["HR"])
    ) {
      return forbidden(
        "Forbidden: You cannot delete another user's attendance record",
      );
    }

    await prisma.dailyAttendance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
