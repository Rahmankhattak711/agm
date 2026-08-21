"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import {
  useBonuses,
  useCreateBonus,
  useUpdateBonus,
  useDeleteBonus,
  useEmployees,
  BonusType,
  Bonus,
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

export default function BonusesPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [employeeFilter, setEmployeeFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const totalBonusesCount = bonuses.length;
  const approvedTotal = bonuses
    .filter((b) => b.isApproved)
    .reduce((acc, b) => acc + Number(b.amount || 0), 0);
  const pendingApprovals = bonuses.filter((b) => !b.isApproved).length;

  const form = useForm({
    defaultValues: {
      employeeId: "",
      type: "PERFORMANCE" as BonusType,
      amount: "1000",
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear().toString(),
      reason: "",
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        await createBonus.mutateAsync({
          employeeId: value.employeeId,
          type: value.type,
          amount: Number(value.amount),
          month: parseInt(value.month, 10),
          year: parseInt(value.year, 10),
          reason: value.reason.trim() || undefined,
        });

        setIsModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to award bonus");
      }
    },
  });

  const handleOpenModal = () => {
    setFormError("");
    form.reset({
      employeeId: employees[0]?.id || "",
      type: "PERFORMANCE",
      amount: "1000",
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear().toString(),
      reason: "",
    });
    setIsModalOpen(true);
  };

  const columns = useMemo<ColumnDef<Bonus>[]>(
    () => [
      {
        accessorKey: "employee",
        header: "Employee",
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-slate-900 block">
              {row.original.employee?.firstName || ""} {row.original.employee?.lastName || "Staff"}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              Code: {row.original.employee?.employeeCode || "N/A"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Incentive Type",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-800 text-xs">
            {row.original.type.replace("_", " ")}
          </span>
        ),
      },
      {
        accessorKey: "period",
        header: "Payroll Period",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-700">
            {row.original.month}/{row.original.year}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: "Bonus Amount",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-emerald-800 text-sm">
            {formatCurrency(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Approval & Payout",
        cell: ({ row }) => {
          const isApproved = row.original.isApproved;
          const isPaid = row.original.isPaid;
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  isApproved
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {isApproved ? "Approved" : "Pending"}
              </span>
              {isPaid && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                  Paid
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "reason",
        header: "Notes",
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
          const isApproved = row.original.isApproved;
          return (
            <div className="flex items-center justify-end gap-1.5">
              {!isApproved && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-emerald-700 hover:bg-emerald-50"
                  onClick={async () => {
                    await updateBonus.mutateAsync({
                      id: row.original.id,
                      isApproved: true,
                    });
                  }}
                >
                  Approve
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  if (confirm("Delete this bonus grant?")) {
                    await deleteBonus.mutateAsync(row.original.id);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [deleteBonus, updateBonus]
  );

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Bonuses & Performance Incentives</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Commission allocations, project milestones, festival rewards, and management approvals.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenModal}
          icon={<PlusIcon className="w-4 h-4" strokeWidth={2.2} />}
        >
          Award Bonus
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Granted Bonuses</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalBonusesCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Performance awards logged</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Approved Pool Total</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{formatCurrency(approvedTotal)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Ready for payroll disbursement</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Approvals</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingApprovals}</p>
          <p className="text-xs text-slate-500 mt-0.5">Awaiting management signoff</p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2.5 w-full">
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full sm:w-40"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Month {m}
                </option>
              ))}
            </Select>

            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full sm:w-36"
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
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
            Error loading bonus records: {(error as any).message}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={bonuses}
            isLoading={isLoading}
            emptyTitle="No bonuses logged for this period"
            emptyMessage='Click "Award Bonus" to record an incentive.'
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Award Incentive / Bonus" maxWidth="lg">
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
              onChange: ({ value }) => (!value ? "Employee selection is required" : undefined),
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
            <form.Field name="type">
              {(field) => (
                <FormSelect field={field} label="Incentive Type">
                  <option value="PERFORMANCE">Performance Bonus</option>
                  <option value="FESTIVAL">Festival / Eid Bonus</option>
                  <option value="PROJECT_COMPLETION">Project Completion</option>
                  <option value="ATTENDANCE">Attendance Incentive</option>
                  <option value="REFERRAL">Referral Bonus</option>
                  <option value="OTHER">Other</option>
                </FormSelect>
              )}
            </form.Field>

            <form.Field
              name="amount"
              validators={{
                onChange: ({ value }) =>
                  !value || Number(value) <= 0 ? "Amount must be greater than 0" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Amount (AED) *"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <form.Field name="month">
              {(field) => (
                <FormSelect field={field} label="Month">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Month {m}
                    </option>
                  ))}
                </FormSelect>
              )}
            </form.Field>

            <form.Field name="year">
              {(field) => (
                <FormInput
                  field={field}
                  label="Year"
                  type="number"
                />
              )}
            </form.Field>
          </div>

          <form.Field name="reason">
            {(field) => (
              <FormTextarea
                field={field}
                label="Reason / Milestone Achievement"
                rows={2}
                placeholder="Completed project ahead of schedule..."
              />
            )}
          </form.Field>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <FormSubmit
              form={form}
              loading={createBonus.isPending}
            >
              Award Bonus
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
