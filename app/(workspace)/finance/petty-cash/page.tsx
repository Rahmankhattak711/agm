"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import { useCreatePettyCash, usePettyCash, PettyCashTransaction } from "@/lib/hooks/api-hooks";
import { PlusIcon } from "@/components/icons";
import {
  Button,
  Input,
  DataTable,
  Modal,
  FormInput,
  FormSubmit,
} from "@/components/ui";

export default function PettyCashPage() {
  const { data: transactions = [], isLoading, error } = usePettyCash();
  const createPettyCashMutation = useCreatePettyCash();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalTopUps = (transactions || [])
    .filter((t) => t.transactionType === "TOP_UP")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const totalDisbursements = (transactions || [])
    .filter((t) => t.transactionType === "DISBURSEMENT")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const netBalance = totalTopUps - totalDisbursements;

  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((tx) => {
      const matchesSearch =
        tx.voucherNumber.toLowerCase().includes(search.toLowerCase()) ||
        tx.category.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === "ALL" || tx.transactionType === filterType;
      return matchesSearch && matchesType;
    });
  }, [transactions, search, filterType]);

  const form = useForm({
    defaultValues: {
      voucherNumber: `PCV-${Date.now().toString().slice(-5)}`,
      transactionDate: new Date().toISOString().split("T")[0],
      category: "Operational Expense",
      amount: "",
      transactionType: "DISBURSEMENT" as "DISBURSEMENT" | "TOP_UP",
      receiptImageUrl: "",
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        await createPettyCashMutation.mutateAsync({
          voucherNumber: value.voucherNumber.trim(),
          transactionDate: value.transactionDate,
          category: value.category.trim(),
          amount: Number(value.amount),
          transactionType: value.transactionType,
          receiptImageUrl: value.receiptImageUrl.trim() || undefined,
        });
        setIsModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to record petty cash voucher");
      }
    },
  });

  const handleOpenModal = () => {
    setFormError("");
    form.reset({
      voucherNumber: `PCV-${Date.now().toString().slice(-5)}`,
      transactionDate: new Date().toISOString().split("T")[0],
      category: "Operational Expense",
      amount: "",
      transactionType: "DISBURSEMENT",
      receiptImageUrl: "",
    });
    setIsModalOpen(true);
  };

  const columns = useMemo<ColumnDef<PettyCashTransaction>[]>(
    () => [
      {
        accessorKey: "voucherNumber",
        header: "Voucher #",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
            {row.original.voucherNumber}
          </span>
        ),
      },
      {
        accessorKey: "transactionDate",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-slate-600 text-xs">
            {new Date(row.original.transactionDate).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Category / Description",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900 text-xs">
            {row.original.category}
          </span>
        ),
      },
      {
        accessorKey: "transactionType",
        header: "Type",
        cell: ({ row }) => {
          const isTopUp = row.original.transactionType === "TOP_UP";
          return (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                isTopUp
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {isTopUp ? "Top-Up" : "Disbursement"}
            </span>
          );
        },
      },
      {
        accessorKey: "amount",
        header: "Amount (AED)",
        cell: ({ row }) => {
          const isTopUp = row.original.transactionType === "TOP_UP";
          return (
            <span
              className={`font-mono font-bold text-xs ${
                isTopUp ? "text-blue-700" : "text-slate-900"
              }`}
            >
              {isTopUp ? "+" : "-"} {formatCurrency(row.original.amount)}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Approval",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
              row.original.isApproved ? "text-emerald-700" : "text-amber-600"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                row.original.isApproved ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {row.original.isApproved ? "Approved" : "Pending"}
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
          <h2 className="text-xl font-black text-slate-900">Petty Cash Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track daily disbursements, operational cash expenses, and replenishment top-ups.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenModal}
          icon={<PlusIcon className="w-4 h-4" strokeWidth={2.2} />}
        >
          Add Voucher
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Available Float Balance</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{formatCurrency(netBalance)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Net in-hand cash</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Disbursements</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalDisbursements)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Expenses paid out</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Top-Ups</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{formatCurrency(totalTopUps)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Replenishments credited</p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search voucher # or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            {["ALL", "DISBURSEMENT", "TOP_UP"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  filterType === type
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {type === "ALL" ? "All" : type === "DISBURSEMENT" ? "Disbursements" : "Top-Ups"}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-red-500">
            Error loading petty cash records: {(error as any).message}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredTransactions}
            isLoading={isLoading}
            emptyTitle="No petty cash vouchers logged"
            emptyMessage="Click 'Add Voucher' to record cash expenses or top-ups."
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Petty Cash Voucher"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <form.Field
              name="voucherNumber"
              validators={{
                onChange: ({ value }) => (!value.trim() ? "Voucher number is required" : undefined),
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Voucher Number *"
                  required
                />
              )}
            </form.Field>

            <form.Field
              name="transactionDate"
              validators={{
                onChange: ({ value }) => (!value ? "Date is required" : undefined),
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  type="date"
                  label="Date *"
                  required
                />
              )}
            </form.Field>
          </div>

          <form.Field name="transactionType">
            {(field) => (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => field.handleChange("DISBURSEMENT")}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      field.state.value === "DISBURSEMENT"
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    Disbursement (Expense)
                  </button>
                  <button
                    type="button"
                    onClick={() => field.handleChange("TOP_UP")}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      field.state.value === "TOP_UP"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    Top-Up (Replenish)
                  </button>
                </div>
              </div>
            )}
          </form.Field>

          <form.Field
            name="category"
            validators={{
              onChange: ({ value }) => (!value.trim() ? "Category / description is required" : undefined),
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                label="Category / Description *"
                placeholder="e.g. Office Supplies, Refreshments, Courier"
                required
              />
            )}
          </form.Field>

          <form.Field
            name="amount"
            validators={{
              onChange: ({ value }) =>
                !value || Number(value) <= 0 ? "Please enter a valid positive amount" : undefined,
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                type="number"
                step="0.01"
                label="Amount (AED) *"
                placeholder="0.00"
                required
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
              loading={createPettyCashMutation.isPending}
            >
              Save Voucher
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
