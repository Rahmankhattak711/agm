"use client";

import React from "react";
import { formatNumber } from "@/lib/utils/format";

export interface PurchaseOrdersKpisProps {
  totalPOs: number;
  draftCount: number;
  orderedCount: number;
  totalPurchasesValue: number;
}

export const PurchaseOrdersKpis: React.FC<PurchaseOrdersKpisProps> = ({
  totalPOs,
  draftCount,
  orderedCount,
  totalPurchasesValue,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        {/* Card 1: Total Purchase Orders (Slate Blue) */}
        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#f1f5f9",
            border: "1px solid #cbd5e1",
          }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            Total Purchase Orders
          </span>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-slate-800 mt-0.5 block">
            {totalPOs}
          </span>
          <span className="text-[10.5px] text-slate-500 block mt-0.5">
            All procurement records
          </span>
        </div>

        {/* Card 2: Draft Orders (Warm Yellow) */}
        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#fefce8",
            border: "1px solid #fde047",
          }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-amber-800/80 block">
            Draft Orders
          </span>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-amber-900 mt-0.5 block">
            {draftCount}
          </span>
          <span className="text-[10.5px] text-amber-700/80 block mt-0.5">
            Awaiting supplier issuance
          </span>
        </div>

        {/* Card 3: Pending Deliveries (Mint Green) */}
        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
          }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-emerald-800/80 block">
            Pending Deliveries
          </span>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-emerald-900 mt-0.5 block">
            {orderedCount}
          </span>
          <span className="text-[10.5px] text-emerald-700/80 block mt-0.5">
            Awaiting warehouse receipt
          </span>
        </div>

        {/* Card 4: Total Procurement Spend (Soft Rose) */}
        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#fff1f2",
            border: "1px solid #fda4af",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-rose-800/80 block">
              Total Procurement Spend
            </span>
            <span
              className="text-[9.5px] font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: "#ffe4e6",
                color: "#9f1239",
                border: "1px solid #fda4af",
              }}
            >
              Committed
            </span>
          </div>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-rose-900 mt-0.5 block">
            AED {formatNumber(totalPurchasesValue)}
          </span>
          <span className="text-[10.5px] text-rose-700/80 block mt-0.5">
            Cumulative purchase volume
          </span>
        </div>
      </div>

      <div className="hidden print:grid print:grid-cols-4 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-medium block">
            Total Orders
          </span>
          <span className="font-mono font-semibold text-slate-800">{totalPOs}</span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-amber-700 font-medium block">
            Drafts
          </span>
          <span className="font-mono font-semibold text-amber-800">
            {draftCount}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-blue-700 font-medium block">
            Pending Delivery
          </span>
          <span className="font-mono font-semibold text-blue-800">
            {orderedCount}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-emerald-700 font-medium block">
            Procurement Spend
          </span>
          <span className="font-mono font-semibold text-emerald-800">
            AED {formatNumber(totalPurchasesValue)}
          </span>
        </div>
      </div>
    </>
  );
};

export default PurchaseOrdersKpis;
