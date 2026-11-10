"use client";

import React from "react";
import { formatNumber } from "./types";

interface PurchaseReturnsKpisProps {
  totalReturnVal: number;
  returnsCount: number;
  completedCount: number;
  activeReviewCount: number;
}

const PurchaseReturnsKpis: React.FC<PurchaseReturnsKpisProps> = ({
  totalReturnVal,
  returnsCount,
  completedCount,
  activeReviewCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Total Debit Notes Value */}
      <div
        className="rounded-xl px-3.5 py-2.5"
        style={{ backgroundColor: "#fff1f2", border: "1px solid #fda4af" }}
      >
        <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
          TOTAL DEBIT NOTES VALUE
        </span>
        <span className="text-sm sm:text-[15px] font-semibold text-rose-700 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
          AED {formatNumber(totalReturnVal)}
        </span>
        <span className="text-[10.5px] font-normal text-slate-500 block truncate">
          Cumulative supplier returns
        </span>
      </div>

      {/* 2. Total Return Vouchers */}
      <div
        className="rounded-xl px-3.5 py-2.5"
        style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }}
      >
        <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
          TOTAL RETURN VOUCHERS
        </span>
        <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
          {returnsCount}
        </span>
        <span className="text-[10.5px] font-normal text-slate-500 block truncate">
          All logged RTV orders
        </span>
      </div>

      {/* 3. Settled Reversals */}
      <div
        className="rounded-xl px-3.5 py-2.5"
        style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
      >
        <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
          SETTLED REVERSALS
        </span>
        <span className="text-sm sm:text-[15px] font-semibold text-emerald-700 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
          {completedCount}
        </span>
        <span className="text-[10.5px] font-normal text-slate-500 block truncate">
          Credited by vendor
        </span>
      </div>

      {/* 4. In-Review Reversals */}
      <div
        className="rounded-xl px-3.5 py-2.5"
        style={{ backgroundColor: "#fefce8", border: "1px solid #fde047" }}
      >
        <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
          IN-REVIEW REVERSALS
        </span>
        <span className="text-sm sm:text-[15px] font-semibold text-amber-700 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
          {activeReviewCount}
        </span>
        <span className="text-[10.5px] font-normal text-slate-500 block truncate">
          Pending supplier credit note
        </span>
      </div>
    </div>
  );
};

export default PurchaseReturnsKpis;
