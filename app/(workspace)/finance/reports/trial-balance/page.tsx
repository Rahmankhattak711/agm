"use client";

import React, { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  SearchIcon,
  SparklesIcon,
  PrintIcon,
  FilterIcon,
  CalendarIcon,
  RefreshIcon,
  ArrowRightIcon,
  LayersIcon,
} from "@/components/icons";

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
  fxAdjustmentDebit: number;
  fxAdjustmentCredit: number;
  revaluedClosingDebit: number;
  revaluedClosingCredit: number;
  rollupOpeningDebit?: number;
  rollupOpeningCredit?: number;
  rollupMovementDebit?: number;
  rollupMovementCredit?: number;
  rollupClosingDebit?: number;
  rollupClosingCredit?: number;
  rollupRevaluedDebit?: number;
  rollupRevaluedCredit?: number;
}

export default function TrialBalancePage() {
  const router = useRouter();

  // Date Range (default Jul 2026 -> Oct 2026 matching Wafeq screenshot)
  const [fromDate, setFromDate] = useState("2026-07-01");
  const [toDate, setToDate] = useState("2026-10-31");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Hierarchy expansion state
  const [levelView, setLevelView] = useState<1 | 2>(2);
  const [collapsedParentIds, setCollapsedParentIds] = useState<Set<string>>(
    new Set(),
  );

  // Column Visibility Controls (Edit Columns modal/popover)
  const [showEditColumns, setShowEditColumns] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    opening: true,
    movements: true,
    closing: true,
    fx: true,
    revalued: true,
  });

  // Filter state
  const [search, setSearch] = useState("");
  const [selectedSubtype, setSelectedSubtype] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

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
  });

  // Toggle single parent expand/collapse
  const toggleParentCollapse = (id: string) => {
    setCollapsedParentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Level 1 vs 2 switch
  const handleLevelChange = (newLevel: 1 | 2) => {
    setLevelView(newLevel);
    if (newLevel === 1) {
      // Collapse all parents
      const allParentIds = new Set<string>();
      (data?.rows || []).forEach((r: TrialBalanceRow) => {
        if (r.hasChildren) allParentIds.add(r.id);
      });
      setCollapsedParentIds(allParentIds);
    } else {
      // Expand all
      setCollapsedParentIds(new Set());
    }
  };

  // Filtered rows & hierarchy sorting
  const rows: TrialBalanceRow[] = useMemo(() => {
    if (!data?.rows) return [];
    return data.rows;
  }, [data?.rows]);

  // Determine visibility of each row based on parent collapse state
  const displayedRows = useMemo(() => {
    return rows.filter((r) => {
      // If user searched, show matching rows directly
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          r.code.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.subtype.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedSubtype !== "ALL" && r.subtype !== selectedSubtype) {
        return false;
      }

      // Check if any ancestor is collapsed
      if (r.parentId) {
        let curParentId: string | null = r.parentId;
        while (curParentId) {
          if (collapsedParentIds.has(curParentId)) {
            return false;
          }
          const parentRow = rows.find((p) => p.id === curParentId);
          curParentId = parentRow ? parentRow.parentId : null;
        }
      }

      return true;
    });
  }, [rows, search, selectedSubtype, collapsedParentIds]);

  // Unique subtypes for filter
  const subtypes = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.subtype) set.add(r.subtype);
    });
    return Array.from(set);
  }, [rows]);

  // Drilldown to General Ledger
  const handleDrillDown = (row: TrialBalanceRow) => {
    router.push(
      `/finance/general-ledger?accountId=${row.id}&accountName=${encodeURIComponent(row.name)}&from=${fromDate}&to=${toDate}`,
    );
  };

  // Render number or Wafeq purple dash
  const renderAmount = (val?: number, isZeroDash = true) => {
    if (val === undefined || val === null || val === 0) {
      if (isZeroDash) {
        return (
          <span className="text-[#5e48e8] font-medium select-none text-center">
            —
          </span>
        );
      }
      return null;
    }
    return (
      <span className="text-[#5e48e8] font-mono font-medium text-xs">
        {val.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    );
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (!displayedRows || displayedRows.length === 0) return;
    const headers = [
      "Code",
      "Account Name",
      "Subclassification",
      "Opening Debit",
      "Opening Credit",
      "Movement Debit",
      "Movement Credit",
      "Closing Debit",
      "Closing Credit",
      "FX Adjustment Debit",
      "FX Adjustment Credit",
      "Revalued Closing Debit",
      "Revalued Closing Credit",
    ];

    const csvRows = displayedRows.map((r) => [
      `"${r.code}"`,
      `"${r.name}"`,
      `"${r.subtype}"`,
      r.openingDebit.toFixed(2),
      r.openingCredit.toFixed(2),
      r.movementDebit.toFixed(2),
      r.movementCredit.toFixed(2),
      r.closingDebit.toFixed(2),
      r.closingCredit.toFixed(2),
      r.fxAdjustmentDebit.toFixed(2),
      r.fxAdjustmentCredit.toFixed(2),
      r.revaluedClosingDebit.toFixed(2),
      r.revaluedClosingCredit.toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Trial_Balance_${fromDate}_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white min-h-screen text-slate-900 pb-16 flex flex-col font-sans">
      {/* 1. Top Header & Action Controls matching Wafeq Screenshot */}
      <div className="border-b border-slate-200/90 bg-white sticky top-0 z-30 px-8 py-3.5 flex items-center justify-between shadow-2xs">
        {/* Breadcrumb: Reports > Trial Balance */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => router.push("/finance/reports")}
            className="text-slate-500 hover:text-[#5e48e8] font-medium transition-colors"
          >
            Reports
          </button>
          <span className="text-slate-400">&gt;</span>
          <span className="text-slate-900 font-bold text-sm tracking-tight">
            Trial Balance
          </span>
        </div>

        {/* Right Action Icons: Refresh, Edit Columns, Export, Ask AI */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh Data"
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <RefreshIcon
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
          </button>

          {/* Edit columns with badge (1) */}
          <div className="relative">
            <button
              onClick={() => setShowEditColumns(!showEditColumns)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LayersIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit columns</span>
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                1
              </span>
            </button>

            {showEditColumns && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 text-xs space-y-2">
                <div className="font-bold text-slate-900 pb-1 border-b border-slate-100">
                  Visible Columns
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={visibleColumns.opening}
                    onChange={(e) =>
                      setVisibleColumns({
                        ...visibleColumns,
                        opening: e.target.checked,
                      })
                    }
                    className="rounded text-[#5e48e8] focus:ring-[#5e48e8]"
                  />
                  <span>Opening Balance</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={visibleColumns.movements}
                    onChange={(e) =>
                      setVisibleColumns({
                        ...visibleColumns,
                        movements: e.target.checked,
                      })
                    }
                    className="rounded text-[#5e48e8] focus:ring-[#5e48e8]"
                  />
                  <span>Movements</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={visibleColumns.closing}
                    onChange={(e) =>
                      setVisibleColumns({
                        ...visibleColumns,
                        closing: e.target.checked,
                      })
                    }
                    className="rounded text-[#5e48e8] focus:ring-[#5e48e8]"
                  />
                  <span>Closing Balance</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={visibleColumns.fx}
                    onChange={(e) =>
                      setVisibleColumns({
                        ...visibleColumns,
                        fx: e.target.checked,
                      })
                    }
                    className="rounded text-[#5e48e8] focus:ring-[#5e48e8]"
                  />
                  <span>FX Adjustment</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
                  <input
                    type="checkbox"
                    checked={visibleColumns.revalued}
                    onChange={(e) =>
                      setVisibleColumns({
                        ...visibleColumns,
                        revalued: e.target.checked,
                      })
                    }
                    className="rounded text-[#5e48e8] focus:ring-[#5e48e8]"
                  />
                  <span>Revalued Closing Balance</span>
                </label>
              </div>
            )}
          </div>

          {/* Export */}
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PrintIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          {/* Ask AI */}
          <button className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#5e48e8] text-white hover:bg-[#503cd1] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>
        </div>
      </div>

      {/* 2. Controls Toolbar: Date Pill, + Add Filter */}
      <div className="px-8 py-3.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5">
          {/* Date Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-medium shadow-2xs transition-colors cursor-pointer"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-normal">Date</span>
              <span className="font-semibold text-slate-900 font-mono">
                {data?.dateLabel || "Jul 2026 → Oct 2026"}
              </span>
            </button>

            {showDatePicker && (
              <div className="absolute left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 text-xs space-y-3 w-72">
                <div className="font-bold text-slate-900">Reporting Period</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">
                      From:
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">
                      To:
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full border border-slate-200 rounded px-2 py-1 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setFromDate("2026-07-01");
                      setToDate("2026-10-31");
                      setShowDatePicker(false);
                    }}
                    className="text-[11px] text-[#5e48e8] font-medium hover:underline"
                  >
                    Jul - Oct 2026
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="px-3 py-1 rounded bg-[#5e48e8] text-white font-medium text-xs"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* + Add Filter button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium shadow-2xs transition-colors cursor-pointer"
            >
              <FilterIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {selectedSubtype === "ALL"
                  ? "+ Add filter"
                  : `Filter: ${selectedSubtype}`}
              </span>
            </button>

            {showFilterDropdown && (
              <div className="absolute left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-xs w-48 space-y-1">
                <button
                  onClick={() => {
                    setSelectedSubtype("ALL");
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                    selectedSubtype === "ALL"
                      ? "bg-[#5e48e8]/10 text-[#5e48e8] font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  All Subclassifications
                </button>
                {subtypes.map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setSelectedSubtype(st);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                      selectedSubtype === st
                        ? "bg-[#5e48e8]/10 text-[#5e48e8] font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-64">
          <SearchIcon className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search code or account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-50/80 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#5e48e8] outline-none"
          />
        </div>
      </div>

      {/* 3. Main Multi-Column Hierarchical Table */}
      <div className="flex-1 w-full overflow-x-auto bg-white">
        <table className="w-full text-left border-collapse text-xs whitespace-nowrap min-w-[1280px]">
          <thead>
            {/* Header Level 1: Category Groups */}
            <tr className="bg-white border-b border-slate-200 text-slate-700 font-semibold text-[11px] select-none">
              {/* Level toggles [1] [2] in table header */}
              <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200/80">
                <div className="inline-flex items-center rounded-md border border-slate-200 p-0.5 bg-slate-50 text-[10px]">
                  <button
                    onClick={() => handleLevelChange(1)}
                    className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                      levelView === 1
                        ? "bg-white text-slate-900 font-bold shadow-2xs"
                        : "text-slate-400 hover:text-slate-800"
                    }`}
                    title="Collapse to Level 1"
                  >
                    1
                  </button>
                  <button
                    onClick={() => handleLevelChange(2)}
                    className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                      levelView === 2
                        ? "bg-white text-slate-900 font-bold shadow-2xs"
                        : "text-slate-400 hover:text-slate-800"
                    }`}
                    title="Expand all to Level 2"
                  >
                    2
                  </button>
                </div>
              </th>

              <th className="py-2.5 px-4 w-28 border-r border-slate-200/80 font-bold text-slate-900">
                Code
              </th>
              <th className="py-2.5 px-4 min-w-[240px] border-r border-slate-200/80 font-bold text-slate-900">
                Account name
              </th>
              <th className="py-2.5 px-4 min-w-[170px] border-r border-slate-200/80 font-bold text-slate-900">
                Subclassification
              </th>

              {visibleColumns.opening && (
                <th
                  colSpan={2}
                  className="py-2 px-4 text-center border-r border-slate-200/80 tracking-wider uppercase text-[10px] text-slate-500 font-bold"
                >
                  OPENING BALANCE
                </th>
              )}

              {visibleColumns.movements && (
                <th
                  colSpan={2}
                  className="py-2 px-4 text-center border-r border-slate-200/80 tracking-wider uppercase text-[10px] text-slate-500 font-bold"
                >
                  MOVEMENTS
                </th>
              )}

              {visibleColumns.closing && (
                <th
                  colSpan={2}
                  className="py-2 px-4 text-center border-r border-slate-200/80 tracking-wider uppercase text-[10px] text-slate-500 font-bold"
                >
                  CLOSING BALANCE
                </th>
              )}

              {visibleColumns.fx && (
                <th
                  colSpan={2}
                  className="py-2 px-4 text-center border-r border-slate-200/80 tracking-wider uppercase text-[10px] text-slate-500 font-bold"
                >
                  FX ADJUSTMENT
                </th>
              )}

              {visibleColumns.revalued && (
                <th
                  colSpan={2}
                  className="py-2 px-4 text-center tracking-wider uppercase text-[10px] text-slate-500 font-bold"
                >
                  REVALUED CLOSING BALANCE
                </th>
              )}
            </tr>

            {/* Header Level 2: Debit / Credit sub-columns */}
            <tr className="bg-white border-b border-slate-200/90 text-slate-500 font-medium text-[11px] select-none">
              <th className="py-2 px-3 border-r border-slate-200/80"></th>
              <th className="py-2 px-4 border-r border-slate-200/80"></th>
              <th className="py-2 px-4 border-r border-slate-200/80"></th>
              <th className="py-2 px-4 border-r border-slate-200/80"></th>

              {visibleColumns.opening && (
                <>
                  <th className="py-1.5 px-3 text-right">Debit AED ⬍</th>
                  <th className="py-1.5 px-3 text-right border-r border-slate-200/80">
                    Credit AED ⬍
                  </th>
                </>
              )}

              {visibleColumns.movements && (
                <>
                  <th className="py-1.5 px-3 text-right">Debit AED ⬍</th>
                  <th className="py-1.5 px-3 text-right border-r border-slate-200/80">
                    Credit AED ⬍
                  </th>
                </>
              )}

              {visibleColumns.closing && (
                <>
                  <th className="py-1.5 px-3 text-right">Debit AED ⬍</th>
                  <th className="py-1.5 px-3 text-right border-r border-slate-200/80">
                    Credit AED ⬍
                  </th>
                </>
              )}

              {visibleColumns.fx && (
                <>
                  <th className="py-1.5 px-3 text-right">Debit AED ⬍</th>
                  <th className="py-1.5 px-3 text-right border-r border-slate-200/80">
                    Credit AED ⬍
                  </th>
                </>
              )}

              {visibleColumns.revalued && (
                <>
                  <th className="py-1.5 px-3 text-right">Debit AED ⬍</th>
                  <th className="py-1.5 px-3 text-right">Credit AED ⬍</th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td
                  colSpan={14}
                  className="py-20 text-center text-slate-400 text-xs font-medium"
                >
                  <div className="w-6 h-6 border-2 border-[#5e48e8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Calculating true double-entry trial balance...
                </td>
              </tr>
            ) : displayedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={14}
                  className="py-16 text-center text-slate-400 text-xs"
                >
                  No accounts found matching criteria.
                </td>
              </tr>
            ) : (
              displayedRows.map((row) => {
                const isCollapsed = collapsedParentIds.has(row.id);
                const isChild = Boolean(row.parentId);

                // If parent is collapsed, show rolled-up values; otherwise direct values
                const showRollup = row.hasChildren && isCollapsed;
                const opDr = showRollup
                  ? row.rollupOpeningDebit || 0
                  : row.openingDebit;
                const opCr = showRollup
                  ? row.rollupOpeningCredit || 0
                  : row.openingCredit;
                const movDr = showRollup
                  ? row.rollupMovementDebit || 0
                  : row.movementDebit;
                const movCr = showRollup
                  ? row.rollupMovementCredit || 0
                  : row.movementCredit;
                const closeDr = showRollup
                  ? row.rollupClosingDebit || 0
                  : row.closingDebit;
                const closeCr = showRollup
                  ? row.rollupClosingCredit || 0
                  : row.closingCredit;
                const revDr = showRollup
                  ? row.rollupRevaluedDebit || 0
                  : row.revaluedClosingDebit;
                const revCr = showRollup
                  ? row.rollupRevaluedCredit || 0
                  : row.revaluedClosingCredit;

                return (
                  <tr
                    key={row.id}
                    onClick={() => handleDrillDown(row)}
                    className="hover:bg-[#fbfbff] transition-colors group cursor-pointer text-xs"
                  >
                    {/* Expand/Collapse Chevron */}
                    <td
                      className="py-2.5 px-3 text-center border-r border-slate-200/80"
                      onClick={(e) => {
                        if (row.hasChildren) {
                          e.stopPropagation();
                          toggleParentCollapse(row.id);
                        }
                      }}
                    >
                      {row.hasChildren && (
                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          {isCollapsed ? (
                            <ChevronRightIcon className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDownIcon className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </td>

                    {/* Code with indentation / tree branch */}
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-700 border-r border-slate-200/80">
                      <div className="flex items-center gap-1.5">
                        {isChild && (
                          <span className="text-slate-300 font-mono select-none pl-3">
                            └─
                          </span>
                        )}
                        <span>{row.code}</span>
                      </div>
                    </td>

                    {/* Account Name */}
                    <td className="py-2.5 px-4 font-medium text-slate-900 border-r border-slate-200/80 group-hover:text-[#5e48e8] transition-colors">
                      <div
                        className={isChild ? "pl-2" : "font-semibold"}
                      >
                        {row.name}
                      </div>
                    </td>

                    {/* Subclassification */}
                    <td className="py-2.5 px-4 text-slate-600 border-r border-slate-200/80">
                      {row.subtype}
                    </td>

                    {/* OPENING BALANCE */}
                    {visibleColumns.opening && (
                      <>
                        <td className="py-2.5 px-3 text-right">
                          {renderAmount(opDr)}
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-slate-200/80">
                          {renderAmount(opCr)}
                        </td>
                      </>
                    )}

                    {/* MOVEMENTS */}
                    {visibleColumns.movements && (
                      <>
                        <td className="py-2.5 px-3 text-right">
                          {renderAmount(movDr)}
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-slate-200/80">
                          {renderAmount(movCr)}
                        </td>
                      </>
                    )}

                    {/* CLOSING BALANCE */}
                    {visibleColumns.closing && (
                      <>
                        <td className="py-2.5 px-3 text-right">
                          {renderAmount(closeDr)}
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-slate-200/80">
                          {renderAmount(closeCr)}
                        </td>
                      </>
                    )}

                    {/* FX ADJUSTMENT */}
                    {visibleColumns.fx && (
                      <>
                        <td className="py-2.5 px-3 text-right">
                          {renderAmount(0)}
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-slate-200/80">
                          {renderAmount(0)}
                        </td>
                      </>
                    )}

                    {/* REVALUED CLOSING BALANCE */}
                    {visibleColumns.revalued && (
                      <>
                        <td className="py-2.5 px-3 text-right">
                          {renderAmount(revDr)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {renderAmount(revCr)}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* 4. Totals Row matching Wafeq Screenshot exactly */}
          <tfoot className="bg-white border-t-2 border-slate-900 font-mono text-xs select-none">
            <tr className="font-bold text-slate-900">
              <td
                colSpan={4}
                className="py-3 px-6 text-left font-sans text-xs tracking-tight uppercase"
              >
                Totals
              </td>

              {/* Opening Totals */}
              {visibleColumns.opening && (
                <>
                  <td className="py-3 px-3 text-right border-t-2 border-slate-900">
                    {renderAmount(data?.totals.openingDebit)}
                  </td>
                  <td className="py-3 px-3 text-right border-r border-slate-200/80 border-t-2 border-slate-900">
                    {renderAmount(data?.totals.openingCredit)}
                  </td>
                </>
              )}

              {/* Movements Totals */}
              {visibleColumns.movements && (
                <>
                  <td className="py-3 px-3 text-right border-t-2 border-slate-900">
                    {renderAmount(data?.totals.movementDebit)}
                  </td>
                  <td className="py-3 px-3 text-right border-r border-slate-200/80 border-t-2 border-slate-900">
                    {renderAmount(data?.totals.movementCredit)}
                  </td>
                </>
              )}

              {/* Closing Totals */}
              {visibleColumns.closing && (
                <>
                  <td className="py-3 px-3 text-right border-t-2 border-slate-900">
                    {renderAmount(data?.totals.closingDebit)}
                  </td>
                  <td className="py-3 px-3 text-right border-r border-slate-200/80 border-t-2 border-slate-900">
                    {renderAmount(data?.totals.closingCredit)}
                  </td>
                </>
              )}

              {/* FX Totals */}
              {visibleColumns.fx && (
                <>
                  <td className="py-3 px-3 text-right border-t-2 border-slate-900">
                    {renderAmount(0)}
                  </td>
                  <td className="py-3 px-3 text-right border-r border-slate-200/80 border-t-2 border-slate-900">
                    {renderAmount(0)}
                  </td>
                </>
              )}

              {/* Revalued Closing Totals */}
              {visibleColumns.revalued && (
                <>
                  <td className="py-3 px-3 text-right border-t-2 border-slate-900">
                    {renderAmount(data?.totals.revaluedClosingDebit)}
                  </td>
                  <td className="py-3 px-3 text-right border-t-2 border-slate-900">
                    {renderAmount(data?.totals.revaluedClosingCredit)}
                  </td>
                </>
              )}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 5. Bottom Info Bar matching Wafeq */}
      <div className="px-8 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span>
            Accounts:{" "}
            <strong className="text-slate-900 font-mono">
              {displayedRows.length}
            </strong>
          </span>
          <span>
            Total Movements:{" "}
            <strong className="text-[#5e48e8] font-mono">
              AED {(data?.totals.movementDebit || 0).toFixed(2)}
            </strong>
          </span>
          <span>
            Status:{" "}
            {data?.totals.isBalanced ? (
              <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px]">
                ✓ DOUBLE-ENTRY BALANCED (Diff: AED 0.00)
              </span>
            ) : (
              <span className="text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full text-[10px]">
                ⚠ Discrepancy: AED{" "}
                {(data?.totals.difference || 0).toFixed(2)}
              </span>
            )}
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          Click any account to open General Ledger audit trail ↗
        </div>
      </div>
    </div>
  );
}
