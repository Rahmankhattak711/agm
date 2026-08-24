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
import { PlusIcon } from "@/components/icons";
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

  const pendingCount = leaves.filter((l) => l.status === "PENDING").length;
  const approvedCount = leaves.filter((l) => l.status === "APPROVED").length;
  const rejectedCount = leaves.filter((l) => l.status === "REJECTED").length;

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
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "APPROVED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "REJECTED":
        return "bg-rose-100 text-rose-800 border-rose-200";
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
            <span className="font-bold text-slate-900 block">
              {row.original.employee?.firstName}{" "}
              {row.original.employee?.lastName}
            </span>
            <span className="font-mono text-[10px] text-slate-500 font-semibold uppercase">
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
              {new Date(row.original.startDate).toLocaleDateString()} &rarr;{" "}
              {new Date(row.original.endDate).toLocaleDateString()}
            </span>
            <span className="text-[11px] font-bold text-emerald-800">
              {row.original.totalDays} Days
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Approval Status",
        cell: ({ row }) => (
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(
              row.original.status,
            )}`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "reason",
        header: "Notes / Reason",
        cell: ({ row }) => (
          <span className="text-xs text-slate-600 truncate max-w-xs block">
            {row.original.reason || <span className="text-slate-300">-</span>}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const isPending = row.original.status === "PENDING";
          const canApprove = hasRole("HR");
          const canDelete = canModify(row.original.employeeId, ["HR"]);

          return (
            <div className="flex items-center justify-end gap-1.5">
              {!canApprove && !canDelete && (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  View Only
                </span>
              )}
              {isPending && canApprove && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-emerald-700 hover:bg-emerald-50"
                    onClick={async () => {
                      await updateStatus.mutateAsync({
                        id: row.original.id,
                        status: "APPROVED",
                      });
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-700 hover:bg-rose-50"
                    onClick={async () => {
                      await updateStatus.mutateAsync({
                        id: row.original.id,
                        status: "REJECTED",
                      });
                    }}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Leave Management & Approvals
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track annual leaves, medical sick leaves, duration calculators, and
            supervisor authorizations.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenModal}
          icon={<PlusIcon className="w-4 h-4" strokeWidth={2.2} />}
        >
          Request Leave
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pending Review
          </p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {pendingCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Awaiting HR authorization
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Approved Leaves
          </p>
          <p className="text-2xl font-black text-emerald-800 mt-1">
            {approvedCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Granted time off</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Rejected Requests
          </p>
          <p className="text-2xl font-black text-rose-800 mt-1">
            {rejectedCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Declined applications</p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2.5 w-full">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-44"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </Select>

            <Select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full sm:w-56"
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

        {error ? (
          <div className="py-8 text-center text-xs text-red-500">
            Error loading leave records: {(error as any).message}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={leaves}
            isLoading={isLoading}
            emptyTitle="No leave applications logged"
            emptyMessage='Click "Request Leave" to submit a new vacation application.'
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Leave Request"
        maxWidth="lg"
      >
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
              onChange: ({ value }) =>
                !value ? "Employee selection is required" : undefined,
            }}
          >
            {(field) => (
              <FormSelect field={field} label="Employee *" required>
                <option value="">-- Select Employee --</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.employeeCode}) - Balance:{" "}
                    {e.annualLeaveBalance ?? 30} days
                  </option>
                ))}
              </FormSelect>
            )}
          </form.Field>

          <form.Field name="leaveType">
            {(field) => (
              <FormSelect field={field} label="Leave Type *">
                <option value="ANNUAL">Annual Leave (Paid)</option>
                <option value="SICK">Sick Leave</option>
                <option value="UNPAID">Unpaid Leave</option>
                <option value="EMERGENCY">Emergency Leave</option>
                <option value="MATERNITY">Maternity Leave</option>
                <option value="PATERNITY">Paternity Leave</option>
                <option value="OTHER">Other</option>
              </FormSelect>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-3">
            <form.Field
              name="startDate"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Start date is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Start Date *"
                  type="date"
                  required
                />
              )}
            </form.Field>

            <form.Field
              name="endDate"
              validators={{
                onChange: ({ value }) =>
                  !value ? "End date is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="End Date *"
                  type="date"
                  required
                />
              )}
            </form.Field>
          </div>

          <form.Field
            name="totalDays"
            validators={{
              onChange: ({ value }) =>
                !value || Number(value) <= 0
                  ? "Total days must be greater than 0"
                  : undefined,
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                label="Total Days *"
                type="number"
                min="0.5"
                step="0.5"
                required
              />
            )}
          </form.Field>

          <form.Field name="reason">
            {(field) => (
              <FormTextarea
                field={field}
                label="Reason / Notes"
                rows={2}
                placeholder="Vacation travel, personal matter, medical visit..."
              />
            )}
          </form.Field>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <FormSubmit form={form} loading={createLeave.isPending}>
              Submit Request
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
