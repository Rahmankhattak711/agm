"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useVatReturn } from "@/lib/hooks/finance-hooks";
import {
  PrintIcon,
  ChevronLeftIcon,
  RefreshIcon,
  SparklesIcon,
  CheckIcon,
  PlusIcon,
  CloseIcon,
  ArrowUpRightIcon,
  PercentIcon,
  CalendarIcon,
  SearchIcon,
} from "@/components/icons";
import { useReactToPrint } from "react-to-print";
import type { VatBoxRow } from "@/lib/modules/accounting";

export default function VatReturnFta201Page() {
  const router = useRouter();

  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [periodPreset, setPeriodPreset] = useState("FULL_YEAR");
  const [searchQuery, setSearchQuery] = useState("");

  const handlePresetChange = (preset: string) => {
    setPeriodPreset(preset);
    const year = startDate.slice(0, 4) || "2026";
    switch (preset) {
      case "Q1":
        setStartDate(`${year}-01-01`);
        setEndDate(`${year}-03-31`);
        break;
      case "Q2":
        setStartDate(`${year}-04-01`);
        setEndDate(`${year}-06-30`);
        break;
      case "Q3":
        setStartDate(`${year}-07-01`);
        setEndDate(`${year}-09-30`);
        break;
      case "Q4":
        setStartDate(`${year}-10-01`);
        setEndDate(`${year}-12-31`);
        break;
      case "FULL_YEAR":
      default:
        setStartDate(`${year}-01-01`);
        setEndDate(`${year}-12-31`);
        break;
    }
  };

  const selectedYear = parseInt(startDate.slice(0, 4) || "2026", 10);

  const { data, isLoading, refetch, isFetching } = useVatReturn({
    startDate,
    endDate,
    year: selectedYear,
  });

  // Selected Box for Drawer Drill-down & Edit/Create actions
  const [selectedBox, setSelectedBox] = useState<VatBoxRow | null>(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `UAE-FTA-VAT-201-Return-${startDate}-to-${endDate}`,
  });

  const renderAmount = (val?: number, isTotal = false) => {
    if (val === undefined || val === null || val === 0) {
      return <span className="text-slate-300 font-normal select-none">—</span>;
    }
    return (
      <span
        className={`font-mono tabular-nums ${
          isTotal ? "font-semibold text-[13px] text-[#1d4ed8]" : "font-normal text-[12px] text-[#1d4ed8]"
        }`}
      >
        {val.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    );
  };

  const renderAdjustment = (val?: number) => {
    return (
      <span className="text-slate-500 font-mono font-normal text-[12px] tabular-nums">
        {(val || 0).toFixed(2)}
      </span>
    );
  };

  const outputVatTotal = data?.netVat?.box12DueTax || 0;
  const inputVatTotal = data?.netVat?.box13RecoverableTax || 0;
  const netVatPayable = data?.netVat?.box14NetVatPayable || 0;

  const filterBoxes = (boxes?: VatBoxRow[]) => {
    if (!boxes) return [];
    if (!searchQuery.trim()) return boxes;
    const q = searchQuery.toLowerCase();
    return boxes.filter(
      (b) =>
        b.boxNumber.toLowerCase().includes(q) ||
        b.label.toLowerCase().includes(q)
    );
  };

  const filteredOutputBoxes = filterBoxes(data?.outputVat?.boxes);
  const filteredInputBoxes = filterBoxes(data?.inputVat?.boxes);

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
            <PercentIcon className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-[17px] font-semibold text-slate-800 tracking-tight">
              UAE FTA VAT 201 Return
            </h1>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-normal bg-[#f1f5f9] text-slate-600 border border-[#cbd5e1]"
              style={{ backgroundColor: "#f1f5f9", borderColor: "#cbd5e1" }}
            >
              5% Statutory Filing
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh Data"
            className="p-1.5 rounded-lg border border-[#cbd5e1] bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer flex items-center justify-center"
            style={{ borderColor: "#cbd5e1" }}
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#1d4ed8]" : ""}`} />
          </button>

          <button
            onClick={() => setShowChecklistModal(true)}
            className="px-3 py-1.5 text-[11.5px] font-medium border border-[#cbd5e1] rounded-lg bg-white hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{ borderColor: "#cbd5e1" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
            VAT Checklist
          </button>

          <button
            onClick={() => handlePrint()}
            className="px-3 py-1.5 text-[11.5px] font-medium border border-[#cbd5e1] rounded-lg bg-white hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{ borderColor: "#cbd5e1" }}
          >
            <PrintIcon className="w-3.5 h-3.5 text-slate-500" />
            Export / Print
          </button>

          <button
            className="px-3.5 py-1.5 text-[11.5px] font-medium rounded-lg bg-[#1d4ed8] text-white hover:bg-[#1e40af] flex items-center gap-1.5 transition-all cursor-pointer"
            style={{ backgroundColor: "#1d4ed8", color: "#ffffff", border: "1px solid #1e40af" }}
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            Ask AI
          </button>
        </div>
      </div>

      {/* Simple Clean Filter Bar matching Trial Balance & other pages */}
      <div
        className="rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Range Selectors */}
          <div
            className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-normal"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
            }}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriodPreset("CUSTOM");
              }}
              className="bg-transparent font-medium font-mono text-slate-800 outline-none cursor-pointer"
            />
            <span className="text-slate-400 mx-1">→</span>
            <span className="text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriodPreset("CUSTOM");
              }}
              className="bg-transparent font-medium font-mono text-slate-800 outline-none cursor-pointer"
            />
          </div>

          {/* Filing Quarter / Period Selector */}
          <select
            value={periodPreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-normal text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="FULL_YEAR">Full Year (Jan – Dec)</option>
            <option value="Q1">Quarter 1 (Jan – Mar)</option>
            <option value="Q2">Quarter 2 (Apr – Jun)</option>
            <option value="Q3">Quarter 3 (Jul – Sep)</option>
            <option value="Q4">Quarter 4 (Oct – Dec)</option>
            <option value="CUSTOM">Custom Date Range</option>
          </select>
        </div>

        {/* Quick Search Box */}
        <div className="relative w-full sm:w-64">
          <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search VAT box # or description..."
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
            }}
            className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs font-normal text-slate-700 placeholder-slate-400 outline-none focus:border-blue-600 transition-colors"
          />
        </div>
      </div>

      {/* 4 Compact Pastel KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#fefce8", border: "1px solid #fde047" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            OUTPUT VAT DUE (BOX 8)
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            AED {outputVatTotal.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block truncate">
            Sales: AED {(data?.outputVat?.totalTaxableAmount || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            RECOVERABLE INPUT VAT (BOX 11)
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-emerald-700 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            AED {inputVatTotal.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block truncate">
            Expenses: AED {(data?.inputVat?.totalTaxableAmount || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#fff1f2", border: "1px solid #fda4af" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            NET VAT PAYABLE (BOX 14)
          </span>
          <span
            className={`text-sm sm:text-[15px] font-semibold leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap ${
              netVatPayable >= 0 ? "text-rose-700" : "text-emerald-700"
            }`}
          >
            AED {netVatPayable.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block truncate">
            {netVatPayable >= 0 ? "Net Payable to FTA" : "Net Reclaimable from FTA"}
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            FILING PERIOD RANGE
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-[#1d4ed8] leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            FY {selectedYear}
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block font-mono truncate">
            {startDate} → {endDate}
          </span>
        </div>
      </div>

      {/* VAT Return Form Card */}
      <div
        ref={printRef}
        className="bg-white border border-[#cbd5e1] rounded-xl shadow-2xs overflow-hidden print:border-none print:shadow-none"
        style={{ border: "1px solid #cbd5e1" }}
      >
        {/* Top Table Info Strip */}
        <div
          className="px-5 py-3 border-b border-[#cbd5e1] flex flex-wrap items-center justify-between gap-2"
          style={{ backgroundColor: "#f4f7fb", borderBottom: "1px solid #cbd5e1" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-800">
              Official FTA Form VAT 201 Schedule
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              (Click any box row to inspect or add underlying invoices &amp; bills)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-600">
            TRN: 104094432200003 · Currency: AED
          </span>
        </div>

        {/* Printable Header */}
        <div className="hidden print:block p-6 border-b border-slate-200 text-center">
          <h1 className="text-lg font-semibold">AGM FITOUT TECHNICAL SERVICES LLC</h1>
          <p className="text-xs text-slate-500">TRN: 104094432200003 | Official UAE FTA VAT 201 Return</p>
          <p className="text-xs font-mono mt-1">
            Period: {startDate} to {endDate}
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-7 h-7 rounded-full border-2 border-[#1d4ed8] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-normal">Calculating statutory VAT Return boxes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[740px]">
              <thead>
                <tr
                  className="border-b border-[#cbd5e1] text-[11px] font-semibold uppercase tracking-wider text-slate-600"
                  style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}
                >
                  <th className="py-2.5 px-5 w-20">Box #</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-5 text-right w-44">Taxable Amount (AED)</th>
                  <th className="py-2.5 px-5 text-right w-44">VAT Amount (AED)</th>
                  <th className="py-2.5 px-5 text-right w-36">Adjustments</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/70">
                {/* SECTION 1: VAT on Sales and all other Outputs */}
                <tr style={{ backgroundColor: "#fffbeb" }}>
                  <td colSpan={5} className="py-2.5 px-5 font-semibold text-amber-900 text-[12px]">
                    1. VAT on Sales and all other Outputs
                  </td>
                </tr>

                {filteredOutputBoxes.map((box) => {
                  const isTotal = box.boxNumber === "8";
                  return (
                    <tr
                      key={box.boxNumber}
                      onClick={() => setSelectedBox(box)}
                      className={`group transition-colors cursor-pointer ${
                        isTotal
                          ? "font-semibold text-slate-900 bg-slate-50/70"
                          : "hover:bg-[#f8fafc] text-slate-700 font-normal"
                      }`}
                    >
                      <td className="py-2.5 px-5 font-mono text-slate-500 group-hover:text-[#1d4ed8] transition-colors">
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                          {box.boxNumber}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 flex items-center justify-between gap-2">
                        <span className={isTotal ? "font-semibold text-slate-900" : "font-normal text-slate-800"}>
                          {box.label}
                        </span>
                        {box.transactions && box.transactions.length > 0 && (
                          <span className="text-[10px] text-[#1d4ed8] bg-[#eff6ff] border border-[#bfdbfe] px-2 py-0.5 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            {box.transactions.length} Invoices ➔
                          </span>
                        )}
                      </td>
                      <td className={`py-2.5 px-5 text-right ${isTotal ? "border-t border-slate-400" : ""}`}>
                        {renderAmount(box.taxableAmount, isTotal)}
                      </td>
                      <td className={`py-2.5 px-5 text-right ${isTotal ? "border-t border-slate-400" : ""}`}>
                        {renderAmount(box.taxAmount, isTotal)}
                      </td>
                      <td className="py-2.5 px-5 text-right">
                        {renderAdjustment(box.adjustments)}
                      </td>
                    </tr>
                  );
                })}

                {/* SECTION 2: VAT on Expenses and all other Inputs */}
                <tr style={{ backgroundColor: "#f0fdf4" }}>
                  <td colSpan={5} className="py-2.5 px-5 font-semibold text-emerald-900 text-[12px]">
                    2. VAT on Expenses and all other Inputs
                  </td>
                </tr>

                {filteredInputBoxes.map((box) => {
                  const isTotal = box.boxNumber === "11";
                  return (
                    <tr
                      key={box.boxNumber}
                      onClick={() => setSelectedBox(box)}
                      className={`group transition-colors cursor-pointer ${
                        isTotal
                          ? "font-semibold text-slate-900 bg-slate-50/70"
                          : "hover:bg-[#f8fafc] text-slate-700 font-normal"
                      }`}
                    >
                      <td className="py-2.5 px-5 font-mono text-slate-500 group-hover:text-[#1d4ed8] transition-colors">
                        <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                          {box.boxNumber}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 flex items-center justify-between gap-2">
                        <span className={isTotal ? "font-semibold text-slate-900" : "font-normal text-slate-800"}>
                          {box.label}
                        </span>
                        {box.transactions && box.transactions.length > 0 && (
                          <span className="text-[10px] text-[#1d4ed8] bg-[#eff6ff] border border-[#bfdbfe] px-2 py-0.5 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            {box.transactions.length} Records ➔
                          </span>
                        )}
                      </td>
                      <td className={`py-2.5 px-5 text-right ${isTotal ? "border-t border-slate-400" : ""}`}>
                        {renderAmount(box.taxableAmount, isTotal)}
                      </td>
                      <td className={`py-2.5 px-5 text-right ${isTotal ? "border-t border-slate-400" : ""}`}>
                        {renderAmount(box.taxAmount, isTotal)}
                      </td>
                      <td className="py-2.5 px-5 text-right">
                        {renderAdjustment(box.adjustments)}
                      </td>
                    </tr>
                  );
                })}

                {/* SECTION 3: Net VAT due */}
                <tr style={{ backgroundColor: "#eff6ff" }}>
                  <td colSpan={5} className="py-2.5 px-5 font-semibold text-[#1e3a8a] text-[12px]">
                    3. Net VAT Due Computation
                  </td>
                </tr>

                {/* Box 12 */}
                <tr className="hover:bg-[#f8fafc] transition-colors">
                  <td className="py-2.5 px-5 font-mono text-slate-500">
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                      12
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-normal text-slate-800">
                    Total value of due tax for the period
                  </td>
                  <td className="py-2.5 px-5 text-right">{renderAmount(0)}</td>
                  <td className="py-2.5 px-5 text-right">
                    {renderAmount(data?.netVat.box12DueTax, true)}
                  </td>
                  <td className="py-2.5 px-5 text-right">{renderAdjustment(0)}</td>
                </tr>

                {/* Box 13 */}
                <tr className="hover:bg-[#f8fafc] transition-colors">
                  <td className="py-2.5 px-5 font-mono text-slate-500">
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                      13
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-normal text-slate-800">
                    Total value of recoverable tax for the period
                  </td>
                  <td className="py-2.5 px-5 text-right">
                    {renderAmount(data?.inputVat.totalTaxableAmount, true)}
                  </td>
                  <td className="py-2.5 px-5 text-right">
                    {renderAmount(data?.netVat.box13RecoverableTax, true)}
                  </td>
                  <td className="py-2.5 px-5 text-right">{renderAdjustment(0)}</td>
                </tr>

                {/* Box 14 Net Result */}
                <tr
                  className="font-semibold text-slate-900 border-t-2 border-[#cbd5e1]"
                  style={{ backgroundColor: "#f4f7fb" }}
                >
                  <td className="py-3 px-5 font-mono text-[#1d4ed8]">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-[#eff6ff] border border-[#bfdbfe] text-[#1d4ed8] text-[11px]">
                      14
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    Net VAT payable (or reclaimable) for the period (Box 12 − Box 13)
                  </td>
                  <td className="py-3 px-5 text-right font-mono font-semibold text-slate-700 tabular-nums">
                    {(data?.netVat.box14NetVatPayable || 0) < 0
                      ? `-${Math.abs(data?.inputVat.totalTaxableAmount || 0).toFixed(2)}`
                      : (data?.outputVat.totalTaxableAmount || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-5 text-right font-mono font-semibold text-[13px] text-[#1d4ed8] tabular-nums">
                    AED{" "}
                    {data?.netVat.box14NetVatPayable !== undefined
                      ? (data.netVat.box14NetVatPayable >= 0 ? "" : "-") +
                        Math.abs(data.netVat.box14NetVatPayable).toFixed(2)
                      : "0.00"}
                  </td>
                  <td className="py-3 px-5 text-right">
                    {(data?.netVat.box14NetVatPayable || 0) >= 0 ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        PAYABLE
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        RECLAIMABLE
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Summary Strip */}
        <div
          className="px-5 py-3 border-t border-[#cbd5e1] text-xs text-slate-600 font-normal flex flex-wrap items-center justify-between gap-4"
          style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #cbd5e1" }}
        >
          <div className="flex items-center gap-6">
            <span>
              Net VAT Due:{" "}
              <span className="text-[#1d4ed8] font-semibold font-mono">
                AED {data?.netVat.box14NetVatPayable.toFixed(2) || "0.00"}
              </span>
            </span>
            <span>
              Total Boxes:{" "}
              <span className="text-slate-900 font-medium font-mono">
                {(data?.outputVat.boxes.length || 0) + (data?.inputVat.boxes.length || 0) + 3}
              </span>
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Real-time calculation · UAE Federal Decree-Law No. 8 of 2017
          </span>
        </div>
      </div>

      {/* Drill-Down Slide-over Drawer */}
      {selectedBox && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-[#cbd5e1] flex flex-col justify-between p-5 sm:p-6 space-y-5 overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="space-y-3 pb-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#1d4ed8] uppercase tracking-wider font-mono px-2 py-0.5 rounded bg-[#eff6ff] border border-[#bfdbfe]">
                  Box {selectedBox.boxNumber} Breakdown
                </span>
                <button
                  onClick={() => setSelectedBox(null)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-base font-semibold text-slate-900">{selectedBox.label}</h2>

              {/* Total Card */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-3 rounded-xl border border-[#cbd5e1]"
                  style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }}
                >
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                    Taxable Amount
                  </div>
                  <div className="text-sm font-semibold text-slate-900 font-mono mt-0.5">
                    AED {selectedBox.taxableAmount.toFixed(2)}
                  </div>
                </div>
                <div
                  className="p-3 rounded-xl border border-[#cbd5e1]"
                  style={{ backgroundColor: "#eff6ff", border: "1px solid #cbd5e1" }}
                >
                  <div className="text-[10px] uppercase tracking-wider text-[#1e40af] font-medium">
                    VAT Amount (5%)
                  </div>
                  <div className="text-sm font-semibold text-[#1d4ed8] font-mono mt-0.5">
                    AED {selectedBox.taxAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Quick Creation Actions */}
              <div className="flex items-center gap-2 pt-1">
                {selectedBox.boxNumber.startsWith("1") && selectedBox.boxNumber !== "10" && selectedBox.boxNumber !== "11" ? (
                  <button
                    onClick={() => router.push("/commercial/sales-invoices")}
                    className="w-full py-2 px-3 text-xs font-medium rounded-lg bg-[#1d4ed8] text-white hover:bg-[#1e40af] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                    style={{ backgroundColor: "#1d4ed8", color: "#ffffff" }}
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Create New Sales Invoice
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => router.push("/commercial/supplier-bills")}
                      className="flex-1 py-2 px-3 text-xs font-medium rounded-lg bg-[#1d4ed8] text-white hover:bg-[#1e40af] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                      style={{ backgroundColor: "#1d4ed8", color: "#ffffff" }}
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      Add Supplier Bill
                    </button>
                    <button
                      onClick={() => router.push("/finance/expenses")}
                      className="flex-1 py-2 px-3 text-xs font-medium rounded-lg border border-[#cbd5e1] bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      Record Expense
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Transactions List */}
            <div className="flex-1 space-y-2.5 overflow-y-auto">
              <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Contributing Transactions ({selectedBox.transactions?.length || 0})
              </h3>

              {!selectedBox.transactions || selectedBox.transactions.length === 0 ? (
                <div className="py-12 text-center space-y-1.5 border border-dashed border-[#cbd5e1] rounded-xl p-6 bg-slate-50/50">
                  <p className="text-xs text-slate-600 font-medium">
                    No transactions recorded for this box in the selected period.
                  </p>
                  <p className="text-[11px] text-slate-400 font-normal">
                    Use the buttons above to create an invoice or bill; it will automatically appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedBox.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-white border border-[#cbd5e1] rounded-xl hover:border-[#1d4ed8] transition-all flex items-center justify-between gap-3"
                      style={{ border: "1px solid #cbd5e1" }}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900 font-mono">
                            {tx.number}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {tx.type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 font-normal">{tx.contactName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{tx.date}</div>
                      </div>

                      <div className="text-right space-y-0.5">
                        <div className="text-xs font-semibold font-mono text-slate-900">
                          AED {tx.totalAmount.toFixed(2)}
                        </div>
                        <div className="text-[11px] font-mono text-[#1d4ed8] font-medium">
                          VAT: AED {tx.vatAmount.toFixed(2)}
                        </div>
                        <button
                          onClick={() => router.push(tx.url)}
                          className="text-[11px] font-medium text-[#1d4ed8] hover:underline flex items-center gap-1 justify-end ml-auto pt-0.5 cursor-pointer"
                        >
                          View / Edit
                          <ArrowUpRightIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Footer Explanation */}
            <div
              className="p-3.5 border border-[#cbd5e1] rounded-xl text-[11px] text-slate-600 space-y-1"
              style={{ backgroundColor: "#f4f7fb", border: "1px solid #cbd5e1" }}
            >
              <p className="font-semibold text-slate-800">Real-Time FTA Ledger Sync</p>
              <p className="font-normal">
                Every posted Sales Invoice, Supplier Bill, or Expense automatically recalculates this VAT 201 box in real time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VAT Checklist Modal */}
      {showChecklistModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div
            className="bg-white border border-[#cbd5e1] rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95"
            style={{ border: "1px solid #cbd5e1" }}
          >
            <div
              className="px-5 py-3.5 border-b border-[#cbd5e1] flex items-center justify-between"
              style={{ backgroundColor: "#f4f7fb", borderBottom: "1px solid #cbd5e1" }}
            >
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-emerald-600" />
                FTA VAT 201 Filing Checklist
              </h3>
              <button
                onClick={() => setShowChecklistModal(false)}
                className="text-slate-400 hover:text-slate-800 text-xs font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700">
              <div
                className="p-3 rounded-lg border border-[#cbd5e1] space-y-0.5"
                style={{ backgroundColor: "#f0fdf4", border: "1px solid #cbd5e1" }}
              >
                <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
                  <span className="text-emerald-600">✓</span> Commercial Invoices Posted
                </div>
                <p className="text-emerald-800/80 text-[11px] font-normal">
                  All commercial invoices for this period are in POSTED or PAID status.
                </p>
              </div>

              <div
                className="p-3 rounded-lg border border-[#cbd5e1] space-y-0.5"
                style={{ backgroundColor: "#eff6ff", border: "1px solid #cbd5e1" }}
              >
                <div className="font-semibold text-[#1e3a8a] flex items-center gap-1.5">
                  <span className="text-[#1d4ed8]">✓</span> Emirate Box Allocation (Box 1a – 1g)
                </div>
                <p className="text-slate-600 text-[11px] font-normal">
                  Standard-rated supplies are allocated to Dubai (AGM Fitout LLC registration).
                </p>
              </div>

              <div
                className="p-3 rounded-lg border border-[#cbd5e1] space-y-0.5"
                style={{ backgroundColor: "#fefce8", border: "1px solid #cbd5e1" }}
              >
                <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                  <span className="text-amber-600">✓</span> Input Tax Recovery Verification
                </div>
                <p className="text-amber-800/80 text-[11px] font-normal">
                  Supplier bills have verified TRN numbers for valid input tax recovery under Box 9.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowChecklistModal(false)}
                  className="h-8 px-4 bg-[#1d4ed8] text-white text-xs font-medium rounded-lg hover:bg-[#1e40af] transition-colors cursor-pointer"
                  style={{ backgroundColor: "#1d4ed8", color: "#ffffff" }}
                >
                  Close Checklist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
