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
  Layers,
  Landmark,
  CreditCard,
  Scale,
  TrendingUp,
  Receipt,
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
      label: "ALL ACCOUNTS",
      subtext: "5 Root Pillars",
      count: categoryCounts.ALL ?? totalCount,
      cardBg: "#f1f5f9",
      cardBorder: "#cbd5e1",
      iconBg: "#ffffff",
      iconBorder: "#cbd5e1",
      iconColor: "#475569",
      Icon: Layers,
    },
    {
      id: "ASSET",
      label: "ASSETS",
      subtext: "Pillar 1 · Asset",
      count: categoryCounts.ASSET ?? 0,
      cardBg: "#eff6ff",
      cardBorder: "#93c5fd",
      iconBg: "#dbeafe",
      iconBorder: "#93c5fd",
      iconColor: "#1d4ed8",
      Icon: Landmark,
    },
    {
      id: "LIABILITY",
      label: "LIABILITIES",
      subtext: "Pillar 2 · Liability",
      count: categoryCounts.LIABILITY ?? 0,
      cardBg: "#fff1f2",
      cardBorder: "#fda4af",
      iconBg: "#ffe4e6",
      iconBorder: "#fda4af",
      iconColor: "#be123c",
      Icon: CreditCard,
    },
    {
      id: "EQUITY",
      label: "EQUITY",
      subtext: "Pillar 3 · Equity",
      count: categoryCounts.EQUITY ?? 0,
      cardBg: "#fefce8",
      cardBorder: "#fde047",
      iconBg: "#fef9c3",
      iconBorder: "#fde047",
      iconColor: "#a16207",
      Icon: Scale,
    },
    {
      id: "REVENUE",
      label: "INCOME",
      subtext: "Pillar 4 · Revenue",
      count: categoryCounts.REVENUE ?? 0,
      cardBg: "#f0fdf4",
      cardBorder: "#86efac",
      iconBg: "#dcfce7",
      iconBorder: "#86efac",
      iconColor: "#15803d",
      Icon: TrendingUp,
    },
    {
      id: "EXPENSE",
      label: "EXPENSES",
      subtext: "Pillar 5 · Expense",
      count: categoryCounts.EXPENSE ?? 0,
      cardBg: "#fff7ed",
      cardBorder: "#fdba74",
      iconBg: "#ffedd5",
      iconBorder: "#fdba74",
      iconColor: "#c2410c",
      Icon: Receipt,
    },
  ];

  return (
    <div className="space-y-3.5 select-none">
      {/* =========================================================================
          1. CLEAN COMPACT TOP HEADER (MATCHING FIXED ASSETS)
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 print:hidden">
        <div>
          <h1 className="text-base sm:text-[17px] font-semibold tracking-tight text-slate-800">
            Chart of Accounts
          </h1>
          <p className="text-[11.5px] font-normal text-slate-500 mt-0.5">
            Structured multi-tier ledger hierarchy, accounting classifications, and reporting rollups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          {onOpenAccountTypes && (
            <button
              type="button"
              onClick={onOpenAccountTypes}
              style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 text-[11.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              title="Manage Account Types & Subclassifications"
            >
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Account Types</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExportCsv}
            style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
            className="px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 text-[11.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download CSV Report"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Report</span>
          </button>

          {canAddAccount && (
            <button
              type="button"
              onClick={onAddAccount}
              style={{
                backgroundColor: "#1d4ed8",
                color: "#ffffff",
                border: "1px solid #1e40af",
              }}
              className="px-3.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Account</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. SOFT LIGHT-BLUE TINTED SEARCH & FILTER BOX (MATCHING FIXED ASSETS)
          ========================================================================= */}
      <div
        className="rounded-xl p-3 print:hidden"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-2.5">
          {/* Search Input */}
          <div className="flex-1">
            <label className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
              SEARCH
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search account code, name, or classification..."
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

          {/* Pillar / Category Select */}
          <div className="w-full lg:w-48">
            <label className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
              ACCOUNT PILLAR
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory && onSelectCategory(e.target.value)}
              style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
              className="w-full rounded-lg px-2.5 py-1.5 text-xs font-normal text-slate-700 outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">All account pillars ({categoryCounts.ALL ?? totalCount})</option>
              <option value="ASSET">Assets ({categoryCounts.ASSET ?? 0})</option>
              <option value="LIABILITY">Liabilities ({categoryCounts.LIABILITY ?? 0})</option>
              <option value="EQUITY">Equity ({categoryCounts.EQUITY ?? 0})</option>
              <option value="REVENUE">Income / Revenue ({categoryCounts.REVENUE ?? 0})</option>
              <option value="EXPENSE">Expenses ({categoryCounts.EXPENSE ?? 0})</option>
            </select>
          </div>

          {/* Hierarchy Depth Selector */}
          <div>
            <label className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block mb-1">
              HIERARCHY DEPTH
            </label>
            <div className="flex items-center gap-1.5">
              <div
                className="inline-flex items-center rounded-lg p-0.5 text-xs"
                style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
              >
                <span className="px-2 text-[9.5px] font-medium text-slate-400 uppercase tracking-wider">
                  Level
                </span>
                {[1, 2, 3, 4].map((lvl) => {
                  const isActive = activeDepthLevel === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => onSelectDepthLevel(lvl)}
                      style={
                        isActive
                          ? { backgroundColor: "#1d4ed8", color: "#ffffff" }
                          : { backgroundColor: "transparent", color: "#475569" }
                      }
                      className="w-6 h-6 rounded-md text-xs font-medium flex items-center justify-center transition-all cursor-pointer hover:bg-slate-100"
                      title={`Expand up to Level ${lvl}`}
                    >
                      {lvl}
                    </button>
                  );
                })}
              </div>

              {onExpandAll && (
                <button
                  type="button"
                  onClick={onExpandAll}
                  style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                  className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                  title="Expand All Nodes"
                >
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                </button>
              )}

              {onCollapseAll && (
                <button
                  type="button"
                  onClick={onCollapseAll}
                  style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                  className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                  title="Collapse to Root"
                >
                  <ChevronsDownUp className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Search & Refresh Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onRefresh && onRefresh()}
              style={{
                backgroundColor: "#1d4ed8",
                color: "#ffffff",
                border: "1px solid #1e40af",
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>

            {onRefresh && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  if (onSelectCategory) onSelectCategory("ALL");
                  onRefresh();
                }}
                style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                title="Reset & Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. COMPACT PASTEL PILLAR KPI CARDS (LIGHT COLOR + CLEAR BORDERS)
          ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 print:hidden">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const IconComponent = cat.Icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory && onSelectCategory(cat.id)}
              className="rounded-xl px-3 py-2.5 flex items-center gap-2.5 text-left transition-all cursor-pointer"
              style={{
                backgroundColor: cat.cardBg,
                border: isSelected
                  ? "1.5px solid #1d4ed8"
                  : `1px solid ${cat.cardBorder}`,
                boxShadow: isSelected ? "0 0 0 2px rgba(29, 78, 216, 0.12)" : "none",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: cat.iconBg,
                  color: cat.iconColor,
                  border: `1px solid ${cat.iconBorder}`,
                }}
              >
                <IconComponent className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block truncate">
                  {cat.label}
                </span>
                <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block">
                  {cat.count}
                </span>
                <span className="text-[10px] font-normal text-slate-500 block truncate">
                  {cat.subtext}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CleanAccountsHeader;
