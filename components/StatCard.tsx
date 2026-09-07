"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatCardProps {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: "emerald" | "blue" | "amber" | "slate" | "indigo" | "rose";
  loading?: boolean;
  trend?: { label: string; up: boolean; neutral?: boolean };
}

const ACCENT_STYLES = {
  emerald: {
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100",
    topLine: "bg-emerald-500",
    glow: "hover:border-emerald-200/80 hover:shadow-emerald-500/5",
  },
  blue: {
    iconBg: "bg-sky-50 text-sky-600 border-sky-100",
    topLine: "bg-sky-500",
    glow: "hover:border-sky-200/80 hover:shadow-sky-500/5",
  },
  amber: {
    iconBg: "bg-amber-50 text-amber-600 border-amber-100",
    topLine: "bg-amber-500",
    glow: "hover:border-amber-200/80 hover:shadow-amber-500/5",
  },
  slate: {
    iconBg: "bg-slate-50 text-slate-600 border-slate-100",
    topLine: "bg-slate-500",
    glow: "hover:border-slate-200/80 hover:shadow-slate-500/5",
  },
  indigo: {
    iconBg: "bg-indigo-50 text-indigo-600 border-indigo-100",
    topLine: "bg-indigo-500",
    glow: "hover:border-indigo-200/80 hover:shadow-indigo-500/5",
  },
  rose: {
    iconBg: "bg-rose-50 text-rose-600 border-rose-100",
    topLine: "bg-rose-500",
    glow: "hover:border-rose-200/80 hover:shadow-rose-500/5",
  },
};

export default function StatCard({
  id,
  title,
  value,
  subtitle,
  icon,
  accentColor = "emerald",
  loading = false,
  trend,
}: StatCardProps) {
  const styles = ACCENT_STYLES[accentColor] ?? ACCENT_STYLES.emerald;

  const valueStr = String(value ?? "AED 0.00");
  const hasAedPrefix = valueStr.startsWith("AED ");
  const currencyPrefix = hasAedPrefix ? "AED" : "";
  const numericDisplay = hasAedPrefix ? valueStr.replace("AED ", "") : valueStr;

  return (
    <div
      id={id}
      className={`
        group relative flex min-h-[152px] flex-col justify-between
        overflow-hidden rounded-2xl border border-slate-200/70
        bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]
        transition-all duration-300 ease-out
        hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(15,23,42,0.08)]
        ${styles.glow}
      `}
    >
      {/* Top accent bar */}
      <div
        className={`absolute inset-x-0 top-0 h-[2.5px] ${styles.topLine} opacity-90`}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            {title}
          </p>
          {subtitle && (
            <p className="mt-0.5 truncate text-[12px] font-medium text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`
            flex h-9 w-9 shrink-0 items-center justify-center
            rounded-xl border shadow-sm
            transition-transform duration-300 group-hover:scale-105
            ${styles.iconBg}
          `}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      <div className="mt-3 mb-1">
        {loading ? (
          <div className="h-8 w-28 animate-pulse rounded-lg bg-slate-100" />
        ) : (
          <div className="flex items-baseline gap-1.5">
            {currencyPrefix && (
              <span className="text-[11px] font-semibold tracking-wide text-slate-400">
                {currencyPrefix}
              </span>
            )}
            <span
              title={numericDisplay}
              className="font-mono text-xl sm:text-2xl lg:text-[1.55rem] font-bold leading-none tracking-tight text-slate-900 truncate"
            >
              {numericDisplay}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-slate-100/80 pt-3">
        {trend && !loading ? (
          <div
            className={`
              inline-flex items-center gap-1 rounded-full border px-2 py-0.5
              text-[10.5px] font-semibold
              ${
                trend.neutral
                  ? "border-slate-200 bg-slate-50 text-slate-600"
                  : trend.up
                    ? "border-emerald-200/70 bg-emerald-50 text-emerald-700"
                    : "border-rose-200/70 bg-rose-50 text-rose-700"
              }
            `}
          >
            {trend.neutral ? (
              <Minus size={10} strokeWidth={2.5} />
            ) : trend.up ? (
              <TrendingUp size={11} strokeWidth={2.5} />
            ) : (
              <TrendingDown size={11} strokeWidth={2.5} />
            )}
            <span>{trend.label}</span>
          </div>
        ) : (
          <span className="text-[11px] font-medium text-slate-400">
            Real-time balance
          </span>
        )}

        <span
          className="
            h-1.5 w-1.5 rounded-full bg-slate-300
            transition-colors duration-300
            group-hover:bg-emerald-500
          "
        />
      </div>
    </div>
  );
}
