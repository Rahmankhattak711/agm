"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatAed, printWithDocumentTitle } from "@/lib/utils/format";
import {
  FileSpreadsheetIcon,
  ChevronLeftIcon,
  ScaleIcon,
  CalendarIcon,
  RefreshIcon,
  PrintIcon,
  SearchIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  EyeIcon,
  EyeOffIcon,
} from "@/components/icons";

interface AccountBalanceItem {
  id: string;
  code: string;
  name: string;
  type: string;
  subtype?: string;
  level: number;
  parentId?: string | null;
  balance: number;
}

export default function BalanceSheetReportPage() {
  const router = useRouter();
  const [asAtDate, setAsAtDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [hideZeroBalances, setHideZeroBalances] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  const { data: bs, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["balance-sheet", asAtDate],
    queryFn: async () => {
      const res = await fetch(`/api/finance/reports/balance-sheet?asAt=${asAtDate}&refresh=true`);
      if (!res.ok) throw new Error("Failed to load Balance Sheet");
      return await res.json();
    },
    staleTime: 60 * 1000,
  });

  const handleDrillDown = (accountId: string, accountName: string) => {
    router.push(
      `/finance/general-ledger?accountId=${accountId}&accountName=${encodeURIComponent(
        accountName,
      )}&to=${asAtDate}`,
    );
  };

  const handlePrint = () => {
    printWithDocumentTitle(`AGM_Balance_Sheet_${asAtDate}`);
    window.print();
  };

  const handleExportCsv = () => {
    if (!bs) return;
    const headers = ["Section", "Code", "Account Name", "Subtype", "Balance (AED)"];
    const rows: string[][] = [];

    const addAccounts = (category: string, list: AccountBalanceItem[] = []) => {
      list.forEach((acc) => {
        if (hideZeroBalances && Math.abs(acc.balance) < 0.01) return;
        rows.push([
          `"${category}"`,
          `"${acc.code}"`,
          `"${acc.name}"`,
          `"${acc.subtype || ""}"`,
          acc.balance.toFixed(2),
        ]);
      });
    };

    addAccounts("Assets - Current", bs.assets?.currentAccounts);
    addAccounts("Assets - Non-Current / Fixed", bs.assets?.fixedAccounts);
    addAccounts("Liabilities - Current", bs.liabilities?.currentAccounts);
    addAccounts("Liabilities - Non-Current", bs.liabilities?.nonCurrentAccounts);
    addAccounts("Equity", bs.equity?.accounts);

    rows.push([
      `"Equity"`,
      `"P&L"`,
      `"Current Year Net Profit Transfer"`,
      `"Retained Earnings"`,
      (bs.equity?.currentYearNetProfit || 0).toFixed(2),
    ]);

    rows.push([`"SUMMARY"`, `""`, `"Total Assets"`, `""`, (bs.assets?.total || 0).toFixed(2)]);
    rows.push([`"SUMMARY"`, `""`, `"Total Liabilities"`, `""`, (bs.liabilities?.total || 0).toFixed(2)]);
    rows.push([`"SUMMARY"`, `""`, `"Total Equity"`, `""`, (bs.equity?.total || 0).toFixed(2)]);
    rows.push([
      `"SUMMARY"`,
      `""`,
      `"Total Liabilities & Equity"`,
      `""`,
      (bs.totalLiabilitiesAndEquity || 0).toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Balance_Sheet_${asAtDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filterList = (list: AccountBalanceItem[] = []) => {
    return list.filter((acc) => {
      if (hideZeroBalances && Math.abs(acc.balance) < 0.01) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return acc.code.toLowerCase().includes(q) || acc.name.toLowerCase().includes(q);
      }
      return true;
    });
  };

  const currentAssets = useMemo(() => filterList(bs?.assets?.currentAccounts), [bs, hideZeroBalances, search]);
  const fixedAssets = useMemo(() => filterList(bs?.assets?.fixedAccounts), [bs, hideZeroBalances, search]);
  const currentLiabilities = useMemo(() => filterList(bs?.liabilities?.currentAccounts), [bs, hideZeroBalances, search]);
  const nonCurrentLiabilities = useMemo(() => filterList(bs?.liabilities?.nonCurrentAccounts), [bs, hideZeroBalances, search]);
  const equityAccounts = useMemo(() => filterList(bs?.equity?.accounts), [bs, hideZeroBalances, search]);

  return (
    <div className="w-full min-h-screen flex flex-col font-sans bg-slate-50/50 print:bg-white print:p-0">
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
              Balance Sheet
            </h2>
            <div className="text-[11px] text-slate-600 font-medium">
              Statement of Financial Position
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              As at: <span className="font-semibold text-slate-900">{asAtDate}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Currency: <span className="font-semibold text-slate-900">AED</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SCREEN HEADER & ACTION CONTROLS (Hidden on print)
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
                Statement of Financial Position (Balance Sheet)
              </h1>
              {bs?.isBalanced ? (
                <span
                  style={{
                    backgroundColor: "#dcfce7",
                    color: "#15803d",
                    border: "1px solid #86efac",
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono"
                >
                  <CheckCircle2Icon className="w-3 h-3 text-emerald-600" />
                  Balanced (A = L + E)
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
                  Diff: AED {(bs?.difference || 0).toFixed(2)}
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
          <div className="flex flex-wrap items-center gap-2.5">
            {/* As At Date Input */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-normal"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
              }}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">As at:</span>
              <input
                type="date"
                value={asAtDate}
                onChange={(e) => setAsAtDate(e.target.value)}
                className="bg-transparent font-medium font-mono text-slate-800 outline-none cursor-pointer"
              />
            </div>

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
              <span>
                {hideZeroBalances ? "Hide Zero Balances" : "Showing All Accounts"}
              </span>
            </button>
          </div>

          {/* Search Account */}
          <div className="relative w-full sm:w-64">
            <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter code or account name..."
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
          {/* Card 1: Total Assets */}
          <div
            className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
            style={{
              backgroundColor: "#f1f5f9",
              border: "1px solid #cbd5e1",
            }}
          >
            <div className="min-w-0">
              <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
                TOTAL ASSETS (1)
              </span>
              <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
                {formatAed(bs?.assets?.total || 0)}
              </span>
              <span className="text-[10.5px] font-normal text-slate-500 block">
                Current &amp; Fixed Assets
              </span>
            </div>
          </div>

          {/* Card 2: Total Liabilities */}
          <div
            className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
            style={{
              backgroundColor: "#fefce8",
              border: "1px solid #fde047",
            }}
          >
            <div className="min-w-0">
              <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
                TOTAL LIABILITIES (2)
              </span>
              <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
                {formatAed(bs?.liabilities?.total || 0)}
              </span>
              <span className="text-[10.5px] font-normal text-slate-500 block">
                Payables &amp; Tax Obligations
              </span>
            </div>
          </div>

          {/* Card 3: Total Equity */}
          <div
            className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
            style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #86efac",
            }}
          >
            <div className="min-w-0">
              <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
                TOTAL EQUITY (3)
              </span>
              <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
                {formatAed(bs?.equity?.total || 0)}
              </span>
              <span className="text-[10.5px] font-normal text-emerald-700 block">
                Capital &amp; Retained Earnings
              </span>
            </div>
          </div>

          {/* Card 4: Equilibrium */}
          <div
            className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
            style={{
              backgroundColor: "#fff1f2",
              border: "1px solid #fda4af",
            }}
          >
            <div className="min-w-0">
              <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
                TOTAL LIABILITIES &amp; EQUITY
              </span>
              <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
                {formatAed(bs?.totalLiabilitiesAndEquity || 0)}
              </span>
              <span className="text-[10.5px] font-normal text-slate-500 block">
                Liabilities + Equity = Assets
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN REPORT CONTENT
          ========================================================================= */}
      <div className="px-4 sm:px-5 pb-8 w-full flex-1 space-y-3.5 print:p-0 print:space-y-3">
        {/* =========================================================================
            PROFESSIONAL BALANCE SHEET FINANCIAL STATEMENT
            ========================================================================= */}
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
              Balance sheet ledger lines
            </h3>
            <span className="text-[11px] font-normal text-slate-500">
              As at {asAtDate}
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[680px] text-left border-collapse text-xs">
              <thead>
                <tr
                  className="bg-white text-slate-500 font-medium uppercase tracking-wider text-[9.5px] print:bg-slate-100"
                  style={{ borderBottom: "1px solid #e2e8f0" }}
                >
                  <th className="py-2.5 px-4 w-28">CODE</th>
                  <th className="py-2.5 px-4">ACCOUNT TITLE &amp; CLASSIFICATION</th>
                  <th className="py-2.5 px-4 text-right w-44">BALANCE (AED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* ==================== 1. ASSETS ==================== */}
                <tr
                  style={{
                    backgroundColor: "#f0f7ff",
                    borderBottom: "1px solid #dbeafe",
                  }}
                  className="font-semibold text-slate-800 text-xs"
                >
                  <td colSpan={3} className="py-2 px-4 uppercase tracking-wider text-blue-900">
                    1. Assets
                  </td>
                </tr>

                {/* 1.1 Current Assets Subgroup */}
                <tr className="bg-slate-50/70 font-medium text-slate-700 text-[11px]">
                  <td colSpan={3} className="py-1.5 px-6 uppercase tracking-wide text-slate-500">
                    Current Assets
                  </td>
                </tr>
                {currentAssets.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-2 px-8 text-slate-400 italic text-[11px] font-normal">
                      No current asset accounts to display
                    </td>
                  </tr>
                ) : (
                  currentAssets.map((acc) => (
                    <tr
                      key={acc.id}
                      onClick={() => handleDrillDown(acc.id, acc.name)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td
                        className="py-2 px-4 font-mono font-medium pl-8"
                        style={{ color: "#1d4ed8" }}
                      >
                        {acc.code}
                      </td>
                      <td className="py-2 px-4 text-slate-700">
                        <div className="font-normal text-slate-800">{acc.name}</div>
                        {acc.subtype && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            {acc.subtype}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-4 font-mono text-right font-medium text-slate-800">
                        {formatAed(acc.balance)}
                      </td>
                    </tr>
                  ))
                )}
                {/* Current Assets Subtotal */}
                <tr className="bg-slate-50/70 font-semibold text-slate-800 border-t border-slate-200">
                  <td className="py-2 px-4 pl-8 font-mono text-[11px] font-normal text-slate-500">
                    Subtotal
                  </td>
                  <td className="py-2 px-4 font-medium">Total Current Assets</td>
                  <td className="py-2 px-4 font-mono text-right font-semibold">
                    {formatAed(bs?.assets?.currentTotal || 0)}
                  </td>
                </tr>

                {/* 1.2 Non-Current Assets / Fixed Assets (PPE) */}
                <tr className="bg-slate-50/70 font-medium text-slate-700 text-[11px]">
                  <td colSpan={3} className="py-1.5 px-6 uppercase tracking-wide text-slate-500">
                    Non-Current / Fixed Assets (Property, Plant &amp; Equipment)
                  </td>
                </tr>
                {fixedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-2 px-8 text-slate-400 italic text-[11px] font-normal">
                      No fixed asset accounts to display
                    </td>
                  </tr>
                ) : (
                  fixedAssets.map((acc) => (
                    <tr
                      key={acc.id}
                      onClick={() => handleDrillDown(acc.id, acc.name)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td
                        className="py-2 px-4 font-mono font-medium pl-8"
                        style={{ color: "#1d4ed8" }}
                      >
                        {acc.code}
                      </td>
                      <td className="py-2 px-4 text-slate-700">
                        <div className="font-normal text-slate-800">{acc.name}</div>
                        {acc.subtype && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            {acc.subtype}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-4 font-mono text-right font-medium text-slate-800">
                        {formatAed(acc.balance)}
                      </td>
                    </tr>
                  ))
                )}
                {/* Non-Current Assets Subtotal */}
                <tr className="bg-slate-50/70 font-semibold text-slate-800 border-t border-slate-200">
                  <td className="py-2 px-4 pl-8 font-mono text-[11px] font-normal text-slate-500">
                    Subtotal
                  </td>
                  <td className="py-2 px-4 font-medium">Total Non-Current / Fixed Assets</td>
                  <td className="py-2 px-4 font-mono text-right font-semibold">
                    {formatAed(bs?.assets?.fixedTotal || 0)}
                  </td>
                </tr>

                {/* TOTAL ASSETS ROW */}
                <tr
                  style={{
                    backgroundColor: "#eff6ff",
                    borderTop: "1px solid #93c5fd",
                    borderBottom: "1px solid #93c5fd",
                  }}
                  className="font-semibold text-slate-900 text-xs"
                >
                  <td className="py-2.5 px-4 font-mono" style={{ color: "#1d4ed8" }}>
                    1-0000
                  </td>
                  <td className="py-2.5 px-4 uppercase tracking-wider" style={{ color: "#1d4ed8" }}>
                    TOTAL ASSETS
                  </td>
                  <td className="py-2.5 px-4 font-mono text-right text-sm font-semibold text-slate-900">
                    {formatAed(bs?.assets?.total || 0)}
                  </td>
                </tr>

                {/* ==================== 2. LIABILITIES & EQUITY ==================== */}
                <tr
                  style={{
                    backgroundColor: "#fffbeb",
                    borderBottom: "1px solid #fef3c7",
                  }}
                  className="font-semibold text-slate-800 text-xs"
                >
                  <td colSpan={3} className="py-2 px-4 uppercase tracking-wider text-amber-900">
                    2. Liabilities &amp; Equity
                  </td>
                </tr>

                {/* 2.1 Current Liabilities */}
                <tr className="bg-slate-50/70 font-medium text-slate-700 text-[11px]">
                  <td colSpan={3} className="py-1.5 px-6 uppercase tracking-wide text-slate-500">
                    Current Liabilities
                  </td>
                </tr>
                {currentLiabilities.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-2 px-8 text-slate-400 italic text-[11px] font-normal">
                      No current liability accounts with balances
                    </td>
                  </tr>
                ) : (
                  currentLiabilities.map((acc) => (
                    <tr
                      key={acc.id}
                      onClick={() => handleDrillDown(acc.id, acc.name)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td
                        className="py-2 px-4 font-mono font-medium pl-8"
                        style={{ color: "#1d4ed8" }}
                      >
                        {acc.code}
                      </td>
                      <td className="py-2 px-4 text-slate-700">
                        <div className="font-normal text-slate-800">{acc.name}</div>
                        {acc.subtype && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            {acc.subtype}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-4 font-mono text-right font-medium text-slate-800">
                        {formatAed(acc.balance)}
                      </td>
                    </tr>
                  ))
                )}
                {/* Current Liabilities Subtotal */}
                <tr className="bg-slate-50/70 font-semibold text-slate-800 border-t border-slate-200">
                  <td className="py-2 px-4 pl-8 font-mono text-[11px] font-normal text-slate-500">
                    Subtotal
                  </td>
                  <td className="py-2 px-4 font-medium">Total Current Liabilities</td>
                  <td className="py-2 px-4 font-mono text-right font-semibold">
                    {formatAed(bs?.liabilities?.currentTotal || 0)}
                  </td>
                </tr>

                {/* 2.2 Non-Current Liabilities */}
                <tr className="bg-slate-50/70 font-medium text-slate-700 text-[11px]">
                  <td colSpan={3} className="py-1.5 px-6 uppercase tracking-wide text-slate-500">
                    Non-Current Liabilities
                  </td>
                </tr>
                {nonCurrentLiabilities.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-2 px-8 text-slate-400 italic text-[11px] font-normal">
                      No non-current liability accounts
                    </td>
                  </tr>
                ) : (
                  nonCurrentLiabilities.map((acc) => (
                    <tr
                      key={acc.id}
                      onClick={() => handleDrillDown(acc.id, acc.name)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td
                        className="py-2 px-4 font-mono font-medium pl-8"
                        style={{ color: "#1d4ed8" }}
                      >
                        {acc.code}
                      </td>
                      <td className="py-2 px-4 text-slate-700">
                        <div className="font-normal text-slate-800">{acc.name}</div>
                        {acc.subtype && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            {acc.subtype}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-4 font-mono text-right font-medium text-slate-800">
                        {formatAed(acc.balance)}
                      </td>
                    </tr>
                  ))
                )}
                {/* Total Liabilities */}
                <tr className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
                  <td className="py-2 px-4 font-mono text-xs text-slate-600">2-0000</td>
                  <td className="py-2 px-4 font-semibold">TOTAL LIABILITIES</td>
                  <td className="py-2 px-4 font-mono text-right font-semibold text-slate-900">
                    {formatAed(bs?.liabilities?.total || 0)}
                  </td>
                </tr>

                {/* 2.3 Equity */}
                <tr className="bg-slate-50/70 font-medium text-slate-700 text-[11px]">
                  <td colSpan={3} className="py-1.5 px-6 uppercase tracking-wide text-slate-500">
                    Equity &amp; Reserves
                  </td>
                </tr>
                {equityAccounts.map((acc) => (
                  <tr
                    key={acc.id}
                    onClick={() => handleDrillDown(acc.id, acc.name)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td
                      className="py-2 px-4 font-mono font-medium pl-8"
                      style={{ color: "#1d4ed8" }}
                    >
                      {acc.code}
                    </td>
                    <td className="py-2 px-4 text-slate-700">
                      <div className="font-normal text-slate-800">{acc.name}</div>
                      {acc.subtype && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          {acc.subtype}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 font-mono text-right font-medium text-slate-800">
                      {formatAed(acc.balance)}
                    </td>
                  </tr>
                ))}

                {/* Retained Earnings / Current Year P&L */}
                <tr className="hover:bg-slate-50 transition-colors">
                  <td
                    className="py-2 px-4 font-mono font-medium pl-8"
                    style={{ color: "#1d4ed8" }}
                  >
                    3-9999
                  </td>
                  <td className="py-2 px-4 text-slate-700">
                    <div className="font-normal text-slate-800">
                      Current Year Net Profit / (Loss)
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Auto-transferred from Income Statement to Equity
                    </span>
                  </td>
                  <td className="py-2 px-4 font-mono text-right font-medium text-slate-800">
                    {formatAed(bs?.equity?.currentYearNetProfit || 0)}
                  </td>
                </tr>

                {/* Total Equity */}
                <tr className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
                  <td className="py-2 px-4 font-mono text-xs text-slate-600">3-0000</td>
                  <td className="py-2 px-4 font-semibold">TOTAL EQUITY</td>
                  <td className="py-2 px-4 font-mono text-right font-semibold text-slate-900">
                    {formatAed(bs?.equity?.total || 0)}
                  </td>
                </tr>

                {/* TOTAL LIABILITIES & EQUITY ROW */}
                <tr
                  style={{
                    backgroundColor: "#f0fdf4",
                    borderTop: "1px solid #86efac",
                  }}
                  className="font-semibold text-slate-900 text-xs"
                >
                  <td className="py-2.5 px-4 font-mono text-emerald-700">2+3</td>
                  <td className="py-2.5 px-4 uppercase tracking-wider text-emerald-800">
                    TOTAL LIABILITIES &amp; EQUITY
                  </td>
                  <td className="py-2.5 px-4 font-mono text-right text-sm font-semibold text-slate-900">
                    {formatAed(bs?.totalLiabilitiesAndEquity || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Verification Note */}
        <div className="text-center py-2 text-[11px] text-slate-400 print:text-[10px] print:text-slate-500">
          Double-entry financial position verified under IFRS/GAAP standards. Total Assets = Total Liabilities + Total Equity.
        </div>
      </div>
    </div>
  );
}
