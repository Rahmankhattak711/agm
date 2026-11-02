"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTaxReport } from "@/lib/hooks/finance-hooks";
import {
  ChevronLeftIcon,
  PrintIcon,
  RefreshIcon,
  SparklesIcon,
  SearchIcon,
  CalendarIcon,
  ArrowRightIcon,
} from "@/components/icons";
import { useReactToPrint } from "react-to-print";

export default function TaxReportPage() {
  const router = useRouter();

  // Mode: Summary vs Details
  const [mode, setMode] = useState<"summary" | "details">(() => {
    if (typeof window !== "undefined") {
      const m = new URLSearchParams(window.location.search).get("mode");
      if (m === "details") return "details";
    }
    return "summary";
  });

  // Timeline Slider: Jan 2026 to Oct 2026 (matching Wafeq screenshot)
  const [startMonthIdx, setStartMonthIdx] = useState(0); // 0 = Jan 2026
  const [endMonthIdx, setEndMonthIdx] = useState(9); // 9 = Oct 2026

  const allMonths2026 = [
    { name: "Jan", full: "2026-01-01", end: "2026-01-31" },
    { name: "Feb", full: "2026-02-01", end: "2026-02-28" },
    { name: "Mar", full: "2026-03-01", end: "2026-03-31" },
    { name: "Apr", full: "2026-04-01", end: "2026-04-30" },
    { name: "May", full: "2026-05-01", end: "2026-05-31" },
    { name: "Jun", full: "2026-06-01", end: "2026-06-30" },
    { name: "Jul", full: "2026-07-01", end: "2026-07-31" },
    { name: "Aug", full: "2026-08-01", end: "2026-08-31" },
    { name: "Sep", full: "2026-09-01", end: "2026-09-30" },
    { name: "Oct", full: "2026-10-01", end: "2026-10-31" },
    { name: "Nov", full: "2026-11-01", end: "2026-11-30" },
    { name: "Dec", full: "2026-12-01", end: "2026-12-31" },
  ];

  const months2025 = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const startDate = allMonths2026[startMonthIdx].full;
  const endDate = allMonths2026[endMonthIdx].end;

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  const { data, isLoading, refetch, isFetching } = useTaxReport({
    startDate,
    endDate,
    year: 2026,
  });

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `UAE-Tax-Report-2026-${mode}`,
  });

  // Render values matching Wafeq: purple `#5e48e8` font, or purple dash `—` for zero
  const renderTaxValue = (val?: number, showDashIfZero = false) => {
    if (val === undefined || val === null || val === 0) {
      if (showDashIfZero) {
        return <span className="text-[#5e48e8] font-medium select-none">—</span>;
      }
      return null;
    }
    return (
      <span className="text-[#5e48e8] font-mono font-medium text-xs">
        {val.toFixed(2)}
      </span>
    );
  };

  const handleRowClick = (det: any) => {
    if (det.type === "Invoice") {
      router.push(`/commercial/sales-invoices/${det.id}`);
    } else if (det.type === "Bill") {
      router.push("/commercial/supplier-bills");
    } else if (det.type === "Expense") {
      router.push("/finance/expenses");
    } else if (det.type === "Credit Note") {
      router.push("/commercial/credit-notes");
    } else if (det.type === "Debit Note") {
      router.push("/commercial/debit-notes");
    }
  };

  const handleSummaryRowClick = (taxType: string) => {
    setFilterType(taxType);
    setMode("details");
  };

  const filteredDetails = (data?.details || []).filter((item) => {
    const matchSearch =
      item.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.contactName.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());

    const matchType =
      filterType === "ALL" ||
      item.taxCategory.toLowerCase().includes(filterType.toLowerCase());
    return matchSearch && matchType;
  });

  return (
    <div className="bg-[#fcfcfd] min-h-screen text-slate-900 pb-16">
      {/* Top Header matching Wafeq Screenshot exactly */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-30 px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <button
            onClick={() => router.push("/finance/reports")}
            className="hover:text-[#5e48e8] transition-colors"
          >
            Reports
          </button>
          <span>&gt;</span>
          <span className="text-slate-900 font-semibold">Tax Report</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Create Buttons so user knows where to create/edit live data */}
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            <button
              onClick={() => router.push("/commercial/sales-invoices")}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            >
              + Sales Invoice
            </button>
            <button
              onClick={() => router.push("/commercial/supplier-bills")}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            >
              + Add Bill
            </button>
            <button
              onClick={() => router.push("/finance/expenses")}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            >
              + Record Expense
            </button>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh Data"
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => handlePrint()}
            className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PrintIcon className="w-3.5 h-3.5" />
            Export
          </button>

          <button className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#5e48e8] text-white hover:bg-[#503cd1] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
            <SparklesIcon className="w-3.5 h-3.5" />
            Ask AI
          </button>
        </div>
      </div>

      <div className="max-w-[1350px] mx-auto px-8 py-6 space-y-6">
        {/* Date Selector & Mode Tabs Bar matching Wafeq Screenshot */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: Date + Summary / Details Toggle Buttons */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <span className="text-slate-400">📅 Date</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-900 border border-slate-200">
                  {allMonths2026[startMonthIdx].name} 2026 → {allMonths2026[endMonthIdx].name} 2026
                </span>
              </div>

              {/* Summary / Details Pill Toggle right next to Date */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setMode("summary")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    mode === "summary"
                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setMode("details")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    mode === "details"
                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Details
                </button>
              </div>
            </div>

            {/* Right: Search and Active Filter badge in details mode */}
            {mode === "details" && (
              <div className="flex items-center gap-2 flex-1 max-w-md ml-auto">
                {filterType !== "ALL" && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold bg-[#5e48e8]/10 text-[#5e48e8] px-2.5 py-1 rounded-md">
                    <span>Filter: {filterType}</span>
                    <button
                      onClick={() => setFilterType("ALL")}
                      className="ml-1 text-[#5e48e8] hover:text-slate-900 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                )}
                <div className="relative w-full">
                  <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search invoices, contacts..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#5e48e8] outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Interactive Timeline Bar */}
          <div className="relative border border-slate-200 rounded-lg bg-slate-50/70 p-2 flex items-center overflow-x-auto text-[11px]">
            {/* 2025 Segment */}
            <div className="flex items-center pr-4 border-r border-slate-200/80 mr-2 text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-2">2025</span>
              <div className="flex items-center gap-1">
                {months2025.map((m) => (
                  <span key={m} className="px-2 py-1 text-slate-400 cursor-not-allowed">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* 2026 Segment with Purple Range Slider Box */}
            <div className="flex items-center relative pl-1">
              <span className="text-[10px] font-bold text-[#5e48e8] mr-2">2026</span>
              <div className="flex items-center gap-0.5 relative">
                {/* Purple Active Slider Box */}
                <div
                  className="absolute top-0 bottom-0 bg-[#5e48e8]/10 border-2 border-[#5e48e8] rounded-lg pointer-events-none transition-all duration-200"
                  style={{
                    left: `${startMonthIdx * 42}px`,
                    width: `${(endMonthIdx - startMonthIdx + 1) * 42}px`,
                  }}
                >
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-4 rounded bg-[#5e48e8]" />
                  <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-4 rounded bg-[#5e48e8]" />
                </div>

                {allMonths2026.map((m, idx) => {
                  const isSelected = idx >= startMonthIdx && idx <= endMonthIdx;
                  return (
                    <button
                      key={m.name}
                      onClick={() => {
                        if (idx < startMonthIdx) {
                          setStartMonthIdx(idx);
                        } else if (idx > endMonthIdx) {
                          setEndMonthIdx(idx);
                        } else {
                          setEndMonthIdx(idx);
                        }
                      }}
                      className={`w-[42px] py-1 text-center font-medium rounded transition-colors cursor-pointer ${
                        isSelected
                          ? "text-[#5e48e8] font-bold"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Tax Report Table Card */}
        <div
          ref={printRef}
          className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden print:border-none print:shadow-none"
        >
          {/* Printable Header */}
          <div className="hidden print:block p-8 border-b border-slate-200 text-center">
            <h1 className="text-xl font-bold">AGM FITOUT TECHNICAL SERVICES LLC</h1>
            <p className="text-xs text-slate-500">TRN: 104094432200003 | Tax Report ({mode.toUpperCase()})</p>
            <p className="text-xs font-mono mt-1">Period: {startDate} to {endDate}</p>
          </div>

          {isLoading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#5e48e8] border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading statutory tax report...</p>
            </div>
          ) : mode === "summary" ? (
            /* SUMMARY TABLE (Matching Wafeq Screenshot exactly with grid borders) */
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-900 font-semibold">
                    <th className="py-2.5 px-6 border-r border-slate-200/80 w-48">Tax type</th>
                    <th className="py-2.5 px-6 border-r border-slate-200/80">Tax name</th>
                    <th className="py-2.5 px-6 border-r border-slate-200/80 text-right w-52">Taxable amount</th>
                    <th className="py-2.5 px-6 text-right w-52">Tax amount</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200/80">
                  {/* Row 1: Out of Scope */}
                  <tr
                    onClick={() => handleSummaryRowClick("Out of Scope")}
                    className="hover:bg-[#f8f8fc] transition-colors cursor-pointer group"
                    title="Click to view Out of Scope details"
                  >
                    <td className="py-3 px-6 font-medium text-slate-900 border-r border-slate-200/80 group-hover:text-[#5e48e8]">
                      Out of Scope
                    </td>
                    <td className="py-3 px-6 text-slate-700 font-medium border-r border-slate-200/80 flex items-center gap-1.5">
                      <span>Out of Scope (0.00%)</span>
                      <span className="text-[10px] text-slate-400 font-mono">ⓦ</span>
                    </td>
                    <td className="py-3 px-6 text-right border-r border-slate-200/80">
                      {renderTaxValue(data?.summary.find((s) => s.taxType === "Out of Scope")?.taxableAmount)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {renderTaxValue(data?.summary.find((s) => s.taxType === "Out of Scope")?.taxAmount)}
                    </td>
                  </tr>

                  {/* Row 2: Reverse Charge */}
                  <tr
                    onClick={() => handleSummaryRowClick("Reverse Charge")}
                    className="hover:bg-[#f8f8fc] transition-colors cursor-pointer group"
                    title="Click to view Reverse Charge details"
                  >
                    <td className="py-3 px-6 font-medium text-slate-900 border-r border-slate-200/80 group-hover:text-[#5e48e8]">
                      Reverse Charge
                    </td>
                    <td className="py-3 px-6 text-slate-700 font-medium border-r border-slate-200/80 flex items-center gap-1.5">
                      <span>Reverse Charge (5.00%)</span>
                      <span className="text-[10px] text-slate-400 font-mono">ⓦ</span>
                    </td>
                    <td className="py-3 px-6 text-right border-r border-slate-200/80">
                      {renderTaxValue(data?.summary.find((s) => s.taxType === "Reverse Charge")?.taxableAmount, true)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {renderTaxValue(data?.summary.find((s) => s.taxType === "Reverse Charge")?.taxAmount, true)}
                    </td>
                  </tr>

                  {/* Row 3: Purchases */}
                  <tr
                    onClick={() => handleSummaryRowClick("Purchases")}
                    className="hover:bg-[#f8f8fc] transition-colors cursor-pointer group"
                    title="Click to view Purchases details"
                  >
                    <td className="py-3 px-6 font-medium text-slate-900 border-r border-slate-200/80 group-hover:text-[#5e48e8]">
                      Purchases
                    </td>
                    <td className="py-3 px-6 text-slate-700 font-medium border-r border-slate-200/80 flex items-center gap-1.5">
                      <span>VAT on Purchases (5.00%)</span>
                      <span className="text-[10px] text-slate-400 font-mono">ⓦ</span>
                    </td>
                    <td className="py-3 px-6 text-right border-r border-slate-200/80">
                      {renderTaxValue(data?.summary.find((s) => s.taxType === "Purchases")?.taxableAmount, true)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {renderTaxValue(data?.summary.find((s) => s.taxType === "Purchases")?.taxAmount, true)}
                    </td>
                  </tr>

                  {/* Row 4: Sales Exempt */}
                  <tr
                    onClick={() => handleSummaryRowClick("Exempt")}
                    className="hover:bg-[#f8f8fc] transition-colors cursor-pointer group"
                    title="Click to view Exempt sales details"
                  >
                    <td className="py-3 px-6 font-medium text-slate-900 border-r border-slate-200/80 group-hover:text-[#5e48e8]">
                      Sales
                    </td>
                    <td className="py-3 px-6 text-slate-700 font-medium border-r border-slate-200/80 flex items-center gap-1.5">
                      <span>Exempt (0.00%)</span>
                      <span className="text-[10px] text-slate-400 font-mono">ⓦ</span>
                    </td>
                    <td className="py-3 px-6 text-right border-r border-slate-200/80">
                      {renderTaxValue(data?.summary.find((s) => s.taxName.includes("Exempt"))?.taxableAmount)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {renderTaxValue(data?.summary.find((s) => s.taxName.includes("Exempt"))?.taxAmount)}
                    </td>
                  </tr>

                  {/* Row 5: Sales Zero-Rated */}
                  <tr
                    onClick={() => handleSummaryRowClick("Zero-Rated")}
                    className="hover:bg-[#f8f8fc] transition-colors cursor-pointer group"
                    title="Click to view Zero-Rated sales details"
                  >
                    <td className="py-3 px-6 font-medium text-slate-900 border-r border-slate-200/80 group-hover:text-[#5e48e8]">
                      Sales
                    </td>
                    <td className="py-3 px-6 text-slate-700 font-medium border-r border-slate-200/80 flex items-center gap-1.5">
                      <span>Zero-Rated Sales (0.00%)</span>
                      <span className="text-[10px] text-slate-400 font-mono">ⓦ</span>
                    </td>
                    <td className="py-3 px-6 text-right border-r border-slate-200/80">
                      {renderTaxValue(data?.summary.find((s) => s.taxName.includes("Zero-Rated"))?.taxableAmount)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {renderTaxValue(data?.summary.find((s) => s.taxName.includes("Zero-Rated"))?.taxAmount)}
                    </td>
                  </tr>

                  {/* Row 6: Sales 5% Standard Rated */}
                  <tr
                    onClick={() => handleSummaryRowClick("Sales")}
                    className="hover:bg-[#f8f8fc] transition-colors cursor-pointer group"
                    title="Click to view VAT on Sales details"
                  >
                    <td className="py-3 px-6 font-medium text-slate-900 border-r border-slate-200/80 group-hover:text-[#5e48e8]">
                      Sales
                    </td>
                    <td className="py-3 px-6 text-slate-700 font-medium border-r border-slate-200/80 flex items-center gap-1.5">
                      <span>VAT on Sales (5.00%)</span>
                      <span className="text-[10px] text-slate-400 font-mono">ⓦ</span>
                    </td>
                    <td className="py-3 px-6 text-right border-r border-slate-200/80">
                      {renderTaxValue(data?.summary.find((s) => s.taxName.includes("VAT on Sales"))?.taxableAmount, true)}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {renderTaxValue(data?.summary.find((s) => s.taxName.includes("VAT on Sales"))?.taxAmount, true)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* DETAILS TABLE */
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-900 font-semibold">
                    <th className="py-2.5 px-4 border-r border-slate-200/80">Date</th>
                    <th className="py-2.5 px-3 border-r border-slate-200/80">Type</th>
                    <th className="py-2.5 px-4 border-r border-slate-200/80">Ref #</th>
                    <th className="py-2.5 px-4 border-r border-slate-200/80">Contact / Entity</th>
                    <th className="py-2.5 px-4 border-r border-slate-200/80">Tax Category</th>
                    <th className="py-2.5 px-4 border-r border-slate-200/80 text-right">Taxable (AED)</th>
                    <th className="py-2.5 px-4 border-r border-slate-200/80 text-right">Tax (AED)</th>
                    <th className="py-2.5 px-4 border-r border-slate-200/80 text-right">Total (AED)</th>
                    <th className="py-2.5 px-4 text-center w-28">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200/80">
                  {filteredDetails.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-400">
                        No transactions recorded for the selected period.
                      </td>
                    </tr>
                  ) : (
                    filteredDetails.map((det) => (
                      <tr
                        key={det.id}
                        onClick={() => handleRowClick(det)}
                        className="hover:bg-[#f8f8fc] transition-colors cursor-pointer group"
                      >
                        <td className="py-2.5 px-4 font-mono text-slate-500 border-r border-slate-200/80">
                          {det.date}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200/80">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {det.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-900 border-r border-slate-200/80 group-hover:text-[#5e48e8] transition-colors">
                          {det.referenceNumber}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-800 border-r border-slate-200/80">
                          {det.contactName}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 border-r border-slate-200/80">
                          {det.taxCategory}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-900 border-r border-slate-200/80">
                          {det.taxableAmount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-[#5e48e8] border-r border-slate-200/80">
                          {det.taxAmount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 border-r border-slate-200/80">
                          {det.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(det);
                            }}
                            className="px-2 py-0.5 text-[11px] font-medium text-[#5e48e8] hover:bg-[#5e48e8]/10 rounded border border-[#5e48e8]/20 transition-all cursor-pointer"
                          >
                            View / Edit ↗
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom Bar matching Wafeq Screenshot */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium flex items-center gap-6">
            <span>
              Total Taxable:{" "}
              <strong className="text-slate-900 font-mono">
                AED {data?.totals.totalTaxableAmount.toFixed(2) || "0.00"}
              </strong>
            </span>
            <span>
              Total Tax:{" "}
              <strong className="text-[#5e48e8] font-mono">
                AED {data?.totals.totalTaxAmount.toFixed(2) || "0.00"}
              </strong>
            </span>
            <span>
              Records:{" "}
              <strong className="text-slate-900 font-mono">
                {mode === "summary" ? data?.summary.length || 0 : filteredDetails.length}
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
