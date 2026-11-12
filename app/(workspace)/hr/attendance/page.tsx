"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  Calendar,
  Clock,
  Download,
  Printer,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
} from "lucide-react";
import {
  useHrAttendanceRegister,
  useRecordHrAttendance,
  useBulkMarkStandardDay,
  useDepartments,
} from "@/lib/hooks/hr-hooks";
import { Button, Input } from "@/components/ui";
import { toast } from "@/lib/toast";

export default function AttendanceRegisterPage() {
  const [rangeType, setRangeType] = useState<"daily" | "weekly" | "monthly" | "custom">("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customFrom, setCustomFrom] = useState(new Date().toISOString().slice(0, 10));
  const [customTo, setCustomTo] = useState(new Date().toISOString().slice(0, 10));
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Editable row state
  const [editingRows, setEditingRows] = useState<Record<string, { checkIn: string; checkOut: string; status: string }>>({});
  const [savingRowId, setSavingRowId] = useState<string | null>(null);

  const { data: deptList = [] } = useDepartments();

  const queryParams = useMemo(() => {
    return {
      rangeType,
      date: rangeType === "daily" ? selectedDate : undefined,
      month: rangeType === "monthly" ? selectedMonth : undefined,
      year: rangeType === "monthly" ? selectedYear : undefined,
      from: rangeType === "custom" ? customFrom : undefined,
      to: rangeType === "custom" ? customTo : undefined,
      department: selectedDept !== "ALL" ? selectedDept : undefined,
      search: searchTerm || undefined,
    };
  }, [rangeType, selectedDate, selectedMonth, selectedYear, customFrom, customTo, selectedDept, searchTerm]);

  const { data, isLoading, refetch } = useHrAttendanceRegister(queryParams);
  const recordAttendanceMutation = useRecordHrAttendance();
  const bulkMarkMutation = useBulkMarkStandardDay();

  const records = data?.records || [];
  const summary = data?.summary || {
    periodLabel: "",
    startDate: selectedDate,
    endDate: selectedDate,
    totalEmployees: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    leaveCount: 0,
    totalWorkingHours: 0,
    totalOvertimeHours: 0,
    estimatedTotalOvertimeCost: 0,
  };

  // Date controls
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleBulkMarkStandard = async () => {
    try {
      await bulkMarkMutation.mutateAsync(selectedDate);
      toast.success(`Active employees marked present for standard shift (08:00 - 17:00)!`);
      refetch();
    } catch {
      toast.error("Failed to mark bulk attendance");
    }
  };

  const handleSaveRow = async (rec: any) => {
    const edited = editingRows[rec.id];
    const checkIn = edited?.checkIn !== undefined ? edited.checkIn : (rec.checkInTime ? rec.checkInTime.slice(11, 16) : "");
    const checkOut = edited?.checkOut !== undefined ? edited.checkOut : (rec.checkOutTime ? rec.checkOutTime.slice(11, 16) : "");
    const status = edited?.status || rec.status;

    const dateStr = rec.attendanceDate;
    const checkInIso = checkIn ? `${dateStr}T${checkIn}:00.000Z` : null;
    const checkOutIso = checkOut ? `${dateStr}T${checkOut}:00.000Z` : null;

    setSavingRowId(rec.id);
    try {
      await recordAttendanceMutation.mutateAsync({
        employeeId: rec.employeeId,
        attendanceDate: dateStr,
        checkInTime: checkInIso,
        checkOutTime: checkOutIso,
        status,
      });
      toast.success(`Attendance updated for ${rec.employeeName}`);
      refetch();
    } catch {
      toast.error("Failed to save attendance row");
    } finally {
      setSavingRowId(null);
    }
  };

  const handleExportCSV = () => {
    if (records.length === 0) {
      toast.error("No records to export");
      return;
    }
    const headers = [
      "Employee Code",
      "Employee Name",
      "Department",
      "Designation",
      "Date",
      "Check In",
      "Check Out",
      "Work Hours",
      "Overtime Hours",
      "Status",
      "OT Est (AED)",
    ];
    const rows = records.map((r: any) => [
      r.employeeCode,
      `"${r.employeeName}"`,
      `"${r.department}"`,
      `"${r.designation}"`,
      r.attendanceDate,
      r.checkInTime ? r.checkInTime.slice(11, 16) : "",
      r.checkOutTime ? r.checkOutTime.slice(11, 16) : "",
      r.workingHours,
      r.overtimeHours,
      r.status,
      r.accountingImpact.estimatedOvertimeCost,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `AGM_Attendance_${(summary as any)?.startDate || selectedMonth}_to_${(summary as any)?.endDate || selectedMonth}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Attendance CSV exported successfully!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full min-h-full p-4 sm:p-6 space-y-4 bg-[#f8fafc] text-slate-800 font-sans print:p-0 print:bg-white">
      {/* Official Corporate Printable Header (Visible during Print) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14">
              <Image src="/assets/logo.png" alt="AGM Logo" fill className="object-contain" priority />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">ARJT TRANSPORT LLC (AGM)</h1>
              <p className="text-xs text-slate-600">Al Quoz Industrial Area 3, Dubai, United Arab Emirates</p>
              <p className="text-xs text-slate-600 font-mono">Tax Registration Number (TRN): 10043245234522</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-base font-bold text-slate-900 uppercase">Timesheet & Attendance Register</h2>
            <p className="text-xs text-slate-700 font-semibold">{summary.periodLabel}</p>
            <p className="text-[11px] text-slate-500">Printed: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Interactive Web Header */}
      <div className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Attendance & Timesheet Register
              </h1>
              <p className="text-xs text-slate-500">
                Daily check-in/out, working hours, overtime accruals & accounting payroll synchronization
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <Button
            onClick={handleBulkMarkStandard}
            loading={bulkMarkMutation.isPending}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Mark Standard Shift (08:00 - 17:00)
          </Button>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Export CSV
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            Print Register
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Total Workforce
            </span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{summary.totalEmployees}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active registered staff</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Present
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-1">{summary.presentCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {summary.lateCount > 0 ? `Includes ${summary.lateCount} late arrivals` : "On duty on site"}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Absent / Leave
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-bold font-mono text-rose-700 mt-1">
            {summary.absentCount + summary.leaveCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {summary.leaveCount} approved leave, {summary.absentCount} absent
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Overtime Hours (OT)
            </span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold font-mono text-blue-700 mt-1">
            +{summary.totalOvertimeHours}h
          </p>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
            Est. AED {summary.estimatedTotalOvertimeCost.toLocaleString()} (Dr. 5104)
          </p>
        </div>
      </div>

      {/* Filter Tabs & Date Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-3 print:hidden">
        {/* Preset Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full lg:w-auto">
          {[
            { id: "daily", label: "Daily Sheet" },
            { id: "weekly", label: "Weekly (7 Days)" },
            { id: "monthly", label: "Monthly" },
            { id: "custom", label: "Custom Range" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRangeType(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                rangeType === tab.id
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Selector based on tab */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {rangeType === "daily" && (
            <div className="flex items-center gap-1 bg-slate-50 p-1 border border-slate-200 rounded-lg">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs bg-transparent border-0 outline-none font-mono text-slate-800"
              />
              <button
                type="button"
                onClick={handleNextDay}
                className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {rangeType === "monthly" && (
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2026, i, 1).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none font-mono"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          )}

          {rangeType === "custom" && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
              />
            </div>
          )}

          {/* Department filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none"
          >
            <option value="ALL">All Departments</option>
            {deptList.map((d: any) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Search box */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search employee code, name, department..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Spreadsheet-Grade Attendance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden print:border-0 print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-[11px] print:bg-slate-100">
                <th className="px-3.5 py-3">Employee</th>
                <th className="px-3 py-3">Role & Dept</th>
                {rangeType !== "daily" && <th className="px-3 py-3">Date</th>}
                <th className="px-3 py-3">Check In</th>
                <th className="px-3 py-3">Check Out</th>
                <th className="px-3 py-3 text-center">Work Hours</th>
                <th className="px-3 py-3 text-center">Overtime</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Accounting Note</th>
                <th className="px-3 py-3 text-right print:hidden">Save</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    Loading attendance register...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    No attendance records for selected period
                  </td>
                </tr>
              ) : (
                records.map((rec: any) => {
                  const edited = editingRows[rec.id];
                  const inTimeValue = edited?.checkIn !== undefined ? edited.checkIn : (rec.checkInTime ? rec.checkInTime.slice(11, 16) : "");
                  const outTimeValue = edited?.checkOut !== undefined ? edited.checkOut : (rec.checkOutTime ? rec.checkOutTime.slice(11, 16) : "");
                  const statusValue = edited?.status || rec.status;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-3.5 py-2.5">
                        <div className="font-semibold text-slate-900">{rec.employeeName}</div>
                        <div className="font-mono text-[10.5px] text-slate-500">{rec.employeeCode}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-slate-800 font-medium">{rec.designation}</div>
                        <div className="text-[10.5px] text-slate-500">{rec.department}</div>
                      </td>
                      {rangeType !== "daily" && (
                        <td className="px-3 py-2.5 font-mono text-slate-700">
                          {rec.attendanceDate}
                        </td>
                      )}
                      <td className="px-3 py-2.5">
                        <input
                          type="time"
                          value={inTimeValue}
                          onChange={(e) =>
                            setEditingRows({
                              ...editingRows,
                              [rec.id]: {
                                checkIn: e.target.value,
                                checkOut: outTimeValue,
                                status: statusValue,
                              },
                            })
                          }
                          className="px-1.5 py-1 text-xs font-mono border border-slate-200 rounded bg-slate-50 focus:bg-white focus:border-blue-500 outline-none print:border-0 print:bg-transparent"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <input
                          type="time"
                          value={outTimeValue}
                          onChange={(e) =>
                            setEditingRows({
                              ...editingRows,
                              [rec.id]: {
                                checkIn: inTimeValue,
                                checkOut: e.target.value,
                                status: statusValue,
                              },
                            })
                          }
                          className="px-1.5 py-1 text-xs font-mono border border-slate-200 rounded bg-slate-50 focus:bg-white focus:border-blue-500 outline-none print:border-0 print:bg-transparent"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-semibold text-slate-900">
                        {rec.workingHours ? `${rec.workingHours}h` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {rec.overtimeHours > 0 ? (
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-700 text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            +{rec.overtimeHours}h (@ {rec.accountingImpact.overtimeRateMultiplier}x)
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          value={statusValue}
                          onChange={(e) =>
                            setEditingRows({
                              ...editingRows,
                              [rec.id]: {
                                checkIn: inTimeValue,
                                checkOut: outTimeValue,
                                status: e.target.value,
                              },
                            })
                          }
                          className="text-[11px] font-semibold p-1 rounded border border-slate-200 bg-white outline-none print:border-0 print:bg-transparent"
                        >
                          <option value="PRESENT">PRESENT</option>
                          <option value="LATE">LATE</option>
                          <option value="HALF_DAY">HALF DAY</option>
                          <option value="ON_LEAVE">ON LEAVE</option>
                          <option value="ABSENT">ABSENT</option>
                        </select>
                      </td>
                      <td className="px-3 py-2.5 text-[11px]">
                        {rec.overtimeHours > 0 ? (
                          <span className="text-blue-700 font-mono font-medium">
                            Dr 5104 +AED {rec.accountingImpact.estimatedOvertimeCost}
                          </span>
                        ) : rec.accountingImpact.isUnexcusedAbsence ? (
                          <span className="text-rose-600 font-medium">
                            Ded: -AED {rec.accountingImpact.absenceDeductionAmount}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[10px]">Standard Shift</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right print:hidden">
                        <button
                          type="button"
                          onClick={() => handleSaveRow(rec)}
                          disabled={savingRowId === rec.id}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                          title="Save attendance row"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Spreadsheet equilibrium footer summary */}
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-800 text-[11px]">
                <td colSpan={rangeType !== "daily" ? 6 : 5} className="px-4 py-3 uppercase">
                  Register Period Total ({summary.periodLabel})
                </td>
                <td className="px-3 py-3 text-center font-mono text-slate-900">
                  {summary.totalWorkingHours} hrs
                </td>
                <td className="px-3 py-3 text-center font-mono text-emerald-800">
                  +{summary.totalOvertimeHours} hrs
                </td>
                <td colSpan={3} className="px-3 py-3 text-right font-mono text-blue-800">
                  Total Overtime Accrual (GL 5104): AED {summary.estimatedTotalOvertimeCost.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Printable Signature Section */}
      <div className="hidden print:grid grid-cols-3 gap-6 pt-10 text-xs text-slate-700">
        <div className="border-t border-slate-400 pt-2 text-center">
          <p className="font-semibold">Prepared By (Timekeeper / Fleet Lead)</p>
          <p className="text-[10px] text-slate-400 mt-1">Signature & Date</p>
        </div>
        <div className="border-t border-slate-400 pt-2 text-center">
          <p className="font-semibold">Verified By (HR & Operations Manager)</p>
          <p className="text-[10px] text-slate-400 mt-1">Signature & Date</p>
        </div>
        <div className="border-t border-slate-400 pt-2 text-center">
          <p className="font-semibold">Approved By (Finance & General Ledger)</p>
          <p className="text-[10px] text-slate-400 mt-1">Authorized Official Stamp</p>
        </div>
      </div>
    </div>
  );
}
