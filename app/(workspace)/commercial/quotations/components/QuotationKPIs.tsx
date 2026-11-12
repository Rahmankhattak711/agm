"use client";

import React from "react";

export interface QuotationKPIsProps {
  totalQuotedVolume: number;
  totalCount: number;
  acceptedCount: number;
  rejectedCount: number;
  formatNumber: (val: number | string | undefined) => string;
}

export const QuotationKPIs: React.FC<QuotationKPIsProps> = ({
  totalQuotedVolume,
  totalCount,
  acceptedCount,
  rejectedCount,
  formatNumber,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
      {/* 1. Total Proposal Pipeline */}
      <div
        className="rounded-xl px-3.5 py-2.5"
        style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
      >
        <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
          TOTAL PROPOSAL PIPELINE
        </span>
        <span className="text-sm sm:text-[15px] font-semibold text-[#1d4ed8] leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
          AED {formatNumber(totalQuotedVolume)}
        </span>
        <span className="text-[10.5px] font-normal text-slate-500 block truncate">
          Cumulative quotation volume
        </span>
      </div>

      {/* 2. Proposals Issued */}
      <div
        className="rounded-xl px-3.5 py-2.5"
        style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }}
      >
        <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
          PROPOSALS ISSUED
        </span>
        <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
          {totalCount} Proposals
        </span>
        <span className="text-[10.5px] font-normal text-slate-500 block truncate">
          Commercial proposals drafted
        </span>
      </div>

      {/* 3. Accepted Deals */}
      <div
        className="rounded-xl px-3.5 py-2.5"
        style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
      >
        <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
          ACCEPTED DEALS
        </span>
        <span className="text-sm sm:text-[15px] font-semibold text-emerald-700 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
          {acceptedCount} Approved
        </span>
        <span className="text-[10.5px] font-normal text-slate-500 block truncate">
          Client accepted &amp; approved
        </span>
      </div>

      {/* 4. Declined Deals */}
      <div
        className="rounded-xl px-3.5 py-2.5"
        style={{ backgroundColor: "#fff1f2", border: "1px solid #fda4af" }}
      >
        <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
          DECLINED / REJECTED
        </span>
        <span className="text-sm sm:text-[15px] font-semibold text-rose-700 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
          {rejectedCount} Declined
        </span>
        <span className="text-[10.5px] font-normal text-slate-500 block truncate">
          Proposals declined / cancelled
        </span>
      </div>
    </div>
  );
};

export default QuotationKPIs;
