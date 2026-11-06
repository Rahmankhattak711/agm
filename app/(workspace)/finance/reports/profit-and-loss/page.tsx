"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { formatAed } from "@/lib/utils/format";
import { PnlSparkline } from "./components/PnlSparkline";
import { PnlHoverPopover, TopEntryItem } from "./components/PnlHoverPopover";
import { TopEntriesDrilldownModal } from "./components/TopEntriesDrilldownModal";
import { JournalDetailsModal } from "../../journal-entries/components/JournalDetailsModal";
import {
  Download,
  Calendar,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Coins,
  RefreshCw,
  Scale,
  Sparkles,
  ArrowUpRight,
  ReceiptText,
  FileSpreadsheet,
  Clock,
  CalendarDays,
  Check,
  RotateCcw,
} from "lucide-react";

const YEARS = [2024, 2025, 2026, 2027];
const MONTH_NAMES = [
  { val: "01", name: "Jan" },
  { val: "02", name: "Feb" },
  { val: "03", name: "Mar" },
  { val: "04", name: "Apr" },
  { val: "05", name: "May" },
  { val: "06", name: "Jun" },
  { val: "07", name: "Jul" },
  { val: "08", name: "Aug" },
  { val: "09", name: "Sep" },
  { val: "10", name: "Oct" },
  { val: "11", name: "Nov" },
  { val: "12", name: "Dec" },
];

