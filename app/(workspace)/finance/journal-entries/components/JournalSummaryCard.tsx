"use client";

import React from "react";
import { formatAed } from "@/lib/utils/format";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface JournalSummaryCardProps {
  subtotalDebit: number;
  subtotalCredit: number;
  taxDebit: number;
  taxCredit: number;
  totalDebitAed: number;
  totalCreditAed: number;
  difference: number;
  isBalanced: boolean;
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
}: JournalSummaryCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs w-full md:w-[380px] text-xs space-y-2.5">
      {/* Header labels */}
      <div className="flex justify-between items-center text-slate-500 font-semibold pb-2 border-b border-slate-100">
        <span className="text-slate-900 font-bold">Summary</span>
        <div className="flex space-x-6">
          <span className="w-20 text-right text-slate-600">Debit AED</span>
          <span className="w-20 text-right text-slate-600">Credit AED</span>
        </div>
      </div>

      {/* Subtotal */}
      <div className="flex justify-between items-center py-0.5">
        <span className="text-slate-700 font-medium">Subtotal</span>
        <div className="flex space-x-6 font-mono font-medium">
          <span className="w-20 text-right text-slate-900">
            {subtotalDebit > 0 ? subtotalDebit.toFixed(2) : "—"}
          </span>
          <span className="w-20 text-right text-slate-900">
            {subtotalCredit > 0 ? subtotalCredit.toFixed(2) : "—"}
          </span>
        </div>
      </div>

      {/* 5% VAT on Purchases / Sales */}
      {(taxDebit > 0 || taxCredit > 0) && (
        <div className="flex justify-between items-center py-0.5 text-slate-500">
          <span>VAT (5%)</span>
          <div className="flex space-x-6 font-mono">
            <span className="w-20 text-right">
              {taxDebit > 0 ? taxDebit.toFixed(2) : "—"}
            </span>
            <span className="w-20 text-right">
              {taxCredit > 0 ? taxCredit.toFixed(2) : "—"}
            </span>
          </div>
        </div>
      )}

      {/* Totals Divider */}
      <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center font-semibold text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-900 font-bold">Balance</span>
          {isBalanced ? (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Balanced
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              Unbalanced
            </span>
          )}
        </div>

        <div className="font-mono">
          {isBalanced ? (
            <span className="text-emerald-700 font-bold text-sm">AED 0.00</span>
          ) : (
            <span className="text-rose-600 font-bold text-sm">AED {difference.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
