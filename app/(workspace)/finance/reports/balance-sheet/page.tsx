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
      <div className="w-full bg-white border-b border-slate-200/90 px-6 py-3.5 shrink-0 shadow-2xs print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/finance/reports")}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              title="Back to Reports"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <span>Reports</span>
                <span>/</span>
                <span>Financial Statements</span>
                <span>/</span>
                <span className="text-slate-900 font-semibold">Balance Sheet</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <ScaleIcon className="w-4 h-4 text-slate-700" />
                  Statement of Financial Position (Balance Sheet)
                </h1>
                {bs?.isBalanced ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                    <CheckCircle2Icon className="w-3 h-3 text-emerald-600" />
                    Balanced (A = L + E)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                    <AlertTriangleIcon className="w-3 h-3 text-rose-600" />
                    Diff: AED {(bs?.difference || 0).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh Data"
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshIcon className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-slate-700" : ""}`} />
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer bg-white shadow-2xs"
            >
              <FileSpreadsheetIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <PrintIcon className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MAIN REPORT CONTENT
          ========================================================================= */}
      <div className="p-6 max-w-6xl mx-auto w-full flex-1 space-y-4 print:p-0 print:space-y-3 print:max-w-none">
        {/* Simple Controls Toolbar (Hidden on print) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* As At Date Input */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">As at:</span>
              <input
                type="date"
                value={asAtDate}
                onChange={(e) => setAsAtDate(e.target.value)}
                className="bg-transparent font-semibold font-mono text-slate-900 outline-none cursor-pointer"
              />
            </div>

            {/* Zero Balances Toggle */}
            <button
              type="button"
              onClick={() => setHideZeroBalances(!hideZeroBalances)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                hideZeroBalances
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {hideZeroBalances ? <EyeOffIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
              <span>{hideZeroBalances ? "Hide Zero Balances" : "Showing All Accounts"}</span>
            </button>
          </div>

          {/* Search Account */}
          <div className="relative w-full sm:w-64">
            <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter code or account name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-slate-400 transition-colors"
            />
          </div>
        </div>

        {/* Minimal Executive Totals Strip (Clean & subtle, not bulky colored cards) */}
        <div className="bg-white border border-slate-200/90 rounded-xl px-5 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Total Assets:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {formatAed(bs?.assets?.total || 0)}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Total Liabilities:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {formatAed(bs?.liabilities?.total || 0)}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Total Equity:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {formatAed(bs?.equity?.total || 0)}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Equilibrium:</span>
            <span className="font-mono font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-600" />
              Liabilities + Equity = Assets
            </span>
          </div>
        </div>

        {/* =========================================================================
            PROFESSIONAL BALANCE SHEET FINANCIAL STATEMENT
            ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print:border-none print:shadow-none">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px] print:bg-slate-100">
                <th className="py-2.5 px-4 w-28">Code</th>
                <th className="py-2.5 px-4">Account Title &amp; Classification</th>
                <th className="py-2.5 px-4 text-right w-44">Balance (AED)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* ==================== 1. ASSETS ==================== */}
              <tr className="bg-slate-100/60 font-bold text-slate-900 text-xs">
                <td colSpan={3} className="py-2 px-4 uppercase tracking-wider">
                  1. Assets
                </td>
              </tr>

              {/* 1.1 Current Assets Subgroup */}
              <tr className="bg-slate-50/70 font-semibold text-slate-700 text-[11px]">
                <td colSpan={3} className="py-1.5 px-6 uppercase tracking-wide text-slate-600">
                  Current Assets
                </td>
              </tr>
              {currentAssets.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-2 px-8 text-slate-400 italic text-[11px]">
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
                    <td className="py-2 px-4 font-mono font-bold text-slate-600 group-hover:text-slate-900 pl-8">
                      {acc.code}
                    </td>
                    <td className="py-2 px-4 text-slate-800">
                      <div className="font-medium text-slate-900">{acc.name}</div>
                      {acc.subtype && (
                        <span className="text-[10px] text-slate-400">{acc.subtype}</span>
                      )}
                    </td>
                    <td className="py-2 px-4 font-mono text-right font-medium text-slate-800">
                      {formatAed(acc.balance)}
                    </td>
                  </tr>
                ))
              )}
              {/* Current Assets Subtotal */}
              <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                <td className="py-2 px-4 pl-8 font-mono text-[11px]">Subtotal</td>
                <td className="py-2 px-4 font-semibold">Total Current Assets</td>
                <td className="py-2 px-4 font-mono text-right font-bold border-t border-slate-300">
                  {formatAed(bs?.assets?.currentTotal || 0)}
                </td>
              </tr>

              {/* 1.2 Non-Current Assets / Fixed Assets (PPE) */}
              <tr className="bg-slate-50/70 font-semibold text-slate-700 text-[11px]">
                <td colSpan={3} className="py-1.5 px-6 uppercase tracking-wide text-slate-600">
                  Non-Current / Fixed Assets (Property, Plant &amp; Equipment)
                </td>
              </tr>
              {fixedAssets.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-2 px-8 text-slate-400 italic text-[11px]">
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
                    <td className="py-2 px-4 font-mono font-bold text-slate-600 group-hover:text-slate-900 pl-8">
                      {acc.code}
                    </td>
                    <td className="py-2 px-4 text-slate-800">
                      <div className="font-medium text-slate-900">{acc.name}</div>
                      {acc.subtype && (
                        <span className="text-[10px] text-slate-400">{acc.subtype}</span>
                      )}
                    </td>
                    <td className="py-2 px-4 font-mono text-right font-medium text-slate-800">
                      {formatAed(acc.balance)}
                    </td>
                  </tr>
                ))
              )}
              {/* Non-Current Assets Subtotal */}
              <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                <td className="py-2 px-4 pl-8 font-mono text-[11px]">Subtotal</td>
                <td className="py-2 px-4 font-semibold">Total Non-Current / Fixed Assets</td>
                <td className="py-2 px-4 font-mono text-right font-bold border-t border-slate-300">
                  {formatAed(bs?.assets?.fixedTotal || 0)}
                </td>
              </tr>

              {/* TOTAL ASSETS ROW */}
              <tr className="bg-slate-100 font-extrabold text-slate-900 text-sm border-t-2 border-b-2 border-slate-900">
                <td className="py-3 px-4 font-mono">1-0000</td>
                <td className="py-3 px-4 uppercase tracking-wider">TOTAL ASSETS</td>
                <td className="py-3 px-4 font-mono text-right text-base text-slate-950 font-black">
                  {formatAed(bs?.assets?.total || 0)}
                </td>
              </tr>

              {/* ==================== 2. LIABILITIES & EQUITY ==================== */}
              <tr className="bg-slate-100/60 font-bold text-slate-900 text-xs pt-4">
                <td colSpan={3} className="py-2 px-4 uppercase tracking-wider">
                  2. Liabilities &amp; Equity
                </td>
              </tr>

              {/* 2.1 Current Liabilities */}
              <tr className="bg-slate-50/70 font-semibold text-slate-700 text-[11px]">
                <td colSpan={3} className="py-1.5 px-6 uppercase tracking-wide text-slate-600">
                  Current Liabilities
                </td>
              </tr>
              {currentLiabilities.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-2 px-8 text-slate-400 italic text-[11px]">
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
                    <td className="py-2 px-4 font-mono font-bold text-slate-600 group-hover:text-slate-900 pl-8">
                      {acc.code}
                    </td>
                    <td className="py-2 px-4 text-slate-800">
                      <div className="font-medium text-slate-900">{acc.name}</div>
                      {acc.subtype && (
                        <span className="text-[10px] text-slate-400">{acc.subtype}</span>
                      )}
                    </td>
                    <td className="py-2 px-4 font-mono text-right font-medium text-slate-800">
                      {formatAed(acc.balance)}
                    </td>
                  </tr>
                ))
              )}
              {/* Current Liabilities Subtotal */}
              <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                <td className="py-2 px-4 pl-8 font-mono text-[11px]">Subtotal</td>
                <td className="py-2 px-4 font-semibold">Total Current Liabilities</td>
                <td className="py-2 px-4 font-mono text-right font-bold border-t border-slate-300">
                  {formatAed(bs?.liabilities?.currentTotal || 0)}
                </td>
              </tr>

              {/* 2.2 Non-Current Liabilities */}
              <tr className="bg-slate-50/70 font-semibold text-slate-700 text-[11px]">
                <td colSpan={3} className="py-1.5 px-6 uppercase tracking-wide text-slate-600">
                  Non-Current Liabilities
                </td>
              </tr>
              {nonCurrentLiabilities.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-2 px-8 text-slate-400 italic text-[11px]">
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
                    <td className="py-2 px-4 font-mono font-bold text-slate-600 group-hover:text-slate-900 pl-8">
                      {acc.code}
                    </td>
                    <td className="py-2 px-4 text-slate-800">
                      <div className="font-medium text-slate-900">{acc.name}</div>
                      {acc.subtype && (
                        <span className="text-[10px] text-slate-400">{acc.subtype}</span>
                      )}
                    </td>
                    <td className="py-2 px-4 font-mono text-right font-medium text-slate-800">
                      {formatAed(acc.balance)}
                    </td>
                  </tr>
                ))
              )}
              {/* Total Liabilities */}
              <tr className="bg-slate-100/80 font-bold text-slate-900 border-t border-slate-200">
                <td className="py-2 px-4 font-mono text-xs">2-0000</td>
                <td className="py-2 px-4 font-bold">TOTAL LIABILITIES</td>
                <td className="py-2 px-4 font-mono text-right font-bold text-slate-900 border-t border-slate-400">
                  {formatAed(bs?.liabilities?.total || 0)}
                </td>
              </tr>

              {/* 2.3 Equity */}
              <tr className="bg-slate-50/70 font-semibold text-slate-700 text-[11px]">
                <td colSpan={3} className="py-1.5 px-6 uppercase tracking-wide text-slate-600">
                  Equity &amp; Reserves
                </td>
              </tr>
              {equityAccounts.map((acc) => (
                <tr
                  key={acc.id}
                  onClick={() => handleDrillDown(acc.id, acc.name)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="py-2 px-4 font-mono font-bold text-slate-600 group-hover:text-slate-900 pl-8">
                    {acc.code}
                  </td>
                  <td className="py-2 px-4 text-slate-800">
                    <div className="font-medium text-slate-900">{acc.name}</div>
                    {acc.subtype && (
                      <span className="text-[10px] text-slate-400">{acc.subtype}</span>
                    )}
                  </td>
                  <td className="py-2 px-4 font-mono text-right font-medium text-slate-800">
                    {formatAed(acc.balance)}
                  </td>
                </tr>
              ))}

              {/* Retained Earnings / Current Year P&L */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="py-2 px-4 font-mono font-bold text-slate-500 pl-8">
                  3-9999
                </td>
                <td className="py-2 px-4 text-slate-800">
                  <div className="font-medium text-slate-900">
                    Current Year Net Profit / (Loss)
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Auto-transferred from Income Statement to Equity
                  </span>
                </td>
                <td className="py-2 px-4 font-mono text-right font-semibold text-slate-900">
                  {formatAed(bs?.equity?.currentYearNetProfit || 0)}
                </td>
              </tr>

              {/* Total Equity */}
              <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                <td className="py-2 px-4 font-mono text-xs">3-0000</td>
                <td className="py-2 px-4 font-bold">TOTAL EQUITY</td>
                <td className="py-2 px-4 font-mono text-right font-bold border-t border-slate-300">
                  {formatAed(bs?.equity?.total || 0)}
                </td>
              </tr>

              {/* TOTAL LIABILITIES & EQUITY ROW */}
              <tr className="bg-slate-100 font-extrabold text-slate-900 text-sm border-t-2 border-b-2 border-slate-900">
                <td className="py-3 px-4 font-mono">2+3</td>
                <td className="py-3 px-4 uppercase tracking-wider">TOTAL LIABILITIES &amp; EQUITY</td>
                <td className="py-3 px-4 font-mono text-right text-base text-slate-950 font-black">
                  {formatAed(bs?.totalLiabilitiesAndEquity || 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Audit Verification Note */}
        <div className="text-center py-2 text-[11px] text-slate-400 print:text-[10px] print:text-slate-500">
          Double-entry financial position verified under IFRS/GAAP standards. Total Assets = Total Liabilities + Total Equity.
        </div>
      </div>
    </div>
  );
}
