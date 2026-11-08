"use client";

import React from "react";
import { ExternalLink, BookOpen, FileText, ShoppingBag, CreditCard, ReceiptText } from "lucide-react";

export interface TopEntryItem {
  lineId: string;
  journalEntryId: string;
  journalNumber: string;
  reference: string;
  date: string;
  description: string;
  source: string;
  sourceUrl: string;
  amount: number;
  isCredit: boolean;
  selectedLine: {
    accountId: string;
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  };
  otherLines: Array<{
    id: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }>;
}

interface PnlHoverPopoverProps {
  entries: TopEntryItem[];
  accountName: string;
  accountCode: string;
  totalAmount: number;
  periodLabel: string;
  onExpand: () => void;
  onNavigateSource: (entry: TopEntryItem) => void;
}

export function PnlHoverPopover({
  entries = [],
  accountName,
  accountCode,
  totalAmount,
  periodLabel,
  onExpand,
  onNavigateSource,
}: PnlHoverPopoverProps) {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case "Sales invoice":
        return <FileText className="w-3 h-3 text-blue-600" />;
      case "Customer payment":
        return <CreditCard className="w-3 h-3 text-emerald-600" />;
      case "Bill":
        return <ShoppingBag className="w-3 h-3 text-amber-600" />;
      case "Purchase expense":
        return <ReceiptText className="w-3 h-3 text-rose-600" />;
      default:
        return <BookOpen className="w-3 h-3 text-indigo-600" />;
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

  return (
    <div
      className="w-[420px] max-w-[calc(100vw-32px)] bg-white border border-slate-200/90 rounded-xl shadow-2xl overflow-hidden text-xs z-50 animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Popover Header */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-800 text-xs tracking-tight">
            Top entries
          </span>
          {entries.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200/70 text-[10px] font-semibold text-slate-600">
              {entries.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onExpand}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
          title="Open full entries modal"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Entries mini table */}
      <div className="p-1 max-h-56 overflow-y-auto custom-scrollbar">
        {entries.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs">
            No transaction records found.
          </div>
        ) : (
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="text-[10px] uppercase font-semibold text-slate-500 border-b border-slate-100 bg-slate-50/40">
                <th className="px-2.5 py-1.5 w-[85px] whitespace-nowrap">Date</th>
                <th className="px-2.5 py-1.5 w-[130px]">Description</th>
                <th className="px-2.5 py-1.5 w-[115px] whitespace-nowrap">Source</th>
                <th className="px-2.5 py-1.5 text-right w-[90px] whitespace-nowrap">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {entries.slice(0, 5).map((entry, idx) => (
                <tr key={entry.lineId || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-2.5 py-2 text-slate-600 whitespace-nowrap text-[10.5px]">
                    {new Date(entry.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td
                    className="px-2.5 py-2 font-sans text-slate-600 truncate text-[11px]"
                    title={entry.description || "—"}
                  >
                    {entry.description || "—"}
                  </td>
                  <td className="px-2.5 py-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onNavigateSource(entry)}
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-sans font-medium border transition-colors cursor-pointer ${getSourceBadgeStyle(
                        entry.source
                      )}`}
                      title={`Go to ${entry.source}`}
                    >
                      {getSourceIcon(entry.source)}
                      <span>{entry.source}</span>
                    </button>
                  </td>
                  <td className="px-2.5 py-2 text-right font-bold text-slate-900 whitespace-nowrap font-mono">
                    {entry.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom link to view all */}
      {entries.length > 5 && (
        <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={onExpand}
            className="text-[11px] font-semibold text-[#5046e5] hover:underline cursor-pointer"
          >
            View all {entries.length} entries &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
