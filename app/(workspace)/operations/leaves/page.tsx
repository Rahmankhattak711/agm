"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
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
  Input,
  Select,
  Textarea,
  DataTable,
  Modal,
} from "@/components/ui";

export default function LeavesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [employeeFilter, setEmployeeFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [employeeId, setEmployeeId] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveType>("ANNUAL");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalDays, setTotalDays] = useState("1");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");

  const { data: leaves = [], isLoading, error } = useLeaveRequests({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    employeeId: employeeFilter || undefined,
  });

  const { data: employees = [] } = useEmployees({ status: "ACTIVE" });
  const createLeave = useCreateLeaveRequest();
  const updateStatus = useUpdateLeaveStatus();
  const deleteLeave = useDeleteLeaveRequest();

  // Metrics
  const pendingCount = leaves.filter((l) => l.status === "PENDING").length;
  const approvedCount = leaves.filter((l) => l.status === "APPROVED").length;
  const rejectedCount = leaves.filter((l) => l.status === "REJECTED").length;

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (new Date(val) > new Date(endDate)) {
      setEndDate(val);
      setTotalDays("1");
    } else {
      const diff = Math.ceil(
        (new Date(endDate).getTime() - new Date(val).getTime()) / (1000 * 3600 * 24)
      ) + 1;
      setTotalDays(diff.toString());
    }
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    const diff = Math.ceil(
      (new Date(val).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)
    ) + 1;
    setTotalDays(Math.max(1, diff).toString());
  };

  const handleOpenModal = () => {
    if (employees.length > 0) setEmployeeId(employees[0].id);
    setLeaveType("ANNUAL");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date().toISOString().split("T")[0]);
    setTotalDays("1");
    setReason("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!employeeId || !startDate || !endDate || !totalDays) {
      setFormError("Please fill in all required fields.");
      return;
    }

    try {
      await createLeave.mutateAsync({
        employeeId,
        leaveType,
        startDate,
        endDate,
        totalDays: Number(totalDays),
        reason: reason.trim() || undefined,
      });

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to submit leave request");
    }
  };

  const getStatusBadge = (st: LeaveStatus) => {
    switch (st) {
      case "PENDING":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Pending Approval
          </span>
        );
      case "APPROVED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Rejected
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            Cancelled
          </span>
        );
    }
  };

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<LeaveRequest>[]>(
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
        accessorKey: "leaveType",
        header: "Leave Type",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-800">
            {row.original.leaveType}
          </span>
        ),
      },
      {
        accessorKey: "period",
        header: "Period",
        cell: ({ row }) => (
          <span className="text-slate-600 whitespace-nowrap">
            {new Date(row.original.startDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}{" "}
            &rarr;{" "}
            {new Date(row.original.endDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        accessorKey: "totalDays",
        header: "Days",
        cell: ({ row }) => (
          <span className="font-bold text-slate-900">
            {row.original.totalDays}{" "}
            {Number(row.original.totalDays) === 1 ? "day" : "days"}
          </span>
        ),
      },
      {
        accessorKey: "balance",
        header: "Balance",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-700">
            {row.original.employee?.annualLeaveBalance ?? 30} days
          </span>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <span className="text-slate-600 max-w-xs truncate block">
            {row.original.reason || <span className="text-slate-300">-</span>}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            {row.original.status === "PENDING" && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    updateStatus.mutateAsync({
                      id: row.original.id,
                      status: "APPROVED",
                    })
                  }
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() =>
                    updateStatus.mutateAsync({
                      id: row.original.id,
                      status: "REJECTED",
                    })
                  }
                >
                  Reject
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (confirm("Delete this leave request?")) {
                  await deleteLeave.mutateAsync(row.original.id);
                }
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [deleteLeave, updateStatus]
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Leave Management & Vacation Balances</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review annual vacations, sick days, unpaid leaves, and manage employee leave balances.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenModal}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
          }
        >
          Request Leave
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Review</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Awaiting management action</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Approved Leaves</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{approvedCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active & upcoming leaves</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rejected Requests</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{rejectedCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Declined applications</p>
        </div>
      </div>

      {/* Filter and TanStack Table Container */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </Select>

            <Select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-60"
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
          <div className="py-8 text-center text-xs text-red-500">Error loading leaves: {(error as any).message}</div>
        ) : (
          <DataTable
            columns={columns}
            data={leaves}
            isLoading={isLoading}
            emptyTitle="No leave requests found"
            emptyMessage='Click "Request Leave" to submit a new vacation application.'
          />
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Leave Request" maxWidth="lg">
        <form onSubmit={handleCreateLeave} className="space-y-3.5">
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
                {e.firstName} {e.lastName} ({e.employeeCode}) - Balance: {e.annualLeaveBalance ?? 30} days
              </option>
            ))}
          </Select>

          <Select
            label="Leave Type *"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
          >
            <option value="ANNUAL">Annual Leave (Paid)</option>
            <option value="SICK">Sick Leave</option>
            <option value="UNPAID">Unpaid Leave</option>
            <option value="EMERGENCY">Emergency Leave</option>
            <option value="MATERNITY">Maternity Leave</option>
            <option value="PATERNITY">Paternity Leave</option>
            <option value="OTHER">Other</option>
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date *"
              type="date"
              required
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />

            <Input
              label="End Date *"
              type="date"
              required
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
            />
          </div>

          <Input
            label="Total Days *"
            type="number"
            min="0.5"
            step="0.5"
            required
            value={totalDays}
            onChange={(e) => setTotalDays(e.target.value)}
          />

          <Textarea
            label="Reason / Notes"
            rows={2}
            placeholder="Vacation travel, personal matter, medical visit..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createLeave.isPending}>
              {createLeave.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
