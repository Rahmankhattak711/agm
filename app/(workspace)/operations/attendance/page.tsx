"use client";

import { useCallback, useMemo, useState } from "react";
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
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
  FormInput,
  FormSelect,
  FormSubmit,
  DashboardCard,
  DashboardCardGrid,
  PageHeader,
  FilterBar,
} from "@/components/ui";
import {
  PlusIcon,
  TrashIcon,
  EditIcon,
  CheckCircle2Icon,
} from "@/components/icons";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/context/ConfirmContext";

export default function AttendancePage() {
  const { canModify } = useAuth();
  const { confirm } = useConfirm();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [employeeFilter, setEmployeeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSavingAll, setIsSavingAll] = useState(false);

  const {
    data: records = [],
    isLoading,
    error,
  } = useDailyAttendance({
    date: selectedDate,
    employeeId: employeeFilter || undefined,
  });

  const { data: employees = [], isLoading: isEmployeesLoading } = useEmployees({
    status: "ACTIVE",
  });
  const recordAttendance = useRecordAttendance();
  const deleteAttendance = useDeleteAttendance();

  const effectiveRecords = useMemo(() => {
    const recordMap = new Map<string, DailyAttendance>();
    for (const r of records) {
      if (r.employeeId) {
        recordMap.set(r.employeeId, r);
      }
    }

    const targetEmployees = employeeFilter
      ? employees.filter((e) => e.id === employeeFilter)
      : employees;

    const result: DailyAttendance[] = [];
    const processedEmployeeIds = new Set<string>();

    for (const emp of targetEmployees) {
      processedEmployeeIds.add(emp.id);
      const existing = recordMap.get(emp.id);
      if (existing) {
        result.push(existing);
      } else {
        result.push({
          id: `default-${emp.id}-${selectedDate}`,
          employeeId: emp.id,
          employee: {
            id: emp.id,
            employeeCode: emp.employeeCode,
            firstName: emp.firstName,
            lastName: emp.lastName,
            department: emp.department,
            designation: emp.designation,
          },
          attendanceDate: selectedDate,
          checkInTime: `${selectedDate}T08:00:00`,
          checkOutTime: `${selectedDate}T17:00:00`,
          status: "PRESENT",
          workingHours: 8.0,
          overtimeHours: 0,
          lateMinutes: 0,
          location: "Main Office / On-Site",
          notes: "Present (Always Present)",
          createdAt: new Date().toISOString(),
        });
      }
    }

    for (const r of records) {
      if (!processedEmployeeIds.has(r.employeeId)) {
        if (!employeeFilter || r.employeeId === employeeFilter) {
          result.push(r);
        }
      }
    }

    return result;
  }, [records, employees, selectedDate, employeeFilter]);

  const filteredRecords = useMemo(() => {
    return effectiveRecords.filter((r) => {
      if (statusFilter === "ALL") return true;
      return r.status === statusFilter;
    });
  }, [effectiveRecords, statusFilter]);

  const stats = useMemo(
    () => ({
      present: effectiveRecords.filter((r) => r.status === "PRESENT").length,
      late: effectiveRecords.filter((r) => r.status === "LATE").length,
      absent: effectiveRecords.filter((r) => r.status === "ABSENT").length,
      onLeave: effectiveRecords.filter((r) => r.status === "ON_LEAVE").length,
      overtime: effectiveRecords.reduce(
        (acc, r) => acc + Number(r.overtimeHours || 0),
        0,
      ),
    }),
    [effectiveRecords],
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

  const handleOpenModal = useCallback(() => {
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
  }, [employees, form, selectedDate]);

  const handleEditRecord = useCallback(
    (rec: DailyAttendance) => {
      setFormError("");
      const formatTime = (timeStr?: string | null, fallback = "08:00") => {
        if (!timeStr) return fallback;
        try {
          const d = new Date(timeStr);
          if (isNaN(d.getTime())) return fallback;
          return `${String(d.getHours()).padStart(2, "0")}:${String(
            d.getMinutes(),
          ).padStart(2, "0")}`;
        } catch {
          return fallback;
        }
      };

      const dateStr = rec.attendanceDate
        ? rec.attendanceDate.split("T")[0]
        : selectedDate;

      form.reset({
        employeeId: rec.employeeId,
        attendanceDate: dateStr,
        checkInTime: formatTime(rec.checkInTime, "08:00"),
        checkOutTime: formatTime(rec.checkOutTime, "17:00"),
        status: rec.status,
        workingHours:
          rec.workingHours !== undefined && rec.workingHours !== null
            ? String(rec.workingHours)
            : "8.0",
        overtimeHours:
          rec.overtimeHours !== undefined && rec.overtimeHours !== null
            ? String(rec.overtimeHours)
            : "0.0",
        lateMinutes:
          rec.lateMinutes !== undefined && rec.lateMinutes !== null
            ? String(rec.lateMinutes)
            : "0",
        location: rec.location || "",
        notes: rec.notes || "",
      });
      setIsModalOpen(true);
    },
    [form, selectedDate],
  );

  const handleMarkAllPresent = useCallback(async () => {
    if (!employees.length) return;
    setIsSavingAll(true);
    try {
      const payload = employees.map((emp) => ({
        employeeId: emp.id,
        attendanceDate: selectedDate,
        checkInTime: `${selectedDate}T08:00:00`,
        checkOutTime: `${selectedDate}T17:00:00`,
        status: "PRESENT",
        workingHours: 8.0,
        overtimeHours: 0,
        lateMinutes: 0,
        location: "Main Office / On-Site",
        notes: "Marked present",
      }));
      await recordAttendance.mutateAsync(payload);
    } catch (err: any) {
      console.error("Failed to mark all present:", err);
    } finally {
      setIsSavingAll(false);
    }
  }, [employees, selectedDate, recordAttendance]);

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
          const isPersisted = !row.original.id.startsWith("default-");
          return (
            <div className="flex items-center justify-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleEditRecord(row.original)}
                className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-teal-800 rounded-lg hover:bg-teal-50 transition cursor-pointer"
                title="Edit / Update Attendance"
              >
                <EditIcon size={18} className="w-[18px] h-[18px]" />
              </Button>
              {isPersisted && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const isConfirmed = await confirm({
                      title: "Reset Attendance",
                      message:
                        "Reset attendance entry back to default Present?",
                      variant: "warning",
                      confirmText: "Reset",
                    });
                    if (isConfirmed) {
                      try {
                        await deleteAttendance.mutateAsync(row.original.id);
                        toast.success("Attendance entry reset");
                      } catch (err: any) {
                        toast.error(
                          err.message || "Failed to reset attendance",
                        );
                      }
                    }
                  }}
                  className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-amber-700 rounded-lg hover:bg-amber-50 transition cursor-pointer"
                  title="Reset to Present"
                >
                  <TrashIcon size={18} className="w-[18px] h-[18px]" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [canModify, deleteAttendance, handleEditRecord],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Attendance"
        description="Track workforce attendance, site check-ins, working hours, and overtime logs."
        actions={
          canModify(null, ["HR"]) && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllPresent}
                loading={isSavingAll}
                icon={
                  <CheckCircle2Icon size={14} className="text-emerald-700" />
                }
                className="text-xs font-bold border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 cursor-pointer"
                title="Save all active employees as Present in database for this date"
              >
                Mark All Present
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenModal}
                icon={<PlusIcon size={14} strokeWidth={2.5} />}
                className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Record Attendance
              </Button>
            </>
          )
        }
      />

      <DashboardCardGrid cols={4}>
        <DashboardCard
          title="Present On-Site"
          value={stats.present}
          subtitle="Active workers today"
          variant="success"
        />
        <DashboardCard
          title="Late Check-Ins"
          value={stats.late}
          subtitle="Tardy arrivals logged"
          variant={stats.late > 0 ? "warning" : "default"}
        />
        <DashboardCard
          title="Overtime Logged"
          value={`${stats.overtime} hrs`}
          subtitle="Approved extra hours"
          variant="default"
        />
        <DashboardCard
          title="Absent & On Leave"
          value={stats.absent + stats.onLeave}
          subtitle="Non-duty headcount"
          variant={stats.absent + stats.onLeave > 0 ? "danger" : "default"}
        />
      </DashboardCardGrid>

      <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <FilterBar
          tabs={[
            { id: "ALL", label: "All Records" },
            { id: "PRESENT", label: "Present" },
            { id: "LATE", label: "Late" },
            { id: "HALF_DAY", label: "Half Day" },
            { id: "ABSENT", label: "Absent" },
            { id: "ON_LEAVE", label: "On Leave" },
          ]}
          activeTab={statusFilter}
          onTabChange={(id) => setStatusFilter(id)}
          totalCount={filteredRecords.length}
          countLabel="Entries Listed"
          rightAction={
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-60">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="py-1.5 shadow-2xs cursor-pointer font-mono"
                />
              </div>
              <div className="w-full sm:w-64">
                <Select
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  className="py-1.5 shadow-2xs cursor-pointer"
                  options={[
                    { value: "", label: "All Active Employees" },
                    ...employees.map((emp) => ({
                      value: emp.id,
                      label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode})`,
                    })),
                  ]}
                />
              </div>
            </div>
          }
        />

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading attendance records: {(error as any).message}
          </div>
        ) : (
          <DataTable
            title="Daily Attendance & Site Activity Log"
            countLabel={`${filteredRecords.length} Active Records`}
            columns={columns}
            data={filteredRecords}
            isLoading={isLoading || isEmployeesLoading}
            emptyTitle="No attendance records found for this date"
            emptyMessage="Click 'Record Attendance' to add check-in logs."
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Site Attendance"
        maxWidth="xl"
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
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
            >
              Save Attendance Record
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
