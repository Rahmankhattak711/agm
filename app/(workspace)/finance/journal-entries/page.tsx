"use client";

import { useAuth } from "@/context/AuthContext";
import {
  useAccounts,
  useCreateJournalEntry,
  useDeleteJournalEntry,
  useJournalEntries,
  useUpdateJournalEntry,
} from "@/lib/hooks/api-hooks";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Modal } from "@/components/ui";

interface JournalLineFormItem {
  accountId: string;
  debit: number;
  credit: number;
  vatType?: "INPUT" | "OUTPUT" | null;
  taxableAmount?: number;
  vatAmount?: number;
}

export default function JournalEntriesPage() {
  const { data: journalEntries, isLoading, error } = useJournalEntries();
  const { data: accounts } = useAccounts();
  const { user } = useAuth();
  const createJournalEntryMutation = useCreateJournalEntry();
  const updateJournalEntryMutation = useUpdateJournalEntry();
  const deleteJournalEntryMutation = useDeleteJournalEntry();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "POSTED" | "DRAFT">("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  // VAT Transaction State
  const [transactionType, setTransactionType] = useState<"NON_VAT" | "VAT_5">("NON_VAT");
  const [vatNature, setVatNature] = useState<"OUTPUT" | "INPUT">("OUTPUT");
  const [vatBaseAmount, setVatBaseAmount] = useState<string>("");
  const [vatPrimaryAccount, setVatPrimaryAccount] = useState<string>("");
  const [vatBalancingAccount, setVatBalancingAccount] = useState<string>("");

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getVatAccount = (nature: "INPUT" | "OUTPUT") => {
    if (!accounts || accounts.length === 0) return "";
    if (nature === "INPUT") {
      const match = accounts.find(
        (a) =>
          a.accountCode === "2200" ||
          a.accountName.toLowerCase().includes("vat input") ||
          a.accountName.toLowerCase().includes("input tax")
      );
      return match?.id || accounts[0]?.id || "";
    } else {
      const match = accounts.find(
        (a) =>
          a.accountCode === "2210" ||
          a.accountName.toLowerCase().includes("vat output") ||
          a.accountName.toLowerCase().includes("output tax")
      );
      return match?.id || accounts[0]?.id || "";
    }
  };

  const form = useForm({
    defaultValues: {
      entryNumber: `JE-${Date.now().toString().slice(-6)}`,
      entryDate: new Date().toISOString().split("T")[0],
      description: "",
      reference: "",
      isPosted: true,
      lines: [
        { accountId: "", debit: 0, credit: 0 },
        { accountId: "", debit: 0, credit: 0 },
      ] as JournalLineFormItem[],
    },
    onSubmit: async ({ value }) => {
      setFormError("");

      if (!value.entryNumber.trim() || !value.entryDate) {
        setFormError("Entry number and date are required.");
        return;
      }

      if (value.lines.some((l) => !l.accountId)) {
        setFormError("Please select an account for all lines.");
        return;
      }

      const totalDebits = value.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
      const totalCredits = value.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);

      if (Math.abs(totalDebits - totalCredits) >= 0.001 || totalDebits <= 0) {
        setFormError(
          `Debits (${totalDebits.toFixed(2)}) must exactly equal Credits (${totalCredits.toFixed(2)}) and be greater than zero.`
        );
        return;
      }

      try {
        if (editingId) {
          await updateJournalEntryMutation.mutateAsync({
            id: editingId,
            entryNumber: value.entryNumber.trim(),
            entryDate: value.entryDate,
            description: value.description.trim() || undefined,
            reference: value.reference.trim() || undefined,
            isPosted: value.isPosted,
            lines: value.lines.map((l) => ({
              accountId: l.accountId,
              debit: Number(l.debit) || 0,
              credit: Number(l.credit) || 0,
              vatType: l.vatType,
              taxableAmount: l.taxableAmount,
              vatAmount: l.vatAmount,
            })),
          });
        } else {
          await createJournalEntryMutation.mutateAsync({
            entryNumber: value.entryNumber.trim(),
            entryDate: value.entryDate,
            description: value.description.trim() || undefined,
            reference: value.reference.trim() || undefined,
            isPosted: value.isPosted,
            lines: value.lines.map((l) => ({
              accountId: l.accountId,
              debit: Number(l.debit) || 0,
              credit: Number(l.credit) || 0,
              vatType: l.vatType,
              taxableAmount: l.taxableAmount,
              vatAmount: l.vatAmount,
            })),
          });
        }

        setIsModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to save journal entry");
      }
    },
  });

  const filteredEntries = (journalEntries || []).filter((entry) => {
    const q = search.toLowerCase();
    const matchesSearch =
      entry.entryNumber.toLowerCase().includes(q) ||
      (entry.description && entry.description.toLowerCase().includes(q)) ||
      (entry.reference && entry.reference.toLowerCase().includes(q));

    if (statusFilter === "POSTED") return matchesSearch && entry.isPosted;
    if (statusFilter === "DRAFT") return matchesSearch && !entry.isPosted;
    return matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormError("");
    setTransactionType("NON_VAT");
    setVatNature("OUTPUT");
    setVatBaseAmount("");
    setVatPrimaryAccount(accounts?.find((a) => a.type === "REVENUE")?.id || accounts?.[0]?.id || "");
    setVatBalancingAccount(accounts?.find((a) => a.accountCode === "1200" || a.type === "ASSET")?.id || accounts?.[1]?.id || "");

    form.reset({
      entryNumber: `JE-${Date.now().toString().slice(-6)}`,
      entryDate: new Date().toISOString().split("T")[0],
      description: "",
      reference: "",
      isPosted: true,
      lines: [
        { accountId: accounts?.[0]?.id || "", debit: 0, credit: 0 },
        { accountId: accounts?.[1]?.id || "", debit: 0, credit: 0 },
      ],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (je: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(je.id);
    setFormError("");

    const hasVatLines = je.lines?.some(
      (l: any) =>
        l.vatEntry ||
        l.account?.accountCode === "2200" ||
        l.account?.accountCode === "2210" ||
        l.account?.accountName?.toLowerCase().includes("vat")
    );

    setTransactionType(hasVatLines ? "VAT_5" : "NON_VAT");

    form.reset({
      entryNumber: je.entryNumber,
      entryDate: je.entryDate
        ? new Date(je.entryDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      description: je.description || "",
      reference: je.reference || "",
      isPosted: Boolean(je.isPosted),
      lines:
        je.lines && je.lines.length > 0
          ? je.lines.map((l: any) => ({
              accountId: l.accountId,
              debit: Number(l.debit) || 0,
              credit: Number(l.credit) || 0,
              vatType: l.vatEntry?.vatType || l.vatType,
              taxableAmount: l.vatEntry?.taxableAmount || l.taxableAmount,
              vatAmount: l.vatEntry?.vatAmount || l.vatAmount,
            }))
          : [
              { accountId: accounts?.[0]?.id || "", debit: 0, credit: 0 },
              { accountId: accounts?.[1]?.id || "", debit: 0, credit: 0 },
            ],
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (je: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateJournalEntryMutation.mutateAsync({
        id: je.id,
        isPosted: !je.isPosted,
      });
    } catch (err: any) {
      alert(err.message || "Failed to update entry status");
    }
  };

  const handleDelete = async (
    id: string,
    entryNum: string,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    if (
      confirm(
        `Are you sure you want to delete journal entry "${entryNum}"? This will reverse all associated line items.`,
      )
    ) {
      try {
        await deleteJournalEntryMutation.mutateAsync(id);
      } catch (err: any) {
        alert(err.message || "Failed to delete journal entry");
      }
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Journal Entries & Daybook</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Double-entry ledger transaction logs, manual journals, and audit batches.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#215a36] to-[#1c472d] hover:from-[#28633a] hover:to-[#225537] text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Journal Entry
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Entries</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{journalEntries?.length || 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">All ledger vouchers</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Posted Entries</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">
            {journalEntries?.filter((j) => j.isPosted).length || 0}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Active in general ledger</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Draft Entries</p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {journalEntries?.filter((j) => !j.isPosted).length || 0}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Pending posting review</p>
        </div>
      </div>

      <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search entry #, reference, memo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {(["ALL", "POSTED", "DRAFT"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                statusFilter === st
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {st === "ALL" ? "All" : st === "POSTED" ? "Posted" : "Drafts"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 animate-pulse">
            Loading journal transactions...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-red-500 bg-white rounded-2xl border border-slate-200">
            Error loading entries: {(error as any).message}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <p className="text-sm font-semibold text-slate-600">No journal entries found</p>
            <p className="text-xs mt-1">Click &quot;New Journal Entry&quot; to log your first transaction.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((je) => {
              const isExpanded = expandedId === je.id;
              const totalDebit = je.lines?.reduce((s, l) => s + Number(l.debit || 0), 0) || 0;

              return (
                <div
                  key={je.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition hover:border-slate-300"
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : je.id)}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                        {je.entryNumber}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">
                            {je.description || "General Journal Voucher"}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              je.isPosted
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {je.isPosted ? "Posted" : "Draft"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>
                            Date: {new Date(je.entryDate).toLocaleDateString()}
                          </span>
                          {je.reference && <span>Ref: {je.reference}</span>}
                          <span>Lines: {je.lines?.length || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Total Amount
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {formatCurrency(totalDebit)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(je, e)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                            je.isPosted
                              ? "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          {je.isPosted ? "Unpost" : "Post"}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditModal(je, e)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(je.id, je.entryNumber, e)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-3 text-xs">
                        <span className="font-bold text-slate-700">Line Items Breakdown</span>
                        <span className="text-slate-500">
                          Created by:{" "}
                          <span className="font-semibold text-slate-700">
                            {je.user?.fullName || "System Admin"}
                          </span>
                        </span>
                      </div>
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                            <th className="py-2">Account Code & Name</th>
                            <th className="py-2">Type</th>
                            <th className="py-2 text-right">Debit</th>
                            <th className="py-2 text-right">Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {je.lines?.map((line) => {
                            const isVatLine =
                              line.vatEntry ||
                              line.account?.accountCode === "2200" ||
                              line.account?.accountCode === "2210" ||
                              line.account?.accountName?.toLowerCase().includes("vat");

                            return (
                              <tr key={line.id} className="text-slate-700">
                                <td className="py-2 font-medium">
                                  <span className="font-mono font-bold text-slate-900 mr-2">
                                    {line.account?.accountCode || "N/A"}
                                  </span>
                                  <span>{line.account?.accountName || "Account Line"}</span>
                                  {isVatLine && (
                                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                                      5% VAT
                                    </span>
                                  )}
                                </td>
                                <td className="py-2">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                                    {line.account?.type || "LINE"}
                                  </span>
                                </td>
                                <td className="py-2 text-right font-mono font-semibold">
                                  {Number(line.debit) > 0
                                    ? formatCurrency(line.debit)
                                    : "—"}
                                </td>
                                <td className="py-2 text-right font-mono font-semibold">
                                  {Number(line.credit) > 0
                                    ? formatCurrency(line.credit)
                                    : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-200 font-bold text-slate-900 bg-slate-50">
                            <td colSpan={2} className="py-2 px-1">
                              Total
                            </td>
                            <td className="py-2 text-right font-mono text-emerald-700">
                              {formatCurrency(totalDebit)}
                            </td>
                            <td className="py-2 text-right font-mono text-emerald-700">
                              {formatCurrency(totalDebit)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Journal Entry" : "Record Journal Entry"}
        maxWidth="2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="p-5 space-y-4"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          {/* Transaction Type Selector: Non-VAT vs 5% VAT Transaction */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Transaction Classification
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTransactionType("NON_VAT")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  transactionType === "NON_VAT"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>📄</span>
                <span>Non-VAT Transaction (Standard)</span>
              </button>
              <button
                type="button"
                onClick={() => setTransactionType("VAT_5")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  transactionType === "VAT_5"
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-600/20"
                    : "bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50/60"
                }`}
              >
                <span>🇦🇪</span>
                <span>5% VAT Transaction (UAE VAT)</span>
              </button>
            </div>
          </div>

          {/* 5% VAT Transaction Generator Assistant */}
          {transactionType === "VAT_5" && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5">
                <div>
                  <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <span>⚡</span> 5% UAE VAT Entry Assistant
                  </h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Automatically generate 3-line balanced entry with 5% VAT calculation.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-100/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setVatNature("OUTPUT")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                      vatNature === "OUTPUT"
                        ? "bg-emerald-800 text-white shadow-xs"
                        : "text-emerald-900 hover:bg-emerald-200/60"
                    }`}
                  >
                    5% Output VAT (Sales)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVatNature("INPUT")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                      vatNature === "INPUT"
                        ? "bg-emerald-800 text-white shadow-xs"
                        : "text-emerald-900 hover:bg-emerald-200/60"
                    }`}
                  >
                    5% Input VAT (Purchases)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                    Taxable Base Amount (AED)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1000.00"
                    value={vatBaseAmount}
                    onChange={(e) => setVatBaseAmount(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-emerald-300 bg-white font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                    {vatNature === "OUTPUT" ? "Sales / Revenue Account" : "Expense / Asset Account"}
                  </label>
                  <select
                    value={vatPrimaryAccount}
                    onChange={(e) => setVatPrimaryAccount(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-emerald-300 bg-white focus:outline-none"
                  >
                    <option value="">Select Account...</option>
                    {accounts
                      ?.filter((a) => (vatNature === "OUTPUT" ? a.type === "REVENUE" : a.type === "EXPENSE" || a.type === "ASSET"))
                      .map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountCode} - {acc.accountName}
                        </option>
                      ))}
                    {accounts?.map((acc) => (
                      <option key={`all-${acc.id}`} value={acc.id}>
                        {acc.accountCode} - {acc.accountName} ({acc.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                    {vatNature === "OUTPUT" ? "Receivable / Bank Account" : "Payable / Cash / Bank Account"}
                  </label>
                  <select
                    value={vatBalancingAccount}
                    onChange={(e) => setVatBalancingAccount(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-emerald-300 bg-white focus:outline-none"
                  >
                    <option value="">Select Account...</option>
                    {accounts?.map((acc) => (
                      <option key={`offset-${acc.id}`} value={acc.id}>
                        {acc.accountCode} - {acc.accountName} ({acc.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Calculation Breakdown & Generator Button */}
              {Number(vatBaseAmount) > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white/90 border border-emerald-200">
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 text-[10px] block font-sans">Base Amount</span>
                      <span className="font-bold text-slate-800">{formatCurrency(Number(vatBaseAmount))}</span>
                    </div>
                    <div className="text-emerald-700 font-bold">+</div>
                    <div>
                      <span className="text-emerald-700 text-[10px] block font-sans">5% UAE VAT</span>
                      <span className="font-bold text-emerald-800">{formatCurrency(Number(vatBaseAmount) * 0.05)}</span>
                    </div>
                    <div className="text-slate-400">=</div>
                    <div>
                      <span className="text-slate-500 text-[10px] block font-sans">Gross Total</span>
                      <span className="font-black text-slate-900">{formatCurrency(Number(vatBaseAmount) * 1.05)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const base = Number(vatBaseAmount) || 0;
                      if (base <= 0) return;
                      const vat = Number((base * 0.05).toFixed(2));
                      const gross = Number((base + vat).toFixed(2));
                      const vatAccId = getVatAccount(vatNature);
                      const primAccId = vatPrimaryAccount || accounts?.[0]?.id || "";
                      const balAccId = vatBalancingAccount || accounts?.[1]?.id || "";

                      if (vatNature === "OUTPUT") {
                        // Sales: Debit AR/Bank (Gross), Credit Sales (Base), Credit VAT Output (VAT)
                        form.setFieldValue("lines", [
                          { accountId: balAccId, debit: gross, credit: 0 },
                          { accountId: primAccId, debit: 0, credit: base },
                          {
                            accountId: vatAccId,
                            debit: 0,
                            credit: vat,
                            vatType: "OUTPUT",
                            taxableAmount: base,
                            vatAmount: vat,
                          },
                        ]);
                      } else {
                        // Purchases: Debit Expense (Base), Debit VAT Input (VAT), Credit AP/Bank (Gross)
                        form.setFieldValue("lines", [
                          { accountId: primAccId, debit: base, credit: 0 },
                          {
                            accountId: vatAccId,
                            debit: vat,
                            credit: 0,
                            vatType: "INPUT",
                            taxableAmount: base,
                            vatAmount: vat,
                          },
                          { accountId: balAccId, debit: 0, credit: gross },
                        ]);
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>⚡</span> Populate 3-Line Entry
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <form.Field
              name="entryNumber"
              validators={{
                onChange: ({ value }) => (!value.trim() ? "Entry number is required" : undefined),
              }}
            >
              {(field) => {
                const error = field.state.meta.isTouched && field.state.meta.errors[0];
                return (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Entry Number *
                    </label>
                    <input
                      type="text"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border ${
                        error ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                      } focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono`}
                    />
                    {error && <p className="text-[11px] text-rose-600 mt-1 font-medium">{String(error)}</p>}
                  </div>
                );
              }}
            </form.Field>

            <form.Field
              name="entryDate"
              validators={{
                onChange: ({ value }) => (!value ? "Date is required" : undefined),
              }}
            >
              {(field) => (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="isPosted">
              {(field) => (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={field.state.value ? "POSTED" : "DRAFT"}
                    onChange={(e) => field.handleChange(e.target.value === "POSTED")}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-semibold"
                  >
                    <option value="POSTED">Posted (General Ledger)</option>
                    <option value="DRAFT">Draft (Unposted)</option>
                  </select>
                </div>
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="description">
              {(field) => (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description / Memo
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Office rent payment or Sales invoice #1024"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="reference">
              {(field) => (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-001"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="lines">
            {(linesField) => {
              const currentLines = linesField.state.value;

              const addLine = () => {
                linesField.handleChange([
                  ...currentLines,
                  { accountId: accounts?.[0]?.id || "", debit: 0, credit: 0 },
                ]);
              };

              const addVatLine = () => {
                // Find first non-zero line to calculate 5%
                const sourceLine = currentLines.find((l) => Number(l.debit) > 0 || Number(l.credit) > 0);
                const hasDebit = sourceLine && Number(sourceLine.debit) > 0;
                const baseVal = sourceLine ? (hasDebit ? Number(sourceLine.debit) : Number(sourceLine.credit)) : 0;
                const vatAmount = Number((baseVal * 0.05).toFixed(2));
                const vatType = hasDebit ? "INPUT" : "OUTPUT";
                const vatAccId = getVatAccount(vatType);

                linesField.handleChange([
                  ...currentLines,
                  {
                    accountId: vatAccId,
                    debit: hasDebit ? vatAmount : 0,
                    credit: !hasDebit ? vatAmount : 0,
                    vatType,
                    taxableAmount: baseVal,
                    vatAmount,
                  },
                ]);
              };

              const removeLine = (idx: number) => {
                if (currentLines.length <= 2) return;
                linesField.handleChange(currentLines.filter((_, i) => i !== idx));
              };

              const updateLine = (idx: number, fieldName: keyof JournalLineFormItem, val: any) => {
                const next = [...currentLines];
                next[idx] = { ...next[idx], [fieldName]: val };
                linesField.handleChange(next);
              };

              const totalDebits = currentLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
              const totalCredits = currentLines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
              const isBalanced = Math.abs(totalDebits - totalCredits) < 0.001 && totalDebits > 0;

              return (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">
                      Transaction Lines
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={addVatLine}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        title="Calculate 5% UAE VAT line from existing line amounts"
                      >
                        <span>🇦🇪</span> + 5% VAT Line
                      </button>
                      <button
                        type="button"
                        onClick={addLine}
                        className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 cursor-pointer transition"
                      >
                        + Add Line
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {currentLines.map((line, idx) => {
                      const selectedAccount = accounts?.find((a) => a.id === line.accountId);
                      const isVatAccount =
                        selectedAccount?.accountCode === "2200" ||
                        selectedAccount?.accountCode === "2210" ||
                        selectedAccount?.accountName?.toLowerCase().includes("vat") ||
                        line.vatType;

                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border transition ${
                            isVatAccount
                              ? "bg-emerald-50/50 border-emerald-300/80"
                              : "bg-slate-50 border-slate-200/70"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <select
                                value={line.accountId}
                                onChange={(e) => updateLine(idx, "accountId", e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none"
                              >
                                <option value="">Select Account...</option>
                                {accounts?.map((acc) => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.accountCode} - {acc.accountName} ({acc.type})
                                  </option>
                                ))}
                              </select>
                              {isVatAccount && (
                                <span className="flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-700 text-white uppercase tracking-wider">
                                  5% VAT
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="w-24 sm:w-28 relative">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Debit"
                              value={line.debit || ""}
                              onChange={(e) =>
                                updateLine(idx, "debit", parseFloat(e.target.value) || 0)
                              }
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono text-right"
                            />
                          </div>

                          <div className="w-24 sm:w-28 relative">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Credit"
                              value={line.credit || ""}
                              onChange={(e) =>
                                updateLine(idx, "credit", parseFloat(e.target.value) || 0)
                              }
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono text-right"
                            />
                          </div>

                          {(Number(line.debit) > 0 || Number(line.credit) > 0) && !isVatAccount && (
                            <button
                              type="button"
                              onClick={() => {
                                const isDeb = Number(line.debit) > 0;
                                const baseAmt = isDeb ? Number(line.debit) : Number(line.credit);
                                const vatVal = Number((baseAmt * 0.05).toFixed(2));
                                const vatType = isDeb ? "INPUT" : "OUTPUT";
                                const vatAccId = getVatAccount(vatType);

                                linesField.handleChange([
                                  ...currentLines,
                                  {
                                    accountId: vatAccId,
                                    debit: isDeb ? vatVal : 0,
                                    credit: !isDeb ? vatVal : 0,
                                    vatType,
                                    taxableAmount: baseAmt,
                                    vatAmount: vatVal,
                                  },
                                ]);
                              }}
                              className="px-2 py-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 border border-emerald-300 rounded-md cursor-pointer transition whitespace-nowrap"
                              title="Generate 5% VAT line for this item"
                            >
                              +5% VAT
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            disabled={currentLines.length <= 2}
                            className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                            title="Remove line"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100 flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${isBalanced ? "bg-emerald-500" : "bg-red-500"}`}
                      />
                      <span className={isBalanced ? "text-emerald-800" : "text-red-700"}>
                        {isBalanced
                          ? "Balanced"
                          : `Out of balance: ${(totalDebits - totalCredits).toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex gap-4 font-mono">
                      <span>Total Debits: {totalDebits.toFixed(2)}</span>
                      <span>Total Credits: {totalCredits.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            }}
          </form.Field>

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
              disabled={
                createJournalEntryMutation.isPending ||
                updateJournalEntryMutation.isPending
              }
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
            >
              {createJournalEntryMutation.isPending ||
              updateJournalEntryMutation.isPending
                ? "Saving..."
                : editingId
                  ? "Update Entry"
                  : "Post Entry"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
