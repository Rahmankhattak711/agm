"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { formatAed } from "@/lib/utils/format";
import { TimelineMonthSlider, MonthItem } from "../../general-ledger/components/TimelineMonthSlider";
import { PnlSparkline } from "./components/PnlSparkline";
import { PnlHoverPopover, TopEntryItem } from "./components/PnlHoverPopover";
import { TopEntriesDrilldownModal } from "./components/TopEntriesDrilldownModal";
import { JournalDetailsModal } from "../../journal-entries/components/JournalDetailsModal";
import {
  Download,
  Calendar,
  Filter,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Coins,
} from "lucide-react";

// Full 2025 to 2026 months for timeline scrubber
const TIMELINE_MONTHS: MonthItem[] = [
  { key: "2025-01", label: "Jan", year: 2025 },
  { key: "2025-02", label: "Feb", year: 2025 },
  { key: "2025-03", label: "Mar", year: 2025 },
  { key: "2025-04", label: "Apr", year: 2025 },
  { key: "2025-05", label: "May", year: 2025 },
  { key: "2025-06", label: "Jun", year: 2025 },
  { key: "2025-07", label: "Jul", year: 2025 },
  { key: "2025-08", label: "Aug", year: 2025 },
  { key: "2025-09", label: "Sep", year: 2025 },
  { key: "2025-10", label: "Oct", year: 2025 },
  { key: "2025-11", label: "Nov", year: 2025 },
  { key: "2025-12", label: "Dec", year: 2025 },
  { key: "2026-01", label: "Jan", year: 2026 },
  { key: "2026-02", label: "Feb", year: 2026 },
  { key: "2026-03", label: "Mar", year: 2026 },
  { key: "2026-04", label: "Apr", year: 2026 },
  { key: "2026-05", label: "May", year: 2026 },
  { key: "2026-06", label: "Jun", year: 2026 },
  { key: "2026-07", label: "Jul", year: 2026 },
  { key: "2026-08", label: "Aug", year: 2026 },
  { key: "2026-09", label: "Sep", year: 2026 },
  { key: "2026-10", label: "Oct", year: 2026 },
  { key: "2026-11", label: "Nov", year: 2026 },
  { key: "2026-12", label: "Dec", year: 2026 },
];

