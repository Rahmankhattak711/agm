"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  useDailyAttendance,
  useRecordAttendance,
  useDeleteAttendance,
  useEmployees,
  AttendanceStatus,
  DailyAttendance,
} from "@/lib/hooks/api-hooks";
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
} from "@/components/ui";

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [employeeFilter, setEmployeeFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [employeeId, setEmployeeId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [checkInTime, setCheckInTime] = useState("08:00");
  const [checkOutTime, setCheckOutTime] = useState("17:00");
  const [status, setStatus] = useState<AttendanceStatus>("PRESENT");
  const [workingHours, setWorkingHours] = useState("8.0");
  const [overtimeHours, setOvertimeHours] = useState("0.0");
  const [lateMinutes, setLateMinutes] = useState("0");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const { data: records = [], isLoading, error } = useDailyAttendance({
    date: selectedDate,
    employeeId: employeeFilter || undefined,
  });

  const { data: employees = [] } = useEmployees({ status: "ACTIVE" });
  const recordAttendance = useRecordAttendance();
  const deleteAttendance = useDeleteAttendance();

  // Metrics
  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const lateCount = records.filter((r) => r.status === "LATE").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;
  const onLeaveCount = records.filter((r) => r.status === "ON_LEAVE").length;
  const totalOvertime = records.reduce((acc, r) => acc + Number(r.overtimeHours || 0), 0);

  const handleOpenModal = () => {
    if (employees.length > 0) setEmployeeId(employees[0].id);
    setAttendanceDate(selectedDate);
    setCheckInTime("08:00");
    setCheckOutTime("17:00");
    setStatus("PRESENT");
    setWorkingHours("8.0");
    setOvertimeHours("0.0");
    setLateMinutes("0");
    setLocation("");
    setNotes("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!employeeId || !attendanceDate) {
      setFormError("Employee and date are required.");
      return;
    }

    try {
      const baseDate = attendanceDate;
      const checkInDateTime = checkInTime ? `${baseDate}T${checkInTime}:00` : undefined;
      const checkOutDateTime = checkOutTime ? `${baseDate}T${checkOutTime}:00` : undefined;

      await recordAttendance.mutateAsync({
        employeeId,
        attendanceDate,
        checkInTime: checkInDateTime,
        checkOutTime: checkOutDateTime,
        status,
        workingHours: workingHours ? Number(workingHours) : undefined,
        overtimeHours: overtimeHours ? Number(overtimeHours) : 0,
        lateMinutes: lateMinutes ? Number(lateMinutes) : 0,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to save attendance");
    }
  };

  const handleBatchMarkAllPresent = async () => {
    if (!confirm(`Mark all ${employees.length} active employees as PRESENT for ${selectedDate}?`)) {
      return;
    }

    const batch = employees.map((emp) => ({
      employeeId: emp.id,
      attendanceDate: selectedDate,
      checkInTime: `${selectedDate}T08:00:00`,
      checkOutTime: `${selectedDate}T17:00:00`,
      status: "PRESENT",
      workingHours: 8,
      overtimeHours: 0,
      lateMinutes: 0,
      notes: "Batch marked present",
    }));

    await recordAttendance.mutateAsync(batch);
  };

  const getStatusBadge = (st: AttendanceStatus) => {
    switch (st) {
      case "PRESENT":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Present
          </span>
        );
      case "LATE":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Late
          </span>
        );
      case "HALF_DAY":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Half Day
          </span>
        );
      case "ABSENT":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Absent
          </span>
        );
      case "ON_LEAVE":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            On Leave
          </span>
        );
      default:
        return <span>{st}</span>;
    }
  };

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<DailyAttendance>[]>(
    () => [
      {
        accessorKey: "employee",
        header: "Employee",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-slate-900">
              {row.original.employee?.firstName} {row.original.employee?.lastName}
            </div>
            <span className="font-mono text-[10px] text-slate-400">
              {row.original.employee?.employeeCode}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "department",
        header: "Department / Role",
        cell: ({ row }) => (
          <div>
            <div>{row.original.employee?.designation || "Staff"}</div>
            <div className="text-[10px] text-slate-400">
              {row.original.employee?.department || "Operations"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        accessorKey: "checkInTime",
        header: "Check-In",
        cell: ({ row }) => (
          <span className="font-mono text-slate-700">
            {row.original.checkInTime
              ? new Date(row.original.checkInTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"}
          </span>
        ),
      },
      {
        accessorKey: "checkOutTime",
        header: "Check-Out",
        cell: ({ row }) => (
          <span className="font-mono text-slate-700">
            {row.original.checkOutTime
              ? new Date(row.original.checkOutTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"}
          </span>
        ),
      },
      {
        accessorKey: "workingHours",
        header: "Hours",
        cell: ({ row }) => (
          <span className="font-bold text-slate-800">
            {row.original.workingHours ?? 8} hrs
          </span>
        ),
      },
      {
        accessorKey: "overtimeHours",
        header: "Overtime",
        cell: ({ row }) =>
          Number(row.original.overtimeHours) > 0 ? (
            <span className="font-bold text-emerald-700">
              +{row.original.overtimeHours}h
            </span>
          ) : (
            <span className="text-slate-400">0h</span>
          ),
      },
      {
        accessorKey: "location",
        header: "Site / Notes",
        cell: ({ row }) => (
          <div className="max-w-xs">
            {row.original.location && (
              <span className="font-medium text-slate-800 block">
                {row.original.location}
              </span>
            )}
            {row.original.notes && (
              <span className="text-slate-400 text-[11px] block">
                {row.original.notes}
              </span>
            )}
            {!row.original.location && !row.original.notes && (
              <span className="text-slate-300">-</span>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                if (confirm("Delete this attendance entry?")) {
                  await deleteAttendance.mutateAsync(row.original.id);
                }
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [deleteAttendance]
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Daily Attendance & Timesheets</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log employee attendance, overtime hours, check-in timestamps, and project site assignments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="dark"
            onClick={handleBatchMarkAllPresent}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            }
          >
            Mark All Present
          </Button>
          <Button
            variant="primary"
            onClick={handleOpenModal}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-3.5 h-3.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
          >
            Record Entry
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Present</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{presentCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">On-time staff</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Late Check-in</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{lateCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Delayed arrivals</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Absent</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{absentCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Unexcused</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">On Leave</p>
          <p className="text-2xl font-black text-purple-700 mt-1">{onLeaveCount}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Approved requests</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overtime Logged</p>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{totalOvertime} hrs</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Additional hours</p>
        </div>
      </div>

      {/* Filter and TanStack Table Container */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-700 uppercase">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full sm:w-60"
            >
              <option value="">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeCode})
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* TanStack Table Render */}
        {error ? (
          <div className="py-8 text-center text-xs text-red-500">Error loading attendance: {(error as any).message}</div>
        ) : (
          <DataTable
            columns={columns}
            data={records}
            isLoading={isLoading}
            emptyTitle="No attendance entries for this date"
            emptyMessage='Click "Mark All Present" or "Record Entry" to start logging.'
          />
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Daily Attendance" maxWidth="lg">
        <form onSubmit={handleSaveAttendance} className="space-y-3.5">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <Select
            label="Employee *"
            required
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName} ({e.employeeCode})
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date *"
              type="date"
              required
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
            />

            <Select
              label="Status *"
              value={status}
              onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
            >
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
              <option value="ON_LEAVE">On Leave</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Check-in Time"
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
            />

            <Input
              label="Check-out Time"
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Overtime (Hours)"
              type="number"
              step="0.5"
              min="0"
              value={overtimeHours}
              onChange={(e) => setOvertimeHours(e.target.value)}
            />

            <Input
              label="Late (Minutes)"
              type="number"
              min="0"
              value={lateMinutes}
              onChange={(e) => setLateMinutes(e.target.value)}
            />
          </div>

          <Input
            label="Project Site / Location"
            type="text"
            placeholder="e.g. Dubai Hills Fitout Project"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <Input
            label="Notes / Remarks"
            type="text"
            placeholder="Additional context..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={recordAttendance.isPending}>
              {recordAttendance.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
