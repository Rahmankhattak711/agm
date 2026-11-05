"use client";

import React from "react";
import {
  Search,
  Plus,
  Download,
  RefreshCw,
  ChevronsUpDown,
  ChevronsDownUp,
  X,
  Tag,
  Scale,
} from "lucide-react";

interface CleanAccountsHeaderProps {
  search: string;
  setSearch: (val: string) => void;
  activeDepthLevel: number | null;
  onSelectDepthLevel: (lvl: number) => void;
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  totalCount?: number;
  categoryCounts?: Record<string, number>;
  onAddAccount: () => void;
  onExportCsv: () => void;
  onRefresh?: () => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  canAddAccount?: boolean;
  onOpenAccountTypes?: () => void;
}

export function CleanAccountsHeader({
  search,
  setSearch,
  activeDepthLevel,
  onSelectDepthLevel,
  selectedCategory = "ALL",
  onSelectCategory,
  totalCount = 0,
  categoryCounts = {},
  onAddAccount,
  onExportCsv,
  onRefresh,
  onExpandAll,
  onCollapseAll,
  canAddAccount = true,
  onOpenAccountTypes,
}: CleanAccountsHeaderProps) {
  const categories = [
    {
      id: "ALL",
      label: "All Accounts",
      count: categoryCounts.ALL ?? totalCount,
      dotColor: "bg-indigo-500",
    },
    {
      id: "ASSET",
      label: "Assets",
      count: categoryCounts.ASSET ?? 0,
      dotColor: "bg-purple-500",
    },
    {
      id: "LIABILITY",
      label: "Liabilities",
      count: categoryCounts.LIABILITY ?? 0,
      dotColor: "bg-rose-500",
    },
    {
      id: "EQUITY",
      label: "Equity",
      count: categoryCounts.EQUITY ?? 0,
      dotColor: "bg-amber-500",
    },
    {
      id: "REVENUE",
      label: "Income",
      count: categoryCounts.REVENUE ?? 0,
      dotColor: "bg-emerald-500",
    },
    {
      id: "EXPENSE",
      label: "Expenses",
      count: categoryCounts.EXPENSE ?? 0,
      dotColor: "bg-blue-500",
    },
  ];

  return (
    <div className="w-full bg-white select-none">
      {/* ── Tier 1: Page Title & Executive Actions Bar ────────────────── */}
      <div className="px-6 py-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        {/* Title & Metadata */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Chart of Accounts
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 font-mono">
                {totalCount} accounts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Structured multi-tier ledger hierarchy, accounting classifications, and reporting rollups
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Account Types */}
          {onOpenAccountTypes && (
            <button
              type="button"
              onClick={onOpenAccountTypes}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Manage Account Types & Subclassifications"
            >
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Account Types</span>
            </button>
          )}

          {/* Export CSV */}
          <button
            type="button"
            onClick={onExportCsv}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Download CSV Spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          {/* Add Account Primary CTA */}
          {canAddAccount && (
            <button
              type="button"
              onClick={onAddAccount}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-semibold shadow-xs hover:shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Account</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Tier 2: Pillar Filters, Search & Hierarchy Depth ────────────── */}
      <div className="px-6 py-2.5 bg-slate-50/60 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Pillar Category Navigation Tabs (Underline / Pill hybrid) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${cat.dotColor} ${
                    isSelected ? "opacity-100" : "opacity-40"
                  }`}
                />
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                      : "bg-slate-200/70 text-slate-500"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: Search + Depth + Expand/Collapse Micro-tools */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative w-48 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Level Depth Toggle [ Level 1 | 2 | 3 | 4 ] */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs shadow-2xs">
            <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Depth
            </span>
            {[1, 2, 3, 4].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => onSelectDepthLevel(lvl)}
                className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                  activeDepthLevel === lvl
                    ? "bg-indigo-600 text-white shadow-2xs font-extrabold"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title={`Expand up to Level ${lvl}`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Expand All */}
          {onExpandAll && (
            <button
              type="button"
              onClick={onExpandAll}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
              title="Expand All Nodes"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Collapse All */}
          {onCollapseAll && (
            <button
              type="button"
              onClick={onCollapseAll}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
              title="Collapse to Root"
            >
              <ChevronsDownUp className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Refresh */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 shadow-2xs transition-colors cursor-pointer"
              title="Refresh Accounts"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CleanAccountsHeader;
