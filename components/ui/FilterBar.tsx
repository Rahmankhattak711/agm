"use client";

import React from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { SearchIcon, CloseIcon } from "@/components/icons";

export interface FilterBarTab {
  id: string;
  label: string;
  count?: number;
}

export interface FilterBarProps {
  tabs?: FilterBarTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  totalCount?: number;
  countLabel?: string;
  children?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  search = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  totalCount,
  countLabel = "Listed",
  children,
  rightAction,
  className = "",
}) => {
  const hasTabs = tabs && tabs.length > 0;
  const hasCount = totalCount !== undefined;
  const hasTopRow = hasTabs || hasCount;
  const hasSearch = typeof onSearchChange === "function";
  const hasBottomRow = hasSearch || children || rightAction;

  return (
    <div
      className={`p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 print:hidden ${className}`}
    >
      {hasTopRow && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {hasTabs && (
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onTabChange?.(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 font-bold"
                            : "bg-slate-200/70 text-slate-600"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          )}

          {hasCount && (
            <span className="text-[11px] font-bold text-slate-500 font-mono shrink-0 ml-auto sm:ml-0">
              {totalCount} {countLabel}
            </span>
          )}
        </div>
      )}

      {hasBottomRow && (
        <div
          className={`${
            hasTopRow ? "pt-1 border-t border-slate-200/60" : ""
          } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
        >
          {hasSearch && (
            <div className="relative w-full sm:w-96">
              <Input
                leftIcon={<SearchIcon size={14} className="text-slate-400" />}
                placeholder={searchPlaceholder}
                containerClassName="w-full"
                className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs pr-8"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <CloseIcon size={12} />
                </button>
              )}
            </div>
          )}

          {(children || rightAction) && (
            <div className="flex items-center gap-2 flex-wrap">
              {children}
              {rightAction}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
