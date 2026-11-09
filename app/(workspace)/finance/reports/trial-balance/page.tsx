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
                <span className="text-slate-900 font-semibold">Trial Balance</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <ScaleIcon className="w-4 h-4 text-slate-700" />
                  Trial Balance
                </h1>
                {isBalanced ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                    <CheckCircle2Icon className="w-3 h-3 text-emerald-600" />
                    Balanced (0.00 AED)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                    <AlertTriangleIcon className="w-3 h-3 text-rose-600" />
                    Diff: AED {difference.toFixed(2)}
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
          CONTROLS TOOLBAR (Clean, single bar without excessive cards)
          ========================================================================= */}
      <div className="p-6 max-w-7xl mx-auto w-full flex-1 space-y-4 print:p-0 print:space-y-3 print:max-w-none">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Range Selectors */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent font-semibold font-mono text-slate-900 outline-none cursor-pointer"
              />
              <span className="text-slate-400 mx-1">→</span>
              <span className="text-slate-500">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent font-semibold font-mono text-slate-900 outline-none cursor-pointer"
              />
            </div>

            {/* Account Type Filter */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 cursor-pointer"
              >
                <option value="ALL">All Account Types</option>
                <option value="ASSET">Assets</option>
                <option value="LIABILITY">Liabilities</option>
                <option value="EQUITY">Equity</option>
                <option value="INCOME">Income / Revenue</option>
                <option value="EXPENSE">Expenses</option>
              </select>
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
              <span>{hideZeroBalances ? "Hide Zero Balances" : "Showing All"}</span>
            </button>
          </div>

          {/* Quick Search Box */}
          <div className="relative w-full sm:w-64">
            <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search account name or code..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-slate-400 transition-colors"
            />
          </div>
        </div>

        {/* =========================================================================
            CLEAN, MODERN EXCEL-STYLE TRIAL BALANCE TABLE
            ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print:border-none print:shadow-none">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1e3a58] text-white font-bold text-xs uppercase tracking-wider print:bg-slate-800 print:text-white">
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-3 w-32">Account Type</th>
                <th className="py-3 px-4 text-right w-44">Total Debit (AED)</th>
                <th className="py-3 px-4 text-right w-44">Total Credit (AED)</th>
                <th className="py-3 px-4 text-right w-44">TB Debit (AED)</th>
                <th className="py-3 px-4 text-right w-44">TB Credit (AED)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs italic">
                    Loading trial balance entries...
                  </td>
                </tr>
              ) : displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs italic">
                    No accounts found for the selected period and criteria.
                  </td>
                </tr>
              ) : (
                displayedRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => handleDrillDown(row)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    {/* Account Name & Code */}
                    <td className="py-2.5 px-4 text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-slate-500 group-hover:text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {row.code}
                        </span>
                        <span className="font-semibold text-slate-900">{row.name}</span>
                      </div>
                    </td>

                    {/* Account Type Badge */}
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getTypeBadgeClass(
                          row.type,
                        )}`}
                      >
                        {formatAccountType(row.type)}
                      </span>
                    </td>

                    {/* Total Debit (Movements) */}
                    <td className="py-2.5 px-4 font-mono text-right tabular-nums text-slate-800">
                      {row.movementDebit > 0 ? (
                        <span className="font-medium">{formatAed(row.movementDebit)}</span>
                      ) : (
                        <span className="text-slate-300">0.00</span>
                      )}
                    </td>

                    {/* Total Credit (Movements) */}
                    <td className="py-2.5 px-4 font-mono text-right tabular-nums text-slate-800">
                      {row.movementCredit > 0 ? (
                        <span className="font-medium">{formatAed(row.movementCredit)}</span>
                      ) : (
                        <span className="text-slate-300">0.00</span>
                      )}
                    </td>

                    {/* TB Debit (Closing Debit) */}
                    <td className="py-2.5 px-4 font-mono text-right tabular-nums font-semibold text-slate-900">
                      {row.closingDebit > 0 ? (
                        <span>{formatAed(row.closingDebit)}</span>
                      ) : (
                        <span className="text-slate-300">0.00</span>
                      )}
                    </td>

                    {/* TB Credit (Closing Credit) */}
                    <td className="py-2.5 px-4 font-mono text-right tabular-nums font-semibold text-slate-900">
                      {row.closingCredit > 0 ? (
                        <span>{formatAed(row.closingCredit)}</span>
                      ) : (
                        <span className="text-slate-300">0.00</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* =========================================================================
                BOTTOM TOTALS & BALANCE ROW (Directly matching user's Excel format)
                ========================================================================= */}
            <tfoot>
              {/* Row 1: Grand Total */}
              <tr className="bg-slate-100 font-extrabold text-slate-900 text-xs border-t-2 border-slate-300">
                <td className="py-3 px-4 uppercase tracking-wider font-bold">Total</td>
                <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                  {displayedRows.length} Accounts
                </td>
                <td className="py-3 px-4 font-mono text-right text-xs font-bold text-slate-900">
                  {formatAed(data?.totals?.movementDebit || 0)}
                </td>
                <td className="py-3 px-4 font-mono text-right text-xs font-bold text-slate-900">
                  {formatAed(data?.totals?.movementCredit || 0)}
                </td>
                <td className="py-3 px-4 font-mono text-right text-xs font-bold text-slate-900">
                  {formatAed(data?.totals?.closingDebit || 0)}
                </td>
                <td className="py-3 px-4 font-mono text-right text-xs font-bold text-slate-900">
                  {formatAed(data?.totals?.closingCredit || 0)}
                </td>
              </tr>

              {/* Row 2: Equilibrium Balance Strip (Matching user's Excel blue bottom row) */}
              <tr className="bg-[#1e3a58] text-white font-extrabold text-xs print:bg-slate-900">
                <td colSpan={4} className="py-2.5 px-4 uppercase tracking-wider text-[11px] font-bold">
                  BALANCE (DOUBLE-ENTRY CHECK)
                </td>
                <td colSpan={2} className="py-2.5 px-4 text-right font-mono font-bold text-sm">
                  {isBalanced ? (
                    <span className="text-emerald-300 flex items-center justify-end gap-1.5">
                      <CheckCircle2Icon className="w-4 h-4 text-emerald-400" />
                      0.00 AED (Balanced)
                    </span>
                  ) : (
                    <span className="text-rose-300 flex items-center justify-end gap-1.5">
                      <AlertTriangleIcon className="w-4 h-4 text-rose-400" />
                      Diff: {formatAed(difference)} AED
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Audit Footnote */}
        <div className="text-center py-2 text-[11px] text-slate-400 print:text-[10px] print:text-slate-500">
          Trial Balance prepared under IFRS &amp; GAAP accrual accounting standards. Total Debits strictly balance Total Credits.
        </div>
      </div>
    </div>
  );
}
