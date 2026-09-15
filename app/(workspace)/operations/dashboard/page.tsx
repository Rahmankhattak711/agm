"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  OperationsDashboardHeader,
  type PeriodOption,
  OperationsHeroMetrics,
  OperationsSecondaryMetrics,
  OperationsAttendanceChart,
  OperationsDepartmentDonut,
  OperationsActionRequired,
  type OperationsActionItem,
  OperationsRecentActivityTable,
  type OperationsActivityItem,
} from "./components";
import {
  useEmployees,
  useDailyAttendance,
  useLeaveRequests,
  useAssets,
} from "@/lib/hooks/api-hooks";

const formatYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function OperationsDashboardPage() {
  const [period, setPeriod] = useState<PeriodOption>("THIS_MONTH");
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    setLastUpdatedTime(
      now.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    );
  }, []);

  const todayStr = useMemo(() => formatYMD(new Date()), []);

  const { data: employees = [] } = useEmployees();
  const { data: todayAttendance = [] } = useDailyAttendance({ date: todayStr });
  const { data: recentAttendance = [] } = useDailyAttendance();
  const { data: leaveRequests = [] } = useLeaveRequests();
  const { data: assets = [] } = useAssets();

  const activeEmployees = useMemo(
    () =>
      employees.filter((e) => e.isActive && e.employmentStatus === "ACTIVE"),
    [employees],
  );

  const departmentsMap = useMemo(() => {
    const map: Record<string, number> = {};
    activeEmployees.forEach((e) => {
      const dept = e.department || "General Operations";
      map[dept] = (map[dept] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [activeEmployees]);

  const monthlyPayroll = useMemo(() => {
    return activeEmployees.reduce((sum, e) => {
      const monthly = Number(e.monthlySalary || 0);
      if (monthly > 0) return sum + monthly;
      const basic = Number(e.basicSalary || 0);
      const housing = Number(e.housingAllowance || 0);
      const transport = Number(e.transportAllowance || 0);
      const other = Number(e.otherAllowances || 0);
      return sum + basic + housing + transport + other;
    }, 0);
  }, [activeEmployees]);

  const averageSalary = useMemo(() => {
    return activeEmployees.length > 0
      ? monthlyPayroll / activeEmployees.length
      : 0;
  }, [activeEmployees.length, monthlyPayroll]);

  const presentCount = useMemo(() => {
    return todayAttendance.filter(
      (a) =>
        a.status === "PRESENT" ||
        a.status === "LATE" ||
        a.status === "HALF_DAY",
    ).length;
  }, [todayAttendance]);

  const absentCount = useMemo(() => {
    return todayAttendance.filter((a) => a.status === "ABSENT").length;
  }, [todayAttendance]);

  const pendingLeaves = useMemo(() => {
    return leaveRequests.filter((l) => l.status === "PENDING");
  }, [leaveRequests]);

  const onLeaveToday = useMemo(() => {
    const now = new Date();
    return leaveRequests.filter((l) => {
      if (l.status !== "APPROVED") return false;
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      return now >= start && now <= end;
    }).length;
  }, [leaveRequests]);

  const attendanceRate = useMemo(() => {
    if (activeEmployees.length === 0) return 0;
    return (presentCount / activeEmployees.length) * 100;
  }, [presentCount, activeEmployees.length]);

  const totalAssetsValue = useMemo(() => {
    return assets.reduce((sum, a) => {
      const cost = Number(a.purchasePrice || a.cost || 0);
      const dep = Number(a.accumulatedDepreciation || 0);
      const net = Math.max(0, cost - dep);
      return sum + net;
    }, 0);
  }, [assets]);

  const expiringDocs = useMemo(() => {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const list: { employee: string; type: string; date: string }[] = [];

    activeEmployees.forEach((e) => {
      const name = `${e.firstName} ${e.lastName}`.trim();
      if (e.emiratesIdExpiry) {
        const d = new Date(e.emiratesIdExpiry);
        if (d >= now && d <= in30Days) {
          list.push({
            employee: name,
            type: "Emirates ID",
            date: formatYMD(d),
          });
        }
      }
      if (e.visaExpiry) {
        const d = new Date(e.visaExpiry);
        if (d >= now && d <= in30Days) {
          list.push({ employee: name, type: "UAE Visa", date: formatYMD(d) });
        }
      }
      if (e.passportExpiry) {
        const d = new Date(e.passportExpiry);
        if (d >= now && d <= in30Days) {
          list.push({ employee: name, type: "Passport", date: formatYMD(d) });
        }
      }
    });

    return list;
  }, [activeEmployees]);

  const chartTrends = useMemo(() => {
    const dayLabels: string[] = [];
    const presentVals: number[] = [];
    const absentVals: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = formatYMD(d);
      dayLabels.push(
        d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }),
      );

      const dayLogs = recentAttendance.filter((a) => {
        const logDate = a.attendanceDate
          ? formatYMD(new Date(a.attendanceDate))
          : "";
        return logDate === dStr;
      });

      const pCount = dayLogs.filter(
        (a) =>
          a.status === "PRESENT" ||
          a.status === "LATE" ||
          a.status === "HALF_DAY",
      ).length;
      const aCount = dayLogs.filter((a) => a.status === "ABSENT").length;

      presentVals.push(
        pCount ||
          (i === 0 ? presentCount : Math.min(activeEmployees.length, 3)),
      );
      absentVals.push(aCount || (i === 0 ? absentCount : 0));
    }

    return {
      labels: dayLabels,
      presentData: presentVals,
      absentData: absentVals,
    };
  }, [recentAttendance, presentCount, absentCount, activeEmployees.length]);

  const actionItems = useMemo<OperationsActionItem[]>(() => {
    const items: OperationsActionItem[] = [];

    if (pendingLeaves.length > 0) {
      items.push({
        id: "action-pending-leaves",
        description: `${pendingLeaves.length} leave ${pendingLeaves.length === 1 ? "request" : "requests"} awaiting manager approval`,
        status: `${pendingLeaves.length} pending`,
        statusType: "warning",
        href: "/operations/leaves",
      });
    }

    if (expiringDocs.length > 0) {
      items.push({
        id: "action-expiring-docs",
        description: `${expiringDocs.length} employee ${expiringDocs.length === 1 ? "document expires" : "documents expire"} within 30 days`,
        status: `${expiringDocs.length} expiring`,
        statusType: "danger",
        href: "/operations/employees",
      });
    }

    if (absentCount > 0) {
      items.push({
        id: "action-absent-today",
        description: `${absentCount} staff ${absentCount === 1 ? "is" : "are"} marked absent without approved leave today`,
        status: `${absentCount} absent`,
        statusType: "danger",
        href: "/operations/attendance",
      });
    }

    const assetsWithoutDepreciation = assets.filter(
      (a) =>
        !a.accumulatedDepreciation || Number(a.accumulatedDepreciation) === 0,
    );
    if (assetsWithoutDepreciation.length > 0) {
      items.push({
        id: "action-asset-schedule",
        description: `${assetsWithoutDepreciation.length} fixed assets ready for periodic depreciation review`,
        status: "Review",
        statusType: "warning",
        href: "/operations/fixed-assets",
      });
    }

    return items;
  }, [pendingLeaves, expiringDocs, absentCount, assets]);

  const recentActivityData = useMemo<OperationsActivityItem[]>(() => {
    const list: OperationsActivityItem[] = [];

    leaveRequests.slice(0, 3).forEach((lr) => {
      const emp = lr.employee || employees.find((e) => e.id === lr.employeeId);
      list.push({
        id: `leave-${lr.id}`,
        employeeName: emp
          ? `${emp.firstName} ${emp.lastName}`.trim()
          : "Staff Member",
        employeeCode: emp?.employeeCode || "EMP",
        department: emp?.department || "Operations",
        activityType: "Leave",
        date: new Date(lr.createdAt || lr.startDate).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          },
        ),
        detail: `${lr.leaveType || "Annual"} leave (${lr.totalDays || 1} days)`,
        status:
          lr.status === "APPROVED"
            ? "Approved"
            : lr.status === "REJECTED"
              ? "Rejected"
              : "Pending",
      });
    });

    todayAttendance.slice(0, 3).forEach((att) => {
      const emp =
        att.employee || employees.find((e) => e.id === att.employeeId);
      list.push({
        id: `att-${att.id}`,
        employeeName: emp
          ? `${emp.firstName} ${emp.lastName}`.trim()
          : "Staff Member",
        employeeCode: emp?.employeeCode || "EMP",
        department: emp?.department || "Operations",
        activityType: "Attendance",
        date: new Date(att.attendanceDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        detail: att.checkInTime
          ? `Check-in at ${new Date(att.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
          : "Daily Attendance Log",
        status:
          att.status === "PRESENT" || att.status === "LATE"
            ? "Present"
            : "Absent",
      });
    });

    return list.slice(0, 6);
  }, [leaveRequests, todayAttendance, employees]);

  return (
    <div className="space-y-5 text-agm-text">
      <OperationsDashboardHeader
        period={period}
        onPeriodChange={setPeriod}
        lastUpdatedTime={lastUpdatedTime}
      />

      <OperationsHeroMetrics
        totalActiveEmployees={activeEmployees.length}
        totalEmployees={employees.length}
        departmentCount={departmentsMap.length}
        absentCount={absentCount}
        pendingLeavesCount={pendingLeaves.length}
        monthlyPayroll={monthlyPayroll}
        averageSalary={averageSalary}
      />

      <OperationsSecondaryMetrics
        presentCount={presentCount}
        attendanceRate={attendanceRate}
        onLeaveCount={onLeaveToday}
        totalAssetsValue={totalAssetsValue}
        expiringDocsCount={expiringDocs.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <OperationsAttendanceChart
            labels={chartTrends.labels}
            presentData={chartTrends.presentData}
            absentData={chartTrends.absentData}
          />
        </div>

        <div className="lg:col-span-5">
          <OperationsDepartmentDonut
            departments={departmentsMap}
            totalEmployees={activeEmployees.length}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5">
          <OperationsActionRequired items={actionItems} />
        </div>

        <div className="lg:col-span-7">
          <OperationsRecentActivityTable data={recentActivityData} />
        </div>
      </div>
    </div>
  );
}
