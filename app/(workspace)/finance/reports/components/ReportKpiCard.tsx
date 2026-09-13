import React from "react";

export type KpiAccentColor =
  | "emerald"
  | "sky"
  | "blue"
  | "indigo"
  | "amber"
  | "rose"
  | "teal"
  | "purple"
  | "slate";

const ACCENT_BG_CLASSES: Record<KpiAccentColor, string> = {
  emerald: "bg-emerald-500",
  sky: "bg-sky-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  teal: "bg-teal-500",
  purple: "bg-purple-500",
  slate: "bg-slate-400",
};

export interface ReportKpiCardProps {
  title: string;
  subtitle?: string;
  value: React.ReactNode;
  currency?: string | boolean;
  accentColor?: KpiAccentColor;
  valueColor?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  footerText?: React.ReactNode;
  className?: string;
}

export const ReportKpiCard: React.FC<ReportKpiCardProps> = ({
  title,
  subtitle,
  value,
  currency = "AED",
  accentColor = "emerald",
  valueColor = "text-slate-900",
  badge,
  icon,
  footerText,
  className = "",
}) => {
  const accentClass = ACCENT_BG_CLASSES[accentColor] || "bg-emerald-500";
  const currencySymbol = currency === true ? "AED" : currency || null;

  return (
    <div
      className={`relative overflow-hidden p-4.5 sm:p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1 transition hover:border-slate-300 hover:shadow-sm ${className}`}
    >
      <div className={`absolute inset-x-0 top-0 h-[2.5px] ${accentClass}`} />

      <div>
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
            {title}
          </span>
          {badge && <div className="shrink-0">{badge}</div>}
          {!badge && icon && <div className="shrink-0">{icon}</div>}
        </div>
        {subtitle && (
          <p className="text-xs print:text-[11px] text-slate-500 mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>

      <div className="pt-2 print:pt-0">
        <div className="flex items-baseline flex-wrap">
          {currencySymbol && (
            <span className="text-xs font-semibold text-slate-400 font-sans mr-1 shrink-0">
              {currencySymbol}
            </span>
          )}
          <span
            className={`text-xl print:text-base font-black font-mono tracking-tight ${valueColor}`}
          >
            {value}
          </span>
        </div>
        {footerText && (
          <div className="text-[10.5px] text-slate-400 mt-0.5 font-medium print:hidden">
            {footerText}
          </div>
        )}
      </div>
    </div>
  );
};

export interface ReportKpiGridProps {
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  printCols?: 1 | 2 | 3 | 4;
  printHidden?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ReportKpiGrid: React.FC<ReportKpiGridProps> = ({
  cols = 3,
  printHidden = true,
  children,
  className = "",
}) => {
  // Screen layout: 3 cards in a row
  const screenGridClass =
    cols === 1
      ? "grid-cols-1"
      : cols === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 md:grid-cols-3";

  return (
    <div
      className={`grid ${screenGridClass} gap-4 my-4 ${printHidden ? "print:hidden" : ""} ${className}`}
    >
      {children}
    </div>
  );
};

export default ReportKpiCard;
