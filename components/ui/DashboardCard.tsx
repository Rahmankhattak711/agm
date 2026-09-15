"use client";

import React from "react";

export type DashboardCardVariant =
  "default" | "danger" | "warning" | "success" | "neutral";

export interface DashboardCardProps {
  id?: string;
  title: React.ReactNode;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  currency?: string | boolean;
  variant?: DashboardCardVariant;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: {
    label: string;
    up?: boolean;
    neutral?: boolean;
  };
  onClick?: () => void;
  className?: string;
}

const VARIANT_STYLES: Record<
  DashboardCardVariant,
  {
    container: string;
    title: string;
    value: string;
    subtitle: string;
  }
> = {
  default: {
    container: "bg-white border-agm-box-border hover:border-agm-green/30",
    title: "text-agm-muted",
    value: "text-agm-text",
    subtitle: "text-agm-muted",
  },
  danger: {
    container: "bg-[#fef2f2] border-[#fecaca] hover:border-red-300",
    title: "text-[#991b1b]",
    value: "text-[#7f1d1d]",
    subtitle: "text-[#b91c1c]",
  },
  warning: {
    container: "bg-[#fffbeb] border-[#fef3c7] hover:border-amber-300",
    title: "text-[#92400e]",
    value: "text-[#78350f]",
    subtitle: "text-[#b45309]",
  },
  success: {
    container:
      "bg-agm-green-soft/50 border-agm-box-border hover:border-agm-green/40",
    title: "text-agm-green",
    value: "text-agm-green-dark",
    subtitle: "text-agm-green",
  },
  neutral: {
    container: "bg-white border-agm-box-border hover:border-agm-muted/30",
    title: "text-agm-muted",
    value: "text-agm-text",
    subtitle: "text-agm-muted",
  },
};

export const DashboardCard: React.FC<DashboardCardProps> = ({
  id,
  title,
  value,
  subtitle,
  currency = false,
  variant = "default",
  badge,
  icon,
  trend,
  onClick,
  className = "",
}) => {
  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.default;
  const currencySymbol = currency === true ? "AED" : currency || null;

  const valueStr = typeof value === "string" ? value : "";
  const hasAedPrefix = valueStr.trim().startsWith("AED");
  const displayValue = hasAedPrefix ? valueStr.replace(/^AED\s*/, "") : value;
  const showCurrency = currencySymbol || (hasAedPrefix ? "AED" : null);

  return (
    <div
      id={id}
      onClick={onClick}
      className={`p-5 border rounded-[14px] flex flex-col justify-between space-y-2 transition-all duration-200 shadow-2xs ${styles.container} ${
        onClick ? "cursor-pointer hover:shadow-xs" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`text-[13px] font-normal leading-tight truncate ${styles.title}`}
        >
          {title}
        </span>
        {badge && <div className="shrink-0">{badge}</div>}
        {!badge && icon && <div className="shrink-0 opacity-80">{icon}</div>}
      </div>

      <div className="flex items-baseline flex-wrap gap-1.5 pt-0.5">
        {showCurrency && (
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${styles.title}`}
          >
            {showCurrency}
          </span>
        )}
        <span
          className={`text-[26px] font-medium tracking-tight font-sans leading-none ${styles.value}`}
        >
          {displayValue}
        </span>
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center justify-between text-xs font-normal pt-0.5 min-h-[16px]">
          {subtitle && (
            <span className={`truncate ${styles.subtitle}`}>{subtitle}</span>
          )}
          {trend && (
            <span
              className={`shrink-0 ml-auto font-medium ${
                trend.up
                  ? "text-emerald-600"
                  : trend.neutral
                    ? "text-slate-500"
                    : "text-rose-600"
              }`}
            >
              {trend.up ? "↑ " : trend.neutral ? "• " : "↓ "}
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardCard;

export interface DashboardCardGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

export const DashboardCardGrid: React.FC<DashboardCardGridProps> = ({
  children,
  cols = 4,
  className = "",
}) => {
  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
  }[cols];

  return (
    <div className={`grid ${colClasses} gap-4 print:grid-cols-4 ${className}`}>
      {children}
    </div>
  );
};
