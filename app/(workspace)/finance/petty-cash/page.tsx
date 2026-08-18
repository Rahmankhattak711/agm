"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useCreatePettyCash, usePettyCash, PettyCashTransaction } from "@/lib/hooks/api-hooks";
import {
  Button,
  Input,
  DataTable,
  Modal,
} from "@/components/ui";

export default function PettyCashPage() {
  const { data: transactions = [], isLoading, error } = usePettyCash();
  const createPettyCashMutation = useCreatePettyCash();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [voucherNumber, setVoucherNumber] = useState(`PCV-${Date.now().toString().slice(-5)}`);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("Operational Expense");
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState<"DISBURSEMENT" | "TOP_UP">("DISBURSEMENT");
  const [receiptImageUrl, setReceiptImageUrl] = useState("");
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

  const handleOpenModal = () => {
    setVoucherNumber(`PCV-${Date.now().toString().slice(-5)}`);
    setTransactionDate(new Date().toISOString().split("T")[0]);
    setCategory("Operational Expense");
    setAmount("");
    setTransactionType("DISBURSEMENT");
    setReceiptImageUrl("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!voucherNumber.trim() || !amount || Number(amount) <= 0) {
      setFormError("Please provide a valid voucher number and positive amount.");
      return;
    }

    try {
      await createPettyCashMutation.mutateAsync({
        voucherNumber: voucherNumber.trim(),
        transactionDate,
        category: category.trim(),
        amount: Number(amount),
        transactionType,
        receiptImageUrl: receiptImageUrl.trim() || undefined,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to record petty cash voucher");
    }
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
        header: "Category",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-800">{row.original.category}</span>
        ),
      },
      {
        accessorKey: "transactionType",
        header: "Type",
        cell: ({ row }) => {
          const isTopUp = row.original.transactionType === "TOP_UP";
          return (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                isTopUp ? "bg-blue-100 text-blue-800 border border-blue-200" : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              {isTopUp ? "Top-Up" : "Disbursement"}
            </span>
          );
        },
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => {
          const isTopUp = row.original.transactionType === "TOP_UP";
          return (
            <div className="text-right font-mono font-bold text-xs">
              <span className={isTopUp ? "text-blue-700" : "text-slate-900"}>
                {isTopUp ? "+" : "-"} {formatCurrency(row.original.amount)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "isApproved",
        header: "Approval",
        cell: ({ row }) => (
          <div className="text-center">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                row.original.isApproved ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"
              }`}
            >
              {row.original.isApproved ? "Approved" : "Recorded"}
            </span>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Petty Cash Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log small cash disbursements, operational expenses, bank fees, and cash float top-ups.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={handleOpenModal}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
          }
          className="self-start shadow-sm"
        >
          Record Voucher
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Net Cash Float Balance</p>
          <p className={`text-xl font-black mt-1 ${netBalance >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            {formatCurrency(netBalance)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Current available cash on hand</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Disbursements</p>
          <p className="text-xl font-black text-slate-800 mt-1">{formatCurrency(totalDisbursements)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Disbursed for operational expenses</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Top-Ups</p>
          <p className="text-xl font-black text-slate-800 mt-1">{formatCurrency(totalTopUps)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Bank cash replenishments</p>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-72">
            <Input
              type="text"
              placeholder="Search voucher # or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Type Toggle Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                filterType === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("DISBURSEMENT")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                filterType === "DISBURSEMENT" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Disbursements
            </button>
            <button
              onClick={() => setFilterType("TOP_UP")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                filterType === "TOP_UP" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Top-Ups
            </button>
          </div>
        </div>

        {/* TanStack DataTable View */}
        <DataTable
          columns={columns}
          data={filteredTransactions}
          isLoading={isLoading}
          emptyTitle="No petty cash vouchers recorded"
          emptyMessage="Record your first cash voucher using the button above."
        />
      </div>

      {/* Modal: Record Petty Cash Voucher */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Petty Cash Voucher"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Voucher Number"
              value={voucherNumber}
              onChange={(e) => setVoucherNumber(e.target.value)}
              required
            />
            <Input
              type="date"
              label="Date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTransactionType("DISBURSEMENT")}
                className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  transactionType === "DISBURSEMENT"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                Disbursement (Expense)
              </button>
              <button
                type="button"
                onClick={() => setTransactionType("TOP_UP")}
                className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  transactionType === "TOP_UP"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                Top-Up (Replenish)
              </button>
            </div>
          </div>

          <Input
            label="Category / Description"
            placeholder="e.g. Office Supplies, Refreshments, Courier"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />

          <Input
            type="number"
            step="0.01"
            label="Amount (AED)"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
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
              disabled={createPettyCashMutation.isPending}
            >
              {createPettyCashMutation.isPending ? "Saving..." : "Save Voucher"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
