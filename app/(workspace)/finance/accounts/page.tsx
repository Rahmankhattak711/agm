"use client";

import { useMemo, useState, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useAccountLedger,
  ChartOfAccount,
} from "@/lib/hooks/api-hooks";
import {
  SearchIcon,
  PlusIcon,
  EyeIcon,
  FileSpreadsheetIcon,
  LockIcon,
  BookOpenIcon,
  EditIcon,
  TrashIcon,
  LandmarkIcon,
} from "@/components/icons";
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
  FormInput,
  FormSelect,
  FormSubmit,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";

const ACCOUNT_TYPES = [
  {
    value: "ASSET",
    label: "Assets",
    color: "bg-sky-50 text-sky-800 border-sky-200",
    accentColor: "bg-sky-500",
  },
  {
    value: "LIABILITY",
    label: "Liabilities",
    color: "bg-amber-50 text-amber-800 border-amber-200",
    accentColor: "bg-amber-500",
  },
  {
    value: "EQUITY",
    label: "Equity",
    color: "bg-purple-50 text-purple-800 border-purple-200",
    accentColor: "bg-purple-500",
  },
  {
    value: "REVENUE",
    label: "Revenue",
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
    accentColor: "bg-emerald-500",
  },
  {
    value: "EXPENSE",
    label: "Expenses",
    color: "bg-rose-50 text-rose-800 border-rose-200",
    accentColor: "bg-rose-500",
  },
];

