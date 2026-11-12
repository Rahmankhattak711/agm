"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Employee,
  useEmployeeMonthlySheet,
  useSaveMonthlyPayroll,
} from "@/lib/hooks/api-hooks";
import {
  AttendanceIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DollarSignIcon,
  SpinnerIcon,
} from "@/components/icons";
import { Button, Select } from "@/components/ui";
import {
  getAttendanceStatusBadge,
  generateCalendarGrid,
  getNextPeriod,
  getPrevPeriod,
  MONTH_NAMES,
  WEEKDAY_SHORT_NAMES,
} from "@/lib/utils";
import {
  EmployeeSheetStatement,
  PayrollAdjustmentValues,
} from "./EmployeeSheetStatement";
import { toast } from "@/lib/toast";

export interface EmployeeAttendanceSectionProps {
  employees: Employee[];
  selectedEmployeeId: string | null;
  onSelectEmployee: (id: string) => void;
  isHR?: boolean;
}

export function EmployeeAttendanceSection({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  isHR = false,
}: EmployeeAttendanceSectionProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    currentDate.getFullYear(),
  );

  const [viewMode, setViewMode] = useState<"table" | "heatmap" | "statement">(
    "table",
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);

  const savePayrollMutation = useSaveMonthlyPayroll();

  const handleSavePayroll = async (values: PayrollAdjustmentValues) => {
    if (!sheetData?.employee?.id) return;
    try {
      await savePayrollMutation.mutateAsync({
        employeeId: sheetData.employee.id,
        month: selectedMonth,
        year: selectedYear,
        ...values,
      });
      toast.success("Payroll statement updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update payroll figures");
    }
  };

  const currentEmployee = useMemo(() => {
    if (!employees.length) return null;
    return employees.find((e) => e.id === selectedEmployeeId) || employees[0];
  }, [employees, selectedEmployeeId]);

  const {
    data: sheetData,
    isLoading,
    error,
  } = useEmployeeMonthlySheet({
    employeeId: currentEmployee?.id,
    month: selectedMonth,
    year: selectedYear,
  });

  useEffect(() => {
    if (sheetData?.dailyRecords?.length) {
      const now = new Date();
      if (
        selectedMonth === now.getMonth() + 1 &&
        selectedYear === now.getFullYear()
      ) {
        const todayDate = now.getDate();
        const validDay = Math.min(todayDate, sheetData.dailyRecords.length);
        setSelectedDayNumber(validDay);
      } else {
        setSelectedDayNumber(1);
      }
    }
  }, [sheetData?.dailyRecords, selectedMonth, selectedYear]);

  const handlePrevMonth = () => {
    const { month, year } = getPrevPeriod(selectedMonth, selectedYear);
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const handleNextMonth = () => {
    const { month, year } = getNextPeriod(selectedMonth, selectedYear);
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const filteredDailyRecords = useMemo(() => {
    if (!sheetData?.dailyRecords) return [];
    if (statusFilter === "ALL") return sheetData.dailyRecords;
    if (statusFilter === "PRESENT")
      return sheetData.dailyRecords.filter(
        (r) =>
          r.status === "PRESENT" ||
          r.status === "LATE" ||
          r.status === "HALF_DAY",
      );
    if (statusFilter === "ABSENT")
      return sheetData.dailyRecords.filter((r) => r.status === "ABSENT");
    if (statusFilter === "LATE")
      return sheetData.dailyRecords.filter((r) => r.status === "LATE");
    if (statusFilter === "ON_LEAVE")
      return sheetData.dailyRecords.filter((r) => r.status === "ON_LEAVE");
    if (statusFilter === "WEEKEND")
      return sheetData.dailyRecords.filter(
        (r) => r.status === "WEEKEND" || r.status === "HOLIDAY",
      );
    return sheetData.dailyRecords;
  }, [sheetData?.dailyRecords, statusFilter]);

  const calendarGrid = useMemo(() => {
    return generateCalendarGrid(
      sheetData?.dailyRecords,
      selectedMonth,
      selectedYear,
    );
  }, [sheetData?.dailyRecords, selectedMonth, selectedYear]);

  const selectedDayRecord = useMemo(() => {
    if (!sheetData?.dailyRecords?.length) return null;
    return (
      sheetData.dailyRecords.find((r) => r.dayNumber === selectedDayNumber) ||
      sheetData.dailyRecords[0]
    );
  }, [sheetData?.dailyRecords, selectedDayNumber]);

  if (!employees.length) {
    return (
      <div className="p-12 text-center bg-agm-card border border-agm-box-border rounded-xl text-agm-muted text-xs">
        No registered personnel found. Register employees in the Directory tab
        to track monthly timesheets.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-agm-card border border-agm-box-border shadow-xs flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-nowrap shrink-0">
          <div className="w-56 sm:w-64">
            <Select
              value={currentEmployee?.id || ""}
              onChange={(e) => onSelectEmployee(e.target.value)}
              className="py-1.5 text-xs bg-agm-card border-agm-box-border text-agm-text font-bold"
              options={employees.map((e) => ({
                value: e.id,
                label: `${e.employeeCode} - ${e.firstName} ${e.lastName}`,
              }))}
            />
          </div>

          <div className="flex items-center bg-agm-box-bg border border-agm-box-border rounded-lg p-0.5 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 text-agm-muted hover:text-agm-text hover:bg-agm-card rounded cursor-pointer transition"
              title="Previous Month"
            >
              <ChevronLeftIcon size={14} />
            </button>
            <span className="px-2.5 text-xs font-bold text-agm-text uppercase tracking-wider font-mono whitespace-nowrap">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 text-agm-muted hover:text-agm-text hover:bg-agm-card rounded cursor-pointer transition"
              title="Next Month"
            >
              <ChevronRightIcon size={14} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-agm-box-bg p-1 rounded-lg border border-agm-box-border shadow-2xs shrink-0">
          <Button
            type="button"
            size="sm"
            variant={viewMode === "table" ? "primary" : "ghost"}
            onClick={() => setViewMode("table")}
            className={`text-xs font-bold transition flex items-center gap-1.5 cursor-pointer rounded-md px-3 py-1.5 h-auto whitespace-nowrap shrink-0 ${
              viewMode === "table"
                ? "bg-agm-sidebar text-white shadow-xs"
                : "text-agm-muted hover:text-agm-text hover:bg-agm-card"
            }`}
          >
            <AttendanceIcon size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Table</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant={viewMode === "heatmap" ? "primary" : "ghost"}
            onClick={() => setViewMode("heatmap")}
            className={`text-xs font-bold transition flex items-center gap-1.5 cursor-pointer rounded-md px-3 py-1.5 h-auto whitespace-nowrap shrink-0 ${
              viewMode === "heatmap"
                ? "bg-agm-sidebar text-white shadow-xs"
                : "text-agm-muted hover:text-agm-text hover:bg-agm-card"
            }`}
          >
            <CalendarIcon size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Calendar</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant={viewMode === "statement" ? "primary" : "ghost"}
            onClick={() => setViewMode("statement")}
            className={`text-xs font-bold transition flex items-center gap-1.5 cursor-pointer rounded-md px-3 py-1.5 h-auto whitespace-nowrap shrink-0 ${
              viewMode === "statement"
                ? "bg-agm-sidebar text-white shadow-xs"
                : "text-agm-muted hover:text-agm-text hover:bg-agm-card"
            }`}
          >
            <DollarSignIcon size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Salary</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-agm-muted bg-agm-card border border-agm-box-border rounded-xl">
          <SpinnerIcon size={28} className="animate-spin text-agm-green" />
          <span className="text-xs font-bold text-agm-text">
            Loading attendance records...
          </span>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">
          Failed to load attendance sheet: {(error as any).message}
        </div>
      ) : viewMode === "statement" && sheetData ? (
        <EmployeeSheetStatement
          sheetData={sheetData}
          isHR={isHR}
          onSavePayroll={handleSavePayroll}
          isSavingPayroll={savePayrollMutation.isPending}
        />
      ) : viewMode === "table" ? (
        <div className="space-y-3 bg-agm-card p-4 rounded-xl border border-agm-box-border shadow-xs">
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: "ALL", label: "All Days" },
                { id: "PRESENT", label: "Present" },
                { id: "ABSENT", label: "Absent" },
                { id: "LATE", label: "Late" },
                { id: "ON_LEAVE", label: "Leave" },
                { id: "WEEKEND", label: "Weekend / Holiday" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                    statusFilter === f.id
                      ? "bg-agm-sidebar text-white shadow-2xs"
                      : "text-agm-muted hover:text-agm-text hover:bg-agm-box-bg"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-semibold text-agm-muted font-mono">
              {filteredDailyRecords.length} /{" "}
              {sheetData?.period?.totalDaysInMonth || 30} days
            </span>
          </div>

          <div className="border border-agm-box-border rounded-lg overflow-hidden bg-agm-card shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-agm-box-bg text-agm-muted uppercase text-[10px] font-bold tracking-wider border-b border-agm-box-border">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-2.5">Day</th>
                  <th className="py-2.5 px-2.5 text-center">Status</th>
                  <th className="py-2.5 px-2.5 text-center">Check In</th>
                  <th className="py-2.5 px-2.5 text-center">Check Out</th>
                  <th className="py-2.5 px-2.5 text-right">Hours</th>
                  <th className="py-2.5 px-2.5 text-right">Overtime</th>
                  <th className="py-2.5 px-3">Notes &amp; Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-agm-box-border font-medium">
                {filteredDailyRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-agm-muted text-xs"
                    >
                      No attendance records match the selected status filter.
                    </td>
                  </tr>
                ) : (
                  filteredDailyRecords.map((r) => (
                    <tr
                      key={r.date}
                      className={`hover:bg-agm-box-bg/70 transition ${
                        r.isWeekend
                          ? "bg-agm-box-bg/30 text-agm-muted"
                          : "bg-agm-card text-agm-text"
                      }`}
                    >
                      <td className="py-2 px-3 font-mono font-bold text-agm-text">
                        {String(r.dayNumber).padStart(2, "0")}/
                        {String(selectedMonth).padStart(2, "0")}/{selectedYear}
                      </td>
                      <td className="py-2 px-2.5 text-agm-muted font-semibold text-[11px]">
                        {r.dayName}
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getAttendanceStatusBadge(
                            r.status,
                          )}`}
                        >
                          {r.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono text-agm-text text-[11px]">
                        {r.checkInTime
                          ? new Date(r.checkInTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="py-2 px-2.5 text-center font-mono text-agm-text text-[11px]">
                        {r.checkOutTime
                          ? new Date(r.checkOutTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-agm-text font-bold">
                        {r.workingHours > 0 ? `${r.workingHours}h` : "—"}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-agm-green-dark">
                        {r.overtimeHours > 0 ? `+${r.overtimeHours}h` : "—"}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-agm-muted truncate max-w-xs">
                        {r.notes || r.location || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-3 bg-agm-card p-4 rounded-xl border border-agm-box-border shadow-xs">
          <div className="grid grid-cols-7 gap-2 text-center">
            {WEEKDAY_SHORT_NAMES.map((wd) => (
              <div
                key={wd}
                className="text-[10px] font-bold uppercase text-agm-muted py-1 font-mono tracking-wider"
              >
                {wd}
              </div>
            ))}
            {calendarGrid.map((slot) => {
              if (slot.isPadding || !slot.record) {
                return (
                  <div
                    key={slot.key}
                    className="h-16 rounded-lg bg-agm-box-bg/30 border border-transparent"
                  />
                );
              }
              const rec = slot.record;
              const isSelected = rec.dayNumber === selectedDayNumber;

              let tileBg =
                "bg-agm-card border-agm-box-border hover:border-agm-muted";
              let indicatorColor = "bg-agm-subtle";

              if (rec.status === "PRESENT") {
                tileBg =
                  "bg-agm-green-soft border-agm-green/30 text-agm-green-dark hover:border-agm-green";
                indicatorColor = "bg-agm-green";
              } else if (rec.status === "LATE") {
                tileBg =
                  "bg-amber-50 border-amber-200 text-amber-800 hover:border-amber-300";
                indicatorColor = "bg-amber-500";
              } else if (rec.status === "ABSENT") {
                tileBg =
                  "bg-rose-50 border-rose-200 text-rose-800 hover:border-rose-300";
                indicatorColor = "bg-rose-500";
              } else if (rec.status === "ON_LEAVE") {
                tileBg =
                  "bg-purple-50 border-purple-200 text-purple-800 hover:border-purple-300";
                indicatorColor = "bg-purple-500";
              } else if (rec.isWeekend) {
                tileBg = "bg-agm-box-bg border-agm-box-border text-agm-muted";
                indicatorColor = "bg-agm-subtle";
              }

              return (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => setSelectedDayNumber(rec.dayNumber)}
                  className={`h-16 p-2 rounded-lg border text-left flex flex-col justify-between transition cursor-pointer ${tileBg} ${
                    isSelected
                      ? "ring-2 ring-agm-sidebar shadow-xs font-bold"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold">
                      {rec.dayNumber}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${indicatorColor}`}
                    />
                  </div>
                  <div className="text-[11px] font-semibold truncate leading-tight">
                    {rec.status === "PRESENT"
                      ? `${rec.workingHours || 8}h`
                      : rec.status === "LATE"
                        ? "Late"
                        : rec.status === "ABSENT"
                          ? "Absent"
                          : rec.status === "ON_LEAVE"
                            ? "Leave"
                            : "Rest"}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedDayRecord && (
            <div className="p-3 bg-agm-box-bg rounded-lg border border-agm-box-border text-xs flex items-center justify-between flex-wrap gap-2 text-agm-text">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs text-agm-text">
                  Day {selectedDayRecord.dayNumber} ({selectedDayRecord.dayName}
                  , {selectedDayRecord.date}):
                </span>
                <span
                  className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${getAttendanceStatusBadge(
                    selectedDayRecord.status,
                  )}`}
                >
                  {selectedDayRecord.status.replace("_", " ")}
                </span>
                <span className="text-agm-muted font-mono text-[11px]">
                  In:{" "}
                  <strong>
                    {selectedDayRecord.checkInTime
                      ? new Date(
                          selectedDayRecord.checkInTime,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </strong>{" "}
                  &bull; Out:{" "}
                  <strong>
                    {selectedDayRecord.checkOutTime
                      ? new Date(
                          selectedDayRecord.checkOutTime,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </strong>
                </span>
              </div>
              <div className="font-mono text-agm-text flex items-center gap-2 text-[11px]">
                <span>
                  Regular: <strong>{selectedDayRecord.workingHours}h</strong>
                </span>
                <span>&bull;</span>
                <span className="text-agm-green-dark">
                  Overtime: <strong>+{selectedDayRecord.overtimeHours}h</strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
