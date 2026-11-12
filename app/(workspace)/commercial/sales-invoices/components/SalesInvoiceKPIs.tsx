"use client";

import React from "react";
import { formatNumber } from "./types";
import { FileText, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";

export interface SalesInvoiceKPIsProps {
  totalBilled: number;
  totalOutstanding: number;
  totalSettled: number;
  totalVatOutput: number;
}

export const SalesInvoiceKPIs: React.FC<SalesInvoiceKPIsProps> = ({
  totalBilled,
  totalOutstanding,
  totalSettled,
  totalVatOutput,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Total Invoiced */}
      <div
        className="rounded-xl p-3 sm:px-4 sm:py-3.5 flex flex-col justify-between shadow-2xs"
        style={{
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
        }}
      >
        <div className="flex items-center justify-between text-xs font-semibold text-[#1d4ed8]">
          <span className="uppercase tracking-wider text-[10.5px]">Total Invoiced</span>
          <FileText className="w-4 h-4 opacity-80" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-slate-800 my-1">
          AED {formatNumber(totalBilled)}
        </div>
        <div className="text-[11px] text-blue-600 font-normal">
          Gross sales billings
        </div>
      </div>

      {/* 2. Outstanding Receivables */}
      <div
        className="rounded-xl p-3 sm:px-4 sm:py-3.5 flex flex-col justify-between shadow-2xs"
        style={{
          backgroundColor: "#fff1f2",
          border: "1px solid #fecdd3",
        }}
      >
        <div className="flex items-center justify-between text-xs font-semibold text-[#be123c]">
          <span className="uppercase tracking-wider text-[10.5px]">Outstanding Receivables</span>
          <AlertCircle className="w-4 h-4 opacity-80" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-[#be123c] my-1">
          AED {formatNumber(totalOutstanding)}
        </div>
        <div className="text-[11px] text-rose-600 font-normal">
          Open client receivables
        </div>
      </div>

      {/* 3. Settled Receipts */}
      <div
        className="rounded-xl p-3 sm:px-4 sm:py-3.5 flex flex-col justify-between shadow-2xs"
        style={{
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
        }}
      >
        <div className="flex items-center justify-between text-xs font-semibold text-[#15803d]">
          <span className="uppercase tracking-wider text-[10.5px]">Settled Receipts</span>
          <CheckCircle2 className="w-4 h-4 opacity-80" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-[#15803d] my-1">
          AED {formatNumber(totalSettled)}
        </div>
        <div className="text-[11px] text-emerald-600 font-normal">
          Collected payments
        </div>
      </div>

      {/* 4. Output VAT (5%) */}
      <div
        className="rounded-xl p-3 sm:px-4 sm:py-3.5 flex flex-col justify-between shadow-2xs"
        style={{
          backgroundColor: "#fefce8",
          border: "1px solid #fef08a",
        }}
      >
        <div className="flex items-center justify-between text-xs font-semibold text-[#a16207]">
          <div className="flex items-center gap-1.5">
            <span className="uppercase tracking-wider text-[10.5px]">Output VAT (5%)</span>
            <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
              Box 1
            </span>
          </div>
          <ShieldCheck className="w-4 h-4 opacity-80" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-slate-800 my-1">
          AED {formatNumber(totalVatOutput)}
        </div>
        <div className="text-[11px] text-amber-700 font-normal">
          FTA Form 201 Tax Due
        </div>
      </div>
    </div>
  );
};

export default SalesInvoiceKPIs;
