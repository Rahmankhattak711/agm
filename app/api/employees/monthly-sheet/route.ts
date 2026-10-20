import {
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
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");

    const now = new Date();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    if (month < 1 || month > 12 || isNaN(month) || isNaN(year)) {
      return NextResponse.json(
        { error: "Invalid month or year provided" },
        { status: 400 },
      );
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    const monthNames = [
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
    const monthName = monthNames[month - 1];

    if (employeeId && employeeId !== "all") {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        return NextResponse.json(
          { error: "Employee record not found" },
          { status: 404 },
        );
      }

      const attendances = await prisma.dailyAttendance.findMany({
        where: {
          employeeId,
          attendanceDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        orderBy: { attendanceDate: "asc" },
      });

      const attendanceMap = new Map<string, (typeof attendances)[0]>();
      for (const att of attendances) {
        const dateKey = new Date(att.attendanceDate)
          .toISOString()
          .split("T")[0];
        attendanceMap.set(dateKey, att);
      }

      const bonuses = await prisma.bonus.findMany({
        where: {
          employeeId,
          isApproved: true,
          OR: [
            { month, year },
            {
              createdAt: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          ],
        },
      });

      const totalBonusAmount = bonuses.reduce(
        (sum, b) => sum + Number(b.amount || 0),
        0,
      );

      const leaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId,
          status: "APPROVED",
          startDate: { lte: endOfMonth },
          endDate: { gte: startOfMonth },
        },
      });

      const savedPayroll = await prisma.payrollRecord.findUnique({
        where: {
          employeeId_month_year: {
            employeeId,
            month,
            year,
          },
        },
      });

      const dailyRecords = [];
      let daysPresent = 0;
      let daysAbsent = 0;
      let daysLate = 0;
      let totalLateMinutes = 0;
      let daysOnLeave = 0;
      let weekendHolidayDays = 0;
      let totalWorkingHours = 0;
      let totalOvertimeHours = 0;

      for (let day = 1; day <= totalDaysInMonth; day++) {
        const currentDate = new Date(year, month - 1, day);
        const dateStr = currentDate.toISOString().split("T")[0];
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        const dayName = currentDate.toLocaleDateString("en-US", {
          weekday: "short",
        });

        const overlappingLeave = leaves.find((l) => {
          const lStart = new Date(l.startDate);
          const lEnd = new Date(l.endDate);
          return currentDate >= lStart && currentDate <= lEnd;
        });

        const att = attendanceMap.get(dateStr);

        let status: string;
        let checkInTime: string | null = null;
        let checkOutTime: string | null = null;
        let workingHours = 0;
        let overtimeHours = 0;
        let lateMinutes = 0;
        let location = "";
        let notes = "";

        if (att) {
          status = att.status;
          checkInTime = att.checkInTime
            ? new Date(att.checkInTime).toISOString()
            : null;
          checkOutTime = att.checkOutTime
            ? new Date(att.checkOutTime).toISOString()
            : null;
          workingHours = Number(att.workingHours || 0);
          overtimeHours = Number(att.overtimeHours || 0);
          lateMinutes = att.lateMinutes || 0;
          location = att.location || "";
          notes = att.notes || "";
        } else if (overlappingLeave) {
          status = "ON_LEAVE";
          notes = `Approved ${overlappingLeave.leaveType} Leave`;
        } else if (isWeekend) {
          status = "WEEKEND";
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (currentDate < today) {
            status = "ABSENT";
          } else {
            status = "SCHEDULED";
          }
        }

        if (status === "PRESENT") {
          daysPresent += 1;
          totalWorkingHours += workingHours || 8;
        } else if (status === "LATE") {
          daysPresent += 1;
          daysLate += 1;
          totalLateMinutes += lateMinutes;
          totalWorkingHours += workingHours || 8;
        } else if (status === "HALF_DAY") {
          daysPresent += 0.5;
          totalWorkingHours += workingHours || 4;
        } else if (status === "ABSENT") {
          daysAbsent += 1;
        } else if (status === "ON_LEAVE") {
          daysOnLeave += 1;
        } else if (status === "WEEKEND" || status === "HOLIDAY") {
          weekendHolidayDays += 1;
        }

        totalOvertimeHours += overtimeHours;

        dailyRecords.push({
          dayNumber: day,
          date: dateStr,
          dayName,
          isWeekend,
          status,
          checkInTime,
          checkOutTime,
          workingHours,
          overtimeHours,
          lateMinutes,
          location,
          notes,
        });
      }

      const basicSalary = Number(employee.basicSalary || 0);
      const housingAllowance = Number(employee.housingAllowance || 0);
      const transportAllowance = Number(employee.transportAllowance || 0);
      const otherAllowances = Number(employee.otherAllowances || 0);
      const totalAllowances =
        housingAllowance + transportAllowance + otherAllowances;
      const grossSalary = basicSalary + totalAllowances;

      const hourlyRate = basicSalary > 0 ? basicSalary / 240 : 0;
      const calculatedOvertimeAmount =
        Math.round(hourlyRate * 1.25 * totalOvertimeHours * 100) / 100;

      const dailyRate = Math.round((basicSalary / 30) * 100) / 100;
      const calculatedAbsenceDeduction =
        Math.round(dailyRate * daysAbsent * 100) / 100;

      const overtimeAmount =
        savedPayroll?.overtimeAmount !== undefined &&
        savedPayroll?.overtimeAmount !== null
          ? Number(savedPayroll.overtimeAmount)
          : calculatedOvertimeAmount;

      const bonusAmount =
        savedPayroll?.bonusAmount !== undefined &&
        savedPayroll?.bonusAmount !== null
          ? Number(savedPayroll.bonusAmount)
          : totalBonusAmount;

      const absenceDeduction =
        savedPayroll?.absenceDeduction !== undefined &&
        savedPayroll?.absenceDeduction !== null
          ? Number(savedPayroll.absenceDeduction)
          : calculatedAbsenceDeduction;

      const otherDeductions =
        savedPayroll?.otherDeductions !== undefined &&
        savedPayroll?.otherDeductions !== null
          ? Number(savedPayroll.otherDeductions)
          : 0;

      const totalDeductions = absenceDeduction + otherDeductions;

      const netSalary =
        savedPayroll?.netSalary !== undefined &&
        savedPayroll?.netSalary !== null
          ? Number(savedPayroll.netSalary)
          : Math.max(
              0,
              Math.round(
                (grossSalary + overtimeAmount + bonusAmount - totalDeductions) *
                  100,
              ) / 100,
            );

      const payroll = {
        payrollRecordId: savedPayroll?.id || null,
        basicSalary,
        housingAllowance,
        transportAllowance,
        otherAllowances,
        totalAllowances,
        grossSalary,
        hourlyRate: Math.round(hourlyRate * 100) / 100,
        dailyRate,
        overtimeHours: totalOvertimeHours,
        overtimeAmount,
        bonusAmount,
        absenceDeduction,
        otherDeductions,
        totalDeductions,
        netSalary,
        isPaid: savedPayroll?.isPaid || false,
        paymentDate: savedPayroll?.paymentDate
          ? new Date(savedPayroll.paymentDate).toISOString().split("T")[0]
          : null,
        remarks: savedPayroll?.remarks || "",
        paymentMethod: employee.paymentMethod,
        bankName: employee.bankName || "",
        iban: employee.iban || "",
      };

      return NextResponse.json({
        employee: {
          id: employee.id,
          employeeCode: employee.employeeCode,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          department: employee.department || "Operations",
          designation: employee.designation || "Staff",
          joiningDate: employee.joiningDate,
          employmentStatus: employee.employmentStatus,
          contractType: employee.contractType,
          emiratesId: employee.emiratesId,
          emiratesIdExpiry: employee.emiratesIdExpiry,
          passportNo: employee.passportNo,
          passportExpiry: employee.passportExpiry,
          visaNumber: employee.visaNumber,
          visaExpiry: employee.visaExpiry,
          laborCardNo: employee.laborCardNo,
          laborCardExpiry: employee.laborCardExpiry,
          annualLeaveBalance: Number(employee.annualLeaveBalance || 30),
          paymentMethod: employee.paymentMethod,
          bankName: employee.bankName,
          iban: employee.iban,
        },
        period: {
          month,
          year,
          monthName,
          totalDaysInMonth,
          startDate: startOfMonth.toISOString().split("T")[0],
          endDate: endOfMonth.toISOString().split("T")[0],
        },
        attendanceSummary: {
          totalDays: totalDaysInMonth,
          daysPresent,
          daysAbsent,
          daysLate,
          totalLateMinutes,
          daysOnLeave,
          weekendHolidayDays,
          totalWorkingHours,
          totalOvertimeHours,
          attendanceRate:
            totalDaysInMonth - weekendHolidayDays > 0
              ? Math.round(
                  (daysPresent / (totalDaysInMonth - weekendHolidayDays)) * 100,
                )
              : 100,
        },
        dailyRecords,
        bonuses,
        leaves,
        payroll,
      });
    }

    const allEmployees = await prisma.employee.findMany({
      where: {
        employmentStatus: { in: ["ACTIVE", "ON_LEAVE"] },
      },
      orderBy: { employeeCode: "asc" },
    });

    const attendances = await prisma.dailyAttendance.findMany({
      where: {
        attendanceDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const savedPayrolls = await prisma.payrollRecord.findMany({
      where: {
        month,
        year,
      },
    });

    const payrollMap = new Map<string, (typeof savedPayrolls)[0]>();
    for (const pr of savedPayrolls) {
      payrollMap.set(pr.employeeId, pr);
    }

    const employeeAttendanceMap = new Map<string, typeof attendances>();
    for (const att of attendances) {
      const list = employeeAttendanceMap.get(att.employeeId) || [];
      list.push(att);
      employeeAttendanceMap.set(att.employeeId, list);
    }

    const employeeSheets = [];
    let workforceTotalGross = 0;
    let workforceTotalOvertime = 0;
    let workforceTotalBonuses = 0;
    let workforceTotalDeductions = 0;
    let workforceTotalNet = 0;
    let workforceTotalOvertimeHours = 0;
    let workforceTotalPresentDays = 0;

    for (const emp of allEmployees) {
      const empAtts = employeeAttendanceMap.get(emp.id) || [];
      const savedPR = payrollMap.get(emp.id);

      let pDays = 0;
      let aDays = 0;
      let otHours = 0;

      for (const att of empAtts) {
        if (att.status === "PRESENT" || att.status === "LATE") {
          pDays += 1;
        } else if (att.status === "HALF_DAY") {
          pDays += 0.5;
        } else if (att.status === "ABSENT") {
          aDays += 1;
        }
        otHours += Number(att.overtimeHours || 0);
      }

      const basic = Number(emp.basicSalary || 0);
      const allowances =
        Number(emp.housingAllowance || 0) +
        Number(emp.transportAllowance || 0) +
        Number(emp.otherAllowances || 0);
      const gross = basic + allowances;

      const hourlyRate = basic > 0 ? basic / 240 : 0;
      const otAmt =
        savedPR?.overtimeAmount !== undefined &&
        savedPR?.overtimeAmount !== null
          ? Number(savedPR.overtimeAmount)
          : Math.round(hourlyRate * 1.25 * otHours * 100) / 100;

      const bonusAmt =
        savedPR?.bonusAmount !== undefined && savedPR?.bonusAmount !== null
          ? Number(savedPR.bonusAmount)
          : 0;

      const dailyRate = Math.round((basic / 30) * 100) / 100;
      const absenceDed =
        savedPR?.absenceDeduction !== undefined &&
        savedPR?.absenceDeduction !== null
          ? Number(savedPR.absenceDeduction)
          : Math.round(dailyRate * aDays * 100) / 100;

      const otherDed =
        savedPR?.otherDeductions !== undefined &&
        savedPR?.otherDeductions !== null
          ? Number(savedPR.otherDeductions)
          : 0;

      const totalDed = absenceDed + otherDed;

      const net =
        savedPR?.netSalary !== undefined && savedPR?.netSalary !== null
          ? Number(savedPR.netSalary)
          : Math.max(
              0,
              Math.round((gross + otAmt + bonusAmt - totalDed) * 100) / 100,
            );

      workforceTotalGross += gross;
      workforceTotalOvertime += otAmt;
      workforceTotalBonuses += bonusAmt;
      workforceTotalDeductions += totalDed;
      workforceTotalNet += net;
      workforceTotalOvertimeHours += otHours;
      workforceTotalPresentDays += pDays;

      employeeSheets.push({
        id: emp.id,
        employeeCode: emp.employeeCode,
        firstName: emp.firstName,
        lastName: emp.lastName,
        department: emp.department || "Operations",
        designation: emp.designation || "Staff",
        basicSalary: basic,
        allowances,
        grossSalary: gross,
        daysPresent: pDays,
        daysAbsent: aDays,
        overtimeHours: otHours,
        overtimeAmount: otAmt,
        bonusAmount: bonusAmt,
        deductions: totalDed,
        netSalary: net,
        paymentMethod: emp.paymentMethod,
        bankName: emp.bankName || "",
        iban: emp.iban || "",
        isPaid: savedPR?.isPaid || false,
        paymentDate: savedPR?.paymentDate
          ? new Date(savedPR.paymentDate).toISOString().split("T")[0]
          : null,
      });
    }

    return NextResponse.json({
      period: {
        month,
        year,
        monthName,
        totalDaysInMonth,
        startDate: startOfMonth.toISOString().split("T")[0],
        endDate: endOfMonth.toISOString().split("T")[0],
      },
      workforceStats: {
        totalEmployees: allEmployees.length,
        totalWorkforceGross: workforceTotalGross,
        totalOvertimeAmount: workforceTotalOvertime,
        totalBonuses: workforceTotalBonuses,
        totalDeductions: workforceTotalDeductions,
        totalNetPayroll: workforceTotalNet,
        totalOvertimeHours: workforceTotalOvertimeHours,
        averageDaysPresent:
          allEmployees.length > 0
            ? Math.round(
                (workforceTotalPresentDays / allEmployees.length) * 10,
              ) / 10
            : 0,
      },
      employeeSheets,
    });
  } catch (error) {
    console.error("Error generating monthly sheet report:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, "HR")) {
      return forbidden(
        "Forbidden: Only HR and Admins can update or lock monthly payroll records",
      );
    }

    const body = await request.json();
    const {
      employeeId,
      month,
      year,
      basicSalary,
      allowances,
      overtimeAmount,
      bonusAmount,
      absenceDeduction,
      otherDeductions,
      netSalary,
      daysPresent,
      daysAbsent,
      isPaid,
      paymentDate,
      remarks,
    } = body;

    if (!employeeId || !month || !year) {
      return NextResponse.json(
        { error: "Missing required fields: employeeId, month, year" },
        { status: 400 },
      );
    }

    const deductions =
      Number(absenceDeduction || 0) + Number(otherDeductions || 0);

    const record = await prisma.payrollRecord.upsert({
      where: {
        employeeId_month_year: {
          employeeId,
          month: Number(month),
          year: Number(year),
        },
      },
      update: {
        basicSalary: Number(basicSalary),
        allowances: Number(allowances || 0),
        overtimeAmount: Number(overtimeAmount || 0),
        bonusAmount: Number(bonusAmount || 0),
        absenceDeduction: Number(absenceDeduction || 0),
        otherDeductions: Number(otherDeductions || 0),
        deductions,
        netSalary: Number(netSalary),
        daysPresent:
          daysPresent !== undefined ? Number(daysPresent) : undefined,
        daysAbsent: daysAbsent !== undefined ? Number(daysAbsent) : undefined,
        isPaid: Boolean(isPaid),
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        remarks: remarks || null,
      },
      create: {
        employeeId,
        month: Number(month),
        year: Number(year),
        basicSalary: Number(basicSalary),
        allowances: Number(allowances || 0),
        overtimeAmount: Number(overtimeAmount || 0),
        bonusAmount: Number(bonusAmount || 0),
        absenceDeduction: Number(absenceDeduction || 0),
        otherDeductions: Number(otherDeductions || 0),
        deductions,
        netSalary: Number(netSalary),
        daysPresent:
          daysPresent !== undefined ? Number(daysPresent) : undefined,
        daysAbsent: daysAbsent !== undefined ? Number(daysAbsent) : undefined,
        isPaid: Boolean(isPaid),
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        remarks: remarks || null,
      },
    });

    return NextResponse.json(record, { status: 200 });
  } catch (error) {
    console.error("Error saving payroll record:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