export default function AccountsPage() {
  const { data: accounts = [], isLoading, error } = useAccounts();
  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();
  const deleteAccountMutation = useDeleteAccount();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(
    null,
  );
  const [ledgerAccountId, setLedgerAccountId] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<ChartOfAccount | null>(
    null,
  );
  const [formError, setFormError] = useState("");

  const { data: accountLedgerData, isLoading: isLedgerLoading } =
    useAccountLedger(ledgerAccountId || "");

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatNumber = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const filteredAccounts = useMemo(() => {
    return (accounts || []).filter((acc) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        acc.accountCode.toLowerCase().includes(q) ||
        acc.accountName.toLowerCase().includes(q) ||
        (acc.parent?.accountName &&
          acc.parent.accountName.toLowerCase().includes(q));

      const matchesType = selectedType === "ALL" || acc.type === selectedType;

      let matchesStatus = true;
      if (statusFilter === "ACTIVE") matchesStatus = acc.isActive === true;
      if (statusFilter === "INACTIVE") matchesStatus = acc.isActive === false;
      if (statusFilter === "SYSTEM") matchesStatus = Boolean(acc.isSystem);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [accounts, search, selectedType, statusFilter]);

  const classSummary = useMemo(() => {
    const map: Record<string, { count: number; totalBalance: number }> = {
      ASSET: { count: 0, totalBalance: 0 },
      LIABILITY: { count: 0, totalBalance: 0 },
      EQUITY: { count: 0, totalBalance: 0 },
      REVENUE: { count: 0, totalBalance: 0 },
      EXPENSE: { count: 0, totalBalance: 0 },
    };

    (accounts || []).forEach((a) => {
      if (!map[a.type]) {
        map[a.type] = { count: 0, totalBalance: 0 };
      }
      map[a.type].count += 1;
      map[a.type].totalBalance += Number(a.balance || 0);
    });

    return map;
  }, [accounts]);

  const bankAndCashSummary = useMemo(() => {
    const pettyCash =
      accounts.find((a) => a.accountCode === "1010")?.balance || 0;
    const rakBank =
      accounts.find((a) => a.accountCode === "1020")?.balance || 0;
    const siteFloat =
      accounts.find((a) => a.accountCode === "1030")?.balance || 0;
    const totalLiquid = pettyCash + rakBank + siteFloat;

    return { pettyCash, rakBank, siteFloat, totalLiquid };
  }, [accounts]);

  const createForm = useForm({
    defaultValues: {
      accountCode: "",
      accountName: "",
      type: "ASSET" as "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE",
      parentId: "" as string,
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        await createAccountMutation.mutateAsync({
          accountCode: value.accountCode.trim(),
          accountName: value.accountName.trim(),
          type: value.type,
          parentId: value.parentId || null,
        });
        setIsCreateModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to create account");
      }
    },
  });

  const editForm = useForm({
    defaultValues: {
      accountCode: editingAccount?.accountCode || "",
      accountName: editingAccount?.accountName || "",
      type: (editingAccount?.type || "ASSET") as
        "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE",
      parentId: (editingAccount?.parentId || "") as string,
      isActive: editingAccount?.isActive ?? true,
    },
    onSubmit: async ({ value }) => {
      if (!editingAccount) return;
      setFormError("");
      try {
        await updateAccountMutation.mutateAsync({
          id: editingAccount.id,
          data: {
            accountCode: value.accountCode.trim(),
            accountName: value.accountName.trim(),
            type: value.type,
            parentId: value.parentId || null,
            isActive: value.isActive,
          },
        });
        setEditingAccount(null);
      } catch (err: any) {
        setFormError(err.message || "Failed to update account");
      }
    },
  });

  const handleOpenCreate = () => {
    setFormError("");
    createForm.reset({
      accountCode: "",
      accountName: "",
      type: "ASSET",
      parentId: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = useCallback(
    (acc: ChartOfAccount) => {
      setFormError("");
      setEditingAccount(acc);
      editForm.reset({
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        type: acc.type,
        parentId: acc.parentId || "",
        isActive: acc.isActive,
      });
    },
    [editForm],
  );

  const handleDeleteConfirm = async () => {
    if (!deletingAccount) return;
    try {
      await deleteAccountMutation.mutateAsync(deletingAccount.id);
      setDeletingAccount(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete account");
    }
  };

  const columns = useMemo<ColumnDef<ChartOfAccount>[]>(
    () => [
      {
        accessorKey: "accountCode",
        header: "Account Code",
        cell: ({ row }) => {
          const isChild = Boolean(row.original.parentId);
          return (
            <div className="flex items-center gap-1.5">
              {isChild && <span className="text-slate-300 ml-2">↳</span>}
              <span
                onClick={() => setLedgerAccountId(row.original.id)}
                className="font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 px-2 py-0.5 rounded text-xs cursor-pointer transition-colors inline-flex items-center gap-1"
                title="Click to view Account Register"
              >
                <FileSpreadsheetIcon size={11} className="text-teal-700" />
                {row.original.accountCode}
              </span>
              {row.original.isSystem && (
                <span title="System Control Account (Protected)">
                  <LockIcon size={12} className="text-slate-400" />
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "accountName",
        header: "Account Title & Hierarchy",
        cell: ({ row }) => (
          <div>
            <div className="flex items-center gap-2">
              <span
                onClick={() => setLedgerAccountId(row.original.id)}
                className="font-bold text-slate-900 hover:text-teal-800 cursor-pointer transition-colors block leading-tight text-xs"
              >
                {row.original.accountName}
              </span>
            </div>
            {row.original.parent && (
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Sub-account of: {row.original.parent.accountName} (
                {row.original.parent.accountCode})
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Classification",
        cell: ({ row }) => {
          const typeObj = ACCOUNT_TYPES.find(
            (t) => t.value === row.original.type,
          );
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
        accessorKey: "balance",
        header: () => <div className="text-right">Live Balance</div>,
        cell: ({ row }) => {
          const bal = Number(row.original.balance || 0);
          return (
            <div className="text-right">
              <span className="font-mono font-black text-xs block text-slate-900">
                {formatNumber(bal)}
              </span>
              <span className="text-[9.5px] text-slate-400 font-mono">
                {row.original.type === "ASSET" ||
                row.original.type === "EXPENSE"
                  ? "Dr"
                  : "Cr"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "journalLinesCount",
        header: () => <div className="text-center">Entries</div>,
        cell: ({ row }) => (
          <span className="font-mono text-slate-600 font-semibold text-xs block text-center">
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
            {row.original.isActive ? "Active" : "Archived"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          const acc = row.original;
          return (
            <div className="flex items-center justify-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLedgerAccountId(acc.id)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-600 transition-colors cursor-pointer"
                title="View Account Register & Ledger"
              >
                <BookOpenIcon size={13} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleOpenEdit(acc)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                title="Edit Account Details"
              >
                <EditIcon size={13} />
              </Button>
              {!acc.isSystem && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingAccount(acc)}
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                  title="Archive or Delete Account"
                >
                  <TrashIcon size={13} />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [handleOpenEdit],
  );

  return (
    <div className="space-y-6">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Chart of Accounts (COA) &amp; General Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AGM FITOUT TECHNICAL SERVICES LLC — Master chart of accounts,
            real-time balances, parent-child hierarchies, <br /> and one-click
            account registers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Add Account
          </Button>
        </div>
      </div>

      {/* 5 Accounting Class KPI Cards (Interactive Filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {ACCOUNT_TYPES.map((t) => {
          const isSelected = selectedType === t.value;
          const summary = classSummary[t.value] || {
            count: 0,
            totalBalance: 0,
          };
          return (
            <button
              key={t.value}
              onClick={() => setSelectedType(isSelected ? "ALL" : t.value)}
              className={`relative overflow-hidden p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                isSelected
                  ? "bg-white border-emerald-500 ring-2 ring-emerald-500/20"
                  : "bg-white border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div
                className={`absolute inset-x-0 top-0 h-[2.5px] ${t.accentColor}`}
              />
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-slate-700">
                  {t.label}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${t.color}`}
                >
                  {summary.count} A/C
                </span>
              </div>
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                  AED
                </span>
                <span className="text-lg font-black font-mono text-slate-900">
                  {formatNumber(summary.totalBalance)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Treasury & Liquid Cash Position */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
              <LandmarkIcon size={16} />
            </span>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                Treasury &amp; Liquid Cash Position
              </h3>
              <p className="text-xs text-slate-500">
                Live balances across commercial bank accounts and physical petty
                cash floats
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-[10px] text-slate-400 uppercase font-bold">
              RAK Bank A/C (1020)
            </p>
            <p className="font-mono font-black text-sm text-slate-900 mt-0.5">
              {formatCurrency(bankAndCashSummary.rakBank)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-[10px] text-slate-400 uppercase font-bold">
              Petty Cash H.O. (1010)
            </p>
            <p className="font-mono font-black text-sm text-slate-900 mt-0.5">
              {formatCurrency(bankAndCashSummary.pettyCash)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-[10px] text-slate-400 uppercase font-bold">
              Site Cash Float (1030)
            </p>
            <p className="font-mono font-black text-sm text-slate-900 mt-0.5">
              {formatCurrency(bankAndCashSummary.siteFloat)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-[10px] text-emerald-800 uppercase font-bold">
              Total Net Liquidity
            </p>
            <p className="font-mono font-black text-sm text-emerald-800 mt-0.5">
              {formatCurrency(bankAndCashSummary.totalLiquid)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        {/* Search & Filter Strip */}
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Status Quick Pills */}
            <div className="flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              {[
                { id: "ALL", label: "All Statuses" },
                { id: "ACTIVE", label: "Active Accounts" },
                { id: "INACTIVE", label: "Archived Accounts" },
                { id: "SYSTEM", label: "System Accounts (🔒)" },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              {filteredAccounts.length} Accounts Displayed
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between pt-1 border-t border-slate-200/60">
            <Input
              leftIcon={<SearchIcon size={14} className="text-slate-400" />}
              placeholder="Search account code, title, or parent..."
              containerClassName="w-full sm:w-80"
              className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select
                containerClassName="w-full sm:w-48"
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none shadow-2xs cursor-pointer"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="ASSET">Assets</option>
                <option value="LIABILITY">Liabilities</option>
                <option value="EQUITY">Equity</option>
                <option value="REVENUE">Revenue</option>
                <option value="EXPENSE">Expenses</option>
              </Select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading accounts: {(error as any).message}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
              <h4 className="font-black text-xs uppercase tracking-wider text-white">
                Master Chart of Accounts Ledger
              </h4>
              <span className="text-[11px] font-mono text-emerald-300 font-bold">
                {filteredAccounts.length} Active Codes
              </span>
            </div>

            <DataTable
              columns={columns}
              data={filteredAccounts}
              isLoading={isLoading}
              emptyTitle="No accounts match your criteria"
              emptyMessage="Try resetting the search filters or adding a new account."
            />
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Chart of Account"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            createForm.handleSubmit();
          }}
          className="space-y-4 w-full sm:w-96 text-xs"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              {formError}
            </div>
          )}

          <createForm.Field
            name="accountCode"
            validators={{
              onChange: ({ value }) =>
                !value.trim() ? "Account code is required" : undefined,
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
          </createForm.Field>

          <createForm.Field
            name="accountName"
            validators={{
              onChange: ({ value }) =>
                !value.trim() ? "Account name is required" : undefined,
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
          </createForm.Field>

          <createForm.Field name="type">
            {(field) => (
              <FormSelect
                field={field}
                label="Account Classification *"
                options={ACCOUNT_TYPES.map((t) => ({
                  value: t.value,
                  label: `${t.label} (${t.value})`,
                }))}
              />
            )}
          </createForm.Field>

          <createForm.Field name="parentId">
            {(field) => (
              <FormSelect
                field={field}
                label="Parent Account (Optional Hierarchy)"
                options={[
                  { value: "", label: "-- Top-Level Primary Account --" },
                  ...accounts.map((a) => ({
                    value: a.id,
                    label: `${a.accountCode} - ${a.accountName} (${a.type})`,
                  })),
                ]}
              />
            )}
          </createForm.Field>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <FormSubmit
              form={createForm}
              variant="primary"
              loading={createAccountMutation.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
            >
              Save Account
            </FormSubmit>
          </div>
        </form>
      </Modal>

      {/* Edit Account Modal */}
      {editingAccount && (
        <Modal
          isOpen={Boolean(editingAccount)}
          onClose={() => setEditingAccount(null)}
          title={`Edit Account: ${editingAccount.accountCode}`}
          maxWidth="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              editForm.handleSubmit();
            }}
            className="space-y-4 w-full sm:w-96 text-xs"
          >
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
                {formError}
              </div>
            )}

            <editForm.Field
              name="accountCode"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "Account code is required" : undefined,
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
            </editForm.Field>

            <editForm.Field
              name="accountName"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "Account name is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Account Name *"
                  placeholder="Account name"
                  required
                />
              )}
            </editForm.Field>

            <editForm.Field name="type">
              {(field) => (
                <FormSelect
                  field={field}
                  label="Account Classification *"
                  options={ACCOUNT_TYPES.map((t) => ({
                    value: t.value,
                    label: `${t.label} (${t.value})`,
                  }))}
                />
              )}
            </editForm.Field>

            <editForm.Field name="parentId">
              {(field) => (
                <FormSelect
                  field={field}
                  label="Parent Account (Optional Hierarchy)"
                  options={[
                    { value: "", label: "-- Top-Level Primary Account --" },
                    ...accounts
                      .filter((a) => a.id !== editingAccount.id)
                      .map((a) => ({
                        value: a.id,
                        label: `${a.accountCode} - ${a.accountName}`,
                      })),
                  ]}
                />
              )}
            </editForm.Field>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActiveToggle"
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                checked={editForm.state.values.isActive}
                onChange={(e) =>
                  editForm.setFieldValue("isActive", e.target.checked)
                }
              />
              <label
                htmlFor="isActiveToggle"
                className="text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Account is Active (Enabled for Journal Postings)
              </label>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingAccount(null)}
              >
                Cancel
              </Button>
              <FormSubmit
                form={editForm}
                variant="primary"
                loading={updateAccountMutation.isPending}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
              >
                Update Account
              </FormSubmit>
            </div>
          </form>
        </Modal>
      )}

      {/* Account Register & General Ledger Modal */}
      {ledgerAccountId && (
        <Modal
          isOpen={Boolean(ledgerAccountId)}
          onClose={() => setLedgerAccountId(null)}
          title={`Account Register & General Ledger`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {isLedgerLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading account ledger transactions...
              </div>
            ) : !accountLedgerData ? (
              <div className="py-8 text-center text-xs text-rose-500">
                Account register not found.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-300 font-bold text-sm bg-white/10 px-2 py-0.5 rounded">
                        {accountLedgerData.accountCode}
                      </span>
                      <h3 className="font-extrabold text-base text-white">
                        {accountLedgerData.accountName}
                      </h3>
                      {accountLedgerData.isSystem && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          System Account
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Classification: {accountLedgerData.type}
                    </p>
                  </div>

                  <div className="text-right sm:border-l sm:border-white/10 sm:pl-4">
                    <span className="text-[10.5px] text-slate-300 block uppercase font-bold">
                      Current Running Balance
                    </span>
                    <span className="text-xl font-black font-mono text-emerald-300 block mt-0.5">
                      {formatCurrency(accountLedgerData.balance)}
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
                  <Table className="w-full text-xs text-left">
                    <TableHead className="bg-slate-50 border-b border-slate-200">
                      <TableRow>
                        <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600">
                          Date
                        </TableHeaderCell>
                        <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600">
                          Voucher / Ref
                        </TableHeaderCell>
                        <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600">
                          Description
                        </TableHeaderCell>
                        <TableHeaderCell className="py-2.5 px-3 text-right font-bold text-slate-600">
                          Debit (AED)
                        </TableHeaderCell>
                        <TableHeaderCell className="py-2.5 px-3 text-right font-bold text-slate-600">
                          Credit (AED)
                        </TableHeaderCell>
                        <TableHeaderCell className="py-2.5 px-3 text-right font-bold text-slate-600">
                          Running Balance
                        </TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody className="divide-y divide-slate-100 font-medium">
                      {accountLedgerData.ledger.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-xs text-slate-400 italic"
                          >
                            No journal transactions have been posted to this
                            account yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        accountLedgerData.ledger.map((row) => (
                          <TableRow
                            key={row.id}
                            className="hover:bg-slate-50/50"
                          >
                            <TableCell className="font-mono text-xs text-slate-600 whitespace-nowrap py-2 px-3">
                              {new Date(row.entryDate).toLocaleDateString(
                                "en-GB",
                              )}
                            </TableCell>
                            <TableCell className="font-mono font-bold text-xs text-slate-800 whitespace-nowrap py-2 px-3">
                              {row.entryNumber}
                              {row.reference && (
                                <span className="block text-[10px] text-slate-400 font-normal">
                                  Ref: {row.reference}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-slate-700 max-w-xs truncate py-2 px-3">
                              {row.description || "General Journal Entry"}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-right text-slate-800 py-2 px-3 font-bold">
                              {row.debit > 0 ? formatNumber(row.debit) : "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-right text-slate-800 py-2 px-3 font-bold">
                              {row.credit > 0 ? formatNumber(row.credit) : "—"}
                            </TableCell>
                            <TableCell className="font-mono font-black text-xs text-right text-emerald-800 whitespace-nowrap py-2 px-3">
                              {formatNumber(row.runningBalance)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <span>
                    Showing {accountLedgerData.ledger.length} chronological
                    journal line postings
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLedgerAccountId(null)}
                    className="cursor-pointer"
                  >
                    Close Register
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAccount && (
        <Modal
          isOpen={Boolean(deletingAccount)}
          onClose={() => setDeletingAccount(null)}
          title="Archive or Delete Account"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Are you sure you want to remove{" "}
              <strong className="text-slate-900">
                {deletingAccount.accountCode} - {deletingAccount.accountName}
              </strong>
              ?
            </p>
            <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              If this account has historical journal transactions, it will be
              safely <strong>archived (marked inactive)</strong> so historical
              financial statements remain balanced. If it has no transactions,
              it will be permanently deleted.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingAccount(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
                loading={deleteAccountMutation.isPending}
              >
                Confirm Remove
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
