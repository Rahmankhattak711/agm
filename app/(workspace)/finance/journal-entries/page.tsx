"use client";

import AgmLogo from "@/components/AgmLogo";
import { useAuth } from "@/context/AuthContext";
import {
  useAccounts,
  useCreateJournalEntry,
  useDeleteJournalEntry,
  useJournalEntries,
  useUpdateJournalEntry,
} from "@/lib/hooks/api-hooks";
import { useState } from "react";

export default function JournalEntriesPage() {
  const { data: journalEntries, isLoading, error } = useJournalEntries();
  const { data: accounts } = useAccounts();
  const { user } = useAuth();
  const createJournalEntryMutation = useCreateJournalEntry();
  const updateJournalEntryMutation = useUpdateJournalEntry();
  const deleteJournalEntryMutation = useDeleteJournalEntry();

  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printingEntry, setPrintingEntry] = useState<any | null>(null);

  // Form state
  const [entryNumber, setEntryNumber] = useState(
    `JE-${Date.now().toString().slice(-6)}`,
  );
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<
    Array<{ accountId: string; debit: number; credit: number }>
  >([
    { accountId: "", debit: 0, credit: 0 },
    { accountId: "", debit: 0, credit: 0 },
  ]);
  const [formError, setFormError] = useState("");

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const filteredEntries = (journalEntries || []).filter((entry) => {
    const q = search.toLowerCase();
    return (
      entry.entryNumber.toLowerCase().includes(q) ||
      (entry.description && entry.description.toLowerCase().includes(q)) ||
      (entry.reference && entry.reference.toLowerCase().includes(q))
    );
  });

  const totalDebitsCalc = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCreditsCalc = lines.reduce(
    (s, l) => s + (Number(l.credit) || 0),
    0,
  );
  const isLinesBalanced =
    Math.abs(totalDebitsCalc - totalCreditsCalc) < 0.001 && totalDebitsCalc > 0;

  const addLine = () => {
    setLines([
      ...lines,
      { accountId: accounts?.[0]?.id || "", debit: 0, credit: 0 },
    ]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (
    idx: number,
    field: "accountId" | "debit" | "credit",
    value: any,
  ) => {
    const next = [...lines];
    next[idx] = { ...next[idx], [field]: value };
    setLines(next);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setEntryNumber(`JE-${Date.now().toString().slice(-6)}`);
    setEntryDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setReference("");
    setLines([
      { accountId: accounts?.[0]?.id || "", debit: 0, credit: 0 },
      { accountId: accounts?.[1]?.id || "", debit: 0, credit: 0 },
    ]);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (je: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingId(je.id);
    setEntryNumber(je.entryNumber);
    setEntryDate(
      je.entryDate
        ? new Date(je.entryDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    );
    setDescription(je.description || "");
    setReference(je.reference || "");
    setLines(
      je.lines && je.lines.length > 0
        ? je.lines.map((l: any) => ({
            accountId: l.accountId,
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
          }))
        : [
            { accountId: accounts?.[0]?.id || "", debit: 0, credit: 0 },
            { accountId: accounts?.[1]?.id || "", debit: 0, credit: 0 },
          ],
    );
    setFormError("");
    setIsModalOpen(true);
  };

  const handlePrintVoucher = (je: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPrintingEntry(je);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!entryNumber.trim() || !entryDate) {
      setFormError("Entry number and date are required.");
      return;
    }

    if (lines.some((l) => !l.accountId)) {
      setFormError("Please select an account for all lines.");
      return;
    }

    if (!isLinesBalanced) {
      setFormError(
        `Debits (${totalDebitsCalc.toFixed(2)}) must exactly equal Credits (${totalCreditsCalc.toFixed(2)}) and be greater than zero.`,
      );
      return;
    }

    try {
      if (editingId) {
        await updateJournalEntryMutation.mutateAsync({
          id: editingId,
          entryNumber: entryNumber.trim(),
          entryDate,
          description: description.trim() || undefined,
          reference: reference.trim() || undefined,
          lines: lines.map((l) => ({
            accountId: l.accountId,
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
          })),
        });
      } else {
        await createJournalEntryMutation.mutateAsync({
          entryNumber: entryNumber.trim(),
          entryDate,
          description: description.trim() || undefined,
          reference: reference.trim() || undefined,
          createdBy: user?.id || "00000000-0000-0000-0000-000000000000",
          lines: lines.map((l) => ({
            accountId: l.accountId,
            debit: Number(l.debit) || 0,
            credit: Number(l.credit) || 0,
          })),
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to save journal entry");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Journal Entries & Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Double-entry accounting transaction batches, audit lines, and
            debit/credit ledger postings.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer self-start"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            className="w-4 h-4"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Record Journal Entry
        </button>
      </div>

      {/* Filter and List Container */}
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
              placeholder="Search entry #, ref, or memo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Total {journalEntries?.length || 0} journal records
          </p>
        </div>

        {/* Entries List */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Loading journal entries...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-red-500">
            Error loading journal entries: {(error as any).message}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-600">
              No journal entries found
            </p>
            <p className="text-xs mt-1">
              Create your first entry to balance your books.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((je) => {
              const isExpanded = expandedId === je.id;
              const totalDebit = (je.lines || []).reduce(
                (s, l) => s + Number(l.debit || 0),
                0,
              );

              return (
                <div
                  key={je.id}
                  className="rounded-xl border border-slate-200/90 overflow-hidden transition hover:border-slate-300 bg-white"
                >
                  {/* Row Header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : je.id)}
                    className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer bg-slate-50/40 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <button className="w-6 h-6 rounded-lg bg-slate-200/60 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                        {isExpanded ? "−" : "+"}
                      </button>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {je.entryNumber}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[9.5px] font-bold ${
                              je.isPosted
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {je.isPosted ? "Posted" : "Draft"}
                          </span>
                          {je.reference && (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                              Ref: {je.reference}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">
                          {je.description || "General Journal Transaction"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 text-xs pl-9 md:pl-0">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">
                          Date
                        </p>
                        <p className="font-semibold text-slate-700">
                          {new Date(je.entryDate).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">
                          Amount
                        </p>
                        <p className="font-bold text-slate-900">
                          {formatCurrency(totalDebit)}
                        </p>
                      </div>

                      {/* Print, Edit & Delete Action Buttons */}
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          onClick={(e) => handlePrintVoucher(je, e)}
                          title="Print Bill / Voucher"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition flex items-center gap-1"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            className="w-3.5 h-3.5"
                          >
                            <polyline points="6 9 6 2 18 2 18 9" />
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <rect x="6" y="14" width="12" height="8" />
                          </svg>
                          Print Bill
                        </button>
                        <button
                          onClick={(e) => handleOpenEditModal(je, e)}
                          title="Edit Entry"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) =>
                            handleDelete(je.id, je.entryNumber, e)
                          }
                          title="Delete Entry"
                          className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold cursor-pointer transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Breakdown Table */}
                  {isExpanded && (
                    <div className="p-4 bg-white border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Double-Entry Line Items ({je.lines?.length || 0})
                        </p>
                        <span className="text-[11px] text-slate-500">
                          Created by:{" "}
                          <span className="font-semibold">
                            {je.user?.fullName || "User"}
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
                          {je.lines?.map((line) => (
                            <tr key={line.id} className="text-slate-700">
                              <td className="py-2 font-medium">
                                <span className="font-mono font-bold text-slate-900 mr-2">
                                  {line.account?.accountCode || "N/A"}
                                </span>
                                {line.account?.accountName || "Account Line"}
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
                          ))}
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

      {/* Modal: New / Edit Journal Entry */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {editingId ? "Edit Journal Entry" : "Record Journal Entry"}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingId
                    ? "Update transaction details and balanced debit/credit lines."
                    : "Add balanced debits and credits across chart of accounts."}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Entry Number
                  </label>
                  <input
                    type="text"
                    value={entryNumber}
                    onChange={(e) => setEntryNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description / Memo
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Office rent payment or Sales invoice #1024"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-001"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800">
                    Transaction Lines
                  </h4>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    + Add Line
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {lines.map((line, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70"
                    >
                      <div className="flex-1">
                        <select
                          value={line.accountId}
                          onChange={(e) =>
                            updateLine(idx, "accountId", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none"
                        >
                          <option value="">Select Account...</option>
                          {accounts?.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.accountCode} - {acc.accountName} ({acc.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24 sm:w-28">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Debit"
                          value={line.debit || ""}
                          onChange={(e) =>
                            updateLine(
                              idx,
                              "debit",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono text-right"
                        />
                      </div>

                      <div className="w-24 sm:w-28">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Credit"
                          value={line.credit || ""}
                          onChange={(e) =>
                            updateLine(
                              idx,
                              "credit",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono text-right"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        disabled={lines.length <= 2}
                        className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                        title="Remove line"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Live Balance Summary Bar */}
                <div className="p-3 rounded-xl bg-slate-100 flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${isLinesBalanced ? "bg-emerald-500" : "bg-red-500"}`}
                    />
                    <span
                      className={
                        isLinesBalanced ? "text-emerald-800" : "text-red-700"
                      }
                    >
                      {isLinesBalanced
                        ? "Balanced"
                        : `Out of balance: ${(totalDebitsCalc - totalCreditsCalc).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span>Total Debits: {totalDebitsCalc.toFixed(2)}</span>
                    <span>Total Credits: {totalCreditsCalc.toFixed(2)}</span>
                  </div>
                </div>
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
                  disabled={
                    createJournalEntryMutation.isPending ||
                    updateJournalEntryMutation.isPending ||
                    !isLinesBalanced
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
          </div>
        </div>
      )}

      {/* Modal: Print Official Journal Voucher / Bill */}
      {printingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Top Toolbar (Hidden during print) */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 bg-slate-50 print:hidden">
              <span className="text-xs font-bold text-slate-700">
                Official Voucher Print Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-4 h-4"
                  >
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  Print Document
                </button>
                <button
                  onClick={() => setPrintingEntry(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div
              className="p-8 sm:p-10 space-y-6 text-slate-900 bg-white"
              id="printable-voucher"
            >
              {/* Header with AGM Branding */}
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-5">
                <div className="space-y-1">
                  <AgmLogo size="md" collapsed={false} />
                  <p className="text-[11px] text-slate-500 font-semibold pt-1">
                    AGM AESTHETIC HOUSE FITOUT COMPANY LLC
                  </p>
                  <p className="text-[10px] text-slate-400">
                    TRN: 100234567890003 · Dubai, United Arab Emirates
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-md">
                    JOURNAL VOUCHER / BILL
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-800 pt-1">
                    VOUCHER #: {printingEntry.entryNumber}
                  </p>
                  <p className="text-xs text-slate-500">
                    DATE:{" "}
                    {new Date(printingEntry.entryDate).toLocaleDateString(
                      "en-GB",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
              </div>

              {/* Meta information summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Reference / Invoice
                  </span>
                  <p className="font-semibold text-slate-800">
                    {printingEntry.reference || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Posting Status
                  </span>
                  <p className="font-bold text-emerald-700">
                    {printingEntry.isPosted ? "POSTED" : "DRAFT"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Prepared By
                  </span>
                  <p className="font-semibold text-slate-800">
                    {printingEntry.user?.fullName || "Accountant"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Currency
                  </span>
                  <p className="font-bold text-slate-800">AED (UAE Dirham)</p>
                </div>
              </div>

              {/* Particulars */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  PARTICULARS / DESCRIPTION:
                </span>
                <p className="text-xs font-medium text-slate-800 p-2.5 bg-slate-50/70 rounded-lg border border-slate-100 mt-1">
                  {printingEntry.description || "General Journal Transaction"}
                </p>
              </div>

              {/* Double-Entry Transaction Matrix */}
              <div>
                <table className="w-full text-xs text-left border border-slate-300">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-slate-200">
                        Account Code
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200">
                        Account Name & Description
                      </th>
                      <th className="py-2.5 px-3 border-r border-slate-200 text-right">
                        Debit (AED)
                      </th>
                      <th className="py-2.5 px-3 text-right">Credit (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {printingEntry.lines?.map((line: any) => (
                      <tr key={line.id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 border-r border-slate-200">
                          {line.account?.accountCode || "N/A"}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 border-r border-slate-200">
                          {line.account?.accountName || "Ledger Account"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold border-r border-slate-200 text-slate-900">
                          {Number(line.debit) > 0
                            ? formatCurrency(line.debit)
                            : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          {Number(line.credit) > 0
                            ? formatCurrency(line.credit)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const totalDebit = (printingEntry.lines || []).reduce(
                        (s: number, l: any) => s + Number(l.debit || 0),
                        0,
                      );
                      const totalCredit = (printingEntry.lines || []).reduce(
                        (s: number, l: any) => s + Number(l.credit || 0),
                        0,
                      );
                      return (
                        <tr className="bg-slate-100 font-black border-t-2 border-slate-800 text-slate-900">
                          <td
                            colSpan={2}
                            className="py-2.5 px-3 uppercase tracking-wider border-r border-slate-300"
                          >
                            TOTAL AMOUNT
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono border-r border-slate-300">
                            {formatCurrency(totalDebit)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {formatCurrency(totalCredit)}
                          </td>
                        </tr>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>

              {/* Signatures & Authorizations */}
              <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-200 text-center text-xs">
                <div>
                  <div className="h-12 border-b border-dashed border-slate-400 mb-2" />
                  <p className="font-bold text-slate-800">Prepared By</p>
                  <p className="text-[10px] text-slate-400">
                    Accountant / Data Entry
                  </p>
                </div>
                <div>
                  <div className="h-12 border-b border-dashed border-slate-400 mb-2" />
                  <p className="font-bold text-slate-800">Verified By</p>
                  <p className="text-[10px] text-slate-400">
                    Financial Controller
                  </p>
                </div>
                <div>
                  <div className="h-12 border-b border-dashed border-slate-400 mb-2" />
                  <p className="font-bold text-slate-800">Approved By</p>
                  <p className="text-[10px] text-slate-400">
                    Finance Director / GM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
