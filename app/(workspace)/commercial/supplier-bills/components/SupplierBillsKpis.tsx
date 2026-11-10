"use client";

import React from "react";
import { formatNumber } from "@/lib/utils/format";

export interface SupplierBillsKpisProps {
  totalPayables: number;
  totalOutstanding: number;
  totalSettled: number;
  totalInputVat: number;
}

export const SupplierBillsKpis: React.FC<SupplierBillsKpisProps> = ({
  totalPayables,
  totalOutstanding,
  totalSettled,
  totalInputVat,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        {/* Card 1: Total Purchases Billed (Slate Blue) */}
        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#f1f5f9",
            border: "1px solid #cbd5e1",
          }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            Total Purchases Billed
          </span>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-slate-800 mt-0.5 block">
            AED {formatNumber(totalPayables)}
          </span>
          <span className="text-[10.5px] text-slate-500 block mt-0.5">
            Cumulative procurement billed
          </span>
        </div>

        {/* Card 2: Open AP Balance Due (Soft Rose) */}
        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#fff1f2",
            border: "1px solid #fda4af",
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-rose-800/80 block">
              Open AP Balance Due
            </span>
            {totalOutstanding > 0 && (
              <span
                className="text-[9.5px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: "#ffe4e6",
                  color: "#9f1239",
                  border: "1px solid #fda4af",
                }}
              >
                Due
              </span>
            )}
          </div>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-rose-900 mt-0.5 block">
            AED {formatNumber(totalOutstanding)}
          </span>
          <span className="text-[10.5px] text-rose-700/80 block mt-0.5">
            Pending vendor disbursements
          </span>
        </div>

        {/* Card 3: Settled Disbursements (Mint Green) */}
        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
          }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-emerald-800/80 block">
            Settled Disbursements
          </span>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-emerald-900 mt-0.5 block">
            AED {formatNumber(totalSettled)}
          </span>
          <span className="text-[10.5px] text-emerald-700/80 block mt-0.5">
            Disbursed vendor liabilities
          </span>
        </div>

        {/* Card 4: Recoverable Input VAT (Warm Yellow / Box 9) */}
        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#fefce8",
            border: "1px solid #fde047",
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-amber-800/80 block">
              Recoverable Input VAT (5%)
            </span>
            <span
              className="text-[9.5px] font-medium px-1.5 py-0.5 rounded font-mono"
              style={{
                backgroundColor: "#fef9c3",
                color: "#854d0e",
                border: "1px solid #fde047",
              }}
            >
              Box 9
            </span>
          </div>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-amber-900 mt-0.5 block">
            AED {formatNumber(totalInputVat)}
          </span>
          <span className="text-[10.5px] text-amber-700/80 block mt-0.5">
            FTA Form 201 claimable
          </span>
        </div>
      </div>
    </>
  );
};

export default SupplierBillsKpis;