export default function ProfitAndLossReportPage() {
  const router = useRouter();

  // Selected Month Range (Default Jul 2026 to Oct 2026 matching Image 1)
  const [selectedRange, setSelectedRange] = useState<[string, string]>([
    "2026-07",
    "2026-10",
  ]);

  // Collapsed sections state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Hover Popover State (Image 2)
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

  // Drilldown Split Modal State (Image 3)
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

  // Warm up target routes for instantaneous page navigation
  useEffect(() => {
    router.prefetch("/finance/general-ledger");
    router.prefetch("/finance/journal-entries");
    router.prefetch("/finance/accounts");
  }, [router]);

  // Fetch dynamic P&L report
  const { data: pnl, isLoading, refetch } = useQuery({
    queryKey: ["profit-and-loss", selectedRange],
    queryFn: async () => {
      const res = await fetch(
        `/api/finance/reports/profit-and-loss?from=${selectedRange[0]}&to=${selectedRange[1]}`
      );
      if (!res.ok) throw new Error("Failed to load P&L");
      return await res.json();
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const monthKeys: string[] = pnl?.monthKeys || ["2026-07", "2026-08", "2026-09", "2026-10"];
  const monthLabels: string[] = pnl?.monthLabels || ["Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026"];

  // Direct Drill Down to General Ledger (Image 5)
  const handleDrillDownToGL = (accountId: string, accountName: string) => {
    router.push(
      `/finance/general-ledger?accountId=${accountId}&accountName=${encodeURIComponent(
        accountName
      )}&from=${selectedRange[0]}&to=${selectedRange[1]}`
    );
  };

  // Smart source document navigation (Image 4)
  const handleNavigateSource = (entry: TopEntryItem) => {
    if (entry.sourceUrl) {
      router.push(entry.sourceUrl);
    } else {
      router.push(`/finance/journal-entries?search=${encodeURIComponent(entry.journalNumber)}`);
    }
  };

  // View full journal entry
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

    // Center popover horizontally on hovered cell
    let x = rect.left + rect.width / 2 - popoverWidth / 2;
    // Keep within horizontal bounds so popover is NEVER clipped on right edge
    if (x + popoverWidth > window.innerWidth - padding) {
      x = window.innerWidth - popoverWidth - padding;
    }
    if (x < padding) {
      x = padding;
    }

    // Keep within vertical bounds - flip above if overflowing viewport bottom
    let y = rect.bottom + 6;
    if (y + popoverHeight > window.innerHeight - padding) {
      y = Math.max(padding, rect.top - popoverHeight - 6);
    }

    // Prefetch general ledger drilldown immediately
    router.prefetch(
      `/finance/general-ledger?accountId=${accCode}&from=${selectedRange[0]}&to=${selectedRange[1]}`
    );

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
    }, 140);
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

    addCat("41 Income", pnl.income.accounts);
    addCat("51 Cost of Sales", pnl.costOfSales.accounts);
    addCat("52 Operating Expenses", pnl.operatingExpenses.accounts);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Profit_and_Loss_${selectedRange[0]}_to_${selectedRange[1]}.csv`;
    link.click();
  };

  return (
    <div className="w-full min-h-full bg-white flex flex-col">
      {/* 1. Sleek Modern Header matching Wafeq Screenshot 1 */}
      <div className="w-full bg-white px-6 pt-4 pb-3 space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Reports</span>
            <span className="text-slate-400">&gt;</span>
            <span className="text-slate-900 font-bold text-sm tracking-tight">
              Profit and Loss
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* 2. Control Badges Pill Bar matching Image 1 */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
          {/* Compare Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium shadow-2xs">
            <span className="text-slate-400">Compare:</span>
            <span className="font-semibold text-slate-900">Month</span>
          </div>

          {/* Date Range Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Date:</span>
            <span className="font-semibold text-slate-900 font-mono">
              {monthLabels[0]} &rarr; {monthLabels[monthLabels.length - 1]}
            </span>
          </div>

          {/* Currency Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium shadow-2xs">
            <Coins className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Figures in:</span>
            <span className="font-bold text-slate-900">AED</span>
          </div>

          {/* Add Filter */}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>+ Add filter</span>
          </button>
        </div>

        {/* 3. Interactive Timeline Month Slider */}
        <TimelineMonthSlider
          months={TIMELINE_MONTHS}
          selectedRange={selectedRange}
          onChange={setSelectedRange}
        />
      </div>

      {/* 4. Main Full-Viewport P&L Table with Interactive Drilldown matching Image 1 */}
      <div className="w-full border-t border-slate-200/90 flex-1 bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[980px]">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/90 text-slate-600 font-semibold text-[11px] uppercase tracking-wider select-none">
              <th className="py-3 px-6 min-w-[300px]">Account</th>
              <th className="py-3 px-3 w-20 text-center">Trend</th>
              <th className="py-3 px-4 text-right font-bold w-32 bg-slate-100/50">Totals</th>
              {monthLabels.map((lbl) => (
                <th key={lbl} className="py-3 px-4 text-right w-28">
                  {lbl}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={3 + monthLabels.length} className="px-6 py-20 text-center text-slate-400 text-xs">
                  Calculating Profit & Loss statement...
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
                      <span>41 Income</span>
                    </div>
                  </td>
                </tr>

                {!collapsedSections["income"] &&
                  pnl?.income.accounts.map((acc: any) => {
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
                    <PnlSparkline values={monthKeys.map((k) => pnl?.income.totals.monthly[k] || 0)} />
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono bg-slate-50/60 text-slate-900">
                    {pnl?.income.totals.total.toFixed(2)}
                  </td>
                  {monthKeys.map((k) => (
                    <td key={k} className="px-4 py-2.5 text-right font-mono text-slate-900">
                      {(pnl?.income.totals.monthly[k] || 0).toFixed(2)}
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
                      <span>51 Cost of Sales</span>
                    </div>
                  </td>
                </tr>

                {!collapsedSections["cogs"] &&
                  pnl?.costOfSales.accounts.map((acc: any) => (
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
                <tr className="bg-slate-100/60 font-bold border-y-2 border-slate-300">
                  <td className="px-6 py-3 text-slate-900 font-bold">Gross Profit</td>
                  <td className="px-3 py-3 text-center">
                    <PnlSparkline values={monthKeys.map((k) => pnl?.grossProfit.monthly[k] || 0)} color="#10b981" />
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold bg-slate-200/50 text-slate-900">
                    {pnl?.grossProfit.total.toFixed(2)}
                  </td>
                  {monthKeys.map((k) => (
                    <td key={k} className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {(pnl?.grossProfit.monthly[k] || 0).toFixed(2)}
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
                      <span>52 Operating Expenses</span>
                    </div>
                  </td>
                </tr>

                {!collapsedSections["expenses"] &&
                  pnl?.operatingExpenses.accounts.map((acc: any) => {
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
                    <PnlSparkline values={monthKeys.map((k) => pnl?.operatingExpenses.totals.monthly[k] || 0)} color="#ef4444" />
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono bg-slate-50/60 text-slate-900">
                    -{Math.abs(pnl?.operatingExpenses.totals.total || 0).toFixed(2)}
                  </td>
                  {monthKeys.map((k) => (
                    <td key={k} className="px-4 py-2.5 text-right font-mono text-slate-900">
                      -{(pnl?.operatingExpenses.totals.monthly[k] || 0).toFixed(2)}
                    </td>
                  ))}
                </tr>

                {/* Operating Profit Row */}
                <tr className="bg-slate-100/60 font-bold border-y-2 border-slate-300">
                  <td className="px-6 py-3 text-slate-900 font-bold">Operating Profit</td>
                  <td className="px-3 py-3 text-center">
                    <PnlSparkline values={monthKeys.map((k) => pnl?.operatingProfit.monthly[k] || 0)} color="#6366f1" />
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold bg-slate-200/50 text-slate-900">
                    {pnl?.operatingProfit.total.toFixed(2)}
                  </td>
                  {monthKeys.map((k) => (
                    <td key={k} className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {(pnl?.operatingProfit.monthly[k] || 0).toFixed(2)}
                    </td>
                  ))}
                </tr>

                {/* ══════════ NET PROFIT FINAL ROW ══════════ */}
                <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-900">
                  <td className="px-6 py-3.5">Net Profit</td>
                  <td className="px-3 py-3.5 text-center">
                    <PnlSparkline values={monthKeys.map((k) => pnl?.netProfit.monthly[k] || 0)} color="#38bdf8" />
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold bg-slate-800 text-emerald-400 text-sm">
                    {formatAed(pnl?.netProfit.total || 0)}
                  </td>
                  {monthKeys.map((k) => (
                    <td key={k} className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400">
                      {formatAed(pnl?.netProfit.monthly[k] || 0)}
                    </td>
                  ))}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Hover Popover (Image 2) */}
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

      {/* Top Entries Split Drilldown Modal (Image 3) */}
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
