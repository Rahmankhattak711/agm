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
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        style={{ border: "1px solid #cbd5e1" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div
          className="px-5 py-3.5 flex items-center justify-between shrink-0"
          style={{
            backgroundColor: "#f4f7fb",
            borderBottom: "1px solid #cbd5e1",
          }}
        >
          <h2 className="text-sm font-semibold text-slate-800 tracking-tight">
            Top entries breakdown
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
            className="text-slate-500 hover:text-slate-800 h-7 w-7 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Column Split Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left Column: Account Summary & Entries List */}
          <div className="w-full md:w-[58%] flex flex-col overflow-hidden">
            {/* Account Info Card */}
            <div className="p-4 border-b border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs shrink-0">
              <div
                className="rounded-xl px-3 py-2"
                style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }}
              >
                <span className="text-slate-500 block text-[9.5px] uppercase tracking-wider font-medium">
                  ACCOUNT
                </span>
                <span className="font-medium text-slate-800 truncate block mt-0.5">
                  {accountCode} {accountName}
                </span>
              </div>
              <div
                className="rounded-xl px-3 py-2"
                style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
              >
                <span className="text-slate-500 block text-[9.5px] uppercase tracking-wider font-medium">
                  TOTAL FOR PERIOD
                </span>
                <span className="font-semibold text-slate-800 font-mono block mt-0.5">
                  AED {formatAed(totalAmount)}
                </span>
              </div>
              <div
                className="rounded-xl px-3 py-2"
                style={{ backgroundColor: "#fefce8", border: "1px solid #fde047" }}
              >
                <span className="text-slate-500 block text-[9.5px] uppercase tracking-wider font-medium">
                  PERIOD
                </span>
                <span className="font-normal text-slate-700 block mt-0.5">{periodLabel}</span>
              </div>
            </div>

            {/* List of Entries */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
              {entries.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-normal">
                  No transaction records found for this period.
                </div>
              ) : (
                entries.map((entry, idx) => {
                  const isSelected = selectedEntryIdx === idx;
                  return (
                    <div
                      key={entry.lineId || idx}
                      onClick={() => setSelectedEntryIdx(idx)}
                      style={
                        isSelected
                          ? {
                              backgroundColor: "#eff6ff",
                              borderLeft: "3px solid #1d4ed8",
                            }
                          : undefined
                      }
                      className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                        isSelected ? "" : "hover:bg-slate-50 bg-white"
                      }`}
                    >
                      <div className="space-y-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800 truncate">
                            {entry.description || "—"}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-normal border shrink-0 ${getSourceBadgeStyle(
                              entry.source
                            )}`}
                          >
                            {getSourceIcon(entry.source)}
                            <span>{entry.source}</span>
                          </span>
                        </div>
                        <div className="text-[11px] font-normal text-slate-500 flex items-center gap-2">
                          <span>
                            {new Date(entry.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span>•</span>
                          <span className="font-mono" style={{ color: "#1d4ed8" }}>
                            {entry.journalNumber}
                          </span>
                          {entry.reference && entry.reference !== "—" && (
                            <>
                              <span>•</span>
                              <span className="truncate">Ref: {entry.reference}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-2.5">
                        <span className="font-semibold text-slate-800 font-mono text-xs">
                          {entry.amount.toFixed(2)}
                        </span>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isSelected ? "text-blue-600 translate-x-0.5" : "text-slate-300"
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
          <div className="w-full md:w-[42%] bg-slate-50/50 flex flex-col overflow-y-auto p-4 custom-scrollbar">
            {activeEntry ? (
              <div className="space-y-4">
                {/* Source Badge with interactive Link */}
                <div
                  className="bg-white rounded-xl p-3.5 space-y-2.5"
                  style={{ border: "1px solid #cbd5e1" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-medium text-slate-500 uppercase tracking-wider">
                      SOURCE TRANSACTION
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigateSource(activeEntry)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer ${getSourceBadgeStyle(
                        activeEntry.source
                      )}`}
                    >
                      {getSourceIcon(activeEntry.source)}
                      <span>
                        {activeEntry.source} #{activeEntry.journalNumber}
                      </span>
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 font-normal flex items-center gap-2 flex-wrap">
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
                  <span className="text-[9.5px] font-medium text-slate-500 uppercase tracking-wider block">
                    SELECTED JOURNAL LINE
                  </span>
                  <div
                    className="rounded-xl p-3 flex items-center justify-between"
                    style={{
                      backgroundColor: "#eff6ff",
                      border: "1px solid #93c5fd",
                    }}
                  >
                    <div>
                      <div className="font-medium text-slate-800 text-xs">
                        {activeEntry.selectedLine.accountName}
                      </div>
                      <div
                        className="text-[11px] font-mono font-normal"
                        style={{ color: "#1d4ed8" }}
                      >
                        {activeEntry.selectedLine.accountCode}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-semibold text-slate-900 text-xs">
                        {activeEntry.amount.toFixed(2)}
                      </div>
                      <span
                        className="text-[10px] font-medium uppercase"
                        style={{ color: "#1d4ed8" }}
                      >
                        {activeEntry.isCredit ? "Cr" : "Dr"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section: Other Journal Lines */}
                <div className="space-y-2">
                  <span className="text-[9.5px] font-medium text-slate-500 uppercase tracking-wider block">
                    OTHER JOURNAL LINES
                  </span>

                  {/* Debits */}
                  {otherDebits.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-medium text-blue-700 uppercase">
                        Debit
                      </span>
                      <div className="space-y-1">
                        {otherDebits.map((line) => (
                          <div
                            key={line.id}
                            className="bg-white rounded-lg p-2.5 flex items-center justify-between text-xs"
                            style={{ border: "1px solid #cbd5e1" }}
                          >
                            <div>
                              <span className="font-normal text-slate-800">
                                {line.accountName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {line.accountCode}
                              </span>
                            </div>
                            <div className="text-right font-mono">
                              <span className="font-medium text-blue-700">
                                {line.debit.toFixed(2)}
                              </span>
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
                      <span className="text-[10px] font-medium text-amber-700 uppercase">
                        Credit
                      </span>
                      <div className="space-y-1">
                        {otherCredits.map((line) => (
                          <div
                            key={line.id}
                            className="bg-white rounded-lg p-2.5 flex items-center justify-between text-xs"
                            style={{ border: "1px solid #cbd5e1" }}
                          >
                            <div>
                              <span className="font-normal text-slate-800">
                                {line.accountName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {line.accountCode}
                              </span>
                            </div>
                            <div className="text-right font-mono">
                              <span className="font-medium text-amber-700">
                                {line.credit.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-1">Cr</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom link: View Full Journal */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      onViewFullJournal(
                        activeEntry.journalEntryId,
                        activeEntry.journalNumber
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline cursor-pointer"
                    style={{ color: "#1d4ed8" }}
                  >
                    <span>
                      &gt; View full journal ·{" "}
                      {1 + (activeEntry.otherLines?.length || 0)} lines
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs font-normal">
                Select a transaction on the left to preview.
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div
          className="px-5 py-3 flex justify-end shrink-0"
          style={{
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #cbd5e1",
          }}
        >
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
