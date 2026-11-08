"use client";

import React, { useState } from "react";
import { X, ExternalLink, BookOpen, FileText, ShoppingBag, CreditCard, ReceiptText, ArrowRight, ChevronRight } from "lucide-react";
import { TopEntryItem } from "./PnlHoverPopover";
import { formatAed } from "@/lib/utils/format";

interface TopEntriesDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: TopEntryItem[];
  accountName: string;
  accountCode: string;
  totalAmount: number;
  periodLabel: string;
  onNavigateSource: (entry: TopEntryItem) => void;
  onViewFullJournal: (journalEntryId: string, entryNumber: string) => void;
}

export function TopEntriesDrilldownModal({
  isOpen,
  onClose,
  entries = [],
  accountName,
  accountCode,
  totalAmount,
  periodLabel,
  onNavigateSource,
  onViewFullJournal,
}: TopEntriesDrilldownModalProps) {
  const [selectedEntryIdx, setSelectedEntryIdx] = useState(0);

  if (!isOpen) return null;

  const activeEntry: TopEntryItem | undefined = entries[selectedEntryIdx] || entries[0];

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "Sales invoice":
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case "Customer payment":
        return <CreditCard className="w-3.5 h-3.5 text-emerald-600" />;
      case "Bill":
        return <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />;
      case "Purchase expense":
        return <ReceiptText className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  const getSourceBadgeStyle = (source: string) => {
    switch (source) {
      case "Sales invoice":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
      case "Customer payment":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
      case "Bill":
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
      case "Purchase expense":
        return "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100";
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100";
    }
  };

  // Group other lines by debit and credit
  const otherDebits = activeEntry?.otherLines?.filter((l) => l.debit > 0) || [];
  const otherCredits = activeEntry?.otherLines?.filter((l) => l.credit > 0) || [];

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Top entries
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Column Split Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Left Column: Account Summary & Entries List */}
          <div className="w-full md:w-[58%] flex flex-col overflow-hidden">
            {/* Account Info Card */}
            <div className="p-5 border-b border-slate-100 bg-white grid grid-cols-3 gap-3 text-xs shrink-0">
              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5 font-medium">Account</span>
                <span className="font-bold text-slate-900">
                  {accountCode} {accountName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5 font-medium">Total for period</span>
                <span className="font-bold text-slate-900 font-mono">
                  AED {formatAed(totalAmount)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5 font-medium">Period</span>
                <span className="font-medium text-slate-700">{periodLabel}</span>
              </div>
            </div>

            {/* List of Entries */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
              {entries.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No transaction records found for this period.
                </div>
              ) : (
                entries.map((entry, idx) => {
                  const isSelected = selectedEntryIdx === idx;
                  return (
                    <div
                      key={entry.lineId || idx}
                      onClick={() => setSelectedEntryIdx(idx)}
                      className={`p-4 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                        isSelected
                          ? "bg-indigo-50/70 border-l-4 border-[#5046e5]"
                          : "hover:bg-slate-50/80 bg-white"
                      }`}
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 truncate">
                            {entry.description || "—"}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium border shrink-0 ${getSourceBadgeStyle(
                              entry.source
                            )}`}
                          >
                            {getSourceIcon(entry.source)}
                            <span>{entry.source}</span>
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>
                            {new Date(entry.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span>•</span>
                          <span className="font-mono">{entry.journalNumber}</span>
                          {entry.reference && entry.reference !== "—" && (
                            <>
                              <span>•</span>
                              <span className="truncate">Ref: {entry.reference}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-3">
                        <span className="font-bold text-slate-900 font-mono text-sm">
                          {entry.amount.toFixed(2)}
                        </span>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isSelected ? "text-[#5046e5] translate-x-0.5" : "text-slate-300"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Transaction Detail Preview */}
          <div className="w-full md:w-[42%] bg-slate-50/50 flex flex-col overflow-y-auto p-5 custom-scrollbar">
            {activeEntry ? (
              <div className="space-y-5">
                {/* Source Badge with interactive Link */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Source Transaction
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigateSource(activeEntry)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border shadow-2xs transition-colors cursor-pointer ${getSourceBadgeStyle(
                        activeEntry.source
                      )}`}
                    >
                      {getSourceIcon(activeEntry.source)}
                      <span>{activeEntry.source} #{activeEntry.journalNumber}</span>
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 flex-wrap">
                    <span>
                      {new Date(activeEntry.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>•</span>
                    <span>Reference: {activeEntry.reference || "—"}</span>
                  </div>
                </div>

                {/* Section: Selected Journal Line */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Selected journal line
                  </span>
                  <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-3 flex items-center justify-between shadow-2xs">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">
                        {activeEntry.selectedLine.accountName}
                      </div>
                      <div className="text-[11px] text-indigo-700 font-mono font-medium">
                        {activeEntry.selectedLine.accountCode}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-indigo-900 text-sm">
                        {activeEntry.amount.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-indigo-600 font-bold uppercase">
                        {activeEntry.isCredit ? "Cr" : "Dr"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section: Other Journal Lines (Counter Balancing Lines) */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Other journal lines
                  </span>

                  {/* Debits */}
                  {otherDebits.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-blue-700 uppercase">Debit</span>
                      <div className="space-y-1">
                        {otherDebits.map((line) => (
                          <div
                            key={line.id}
                            className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-xs shadow-2xs"
                          >
                            <div>
                              <span className="font-medium text-slate-900">{line.accountName}</span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {line.accountCode}
                              </span>
                            </div>
                            <div className="text-right font-mono">
                              <span className="font-bold text-blue-700">{line.debit.toFixed(2)}</span>
                              <span className="text-[10px] text-slate-400 ml-1">Dr</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Credits */}
                  {otherCredits.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-amber-700 uppercase">Credit</span>
                      <div className="space-y-1">
                        {otherCredits.map((line) => (
                          <div
                            key={line.id}
                            className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-xs shadow-2xs"
                          >
                            <div>
                              <span className="font-medium text-slate-900">{line.accountName}</span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {line.accountCode}
                              </span>
                            </div>
                            <div className="text-right font-mono">
                              <span className="font-bold text-amber-700">{line.credit.toFixed(2)}</span>
                              <span className="text-[10px] text-slate-400 ml-1">Cr</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom link: View Full Journal */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onViewFullJournal(activeEntry.journalEntryId, activeEntry.journalNumber)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5046e5] hover:text-[#4338ca] hover:underline cursor-pointer group"
                  >
                    <span>&gt; View full journal · {1 + (activeEntry.otherLines?.length || 0)} lines</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                Select a transaction on the left to preview.
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex justify-end shrink-0">
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
