"use client";

import React from "react";
import { formatNumber } from "@/lib/utils/format";

export interface CustomerKpisProps {
  totalClients: number;
  totalReceivables: number;
  totalCreditLimits: number;
  corporateCount: number;
}

export function CustomerKpis({
  totalClients,
  totalReceivables,
  totalCreditLimits,
  corporateCount,
}: CustomerKpisProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
      {/* 1. Total Active Clients - Pastel Blue */}
      <div
        className="p-3 sm:p-3.5 rounded-xl transition-all"
        style={{
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
        }}
      >
        <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          TOTAL ACTIVE CLIENTS
        </p>
        <p className="text-lg sm:text-xl font-black" style={{ color: "#1d4ed8" }}>
          {totalClients} Clients
        </p>
        <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
          Registered client directory
        </p>
      </div>

      {/* 2. Outstanding Receivables - Pastel Rose */}
      <div
        className="p-3 sm:p-3.5 rounded-xl transition-all"
        style={{
          backgroundColor: "#fff1f2",
          border: "1px solid #fecdd3",
        }}
      >
        <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          OUTSTANDING RECEIVABLES
        </p>
        <p className="text-lg sm:text-xl font-black text-rose-600">
          AED {formatNumber(totalReceivables)}
        </p>
        <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
          Open balance due for collection
        </p>
      </div>

      {/* 3. Corporate Accounts - Pastel Green */}
      <div
        className="p-3 sm:p-3.5 rounded-xl transition-all"
        style={{
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
        }}
      >
        <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          CORPORATE ACCOUNTS
        </p>
        <p className="text-lg sm:text-xl font-black" style={{ color: "#15803d" }}>
          {corporateCount} Entities
        </p>
        <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
          Registered corporate clients
        </p>
      </div>

      {/* 4. Total Credit Facility - Pastel Amber/Yellow */}
      <div
        className="p-3 sm:p-3.5 rounded-xl transition-all"
        style={{
          backgroundColor: "#fefce8",
          border: "1px solid #fef08a",
        }}
      >
        <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
          TOTAL CREDIT FACILITY
        </p>
        <p className="text-lg sm:text-xl font-black" style={{ color: "#a16207" }}>
          AED {formatNumber(totalCreditLimits)}
        </p>
        <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
          Extended credit facilities
        </p>
      </div>
    </div>
  );
}
