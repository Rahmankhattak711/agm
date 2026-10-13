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
  DashboardCard,
  DashboardCardGrid,
  PageHeader,
  FilterBar,
} from "@/components/ui";
import { CheckIcon, CloseIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/context/ConfirmContext";

export default function LeavesPage() {
  const { hasRole, canModify } = useAuth();
  const { confirm } = useConfirm();
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
            <div className="flex items-center justify-center gap-1">
              {!canApprove && !canDelete && (
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  View Only
                </span>
              )}
              {isPending && canApprove && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await updateStatus.mutateAsync({
                        id: row.original.id,
                        status: "APPROVED",
                      });
                    }}
                    className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                    title="Approve Leave"
                  >
                    <CheckIcon size={18} className="w-[18px] h-[18px]" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await updateStatus.mutateAsync({
                        id: row.original.id,
                        status: "REJECTED",
                      });
                    }}
                    className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    title="Reject Leave"
                  >
                    <CloseIcon size={18} className="w-[18px] h-[18px]" />
                  </Button>
                </>
              )}
              {canDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const isConfirmed = await confirm({
                      title: "Delete Leave Application",
                      message:
                        "Are you sure you want to delete this leave application?",
                      variant: "danger",
                      confirmText: "Delete",
                    });
                    if (isConfirmed) {
                      try {
                        await deleteLeave.mutateAsync(row.original.id);
                        toast.success("Leave application deleted");
                      } catch (err: any) {
                        toast.error(err.message || "Failed to delete leave");
                      }
                    }
                  }}
                  className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                  title="Delete Application"
                >
                  <TrashIcon size={18} className="w-[18px] h-[18px]" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [canModify, deleteLeave, hasRole, updateStatus, confirm],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        description="Review leave applications, manage annual and sick leave approvals, and track time-off balances."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenModal}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Apply for Leave
          </Button>
        }
      />

      <DashboardCardGrid cols={4}>
        <DashboardCard
          title="Pending Approvals"
          value={stats.pending}
          subtitle="Awaiting HR review"
          variant={stats.pending > 0 ? "warning" : "default"}
        />
        <DashboardCard
          title="Approved Leaves"
          value={stats.approved}
          subtitle="Granted time-off"
          variant="success"
        />
        <DashboardCard
          title="Total Leave Days"
          value={stats.totalDays}
          subtitle="Approved leave volume"
          variant="default"
        />
        <DashboardCard
          title="Rejected Requests"
          value={stats.rejected}
          subtitle="Denied leave applications"
          variant={stats.rejected > 0 ? "danger" : "default"}
        />
      </DashboardCardGrid>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <FilterBar
          tabs={[
            { id: "ALL", label: "All Requests" },
            { id: "PENDING", label: "Pending" },
            { id: "APPROVED", label: "Approved" },
            { id: "REJECTED", label: "Rejected" },
          ]}
          activeTab={statusFilter}
          onTabChange={setStatusFilter}
          totalCount={leaves.length}
          countLabel="Requests Listed"
          rightAction={
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
          }
        />

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading leave requests: {(error as any).message}
          </div>
        ) : (
          <DataTable
            title="Leave & Time-Off Applications Register"
            countLabel={`${leaves.length} Applications`}
            columns={columns}
            data={leaves}
            isLoading={isLoading}
            emptyTitle="No leave requests found"
            emptyMessage="Click 'Apply for Leave' to submit a new time-off request."
          />
        )}
      </div>

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
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
            >
              Submit Leave Application
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
