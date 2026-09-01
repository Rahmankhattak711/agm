"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import { useAuth } from "@/context/AuthContext";
import {
  useDailyAttendance,
  useRecordAttendance,
  useDeleteAttendance,
  useEmployees,
  AttendanceStatus,
  DailyAttendance,
} from "@/lib/hooks/api-hooks";
import { PlusIcon } from "@/components/icons";
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
  FormInput,
  FormSelect,
  FormSubmit,
} from "@/components/ui";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Building2,
  Printer,
  Plus,
  Trash2,
  MapPin,
  ShieldCheck,
  Search,
} from "lucide-react";

export default function AttendancePage() {
  const { canModify } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [employeeFilter, setEmployeeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const {
    data: records = [],
    isLoading,
    error,
  } = useDailyAttendance({
    date: selectedDate,
    employeeId: employeeFilter || undefined,
  });

  const { data: employees = [] } = useEmployees({ status: "ACTIVE" });
  const recordAttendance = useRecordAttendance();
  const deleteAttendance = useDeleteAttendance();

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter === "ALL") return true;
      return r.status === statusFilter;
    });
  }, [records, statusFilter]);

  const stats = useMemo(
    () => ({
      present: records.filter((r) => r.status === "PRESENT").length,
      late: records.filter((r) => r.status === "LATE").length,
      absent: records.filter((r) => r.status === "ABSENT").length,
      onLeave: records.filter((r) => r.status === "ON_LEAVE").length,
      overtime: records.reduce(
        (acc, r) => acc + Number(r.overtimeHours || 0),
        0,
      ),
    }),
    [records],
  );

  const form = useForm({
    defaultValues: {
      employeeId: "",
      attendanceDate: selectedDate,
      checkInTime: "08:00",
      checkOutTime: "17:00",
      status: "PRESENT" as AttendanceStatus,
      workingHours: "8.0",
      overtimeHours: "0.0",
      lateMinutes: "0",
      location: "",
      notes: "",
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        const baseDate = value.attendanceDate;
        const checkInDateTime = value.checkInTime
          ? `${baseDate}T${value.checkInTime}:00`
          : undefined;
        const checkOutDateTime = value.checkOutTime
          ? `${baseDate}T${value.checkOutTime}:00`
          : undefined;

        await recordAttendance.mutateAsync({
          employeeId: value.employeeId,
          attendanceDate: value.attendanceDate,
          checkInTime: checkInDateTime,
          checkOutTime: checkOutDateTime,
          status: value.status,
          workingHours: value.workingHours
            ? Number(value.workingHours)
            : undefined,
          overtimeHours: value.overtimeHours ? Number(value.overtimeHours) : 0,
          lateMinutes: value.lateMinutes ? Number(value.lateMinutes) : 0,
          location: value.location.trim() || undefined,
          notes: value.notes.trim() || undefined,
        });

        setIsModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to record attendance");
      }
    },
  });

  const handleOpenModal = () => {
    setFormError("");
    form.reset({
      employeeId: employees[0]?.id || "",
      attendanceDate: selectedDate,
      checkInTime: "08:00",
      checkOutTime: "17:00",
      status: "PRESENT",
      workingHours: "8.0",
      overtimeHours: "0.0",
      lateMinutes: "0",
      location: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case "PRESENT":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "LATE":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "HALF_DAY":
        return "bg-sky-50 text-sky-800 border-sky-200";
      case "ABSENT":
        return "bg-rose-50 text-rose-800 border-rose-200";
      case "ON_LEAVE":
        return "bg-blue-50 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const columns = useMemo<ColumnDef<DailyAttendance>[]>(
    () => [
      {
        accessorKey: "employee",
        header: "Employee Details",
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-slate-900 text-xs">
              {row.original.employee?.firstName || ""}{" "}
              {row.original.employee?.lastName || "Staff"}
            </div>
            <span className="font-mono text-[10px] text-teal-800 font-bold bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded mt-0.5 inline-block">
              {row.original.employee?.employeeCode || "N/A"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                row.original.status,
              )}`}
            >
              {row.original.status.replace("_", " ")}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "timing",
        header: "Timestamps",
        cell: ({ row }) => (
          <div className="text-xs font-mono text-slate-700 font-medium">
            {row.original.checkInTime ? (
              <span className="text-emerald-800 font-bold">
                {new Date(row.original.checkInTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ) : (
              <span className="text-slate-300">—</span>
            )}{" "}
            &rarr;{" "}
            {row.original.checkOutTime ? (
              <span className="text-slate-900 font-bold">
                {new Date(row.original.checkOutTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "workingHours",
        header: () => <div className="text-center">Logged Hours</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span className="font-mono text-xs font-bold text-slate-900">
              {row.original.workingHours
                ? `${row.original.workingHours} hrs`
                : "—"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "overtimeHours",
        header: () => <div className="text-center">Overtime</div>,
        cell: ({ row }) => {
          const ot = Number(row.original.overtimeHours || 0);
          return (
            <div className="text-center">
              {ot > 0 ? (
                <span className="font-mono text-xs font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  +{ot} hrs OT
                </span>
              ) : (
                <span className="text-slate-300 text-xs font-mono">0.0</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "lateMinutes",
        header: () => <div className="text-center">Late Minutes</div>,
        cell: ({ row }) => {
          const late = Number(row.original.lateMinutes || 0);
          return (
            <div className="text-center">
              {late > 0 ? (
                <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {late}m late
                </span>
              ) : (
                <span className="text-slate-300 text-xs font-mono">0m</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "location",
        header: "Site / Project",
        cell: ({ row }) => (
          <span className="text-xs text-slate-600 truncate max-w-xs block font-medium">
            {row.original.location || <span className="text-slate-300">—</span>}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          if (!canModify(row.original.employeeId, ["HR"])) return null;
          return (
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={async () => {
                  if (confirm("Delete this attendance entry?")) {
                    await deleteAttendance.mutateAsync(row.original.id);
                  }
                }}
                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition cursor-pointer"
                title="Delete Entry"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        },
      },
    ],
    [canModify, deleteAttendance],
  );

  return (
    <div className="space-y-6">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Daily Site Attendance &amp; Time Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AGM FITOUT TECHNICAL SERVICES LLC — Track daily worker attendance,
            biometric check-ins, <br /> overtime logs, and site assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
            icon={<Printer size={14} />}
          >
            Print Register
          </Button>

          {canModify(null, ["HR"]) && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenModal}
              icon={<Plus size={14} strokeWidth={2.5} />}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Record Attendance
            </Button>
          )}
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* 1. Present On-Site */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Present On-Site
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Active workers today
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-emerald-800 font-mono">
              {stats.present}
            </span>
            <span className="text-xs font-bold text-emerald-700 font-sans ml-1.5">
              Present
            </span>
          </div>
        </div>

        {/* 2. Late Arrivals */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-amber-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              2. Late Check-Ins
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Tardy arrivals logged
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-amber-700 font-mono">
              {stats.late}
            </span>
            <span className="text-xs font-bold text-amber-700 font-sans ml-1.5">
              Late
            </span>
          </div>
        </div>

        {/* 3. Total Overtime */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-purple-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              3. Overtime Logged
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Approved extra hours
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-purple-800 font-mono">
              {stats.overtime}
            </span>
            <span className="text-xs font-bold text-purple-700 font-sans ml-1.5">
              Hours OT
            </span>
          </div>
        </div>

        {/* 4. Absent & On Leave */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-rose-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              4. Absent &amp; On Leave
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Non-duty headcount
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-rose-700 font-mono">
              {stats.absent + stats.onLeave}
            </span>
            <span className="text-xs font-bold text-rose-700 font-sans ml-1.5">
              Off-Duty
            </span>
          </div>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        {/* Search & Filter Strip */}
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Status Quick Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: "ALL", label: "All Records" },
                { id: "PRESENT", label: "Present" },
                { id: "LATE", label: "Late" },
                { id: "HALF_DAY", label: "Half Day" },
                { id: "ABSENT", label: "Absent" },
                { id: "ON_LEAVE", label: "On Leave" },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 text-emerald-800"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] font-bold text-slate-500 font-mono">
              {filteredRecords.length} Entries Listed
            </span>
          </div>

          <div className="pt-1 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="w-full sm:w-60">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs cursor-pointer font-mono"
              />
            </div>

            <div className="w-full sm:w-64">
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
              >
                <option value="">All Active Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading attendance records: {(error as any).message}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
              <h4 className="font-black text-xs uppercase tracking-wider text-white">
                Daily Attendance &amp; Site Activity Log
              </h4>
              <span className="text-[11px] font-mono text-emerald-300 font-bold">
                {filteredRecords.length} Active Records
              </span>
            </div>

            <DataTable
              columns={columns}
              data={filteredRecords}
              isLoading={isLoading}
              emptyTitle="No attendance records found for this date"
              emptyMessage="Click 'Record Attendance' to add check-in logs."
            />
          </div>
        )}
      </div>

      {/* Modal for Recording Attendance */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Site Attendance"
        maxWidth="lg"
      >
        {formError && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold mb-4">
            {formError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="employeeId">
              {(field) => (
                <FormSelect
                  field={field}
                  label="Employee *"
                  required
                  options={employees.map((e) => ({
                    value: e.id,
                    label: `${e.firstName} ${e.lastName} (${e.employeeCode})`,
                  }))}
                />
              )}
            </form.Field>

            <form.Field name="attendanceDate">
              {(field) => (
                <FormInput
                  field={field}
                  label="Attendance Date *"
                  type="date"
                  required
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <form.Field name="status">
              {(field) => (
                <FormSelect
                  field={field}
                  label="Attendance Status *"
                  required
                  options={[
                    { value: "PRESENT", label: "Present" },
                    { value: "LATE", label: "Late Arrival" },
                    { value: "HALF_DAY", label: "Half Day" },
                    { value: "ABSENT", label: "Absent" },
                    { value: "ON_LEAVE", label: "On Approved Leave" },
                  ]}
                />
              )}
            </form.Field>

            <form.Field name="checkInTime">
              {(field) => (
                <FormInput field={field} label="Check In Time" type="time" />
              )}
            </form.Field>

            <form.Field name="checkOutTime">
              {(field) => (
                <FormInput field={field} label="Check Out Time" type="time" />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <form.Field name="workingHours">
              {(field) => (
                <FormInput
                  field={field}
                  label="Standard Working Hours"
                  type="number"
                  step="0.5"
                />
              )}
            </form.Field>

            <form.Field name="overtimeHours">
              {(field) => (
                <FormInput
                  field={field}
                  label="Overtime Hours (OT)"
                  type="number"
                  step="0.5"
                />
              )}
            </form.Field>

            <form.Field name="lateMinutes">
              {(field) => (
                <FormInput
                  field={field}
                  label="Late Minutes"
                  type="number"
                  step="1"
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="location">
              {(field) => (
                <FormInput
                  field={field}
                  label="Site / Project Location"
                  placeholder="e.g. Dubai Hills Villa 42"
                />
              )}
            </form.Field>

            <form.Field name="notes">
              {(field) => (
                <FormInput
                  field={field}
                  label="Notes / Remarks"
                  placeholder="Overtime authorization, supervisor remarks..."
                />
              )}
            </form.Field>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <FormSubmit
              form={form}
              loading={recordAttendance.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
            >
              Save Attendance Record
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
