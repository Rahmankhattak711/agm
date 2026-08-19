"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
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

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [employeeFilter, setEmployeeFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const { data: records = [], isLoading, error } = useDailyAttendance({
    date: selectedDate,
    employeeId: employeeFilter || undefined,
  });

  const { data: employees = [] } = useEmployees({ status: "ACTIVE" });
  const recordAttendance = useRecordAttendance();
  const deleteAttendance = useDeleteAttendance();

  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const lateCount = records.filter((r) => r.status === "LATE").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;
  const onLeaveCount = records.filter((r) => r.status === "ON_LEAVE").length;
  const totalOvertime = records.reduce((acc, r) => acc + Number(r.overtimeHours || 0), 0);

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
        const checkInDateTime = value.checkInTime ? `${baseDate}T${value.checkInTime}:00` : undefined;
        const checkOutDateTime = value.checkOutTime ? `${baseDate}T${value.checkOutTime}:00` : undefined;

        await recordAttendance.mutateAsync({
          employeeId: value.employeeId,
          attendanceDate: value.attendanceDate,
          checkInTime: checkInDateTime,
          checkOutTime: checkOutDateTime,
          status: value.status,
          workingHours: value.workingHours ? Number(value.workingHours) : undefined,
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
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "LATE":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "HALF_DAY":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "ABSENT":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "ON_LEAVE":
        return "bg-blue-100 text-blue-800 border-blue-200";
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
            <div className="font-bold text-slate-900">
              {row.original.employee?.firstName || ""} {row.original.employee?.lastName || "Staff"}
            </div>
            <span className="font-mono text-[10px] text-slate-400">
              Code: {row.original.employee?.employeeCode || "N/A"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(
              row.original.status
            )}`}
          >
            {row.original.status.replace("_", " ")}
          </span>
        ),
      },
      {
        accessorKey: "timing",
        header: "Timestamps",
        cell: ({ row }) => (
          <div className="text-xs font-mono text-slate-700">
            {row.original.checkInTime ? (
              <span>
                {new Date(row.original.checkInTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ) : (
              <span className="text-slate-300">-</span>
            )}{" "}
            &rarr;{" "}
            {row.original.checkOutTime ? (
              <span>
                {new Date(row.original.checkOutTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ) : (
              <span className="text-slate-300">-</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "workingHours",
        header: "Logged Hours",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-slate-900">
            {row.original.workingHours ? `${row.original.workingHours} hrs` : "-"}
          </span>
        ),
      },
      {
        accessorKey: "overtimeHours",
        header: "Overtime",
        cell: ({ row }) => {
          const ot = Number(row.original.overtimeHours || 0);
          return ot > 0 ? (
            <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              +{ot} hrs OT
            </span>
          ) : (
            <span className="text-slate-300 text-xs font-mono">0.0</span>
          );
        },
      },
      {
        accessorKey: "lateMinutes",
        header: "Late Minutes",
        cell: ({ row }) => {
          const late = Number(row.original.lateMinutes || 0);
          return late > 0 ? (
            <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {late}m late
            </span>
          ) : (
            <span className="text-slate-300 text-xs font-mono">0m</span>
          );
        },
      },
      {
        accessorKey: "location",
        header: "Site / Project",
        cell: ({ row }) => (
          <span className="text-xs text-slate-600 truncate max-w-xs block">
            {row.original.location || <span className="text-slate-300">-</span>}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                if (confirm("Delete attendance punch?")) {
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
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Daily Attendance & Timesheets</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time site punch logs, overtime calculations, late arrival tracking, and duty logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={handleOpenModal}
            icon={<PlusIcon className="w-4 h-4" strokeWidth={2.2} />}
          >
            Record Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Present Today</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{presentCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">On-site and working</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Late Arrivals</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{lateCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Delayed check-ins</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Absent / Leave</p>
          <p className="text-2xl font-black text-rose-800 mt-1">{absentCount + onLeaveCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">{onLeaveCount} on approved leave</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Overtime</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalOvertime} hrs</p>
          <p className="text-xs text-slate-500 mt-0.5">Calculated extra hours</p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2.5 w-full">
            <div className="w-full sm:w-48">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="w-full sm:w-60">
              <Select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
              >
                <option value="">All Employees</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-red-500">Error loading attendance: {(error as any).message}</div>
        ) : (
          <DataTable
            columns={columns}
            data={records}
            isLoading={isLoading}
            emptyTitle="No attendance records for this date"
            emptyMessage='Click "Record Entry" to log daily attendance.'
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Daily Attendance" maxWidth="lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-3.5"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <form.Field
            name="employeeId"
            validators={{
              onChange: ({ value }) => (!value ? "Employee is required" : undefined),
            }}
          >
            {(field) => (
              <FormSelect field={field} label="Employee *" required>
                <option value="">-- Select Employee --</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.employeeCode})
                  </option>
                ))}
              </FormSelect>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-3">
            <form.Field
              name="attendanceDate"
              validators={{
                onChange: ({ value }) => (!value ? "Date is required" : undefined),
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Date *"
                  type="date"
                  required
                />
              )}
            </form.Field>

            <form.Field name="status">
              {(field) => (
                <FormSelect field={field} label="Status *">
                  <option value="PRESENT">Present</option>
                  <option value="LATE">Late</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="ABSENT">Absent</option>
                  <option value="ON_LEAVE">On Leave</option>
                </FormSelect>
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <form.Field name="checkInTime">
              {(field) => (
                <FormInput
                  field={field}
                  label="Check-in Time"
                  type="time"
                />
              )}
            </form.Field>

            <form.Field name="checkOutTime">
              {(field) => (
                <FormInput
                  field={field}
                  label="Check-out Time"
                  type="time"
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <form.Field name="overtimeHours">
              {(field) => (
                <FormInput
                  field={field}
                  label="Overtime (Hours)"
                  type="number"
                  step="0.5"
                  min="0"
                />
              )}
            </form.Field>

            <form.Field name="lateMinutes">
              {(field) => (
                <FormInput
                  field={field}
                  label="Late (Minutes)"
                  type="number"
                  min="0"
                />
              )}
            </form.Field>
          </div>

          <form.Field name="location">
            {(field) => (
              <FormInput
                field={field}
                label="Project Site / Location"
                type="text"
                placeholder="e.g. Dubai Hills Fitout Project"
              />
            )}
          </form.Field>

          <form.Field name="notes">
            {(field) => (
              <FormInput
                field={field}
                label="Notes / Remarks"
                type="text"
                placeholder="Additional context..."
              />
            )}
          </form.Field>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <FormSubmit
              form={form}
              loading={recordAttendance.isPending}
            >
              Save Entry
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
