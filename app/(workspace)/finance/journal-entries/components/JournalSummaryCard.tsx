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
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm w-full md:w-[410px] text-xs space-y-3">
      {/* Header labels */}
      <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#5046e5]"></div>
          <span className="text-slate-900 font-bold text-xs tracking-tight">Ledger Balance Summary</span>
        </div>
        <div className="flex space-x-6">
          <span className="w-24 text-right text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Debit AED</span>
          <span className="w-24 text-right text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Credit AED</span>
        </div>
      </div>

      {/* Subtotal */}
      <div className="flex justify-between items-center py-0.5">
        <span className="text-slate-600 font-medium">Lines Subtotal</span>
        <div className="flex space-x-6 font-mono font-medium">
          <span className="w-24 text-right text-slate-900">
            {subtotalDebit > 0 ? subtotalDebit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
          </span>
          <span className="w-24 text-right text-slate-900">
            {subtotalCredit > 0 ? subtotalCredit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
          </span>
        </div>
      </div>

      {/* VAT breakdown */}
      {(taxDebit > 0 || taxCredit > 0) && (
        <div className="flex justify-between items-center py-0.5 text-slate-500 bg-slate-50/70 px-2.5 py-1.5 rounded-lg border border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            <span className="font-semibold text-slate-700 text-[11px]">Computed VAT (5%)</span>
          </div>
          <div className="flex space-x-6 font-mono font-semibold text-[11px]">
            <span className="w-24 text-right text-indigo-700">
              {taxDebit > 0 ? `+ ${taxDebit.toFixed(2)}` : "—"}
            </span>
            <span className="w-24 text-right text-indigo-700">
              {taxCredit > 0 ? `+ ${taxCredit.toFixed(2)}` : "—"}
            </span>
          </div>
        </div>
      )}

      {/* Total Debit / Credit */}
      <div className="flex justify-between items-center py-1 border-t border-slate-100/80 font-semibold text-slate-900">
        <span>Total AED</span>
        <div className="flex space-x-6 font-mono font-bold">
          <span className="w-24 text-right text-slate-900">
            {totalDebitAed > 0 ? totalDebitAed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
          </span>
          <span className="w-24 text-right text-slate-900">
            {totalCreditAed > 0 ? totalCreditAed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
          </span>
        </div>
      </div>

      {/* Balance Indicator & Difference */}
      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-700 font-semibold text-[11px]">Status:</span>
          {isBalanced ? (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Balanced (AED 0.00)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Diff: AED {difference.toFixed(2)}
            </span>
          )}
        </div>

        {/* Quick Helper Actions */}
        <div className="flex items-center gap-1.5">
          {hasUnpostedTax && onAddVatLine && (
            <button
              type="button"
              onClick={onAddVatLine}
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
              title="Add a separate VAT line to the journal"
            >
              <PlusCircle className="w-3 h-3 text-indigo-600" />
              Add VAT Line
            </button>
          )}

          {!isBalanced && onAutoBalance && (
            <button
              type="button"
              onClick={onAutoBalance}
              className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-purple-50 hover:bg-purple-100 text-[#5046e5] border border-purple-200 transition-colors cursor-pointer"
              title="Auto-balance the remaining difference"
            >
              <Sparkles className="w-3 h-3 text-[#5046e5]" />
              Auto-Balance
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
