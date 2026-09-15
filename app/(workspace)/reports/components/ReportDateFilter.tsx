"use client";

import React from "react";
import { Calendar } from "lucide-react";

export type PeriodFilterOption =
  "ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "CUSTOM";

export interface ReportDateFilterProps {
  periodFilter: string;
  onPeriodChange: (p: string) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (d: string) => void;
  onEndDateChange?: (d: string) => void;
  className?: string;
}

export const ReportDateFilter: React.FC<ReportDateFilterProps> = ({
  periodFilter,
  onPeriodChange,
  startDate = "",
  endDate = "",
  onStartDateChange,
  onEndDateChange,
  className = "",
}) => {
  const presets: { id: PeriodFilterOption; label: string }[] = [
    { id: "ALL", label: "All Time" },
    { id: "THIS_MONTH", label: "This Month" },
    { id: "LAST_MONTH", label: "Last Month" },
    { id: "THIS_QUARTER", label: "This Quarter" },
    { id: "THIS_YEAR", label: "This Year" },
    { id: "CUSTOM", label: "Custom Range" },
  ];

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
          <Calendar size={13} className="text-slate-400" />
          Period:
        </span>
        {presets.map((p) => {
          const isActive = periodFilter === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPeriodChange(p.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                isActive
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {periodFilter === "CUSTOM" && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 text-xs animate-fade-in">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500 text-[11px]">
              From:
            </span>
            <input
              type="date"
              className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono text-xs font-semibold focus:outline-none focus:border-emerald-500"
              value={startDate}
              onChange={(e) => onStartDateChange?.(e.target.value)}
            />
          </div>
          <span className="text-slate-400 font-bold">→</span>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500 text-[11px]">
              To:
            </span>
            <input
              type="date"
              className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono text-xs font-semibold focus:outline-none focus:border-emerald-500"
              value={endDate}
              onChange={(e) => onEndDateChange?.(e.target.value)}
            />
          </div>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                onStartDateChange?.("");
                onEndDateChange?.("");
              }}
              className="text-[10.5px] font-bold text-slate-400 hover:text-rose-600 underline ml-2 cursor-pointer"
            >
              Reset Dates
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportDateFilter;