export default function ProfitAndLossReportPage() {
  const router = useRouter();

  // Mode: "preset" or "custom"
  const [filterMode, setFilterMode] = useState<"preset" | "custom">("preset");

  // Preset Filters
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [activePreset, setActivePreset] = useState<string>("FULL_YEAR");

  // Custom Days Filter (Exact Dates YYYY-MM-DD)
  const [customFrom, setCustomFrom] = useState<string>("2026-01-01");
  const [customTo, setCustomTo] = useState<string>("2026-12-31");

  // Active Query Range
  const [selectedRange, setSelectedRange] = useState<[string, string]>([
    "2026-01",
    "2026-12",
  ]);

  // Collapsed sections state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Hover Popover State
  const [hoverState, setHoverState] = useState<{
    visible: boolean;
    entries: TopEntryItem[];
    accountName: string;
    accountCode: string;
    totalAmount: number;
    periodLabel: string;
    x: number;
    y: number;
  } | null>(null);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Drilldown Split Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    entries: TopEntryItem[];
    accountName: string;
    accountCode: string;
    totalAmount: number;
    periodLabel: string;
  } | null>(null);

  // Full Journal View Modal
  const [fullJournalEntry, setFullJournalEntry] = useState<any | null>(null);

  // Period applying helper for presets
  const applyPresetPeriod = (year: number, preset: string, month: string) => {
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
      case "THIS_MONTH": {
        const curM = (new Date().getMonth() + 1).toString().padStart(2, "0");
        setSelectedRange([`${year}-${curM}`, `${year}-${curM}`]);
        break;
      }
      case "FULL_YEAR":
      default:
        setSelectedRange([`${year}-01`, `${year}-12`]);
        break;
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setFilterMode("preset");
    applyPresetPeriod(year, activePreset, selectedMonth);
  };

  const handlePresetClick = (preset: string) => {
    setActivePreset(preset);
    setSelectedMonth("ALL");
    setFilterMode("preset");
    applyPresetPeriod(selectedYear, preset, "ALL");
  };

  const handleMonthSelect = (monthVal: string) => {
    setSelectedMonth(monthVal);
    setFilterMode("preset");
    if (monthVal === "ALL") {
      setActivePreset("FULL_YEAR");
      applyPresetPeriod(selectedYear, "FULL_YEAR", "ALL");
    } else {
      setActivePreset("MONTH");
      applyPresetPeriod(selectedYear, "MONTH", monthVal);
    }
  };

  const handleApplyCustomDays = () => {
    if (!customFrom || !customTo) return;
    setFilterMode("custom");
    setSelectedRange([customFrom, customTo]);
  };

  const handleResetToPresets = () => {
    setFilterMode("preset");
    setSelectedMonth("ALL");
    setActivePreset("FULL_YEAR");
    applyPresetPeriod(selectedYear, "FULL_YEAR", "ALL");
  };

  // Warm up target routes for instantaneous page navigation
  useEffect(() => {
    router.prefetch("/finance/general-ledger");
    router.prefetch("/finance/journal-entries");
    router.prefetch("/finance/accounts");
  }, [router]);

  // Fetch dynamic P&L report
  const { data: pnl, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["profit-and-loss", selectedRange],
    queryFn: async () => {
      const res = await fetch(
        `/api/finance/reports/profit-and-loss?from=${selectedRange[0]}&to=${selectedRange[1]}`
      );
      if (!res.ok) throw new Error("Failed to load P&L");
      return await res.json();
    },
    staleTime: 45 * 1000,
    placeholderData: (prev) => prev,
  });

  const monthKeys: string[] = pnl?.monthKeys || ["2026-01", "2026-02", "2026-03"];
  const monthLabels: string[] = pnl?.monthLabels || ["Jan 2026", "Feb 2026", "Mar 2026"];

  // Direct Drill Down to General Ledger
  const handleDrillDownToGL = (accountId: string, accountName: string) => {
    router.push(
      `/finance/general-ledger?accountId=${accountId}&accountName=${encodeURIComponent(
        accountName
      )}&from=${selectedRange[0]}&to=${selectedRange[1]}`
    );
  };

  // Smart source document navigation
  const handleNavigateSource = (entry: TopEntryItem) => {
    if (entry.sourceUrl) {
      router.push(entry.sourceUrl);
    } else {
      router.push(`/finance/journal-entries?search=${encodeURIComponent(entry.journalNumber)}`);
    }
  };

  // View full journal entry modal
  const handleViewFullJournal = async (journalEntryId: string, entryNumber: string) => {
    try {
      const res = await fetch(`/api/journal-entries`);
      if (res.ok) {
        const all = await res.json();
        const found = all.find((j: any) => j.id === journalEntryId || j.entryNumber === entryNumber);
        if (found) {
          setFullJournalEntry(found);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    router.push(`/finance/journal-entries?search=${encodeURIComponent(entryNumber)}`);
  };

  // Handle Mouse Enter on an amount cell
  const handleCellMouseEnter = (
    e: React.MouseEvent,
    entries: TopEntryItem[] = [],
    accName: string,
    accCode: string,
    amount: number,
    colPeriodLabel: string
  ) => {
    if (!entries || entries.length === 0 || amount === 0) return;

    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    const rect = e.currentTarget.getBoundingClientRect();
    const popoverWidth = 420;
    const popoverHeight = 260;
    const padding = 16;

    let x = rect.left + rect.width / 2 - popoverWidth / 2;
    if (x + popoverWidth > window.innerWidth - padding) {
      x = window.innerWidth - popoverWidth - padding;
    }
    if (x < padding) {
      x = padding;
    }

    let y = rect.bottom + 6;
    if (y + popoverHeight > window.innerHeight - padding) {
      y = Math.max(padding, rect.top - popoverHeight - 6);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setHoverState({
        visible: true,
        entries,
        accountName: accName,
        accountCode: accCode,
        totalAmount: amount,
        periodLabel: colPeriodLabel,
        x,
        y,
      });
    }, 120);
  };

  const handleCellMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverState(null);
    }, 250);
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (!pnl) return;
    const headers = ["Account", "Total AED", ...monthLabels];
    const rows: any[] = [];

    const addCat = (catName: string, list: any[]) => {
      rows.push([catName, "", ...monthLabels.map(() => "")]);
      list.forEach((a: any) => {
        rows.push([
          `"${a.code} - ${a.name}"`,
          a.total.toFixed(2),
          ...monthKeys.map((k) => (a.monthly[k] || 0).toFixed(2)),
        ]);
      });
    };

    addCat("41 Income", pnl.income?.accounts || []);
    addCat("51 Cost of Sales", pnl.costOfSales?.accounts || []);
    addCat("52 Operating Expenses", pnl.operatingExpenses?.accounts || []);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Profit_and_Loss_${selectedRange[0]}_to_${selectedRange[1]}.csv`;
    link.click();
  };

  // KPI calculations
  const totalRevenue = pnl?.income?.totals?.total || 0;
  const totalCogs = pnl?.costOfSales?.totals?.total || 0;
  const grossProfit = pnl?.grossProfit?.total || 0;
  const netProfit = pnl?.netProfit?.total || 0;

  const grossMarginPct =
    totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0.0";
  const netMarginPct =
    totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  return (
    <div className="w-full min-h-full bg-slate-50/40 flex flex-col font-sans pb-12">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 1. TWO-TIER EXECUTIVE HEADER */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-slate-200/90 px-6 py-4 space-y-4 shrink-0 shadow-2xs">
        {/* Tier 1: Title, Breadcrumbs, Currency & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="hover:text-slate-800 transition-colors">Finance & Accounts</span>
              <span>/</span>
              <span className="hover:text-slate-800 transition-colors">Reports</span>
              <span>/</span>
              <span className="font-semibold text-slate-800">Profit & Loss</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5046e5]">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                Profit & Loss Statement
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  AED Base
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => refetch()}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition-colors cursor-pointer"
              title="Refresh statement"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#5046e5]" : ""}`} />
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => router.push(`/finance/general-ledger?from=${selectedRange[0]}&to=${selectedRange[1]}`)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>General Ledger</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Tier 2: Enhanced Modern Filter Toolbar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Year & Presets or Custom Dates */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/70 p-0.5 shadow-2xs">
              {YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => handleYearChange(y)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                    filterMode === "preset" && selectedYear === y
                      ? "bg-[#5046e5] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>

            {/* Quick Presets */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
              {[
                { id: "FULL_YEAR", label: "Full Year" },
                { id: "Q1", label: "Q1" },
                { id: "Q2", label: "Q2" },
                { id: "Q3", label: "Q3" },
                { id: "Q4", label: "Q4" },
                { id: "THIS_MONTH", label: "This Month" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetClick(p.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    filterMode === "preset" && activePreset === p.id && selectedMonth === "ALL"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Month Dropdown */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthSelect(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium shadow-2xs hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#5046e5]/20 cursor-pointer"
              >
                <option value="ALL">All Months</option>
                {MONTH_NAMES.map((m) => (
                  <option key={m.val} value={m.val}>
                    {m.name} ({m.val})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Custom Days Range Toggle Button */}
            <button
              type="button"
              onClick={() => setFilterMode(filterMode === "custom" ? "preset" : "custom")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${
                filterMode === "custom"
                  ? "bg-indigo-50 border-indigo-300 text-[#5046e5]"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
              <span>Custom Days</span>
            </button>
          </div>

          {/* Right: Active Date Bounds indicator */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Interval:</span>
              <span className="font-semibold text-slate-900 font-mono text-[11px]">
                {filterMode === "custom"
                  ? `${selectedRange[0]} → ${selectedRange[1]}`
                  : `${monthLabels[0] || ""} → ${monthLabels[monthLabels.length - 1] || ""}`}
              </span>
            </div>
          </div>
        </div>

        {/* Expandable Custom Days Bar */}
        {filterMode === "custom" && (
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                Custom Day Filter:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">From:</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-xs font-mono font-medium text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-400 focus:outline-hidden"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">To:</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-xs font-mono font-medium text-slate-800 shadow-2xs focus:ring-2 focus:ring-indigo-400 focus:outline-hidden"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCustomDays}
                className="px-3 py-1 rounded-md bg-[#5046e5] hover:bg-[#4338ca] text-white font-semibold text-xs shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Days</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetToPresets}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Back to standard presets</span>
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 2. FOUR HIGH-LEVEL EXECUTIVE METRIC KPI CARDS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Revenue */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Revenue
              </span>
              <div className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                AED {formatAed(totalRevenue)}
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                {pnl?.income?.accounts?.length || 0} active revenue streams
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Cost of Sales */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Cost of Sales (COGS)
              </span>
              <div className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                AED {formatAed(totalCogs)}
              </div>
              <span className="text-[11px] font-medium text-amber-600">
                {totalRevenue > 0 ? `${((totalCogs / totalRevenue) * 100).toFixed(1)}% of revenue` : "Direct cost"}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Gross Profit */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Gross Profit
              </span>
              <div className="text-xl font-extrabold text-emerald-600 font-mono tracking-tight">
                AED {formatAed(grossProfit)}
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                {grossMarginPct}% gross margin
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Net Profit */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Net Profit
              </span>
              <div
                className={`text-xl font-extrabold font-mono tracking-tight ${
                  netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                AED {formatAed(netProfit)}
              </div>
              <span
                className={`text-[11px] font-semibold px-1.5 py-0.5 rounded border ${
                  netProfit >= 0
                    ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                    : "text-rose-700 bg-rose-50 border-rose-100"
                }`}
              >
                {netMarginPct}% net margin
              </span>
            </div>
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                netProfit >= 0
                  ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                  : "bg-rose-50 border-rose-100 text-rose-600"
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 3. MAIN FULL-WIDTH PROFIT & LOSS STATEMENT TABLE */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="px-6 flex-1">
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/90 text-slate-600 font-semibold text-[11px] uppercase tracking-wider select-none">
                  <th className="py-3 px-6 min-w-[280px]">Account</th>
                  <th className="py-3 px-3 w-20 text-center">Trend</th>
                  <th className="py-3 px-4 text-right font-bold w-32 bg-slate-100/50">Totals</th>
                  {monthLabels.map((lbl) => (
                    <th key={lbl} className="py-3 px-4 text-right w-28 whitespace-nowrap">
                      {lbl}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={3 + monthLabels.length} className="px-6 py-24 text-center text-slate-400 text-xs">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#5046e5]" />
                        <span>Calculating Profit & Loss statement...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* ══════════ 41 INCOME SECTION ══════════ */}
                    <tr
                      onClick={() => toggleSection("income")}
                      className="bg-slate-50/70 border-b border-slate-200/70 font-bold text-slate-900 cursor-pointer select-none hover:bg-slate-100/70 transition-colors"
                    >
                      <td colSpan={3 + monthLabels.length} className="px-6 py-2.5">
                        <div className="flex items-center gap-2">
                          {collapsedSections["income"] ? (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="font-bold text-slate-900">41 Income</span>
                        </div>
                      </td>
                    </tr>

                    {!collapsedSections["income"] &&
                      pnl?.income?.accounts?.map((acc: any) => {
                        const sparkVals = monthKeys.map((k) => acc.monthly[k] || 0);
                        return (
                          <tr key={acc.id} className="hover:bg-slate-50/60 transition-colors group">
                            <td className="px-6 py-2.5 pl-12 text-slate-800 font-medium">
                              <button
                                type="button"
                                onClick={() => handleDrillDownToGL(acc.id, `${acc.code} ${acc.name}`)}
                                className="hover:text-[#5046e5] text-left transition-colors cursor-pointer"
                                title="Click to view in General Ledger"
                              >
                                <span className="font-mono text-slate-500 mr-2">{acc.code}</span>
                                <span>{acc.name}</span>
                              </button>
                            </td>

                            {/* Trend Sparkline */}
                            <td className="px-3 py-2.5 text-center">
                              <PnlSparkline values={sparkVals} />
                            </td>

                            {/* Total Amount Cell with Hover Popover + Direct Click */}
                            <td
                              className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 bg-slate-50/40 cursor-pointer hover:bg-indigo-50/60 hover:text-[#5046e5] transition-colors"
                              onClick={() => handleDrillDownToGL(acc.id, `${acc.code} ${acc.name}`)}
                              onMouseEnter={(e) =>
                                handleCellMouseEnter(
                                  e,
                                  acc.topEntriesTotal,
                                  acc.name,
                                  acc.code,
                                  acc.total,
                                  `${monthLabels[0]} → ${monthLabels[monthLabels.length - 1]}`
                                )
                              }
                              onMouseLeave={handleCellMouseLeave}
                            >
                              {acc.total !== 0 ? acc.total.toFixed(2) : "0.00"}
                            </td>

                            {/* Monthly Amounts Cells */}
                            {monthKeys.map((k, mIdx) => {
                              const val = acc.monthly[k] || 0;
                              const entriesForMonth = acc.topEntriesByMonth?.[k] || [];
                              return (
                                <td
                                  key={k}
                                  className="px-4 py-2.5 text-right font-mono text-slate-700 cursor-pointer hover:bg-indigo-50/60 hover:text-[#5046e5] transition-colors"
                                  onClick={() => handleDrillDownToGL(acc.id, `${acc.code} ${acc.name}`)}
                                  onMouseEnter={(e) =>
                                    handleCellMouseEnter(
                                      e,
                                      entriesForMonth,
                                      acc.name,
                                      acc.code,
                                      val,
                                      monthLabels[mIdx]
                                    )
                                  }
                                  onMouseLeave={handleCellMouseLeave}
                                >
                                  {val !== 0 ? val.toFixed(2) : "0.00"}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}

                    {/* Total Income Row */}
                    <tr className="border-t border-dashed border-slate-300 font-bold bg-slate-50/30">
                      <td className="px-6 py-2.5 text-slate-900">Total Income</td>
                      <td className="px-3 py-2.5 text-center">
                        <PnlSparkline values={monthKeys.map((k) => pnl?.income?.totals?.monthly?.[k] || 0)} />
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono bg-slate-50/60 text-slate-900">
                        {(pnl?.income?.totals?.total || 0).toFixed(2)}
                      </td>
                      {monthKeys.map((k) => (
                        <td key={k} className="px-4 py-2.5 text-right font-mono text-slate-900">
                          {(pnl?.income?.totals?.monthly?.[k] || 0).toFixed(2)}
                        </td>
                      ))}
                    </tr>

                    {/* ══════════ 51 COST OF SALES SECTION ══════════ */}
                    <tr
                      onClick={() => toggleSection("cogs")}
                      className="bg-slate-50/70 border-b border-slate-200/70 font-bold text-slate-900 cursor-pointer select-none hover:bg-slate-100/70 transition-colors"
                    >
                      <td colSpan={3 + monthLabels.length} className="px-6 py-2.5">
                        <div className="flex items-center gap-2">
                          {collapsedSections["cogs"] ? (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="font-bold text-slate-900">51 Cost of Sales</span>
                        </div>
                      </td>
                    </tr>

                    {!collapsedSections["cogs"] &&
                      pnl?.costOfSales?.accounts?.map((acc: any) => (
                        <tr key={acc.id} className="hover:bg-slate-50/60 transition-colors group">
                          <td className="px-6 py-2.5 pl-12 text-slate-800 font-medium">
                            <button
                              type="button"
                              onClick={() => handleDrillDownToGL(acc.id, `${acc.code} ${acc.name}`)}
                              className="hover:text-[#5046e5] text-left transition-colors cursor-pointer"
                            >
                              <span className="font-mono text-slate-500 mr-2">{acc.code}</span>
                              <span>{acc.name}</span>
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <PnlSparkline values={monthKeys.map((k) => acc.monthly[k] || 0)} color="#f59e0b" />
                          </td>
                          <td
                            className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 bg-slate-50/40 cursor-pointer hover:bg-indigo-50/60"
                            onClick={() => handleDrillDownToGL(acc.id, `${acc.code} ${acc.name}`)}
                            onMouseEnter={(e) =>
                              handleCellMouseEnter(
                                e,
                                acc.topEntriesTotal,
                                acc.name,
                                acc.code,
                                acc.total,
                                `${monthLabels[0]} → ${monthLabels[monthLabels.length - 1]}`
                              )
                            }
                            onMouseLeave={handleCellMouseLeave}
                          >
                            {acc.total !== 0 ? acc.total.toFixed(2) : "0.00"}
                          </td>
                          {monthKeys.map((k, mIdx) => {
                            const val = acc.monthly[k] || 0;
                            return (
                              <td
                                key={k}
                                className="px-4 py-2.5 text-right font-mono text-slate-700 cursor-pointer hover:bg-indigo-50/60"
                                onClick={() => handleDrillDownToGL(acc.id, `${acc.code} ${acc.name}`)}
                                onMouseEnter={(e) =>
                                  handleCellMouseEnter(
                                    e,
                                    acc.topEntriesByMonth?.[k] || [],
                                    acc.name,
                                    acc.code,
                                    val,
                                    monthLabels[mIdx]
                                  )
                                }
                                onMouseLeave={handleCellMouseLeave}
                              >
                                {val !== 0 ? val.toFixed(2) : "0.00"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                    {/* Gross Profit Summary Row */}
                    <tr className="bg-slate-100/70 font-bold border-y-2 border-slate-300">
                      <td className="px-6 py-3 text-slate-900 font-bold">Gross Profit</td>
                      <td className="px-3 py-3 text-center">
                        <PnlSparkline values={monthKeys.map((k) => pnl?.grossProfit?.monthly?.[k] || 0)} color="#10b981" />
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold bg-slate-200/50 text-slate-900">
                        {(pnl?.grossProfit?.total || 0).toFixed(2)}
                      </td>
                      {monthKeys.map((k) => (
                        <td key={k} className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {(pnl?.grossProfit?.monthly?.[k] || 0).toFixed(2)}
                        </td>
                      ))}
                    </tr>

                    {/* ══════════ 52 OPERATING EXPENSES SECTION ══════════ */}
                    <tr
                      onClick={() => toggleSection("expenses")}
                      className="bg-slate-50/70 border-b border-slate-200/70 font-bold text-slate-900 cursor-pointer select-none hover:bg-slate-100/70 transition-colors"
                    >
                      <td colSpan={3 + monthLabels.length} className="px-6 py-2.5">
                        <div className="flex items-center gap-2">
                          {collapsedSections["expenses"] ? (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="font-bold text-slate-900">52 Operating Expenses</span>
                        </div>
                      </td>
                    </tr>

                    {!collapsedSections["expenses"] &&
                      pnl?.operatingExpenses?.accounts?.map((acc: any) => {
                        const sparkVals = monthKeys.map((k) => acc.monthly[k] || 0);
                        return (
                          <tr key={acc.id} className="hover:bg-slate-50/60 transition-colors group">
                            <td className="px-6 py-2.5 pl-12 text-slate-800 font-medium">
                              <button
                                type="button"
                                onClick={() => handleDrillDownToGL(acc.id, `${acc.code} ${acc.name}`)}
                                className="hover:text-[#5046e5] text-left transition-colors cursor-pointer"
                              >
                                <span className="font-mono text-slate-500 mr-2">{acc.code}</span>
                                <span>{acc.name}</span>
                              </button>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <PnlSparkline values={sparkVals} color="#ef4444" />
                            </td>
                            <td
                              className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 bg-slate-50/40 cursor-pointer hover:bg-indigo-50/60 hover:text-[#5046e5]"
                              onClick={() => handleDrillDownToGL(acc.id, `${acc.code} ${acc.name}`)}
                              onMouseEnter={(e) =>
                                handleCellMouseEnter(
                                  e,
                                  acc.topEntriesTotal,
                                  acc.name,
                                  acc.code,
                                  acc.total,
                                  `${monthLabels[0]} → ${monthLabels[monthLabels.length - 1]}`
                                )
                              }
                              onMouseLeave={handleCellMouseLeave}
                            >
                              {acc.total !== 0 ? `-${Math.abs(acc.total).toFixed(2)}` : "0.00"}
                            </td>
                            {monthKeys.map((k, mIdx) => {
                              const val = acc.monthly[k] || 0;
                              return (
                                <td
                                  key={k}
                                  className="px-4 py-2.5 text-right font-mono text-slate-700 cursor-pointer hover:bg-indigo-50/60 hover:text-[#5046e5]"
                                  onClick={() => handleDrillDownToGL(acc.id, `${acc.code} ${acc.name}`)}
                                  onMouseEnter={(e) =>
                                    handleCellMouseEnter(
                                      e,
                                      acc.topEntriesByMonth?.[k] || [],
                                      acc.name,
                                      acc.code,
                                      val,
                                      monthLabels[mIdx]
                                    )
                                  }
                                  onMouseLeave={handleCellMouseLeave}
                                >
                                  {val !== 0 ? `-${Math.abs(val).toFixed(2)}` : "0.00"}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}

                    {/* Total Operating Expenses Row */}
                    <tr className="border-t border-dashed border-slate-300 font-bold bg-slate-50/30">
                      <td className="px-6 py-2.5 text-slate-900">Total Operating Expenses</td>
                      <td className="px-3 py-2.5 text-center">
                        <PnlSparkline values={monthKeys.map((k) => pnl?.operatingExpenses?.totals?.monthly?.[k] || 0)} color="#ef4444" />
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono bg-slate-50/60 text-slate-900">
                        -{Math.abs(pnl?.operatingExpenses?.totals?.total || 0).toFixed(2)}
                      </td>
                      {monthKeys.map((k) => (
                        <td key={k} className="px-4 py-2.5 text-right font-mono text-slate-900">
                          -{Math.abs(pnl?.operatingExpenses?.totals?.monthly?.[k] || 0).toFixed(2)}
                        </td>
                      ))}
                    </tr>

                    {/* Operating Profit Row */}
                    <tr className="bg-slate-100/70 font-bold border-y-2 border-slate-300">
                      <td className="px-6 py-3 text-slate-900 font-bold">Operating Profit</td>
                      <td className="px-3 py-3 text-center">
                        <PnlSparkline values={monthKeys.map((k) => pnl?.operatingProfit?.monthly?.[k] || 0)} color="#6366f1" />
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold bg-slate-200/50 text-slate-900">
                        {(pnl?.operatingProfit?.total || 0).toFixed(2)}
                      </td>
                      {monthKeys.map((k) => (
                        <td key={k} className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {(pnl?.operatingProfit?.monthly?.[k] || 0).toFixed(2)}
                        </td>
                      ))}
                    </tr>

                    {/* ══════════ NET PROFIT FINAL ROW ══════════ */}
                    <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-900">
                      <td className="px-6 py-4 text-white font-extrabold text-sm tracking-tight">
                        Net Profit
                      </td>
                      <td className="px-3 py-4 text-center">
                        <PnlSparkline values={monthKeys.map((k) => pnl?.netProfit?.monthly?.[k] || 0)} color="#38bdf8" />
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-bold bg-slate-800 text-emerald-400 text-sm">
                        {formatAed(pnl?.netProfit?.total || 0)}
                      </td>
                      {monthKeys.map((k) => (
                        <td key={k} className="px-4 py-4 text-right font-mono font-bold text-emerald-400">
                          {formatAed(pnl?.netProfit?.monthly?.[k] || 0)}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Hover Popover */}
      {hoverState && hoverState.visible && (
        <div
          className="fixed z-50"
          style={{ left: hoverState.x, top: hoverState.y }}
          onMouseEnter={() => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          }}
          onMouseLeave={handleCellMouseLeave}
        >
          <PnlHoverPopover
            entries={hoverState.entries}
            accountName={hoverState.accountName}
            accountCode={hoverState.accountCode}
            totalAmount={hoverState.totalAmount}
            periodLabel={hoverState.periodLabel}
            onExpand={() => {
              setModalState({
                isOpen: true,
                entries: hoverState.entries,
                accountName: hoverState.accountName,
                accountCode: hoverState.accountCode,
                totalAmount: hoverState.totalAmount,
                periodLabel: hoverState.periodLabel,
              });
              setHoverState(null);
            }}
            onNavigateSource={handleNavigateSource}
          />
        </div>
      )}

      {/* Top Entries Split Drilldown Modal */}
      {modalState && modalState.isOpen && (
        <TopEntriesDrilldownModal
          isOpen={true}
          onClose={() => setModalState(null)}
          entries={modalState.entries}
          accountName={modalState.accountName}
          accountCode={modalState.accountCode}
          totalAmount={modalState.totalAmount}
          periodLabel={modalState.periodLabel}
          onNavigateSource={handleNavigateSource}
          onViewFullJournal={handleViewFullJournal}
        />
      )}

      {/* Full Journal Entry Modal if triggered from modal */}
      {fullJournalEntry && (
        <JournalDetailsModal
          isOpen={true}
          entry={fullJournalEntry}
          onClose={() => setFullJournalEntry(null)}
        />
      )}
    </div>
  );
}
