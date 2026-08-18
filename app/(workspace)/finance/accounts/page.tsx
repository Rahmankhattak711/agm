"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useAccounts, useCreateAccount, ChartOfAccount } from "@/lib/hooks/api-hooks";
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
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

  // Form State
  const [accountCode, setAccountCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [type, setType] = useState<"ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE">("ASSET");
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!accountCode.trim() || !accountName.trim()) {
      setFormError("Please fill in both Account Code and Account Name.");
      return;
    }

    try {
      await createAccountMutation.mutateAsync({
        accountCode: accountCode.trim(),
        accountName: accountName.trim(),
        type,
      });
      setIsModalOpen(false);
      setAccountCode("");
      setAccountName("");
      setType("ASSET");
    } catch (err: any) {
      setFormError(err.message || "Failed to create account");
    }
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
              {row.original.type}
            </span>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <div className="text-center">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                row.original.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${row.original.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
              {row.original.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-slate-500 text-xs">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Chart of Accounts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            General ledger structure defining assets, liabilities, equity, revenues, and expenses.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => setIsModalOpen(true)}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
          }
          className="self-start shadow-sm"
        >
          Add New Account
        </Button>
      </div>

      {/* Account Type Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setSelectedType("ALL")}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            selectedType === "ALL"
              ? "bg-slate-900 border-slate-900 text-white shadow-xs"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">All Accounts</p>
          <p className="text-lg font-black mt-0.5">{accounts.length}</p>
        </button>

        {ACCOUNT_TYPES.map((t) => {
          const isSelected = selectedType === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                isSelected
                  ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{t.label}</p>
              <p className="text-lg font-black mt-0.5">{countByType(t.value)}</p>
            </button>
          );
        })}
      </div>

      {/* Filter and Table Container */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-72">
            <Input
              type="text"
              placeholder="Search code or account name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <p className="text-xs text-slate-500 self-end sm:self-auto font-medium">
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </p>
        </div>

        {/* TanStack DataTable View */}
        <DataTable
          columns={columns}
          data={filteredAccounts}
          isLoading={isLoading}
          emptyTitle="No accounts match your criteria"
          emptyMessage="Try resetting the search or adding a new account."
        />
      </div>

      {/* Modal: Create Account */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Chart of Account"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <Input
            label="Account Code"
            placeholder="e.g. 1050, 4020, 5300"
            value={accountCode}
            onChange={(e) => setAccountCode(e.target.value)}
            required
          />

          <Input
            label="Account Name"
            placeholder="e.g. Office Stationery, Marketing Revenue"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
          />

          <Select
            label="Account Type"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            options={ACCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          />

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createAccountMutation.isPending}
            >
              {createAccountMutation.isPending ? "Creating..." : "Save Account"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
