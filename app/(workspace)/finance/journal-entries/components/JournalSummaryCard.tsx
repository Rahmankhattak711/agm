"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Sparkles, PlusCircle } from "lucide-react";

interface JournalSummaryCardProps {
  subtotalDebit: number;
  subtotalCredit: number;
  taxDebit: number;
  taxCredit: number;
  totalDebitAed: number;
  totalCreditAed: number;
  difference: number;
  isBalanced: boolean;
  onAutoBalance?: () => void;
  onAddVatLine?: () => void;
  hasUnpostedTax?: boolean;
}

export function JournalSummaryCard({
  subtotalDebit,
  subtotalCredit,
  taxDebit,
  taxCredit,
  totalDebitAed,
  totalCreditAed,
  difference,
  isBalanced,
  onAutoBalance,
  onAddVatLine,
  hasUnpostedTax = false,
}: JournalSummaryCardProps) {
  return (
    <div
      className="bg-white rounded-2xl p-4 w-full text-xs space-y-3"
      style={{
        border: "1px solid #cbd5e1",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center gap-2">
        <div className="min-w-0">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
            JOURNAL SUMMARY
          </span>
          <h3 className="text-[13.5px] sm:text-sm font-semibold text-slate-900 mt-0.5 truncate">
            Double-Entry Balance
          </h3>
        </div>
        <div className="flex space-x-2 sm:space-x-4 shrink-0">
          <span className="w-20 sm:w-24 text-right text-slate-400 font-medium text-[9.5px] uppercase tracking-wider">
            DEBIT (AED)
          </span>
          <span className="w-20 sm:w-24 text-right text-slate-400 font-medium text-[9.5px] uppercase tracking-wider">
            CREDIT (AED)
          </span>
        </div>
      </div>

      {/* Subtotal Row */}
      <div className="space-y-1.5">
        <div
          className="rounded-lg px-3 py-2 flex items-center justify-between gap-2 text-xs"
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <span className="font-normal text-slate-500 truncate">Lines Subtotal</span>
          <div className="flex space-x-2 sm:space-x-4 font-mono font-medium shrink-0">
            <span className="w-20 sm:w-24 text-right text-slate-800">
              {subtotalDebit > 0
                ? subtotalDebit.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "0.00"}
            </span>
            <span className="w-20 sm:w-24 text-right text-slate-800">
              {subtotalCredit > 0
                ? subtotalCredit.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : "0.00"}
            </span>
          </div>
        </div>

        {/* VAT breakdown */}
        {(taxDebit > 0 || taxCredit > 0) && (
          <div
            className="rounded-lg px-3 py-2 flex items-center justify-between gap-2 text-xs"
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
            }}
          >
            <span className="font-medium text-blue-700 text-[11px] truncate">
              Computed VAT (5%)
            </span>
            <div className="flex space-x-2 sm:space-x-4 font-mono font-medium text-[11px] shrink-0">
              <span className="w-20 sm:w-24 text-right text-blue-700">
                {taxDebit > 0 ? `+ ${taxDebit.toFixed(2)}` : "-"}
              </span>
              <span className="w-20 sm:w-24 text-right text-blue-700">
                {taxCredit > 0 ? `+ ${taxCredit.toFixed(2)}` : "-"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Total Highlight Box */}
      <div
        className="rounded-xl p-3 flex items-center justify-between gap-2"
        style={{
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
        }}
      >
        <div className="min-w-0">
          <span
            className="text-[9.5px] font-medium uppercase tracking-wider block truncate"
            style={{ color: "#1d4ed8" }}
          >
            TOTAL POSTED AED
          </span>
          <span className="text-[11px] font-normal text-slate-600 block mt-0.5 truncate">
            Gross voucher total
          </span>
        </div>
        <div className="flex space-x-2 sm:space-x-4 font-mono font-semibold text-[13px] sm:text-sm shrink-0">
          <span className="w-20 sm:w-24 text-right text-slate-900">
            {totalDebitAed > 0
              ? totalDebitAed.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "0.00"}
          </span>
          <span className="w-20 sm:w-24 text-right text-slate-900">
            {totalCreditAed > 0
              ? totalCreditAed.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "0.00"}
          </span>
        </div>
      </div>

      {/* Balance Indicator & Smart Helpers */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        {isBalanced ? (
          <span
            style={{
              backgroundColor: "#ecfdf5",
              color: "#047857",
              border: "1px solid #6ee7b7",
            }}
            className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Balanced (AED 0.00)</span>
          </span>
        ) : (
          <span
            style={{
              backgroundColor: "#fff1f2",
              color: "#be123c",
              border: "1px solid #fda4af",
            }}
            className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-medium"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Difference: AED {difference.toFixed(2)}</span>
          </span>
        )}

        <div className="flex items-center gap-1.5">
          {hasUnpostedTax && onAddVatLine && (
            <button
              type="button"
              onClick={onAddVatLine}
              style={{
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #93c5fd",
              }}
              className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              title="Add a separate VAT line to the journal"
            >
              <PlusCircle className="w-3 h-3" />
              <span>Add VAT Line</span>
            </button>
          )}

          {!isBalanced && onAutoBalance && (
            <button
              type="button"
              onClick={onAutoBalance}
              style={{
                backgroundColor: "#1d4ed8",
                color: "#ffffff",
                border: "1px solid #1e40af",
              }}
              className="inline-flex items-center gap-1 text-[10.5px] font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              title="Auto-balance the remaining difference"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto-Balance</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
