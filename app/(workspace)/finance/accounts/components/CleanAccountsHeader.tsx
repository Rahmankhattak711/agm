"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  Download,
  RefreshCw,
  ChevronsUpDown,
  ChevronsDownUp,
  X,
  Tag,
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
  onAddAccount,
  onExportCsv,
  onRefresh,
  onExpandAll,
  onCollapseAll,
  canAddAccount = true,
  onOpenAccountTypes,
}: CleanAccountsHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full bg-white px-6 pt-4 pb-3 space-y-3">
      {/* 1. Top Bar: Breadcrumb + Primary Action Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Accounting</span>
          <span className="text-slate-400">&gt;</span>
          <span className="text-slate-900 font-bold text-sm tracking-tight">
            Chart of accounts
          </span>
        </div>

        {/* Action Button: Add (+ optional menu) */}
        <div className="flex items-center gap-2">
          {onOpenAccountTypes && (
            <button
              type="button"
              onClick={onOpenAccountTypes}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Manage Account Types"
            >
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Account Types</span>
            </button>
          )}

          {canAddAccount && (
            <button
              type="button"
              onClick={onAddAccount}
              className="px-4 py-1.5 rounded-lg bg-[#5046e5] hover:bg-[#4338ca] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add</span>
            </button>
          )}

          {/* More Actions Dropdown ⋮ */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onExportCsv();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export to CSV</span>
                </button>

                {onExpandAll && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onExpandAll();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium cursor-pointer transition-colors"
                  >
                    <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <span>Expand all</span>
                  </button>
                )}

                {onCollapseAll && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onCollapseAll();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium cursor-pointer transition-colors"
                  >
                    <ChevronsDownUp className="w-3.5 h-3.5 text-slate-400" />
                    <span>Collapse all</span>
                  </button>
                )}

                {onRefresh && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onRefresh();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Refresh accounts</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Controls Row: Clean Search + Level Depth Selector */}
      <div className="flex items-center justify-between pt-1">
        {/* Search Input */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search code or account name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Minimalist Depth Segmented Control: [ 1 | 2 | 3 | 4 ] */}
        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
          {[1, 2, 3, 4].map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onSelectDepthLevel(lvl)}
              className={`w-6 h-6 rounded text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                activeDepthLevel === lvl
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title={`Level ${lvl} view`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CleanAccountsHeader;
