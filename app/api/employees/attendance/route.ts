import {
  forbidden,
  getAuthUser,
  getDubaiBusinessDate,
  hasRole,
  isHRorAdmin,
  resolveLinkedEmployee,
  unauthorized,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const requestedEmployeeId = searchParams.get("employeeId");
    const date = searchParams.get("date");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const isHrOrAdmin = isHRorAdmin(authUser);
    const isAccountant = hasRole(authUser, "ACCOUNTANT");

    const where: any = {};

    // USER role is strictly scoped to their own linked Employee record
    if (!isHrOrAdmin && !isAccountant) {
      const linkage = await resolveLinkedEmployee(authUser);
      if (linkage.status !== "MATCH") {
        return forbidden("Forbidden: No linked employee profile found for your account");
      }
      if (requestedEmployeeId && requestedEmployeeId !== linkage.employeeId) {
        return forbidden("Forbidden: You can only access your own attendance records");
      }
      where.employeeId = linkage.employeeId;
    } else if (requestedEmployeeId) {
      where.employeeId = requestedEmployeeId;
    }

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

    // Accountants must not receive sensitive physical location or confidential notes
    const isAccountantRestricted = isAccountant && !isHrOrAdmin;

    const records = await prisma.dailyAttendance.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        attendanceDate: true,
        checkInTime: true,
        checkOutTime: true,
        status: true,
        workingHours: true,
        overtimeHours: true,
        lateMinutes: true,
        location: isAccountantRestricted ? false : true,
        notes: isAccountantRestricted ? false : true,
        markedBy: true,
        createdAt: true,
        updatedAt: true,
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

    // 1. Batch operations are strictly restricted to HR / Admins
    if (Array.isArray(body)) {
      if (!isHRorAdmin(user)) {
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
              workingHours !== undefined && workingHours !== null ? Number(workingHours) : null,
            overtimeHours:
              overtimeHours !== undefined && overtimeHours !== null ? Number(overtimeHours) : 0,
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
              workingHours !== undefined && workingHours !== null ? Number(workingHours) : null,
            overtimeHours:
              overtimeHours !== undefined && overtimeHours !== null ? Number(overtimeHours) : 0,
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

    // 2. Explicit Self-Service Action: CLOCK_IN
    if (body.action === "CLOCK_IN") {
      const linkage = await resolveLinkedEmployee(user);
      if (linkage.status !== "MATCH") {
        return forbidden("Forbidden: No linked employee profile found for your account");
      }
      const employeeId = linkage.employeeId;

      const dubaiDateStr = getDubaiBusinessDate();
      const serverNow = new Date();
      const attendanceDate = new Date(dubaiDateStr);

      // Punctuality check in Asia/Dubai timezone (UTC+4): standard shift starts at 08:00 AM (04:00 UTC)
      // At or before 08:00:00 is PRESENT. Any time after 08:00 is LATE.
      const dubaiHours = (serverNow.getUTCHours() + 4) % 24;
      const dubaiMinutes = serverNow.getUTCMinutes();
      const isLate = dubaiHours > 8 || (dubaiHours === 8 && dubaiMinutes > 0);
      const lateMinutes = isLate ? (dubaiHours - 8) * 60 + dubaiMinutes : 0;
      const status = isLate ? "LATE" : "PRESENT";

      try {
        const record = await prisma.dailyAttendance.create({
          data: {
            employeeId,
            attendanceDate,
            checkInTime: serverNow,
            checkOutTime: null,
            status,
            workingHours: null,
            overtimeHours: 0,
            lateMinutes,
            location: body.location?.trim() || null,
            notes: body.notes?.trim() || null,
            markedBy: user.id,
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
              },
            },
          },
        });
        return NextResponse.json(record, { status: 201 });
      } catch (err: any) {
        // PostgreSQL unique composite index @@unique([employeeId, attendanceDate]) violation
        if (err.code === "P2002") {
          return NextResponse.json(
            { error: "Already clocked in for today" },
            { status: 400 }
          );
        }
        throw err;
      }
    }

    // 3. Explicit Self-Service Action: CLOCK_OUT
    if (body.action === "CLOCK_OUT") {
      const linkage = await resolveLinkedEmployee(user);
      if (linkage.status !== "MATCH") {
        return forbidden("Forbidden: No linked employee profile found for your account");
      }
      const employeeId = linkage.employeeId;

      const dubaiDateStr = getDubaiBusinessDate();
      const serverNow = new Date();
      const attendanceDate = new Date(dubaiDateStr);

      // Find active clock-in for today's Dubai business date
      const existing = await prisma.dailyAttendance.findFirst({
        where: {
          employeeId,
          attendanceDate,
          checkInTime: { not: null },
          checkOutTime: null,
        },
      });

      if (!existing || !existing.checkInTime) {
        return NextResponse.json(
          { error: "No active clock-in found for today" },
          { status: 400 }
        );
      }

      const elapsedMs = serverNow.getTime() - new Date(existing.checkInTime).getTime();
      if (elapsedMs < 0) {
        return NextResponse.json(
          { error: "Clock out time cannot precede clock in time" },
          { status: 400 }
        );
      }

      const elapsedHours = Math.round((elapsedMs / (1000 * 60 * 60)) * 100) / 100;
      let workingHours: number | null = null;
      let overtimeHours = 0;
      let auditNotes = existing.notes || null;

      if (elapsedHours <= 8.0) {
        workingHours = elapsedHours;
        overtimeHours = 0;
      } else {
        // Shifts > 8.0 hours: preserve raw timestamps, set workingHours = null, append audit note
        workingHours = null;
        overtimeHours = 0;
        const noteMsg = `Pending HR reconciliation: shift elapsed ${elapsedHours}h exceeds standard 8.0h limit without confirmed break policy.`;
        auditNotes = existing.notes ? `${existing.notes} | ${noteMsg}` : noteMsg;
      }

      // Atomic conditional update to prevent double-checkout race and protect against concurrent HR check-in edits
      const updateResult = await prisma.dailyAttendance.updateMany({
        where: {
          id: existing.id,
          checkInTime: existing.checkInTime,
          checkOutTime: null,
        },
        data: {
          checkOutTime: serverNow,
          workingHours,
          overtimeHours,
          notes: auditNotes,
        },
      });

      if (updateResult.count === 0) {
        const latest = await prisma.dailyAttendance.findUnique({
          where: { id: existing.id },
          select: { checkInTime: true, checkOutTime: true },
        });

        if (latest?.checkOutTime !== null) {
          return NextResponse.json(
            { error: "Shift already clocked out" },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: "Attendance record was modified concurrently by HR. Please refresh and try again." },
          { status: 409 }
        );
      }

      const updatedRecord = await prisma.dailyAttendance.findUnique({
        where: { id: existing.id },
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
        },
      });

      return NextResponse.json(updatedRecord, { status: 200 });
    }

    // 4. Manual attendance recording is strictly restricted to HR / Admins
    if (!isHRorAdmin(user)) {
      return forbidden(
        "Forbidden: Self-service attendance requires explicit CLOCK_IN or CLOCK_OUT action",
      );
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
        workingHours:
          workingHours !== undefined && workingHours !== null ? Number(workingHours) : null,
        overtimeHours:
          overtimeHours !== undefined && overtimeHours !== null ? Number(overtimeHours) : 0,
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
          workingHours !== undefined && workingHours !== null ? Number(workingHours) : null,
        overtimeHours:
          overtimeHours !== undefined && overtimeHours !== null ? Number(overtimeHours) : 0,
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

    if (!isHRorAdmin(user)) {
      return forbidden(
        "Forbidden: Only HR or Admins can delete attendance records",
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing attendance ID" },
        { status: 400 },
      );
    }

    const existing = await prisma.dailyAttendance.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attendance record not found" },
        { status: 404 },
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
