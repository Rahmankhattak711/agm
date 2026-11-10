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
  ChevronLeft,
  ChevronRight,
  Eye,
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

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
  const { data: records = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["general-ledger", selectedRange, selectedAccountId, search, journalIdFilter],
    queryFn: async () => {
      const sanitizeDate = (val: string, isEnd: boolean): string => {
        if (!val) return "";
        const clean = val.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
        if (/^\d{4}-\d{2}$/.test(clean)) {
          if (!isEnd) return `${clean}-01`;
          const [y, m] = clean.split("-").map(Number);
          const lastDay = new Date(y, m, 0).getDate();
          return `${clean}-${lastDay.toString().padStart(2, "0")}`;
        }
        return clean.slice(0, 10);
      };

      const from = sanitizeDate(selectedRange[0], false);
      const to = sanitizeDate(selectedRange[1], true);
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

    const isNormalDebit =
      activeAccount?.type === "ASSET" || activeAccount?.type === "EXPENSE";

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

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRange, selectedAccountId, search, journalIdFilter, pageSize]);

  const totalPages = Math.max(
    1,
    Math.ceil(recordsWithRunningBalance.length / pageSize)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRecords = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return recordsWithRunningBalance.slice(start, start + pageSize);
  }, [recordsWithRunningBalance, safeCurrentPage, pageSize]);

  const startIndex =
    recordsWithRunningBalance.length === 0
      ? 0
      : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(
    safeCurrentPage * pageSize,
    recordsWithRunningBalance.length
  );

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

    const csvContent = [
      headers.join(","),
      ...rows.map((r: any) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `General_Ledger_${selectedRange[0]}_to_${selectedRange[1]}.csv`;
    link.click();
  };

  const getSourceBadgeInlineStyle = (source: string): React.CSSProperties => {
    switch (source) {
      case "Sales invoice":
        return {
          backgroundColor: "#eff6ff",
          color: "#1d4ed8",
          border: "1px solid #93c5fd",
        };
      case "Customer payment":
      case "Bill payment":
        return {
          backgroundColor: "#dcfce7",
          color: "#15803d",
          border: "1px solid #86efac",
        };
      case "Bill":
      case "Supplier bill":
        return {
          backgroundColor: "#fefce8",
          color: "#a16207",
          border: "1px solid #fde047",
        };
      case "Credit note":
        return {
          backgroundColor: "#fff1f2",
          color: "#be123c",
          border: "1px solid #fda4af",
        };
      default:
        return {
          backgroundColor: "#f1f5f9",
          color: "#334155",
          border: "1px solid #cbd5e1",
        };
    }
  };

  return (
    <div className="w-full min-h-full bg-white text-slate-700 font-sans px-4 sm:px-5 py-3.5 space-y-3.5 select-none">
      {/* =========================================================================
          1. CLEAN COMPACT TOP HEADER (MATCHING FIXED ASSETS, COA & JOURNAL ENTRIES)
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 print:hidden">
        <div>
          <h1 className="text-base sm:text-[17px] font-semibold tracking-tight text-slate-800">
            General Ledger
          </h1>
          <p className="text-[11.5px] font-normal text-slate-500 mt-0.5">
            Consolidated double-entry ledger lines, account balances, and financial audit trail.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!records.length}
            style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
            className="px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 text-[11.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Download CSV Report"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Report</span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/finance/journal-entries/new")}
            style={{
              backgroundColor: "#1d4ed8",
              color: "#ffffff",
              border: "1px solid #1e40af",
            }}
            className="px-3.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Journal</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. SOFT LIGHT-BLUE TINTED SEARCH, ACCOUNT FILTER & PERIOD BOX
          ========================================================================= */}
      <div
        className="rounded-xl p-3 space-y-2.5 print:hidden"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
          {/* Search Input */}
          <div className="md:col-span-5 lg:col-span-4">
            <label className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
              SEARCH
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search serial, reference, or narration..."
                style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                className="w-full rounded-lg pl-8 pr-7 py-1.5 text-xs font-normal text-slate-700 placeholder-slate-400 outline-none focus:border-blue-600 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Account Filter Selector */}
          <div className="md:col-span-4 lg:col-span-4">
            <label className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
              ACCOUNT LEDGER
            </label>
            {!journalIdFilter ? (
              <div className="flex items-center gap-1.5">
                <div className="flex-1 min-w-0">
                  <HierarchicalAccountSelect
                    value={selectedAccountId}
                    onChange={(accId) => setSelectedAccountId(accId)}
                    accounts={accounts}
                    placeholder="All Accounts (Consolidated)"
                  />
                </div>
                {selectedAccountId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccountId("");
                      router.replace("/finance/general-ledger");
                    }}
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#475569",
                      border: "1px solid #cbd5e1",
                    }}
                    className="h-8 px-2.5 rounded-lg text-[11px] font-normal hover:bg-slate-50 flex items-center gap-1 shrink-0 cursor-pointer"
                    title="Clear account filter"
                  >
                    <span>Clear</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <div
                className="h-8 px-3 rounded-lg flex items-center justify-between text-xs font-mono"
                style={{
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #93c5fd",
                }}
              >
                <span className="truncate">Voucher: {journalIdFilter}</span>
                <button
                  type="button"
                  onClick={() => {
                    setJournalIdFilter("");
                    router.replace("/finance/general-ledger");
                  }}
                  className="hover:opacity-75 cursor-pointer ml-2"
                  title="Clear Journal ID filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Month Selector & Search/Refresh Buttons */}
          <div className="md:col-span-3 lg:col-span-4 flex flex-wrap sm:flex-nowrap items-end gap-2">
            <div className="flex-1 min-w-[140px]">
              <label className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
                MONTH
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthSelect(e.target.value)}
                style={{
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                }}
                className="w-full rounded-lg px-2.5 py-1.5 text-xs font-normal text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
              >
                {MONTH_NAMES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => refetch()}
                style={{
                  backgroundColor: "#1d4ed8",
                  color: "#ffffff",
                  border: "1px solid #1e40af",
                }}
                className="flex-1 sm:flex-initial justify-center px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedAccountId("");
                  setJournalIdFilter("");
                  setSelectedYear(2026);
                  setSelectedMonth("ALL");
                  setActivePreset("FULL_YEAR");
                  setSelectedRange(["2026-01", "2026-12"]);
                  router.replace("/finance/general-ledger");
                  refetch();
                }}
                disabled={isFetching}
                style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                title="Reset & Refresh"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-blue-600" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Filter Row: Year & Quick Quarter Presets */}
        <div
          className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs"
          style={{ borderTop: "1px solid #e2e8f0" }}
        >
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector */}
            <div
              className="inline-flex items-center rounded-lg px-2 py-1"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
              }}
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <span className="text-[10.5px] text-slate-400 font-normal mr-1">
                Year:
              </span>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
                className="bg-transparent text-[11.5px] font-medium text-slate-800 outline-none cursor-pointer font-mono"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>

            {/* Quarter Presets */}
            <div
              className="inline-flex items-center rounded-lg p-0.5 gap-0.5"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
              }}
            >
              {(["FULL_YEAR", "Q1", "Q2", "Q3", "Q4"] as const).map((preset) => {
                const isActive =
                  preset === "FULL_YEAR"
                    ? activePreset === "FULL_YEAR" && selectedMonth === "ALL"
                    : activePreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    style={
                      isActive
                        ? {
                            backgroundColor: "#1d4ed8",
                            color: "#ffffff",
                          }
                        : {
                            backgroundColor: "transparent",
                            color: "#475569",
                          }
                    }
                    className="px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer"
                  >
                    {preset === "FULL_YEAR" ? "Full Year" : preset}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] font-normal text-slate-500 flex items-center gap-1.5">
            <span>Active Period:</span>
            <span
              className="font-mono font-medium px-2 py-0.5 rounded-md text-[11px]"
              style={{
                backgroundColor: "#ffffff",
                color: "#1d4ed8",
                border: "1px solid #cbd5e1",
              }}
            >
              {selectedRange[0]} &rarr; {selectedRange[1]}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. FOUR COMPACT PASTEL KPI CARDS (LIGHT COLOR + CLEAR BORDERS)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        {/* Card 1: Total Debit Movement (Soft Slate-Blue) */}
        <div
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
          style={{
            backgroundColor: "#f1f5f9",
            border: "1px solid #cbd5e1",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#ffffff",
              color: "#1d4ed8",
              border: "1px solid #cbd5e1",
            }}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              TOTAL DEBIT MOVEMENT
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
              {formatAed(totals.debit)}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block">
              {records.length} ledger lines
            </span>
          </div>
        </div>

        {/* Card 2: Total Credit Movement (Soft Warm Yellow/Amber) */}
        <div
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
          style={{
            backgroundColor: "#fefce8",
            border: "1px solid #fde047",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#fef9c3",
              color: "#a16207",
              border: "1px solid #fde047",
            }}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              TOTAL CREDIT MOVEMENT
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
              {formatAed(totals.credit)}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block">
              Posted credit volume
            </span>
          </div>
        </div>

        {/* Card 3: Net Period Balance (Soft Mint/Green) */}
        <div
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#dcfce7",
              color: "#15803d",
              border: "1px solid #86efac",
            }}
          >
            <Scale className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              NET PERIOD MOVEMENT
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
              {formatAed(totals.difference)}
            </span>
            <span className="text-[10.5px] font-normal text-emerald-700 block">
              Double-entry balanced
            </span>
          </div>
        </div>

        {/* Card 4: Scope / Active Account (Soft Rose/Pink) */}
        <div
          className="rounded-xl px-3.5 py-2.5 flex items-center gap-3"
          style={{
            backgroundColor: "#fff1f2",
            border: "1px solid #fda4af",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#ffe4e6",
              color: "#be123c",
              border: "1px solid #fda4af",
            }}
          >
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              LEDGER SCOPE
            </span>
            <span
              className="text-xs sm:text-[13.5px] font-semibold text-slate-800 leading-snug block truncate"
              title={
                activeAccount
                  ? `${activeAccount.accountCode} - ${activeAccount.accountName}`
                  : "Consolidated (All Accounts)"
              }
            >
              {activeAccount
                ? `${activeAccount.accountCode} - ${activeAccount.accountName}`
                : "Consolidated Ledger"}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block font-mono">
              {selectedRange[0]} &rarr; {selectedRange[1]}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. GENERAL LEDGER RECORDS TABLE WITH SOFT LIGHT-BLUE HEADER BAR
          ========================================================================= */}
      <div
        className="bg-white rounded-xl overflow-hidden"
        style={{ border: "1px solid #cbd5e1" }}
      >
        {/* Soft Light-Blue Top Bar */}
        <div
          className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2"
          style={{
            backgroundColor: "#f4f7fb",
            borderBottom: "1px solid #cbd5e1",
          }}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-slate-800">
              Ledger records
            </h3>
            {activeAccount && (
              <span
                className="text-[10.5px] font-normal px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #93c5fd",
                }}
              >
                {activeAccount.accountCode} · {activeAccount.accountName}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 font-normal">
            {recordsWithRunningBalance.length}{" "}
            {recordsWithRunningBalance.length === 1 ? "record" : "records"}
          </span>
        </div>

        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1040px] text-left text-xs border-collapse select-none">
            <thead>
              <tr
                className="bg-white text-[9.5px] font-medium uppercase tracking-wider text-slate-500"
                style={{ borderBottom: "1px solid #e2e8f0" }}
              >
                <th className="py-2.5 px-4 w-36 whitespace-nowrap">VOUCHER / DATE</th>
                <th className="py-2.5 px-4 w-32 whitespace-nowrap">SOURCE</th>
                <th className="py-2.5 px-4 w-52 whitespace-nowrap">ACCOUNT</th>
                <th className="py-2.5 px-4 w-56 whitespace-nowrap">OFFSET ACCOUNTS</th>
                <th className="py-2.5 px-4 whitespace-nowrap">DESCRIPTION / NARRATION</th>
                <th className="py-2.5 px-4 text-right w-32 whitespace-nowrap">
                  DEBIT (AED)
                </th>
                <th className="py-2.5 px-4 text-right w-32 whitespace-nowrap">
                  CREDIT (AED)
                </th>
                {selectedAccountId && (
                  <th className="py-2.5 px-4 text-right w-32 whitespace-nowrap bg-slate-50/70">
                    BALANCE (AED)
                  </th>
                )}
                <th className="py-2.5 px-4 text-right w-16 whitespace-nowrap">
                  VIEW
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={selectedAccountId ? 9 : 8}
                    className="py-12 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                      <span className="text-xs font-normal">
                        Loading general ledger records...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={selectedAccountId ? 9 : 8}
                    className="py-12 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-1 max-w-sm mx-auto">
                      <BookOpenText className="w-7 h-7 text-slate-300 mb-1" />
                      <h4 className="font-medium text-slate-700 text-xs">
                        No ledger entries found for {selectedRange[0]} &rarr;{" "}
                        {selectedRange[1]}
                      </h4>
                      <p className="text-[11px] font-normal text-slate-400">
                        Try selecting &ldquo;Full Year&rdquo; or adjusting your search and account filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r: any) => {
                  const formattedDate = new Date(r.date)
                    .toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    .replace(/ /g, "-");

                  return (
                    <tr
                      key={r.id}
                      onClick={() => {
                        if (r.rawEntry) setSelectedModalEntry(r.rawEntry);
                      }}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {/* 1. VOUCHER / DATE */}
                      <td className="py-2.5 px-4 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span
                            className="font-mono font-medium text-xs uppercase truncate"
                            style={{ color: "#1d4ed8" }}
                            title={r.journalNumber || r.journalId}
                          >
                            {r.journalNumber || r.journalId}
                          </span>
                        </div>
                        <div className="text-slate-400 text-[10.5px] font-normal mt-0.5 pl-4">
                          {formattedDate}
                        </div>
                      </td>

                      {/* 2. SOURCE */}
                      <td className="py-2.5 px-4 align-top whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (r.sourceUrl) {
                              router.push(r.sourceUrl);
                            } else if (r.source === "Sales invoice") {
                              const invNum = r.reference?.startsWith("INV-")
                                ? r.reference
                                : r.journalNumber
                                    ?.replace("JE-INV-", "")
                                    .split("-")
                                    .slice(0, 3)
                                    .join("-") || r.reference;
                              router.push(
                                `/commercial/sales-invoices?search=${encodeURIComponent(
                                  invNum || ""
                                )}`
                              );
                            } else {
                              router.push(
                                `/finance/journal-entries?search=${encodeURIComponent(
                                  r.journalNumber || ""
                                )}`
                              );
                            }
                          }}
                          style={getSourceBadgeInlineStyle(r.source)}
                          className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-medium uppercase tracking-wide transition-opacity hover:opacity-80 cursor-pointer"
                          title={`Open ${r.source}: ${r.reference || r.journalNumber}`}
                        >
                          {r.source}
                        </button>
                      </td>

                      {/* 3. ACCOUNT */}
                      <td className="py-2.5 px-4 align-top">
                        <span
                          style={{
                            backgroundColor: "#f8fafc",
                            border: "1px solid #cbd5e1",
                          }}
                          className="inline-block max-w-[195px] truncate px-2 py-0.5 rounded text-slate-800 font-normal text-[11px]"
                          title={`${r.account.code} - ${r.account.name}`}
                        >
                          <span className="font-mono font-medium text-slate-700">
                            {r.account.code}
                          </span>{" "}
                          - {r.account.name}
                        </span>
                      </td>

                      {/* 4. OFFSET ACCOUNTS */}
                      <td className="py-2.5 px-4 align-top">
                        <div className="flex flex-wrap gap-1 max-w-[215px]">
                          {r.offsetAccounts.length === 0 ? (
                            <span className="text-slate-400 text-xs font-normal">
                              -
                            </span>
                          ) : (
                            r.offsetAccounts.map((o: any) => (
                              <span
                                key={o.id}
                                style={{
                                  backgroundColor: "#eff6ff",
                                  color: "#1d4ed8",
                                  border: "1px solid #bfdbfe",
                                }}
                                className="px-2 py-0.5 rounded text-[10.5px] font-normal max-w-[205px] truncate"
                                title={`${o.code} - ${o.name}`}
                              >
                                {o.code} - {o.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* 5. DESCRIPTION / NARRATION */}
                      <td
                        className="py-2.5 px-4 align-top text-slate-600 font-normal text-xs max-w-[260px] truncate"
                        title={r.description || r.journalNotes || ""}
                      >
                        {r.description || r.journalNotes || "-"}
                      </td>

                      {/* 6. DEBIT AED */}
                      <td className="py-2.5 px-4 text-right align-top font-mono font-medium text-xs whitespace-nowrap text-slate-800">
                        {r.debitAed > 0
                          ? Number(r.debitAed).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "-"}
                      </td>

                      {/* 7. CREDIT AED */}
                      <td className="py-2.5 px-4 text-right align-top font-mono font-medium text-xs whitespace-nowrap text-slate-800">
                        {r.creditAed > 0
                          ? Number(r.creditAed).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "-"}
                      </td>

                      {/* 8. RUNNING BALANCE */}
                      {selectedAccountId && (
                        <td className="py-2.5 px-4 text-right align-top font-mono font-semibold text-xs text-slate-900 bg-slate-50/50 whitespace-nowrap">
                          {Number(r.runningBalance).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      )}

                      {/* 9. VIEW ACTION */}
                      <td className="py-2.5 px-4 text-right align-top whitespace-nowrap">
                        <div
                          className="inline-flex items-center justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (r.rawEntry) setSelectedModalEntry(r.rawEntry);
                            }}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="View Journal Voucher"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Total Footer Row */}
            {records.length > 0 && (
              <tfoot
                style={{
                  backgroundColor: "#f8fafc",
                  borderTop: "1px solid #cbd5e1",
                }}
                className="font-mono text-xs font-semibold"
              >
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-2.5 text-right font-sans font-medium text-slate-600"
                  >
                    Total Period Movement:
                  </td>
                  <td
                    className="px-4 py-2.5 text-right whitespace-nowrap"
                    style={{ color: "#1d4ed8" }}
                  >
                    {formatAed(totals.debit)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-amber-700 whitespace-nowrap">
                    {formatAed(totals.credit)}
                  </td>
                  {selectedAccountId && (
                    <td className="px-4 py-2.5 text-right text-slate-900 bg-slate-100/60 whitespace-nowrap">
                      {recordsWithRunningBalance.length > 0
                        ? formatAed(
                            recordsWithRunningBalance[
                              recordsWithRunningBalance.length - 1
                            ].runningBalance
                          )
                        : "-"}
                    </td>
                  )}
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Responsive Pagination & Bottom Summary Bar */}
        <div
          className="px-4 py-2.5 text-[11px] text-slate-500 font-normal flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{
            backgroundColor: "#f4f7fb",
            borderTop: "1px solid #cbd5e1",
          }}
        >
          {/* Left: Showing range & Rows per page */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 w-full sm:w-auto">
            <span>
              Showing{" "}
              <span className="text-slate-800 font-medium">{startIndex}</span> to{" "}
              <span className="text-slate-800 font-medium">{endIndex}</span> of{" "}
              <span className="text-slate-800 font-medium">
                {recordsWithRunningBalance.length}
              </span>{" "}
              lines
            </span>

            <span className="text-slate-300 hidden sm:inline">•</span>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[10.5px]">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                }}
                className="rounded-lg px-2 py-1 text-[11px] font-normal text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <span className="text-slate-300 hidden md:inline">•</span>

            <span className="hidden md:inline-flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Balanced (Diff: AED {totals.difference.toFixed(2)})</span>
            </span>
          </div>

          {/* Right: Page Navigation Controls */}
          <div className="flex items-center justify-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              style={{
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
              }}
              className="h-7 px-2.5 rounded-lg text-[11px] font-normal text-slate-600 hover:bg-slate-50 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Prev</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 5) return true;
                  if (page === 1 || page === totalPages) return true;
                  return Math.abs(page - safeCurrentPage) <= 1;
                })
                .reduce<Array<number | string>>((acc, page, idx, arr) => {
                  if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                    acc.push("...");
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1.5 text-[11px] text-slate-400 select-none"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(Number(item))}
                      style={
                        safeCurrentPage === item
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
                      className="h-7 min-w-[28px] px-2 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center justify-center"
                    >
                      {item}
                    </button>
                  )
                )}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              style={{
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
              }}
              className="h-7 px-2.5 rounded-lg text-[11px] font-normal text-slate-600 hover:bg-slate-50 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="hidden xs:inline">Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
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
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-normal text-slate-400">
          Loading general ledger...
        </div>
      }
    >
      <GeneralLedgerContent />
    </Suspense>
  );
}
