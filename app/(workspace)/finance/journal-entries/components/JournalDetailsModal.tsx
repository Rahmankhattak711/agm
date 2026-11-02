"use client";

import React from "react";
import { X, CheckCircle2, Clock, Tag } from "lucide-react";
import { formatAed } from "@/lib/utils/format";

interface JournalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: any | null;
}

export function JournalDetailsModal({
  isOpen,
  onClose,
  entry,
}: JournalDetailsModalProps) {
  if (!isOpen || !entry) return null;

  const lines = entry.lines || [];
  const totalDebit = lines.reduce((s: number, l: any) => s + Number(l.debit || 0), 0);
  const totalCredit = lines.reduce((s: number, l: any) => s + Number(l.credit || 0), 0);
  const difference = Math.round(Math.abs(totalDebit - totalCredit) * 100) / 100;
  const isBalanced = difference < 0.01;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5046e5]/10 text-[#5046e5] flex items-center justify-center font-bold font-mono text-xs shadow-2xs">
              JE
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-mono tracking-tight">
                  {entry.entryNumber}
                </h3>
                {entry.isPosted ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    POSTED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    <Clock className="w-3 h-3 text-slate-500" />
                    DRAFT
                  </span>
                )}
                {isBalanced ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Balanced
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    Unbalanced ({difference.toFixed(2)} AED)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {entry.description || "Manual Journal Entry"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs shrink-0">
          <div>
            <span className="text-slate-400 block text-[11px]">Entry Date</span>
            <span className="font-semibold text-slate-800 font-mono">
              {new Date(entry.entryDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Reference</span>
            <span className="font-semibold text-slate-800">
              {entry.reference || "—"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Source Document</span>
            <span className="font-semibold text-slate-800">
              {entry.sourceDocumentType || "Manual Journal"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Created By</span>
            <span className="font-semibold text-slate-800">
              {entry.user?.fullName || "Accountant"}
            </span>
          </div>
        </div>

        {/* Lines Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/20">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50/90 border-b border-slate-200/90 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5 w-16">Type</th>
                  <th className="px-4 py-2.5 min-w-[200px]">Account</th>
                  <th className="px-4 py-2.5 min-w-[200px]">Description / Note</th>
                  <th className="px-4 py-2.5 min-w-[140px]">Project / Site</th>
                  <th className="px-4 py-2.5 text-right w-28">Debit (AED)</th>
                  <th className="px-4 py-2.5 text-right w-28">Credit (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono">
                {lines.map((line: any, idx: number) => {
                  const isDr = Number(line.debit) > 0;
                  return (
                    <tr key={line.id || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-2.5">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            isDr
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {isDr ? "Debit" : "Credit"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-sans">
                        <div className="font-bold text-slate-900">
                          {line.account?.accountCode || "—"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {line.account?.accountName || "Account"}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-sans text-slate-600">
                        {line.description || "—"}
                        {line.taxAmount > 0 && (
                          <div className="text-[10px] text-[#5046e5] font-semibold mt-0.5">
                            VAT: {line.taxRate}% ({formatAed(line.taxAmount)})
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-sans text-slate-600">
                        {line.projectId ? (
                          <div className="text-[11px] font-medium text-slate-800">
                            Project #{line.projectId.slice(0, 8)}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-blue-700">
                        {isDr ? formatAed(line.debit) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-amber-700">
                        {!isDr ? formatAed(line.credit) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 font-mono font-bold text-xs">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-sans text-slate-700">
                    Totals:
                  </td>
                  <td className="px-4 py-3 text-right text-blue-700">
                    {formatAed(totalDebit)}
                  </td>
                  <td className="px-4 py-3 text-right text-amber-700">
                    {formatAed(totalCredit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Total lines: <strong className="text-slate-800">{lines.length}</strong></span>
            <span>•</span>
            <span>
              Net Difference:{" "}
              <strong className={isBalanced ? "text-emerald-700" : "text-rose-600"}>
                {difference.toFixed(2)} AED
              </strong>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
