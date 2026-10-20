"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  useEmployeeMonthlySheet,
  useSaveMonthlyPayroll,
  Employee,
} from "@/lib/hooks/api-hooks";
import { Button, Modal } from "@/components/ui";
import {
  CalendarIcon,
  ShieldCheckIcon,
  SpinnerIcon,
  GridIcon,
} from "@/components/icons";
import { toast } from "@/lib/toast";
import {
  MONTH_NAMES,
  getPrevPeriod,
  getNextPeriod,
  generateCalendarGrid,
  exportEmployeeTimesheetCsv,
} from "@/lib/utils";

import { EmployeeSheetHeader } from "./EmployeeSheetHeader";
import {
  EmployeeSheetStatement,
  PayrollAdjustmentValues,
} from "./EmployeeSheetStatement";
import { EmployeeSheetHeatmap } from "./EmployeeSheetHeatmap";
import { EmployeeSheetRoster } from "./EmployeeSheetRoster";
import { EmployeeSheetLegal } from "./EmployeeSheetLegal";
import { EmployeeSheetPrint } from "./EmployeeSheetPrint";

interface EmployeeMonthlySheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  initialMonth?: number;
  initialYear?: number;
  isHR?: boolean;
}

export function EmployeeMonthlySheetModal({
  isOpen,
  onClose,
  employee,
  initialMonth,
  initialYear,
  isHR = false,
}: EmployeeMonthlySheetModalProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(
    initialMonth || currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    initialYear || currentDate.getFullYear(),
  );

  const [viewMode, setViewMode] = useState<"split" | "roster" | "legal">(
    "split",
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);

  const {
    data: sheetData,
    isLoading,
    error,
    refetch,
  } = useEmployeeMonthlySheet({
    employeeId: employee?.id,
    month: selectedMonth,
    year: selectedYear,
  });

  const savePayrollMutation = useSaveMonthlyPayroll();

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

  const handleSavePayroll = async (values: PayrollAdjustmentValues) => {
    if (!sheetData?.employee || !sheetData.payroll) return;

    try {
      const basic = sheetData.payroll.basicSalary;
      const allowances = sheetData.payroll.totalAllowances;
      const ot = values.overtimeAmount;
      const bonus = values.bonusAmount;
      const abs = values.absenceDeduction;
      const other = values.otherDeductions;
      const net = Math.max(0, basic + allowances + ot + bonus - (abs + other));

      await savePayrollMutation.mutateAsync({
        employeeId: sheetData.employee.id,
        month: selectedMonth,
        year: selectedYear,
        basicSalary: basic,
        allowances,
        overtimeAmount: ot,
        bonusAmount: bonus,
        absenceDeduction: abs,
        otherDeductions: other,
        netSalary: net,
        daysPresent: sheetData.attendanceSummary.daysPresent,
        daysAbsent: sheetData.attendanceSummary.daysAbsent,
        isPaid: values.isPaid,
        paymentDate: values.paymentDate || null,
        remarks: values.remarks.trim() || null,
      });

      toast.success(
        `Monthly payroll record saved for ${sheetData.period.monthName} ${selectedYear}`,
      );
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to save payroll record");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!sheetData?.employee || !sheetData.dailyRecords) return;
    exportEmployeeTimesheetCsv(
      sheetData.dailyRecords,
      sheetData.employee.employeeCode,
      sheetData.period.monthName,
      selectedYear,
    );
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

  if (!isOpen) return null;

  const monthNames = MONTH_NAMES;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="7xl"
      closeOnOutsideClick={false}
    >
      <div className="print:hidden space-y-4 -mt-3 text-agm-text">
        <EmployeeSheetHeader
          employee={employee}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          monthNames={monthNames}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onSelectPeriod={(m, y) => {
            setSelectedMonth(m);
            setSelectedYear(y);
          }}
          onPrint={handlePrint}
          onExportCSV={handleExportCSV}
        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-agm-box-border pb-2.5">
          <div className="flex items-center gap-1.5 bg-agm-box-bg p-1 rounded-xl border border-agm-box-border">
            <Button
              type="button"
              size="sm"
              variant={viewMode === "split" ? "primary" : "ghost"}
              onClick={() => setViewMode("split")}
              className={`text-xs font-bold transition flex items-center gap-1.5 cursor-pointer rounded-lg px-3.5 py-1.5 h-auto ${
                viewMode === "split"
                  ? "bg-agm-sidebar text-white shadow-xs"
                  : "text-agm-muted hover:text-agm-text hover:bg-agm-card"
              }`}
            >
              <GridIcon size={14} />
              <span>Executive Statement &amp; Heatmap</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "roster" ? "primary" : "ghost"}
              onClick={() => setViewMode("roster")}
              className={`text-xs font-bold transition flex items-center gap-1.5 cursor-pointer rounded-lg px-3.5 py-1.5 h-auto ${
                viewMode === "roster"
                  ? "bg-agm-sidebar text-white shadow-xs"
                  : "text-agm-muted hover:text-agm-text hover:bg-agm-card"
              }`}
            >
              <CalendarIcon size={14} />
              <span>Detailed 31-Day Timecard</span>
              {sheetData?.attendanceSummary && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    viewMode === "roster"
                      ? "bg-white/20 text-white"
                      : "bg-agm-green-soft text-agm-green-dark"
                  }`}
                >
                  {sheetData.attendanceSummary.daysPresent}d
                </span>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "legal" ? "primary" : "ghost"}
              onClick={() => setViewMode("legal")}
              className={`text-xs font-bold transition flex items-center gap-1.5 cursor-pointer rounded-lg px-3.5 py-1.5 h-auto ${
                viewMode === "legal"
                  ? "bg-agm-sidebar text-white shadow-xs"
                  : "text-agm-muted hover:text-agm-text hover:bg-agm-card"
              }`}
            >
              <ShieldCheckIcon size={14} />
              <span>UAE WPS &amp; Legal Dossier</span>
            </Button>
          </div>

          <div className="text-xs text-agm-muted font-medium flex items-center gap-2 self-end sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-agm-green animate-pulse" />
            <span>
              Pay Cycle: 01/{String(selectedMonth).padStart(2, "0")}/
              {selectedYear} — {sheetData?.period?.totalDaysInMonth}/
              {String(selectedMonth).padStart(2, "0")}/{selectedYear}
            </span>
          </div>
        </div>

        {isLoading && (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-agm-muted">
            <SpinnerIcon size={32} className="animate-spin text-agm-green" />
            <span className="text-xs font-bold text-agm-text">
              Synthesizing monthly attendance matrix, biometric punches &amp;
              WPS salary deed...
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">
            Failed to load monthly sheet: {(error as any).message}
          </div>
        )}

        {!isLoading && sheetData && viewMode === "split" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-5">
              <EmployeeSheetStatement
                sheetData={sheetData}
                isHR={isHR}
                onSavePayroll={handleSavePayroll}
                isSavingPayroll={savePayrollMutation.isPending}
              />
            </div>

            <div className="lg:col-span-7">
              <EmployeeSheetHeatmap
                sheetData={sheetData}
                calendarGrid={calendarGrid}
                selectedDayNumber={selectedDayNumber}
                onSelectDay={setSelectedDayNumber}
                selectedDayRecord={selectedDayRecord}
                onSwitchToRoster={() => setViewMode("roster")}
              />
            </div>
          </div>
        )}

        {!isLoading && sheetData && viewMode === "roster" && (
          <EmployeeSheetRoster
            dailyRecords={filteredDailyRecords}
            totalDays={sheetData.dailyRecords.length}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        )}

        {!isLoading && sheetData && viewMode === "legal" && (
          <EmployeeSheetLegal
            sheetData={sheetData}
            selectedYear={selectedYear}
          />
        )}
      </div>

      {sheetData && (
        <EmployeeSheetPrint
          sheetData={sheetData}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      )}
    </Modal>
  );
}
