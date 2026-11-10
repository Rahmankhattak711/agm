"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { formatAed } from "@/lib/utils/format";
import {
  ChevronLeftIcon,
  FileSpreadsheetIcon,
  CalendarIcon,
  RefreshIcon,
  PrintIcon,
} from "@/components/icons";

export default function CashFlowReportPage() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(2026);

  const { data: cf, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["cash-flow", selectedYear],
    queryFn: async () => {
      const res = await fetch(`/api/finance/reports/cash-flow?year=${selectedYear}`);
      if (!res.ok) throw new Error("Failed to load Cash Flow");
      return await res.json();
    },
  });

  return (
    <div className="w-full min-h-full bg-white text-slate-700 font-sans px-4 sm:px-5 py-3.5 space-y-3.5 select-none">
      {/* 1. CLEAN COMPACT TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 print:hidden">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => router.push("/finance/reports")}
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shrink-0"
            style={{ border: "1px solid #cbd5e1" }}
            title="Back to Reports"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>

          <h1 className="text-base sm:text-[17px] font-semibold tracking-tight text-slate-800">
            Statement of Cash Flows (IFRS)
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
            className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Cash Flow"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-blue-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            style={{
              backgroundColor: "#1d4ed8",
              color: "#ffffff",
              border: "1px solid #1e40af",
            }}
            className="px-3.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PrintIcon className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* 2. SOFT LIGHT-BLUE FILTER BAR */}
      <div
        className="rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5 print:hidden"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-normal"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
            }}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Fiscal Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-transparent text-xs font-medium text-slate-800 outline-none cursor-pointer font-mono"
            >
              <option value={2024}>FY 2024</option>
              <option value={2025}>FY 2025</option>
              <option value={2026}>FY 2026</option>
              <option value={2027}>FY 2027</option>
            </select>
          </div>
        </div>

        <span className="text-[11px] font-normal text-slate-500">
          Reporting Period: <span className="font-mono font-medium text-slate-700">01-Jan-{selectedYear} to 31-Dec-{selectedYear}</span>
        </span>
      </div>

      {/* 3. FOUR COMPACT PASTEL KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            OPERATING CASH FLOW
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block mt-0.5">
            {formatAed(cf?.operating.net || 0)}
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block">
            Core operations net cash
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#fefce8", border: "1px solid #fde047" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            INVESTING CASH FLOW
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block mt-0.5">
            {formatAed(cf?.investing.net || 0)}
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block">
            Capital &amp; fixed assets
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            NET CHANGE IN CASH
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block mt-0.5">
            {formatAed(cf?.netChangeInCash || 0)}
          </span>
          <span className="text-[10.5px] font-normal text-emerald-700 block">
            Total annual liquidity change
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#fff1f2", border: "1px solid #fda4af" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            CLOSING CASH BALANCE
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block mt-0.5">
            {formatAed(cf?.closingCash || 0)}
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block">
            Bank &amp; petty cash at year-end
          </span>
        </div>
      </div>

      {/* 4. CASH FLOW STATEMENT CARD */}
      <div
        className="bg-white rounded-xl overflow-hidden text-xs"
        style={{ border: "1px solid #cbd5e1" }}
      >
        <div
          className="px-4 py-2.5 flex items-center justify-between"
          style={{
            backgroundColor: "#f4f7fb",
            borderBottom: "1px solid #cbd5e1",
          }}
        >
          <h3 className="text-xs font-semibold text-slate-800">
            Cash flow activities breakdown
          </h3>
          <span className="text-[11px] font-normal text-slate-500">
            FY {selectedYear}
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400 font-normal">
            Calculating Cash Flow activities...
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {/* 1. Operating Activities */}
            <div className="p-4 sm:p-5 space-y-2.5">
              <div
                className="px-3 py-1.5 rounded-lg font-semibold text-xs text-blue-900"
                style={{ backgroundColor: "#f0f7ff", border: "1px solid #dbeafe" }}
              >
                1. Cash Flows from Operating Activities
              </div>
              <div className="space-y-1.5 pl-2 sm:pl-4">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600 font-normal">
                    Cash received from customers &amp; commercial invoices
                  </span>
                  <span className="font-mono font-medium text-slate-800">
                    {formatAed(cf?.operating.inflows || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600 font-normal">
                    Cash paid to suppliers, staff, &amp; site expenses
                  </span>
                  <span className="font-mono font-medium text-rose-600">
                    -{formatAed(cf?.operating.outflows || 0)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center font-semibold pt-2 border-t border-slate-100 text-slate-800">
                <span>Net Cash Provided by Operating Activities</span>
                <span className="font-mono" style={{ color: "#1d4ed8" }}>
                  {formatAed(cf?.operating.net || 0)}
                </span>
              </div>
            </div>

            {/* 2. Investing Activities */}
            <div className="p-4 sm:p-5 space-y-2.5">
              <div
                className="px-3 py-1.5 rounded-lg font-semibold text-xs text-amber-900"
                style={{ backgroundColor: "#fffbeb", border: "1px solid #fef3c7" }}
              >
                2. Cash Flows from Investing Activities
              </div>
              <div className="space-y-1.5 pl-2 sm:pl-4">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600 font-normal">
                    Purchase of plant, equipment &amp; fixed assets
                  </span>
                  <span className="font-mono font-medium text-slate-700">
                    {cf?.investing.outflows > 0
                      ? `-${formatAed(cf.investing.outflows)}`
                      : "AED 0.00"}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center font-semibold pt-2 border-t border-slate-100 text-slate-800">
                <span>Net Cash Used in Investing Activities</span>
                <span className="font-mono">{formatAed(cf?.investing.net || 0)}</span>
              </div>
            </div>

            {/* 3. Financing Activities */}
            <div className="p-4 sm:p-5 space-y-2.5">
              <div
                className="px-3 py-1.5 rounded-lg font-semibold text-xs text-emerald-900"
                style={{ backgroundColor: "#f0fdf4", border: "1px solid #dcfce7" }}
              >
                3. Cash Flows from Financing Activities
              </div>
              <div className="space-y-1.5 pl-2 sm:pl-4">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600 font-normal">
                    Owner capital contributions &amp; loan settlements
                  </span>
                  <span className="font-mono font-medium text-slate-700">
                    {formatAed(cf?.financing.net || 0)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center font-semibold pt-2 border-t border-slate-100 text-slate-800">
                <span>Net Cash from Financing Activities</span>
                <span className="font-mono">{formatAed(cf?.financing.net || 0)}</span>
              </div>
            </div>

            {/* Net Change and Reconciliation */}
            <div
              className="p-4 sm:p-5 space-y-2"
              style={{ backgroundColor: "#f8fafc" }}
            >
              <div className="flex justify-between items-center font-medium text-xs text-slate-800">
                <span>Net Increase / (Decrease) in Cash &amp; Cash Equivalents</span>
                <span
                  className={`font-mono font-semibold ${
                    cf?.netChangeInCash >= 0 ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {formatAed(cf?.netChangeInCash || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 font-normal">
                <span>Cash and Cash Equivalents at Beginning of Year</span>
                <span className="font-mono">{formatAed(cf?.openingCash || 0)}</span>
              </div>
              <div
                className="flex justify-between items-center font-semibold text-xs pt-2.5 mt-1 border-t border-slate-200 text-slate-900"
              >
                <span>Cash and Cash Equivalents at End of Year (Bank &amp; Petty Cash)</span>
                <span className="font-mono text-sm font-semibold" style={{ color: "#1d4ed8" }}>
                  {formatAed(cf?.closingCash || 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
