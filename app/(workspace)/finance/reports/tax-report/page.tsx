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
  FileCheck2Icon,
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

  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [periodPreset, setPeriodPreset] = useState("FULL_YEAR");

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

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  const { data, isLoading, refetch, isFetching } = useTaxReport({
    startDate,
    endDate,
    year: selectedYear,
  });

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `UAE-Tax-Report-${startDate}-to-${endDate}-${mode}`,
  });

  const renderTaxValue = (val?: number, showDashIfZero = false) => {
    if (val === undefined || val === null || val === 0) {
      if (showDashIfZero) {
        return <span className="text-slate-300 font-normal select-none">—</span>;
      }
      return <span className="text-slate-300 font-normal select-none">—</span>;
    }
    return (
      <span className="text-[#1d4ed8] font-mono font-normal text-xs tabular-nums">
        {val.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

  const salesVatSummary = data?.summary.find((s) => s.taxName.includes("VAT on Sales"));
  const purchasesVatSummary = data?.summary.find((s) => s.taxType === "Purchases");

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
            <FileCheck2Icon className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-[17px] font-semibold text-slate-800 tracking-tight">
              Tax Report &amp; Audit Register
            </h1>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-normal bg-[#f1f5f9] text-slate-600 border border-[#cbd5e1]"
              style={{ backgroundColor: "#f1f5f9", borderColor: "#cbd5e1" }}
            >
              {mode === "summary" ? "Summary View" : "Detailed Register"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="hidden md:flex items-center gap-1.5 mr-1">
            <button
              onClick={() => router.push("/commercial/sales-invoices")}
              className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-[#cbd5e1] bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              style={{ borderColor: "#cbd5e1" }}
            >
              + Sales Invoice
            </button>
            <button
              onClick={() => router.push("/commercial/supplier-bills")}
              className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-[#cbd5e1] bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              style={{ borderColor: "#cbd5e1" }}
            >
              + Add Bill
            </button>
            <button
              onClick={() => router.push("/finance/expenses")}
              className="px-2.5 py-1.5 text-[11px] font-medium rounded-lg border border-[#cbd5e1] bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              style={{ borderColor: "#cbd5e1" }}
            >
              + Record Expense
            </button>
          </div>

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
            className="px-3 py-1.5 text-[11.5px] font-medium border border-[#cbd5e1] rounded-lg bg-white hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            style={{ borderColor: "#cbd5e1" }}
          >
            <PrintIcon className="w-3.5 h-3.5 text-slate-500" />
            Export
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

          {/* Filing Period Preset */}
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

          {/* Summary / Details Pill Toggle */}
          <div className="flex items-center bg-white p-0.5 rounded-lg border border-[#cbd5e1] text-xs">
            <button
              onClick={() => setMode("summary")}
              className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                mode === "summary"
                  ? "bg-[#1d4ed8] text-white font-medium shadow-2xs"
                  : "text-slate-600 font-normal hover:text-slate-900"
              }`}
              style={mode === "summary" ? { backgroundColor: "#1d4ed8", color: "#ffffff" } : undefined}
            >
              Summary
            </button>
            <button
              onClick={() => setMode("details")}
              className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                mode === "details"
                  ? "bg-[#1d4ed8] text-white font-medium shadow-2xs"
                  : "text-slate-600 font-normal hover:text-slate-900"
              }`}
              style={mode === "details" ? { backgroundColor: "#1d4ed8", color: "#ffffff" } : undefined}
            >
              Details ({filteredDetails.length})
            </button>
          </div>
        </div>

        {/* Right: Search and Active Filter badge */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {filterType !== "ALL" && (
            <span className="flex items-center gap-1 text-[11px] font-medium bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] px-2.5 py-1 rounded-lg shrink-0">
              <span>Filter: {filterType}</span>
              <button
                onClick={() => setFilterType("ALL")}
                className="ml-1 text-[#1d4ed8] hover:text-slate-900 cursor-pointer"
              >
                ×
              </button>
            </span>
          )}
          <div className="relative w-full sm:w-64">
            <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
            <input
              type="text"
              placeholder="Search invoices, contacts..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (mode === "summary" && e.target.value.trim()) {
                  setMode("details");
                }
              }}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
              }}
              className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs font-normal text-slate-700 placeholder-slate-400 outline-none focus:border-blue-600 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 4 Compact Pastel KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            TOTAL TAXABLE AMOUNT
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            AED {(data?.totals.totalTaxableAmount || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block">
            Combined net base
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#fefce8", border: "1px solid #fde047" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            VAT ON SALES (5%)
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            AED {(salesVatSummary?.taxAmount || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block">
            Standard-rated output tax
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            VAT ON PURCHASES (5%)
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-emerald-700 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            AED {(purchasesVatSummary?.taxAmount || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block">
            Recoverable input tax
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#fff1f2", border: "1px solid #fda4af" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            TOTAL TAX AMOUNT
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-rose-700 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            AED {(data?.totals.totalTaxAmount || 0).toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block">
            {(data?.details || []).length} recorded tax transactions
          </span>
        </div>
      </div>

      {/* Main Tax Report Table Card */}
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
          <span className="text-xs font-semibold text-slate-800">
            {mode === "summary"
              ? "Tax Classification Summary (Click any row to drill down)"
              : "Tax Audit Transaction Register"}
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Period: {startDate} to {endDate}
          </span>
        </div>

        {/* Printable Header */}
        <div className="hidden print:block p-6 border-b border-slate-200 text-center">
          <h1 className="text-lg font-semibold">AGM FITOUT TECHNICAL SERVICES LLC</h1>
          <p className="text-xs text-slate-500">TRN: 104094432200003 | Tax Report ({mode.toUpperCase()})</p>
          <p className="text-xs font-mono mt-1">Period: {startDate} to {endDate}</p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-7 h-7 rounded-full border-2 border-[#1d4ed8] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-normal">Loading statutory tax report...</p>
          </div>
        ) : mode === "summary" ? (
          /* SUMMARY TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[680px]">
              <thead>
                <tr
                  className="border-b border-[#cbd5e1] text-[11px] font-semibold uppercase tracking-wider text-slate-600"
                  style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}
                >
                  <th className="py-2.5 px-5 border-r border-slate-200/80 w-48">Tax Type</th>
                  <th className="py-2.5 px-5 border-r border-slate-200/80">Tax Name &amp; Rate</th>
                  <th className="py-2.5 px-5 border-r border-slate-200/80 text-right w-52">Taxable Amount (AED)</th>
                  <th className="py-2.5 px-5 text-right w-52">Tax Amount (AED)</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/80">
                {/* Row 1: Out of Scope */}
                <tr
                  onClick={() => handleSummaryRowClick("Out of Scope")}
                  className="hover:bg-[#f8fafc] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-5 font-medium text-slate-800 border-r border-slate-200/80 group-hover:text-[#1d4ed8]">
                    Out of Scope
                  </td>
                  <td className="py-3 px-5 text-slate-700 font-normal border-r border-slate-200/80">
                    Out of Scope (0.00%)
                  </td>
                  <td className="py-3 px-5 text-right border-r border-slate-200/80">
                    {renderTaxValue(data?.summary.find((s) => s.taxType === "Out of Scope")?.taxableAmount)}
                  </td>
                  <td className="py-3 px-5 text-right">
                    {renderTaxValue(data?.summary.find((s) => s.taxType === "Out of Scope")?.taxAmount)}
                  </td>
                </tr>

                {/* Row 2: Reverse Charge */}
                <tr
                  onClick={() => handleSummaryRowClick("Reverse Charge")}
                  className="hover:bg-[#f8fafc] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-5 font-medium text-slate-800 border-r border-slate-200/80 group-hover:text-[#1d4ed8]">
                    Reverse Charge
                  </td>
                  <td className="py-3 px-5 text-slate-700 font-normal border-r border-slate-200/80">
                    Reverse Charge (5.00%)
                  </td>
                  <td className="py-3 px-5 text-right border-r border-slate-200/80">
                    {renderTaxValue(data?.summary.find((s) => s.taxType === "Reverse Charge")?.taxableAmount, true)}
                  </td>
                  <td className="py-3 px-5 text-right">
                    {renderTaxValue(data?.summary.find((s) => s.taxType === "Reverse Charge")?.taxAmount, true)}
                  </td>
                </tr>

                {/* Row 3: Purchases */}
                <tr
                  onClick={() => handleSummaryRowClick("Purchases")}
                  className="hover:bg-[#f8fafc] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-5 font-medium text-slate-800 border-r border-slate-200/80 group-hover:text-[#1d4ed8]">
                    Purchases
                  </td>
                  <td className="py-3 px-5 text-slate-700 font-normal border-r border-slate-200/80">
                    VAT on Purchases (5.00%)
                  </td>
                  <td className="py-3 px-5 text-right border-r border-slate-200/80">
                    {renderTaxValue(data?.summary.find((s) => s.taxType === "Purchases")?.taxableAmount, true)}
                  </td>
                  <td className="py-3 px-5 text-right">
                    {renderTaxValue(data?.summary.find((s) => s.taxType === "Purchases")?.taxAmount, true)}
                  </td>
                </tr>

                {/* Row 4: Sales Exempt */}
                <tr
                  onClick={() => handleSummaryRowClick("Exempt")}
                  className="hover:bg-[#f8fafc] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-5 font-medium text-slate-800 border-r border-slate-200/80 group-hover:text-[#1d4ed8]">
                    Sales
                  </td>
                  <td className="py-3 px-5 text-slate-700 font-normal border-r border-slate-200/80">
                    Exempt (0.00%)
                  </td>
                  <td className="py-3 px-5 text-right border-r border-slate-200/80">
                    {renderTaxValue(data?.summary.find((s) => s.taxName.includes("Exempt"))?.taxableAmount)}
                  </td>
                  <td className="py-3 px-5 text-right">
                    {renderTaxValue(data?.summary.find((s) => s.taxName.includes("Exempt"))?.taxAmount)}
                  </td>
                </tr>

                {/* Row 5: Sales Zero-Rated */}
                <tr
                  onClick={() => handleSummaryRowClick("Zero-Rated")}
                  className="hover:bg-[#f8fafc] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-5 font-medium text-slate-800 border-r border-slate-200/80 group-hover:text-[#1d4ed8]">
                    Sales
                  </td>
                  <td className="py-3 px-5 text-slate-700 font-normal border-r border-slate-200/80">
                    Zero-Rated Sales (0.00%)
                  </td>
                  <td className="py-3 px-5 text-right border-r border-slate-200/80">
                    {renderTaxValue(data?.summary.find((s) => s.taxName.includes("Zero-Rated"))?.taxableAmount)}
                  </td>
                  <td className="py-3 px-5 text-right">
                    {renderTaxValue(data?.summary.find((s) => s.taxName.includes("Zero-Rated"))?.taxAmount)}
                  </td>
                </tr>

                {/* Row 6: Sales 5% Standard Rated */}
                <tr
                  onClick={() => handleSummaryRowClick("Sales")}
                  className="hover:bg-[#f8fafc] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-5 font-medium text-slate-800 border-r border-slate-200/80 group-hover:text-[#1d4ed8]">
                    Sales
                  </td>
                  <td className="py-3 px-5 text-slate-700 font-normal border-r border-slate-200/80">
                    VAT on Sales (5.00%)
                  </td>
                  <td className="py-3 px-5 text-right border-r border-slate-200/80">
                    {renderTaxValue(data?.summary.find((s) => s.taxName.includes("VAT on Sales"))?.taxableAmount, true)}
                  </td>
                  <td className="py-3 px-5 text-right">
                    {renderTaxValue(data?.summary.find((s) => s.taxName.includes("VAT on Sales"))?.taxAmount, true)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          /* DETAILS TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[820px]">
              <thead>
                <tr
                  className="border-b border-[#cbd5e1] text-[11px] font-semibold uppercase tracking-wider text-slate-600"
                  style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #cbd5e1" }}
                >
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
                    <td colSpan={9} className="py-16 text-center text-slate-400 font-normal">
                      No transactions recorded for the selected period.
                    </td>
                  </tr>
                ) : (
                  filteredDetails.map((det) => (
                    <tr
                      key={det.id}
                      onClick={() => handleRowClick(det)}
                      className="hover:bg-[#f8fafc] transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-4 font-mono text-slate-500 border-r border-slate-200/80">
                        {det.date}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200/80">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {det.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-800 border-r border-slate-200/80 group-hover:text-[#1d4ed8] transition-colors">
                        {det.referenceNumber}
                      </td>
                      <td className="py-2.5 px-4 font-normal text-slate-800 border-r border-slate-200/80">
                        {det.contactName}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-normal border-r border-slate-200/80">
                        {det.taxCategory}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-normal text-slate-800 border-r border-slate-200/80 tabular-nums">
                        {det.taxableAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-medium text-[#1d4ed8] border-r border-slate-200/80 tabular-nums">
                        {det.taxAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 border-r border-slate-200/80 tabular-nums">
                        {det.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(det);
                          }}
                          className="px-2 py-0.5 text-[11px] font-medium text-[#1d4ed8] hover:bg-[#eff6ff] rounded border border-[#bfdbfe] transition-all cursor-pointer"
                        >
                          View ↗
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Bar */}
        <div
          className="px-5 py-3 border-t border-[#cbd5e1] text-xs text-slate-600 font-normal flex flex-wrap items-center gap-6"
          style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #cbd5e1" }}
        >
          <span>
            Total Taxable:{" "}
            <span className="text-slate-900 font-semibold font-mono">
              AED {data?.totals.totalTaxableAmount.toFixed(2) || "0.00"}
            </span>
          </span>
          <span>
            Total Tax:{" "}
            <span className="text-[#1d4ed8] font-semibold font-mono">
              AED {data?.totals.totalTaxAmount.toFixed(2) || "0.00"}
            </span>
          </span>
          <span>
            Records:{" "}
            <span className="text-slate-900 font-semibold font-mono">
              {mode === "summary" ? data?.summary.length || 0 : filteredDetails.length}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
