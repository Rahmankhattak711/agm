"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import { useAuth } from "@/context/AuthContext";
import { formatAed } from "@/lib/utils/format";
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
  Select,
  DataTable,
  Modal,
  FormInput,
  FormSelect,
  FormTextarea,
  FormSubmit,
  DashboardCard,
  DashboardCardGrid,
} from "@/components/ui";
import { CheckIcon, PlusIcon, TrashIcon } from "@/components/icons";

export default function BonusesPage() {
  const { hasRole, isAdmin } = useAuth();
  const isHR = hasRole("HR") || isAdmin;
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [employeeFilter, setEmployeeFilter] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const {
    data: bonuses = [],
    isLoading,
    error,
  } = useBonuses({
    month: selectedMonth || undefined,
    year: selectedYear || undefined,
    employeeId: employeeFilter || undefined,
  });

  const { data: employees = [] } = useEmployees({ status: "ACTIVE" });
  const createBonus = useCreateBonus();
  const updateBonus = useUpdateBonus();
  const deleteBonus = useDeleteBonus();

  const filteredBonuses = useMemo(() => {
    return bonuses.filter((b) => {
      if (statusFilter === "APPROVED") return b.isApproved;
      if (statusFilter === "PENDING") return !b.isApproved;
      if (statusFilter === "PAID") return b.isPaid;
      return true;
    });
  }, [bonuses, statusFilter]);

  const approvedTotal = useMemo(
    () =>
      bonuses
        .filter((b) => b.isApproved)
        .reduce((acc, b) => acc + Number(b.amount || 0), 0),
    [bonuses],
  );

  const pendingApprovals = useMemo(
    () => bonuses.filter((b) => !b.isApproved).length,
    [bonuses],
  );

  const paidTotal = useMemo(
    () =>
      bonuses
        .filter((b) => b.isPaid)
        .reduce((acc, b) => acc + Number(b.amount || 0), 0),
    [bonuses],
  );

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
        header: "Employee Details",
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-slate-900 block text-xs">
              {row.original.employee?.firstName || ""}{" "}
              {row.original.employee?.lastName || "Staff"}
            </span>
            <span className="font-mono text-[10px] text-teal-800 font-bold bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded mt-0.5 inline-block">
              {row.original.employee?.employeeCode || "N/A"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Incentive Type",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-800 text-xs uppercase tracking-wide">
            {row.original.type.replace("_", " ")}
          </span>
        ),
      },
      {
        accessorKey: "period",
        header: "Payroll Period",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-700 font-medium">
            {String(row.original.month).padStart(2, "0")}/{row.original.year}
          </span>
        ),
      },
      {
        accessorKey: "amount",
        header: "Bonus Amount",
        cell: ({ row }) => (
          <span className="font-mono font-black text-emerald-800 text-xs">
            {formatAed(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Approval &amp; Payout</div>,
        cell: ({ row }) => {
          const isApproved = row.original.isApproved;
          const isPaid = row.original.isPaid;
          return (
            <div className="flex items-center justify-center gap-1.5">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  isApproved
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                {isApproved ? "Approved" : "Pending"}
              </span>
              {isPaid && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                  Paid
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "reason",
        header: "Notes / Justification",
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
          const isApproved = row.original.isApproved;
          if (!isHR) {
            return (
              <div className="flex items-center justify-center">
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  View Only
                </span>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-center gap-1.5">
              {!isApproved && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await updateBonus.mutateAsync({
                      id: row.original.id,
                      isApproved: true,
                    });
                  }}
                  icon={<CheckIcon size={12} strokeWidth={2.5} />}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 cursor-pointer"
                  title="Approve Bonus"
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
                icon={<TrashIcon size={13} />}
                title="Delete Grant"
              >
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [deleteBonus, isHR, updateBonus],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Bonuses &amp; Payroll
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage performance bonuses, commission allocations, milestone
            rewards, and approval statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isHR && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenModal}
              icon={<PlusIcon size={14} strokeWidth={2.5} />}
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Award Bonus
            </Button>
          )}
        </div>
      </div>

      <DashboardCardGrid cols={4}>
        <DashboardCard
          title="Approved Bonus Pool"
          value={`AED ${Number(approvedTotal).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle="Authorized performance rewards"
          variant="success"
        />
        <DashboardCard
          title="Pending Authorization"
          value={pendingApprovals}
          subtitle="Awaiting management review"
          variant={pendingApprovals > 0 ? "warning" : "default"}
        />
        <DashboardCard
          title="Total Incentive Grants"
          value={bonuses.length}
          subtitle="All logged incentive awards"
          variant="default"
        />
        <DashboardCard
          title="Disbursed via Payroll"
          value={`AED ${Number(paidTotal).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle="Paid bonuses in WPS"
          variant="default"
        />
      </DashboardCardGrid>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: "ALL", label: "All Grants" },
                { id: "APPROVED", label: "Approved" },
                { id: "PENDING", label: "Pending" },
                { id: "PAID", label: "Paid" },
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
              {filteredBonuses.length} Grants Listed
            </span>
          </div>

          <div className="pt-1 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Select
                containerClassName="w-auto"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="py-1.5 shadow-2xs cursor-pointer"
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: i + 1,
                  label: new Date(0, i).toLocaleString("default", {
                    month: "long",
                  }),
                }))}
              />

              <Select
                containerClassName="w-auto"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="py-1.5 shadow-2xs cursor-pointer font-mono"
                options={[2025, 2026, 2027].map((y) => ({
                  value: y,
                  label: y.toString(),
                }))}
              />
            </div>

            <Select
              containerClassName="w-full sm:w-64"
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

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading bonuses: {(error as any).message}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
              <h4 className="font-black text-xs uppercase tracking-wider text-white">
                Master Bonuses &amp; Incentives Register
              </h4>
              <span className="text-[11px] font-mono text-emerald-300 font-bold">
                {filteredBonuses.length} Records
              </span>
            </div>

            <DataTable
              columns={columns}
              data={filteredBonuses}
              isLoading={isLoading}
              emptyTitle="No bonuses recorded for this period"
              emptyMessage="Click 'Award Bonus / Incentive' to grant rewards to team members."
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Award Bonus / Performance Incentive"
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

            <form.Field name="type">
              {(field) => (
                <FormSelect
                  field={field}
                  label="Incentive Type *"
                  required
                  options={[
                    { value: "PERFORMANCE", label: "Performance Bonus" },
                    { value: "PROJECT_COMPLETION", label: "Project Milestone" },
                    { value: "ANNUAL", label: "Annual Bonus" },
                    { value: "COMMISSION", label: "Sales Commission" },
                    { value: "FESTIVAL", label: "Eid / Festival Reward" },
                    { value: "OTHER", label: "Other Discretionary" },
                  ]}
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <form.Field name="amount">
              {(field) => (
                <FormInput
                  field={field}
                  label="Bonus Amount (AED) *"
                  type="number"
                  step="0.01"
                  required
                  className="font-mono font-bold"
                />
              )}
            </form.Field>

            <form.Field name="month">
              {(field) => (
                <FormSelect
                  field={field}
                  label="Payroll Month *"
                  required
                  options={Array.from({ length: 12 }, (_, i) => ({
                    value: (i + 1).toString(),
                    label: new Date(0, i).toLocaleString("default", {
                      month: "long",
                    }),
                  }))}
                />
              )}
            </form.Field>

            <form.Field name="year">
              {(field) => (
                <FormSelect
                  field={field}
                  label="Payroll Year *"
                  required
                  options={[
                    { value: "2025", label: "2025" },
                    { value: "2026", label: "2026" },
                    { value: "2027", label: "2027" },
                  ]}
                />
              )}
            </form.Field>
          </div>

          <form.Field name="reason">
            {(field) => (
              <FormTextarea
                field={field}
                label="Reason / Target Achievement Details"
                rows={3}
                placeholder="Exceeded site handover milestones, client commendation..."
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
              loading={createBonus.isPending}
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
            >
              Save &amp; Grant Bonus
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
