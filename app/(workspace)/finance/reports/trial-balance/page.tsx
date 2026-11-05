"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
  CheckCircle2Icon,
  AlertTriangleIcon,
  FileSpreadsheetIcon,
  ScaleIcon,
  EyeIcon,
  EyeOffIcon,
  XIcon,
  BookOpenIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "@/components/icons";
import { printWithDocumentTitle } from "@/lib/utils/format";

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
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Hierarchy expansion state
  const [levelView, setLevelView] = useState<1 | 2>(2);
  const [collapsedParentIds, setCollapsedParentIds] = useState<Set<string>>(
    new Set(),
  );

  // Zero-balance filter toggle
  const [hideZeroBalances, setHideZeroBalances] = useState(false);

  // Column Visibility Controls
  const [showEditColumns, setShowEditColumns] = useState(false);
  const editColumnsRef = useRef<HTMLDivElement>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    opening: true,
    movements: true,
    closing: true,
    fx: false,
    revalued: true,
  });

  // Filter state
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedSubtype, setSelectedSubtype] = useState<string>("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
      if (
        editColumnsRef.current &&
        !editColumnsRef.current.contains(event.target as Node)
      ) {
        setShowEditColumns(false);
      }
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Expand all / Collapse all
  const handleCollapseAll = () => {
    setLevelView(1);
    const allParentIds = new Set<string>();
    (data?.rows || []).forEach((r: TrialBalanceRow) => {
      if (r.hasChildren) allParentIds.add(r.id);
    });
    setCollapsedParentIds(allParentIds);
  };

  const handleExpandAll = () => {
    setLevelView(2);
    setCollapsedParentIds(new Set());
  };

  // Level 1 vs 2 switch
  const handleLevelChange = (newLevel: 1 | 2) => {
    if (newLevel === 1) {
      handleCollapseAll();
    } else {
      handleExpandAll();
    }
  };

  // Filtered rows & hierarchy sorting
  const rows: TrialBalanceRow[] = useMemo(() => {
    if (!data?.rows) return [];
    return data.rows;
  }, [data?.rows]);

  // Check if a row is completely zero
  const isRowZero = (r: TrialBalanceRow): boolean => {
    return (
      (r.openingDebit || 0) === 0 &&
      (r.openingCredit || 0) === 0 &&
      (r.movementDebit || 0) === 0 &&
      (r.movementCredit || 0) === 0 &&
      (r.closingDebit || 0) === 0 &&
      (r.closingCredit || 0) === 0 &&
      (r.revaluedClosingDebit || 0) === 0 &&
      (r.revaluedClosingCredit || 0) === 0
    );
  };

  // Determine visibility of each row based on search, filters, collapse state
  const displayedRows = useMemo(() => {
    return rows.filter((r) => {
      // Zero balance filter (do not hide parent if it has non-zero children)
      if (hideZeroBalances && isRowZero(r) && !r.hasChildren) {
        return false;
      }

      // If user searched, show matching rows directly
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          r.code.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.subtype.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Account Category Filter (ASSET, LIABILITY, EQUITY, etc.)
      if (selectedType !== "ALL" && r.type !== selectedType) {
        return false;
      }

      // Subtype Filter
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
  }, [
    rows,
    search,
    selectedType,
    selectedSubtype,
    collapsedParentIds,
    hideZeroBalances,
  ]);

  // Unique subtypes for filter
  const subtypes = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      if (r.subtype) set.add(r.subtype);
    });
    return Array.from(set);
  }, [rows]);

  // Count active vs dormant
  const activeCount = useMemo(() => {
    return rows.filter((r) => !isRowZero(r)).length;
  }, [rows]);

  // Count active visible columns
  const visibleColCount = useMemo(() => {
    return Object.values(visibleColumns).filter(Boolean).length;
  }, [visibleColumns]);

  // Drilldown to General Ledger
  const handleDrillDown = (row: TrialBalanceRow) => {
    router.push(
      `/finance/general-ledger?accountId=${row.id}&accountName=${encodeURIComponent(row.name)}&from=${fromDate}&to=${toDate}`,
    );
  };

  // Professional Financial Number Renderer (sharp tabular numbers, muted dashes for zeroes)
  const renderAmount = (
    val?: number,
    isBold = false,
    colorScheme: "default" | "debit" | "credit" = "default",
  ) => {
    if (val === undefined || val === null || val === 0) {
      return (
        <span className="text-slate-300 select-none text-center font-mono">
          —
        </span>
      );
    }

    const formatted = val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return (
      <span
        className={`font-mono tabular-nums text-xs ${
          isBold ? "font-bold text-slate-900" : "font-medium text-slate-800"
        }`}
      >
        {formatted}
      </span>
    );
  };

  // Print Report Handler
  const handlePrint = () => {
    printWithDocumentTitle(
      `AGM_Trial_Balance_${fromDate}_to_${toDate}`,
    );
    window.print();
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (!displayedRows || displayedRows.length === 0) return;
    const headers = [
      "Account Code",
      "Account Name",
      "Classification",
      "Type",
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
      `"${r.type}"`,
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

    // Totals row
    if (data?.totals) {
      csvRows.push([
        `"TOTALS"`,
        `"Total Accounts: ${displayedRows.length}"`,
        `""`,
        `""`,
        (data.totals.openingDebit || 0).toFixed(2),
        (data.totals.openingCredit || 0).toFixed(2),
        (data.totals.movementDebit || 0).toFixed(2),
        (data.totals.movementCredit || 0).toFixed(2),
        (data.totals.closingDebit || 0).toFixed(2),
        (data.totals.closingCredit || 0).toFixed(2),
        "0.00",
        "0.00",
        (data.totals.revaluedClosingDebit || 0).toFixed(2),
        (data.totals.revaluedClosingCredit || 0).toFixed(2),
      ]);
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Trial_Balance_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Date Quick Presets
  const applyPreset = (preset: "month" | "quarter" | "ytd" | "wafeq" | "all") => {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth();

    if (preset === "month") {
      const firstDay = new Date(curYear, curMonth, 1).toISOString().slice(0, 10);
      const lastDay = new Date(curYear, curMonth + 1, 0).toISOString().slice(0, 10);
      setFromDate(firstDay);
      setToDate(lastDay);
    } else if (preset === "quarter") {
      const qStartMonth = Math.floor(curMonth / 3) * 3;
      const firstDay = new Date(curYear, qStartMonth, 1).toISOString().slice(0, 10);
      const lastDay = new Date(curYear, qStartMonth + 3, 0).toISOString().slice(0, 10);
      setFromDate(firstDay);
      setToDate(lastDay);
    } else if (preset === "ytd") {
      setFromDate(`${curYear}-01-01`);
      setToDate(today.toISOString().slice(0, 10));
    } else if (preset === "wafeq") {
      setFromDate("2026-07-01");
      setToDate("2026-10-31");
    } else if (preset === "all") {
      setFromDate("2020-01-01");
      setToDate(`${curYear}-12-31`);
    }
    setShowDatePicker(false);
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen text-slate-900 pb-16 flex flex-col font-sans print:bg-white print:p-0">
      {/* 1. Print-Only Official Header */}
      <div className="hidden print:block p-6 border-b border-slate-300 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">
              AL GHAITH MANAGEMENT (AGM)
            </h1>
            <h2 className="text-base font-semibold text-slate-700 mt-1">
              Trial Balance Sheet / ميزان المراجعة
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Accounting Period: {data?.dateLabel || `${fromDate} to ${toDate}`}
            </p>
          </div>
          <div className="text-right text-xs text-slate-600 space-y-1">
            <div>
              <span className="font-semibold">Currency:</span> AED (United Arab Emirates Dirham)
            </div>
            <div>
              <span className="font-semibold">Method:</span> Accrual Basis
            </div>
            <div>
              <span className="font-semibold">Status:</span>{" "}
              {data?.totals.isBalanced ? "Balanced Double-Entry" : "Discrepancy Detected"}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Navigation & Action Controls Bar */}
      <div className="border-b border-slate-200/90 bg-white sticky top-0 z-30 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs print:hidden">
        {/* Left: Breadcrumb & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/finance/reports")}
            className="w-8 h-8 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            title="Back to Reports"
          >
            <ChevronRightIcon className="w-4 h-4 rotate-180" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => router.push("/finance/reports")}
                className="text-slate-500 hover:text-indigo-600 font-medium transition-colors"
              >
                Reports
              </button>
              <span className="text-slate-400">/</span>
              <span className="text-slate-500">Financial Statements</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-900 font-semibold">Trial Balance</span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ScaleIcon className="w-5 h-5 text-indigo-600" />
                Trial Balance
              </h1>
              {/* Balance Verification Pill */}
              {data?.totals.isBalanced ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Balanced (0.00 AED)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertTriangleIcon className="w-3.5 h-3.5 text-rose-600" />
                  Discrepancy: AED {(data?.totals.difference || 0).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions: Refresh, Columns, Export, Print */}
        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh Data"
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshIcon
              className={`w-4 h-4 ${isFetching ? "animate-spin text-indigo-600" : ""}`}
            />
          </button>

          {/* Edit Columns */}
          <div className="relative" ref={editColumnsRef}>
            <button
              onClick={() => setShowEditColumns(!showEditColumns)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors cursor-pointer bg-white"
            >
              <LayersIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Columns</span>
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {visibleColCount}
              </span>
            </button>

            {showEditColumns && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900">Configure Columns</span>
                  <span className="text-[10px] text-slate-400">
                    {visibleColCount} of 5 active
                  </span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {[
                    { key: "opening", label: "Opening Balance" },
                    { key: "movements", label: "Period Movements" },
                    { key: "closing", label: "Closing Balance" },
                    { key: "fx", label: "FX Adjustment" },
                    { key: "revalued", label: "Revalued Closing" },
                  ].map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700 transition-colors"
                    >
                      <span>{col.label}</span>
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.key as keyof typeof visibleColumns]}
                        onChange={(e) =>
                          setVisibleColumns({
                            ...visibleColumns,
                            [col.key]: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
            title="Download CSV Spreadsheet"
          >
            <FileSpreadsheetIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {/* Print / PDF */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <PrintIcon className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full print:p-0 print:space-y-4">
        {/* 3. Executive KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          {/* Card 1: Closing Debits */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Total Closing Debits
              </span>
              <span className="p-1 rounded-md bg-blue-50 text-blue-600">
                <TrendingUpIcon className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900">
              AED {(data?.totals.closingDebit || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>Debit side total of all accounts</span>
            </div>
          </div>

          {/* Card 2: Closing Credits */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Total Closing Credits
              </span>
              <span className="p-1 rounded-md bg-purple-50 text-purple-600">
                <TrendingDownIcon className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900">
              AED {(data?.totals.closingCredit || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>Credit side total of all accounts</span>
            </div>
          </div>

          {/* Card 3: Period Movements */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Period Activity (Movements)
              </span>
              <span className="p-1 rounded-md bg-amber-50 text-amber-600">
                <ScaleIcon className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900">
              AED {(data?.totals.movementDebit || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Dr / Cr transactions posted in period
            </div>
          </div>

          {/* Card 4: Audit Status */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Trial Audit Status
              </span>
              <span
                className={`p-1 rounded-md ${
                  data?.totals.isBalanced
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {data?.totals.isBalanced ? (
                  <CheckCircle2Icon className="w-4 h-4" />
                ) : (
                  <AlertTriangleIcon className="w-4 h-4" />
                )}
              </span>
            </div>
            <div
              className={`text-base font-bold flex items-center gap-1.5 ${
                data?.totals.isBalanced ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {data?.totals.isBalanced ? "100% Balanced" : "Out of Balance"}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {displayedRows.length} accounts displayed ({activeCount} active)
            </div>
          </div>
        </div>

        {/* 4. Filter & Controls Bar */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-3.5 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left controls: Date Pill, Type Filter, Subtype Filter */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Date Selector Pill */}
              <div className="relative" ref={datePickerRef}>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium shadow-2xs transition-colors cursor-pointer"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-slate-500 font-normal">Period:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {data?.dateLabel || `${fromDate} → ${toDate}`}
                  </span>
                  <ChevronDownIcon className="w-3 h-3 text-slate-400" />
                </button>

                {showDatePicker && (
                  <div className="absolute left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 text-xs space-y-3 w-80 animate-in fade-in zoom-in-95 duration-100">
                    <div className="font-bold text-slate-900 flex justify-between items-center pb-2 border-b border-slate-100">
                      <span>Reporting Period</span>
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Presets */}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                        Quick Presets
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => applyPreset("month")}
                          className="px-2.5 py-1.5 text-left rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
                        >
                          This Month
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset("quarter")}
                          className="px-2.5 py-1.5 text-left rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
                        >
                          This Quarter
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset("ytd")}
                          className="px-2.5 py-1.5 text-left rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
                        >
                          Year to Date (YTD)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset("wafeq")}
                          className="px-2.5 py-1.5 text-left rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                        >
                          Jul – Oct 2026
                        </button>
                      </div>
                    </div>

                    {/* Custom Range */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                        Custom Range
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">
                            From:
                          </label>
                          <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">
                            To:
                          </label>
                          <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 transition-colors w-full"
                      >
                        Apply Date Range
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Account Category Filter (Assets, Liabilities, etc.) */}
              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                {["ALL", "ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map(
                  (typeKey) => {
                    const label =
                      typeKey === "ALL"
                        ? "All Accounts"
                        : typeKey === "ASSET"
                          ? "Assets"
                          : typeKey === "LIABILITY"
                            ? "Liabilities"
                            : typeKey === "EQUITY"
                              ? "Equity"
                              : typeKey === "REVENUE"
                                ? "Income"
                                : "Expenses";
                    const isSelected = selectedType === typeKey;
                    return (
                      <button
                        key={typeKey}
                        onClick={() => setSelectedType(typeKey)}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-white text-indigo-700 shadow-2xs font-semibold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  },
                )}
              </div>

              {/* Subclassification Filter */}
              <div className="relative" ref={filterDropdownRef}>
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    selectedSubtype !== "ALL"
                      ? "border-indigo-300 bg-indigo-50/60 text-indigo-700"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <FilterIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {selectedSubtype === "ALL"
                      ? "Subclassification"
                      : selectedSubtype}
                  </span>
                  <ChevronDownIcon className="w-3 h-3 text-slate-400" />
                </button>

                {showFilterDropdown && (
                  <div className="absolute left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-xs w-56 max-h-64 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => {
                        setSelectedSubtype("ALL");
                        setShowFilterDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                        selectedSubtype === "ALL"
                          ? "bg-indigo-50 text-indigo-700 font-bold"
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
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                          selectedSubtype === st
                            ? "bg-indigo-50 text-indigo-700 font-bold"
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

            {/* Right controls: Depth Level & Hide Zero Balances & Search */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Hide Zero Balances Toggle */}
              <button
                type="button"
                onClick={() => setHideZeroBalances(!hideZeroBalances)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  hideZeroBalances
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold"
                    : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                }`}
                title="Hide accounts with no debit or credit amounts"
              >
                {hideZeroBalances ? (
                  <EyeOffIcon className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <EyeIcon className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Hide Zero Balances</span>
              </button>

              {/* Hierarchy View Segmented Control */}
              <div className="flex items-center rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                <button
                  onClick={() => handleLevelChange(1)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    levelView === 1
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Summary View (Parents only)"
                >
                  Summary
                </button>
                <button
                  onClick={() => handleLevelChange(2)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    levelView === 2
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Detailed View (All Accounts)"
                >
                  Detailed
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-56">
                <SearchIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter code or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-7 py-1.5 bg-slate-50/80 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:bg-white outline-none transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 5. Main Hierarchical Trial Balance Table */}
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap min-w-[960px]">
              <thead>
                {/* Header Row 1: Section Categories */}
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-[11px] select-none">
                  <th className="py-3 px-3 w-10 text-center border-r border-slate-200/80">
                    <span className="sr-only">Toggle</span>
                  </th>
                  <th className="py-3 px-4 w-28 border-r border-slate-200/80 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Code
                  </th>
                  <th className="py-3 px-4 min-w-[260px] border-r border-slate-200/80 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Account Name
                  </th>
                  <th className="py-3 px-4 min-w-[160px] border-r border-slate-200/80 font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Classification
                  </th>

                  {visibleColumns.opening && (
                    <th
                      colSpan={2}
                      className="py-2.5 px-4 text-center border-r border-slate-200/80 tracking-wider uppercase text-[10px] text-slate-600 font-bold bg-slate-100/50"
                    >
                      Opening Balance
                    </th>
                  )}

                  {visibleColumns.movements && (
                    <th
                      colSpan={2}
                      className="py-2.5 px-4 text-center border-r border-slate-200/80 tracking-wider uppercase text-[10px] text-slate-600 font-bold bg-indigo-50/30"
                    >
                      Period Movements
                    </th>
                  )}

                  {visibleColumns.closing && (
                    <th
                      colSpan={2}
                      className="py-2.5 px-4 text-center border-r border-slate-200/80 tracking-wider uppercase text-[10px] text-slate-600 font-bold bg-slate-100/50"
                    >
                      Closing Balance
                    </th>
                  )}

                  {visibleColumns.fx && (
                    <th
                      colSpan={2}
                      className="py-2.5 px-4 text-center border-r border-slate-200/80 tracking-wider uppercase text-[10px] text-slate-600 font-bold"
                    >
                      FX Adjustment
                    </th>
                  )}

                  {visibleColumns.revalued && (
                    <th
                      colSpan={2}
                      className="py-2.5 px-4 text-center tracking-wider uppercase text-[10px] text-indigo-700 font-bold bg-indigo-50/40"
                    >
                      Revalued Closing Balance
                    </th>
                  )}
                </tr>

                {/* Header Row 2: Debit / Credit sub-columns */}
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium text-[11px] select-none">
                  <th className="py-2 px-3 border-r border-slate-200/80"></th>
                  <th className="py-2 px-4 border-r border-slate-200/80"></th>
                  <th className="py-2 px-4 border-r border-slate-200/80"></th>
                  <th className="py-2 px-4 border-r border-slate-200/80"></th>

                  {visibleColumns.opening && (
                    <>
                      <th className="py-1.5 px-3 text-right font-medium text-slate-600 bg-slate-100/30">
                        Debit <span className="text-[10px] text-slate-400 font-normal">AED</span>
                      </th>
                      <th className="py-1.5 px-3 text-right font-medium text-slate-600 border-r border-slate-200/80 bg-slate-100/30">
                        Credit <span className="text-[10px] text-slate-400 font-normal">AED</span>
                      </th>
                    </>
                  )}

                  {visibleColumns.movements && (
                    <>
                      <th className="py-1.5 px-3 text-right font-medium text-slate-600 bg-indigo-50/20">
                        Debit <span className="text-[10px] text-slate-400 font-normal">AED</span>
                      </th>
                      <th className="py-1.5 px-3 text-right font-medium text-slate-600 border-r border-slate-200/80 bg-indigo-50/20">
                        Credit <span className="text-[10px] text-slate-400 font-normal">AED</span>
                      </th>
                    </>
                  )}

                  {visibleColumns.closing && (
                    <>
                      <th className="py-1.5 px-3 text-right font-medium text-slate-600 bg-slate-100/30">
                        Debit <span className="text-[10px] text-slate-400 font-normal">AED</span>
                      </th>
                      <th className="py-1.5 px-3 text-right font-medium text-slate-600 border-r border-slate-200/80 bg-slate-100/30">
                        Credit <span className="text-[10px] text-slate-400 font-normal">AED</span>
                      </th>
                    </>
                  )}

                  {visibleColumns.fx && (
                    <>
                      <th className="py-1.5 px-3 text-right font-medium text-slate-600">
                        Debit <span className="text-[10px] text-slate-400 font-normal">AED</span>
                      </th>
                      <th className="py-1.5 px-3 text-right font-medium text-slate-600 border-r border-slate-200/80">
                        Credit <span className="text-[10px] text-slate-400 font-normal">AED</span>
                      </th>
                    </>
                  )}

                  {visibleColumns.revalued && (
                    <>
                      <th className="py-1.5 px-3 text-right font-medium text-indigo-700 bg-indigo-50/20">
                        Debit <span className="text-[10px] text-indigo-400 font-normal">AED</span>
                      </th>
                      <th className="py-1.5 px-3 text-right font-medium text-indigo-700 bg-indigo-50/20">
                        Credit <span className="text-[10px] text-indigo-400 font-normal">AED</span>
                      </th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={14}
                      className="py-24 text-center text-slate-400 text-xs font-medium"
                    >
                      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <div className="text-slate-600 font-semibold text-sm">
                        Calculating Double-Entry Trial Balance...
                      </div>
                      <div className="text-slate-400 text-xs mt-1">
                        Auditing posted journal lines and aggregating parent rollups
                      </div>
                    </td>
                  </tr>
                ) : displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="py-20 text-center">
                      <div className="max-w-sm mx-auto space-y-2">
                        <ScaleIcon className="w-10 h-10 text-slate-300 mx-auto" />
                        <div className="text-slate-800 font-semibold text-sm">
                          No matching accounts found
                        </div>
                        <p className="text-slate-400 text-xs">
                          {hideZeroBalances
                            ? "Try disabling 'Hide Zero Balances' or clearing search filters."
                            : "Adjust the search keywords or date period."}
                        </p>
                        {hideZeroBalances && (
                          <button
                            onClick={() => setHideZeroBalances(false)}
                            className="mt-2 text-xs font-medium text-indigo-600 hover:underline"
                          >
                            Show all accounts
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row) => {
                    const isCollapsed = collapsedParentIds.has(row.id);
                    const isChild = Boolean(row.parentId);
                    const isParent = row.hasChildren;

                    // If parent is collapsed, show rolled-up values; otherwise direct values
                    const showRollup = isParent && isCollapsed;
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
                        className={`transition-colors group cursor-pointer text-xs ${
                          isParent
                            ? "bg-slate-50/60 hover:bg-slate-100/80 font-semibold text-slate-900"
                            : "hover:bg-indigo-50/30 text-slate-800"
                        }`}
                      >
                        {/* Expand/Collapse Chevron */}
                        <td
                          className="py-2.5 px-3 text-center border-r border-slate-200/70"
                          onClick={(e) => {
                            if (isParent) {
                              e.stopPropagation();
                              toggleParentCollapse(row.id);
                            }
                          }}
                        >
                          {isParent ? (
                            <button
                              type="button"
                              className="p-1 rounded hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                              title={isCollapsed ? "Expand group" : "Collapse group"}
                            >
                              {isCollapsed ? (
                                <ChevronRightIcon className="w-3.5 h-3.5 text-indigo-600" />
                              ) : (
                                <ChevronDownIcon className="w-3.5 h-3.5 text-indigo-600" />
                              )}
                            </button>
                          ) : (
                            <span className="w-3.5 h-3.5 block mx-auto text-slate-200 text-center">
                              •
                            </span>
                          )}
                        </td>

                        {/* Account Code */}
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-700 border-r border-slate-200/70">
                          <div className="flex items-center gap-1.5">
                            {isChild && (
                              <span className="text-slate-300 font-mono select-none pl-2.5">
                                └─
                              </span>
                            )}
                            <span
                              className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                                isParent
                                  ? "bg-slate-200/70 text-slate-800 font-bold"
                                  : "text-slate-600 bg-slate-100"
                              }`}
                            >
                              {row.code}
                            </span>
                          </div>
                        </td>

                        {/* Account Name with Drilldown Indicator */}
                        <td className="py-2.5 px-4 font-medium border-r border-slate-200/70 group-hover:text-indigo-600 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <span className={isChild ? "pl-2" : "font-bold text-slate-900"}>
                              {row.name}
                            </span>
                            {/* Hover Drilldown Link Pill */}
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5 print:hidden">
                              Ledger <ArrowRightIcon className="w-3 h-3" />
                            </span>
                          </div>
                        </td>

                        {/* Subclassification */}
                        <td className="py-2.5 px-4 text-slate-500 border-r border-slate-200/70 text-[11px]">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {row.subtype}
                          </span>
                        </td>

                        {/* OPENING BALANCE */}
                        {visibleColumns.opening && (
                          <>
                            <td className="py-2.5 px-3 text-right bg-slate-50/20">
                              {renderAmount(opDr, isParent)}
                            </td>
                            <td className="py-2.5 px-3 text-right border-r border-slate-200/70 bg-slate-50/20">
                              {renderAmount(opCr, isParent)}
                            </td>
                          </>
                        )}

                        {/* PERIOD MOVEMENTS */}
                        {visibleColumns.movements && (
                          <>
                            <td className="py-2.5 px-3 text-right bg-indigo-50/10">
                              {renderAmount(movDr, isParent)}
                            </td>
                            <td className="py-2.5 px-3 text-right border-r border-slate-200/70 bg-indigo-50/10">
                              {renderAmount(movCr, isParent)}
                            </td>
                          </>
                        )}

                        {/* CLOSING BALANCE */}
                        {visibleColumns.closing && (
                          <>
                            <td className="py-2.5 px-3 text-right bg-slate-50/20">
                              {renderAmount(closeDr, isParent)}
                            </td>
                            <td className="py-2.5 px-3 text-right border-r border-slate-200/70 bg-slate-50/20">
                              {renderAmount(closeCr, isParent)}
                            </td>
                          </>
                        )}

                        {/* FX ADJUSTMENT */}
                        {visibleColumns.fx && (
                          <>
                            <td className="py-2.5 px-3 text-right">
                              {renderAmount(0)}
                            </td>
                            <td className="py-2.5 px-3 text-right border-r border-slate-200/70">
                              {renderAmount(0)}
                            </td>
                          </>
                        )}

                        {/* REVALUED CLOSING BALANCE */}
                        {visibleColumns.revalued && (
                          <>
                            <td className="py-2.5 px-3 text-right bg-indigo-50/20">
                              {renderAmount(revDr, isParent)}
                            </td>
                            <td className="py-2.5 px-3 text-right bg-indigo-50/20">
                              {renderAmount(revCr, isParent)}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* 6. Grand Totals Row with Classic Double Accounting Underline */}
              <tfoot className="bg-slate-50 border-t-2 border-slate-900 font-mono text-xs select-none">
                <tr className="font-bold text-slate-900 border-b-4 border-double border-slate-900">
                  <td
                    colSpan={4}
                    className="py-3.5 px-6 text-left font-sans text-xs tracking-wider uppercase font-bold text-slate-900"
                  >
                    <div className="flex items-center gap-2">
                      <ScaleIcon className="w-4 h-4 text-indigo-600" />
                      <span>Report Totals (AED)</span>
                    </div>
                  </td>

                  {/* Opening Totals */}
                  {visibleColumns.opening && (
                    <>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        {renderAmount(data?.totals.openingDebit, true)}
                      </td>
                      <td className="py-3.5 px-3 text-right border-r border-slate-200/80 font-mono font-bold text-slate-900">
                        {renderAmount(data?.totals.openingCredit, true)}
                      </td>
                    </>
                  )}

                  {/* Movements Totals */}
                  {visibleColumns.movements && (
                    <>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        {renderAmount(data?.totals.movementDebit, true)}
                      </td>
                      <td className="py-3.5 px-3 text-right border-r border-slate-200/80 font-mono font-bold text-slate-900">
                        {renderAmount(data?.totals.movementCredit, true)}
                      </td>
                    </>
                  )}

                  {/* Closing Totals */}
                  {visibleColumns.closing && (
                    <>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        {renderAmount(data?.totals.closingDebit, true)}
                      </td>
                      <td className="py-3.5 px-3 text-right border-r border-slate-200/80 font-mono font-bold text-slate-900">
                        {renderAmount(data?.totals.closingCredit, true)}
                      </td>
                    </>
                  )}

                  {/* FX Totals */}
                  {visibleColumns.fx && (
                    <>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        {renderAmount(0, true)}
                      </td>
                      <td className="py-3.5 px-3 text-right border-r border-slate-200/80 font-mono font-bold text-slate-900">
                        {renderAmount(0, true)}
                      </td>
                    </>
                  )}

                  {/* Revalued Closing Totals */}
                  {visibleColumns.revalued && (
                    <>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-indigo-900 bg-indigo-50/40">
                        {renderAmount(data?.totals.revaluedClosingDebit, true)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-indigo-900 bg-indigo-50/40">
                        {renderAmount(data?.totals.revaluedClosingCredit, true)}
                      </td>
                    </>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 7. Bottom Audit Summary Bar */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 font-medium flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <span>
                Displayed Accounts:{" "}
                <strong className="text-slate-900 font-mono font-bold">
                  {displayedRows.length}
                </strong>{" "}
                <span className="text-slate-400">
                  (of {rows.length} total)
                </span>
              </span>
              <span>
                Net Activity:{" "}
                <strong className="text-indigo-700 font-mono font-bold">
                  AED {(data?.totals.movementDebit || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </strong>
              </span>
              <span>
                Audit Verification:{" "}
                {data?.totals.isBalanced ? (
                  <span className="text-emerald-700 font-bold bg-emerald-100/70 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1">
                    <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-600" />
                    Double-Entry In Balance (Diff: AED 0.00)
                  </span>
                ) : (
                  <span className="text-rose-700 font-bold bg-rose-100/70 border border-rose-300 px-2.5 py-0.5 rounded-full text-[11px] inline-flex items-center gap-1">
                    <AlertTriangleIcon className="w-3.5 h-3.5 text-rose-600" />
                    Out of Balance: AED {(data?.totals.difference || 0).toFixed(2)}
                  </span>
                )}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <BookOpenIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Tip: Click any account to view its live General Ledger audit trail</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
