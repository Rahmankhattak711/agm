"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  useBonuses,
  useCreateBonus,
  useUpdateBonus,
  useDeleteBonus,
  useEmployees,
  BonusType,
  Bonus,
} from "@/lib/hooks/api-hooks";
import {
  Button,
  Input,
  Select,
  Textarea,
  DataTable,
  Modal,
} from "@/components/ui";

export default function BonusesPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [employeeFilter, setEmployeeFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [employeeId, setEmployeeId] = useState("");
  const [type, setType] = useState<BonusType>("PERFORMANCE");
  const [amount, setAmount] = useState("1000");
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");

  const { data: bonuses = [], isLoading, error } = useBonuses({
    month: selectedMonth || undefined,
    year: selectedYear || undefined,
    employeeId: employeeFilter || undefined,
  });

  const { data: employees = [] } = useEmployees({ status: "ACTIVE" });
  const createBonus = useCreateBonus();
  const updateBonus = useUpdateBonus();
  const deleteBonus = useDeleteBonus();

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Metrics
  const totalBonusesCount = bonuses.length;
  const approvedTotal = bonuses
    .filter((b) => b.isApproved)
    .reduce((acc, b) => acc + Number(b.amount || 0), 0);
  const pendingApprovals = bonuses.filter((b) => !b.isApproved).length;

  const handleOpenModal = () => {
    if (employees.length > 0) setEmployeeId(employees[0].id);
    setType("PERFORMANCE");
    setAmount("1000");
    setMonth((new Date().getMonth() + 1).toString());
    setYear(new Date().getFullYear().toString());
    setReason("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCreateBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!employeeId || !amount) {
      setFormError("Employee and amount are required.");
      return;
    }

    try {
      await createBonus.mutateAsync({
        employeeId,
        type,
        amount: Number(amount),
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        reason: reason.trim() || undefined,
      });

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to award bonus");
    }
  };

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<Bonus>[]>(
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
        accessorKey: "type",
        header: "Bonus Type",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-800">
            {row.original.type.replace("_", " ")}
          </span>
        ),
      },
      {
        accessorKey: "period",
        header: "Period",
        cell: ({ row }) => (
          <span className="text-slate-600">
            {row.original.month ? `M${row.original.month} / ${row.original.year}` : "-"}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-900 block text-right">
            {formatCurrency(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason / Milestone",
        cell: ({ row }) => (
          <span className="text-slate-600 max-w-xs truncate block">
            {row.original.reason || <span className="text-slate-300">-</span>}
          </span>
        ),
      },
      {
        accessorKey: "isApproved",
        header: "Approval",
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.isApproved ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Approved
              </span>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800"
                onClick={() =>
                  updateBonus.mutateAsync({
                    id: row.original.id,
                    isApproved: true,
                  })
                }
              >
                Approve
              </Button>
            )}
          </div>
        ),
      },
      {
        accessorKey: "isPaid",
        header: "Payment",
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.isPaid ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Paid
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateBonus.mutateAsync({
                    id: row.original.id,
                    isPaid: true,
                  })
                }
              >
                Mark Paid
              </Button>
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
              variant="outline"
              size="sm"
              onClick={async () => {
                if (confirm("Delete this bonus entry?")) {
                  await deleteBonus.mutateAsync(row.original.id);
                }
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [deleteBonus, updateBonus]
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Bonuses & Performance Incentives</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Project milestone achievements, festival allowances, and monthly performance rewards.
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
          Award Bonus
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Approved Incentives</p>
          <p className="text-2xl font-black text-emerald-800 font-mono mt-1">{formatCurrency(approvedTotal)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Ready for payroll disbursement</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Approvals</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{pendingApprovals}</p>
          <p className="text-xs text-slate-500 mt-0.5">Awaiting management sign-off</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Entries</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalBonusesCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Recorded this fiscal period</p>
        </div>
      </div>

      {/* Filter and TanStack Table Container */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="w-32"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Month {m}
                </option>
              ))}
            </Select>

            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="w-28"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </Select>
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
          <div className="py-8 text-center text-xs text-red-500">Error loading bonuses: {(error as any).message}</div>
        ) : (
          <DataTable
            columns={columns}
            data={bonuses}
            isLoading={isLoading}
            emptyTitle="No bonuses recorded for this period"
            emptyMessage='Click "Award Bonus" to record an incentive.'
          />
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Award Employee Bonus" maxWidth="lg">
        <form onSubmit={handleCreateBonus} className="space-y-3.5">
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
            <Select
              label="Incentive Type"
              value={type}
              onChange={(e) => setType(e.target.value as BonusType)}
            >
              <option value="PERFORMANCE">Performance Bonus</option>
              <option value="FESTIVAL">Festival / Eid Bonus</option>
              <option value="PROJECT_COMPLETION">Project Completion</option>
              <option value="ATTENDANCE">Attendance Incentive</option>
              <option value="REFERRAL">Referral Bonus</option>
              <option value="OTHER">Other</option>
            </Select>

            <Input
              label="Amount (AED) *"
              type="number"
              min="1"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Month {m}
                </option>
              ))}
            </Select>

            <Input
              label="Year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>

          <Textarea
            label="Reason / Milestone Achievement"
            rows={2}
            placeholder="Completed project ahead of schedule..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createBonus.isPending}>
              {createBonus.isPending ? "Submitting..." : "Award Bonus"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
