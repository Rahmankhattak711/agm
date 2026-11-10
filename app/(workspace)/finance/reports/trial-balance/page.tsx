"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronLeftIcon,
  SearchIcon,
  PrintIcon,
  CalendarIcon,
  RefreshIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  FileSpreadsheetIcon,
  ScaleIcon,
  EyeIcon,
  EyeOffIcon,
} from "@/components/icons";
import { formatAed, printWithDocumentTitle } from "@/lib/utils/format";

interface TrialBalanceRow {
  id: string;
  code: string;
  name: string;
  subtype: string;
  type: string;
  level: number;
  parentId: string | null;
  hasChildren: boolean;
  openingDebit: number;
  openingCredit: number;
  movementDebit: number;
  movementCredit: number;
  closingDebit: number;
  closingCredit: number;
  revaluedClosingDebit: number;
  revaluedClosingCredit: number;
  hasDirectActivity?: boolean;
}

export default function TrialBalancePage() {
  const router = useRouter();

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [fromDate, setFromDate] = useState("2026-01-01");
  const [toDate, setToDate] = useState(todayStr);

  const [hideZeroBalances, setHideZeroBalances] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Fetch Live Trial Balance from CQRS API
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["trial-balance-report", fromDate, toDate],
    queryFn: async () => {
      const res = await fetch(
        `/api/finance/reports/trial-balance?from=${fromDate}&to=${toDate}`,
      );
      if (!res.ok) throw new Error("Failed to load trial balance");
      return await res.json();
    },
    staleTime: 60 * 1000,
  });

  const rawRows: TrialBalanceRow[] = useMemo(() => data?.rows || [], [data]);

  // Filter rows according to user's criteria
  const displayedRows = useMemo(() => {
    return rawRows.filter((r) => {
      // Zero balance check (both movement and closing must be 0)
      if (hideZeroBalances) {
        const isZero =
          Math.abs(r.movementDebit) < 0.01 &&
          Math.abs(r.movementCredit) < 0.01 &&
          Math.abs(r.closingDebit) < 0.01 &&
          Math.abs(r.closingCredit) < 0.01;
        if (isZero) return false;
      }

      // Type filter
      if (selectedType !== "ALL") {
        const matchType =
          selectedType === "INCOME"
            ? r.type === "REVENUE" || r.type === "INCOME"
            : r.type === selectedType;
        if (!matchType) return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          r.code.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          (r.subtype && r.subtype.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [rawRows, hideZeroBalances, selectedType, search]);

  // Navigate to General Ledger on row click
  const handleDrillDown = (row: TrialBalanceRow) => {
    router.push(
      `/finance/general-ledger?accountId=${row.id}&accountName=${encodeURIComponent(
        row.name,
      )}&from=${fromDate}&to=${toDate}`,
    );
  };

  // Print Handler
  const handlePrint = () => {
    printWithDocumentTitle(`AGM_Trial_Balance_${fromDate}_to_${toDate}`);
    window.print();
  };

  // CSV Export Handler
  const handleExportCsv = () => {
    if (!displayedRows || displayedRows.length === 0) return;
    const headers = [
      "Account Name",
      "Account Code",
      "Account Type",
      "Total Debit (AED)",
      "Total Credit (AED)",
      "TB Debit (AED)",
      "TB Credit (AED)",
    ];

    const csvRows = displayedRows.map((r) => [
      `"${r.name}"`,
      `"${r.code}"`,
      `"${formatAccountType(r.type)}"`,
      r.movementDebit.toFixed(2),
      r.movementCredit.toFixed(2),
      r.closingDebit.toFixed(2),
      r.closingCredit.toFixed(2),
    ]);

    if (data?.totals) {
      csvRows.push([
        `"TOTAL"`,
        `""`,
        `""`,
        (data.totals.movementDebit || 0).toFixed(2),
        (data.totals.movementCredit || 0).toFixed(2),
        (data.totals.closingDebit || 0).toFixed(2),
        (data.totals.closingCredit || 0).toFixed(2),
      ]);
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Trial_Balance_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clean Account Type Formatter matching user's Excel
  function formatAccountType(type: string): string {
    switch (type?.toUpperCase()) {
      case "ASSET":
        return "Asset";
      case "LIABILITY":
        return "Liability";
      case "EQUITY":
        return "Equity";
      case "REVENUE":
      case "INCOME":
        return "Income";
      case "EXPENSE":
        return "Expense";
      default:
        return type || "Other";
    }
  }

  // Type Badge Colors
  function getTypeBadgeClass(type: string): string {
    switch (type?.toUpperCase()) {
      case "ASSET":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "LIABILITY":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "EQUITY":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "REVENUE":
      case "INCOME":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "EXPENSE":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  }

  const isBalanced = data?.totals?.isBalanced ?? true;
  const difference = data?.totals?.difference ?? 0;

  return (
    <div className="w-full min-h-screen flex flex-col font-sans bg-slate-50/50 print:bg-white print:p-0 text-slate-900">
      {/* =========================================================================
          OFFICIAL PRINT / PDF CORPORATE HEADER (Visible ONLY on print)
          ========================================================================= */}
      <div className="hidden print:block px-8 pt-6 pb-4 border-b border-slate-300">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/assets/logo.png"
              alt="AGM Aesthetic House Logo"
              width={140}
              height={70}
              priority
              className="object-contain"
            />
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                A G M FITOUT TECHNICAL SERVICES L.L.C
              </h1>
              <div className="text-[10px] leading-tight text-slate-600 mt-0.5">
                Sheikh Zayed Road, near Oasis Centre, Office No. 13-11<br />
                Building: Adel Mohammed Ali Jassim Al Marzouqi, Al Quoz First 1, Dubai, UAE<br />
                Tel: +971 48 749839 | Mob: +971 50 340 7300 | TRN: 10043245234522
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Trial Balance Sheet
            </h2>
            <div className="text-[11px] text-slate-600 font-medium">
              ميزان المراجعة
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Period: <span className="font-semibold text-slate-900">{fromDate} to {toDate}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Currency: <span className="font-semibold text-slate-900">AED</span> | Status:{" "}
              <span className="font-semibold text-slate-900">
                {isBalanced ? "100% Balanced" : "Discrepancy Detected"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SCREEN HEADER & ACTION CONTROLS (Clean & Minimalist, Hidden on print)
          ========================================================================= */}
      <div className="w-full bg-white text-slate-700 font-sans px-4 sm:px-5 py-3.5 space-y-3.5 print:hidden">
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

            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-[17px] font-semibold tracking-tight text-slate-800">
                Trial Balance
              </h1>
              {isBalanced ? (
                <span
                  style={{
                    backgroundColor: "#dcfce7",
                    color: "#15803d",
                    border: "1px solid #86efac",
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono"
                >
                  <CheckCircle2Icon className="w-3 h-3 text-emerald-600" />
                  Balanced (0.00 AED)
                </span>
              ) : (
                <span
                  style={{
                    backgroundColor: "#fff1f2",
                    color: "#be123c",
                    border: "1px solid #fda4af",
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono"
                >
                  <AlertTriangleIcon className="w-3 h-3 text-rose-600" />
                  Diff: AED {difference.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh Data"
              style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
              className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshIcon className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-blue-600" : ""}`} />
            </button>

            <button
              onClick={handleExportCsv}
              style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
              className="px-3 py-1.5 text-[11.5px] font-medium rounded-lg hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheetIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV Report</span>
            </button>

            <button
              onClick={handlePrint}
              style={{
                backgroundColor: "#1d4ed8",
                color: "#ffffff",
                border: "1px solid #1e40af",
              }}
              className="px-3.5 py-1.5 text-[11.5px] font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PrintIcon className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Soft Light-Blue Filter Bar */}
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
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent font-medium font-mono text-slate-800 outline-none cursor-pointer"
              />
              <span className="text-slate-400 mx-1">→</span>
              <span className="text-slate-500">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent font-medium font-mono text-slate-800 outline-none cursor-pointer"
              />
            </div>

            {/* Account Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
              }}
              className="rounded-lg px-3 py-1.5 text-xs font-normal text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">All Account Types</option>
              <option value="ASSET">Assets</option>
              <option value="LIABILITY">Liabilities</option>
              <option value="EQUITY">Equity</option>
              <option value="INCOME">Income / Revenue</option>
              <option value="EXPENSE">Expenses</option>
            </select>

            {/* Zero Balances Toggle */}
            <button
              type="button"
              onClick={() => setHideZeroBalances(!hideZeroBalances)}
              style={
                hideZeroBalances
                  ? {
                      backgroundColor: "#1d4ed8",
                      color: "#ffffff",
                      border: "1px solid #1e40af",
                    }
                  : {
                      backgroundColor: "#ffffff",
                      color: "#475569",
                      border: "1px solid #cbd5e1",
                    }
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer"
            >
              {hideZeroBalances ? (
                <EyeOffIcon className="w-3.5 h-3.5" />
              ) : (
                <EyeIcon className="w-3.5 h-3.5" />
              )}
              <span>{hideZeroBalances ? "Hide Zero Balances" : "Showing All"}</span>
            </button>
          </div>

          {/* Quick Search Box */}
          <div className="relative w-full sm:w-64">
            <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search account name or code..."
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
              }}
              className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs font-normal text-slate-700 placeholder-slate-400 outline-none focus:border-blue-600 transition-colors"
            />
          </div>
        </div>

        {/* 4 Pastel KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Movement Debit */}
          <div
            className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
            style={{
              backgroundColor: "#f1f5f9",
              border: "1px solid #cbd5e1",
            }}
          >
            <div className="min-w-0">
              <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
                TOTAL DEBIT MOVEMENT
              </span>
              <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
                {formatAed(data?.totals?.movementDebit || 0)}
              </span>
              <span className="text-[10.5px] font-normal text-slate-500 block">
                {displayedRows.length} active accounts
              </span>
            </div>
          </div>

          {/* Card 2: Movement Credit */}
          <div
            className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
            style={{
              backgroundColor: "#fefce8",
              border: "1px solid #fde047",
            }}
          >
            <div className="min-w-0">
              <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
                TOTAL CREDIT MOVEMENT
              </span>
              <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
                {formatAed(data?.totals?.movementCredit || 0)}
              </span>
              <span className="text-[10.5px] font-normal text-slate-500 block">
                Period credit volume
              </span>
            </div>
          </div>

          {/* Card 3: Closing TB Debit */}
          <div
            className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
            style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #86efac",
            }}
          >
            <div className="min-w-0">
              <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
                CLOSING TB DEBIT
              </span>
              <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
                {formatAed(data?.totals?.closingDebit || 0)}
              </span>
              <span className="text-[10.5px] font-normal text-emerald-700 block">
                Net debit balances
              </span>
            </div>
          </div>

          {/* Card 4: Closing TB Credit */}
          <div
            className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
            style={{
              backgroundColor: "#fff1f2",
              border: "1px solid #fda4af",
            }}
          >
            <div className="min-w-0">
              <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
                CLOSING TB CREDIT
              </span>
              <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
                {formatAed(data?.totals?.closingCredit || 0)}
              </span>
              <span className="text-[10.5px] font-normal text-slate-500 block">
                Net credit balances
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TRIAL BALANCE TABLE CARD
          ========================================================================= */}
      <div className="px-4 sm:px-5 pb-8 w-full flex-1 space-y-3.5 print:p-0 print:space-y-3">
        <div
          className="bg-white rounded-xl overflow-hidden print:border-none print:shadow-none"
          style={{ border: "1px solid #cbd5e1" }}
        >
          {/* Soft Light-Blue Top Bar */}
          <div
            className="px-4 py-2.5 flex items-center justify-between print:hidden"
            style={{
              backgroundColor: "#f4f7fb",
              borderBottom: "1px solid #cbd5e1",
            }}
          >
            <h3 className="text-xs font-semibold text-slate-800">
              Trial balance accounts
            </h3>
            <span className="text-[11px] font-normal text-slate-500">
              {displayedRows.length} accounts
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[820px] text-left border-collapse text-xs">
              <thead>
                {/* Group Header Row */}
                <tr
                  className="text-[9.5px] font-semibold uppercase tracking-wider select-none"
                  style={{ borderBottom: "1px solid #cbd5e1" }}
                >
                  <th
                    colSpan={2}
                    className="py-2 px-4 text-slate-600"
                    style={{ backgroundColor: "#f8fafc" }}
                  >
                    Ledger Account Details
                  </th>
                  <th
                    colSpan={2}
                    className="py-2 px-4 text-center text-slate-700"
                    style={{
                      backgroundColor: "#f1f5f9",
                      borderLeft: "1px solid #cbd5e1",
                    }}
                  >
                    Period Movements (Dr / Cr)
                  </th>
                  <th
                    colSpan={2}
                    className="py-2 px-4 text-center text-emerald-900"
                    style={{
                      backgroundColor: "#ecfdf5",
                      borderLeft: "1.5px solid #94a3b8",
                    }}
                  >
                    Closing Trial Balance (TB)
                  </th>
                </tr>

                {/* Column Header Row */}
                <tr
                  className="font-semibold text-[10px] uppercase tracking-wider print:bg-slate-100"
                  style={{ borderBottom: "1px solid #cbd5e1" }}
                >
                  <th
                    className="py-2.5 px-4 text-slate-600"
                    style={{ backgroundColor: "#ffffff" }}
                  >
                    ACCOUNT NAME
                  </th>
                  <th
                    className="py-2.5 px-3 w-32 text-slate-600"
                    style={{
                      backgroundColor: "#ffffff",
                      borderLeft: "1px solid #e2e8f0",
                    }}
                  >
                    ACCOUNT TYPE
                  </th>
                  <th
                    className="py-2.5 px-4 text-right w-40 text-slate-700 font-semibold"
                    style={{
                      backgroundColor: "#f1f5f9",
                      borderLeft: "1px solid #cbd5e1",
                    }}
                  >
                    TOTAL DEBIT (AED)
                  </th>
                  <th
                    className="py-2.5 px-4 text-right w-40 text-amber-900 font-semibold"
                    style={{
                      backgroundColor: "#fefce8",
                      borderLeft: "1px solid #cbd5e1",
                    }}
                  >
                    TOTAL CREDIT (AED)
                  </th>
                  <th
                    className="py-2.5 px-4 text-right w-40 text-emerald-900 font-semibold"
                    style={{
                      backgroundColor: "#f0fdf4",
                      borderLeft: "2px solid #94a3b8",
                    }}
                  >
                    TB DEBIT (AED)
                  </th>
                  <th
                    className="py-2.5 px-4 text-right w-40 text-rose-900 font-semibold"
                    style={{
                      backgroundColor: "#fff1f2",
                      borderLeft: "1px solid #cbd5e1",
                    }}
                  >
                    TB CREDIT (AED)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 font-normal">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                      Loading trial balance entries...
                    </td>
                  </tr>
                ) : displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                      No accounts found for the selected period and criteria.
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => handleDrillDown(row)}
                      className="hover:brightness-95 transition-all cursor-pointer group"
                    >
                      {/* Account Name & Code */}
                      <td className="py-2.5 px-4 text-slate-800 bg-white">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono text-[11px] font-medium px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                            }}
                          >
                            {row.code}
                          </span>
                          <span className="font-normal text-slate-800 group-hover:text-blue-700 transition-colors">
                            {row.name}
                          </span>
                        </div>
                      </td>

                      {/* Account Type Badge */}
                      <td
                        className="py-2.5 px-3 bg-white"
                        style={{ borderLeft: "1px solid #e2e8f0" }}
                      >
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTypeBadgeClass(
                            row.type
                          )}`}
                        >
                          {formatAccountType(row.type)}
                        </span>
                      </td>

                      {/* Total Debit (Movements) - Visible Soft Slate Tint */}
                      <td
                        className="py-2.5 px-4 font-mono text-right tabular-nums text-slate-700"
                        style={{
                          backgroundColor: "#f8fafc",
                          borderLeft: "1px solid #cbd5e1",
                        }}
                      >
                        {row.movementDebit > 0 ? (
                          <span className="font-normal text-slate-800">
                            {formatAed(row.movementDebit)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">0.00</span>
                        )}
                      </td>

                      {/* Total Credit (Movements) - Visible Soft Warm Amber Tint */}
                      <td
                        className="py-2.5 px-4 font-mono text-right tabular-nums text-slate-700"
                        style={{
                          backgroundColor: "#fffbeb",
                          borderLeft: "1px solid #cbd5e1",
                        }}
                      >
                        {row.movementCredit > 0 ? (
                          <span className="font-normal text-amber-950">
                            {formatAed(row.movementCredit)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">0.00</span>
                        )}
                      </td>

                      {/* TB Debit (Closing Debit) - Visible Soft Mint Green Tint */}
                      <td
                        className="py-2.5 px-4 font-mono text-right tabular-nums font-medium"
                        style={{
                          backgroundColor: "#f0fdf4",
                          borderLeft: "2px solid #94a3b8",
                        }}
                      >
                        {row.closingDebit > 0 ? (
                          <span className="text-emerald-800 font-medium">
                            {formatAed(row.closingDebit)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">0.00</span>
                        )}
                      </td>

                      {/* TB Credit (Closing Credit) - Visible Soft Rose Tint */}
                      <td
                        className="py-2.5 px-4 font-mono text-right tabular-nums font-medium"
                        style={{
                          backgroundColor: "#fff1f2",
                          borderLeft: "1px solid #cbd5e1",
                        }}
                      >
                        {row.closingCredit > 0 ? (
                          <span className="text-rose-800 font-medium">
                            {formatAed(row.closingCredit)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">0.00</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* BOTTOM TOTALS & BALANCE ROW */}
              <tfoot>
                {/* Row 1: Grand Total */}
                <tr
                  style={{
                    borderTop: "1.5px solid #94a3b8",
                  }}
                  className="font-semibold text-slate-800 text-xs"
                >
                  <td
                    className="py-2.5 px-4 uppercase tracking-wider font-semibold"
                    style={{ backgroundColor: "#f8fafc" }}
                  >
                    Total
                  </td>
                  <td
                    className="py-2.5 px-3 text-slate-500 font-mono text-[11px] font-normal"
                    style={{
                      backgroundColor: "#f8fafc",
                      borderLeft: "1px solid #e2e8f0",
                    }}
                  >
                    {displayedRows.length} Accounts
                  </td>
                  <td
                    className="py-2.5 px-4 font-mono text-right text-xs font-semibold text-slate-800"
                    style={{
                      backgroundColor: "#f1f5f9",
                      borderLeft: "1px solid #cbd5e1",
                    }}
                  >
                    {formatAed(data?.totals?.movementDebit || 0)}
                  </td>
                  <td
                    className="py-2.5 px-4 font-mono text-right text-xs font-semibold text-amber-900"
                    style={{
                      backgroundColor: "#fefce8",
                      borderLeft: "1px solid #cbd5e1",
                    }}
                  >
                    {formatAed(data?.totals?.movementCredit || 0)}
                  </td>
                  <td
                    className="py-2.5 px-4 font-mono text-right text-xs font-semibold text-emerald-800"
                    style={{
                      backgroundColor: "#f0fdf4",
                      borderLeft: "2px solid #94a3b8",
                    }}
                  >
                    {formatAed(data?.totals?.closingDebit || 0)}
                  </td>
                  <td
                    className="py-2.5 px-4 font-mono text-right text-xs font-semibold text-rose-800"
                    style={{
                      backgroundColor: "#fff1f2",
                      borderLeft: "1px solid #cbd5e1",
                    }}
                  >
                    {formatAed(data?.totals?.closingCredit || 0)}
                  </td>
                </tr>

                {/* Row 2: Equilibrium Balance Strip */}
                <tr
                  style={{
                    backgroundColor: "#f4f7fb",
                    borderTop: "1px solid #cbd5e1",
                  }}
                  className="text-xs"
                >
                  <td
                    colSpan={4}
                    className="py-2.5 px-4 uppercase tracking-wider text-[10.5px] font-medium text-slate-600"
                  >
                    BALANCE (DOUBLE-ENTRY CHECK)
                  </td>
                  <td
                    colSpan={2}
                    className="py-2.5 px-4 text-right font-mono font-semibold text-xs"
                  >
                    {isBalanced ? (
                      <span className="text-emerald-700 flex items-center justify-end gap-1.5">
                        <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-600" />
                        0.00 AED (Balanced)
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center justify-end gap-1.5">
                        <AlertTriangleIcon className="w-3.5 h-3.5 text-rose-500" />
                        Diff: {formatAed(difference)} AED
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Audit Footnote */}
        <div className="text-center py-2 text-[11px] text-slate-400 print:text-[10px] print:text-slate-500">
          Trial Balance prepared under IFRS &amp; GAAP accrual accounting standards. Total Debits strictly balance Total Credits.
        </div>
      </div>
    </div>
  );
}
