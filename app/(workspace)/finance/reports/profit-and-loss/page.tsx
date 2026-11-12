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
  ChevronLeft,
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

  const allMonthKeys: string[] = pnl?.monthKeys || ["2026-01", "2026-02", "2026-03"];
  const allMonthLabels: string[] = pnl?.monthLabels || ["Jan 2026", "Feb 2026", "Mar 2026"];

  // Only show month column(s) when a specific month (or quarter) filter is active, not in Full Year
  const showMonthColumns =
    filterMode === "preset" && (selectedMonth !== "ALL" || activePreset !== "FULL_YEAR");
  const monthKeys: string[] = showMonthColumns ? allMonthKeys : [];
  const monthLabels: string[] = showMonthColumns ? allMonthLabels : [];

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
    <div className="w-full min-h-full bg-white text-slate-700 font-sans px-4 sm:px-5 py-3.5 space-y-3.5 select-none">
      {/* =========================================================================
          1. CLEAN COMPACT TOP HEADER (MATCHING FIXED ASSETS & COA)
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 print:hidden">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => router.push("/finance/reports")}
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shrink-0"
            style={{ border: "1px solid #cbd5e1" }}
            title="Back to Reports"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#eff6ff",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
            }}
          >
            <TrendingUp className="w-4 h-4" />
          </div>

          <h1 className="text-base sm:text-[17px] font-semibold tracking-tight text-slate-800 flex items-center gap-2">
            <span>Profit &amp; Loss Statement</span>
            <span
              className="text-[10px] font-normal px-2 py-0.5 rounded-full font-mono"
              style={{
                backgroundColor: "#f8fafc",
                color: "#475569",
                border: "1px solid #cbd5e1",
              }}
            >
              AED Base
            </span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
            className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh statement"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-blue-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
            className="px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 text-[11.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Report</span>
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/finance/general-ledger?from=${selectedRange[0]}&to=${selectedRange[1]}`
              )
            }
            style={{
              backgroundColor: "#1d4ed8",
              color: "#ffffff",
              border: "1px solid #1e40af",
            }}
            className="px-3.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>General Ledger</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. SOFT LIGHT-BLUE TINTED PERIOD & FILTER BAR
          ========================================================================= */}
      <div
        className="rounded-xl p-3 space-y-2.5 print:hidden"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Left: Year & Presets */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector */}
            <div
              className="inline-flex rounded-lg p-0.5 gap-0.5"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
              }}
            >
              {YEARS.map((y) => {
                const isActive = filterMode === "preset" && selectedYear === y;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => handleYearChange(y)}
                    style={
                      isActive
                        ? { backgroundColor: "#1d4ed8", color: "#ffffff" }
                        : { backgroundColor: "transparent", color: "#475569" }
                    }
                    className="px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer font-mono"
                  >
                    {y}
                  </button>
                );
              })}
            </div>

            {/* Quick Presets */}
            <div
              className="inline-flex flex-wrap rounded-lg p-0.5 gap-0.5"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
              }}
            >
              {[
                { id: "FULL_YEAR", label: "Full Year" },
                { id: "Q1", label: "Q1" },
                { id: "Q2", label: "Q2" },
                { id: "Q3", label: "Q3" },
                { id: "Q4", label: "Q4" },
                { id: "THIS_MONTH", label: "This Month" },
              ].map((p) => {
                const isActive =
                  filterMode === "preset" &&
                  activePreset === p.id &&
                  selectedMonth === "ALL";
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetClick(p.id)}
                    style={
                      isActive
                        ? { backgroundColor: "#1d4ed8", color: "#ffffff" }
                        : { backgroundColor: "transparent", color: "#475569" }
                    }
                    className="px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer"
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Month Dropdown */}
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthSelect(e.target.value)}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
              }}
              className="px-2.5 py-1.5 rounded-lg text-slate-700 text-xs font-normal outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">All Months</option>
              {MONTH_NAMES.map((m) => (
                <option key={m.val} value={m.val}>
                  {m.name} ({m.val})
                </option>
              ))}
            </select>

            {/* Custom Days Range Toggle Button */}
            <button
              type="button"
              onClick={() =>
                setFilterMode(filterMode === "custom" ? "preset" : "custom")
              }
              style={
                filterMode === "custom"
                  ? {
                      backgroundColor: "#eff6ff",
                      color: "#1d4ed8",
                      border: "1px solid #93c5fd",
                    }
                  : {
                      backgroundColor: "#ffffff",
                      color: "#475569",
                      border: "1px solid #cbd5e1",
                    }
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors cursor-pointer"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Custom Days</span>
            </button>
          </div>

          {/* Right: Active Date Bounds indicator */}
          <div className="flex items-center gap-2">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-slate-700 font-normal"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #cbd5e1",
              }}
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 text-[11px]">Interval:</span>
              <span
                className="font-medium font-mono text-[11px]"
                style={{ color: "#1d4ed8" }}
              >
                {filterMode === "custom"
                  ? `${selectedRange[0]} → ${selectedRange[1]}`
                  : allMonthLabels.length === 1
                  ? allMonthLabels[0]
                  : `${allMonthLabels[0] || ""} → ${
                      allMonthLabels[allMonthLabels.length - 1] || ""
                    }`}
              </span>
            </div>
          </div>
        </div>

        {/* Expandable Custom Days Bar */}
        {filterMode === "custom" && (
          <div
            className="p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
            }}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                Custom Date Filter:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-normal">From:</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  style={{ border: "1px solid #cbd5e1" }}
                  className="px-2.5 py-1 rounded-lg bg-white text-xs font-mono font-normal text-slate-800 outline-none focus:border-blue-600"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-normal">To:</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  style={{ border: "1px solid #cbd5e1" }}
                  className="px-2.5 py-1 rounded-lg bg-white text-xs font-mono font-normal text-slate-800 outline-none focus:border-blue-600"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCustomDays}
                style={{
                  backgroundColor: "#1d4ed8",
                  color: "#ffffff",
                  border: "1px solid #1e40af",
                }}
                className="px-3 py-1 rounded-lg font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Days</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetToPresets}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-normal"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Back to standard presets</span>
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          3. FOUR COMPACT PASTEL KPI CARDS (LIGHT COLOR + CLEAR BORDERS)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        {/* Card 1: Total Revenue (Soft Slate-Blue) */}
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
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              TOTAL REVENUE
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
              {formatAed(totalRevenue)}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block">
              {pnl?.income?.accounts?.length || 0} active revenue streams
            </span>
          </div>
        </div>

        {/* Card 2: Cost of Sales (Soft Warm Yellow/Amber) */}
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
            <Coins className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              COST OF SALES (COGS)
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
              {formatAed(totalCogs)}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block">
              {totalRevenue > 0
                ? `${((totalCogs / totalRevenue) * 100).toFixed(1)}% of revenue`
                : "Direct cost"}
            </span>
          </div>
        </div>

        {/* Card 3: Gross Profit (Soft Mint/Green) */}
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
              GROSS PROFIT
            </span>
            <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block whitespace-nowrap">
              {formatAed(grossProfit)}
            </span>
            <span className="text-[10.5px] font-normal text-emerald-700 block">
              {grossMarginPct}% gross margin
            </span>
          </div>
        </div>

        {/* Card 4: Net Profit (Soft Rose/Pink) */}
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
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
              NET PROFIT
            </span>
            <span
              className={`text-sm sm:text-[15px] font-semibold leading-snug block whitespace-nowrap ${
                netProfit >= 0 ? "text-slate-800" : "text-rose-700"
              }`}
            >
              {formatAed(netProfit)}
            </span>
            <span className="text-[10.5px] font-normal text-slate-500 block">
              {netMarginPct}% net margin
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. MAIN PROFIT & LOSS STATEMENT TABLE CARD
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
          <h3 className="text-xs font-semibold text-slate-800">
            Statement of Profit &amp; Loss
          </h3>
          <span className="text-[11px] font-normal text-slate-500">
            Click any account or amount to inspect General Ledger entries
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className={`w-full text-left border-collapse ${showMonthColumns ? "min-w-[680px]" : ""}`}>
            <thead>
              <tr
                className="bg-white text-[9.5px] font-medium uppercase tracking-wider text-slate-500 select-none"
                style={{ borderBottom: "1px solid #e2e8f0" }}
              >
                <th className="py-2.5 px-5 min-w-[260px]">ACCOUNT</th>
                <th className="py-2.5 px-3 w-24 text-center">TREND</th>
                <th className="py-2.5 px-5 text-right font-medium w-40 bg-slate-50/70 text-slate-700">
                  TOTALS (AED)
                </th>
                {monthLabels.map((lbl) => (
                  <th key={lbl} className="py-2.5 px-4 text-right w-32 whitespace-nowrap">
                    {lbl}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-xs">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={3 + monthLabels.length}
                    className="px-6 py-16 text-center text-slate-400 text-xs"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                      <span className="font-normal">
                        Calculating Profit &amp; Loss statement...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {/* ══════════ 41 INCOME SECTION ══════════ */}
                  <tr
                    onClick={() => toggleSection("income")}
                    style={{
                      backgroundColor: "#f0fdf4",
                      borderBottom: "1px solid #dcfce7",
                    }}
                    className="font-medium text-slate-800 cursor-pointer select-none transition-colors"
                  >
                    <td colSpan={3 + monthLabels.length} className="px-5 py-2">
                      <div className="flex items-center gap-2">
                        {collapsedSections["income"] ? (
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
                        )}
                        <span className="font-semibold text-emerald-900 text-xs">
                          41 Income / Revenue
                        </span>
                      </div>
                    </td>
                  </tr>

                  {!collapsedSections["income"] &&
                    pnl?.income?.accounts?.map((acc: any) => {
                      const sparkVals = allMonthKeys.map((k) => acc.monthly[k] || 0);
                      return (
                        <tr
                          key={acc.id}
                          className="hover:bg-slate-50 transition-colors group"
                        >
                          <td className="px-5 py-2.5 pl-10 text-slate-700 font-normal">
                            <button
                              type="button"
                              onClick={() =>
                                handleDrillDownToGL(acc.id, `${acc.code} ${acc.name}`)
                              }
                              className="hover:text-blue-700 text-left transition-colors cursor-pointer"
                              title="Click to view in General Ledger"
                            >
                              <span
                                className="font-mono font-medium mr-2"
                                style={{ color: "#1d4ed8" }}
                              >
                                {acc.code}
                              </span>
                              <span>{acc.name}</span>
                            </button>
                          </td>

                          {/* Trend Sparkline */}
                          <td className="px-3 py-2.5 text-center">
                            <PnlSparkline values={sparkVals} />
                          </td>

                          {/* Total Amount Cell */}
                          <td
                            className="px-4 py-2.5 text-right font-mono font-medium text-slate-800 bg-slate-50/40 cursor-pointer hover:bg-blue-50/60 hover:text-blue-700 transition-colors"
                            onClick={() =>
                              handleDrillDownToGL(acc.id, `${acc.code} ${acc.name}`)
                            }
                            onMouseEnter={(e) =>
                              handleCellMouseEnter(
                                e,
                                acc.topEntriesTotal,
                                acc.name,
                                acc.code,
                                acc.total,
                                `${allMonthLabels[0]} → ${
                                  allMonthLabels[allMonthLabels.length - 1]
                                }`
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
                                className="px-4 py-2.5 text-right font-mono font-normal text-slate-600 cursor-pointer hover:bg-blue-50/60 hover:text-blue-700 transition-colors"
                                onClick={() =>
                                  handleDrillDownToGL(
                                    acc.id,
                                    `${acc.code} ${acc.name}`
                                  )
                                }
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
                  <tr className="border-t border-slate-200 font-semibold bg-slate-50/50">
                    <td className="px-5 py-2.5 text-slate-800">Total Income</td>
                    <td className="px-3 py-2.5 text-center">
                      <PnlSparkline
                        values={allMonthKeys.map(
                          (k) => pnl?.income?.totals?.monthly?.[k] || 0
                        )}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono bg-slate-100/60 text-slate-900">
                      {(pnl?.income?.totals?.total || 0).toFixed(2)}
                    </td>
                    {monthKeys.map((k) => (
                      <td
                        key={k}
                        className="px-4 py-2.5 text-right font-mono text-slate-800"
                      >
                        {(pnl?.income?.totals?.monthly?.[k] || 0).toFixed(2)}
                      </td>
                    ))}
                  </tr>

                  {/* ══════════ 51 COST OF SALES SECTION ══════════ */}
                  <tr
                    onClick={() => toggleSection("cogs")}
                    style={{
                      backgroundColor: "#fffbeb",
                      borderBottom: "1px solid #fef3c7",
                    }}
                    className="font-medium text-slate-800 cursor-pointer select-none transition-colors"
                  >
                    <td colSpan={3 + monthLabels.length} className="px-5 py-2">
                      <div className="flex items-center gap-2">
                        {collapsedSections["cogs"] ? (
                          <ChevronRight className="w-3.5 h-3.5 text-amber-700" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-amber-700" />
                        )}
                        <span className="font-semibold text-amber-900 text-xs">
                          51 Cost of Sales
                        </span>
                      </div>
                    </td>
                  </tr>

                  {!collapsedSections["cogs"] &&
                    pnl?.costOfSales?.accounts?.map((acc: any) => (
                      <tr
                        key={acc.id}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-5 py-2.5 pl-10 text-slate-700 font-normal">
                          <button
                            type="button"
                            onClick={() =>
                              handleDrillDownToGL(acc.id, `${acc.code} ${acc.name}`)
                            }
                            className="hover:text-blue-700 text-left transition-colors cursor-pointer"
                          >
                            <span
                              className="font-mono font-medium mr-2"
                              style={{ color: "#1d4ed8" }}
                            >
                              {acc.code}
                            </span>
                            <span>{acc.name}</span>
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <PnlSparkline
                            values={allMonthKeys.map((k) => acc.monthly[k] || 0)}
                            color="#f59e0b"
                          />
                        </td>
                        <td
                          className="px-4 py-2.5 text-right font-mono font-medium text-slate-800 bg-slate-50/40 cursor-pointer hover:bg-blue-50/60"
                          onClick={() =>
                            handleDrillDownToGL(acc.id, `${acc.code} ${acc.name}`)
                          }
                          onMouseEnter={(e) =>
                            handleCellMouseEnter(
                              e,
                              acc.topEntriesTotal,
                              acc.name,
                              acc.code,
                              acc.total,
                              `${allMonthLabels[0]} → ${
                                allMonthLabels[allMonthLabels.length - 1]
                              }`
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
                              className="px-4 py-2.5 text-right font-mono font-normal text-slate-600 cursor-pointer hover:bg-blue-50/60"
                              onClick={() =>
                                handleDrillDownToGL(
                                  acc.id,
                                  `${acc.code} ${acc.name}`
                                )
                              }
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
                  <tr
                    style={{
                      backgroundColor: "#f8fafc",
                      borderTop: "1px solid #cbd5e1",
                      borderBottom: "1px solid #cbd5e1",
                    }}
                    className="font-semibold"
                  >
                    <td className="px-5 py-2.5 text-slate-800">Gross Profit</td>
                    <td className="px-3 py-2.5 text-center">
                      <PnlSparkline
                        values={allMonthKeys.map(
                          (k) => pnl?.grossProfit?.monthly?.[k] || 0
                        )}
                        color="#10b981"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono bg-slate-100/70 text-slate-900">
                      {(pnl?.grossProfit?.total || 0).toFixed(2)}
                    </td>
                    {monthKeys.map((k) => (
                      <td
                        key={k}
                        className="px-4 py-2.5 text-right font-mono text-slate-800"
                      >
                        {(pnl?.grossProfit?.monthly?.[k] || 0).toFixed(2)}
                      </td>
                    ))}
                  </tr>

                  {/* ══════════ 52 OPERATING EXPENSES SECTION ══════════ */}
                  <tr
                    onClick={() => toggleSection("expenses")}
                    style={{
                      backgroundColor: "#fff1f2",
                      borderBottom: "1px solid #ffe4e6",
                    }}
                    className="font-medium text-slate-800 cursor-pointer select-none transition-colors"
                  >
                    <td colSpan={3 + monthLabels.length} className="px-5 py-2">
                      <div className="flex items-center gap-2">
                        {collapsedSections["expenses"] ? (
                          <ChevronRight className="w-3.5 h-3.5 text-rose-700" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-rose-700" />
                        )}
                        <span className="font-semibold text-rose-900 text-xs">
                          52 Operating Expenses
                        </span>
                      </div>
                    </td>
                  </tr>

                  {!collapsedSections["expenses"] &&
                    pnl?.operatingExpenses?.accounts?.map((acc: any) => {
                      const sparkVals = allMonthKeys.map((k) => acc.monthly[k] || 0);
                      return (
                        <tr
                          key={acc.id}
                          className="hover:bg-slate-50 transition-colors group"
                        >
                          <td className="px-5 py-2.5 pl-10 text-slate-700 font-normal">
                            <button
                              type="button"
                              onClick={() =>
                                handleDrillDownToGL(acc.id, `${acc.code} ${acc.name}`)
                              }
                              className="hover:text-blue-700 text-left transition-colors cursor-pointer"
                            >
                              <span
                                className="font-mono font-medium mr-2"
                                style={{ color: "#1d4ed8" }}
                              >
                                {acc.code}
                              </span>
                              <span>{acc.name}</span>
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <PnlSparkline values={sparkVals} color="#ef4444" />
                          </td>
                          <td
                            className="px-4 py-2.5 text-right font-mono font-medium text-slate-800 bg-slate-50/40 cursor-pointer hover:bg-blue-50/60 hover:text-blue-700"
                            onClick={() =>
                              handleDrillDownToGL(acc.id, `${acc.code} ${acc.name}`)
                            }
                            onMouseEnter={(e) =>
                              handleCellMouseEnter(
                                e,
                                acc.topEntriesTotal,
                                acc.name,
                                acc.code,
                                acc.total,
                                `${allMonthLabels[0]} → ${
                                  allMonthLabels[allMonthLabels.length - 1]
                                }`
                              )
                            }
                            onMouseLeave={handleCellMouseLeave}
                          >
                            {acc.total !== 0
                              ? Math.abs(acc.total).toFixed(2)
                              : "0.00"}
                          </td>
                          {monthKeys.map((k, mIdx) => {
                            const val = acc.monthly[k] || 0;
                            return (
                              <td
                                key={k}
                                className="px-4 py-2.5 text-right font-mono font-normal text-slate-600 cursor-pointer hover:bg-blue-50/60 hover:text-blue-700"
                                onClick={() =>
                                  handleDrillDownToGL(
                                    acc.id,
                                    `${acc.code} ${acc.name}`
                                  )
                                }
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
                                {val !== 0 ? Math.abs(val).toFixed(2) : "0.00"}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                  {/* Total Operating Expenses Row */}
                  <tr className="border-t border-slate-200 font-semibold bg-slate-50/50">
                    <td className="px-5 py-2.5 text-slate-800">
                      Total Operating Expenses
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <PnlSparkline
                        values={allMonthKeys.map(
                          (k) => pnl?.operatingExpenses?.totals?.monthly?.[k] || 0
                        )}
                        color="#ef4444"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono bg-slate-100/60 text-slate-900">
                      {Math.abs(pnl?.operatingExpenses?.totals?.total || 0).toFixed(2)}
                    </td>
                    {monthKeys.map((k) => (
                      <td
                        key={k}
                        className="px-4 py-2.5 text-right font-mono text-slate-800"
                      >
                        {Math.abs(
                          pnl?.operatingExpenses?.totals?.monthly?.[k] || 0
                        ).toFixed(2)}
                      </td>
                    ))}
                  </tr>

                  {/* Operating Profit Row */}
                  <tr
                    style={{
                      backgroundColor: "#f8fafc",
                      borderTop: "1px solid #cbd5e1",
                      borderBottom: "1px solid #cbd5e1",
                    }}
                    className="font-semibold"
                  >
                    <td className="px-5 py-2.5 text-slate-800">Operating Profit</td>
                    <td className="px-3 py-2.5 text-center">
                      <PnlSparkline
                        values={allMonthKeys.map(
                          (k) => pnl?.operatingProfit?.monthly?.[k] || 0
                        )}
                        color="#1d4ed8"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono bg-slate-100/70 text-slate-900">
                      {(pnl?.operatingProfit?.total || 0).toFixed(2)}
                    </td>
                    {monthKeys.map((k) => (
                      <td
                        key={k}
                        className="px-4 py-2.5 text-right font-mono text-slate-800"
                      >
                        {(pnl?.operatingProfit?.monthly?.[k] || 0).toFixed(2)}
                      </td>
                    ))}
                  </tr>

                  {/* ══════════ NET PROFIT FINAL ROW ══════════ */}
                  <tr
                    style={{
                      backgroundColor: "#eff6ff",
                      borderTop: "1.5px solid #93c5fd",
                    }}
                    className="font-semibold text-xs"
                  >
                    <td
                      className="px-5 py-3 font-semibold text-sm tracking-tight"
                      style={{ color: "#1d4ed8" }}
                    >
                      Net Profit / (Loss)
                    </td>
                    <td className="px-3 py-3 text-center">
                      <PnlSparkline
                        values={allMonthKeys.map(
                          (k) => pnl?.netProfit?.monthly?.[k] || 0
                        )}
                        color="#1d4ed8"
                      />
                    </td>
                    <td
                      className="px-4 py-3 text-right font-mono font-semibold text-sm"
                      style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}
                    >
                      {formatAed(pnl?.netProfit?.total || 0)}
                    </td>
                    {monthKeys.map((k) => (
                      <td
                        key={k}
                        className="px-4 py-3 text-right font-mono font-semibold text-slate-900"
                      >
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
