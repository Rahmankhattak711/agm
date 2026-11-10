"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCorporateTax } from "@/lib/hooks/finance-hooks";
import {
  ChevronLeftIcon,
  PrintIcon,
  RefreshIcon,
  ShieldCheckIcon,
  CalendarIcon,
} from "@/components/icons";
import { useReactToPrint } from "react-to-print";

export default function CorporateTaxPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const { data, isLoading, refetch, isFetching } = useCorporateTax({
    year: selectedYear,
  });

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `UAE-Corporate-Tax-Return-${selectedYear}`,
  });

  const formatAed = (val?: number) => {
    if (val === undefined || val === null || val === 0) return "—";
    return val.toLocaleString("en-AE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatAlways = (val?: number) => {
    if (val === undefined || val === null) return "0.00";
    return val.toLocaleString("en-AE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="w-full min-h-full bg-white text-slate-700 font-sans px-4 sm:px-5 py-3.5 space-y-3.5 select-none pb-16">
      {/* Compact Header with Back Arrow Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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

          <div
            className="w-8 h-8 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-[#1d4ed8] shrink-0"
            style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}
          >
            <ShieldCheckIcon className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-[17px] font-semibold text-slate-800 tracking-tight">
              Corporate Tax – Taxable Income
            </h1>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-normal bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]"
              style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}
            >
              UAE Federal Law No. 47 (9%)
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh Data"
            className="p-1.5 border border-[#cbd5e1] rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer flex items-center justify-center"
            style={{ borderColor: "#cbd5e1" }}
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#1d4ed8]" : ""}`} />
          </button>

          <button
            onClick={() => handlePrint()}
            className="px-3.5 py-1.5 text-[11.5px] font-medium rounded-lg bg-[#1d4ed8] text-white hover:bg-[#1e40af] flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{ backgroundColor: "#1d4ed8", color: "#ffffff", border: "1px solid #1e40af" }}
          >
            <PrintIcon className="w-3.5 h-3.5" />
            Export / Print
          </button>
        </div>
      </div>

      {/* 4 Compact Pastel Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }}
        >
          <span className="text-[9.5px] text-slate-500 uppercase tracking-wider font-medium block">
            ACCOUNTING NET PROFIT
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            AED {formatAlways(data?.totals.accountingNetProfit)}
          </span>
          <span className="text-[10.5px] text-slate-500 font-normal block">
            Audited financial result from P&amp;L
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#fefce8", border: "1px solid #fde047" }}
        >
          <span className="text-[9.5px] text-slate-500 uppercase tracking-wider font-medium block">
            ADJUSTED TAXABLE INCOME
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            AED {formatAlways(data?.totals.taxableIncome)}
          </span>
          <span className="text-[10.5px] text-slate-500 font-normal block">
            Net of exempt &amp; non-deductibles
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
        >
          <span className="text-[9.5px] text-slate-500 uppercase tracking-wider font-medium block">
            STATUTORY THRESHOLD
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-emerald-700 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            AED {formatAlways(data?.totals.taxThreshold)}
          </span>
          <span className="text-[10.5px] text-slate-500 font-normal block">
            0% Tax Rate on first AED 375,000
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#fff1f2", border: "1px solid #fda4af" }}
        >
          <span className="text-[9.5px] text-slate-500 uppercase tracking-wider font-medium block">
            CORPORATE TAX DUE (9%)
          </span>
          <span
            className={`text-sm sm:text-[15px] font-semibold leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap ${
              (data?.totals.corporateTaxDue || 0) > 0 ? "text-rose-700" : "text-emerald-700"
            }`}
          >
            AED {formatAlways(data?.totals.corporateTaxDue)}
          </span>
          <span className="text-[10.5px] text-slate-500 font-normal block truncate">
            {(data?.totals.taxableIncomeAboveThreshold || 0) > 0
              ? `Excess: AED ${formatAlways(data?.totals.taxableIncomeAboveThreshold)}`
              : "Below taxable threshold"}
          </span>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div
        className="rounded-xl p-3.5 border border-[#cbd5e1] shadow-2xs flex flex-wrap items-center justify-between gap-3"
        style={{ backgroundColor: "#f4f7fb", border: "1px solid #cbd5e1" }}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5 text-[#1d4ed8]" />
          <span className="text-xs font-medium text-slate-700">Tax Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="h-8 text-xs font-medium bg-white border border-[#cbd5e1] rounded-lg px-2.5 text-slate-800 focus:border-[#1d4ed8] outline-none cursor-pointer"
            style={{ borderColor: "#cbd5e1" }}
          >
            {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((yr) => (
              <option key={yr} value={yr}>
                Fiscal Year {yr}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          UAE Corporate Tax Statutory Period: 01 Jan {selectedYear} to 31 Dec {selectedYear}
        </div>
      </div>

      {/* Monthly Comparative Grid */}
      <div
        ref={printRef}
        className="bg-white border border-[#cbd5e1] rounded-xl shadow-2xs overflow-hidden print:border-none print:shadow-none"
        style={{ border: "1px solid #cbd5e1" }}
      >
        <div
          className="px-5 py-3 border-b border-[#cbd5e1] flex flex-wrap items-center justify-between gap-2"
          style={{ backgroundColor: "#f4f7fb", borderBottom: "1px solid #cbd5e1" }}
        >
          <span className="text-xs font-semibold text-slate-800">
            Monthly Taxable Income Schedule — FY {selectedYear}
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            All amounts in AED
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-7 h-7 rounded-full border-2 border-[#1d4ed8] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-normal">Generating statutory corporate tax grid...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[960px]">
              <thead>
                <tr
                  className="border-b border-[#cbd5e1] text-[11px] uppercase tracking-wider text-slate-600"
                  style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}
                >
                  <th
                    className="py-2.5 px-4 font-semibold min-w-[240px] sticky left-0 z-10 border-r border-slate-200"
                    style={{ backgroundColor: "#f8fafc" }}
                  >
                    Statutory Line Items
                  </th>
                  {data?.months.map((m) => (
                    <th key={m.monthKey} className="py-2.5 px-3 font-semibold text-right min-w-[90px] whitespace-nowrap">
                      {m.monthLabel.split(" ")[0]}
                    </th>
                  ))}
                  <th
                    className="py-2.5 px-4 font-semibold text-right min-w-[130px] text-[#1e3a8a] border-l border-slate-200"
                    style={{ backgroundColor: "#eff6ff" }}
                  >
                    Full Year Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/70">
                {/* ROW 1: Accounting Net Profit */}
                <tr className="hover:bg-[#f8fafc] transition-colors font-medium">
                  <td className="py-3 px-4 text-slate-900 sticky left-0 bg-white border-r border-slate-200/80">
                    Accounting Net Profit
                  </td>
                  {data?.months.map((m) => (
                    <td key={m.monthKey} className="py-3 px-3 text-right font-mono font-normal text-slate-700 tabular-nums">
                      {formatAed(m.accountingNetProfit)}
                    </td>
                  ))}
                  <td
                    className="py-3 px-4 text-right font-mono font-semibold text-slate-900 border-l border-slate-200/80 tabular-nums"
                    style={{ backgroundColor: "#f8fafc" }}
                  >
                    {formatAed(data?.totals.accountingNetProfit)}
                  </td>
                </tr>

                {/* ROW 2: Header Less exempt revenue */}
                <tr style={{ backgroundColor: "#f0fdf4" }}>
                  <td
                    colSpan={(data?.months.length || 12) + 2}
                    className="py-2 px-4 font-semibold text-[11px] uppercase tracking-wider text-emerald-900"
                  >
                    Less Exempt Revenue
                  </td>
                </tr>
                <tr className="hover:bg-[#f8fafc] transition-colors">
                  <td className="py-2.5 px-4 pl-7 sticky left-0 bg-white text-slate-600 font-normal border-r border-slate-200/80">
                    Total exempt revenue
                  </td>
                  {data?.months.map((m) => (
                    <td key={m.monthKey} className="py-2.5 px-3 text-right font-mono font-normal text-slate-500 tabular-nums">
                      {formatAed(m.exemptRevenue)}
                    </td>
                  ))}
                  <td
                    className="py-2.5 px-4 text-right font-mono font-normal text-slate-600 border-l border-slate-200/80 tabular-nums"
                    style={{ backgroundColor: "#f8fafc" }}
                  >
                    {formatAed(data?.totals.exemptRevenue)}
                  </td>
                </tr>

                {/* ROW 3: Header Add back non-deductible expenses */}
                <tr style={{ backgroundColor: "#fffbeb" }}>
                  <td
                    colSpan={(data?.months.length || 12) + 2}
                    className="py-2 px-4 font-semibold text-[11px] uppercase tracking-wider text-amber-900"
                  >
                    Add Back Non-Deductible Expenses
                  </td>
                </tr>
                <tr className="hover:bg-[#f8fafc] transition-colors">
                  <td className="py-2.5 px-4 pl-7 sticky left-0 bg-white text-slate-600 font-normal border-r border-slate-200/80">
                    Total non-deductible expenses
                  </td>
                  {data?.months.map((m) => (
                    <td key={m.monthKey} className="py-2.5 px-3 text-right font-mono font-normal text-slate-500 tabular-nums">
                      {formatAed(m.nonDeductibleExpenses)}
                    </td>
                  ))}
                  <td
                    className="py-2.5 px-4 text-right font-mono font-normal text-slate-600 border-l border-slate-200/80 tabular-nums"
                    style={{ backgroundColor: "#f8fafc" }}
                  >
                    {formatAed(data?.totals.nonDeductibleExpenses)}
                  </td>
                </tr>

                {/* ROW 4: Final Taxable Income */}
                <tr
                  className="font-semibold border-t-2 border-[#cbd5e1] text-slate-900"
                  style={{ backgroundColor: "#eff6ff" }}
                >
                  <td
                    className="py-3.5 px-4 text-[#1e3a8a] sticky left-0 border-r border-[#bfdbfe]"
                    style={{ backgroundColor: "#eff6ff" }}
                  >
                    Adjusted Taxable Income
                  </td>
                  {data?.months.map((m) => (
                    <td key={m.monthKey} className="py-3.5 px-3 text-right font-mono font-medium text-[#1d4ed8] tabular-nums">
                      {formatAed(m.taxableIncome)}
                    </td>
                  ))}
                  <td
                    className="py-3.5 px-4 text-right font-mono font-semibold text-[13px] text-[#1d4ed8] border-l border-[#bfdbfe] tabular-nums"
                    style={{ backgroundColor: "#dbeafe" }}
                  >
                    AED {formatAlways(data?.totals.taxableIncome)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
