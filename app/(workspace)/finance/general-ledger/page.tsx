"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccounts } from "@/lib/hooks/api-hooks";
import { formatAed } from "@/lib/utils/format";
import {
  Search,
  Download,
  RefreshCw,
  X,
  Lock,
  CheckCircle2,
  BookOpenText,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  Plus,
  Layers,
  Calendar,
} from "lucide-react";
import { JournalDetailsModal } from "../journal-entries/components/JournalDetailsModal";
import { HierarchicalAccountSelect } from "../journal-entries/components/HierarchicalAccountSelect";

const MONTH_NAMES = [
  { value: "ALL", label: "All Months (Full Year)" },
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function GeneralLedgerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlAccountId = searchParams.get("accountId") || "";
  const urlAccountName = searchParams.get("accountName") || "";
  const urlFrom = searchParams.get("from") || "";
  const urlTo = searchParams.get("to") || "";
  const urlJournalId =
    searchParams.get("journalId") ||
    searchParams.get("journal") ||
    searchParams.get("search") ||
    "";

  const { data: accounts = [] } = useAccounts();

  // Year & Month state (Defaults to 2026 Full Year so entries are immediately visible)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [activePreset, setActivePreset] = useState<string>("FULL_YEAR");

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [journalIdFilter, setJournalIdFilter] = useState<string>(urlJournalId);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    urlJournalId ? "" : urlAccountId
  );
  const [selectedRange, setSelectedRange] = useState<[string, string]>([
    urlFrom || "2026-01",
    urlTo || "2026-12",
  ]);
  const [selectedModalEntry, setSelectedModalEntry] = useState<any | null>(null);

  // Period applying helper
  const applyPeriod = (year: number, preset: string, month: string) => {
    if (month !== "ALL") {
      setSelectedRange([`${year}-${month}`, `${year}-${month}`]);
      return;
    }
    switch (preset) {
      case "Q1":
        setSelectedRange([`${year}-01`, `${year}-03`]);
        break;
      case "Q2":
        setSelectedRange([`${year}-04`, `${year}-06`]);
        break;
      case "Q3":
        setSelectedRange([`${year}-07`, `${year}-09`]);
        break;
      case "Q4":
        setSelectedRange([`${year}-10`, `${year}-12`]);
        break;
      case "FULL_YEAR":
      default:
        setSelectedRange([`${year}-01`, `${year}-12`]);
        break;
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    applyPeriod(year, activePreset, selectedMonth);
  };

  const handlePresetClick = (preset: string) => {
    setActivePreset(preset);
    setSelectedMonth("ALL");
    applyPeriod(selectedYear, preset, "ALL");
  };

  const handleMonthSelect = (monthVal: string) => {
    setSelectedMonth(monthVal);
    if (monthVal === "ALL") {
      setActivePreset("FULL_YEAR");
      applyPeriod(selectedYear, "FULL_YEAR", "ALL");
    } else {
      setActivePreset("MONTH");
      applyPeriod(selectedYear, "MONTH", monthVal);
    }
  };

  // Synchronize URL parameters if changed
  useEffect(() => {
    if (urlJournalId) {
      setJournalIdFilter(urlJournalId);
      setSelectedAccountId("");
    } else {
      setJournalIdFilter("");
      if (urlAccountId) setSelectedAccountId(urlAccountId);
    }
    if (urlFrom && urlTo) setSelectedRange([urlFrom, urlTo]);
  }, [urlJournalId, urlAccountId, urlFrom, urlTo]);

  // Warm up other finance and commercial pages for instant route transitions
  useEffect(() => {
    router.prefetch("/finance/reports/profit-and-loss");
    router.prefetch("/finance/journal-entries");
    router.prefetch("/finance/accounts");
    router.prefetch("/commercial/sales-invoices");
  }, [router]);

  // Resolve active account label
  const activeAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    return accounts.find(
      (a) => a.id === selectedAccountId || a.accountCode === selectedAccountId
    );
  }, [selectedAccountId, accounts]);

  // Fetch General Ledger records
  const { data: records = [], isLoading, refetch } = useQuery({
    queryKey: ["general-ledger", selectedRange, selectedAccountId, search, journalIdFilter],
    queryFn: async () => {
      const from = `${selectedRange[0]}-01`;
      const to = `${selectedRange[1]}-31`;
      const params = new URLSearchParams();

      if (journalIdFilter) {
        params.append("journalId", journalIdFilter);
      } else {
        params.append("from", from);
        params.append("to", to);
        if (selectedAccountId) params.append("accountId", selectedAccountId);
      }

      if (search) params.append("search", search);

      const res = await fetch(`/api/finance/general-ledger?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load general ledger");
      return await res.json();
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  // Calculate Totals and Running Balance
  const { totals, recordsWithRunningBalance } = useMemo(() => {
    let d = 0;
    let c = 0;
    let running = 0;

    const isNormalDebit = activeAccount?.type === "ASSET" || activeAccount?.type === "EXPENSE";

    const computed = records.map((r: any) => {
      const dr = Number(r.debitAed) || 0;
      const cr = Number(r.creditAed) || 0;
      d += dr;
      c += cr;

      if (isNormalDebit) {
        running += dr - cr;
      } else {
        running += cr - dr;
      }

      return {
        ...r,
        runningBalance: running,
      };
    });

    return {
      totals: {
        debit: Math.round(d * 100) / 100,
        credit: Math.round(c * 100) / 100,
        difference: Math.round(Math.abs(d - c) * 100) / 100,
      },
      recordsWithRunningBalance: computed,
    };
  }, [records, activeAccount]);

  // Export to CSV
  const handleExportCsv = () => {
    if (!records.length) return;
    const headers = [
      "Entry Number",
      "Source",
      "Date",
      "Account Code",
      "Account Name",
      "Offset Accounts",
      "Description",
      "Journal Notes",
      "Debit AED",
      "Credit AED",
    ];
    const rows = records.map((r: any) => [
      r.journalNumber || r.journalId,
      r.source,
      new Date(r.date).toISOString().split("T")[0],
      r.account.code,
      `"${r.account.name}"`,
      `"${r.offsetAccounts.map((o: any) => `${o.code} - ${o.name}`).join("; ")}"`,
      `"${r.description || ""}"`,
      `"${r.journalNotes || ""}"`,
      r.debitAed || 0,
      r.creditAed || 0,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `General_Ledger_${selectedRange[0]}_to_${selectedRange[1]}.csv`;
    link.click();
  };

  const getSourceBadgeStyle = (source: string) => {
    switch (source) {
      case "Sales invoice":
        return "bg-blue-50 text-blue-700 border-blue-200/90";
      case "Customer payment":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/90";
      case "Bill":
      case "Supplier bill":
        return "bg-amber-50 text-amber-700 border-amber-200/90";
      case "Bill payment":
        return "bg-teal-50 text-teal-700 border-teal-200/90";
      case "Credit note":
        return "bg-rose-50 text-rose-700 border-rose-200/90";
      default:
        return "bg-purple-50 text-[#5046e5] border-purple-200/90";
    }
  };

  return (
    <div className="w-full min-h-full bg-slate-50/40 flex flex-col font-sans">
      {/* 2-Tier Header matching Chart of Accounts & Journal Entries */}
      <div className="w-full bg-white border-b border-slate-200/90 shrink-0 sticky top-0 z-20 shadow-2xs">
        {/* Tier 1: Title, Counter & Action CTAs */}
        <div className="px-6 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5046e5]/10 text-[#5046e5] flex items-center justify-center font-bold shadow-2xs">
              <BookOpenText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>Finance &amp; Accounts</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-900 font-bold">General Ledger</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  General Ledger
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#5046e5]/10 text-[#5046e5] border border-[#5046e5]/20 font-mono">
                  {records.length} {records.length === 1 ? "line" : "lines"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!records.length}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              title="Export General Ledger to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => refetch()}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              title="Refresh ledger records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#5046e5]" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => router.push("/finance/journal-entries/new")}
              className="px-3.5 py-1.5 rounded-lg bg-[#5046e5] hover:bg-[#4338ca] text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Journal</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Search, Account Hierarchical Filter, & Top Year/Month Selector */}
        <div className="px-6 py-2.5 border-t border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search serial, reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#5046e5] focus:ring-1 focus:ring-[#5046e5] transition-all shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Hierarchical Account Filter Selector */}
            {!journalIdFilter && (
              <div className="w-full sm:w-64">
                <HierarchicalAccountSelect
                  value={selectedAccountId}
                  onChange={(accId) => setSelectedAccountId(accId)}
                  accounts={accounts}
                  placeholder="All Accounts (Filter...)"
                />
              </div>
            )}

            {/* Clear Account Filter Pill if selected */}
            {selectedAccountId && (
              <button
                type="button"
                onClick={() => {
                  setSelectedAccountId("");
                  router.replace("/finance/general-ledger");
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-[#5046e5] text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
                title="Clear account filter"
              >
                <span>Clear Account</span>
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Journal ID Filter Pill */}
            {journalIdFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#5046e5]/10 border border-[#5046e5]/20 text-[#5046e5] text-xs font-semibold shadow-2xs font-mono">
                <span>
                  Entry: <strong>{journalIdFilter}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setJournalIdFilter("");
                    router.replace("/finance/general-ledger");
                  }}
                  className="hover:text-indigo-900 cursor-pointer p-0.5 rounded"
                  title="Clear Journal ID filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>

          {/* Top Year & Month Selector (Replacing the big slider completely) */}
          <div className="flex flex-wrap items-center gap-2 select-none shrink-0 text-xs">
            {/* Year Selector */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none pr-2 py-1 cursor-pointer font-mono"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            {/* Quick Presets: Full Year, Q1-Q4 */}
            <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => handlePresetClick("FULL_YEAR")}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activePreset === "FULL_YEAR" && selectedMonth === "ALL"
                    ? "bg-[#5046e5] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Full Year
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick("Q1")}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activePreset === "Q1"
                    ? "bg-[#5046e5] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Q1
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick("Q2")}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activePreset === "Q2"
                    ? "bg-[#5046e5] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Q2
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick("Q3")}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activePreset === "Q3"
                    ? "bg-[#5046e5] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Q3
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick("Q4")}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activePreset === "Q4"
                    ? "bg-[#5046e5] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                Q4
              </button>
            </div>

            {/* Specific Month Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthSelect(e.target.value)}
                className={`border rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer shadow-2xs transition-all ${
                  selectedMonth !== "ALL"
                    ? "bg-indigo-50 border-indigo-300 text-[#5046e5]"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                }`}
              >
                {MONTH_NAMES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 p-6 space-y-5 max-w-[1700px] w-full mx-auto">
        {/* Executive Metric Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Debits */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Debit Movement
              </span>
              <div className="text-lg font-bold font-mono text-blue-700 mt-1">
                {formatAed(totals.debit)}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-2xs">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Total Credits */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Credit Movement
              </span>
              <div className="text-lg font-bold font-mono text-amber-700 mt-1">
                {formatAed(totals.credit)}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-2xs">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Double-Entry Net Balance */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Net Period Movement
              </span>
              <div className="text-lg font-bold font-mono text-slate-900 mt-1 flex items-center gap-2">
                <span>{formatAed(totals.difference)}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Balanced
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
              <Scale className="w-4 h-4" />
            </div>
          </div>

          {/* Card 4: Scope / Active Account */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Scope / Period
              </span>
              <div className="text-xs font-bold text-slate-800 mt-1 truncate" title={activeAccount ? activeAccount.accountName : "Consolidated General Ledger"}>
                {activeAccount ? `${activeAccount.accountCode} - ${activeAccount.accountName}` : "Consolidated (All Accounts)"}
              </div>
              <span className="text-[10px] text-[#5046e5] font-semibold block font-mono mt-0.5">
                {selectedRange[0]} &rarr; {selectedRange[1]}
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#5046e5] flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Layers className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Main General Ledger Table Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse table-fixed min-w-[1180px]">
              <colgroup>
                <col className="w-36" />
                <col className="w-32" />
                <col className="w-28" />
                <col className="w-52" />
                <col className="w-56" />
                <col className="w-64" />
                <col className="w-32" />
                <col className="w-32" />
                {selectedAccountId && <col className="w-32" />}
              </colgroup>
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider select-none">
                  <th className="py-3 px-3.5 sticky left-0 bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                    Serial #
                  </th>
                  <th className="py-3 px-3">Source</th>
                  <th className="py-3 px-2.5">Date</th>
                  <th className="py-3 px-3">Account</th>
                  <th className="py-3 px-3">Offset Accounts</th>
                  <th className="py-3 px-3">Description / Narration</th>
                  <th className="py-3 px-3 text-right">Debit (AED)</th>
                  <th className="py-3 px-3 text-right">Credit (AED)</th>
                  {selectedAccountId && (
                    <th className="py-3 px-3 text-right bg-slate-100/60 text-slate-800">
                      Balance (AED)
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-xs">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={selectedAccountId ? 9 : 8}
                      className="px-4 py-20 text-center text-slate-400 text-xs"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-[#5046e5]" />
                        <span>Loading General Ledger records...</span>
                      </div>
                    </td>
                  </tr>
                ) : recordsWithRunningBalance.length === 0 ? (
                  <tr>
                    <td
                      colSpan={selectedAccountId ? 9 : 8}
                      className="px-4 py-20 text-center text-slate-400 text-xs"
                    >
                      <div className="max-w-md mx-auto space-y-1.5">
                        <p className="font-semibold text-slate-700">No ledger entries found for {selectedRange[0]} &rarr; {selectedRange[1]}</p>
                        <p className="text-slate-400 text-[11px]">
                          Try selecting &ldquo;Full Year&rdquo; or another month from the top period bar.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recordsWithRunningBalance.map((r: any) => (
                    <tr
                      key={r.id}
                      onClick={() => {
                        if (r.rawEntry) setSelectedModalEntry(r.rawEntry);
                      }}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Serial Number with Lock icon (Sticky, whitespace-nowrap) */}
                      <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50/70 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] whitespace-nowrap">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span
                            className="hover:text-[#5046e5] transition-colors truncate"
                            title={r.journalNumber || r.journalId}
                          >
                            {r.journalNumber || r.journalId}
                          </span>
                        </div>
                      </td>

                      {/* Source Badge with direct invoice navigation */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (r.sourceUrl) {
                              router.push(r.sourceUrl);
                            } else if (r.source === "Sales invoice") {
                              const invNum = r.reference?.startsWith("INV-")
                                ? r.reference
                                : (r.journalNumber?.replace("JE-INV-", "").split("-").slice(0, 3).join("-") || r.reference);
                              router.push(`/commercial/sales-invoices?search=${encodeURIComponent(invNum || "")}`);
                            } else {
                              router.push(`/finance/journal-entries?search=${encodeURIComponent(r.journalNumber || "")}`);
                            }
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10.5px] font-semibold border transition-all hover:scale-105 cursor-pointer ${getSourceBadgeStyle(
                            r.source
                          )}`}
                          title={`Open ${r.source}: ${r.reference || r.journalNumber}`}
                        >
                          <span>{r.source}</span>
                        </button>
                      </td>

                      {/* Date */}
                      <td className="px-2.5 py-2.5 font-mono text-slate-600 whitespace-nowrap text-[11px]">
                        {new Date(r.date).toISOString().split("T")[0]}
                      </td>

                      {/* Account Badge */}
                      <td className="px-3 py-2.5">
                        <span
                          className="inline-block max-w-[190px] truncate px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-[11px]"
                          title={`${r.account.code} - ${r.account.name}`}
                        >
                          {r.account.code} - {r.account.name}
                        </span>
                      </td>

                      {/* Offset Accounts */}
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1 max-w-[210px]">
                          {r.offsetAccounts.length === 0 ? (
                            <span className="text-slate-400 text-xs">—</span>
                          ) : (
                            r.offsetAccounts.map((o: any) => (
                              <span
                                key={o.id}
                                className="px-1.5 py-0.5 rounded-md bg-indigo-50/70 border border-indigo-200/60 text-[#5046e5] font-medium text-[10.5px] max-w-[200px] truncate"
                                title={`${o.code} - ${o.name}`}
                              >
                                {o.code} - {o.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Description / Narration */}
                      <td className="px-3 py-2.5 text-slate-600 truncate" title={r.description || r.journalNotes || ""}>
                        <span>{r.description || r.journalNotes || "—"}</span>
                      </td>

                      {/* Debit AED */}
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-blue-700 whitespace-nowrap">
                        {r.debitAed > 0 ? Number(r.debitAed).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                      </td>

                      {/* Credit AED */}
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-700 whitespace-nowrap">
                        {r.creditAed > 0 ? Number(r.creditAed).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                      </td>

                      {/* Running Balance */}
                      {selectedAccountId && (
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900 bg-slate-50/50 whitespace-nowrap">
                          {Number(r.runningBalance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>

              {/* Total Footer Row */}
              {records.length > 0 && (
                <tfoot className="bg-slate-50/90 font-mono text-xs font-bold border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-right uppercase tracking-wider font-sans text-slate-700">
                      Total Ledger Movement:
                    </td>
                    <td className="px-3 py-3 text-right text-blue-700 font-mono whitespace-nowrap font-bold">
                      {formatAed(totals.debit)}
                    </td>
                    <td className="px-3 py-3 text-right text-amber-700 font-mono whitespace-nowrap font-bold">
                      {formatAed(totals.credit)}
                    </td>
                    {selectedAccountId && (
                      <td className="px-3 py-3 text-right text-slate-900 bg-slate-100/60 font-mono whitespace-nowrap font-bold">
                        {recordsWithRunningBalance.length > 0
                          ? formatAed(
                              recordsWithRunningBalance[recordsWithRunningBalance.length - 1].runningBalance
                            )
                          : "—"}
                      </td>
                    )}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Status Bar */}
          <div className="px-6 py-3 bg-slate-50/70 border-t border-slate-200/90 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span>Showing <strong>{records.length}</strong> transaction lines</span>
              <span>•</span>
              <span className="font-mono flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Double-Entry Balanced (Difference: AED {totals.difference.toFixed(2)})
              </span>
            </div>
            <span className="font-mono text-slate-400 text-[11px]">UAE VAT &amp; FTA Audit Ready</span>
          </div>
        </div>
      </div>

      {/* Journal Details Modal */}
      <JournalDetailsModal
        isOpen={!!selectedModalEntry}
        entry={selectedModalEntry}
        onClose={() => setSelectedModalEntry(null)}
      />
    </div>
  );
}

export default function GeneralLedgerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading General Ledger...</div>}>
      <GeneralLedgerContent />
    </Suspense>
  );
}
