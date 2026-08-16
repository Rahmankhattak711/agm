"use client";

import { useState } from "react";
import { useCreatePettyCash, usePettyCash } from "@/lib/hooks/api-hooks";

export default function PettyCashPage() {
  const { data: transactions, isLoading, error } = usePettyCash();
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

  const filteredTransactions = (transactions || []).filter((tx) => {
    const matchesSearch =
      tx.voucherNumber.toLowerCase().includes(search.toLowerCase()) ||
      tx.category.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "ALL" || tx.transactionType === filterType;
    return matchesSearch && matchesType;
  });

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
        <button
          onClick={handleOpenModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer self-start"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Record Voucher
        </button>
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
          <div className="relative w-full sm:w-72">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search voucher # or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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

        {/* Table View */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Loading petty cash transactions...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-red-500">
            Error loading transactions: {(error as any).message}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-600">No petty cash vouchers recorded</p>
            <p className="text-xs mt-1">Record your first cash voucher using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 px-3">Voucher #</th>
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3 text-right">Amount</th>
                  <th className="pb-3 px-3 text-center">Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const isTopUp = tx.transactionType === "TOP_UP";
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{tx.voucherNumber}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {new Date(tx.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">{tx.category}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isTopUp ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {isTopUp ? "Top-Up" : "Disbursement"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={isTopUp ? "text-blue-700" : "text-slate-900"}>
                          {isTopUp ? "+" : "-"} {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.isApproved ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {tx.isApproved ? "Approved" : "Recorded"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Record Petty Cash Voucher */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-900">Record Petty Cash Voucher</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Voucher Number</label>
                  <input
                    type="text"
                    value={voucherNumber}
                    onChange={(e) => setVoucherNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Office Supplies, Refreshments, Courier"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (AED)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 font-mono text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPettyCashMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {createPettyCashMutation.isPending ? "Saving..." : "Save Voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
