import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
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
    const body = await request.json();

    if (Array.isArray(body)) {
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
            markedBy: user?.id || null,
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
            markedBy: user?.id || null,
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
        markedBy: user?.id || null,
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
        markedBy: user?.id || null,
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json(
        { error: "Missing attendance ID" },
        { status: 400 },
      );

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
