"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import { useAuth } from "@/context/AuthContext";
import {
  useLeaveRequests,
  useCreateLeaveRequest,
  useUpdateLeaveStatus,
  useDeleteLeaveRequest,
  useEmployees,
  LeaveType,
  LeaveStatus,
  LeaveRequest,
} from "@/lib/hooks/api-hooks";
import {
  Button,
  Select,
  DataTable,
  Modal,
  FormInput,
  FormSelect,
  FormTextarea,
  FormSubmit,
} from "@/components/ui";
import {
  CheckIcon,
  CloseIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";

export default function LeavesPage() {
  const { hasRole, canModify } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [employeeFilter, setEmployeeFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const {
    data: leaves = [],
    isLoading,
    error,
  } = useLeaveRequests({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    employeeId: employeeFilter || undefined,
  });

  const { data: employees = [] } = useEmployees({ status: "ACTIVE" });
  const createLeave = useCreateLeaveRequest();
  const updateStatus = useUpdateLeaveStatus();
  const deleteLeave = useDeleteLeaveRequest();

  const stats = useMemo(
    () => ({
      pending: leaves.filter((l) => l.status === "PENDING").length,
      approved: leaves.filter((l) => l.status === "APPROVED").length,
      rejected: leaves.filter((l) => l.status === "REJECTED").length,
      totalDays: leaves
        .filter((l) => l.status === "APPROVED")
        .reduce((sum, l) => sum + Number(l.totalDays || 0), 0),
    }),
    [leaves],
  );

  const form = useForm({
    defaultValues: {
      employeeId: "",
      leaveType: "ANNUAL" as LeaveType,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      totalDays: "1",
      reason: "",
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        await createLeave.mutateAsync({
          employeeId: value.employeeId,
          leaveType: value.leaveType,
          startDate: value.startDate,
          endDate: value.endDate,
          totalDays: Number(value.totalDays),
          reason: value.reason.trim() || undefined,
        });

        setIsModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to submit leave request");
      }
    },
  });

  const handleOpenModal = () => {
    setFormError("");
    form.reset({
      employeeId: employees[0]?.id || "",
      leaveType: "ANNUAL",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      totalDays: "1",
      reason: "",
    });
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "APPROVED":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "REJECTED":
        return "bg-rose-50 text-rose-800 border-rose-200";
      case "CANCELLED":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const columns = useMemo<ColumnDef<LeaveRequest>[]>(
    () => [
      {
        accessorKey: "employee",
        header: "Employee Details",
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-slate-900 block text-xs">
              {row.original.employee?.firstName}{" "}
              {row.original.employee?.lastName}
            </span>
            <span className="font-mono text-[10px] text-teal-800 font-bold bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded mt-0.5 inline-block">
              {row.original.employee?.employeeCode} &bull;{" "}
              {row.original.employee?.department || "Operations"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "leaveType",
        header: "Leave Type",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-800 text-xs uppercase tracking-wide">
            {row.original.leaveType}
          </span>
        ),
      },
      {
        accessorKey: "duration",
        header: "Dates & Duration",
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-xs font-semibold text-slate-800 block">
              {new Date(row.original.startDate).toLocaleDateString("en-GB")}{" "}
              &rarr;{" "}
              {new Date(row.original.endDate).toLocaleDateString("en-GB")}
            </span>
            <span className="text-[11px] font-bold text-emerald-800 font-mono">
              {row.original.totalDays} Days
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Approval Status</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                row.original.status,
              )}`}
            >
              {row.original.status}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "reason",
        header: "Notes / Reason",
        cell: ({ row }) => (
          <span className="text-xs text-slate-600 truncate max-w-xs block font-medium">
            {row.original.reason || <span className="text-slate-300">—</span>}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          const isPending = row.original.status === "PENDING";
          const canApprove = hasRole("HR");
          const canDelete = canModify(row.original.employeeId, ["HR"]);

          return (
            <div className="flex items-center justify-center gap-1.5">
              {!canApprove && !canDelete && (
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  View Only
                </span>
              )}
              {isPending && canApprove && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await updateStatus.mutateAsync({
                        id: row.original.id,
                        status: "APPROVED",
                      });
                    }}
                    icon={<CheckIcon size={12} strokeWidth={2.5} />}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 cursor-pointer"
                    title="Approve Leave"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await updateStatus.mutateAsync({
                        id: row.original.id,
                        status: "REJECTED",
                      });
                    }}
                    icon={<CloseIcon size={12} strokeWidth={2.5} />}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 cursor-pointer"
                    title="Reject Leave"
                  >
                    Reject
                  </Button>
                </>
              )}
              {canDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    if (confirm("Delete this leave application?")) {
                      await deleteLeave.mutateAsync(row.original.id);
                    }
                  }}
                  icon={<TrashIcon size={13} />}
                  title="Delete Application"
                >
                  Delete
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [canModify, deleteLeave, hasRole, updateStatus],
  );

  return (
    <div className="space-y-6">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Leave Management &amp; Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AGM FITOUT TECHNICAL SERVICES LLC — Submit and manage employee leave
            requests, <br /> approve annual/sick leaves, and track time-off
            balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenModal}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Apply for Leave
          </Button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* 1. Pending Approvals */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-amber-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Pending Approvals
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Awaiting HR review
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-amber-700 font-mono">
              {stats.pending}
            </span>
            <span className="text-xs font-bold text-amber-700 font-sans ml-1.5">
              Requests
            </span>
          </div>
        </div>

        {/* 2. Approved Leaves */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              2. Approved Leaves
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Granted time-off
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-emerald-800 font-mono">
              {stats.approved}
            </span>
            <span className="text-xs font-bold text-emerald-700 font-sans ml-1.5">
              Approved
            </span>
          </div>
        </div>

        {/* 3. Approved Days Logged */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              3. Total Leave Days
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Approved leave volume
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {stats.totalDays}
            </span>
            <span className="text-xs font-bold text-slate-500 font-sans ml-1.5">
              Days Taken
            </span>
          </div>
        </div>

        {/* 4. Rejected Requests */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-rose-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              4. Rejected Requests
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Denied leave applications
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-rose-700 font-mono">
              {stats.rejected}
            </span>
            <span className="text-xs font-bold text-rose-700 font-sans ml-1.5">
              Rejected
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
                { id: "ALL", label: "All Requests" },
                { id: "PENDING", label: "Pending" },
                { id: "APPROVED", label: "Approved" },
                { id: "REJECTED", label: "Rejected" },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant={isActive ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            <span className="text-[11px] font-bold text-slate-500 font-mono">
              {leaves.length} Requests Listed
            </span>
          </div>

          <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
            <div className="w-full sm:w-80">
              <Select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="py-1.5 shadow-2xs cursor-pointer"
                options={[
                  { value: "", label: "All Employees" },
                  ...employees.map((emp) => ({
                    value: emp.id,
                    label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode})`,
                  })),
                ]}
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading leave requests: {(error as any).message}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
              <h4 className="font-black text-xs uppercase tracking-wider text-white">
                Leave &amp; Time-Off Applications Register
              </h4>
              <span className="text-[11px] font-mono text-emerald-300 font-bold">
                {leaves.length} Applications
              </span>
            </div>

            <DataTable
              columns={columns}
              data={leaves}
              isLoading={isLoading}
              emptyTitle="No leave requests found"
              emptyMessage="Click 'Apply for Leave' to submit a new time-off request."
            />
          </div>
        )}
      </div>

      {/* Modal for Creating Leave Request */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Apply for Leave / Time-Off"
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

            <form.Field name="leaveType">
              {(field) => (
                <FormSelect
                  field={field}
                  label="Leave Type *"
                  required
                  options={[
                    { value: "ANNUAL", label: "Annual Leave" },
                    { value: "SICK", label: "Sick Leave" },
                    { value: "EMERGENCY", label: "Emergency Leave" },
                    { value: "UNPAID", label: "Unpaid Leave" },
                    { value: "MATERNITY", label: "Maternity / Paternity" },
                  ]}
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <form.Field name="startDate">
              {(field) => (
                <FormInput
                  field={field}
                  label="Start Date *"
                  type="date"
                  required
                />
              )}
            </form.Field>

            <form.Field name="endDate">
              {(field) => (
                <FormInput
                  field={field}
                  label="End Date *"
                  type="date"
                  required
                />
              )}
            </form.Field>

            <form.Field name="totalDays">
              {(field) => (
                <FormInput
                  field={field}
                  label="Total Days *"
                  type="number"
                  step="0.5"
                  required
                  className="font-mono font-bold"
                />
              )}
            </form.Field>
          </div>

          <form.Field name="reason">
            {(field) => (
              <FormTextarea
                field={field}
                label="Reason / Remarks"
                rows={3}
                placeholder="Travel plans, medical documentation notes..."
              />
            )}
          </form.Field>

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
              loading={createLeave.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
            >
              Submit Leave Application
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
