"use client";

import React from "react";
import { X, Clock, BookOpen } from "lucide-react";
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
  const totalDebit = lines.reduce(
    (s: number, l: any) => s + Number(l.debit || 0),
    0
  );
  const totalCredit = lines.reduce(
    (s: number, l: any) => s + Number(l.credit || 0),
    0
  );
  const difference = Math.round(Math.abs(totalDebit - totalCredit) * 100) / 100;
  const isBalanced = difference < 0.01;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        style={{ border: "1px solid #cbd5e1" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft Light-Blue Header Bar */}
        <div
          className="px-5 py-3.5 flex items-center justify-between shrink-0"
          style={{
            backgroundColor: "#f4f7fb",
            borderBottom: "1px solid #cbd5e1",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "#dbeafe",
                color: "#1d4ed8",
                border: "1px solid #93c5fd",
              }}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-800 font-mono tracking-tight">
                  {entry.entryNumber}
                </h3>
                {entry.isPosted ? (
                  <span
                    style={{
                      backgroundColor: "#dcfce7",
                      color: "#15803d",
                      border: "1px solid #bbf7d0",
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-medium uppercase tracking-wide"
                  >
                    POSTED
                  </span>
                ) : (
                  <span
                    style={{
                      backgroundColor: "#fef3c7",
                      color: "#b45309",
                      border: "1px solid #fde68a",
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-medium uppercase tracking-wide"
                  >
                    <Clock className="w-3 h-3" />
                    DRAFT
                  </span>
                )}
                {isBalanced ? (
                  <span
                    style={{
                      backgroundColor: "#eff6ff",
                      color: "#1d4ed8",
                      border: "1px solid #93c5fd",
                    }}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  >
                    Balanced
                  </span>
                ) : (
                  <span
                    style={{
                      backgroundColor: "#fff1f2",
                      color: "#be123c",
                      border: "1px solid #fda4af",
                    }}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  >
                    Unbalanced ({difference.toFixed(2)} AED)
                  </span>
                )}
              </div>
              <p className="text-[11px] font-normal text-slate-500 mt-0.5 truncate">
                {entry.description || "Manual Journal Entry"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
            className="h-7 w-7 rounded-lg hover:bg-slate-50 text-slate-500 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Pastel Summary Info Cards */}
        <div
          className="px-5 py-3.5 bg-white grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0"
          style={{ borderBottom: "1px solid #e2e8f0" }}
        >
          <div
            className="rounded-xl px-3 py-2"
            style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }}
          >
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              ENTRY DATE
            </span>
            <span className="font-medium text-slate-800 font-mono text-xs mt-0.5 block">
              {new Date(entry.entryDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <div
            className="rounded-xl px-3 py-2"
            style={{ backgroundColor: "#fefce8", border: "1px solid #fde047" }}
          >
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              REFERENCE
            </span>
            <span className="font-medium text-slate-800 text-xs mt-0.5 block truncate">
              {entry.reference ||
                lines.find((l: any) => l.invoiceNumber || l.costCenter)
                  ?.invoiceNumber ||
                lines.find((l: any) => l.invoiceNumber || l.costCenter)
                  ?.costCenter ||
                "-"}
            </span>
          </div>

          <div
            className="rounded-xl px-3 py-2"
            style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
          >
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              SOURCE DOCUMENT
            </span>
            <span className="font-medium text-slate-800 text-xs mt-0.5 block truncate">
              {entry.sourceDocumentType || "Manual Journal"}
            </span>
          </div>

          <div
            className="rounded-xl px-3 py-2"
            style={{ backgroundColor: "#eff6ff", border: "1px solid #93c5fd" }}
          >
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              CREATED BY
            </span>
            <span className="font-medium text-slate-800 text-xs mt-0.5 block truncate">
              {entry.user?.fullName || "Accountant"}
            </span>
          </div>
        </div>

        {/* Lines Table */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white">
          <div
            className="rounded-xl overflow-hidden bg-white"
            style={{ border: "1px solid #cbd5e1" }}
          >
            <div
              className="px-4 py-2.5 flex items-center justify-between"
              style={{
                backgroundColor: "#f4f7fb",
                borderBottom: "1px solid #cbd5e1",
              }}
            >
              <span className="text-xs font-semibold text-slate-800">
                Journal lines
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                {lines.length} {lines.length === 1 ? "line" : "lines"}
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs text-left border-collapse min-w-[780px]">
                <thead>
                  <tr
                    className="bg-white text-[9.5px] font-medium uppercase tracking-wider text-slate-500"
                    style={{ borderBottom: "1px solid #e2e8f0" }}
                  >
                    <th className="px-4 py-2.5 w-20">TYPE</th>
                    <th className="px-4 py-2.5 w-32">INVOICE / REF</th>
                    <th className="px-4 py-2.5">ACCOUNT</th>
                    <th className="px-4 py-2.5">DESCRIPTION / NOTE</th>
                    <th className="px-4 py-2.5 w-36">PROJECT / SITE</th>
                    <th className="px-4 py-2.5 text-right w-28 whitespace-nowrap">
                      DEBIT (AED)
                    </th>
                    <th className="px-4 py-2.5 text-right w-28 whitespace-nowrap">
                      CREDIT (AED)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {lines.map((line: any, idx: number) => {
                    const isDr = Number(line.debit) > 0;
                    return (
                      <tr
                        key={line.id || idx}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <span
                            style={
                              isDr
                                ? {
                                    backgroundColor: "#eff6ff",
                                    color: "#1d4ed8",
                                    border: "1px solid #93c5fd",
                                  }
                                : {
                                    backgroundColor: "#fefce8",
                                    color: "#a16207",
                                    border: "1px solid #fde047",
                                  }
                            }
                            className="font-medium px-2 py-0.5 rounded-full text-[9.5px] uppercase tracking-wide"
                          >
                            {isDr ? "Debit" : "Credit"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs font-normal text-slate-700">
                          {line.invoiceNumber ||
                          line.costCenter ||
                          entry.reference ? (
                            <span
                              style={{
                                backgroundColor: "#f8fafc",
                                border: "1px solid #cbd5e1",
                              }}
                              className="inline-flex items-center px-2 py-0.5 rounded text-slate-700 text-[11px] font-normal"
                            >
                              {line.invoiceNumber ||
                                line.costCenter ||
                                entry.reference}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <div
                            className="font-medium text-xs"
                            style={{ color: "#1d4ed8" }}
                          >
                            {line.account?.accountName || "Account"}
                          </div>
                          <div className="text-[11px] font-mono font-normal text-slate-500">
                            {line.account?.accountCode || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 font-normal">
                          {line.description ||
                            (line.invoiceNumber ||
                            line.costCenter ||
                            entry.reference
                              ? `Invoice ${
                                  line.invoiceNumber ||
                                  line.costCenter ||
                                  entry.reference
                                }`
                              : "-")}
                          {line.taxAmount > 0 && (
                            <div
                              className="text-[10px] font-medium mt-0.5"
                              style={{ color: "#1d4ed8" }}
                            >
                              VAT: {line.taxRate}% ({formatAed(line.taxAmount)})
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 font-normal">
                          {line.projectId ? (
                            <div className="text-[11px] font-normal text-slate-700">
                              Project #{line.projectId.slice(0, 8)}
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                          {isDr ? formatAed(line.debit) : "-"}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                          {!isDr ? formatAed(line.credit) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot
                  style={{
                    backgroundColor: "#f8fafc",
                    borderTop: "1px solid #cbd5e1",
                  }}
                  className="font-mono font-semibold text-xs"
                >
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-2.5 text-right font-sans font-medium text-slate-600"
                    >
                      Totals:
                    </td>
                    <td
                      className="px-4 py-2.5 text-right whitespace-nowrap"
                      style={{ color: "#1d4ed8" }}
                    >
                      {formatAed(totalDebit)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-amber-700 whitespace-nowrap">
                      {formatAed(totalCredit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex items-center justify-between shrink-0"
          style={{
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #cbd5e1",
          }}
        >
          <div className="text-xs font-normal text-slate-500 flex items-center gap-2">
            <span>
              Total lines: <span className="font-medium text-slate-800">{lines.length}</span>
            </span>
            <span>•</span>
            <span>
              Net Difference:{" "}
              <span
                className={`font-medium ${
                  isBalanced ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                {difference.toFixed(2)} AED
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
            className="px-4 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
