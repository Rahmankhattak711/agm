"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import { useAccounts, useCreateAccount, ChartOfAccount } from "@/lib/hooks/api-hooks";
import { PlusIcon } from "@/components/icons";
import {
  Button,
  Input,
  DataTable,
  Modal,
  FormInput,
  FormSelect,
  FormSubmit,
} from "@/components/ui";

const ACCOUNT_TYPES = [
  { value: "ASSET", label: "Asset", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "LIABILITY", label: "Liability", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "EQUITY", label: "Equity", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "REVENUE", label: "Revenue", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "EXPENSE", label: "Expense", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

export default function AccountsPage() {
  const { data: accounts = [], isLoading, error } = useAccounts();
  const createAccountMutation = useCreateAccount();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const filteredAccounts = useMemo(() => {
    return (accounts || []).filter((acc) => {
      const matchesSearch =
        acc.accountCode.toLowerCase().includes(search.toLowerCase()) ||
        acc.accountName.toLowerCase().includes(search.toLowerCase());
      const matchesType = selectedType === "ALL" || acc.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [accounts, search, selectedType]);

  const countByType = (accType: string) =>
    (accounts || []).filter((a) => a.type === accType).length;

  const form = useForm({
    defaultValues: {
      accountCode: "",
      accountName: "",
      type: "ASSET" as "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE",
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        await createAccountMutation.mutateAsync({
          accountCode: value.accountCode.trim(),
          accountName: value.accountName.trim(),
          type: value.type,
        });
        setIsModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to create account");
      }
    },
  });

  const handleOpenModal = () => {
    setFormError("");
    form.reset({
      accountCode: "",
      accountName: "",
      type: "ASSET",
    });
    setIsModalOpen(true);
  };

  const columns = useMemo<ColumnDef<ChartOfAccount>[]>(
    () => [
      {
        accessorKey: "accountCode",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
            {row.original.accountCode}
          </span>
        ),
      },
      {
        accessorKey: "accountName",
        header: "Account Name",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900">{row.original.accountName}</span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const typeObj = ACCOUNT_TYPES.find((t) => t.value === row.original.type);
          return (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                typeObj?.color || "bg-slate-100 text-slate-700"
              }`}
            >
              {typeObj?.label || row.original.type}
            </span>
          );
        },
      },
      {
        accessorKey: "journalLinesCount",
        header: "Transactions",
        cell: ({ row }) => (
          <span className="text-slate-500 font-medium text-xs">
            {row.original._count?.journalLines ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
              row.original.isActive ? "text-emerald-700" : "text-slate-400"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                row.original.isActive ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />
            {row.original.isActive ? "Active" : "Inactive"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">General Ledger & Accounts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your Chart of Accounts across standard accounting classification hierarchies.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenModal}
          icon={<PlusIcon className="w-4 h-4" strokeWidth={2.2} />}
        >
          Add Account
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ACCOUNT_TYPES.map((t) => {
          const isSelected = selectedType === t.value;
          const count = countByType(t.value);
          return (
            <button
              key={t.value}
              onClick={() => setSelectedType(isSelected ? "ALL" : t.value)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? "bg-white border-emerald-500 ring-2 ring-emerald-500/10 shadow-sm"
                  : "bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{t.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${t.color}`}>
                  {count}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Class {t.value}</p>
            </button>
          );
        })}
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search code or account name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <p className="text-xs text-slate-500 self-end sm:self-auto font-medium">
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </p>
        </div>

        <DataTable
          columns={columns}
          data={filteredAccounts}
          isLoading={isLoading}
          emptyTitle="No accounts match your criteria"
          emptyMessage="Try resetting the search or adding a new account."
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Chart of Account"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4 w-96"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <form.Field
            name="accountCode"
            validators={{
              onChange: ({ value }) => (!value.trim() ? "Account code is required" : undefined),
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                label="Account Code *"
                placeholder="e.g. 1050, 4020, 5300"
                required
              />
            )}
          </form.Field>

          <form.Field
            name="accountName"
            validators={{
              onChange: ({ value }) => (!value.trim() ? "Account name is required" : undefined),
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                label="Account Name *"
                placeholder="e.g. Office Stationery, Marketing Revenue"
                required
              />
            )}
          </form.Field>

          <form.Field name="type">
            {(field) => (
              <FormSelect
                field={field}
                label="Account Type"
                options={ACCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              />
            )}
          </form.Field>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <FormSubmit
              form={form}
              variant="primary"
              loading={createAccountMutation.isPending}
            >
              Save Account
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
