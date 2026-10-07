"use client";

import React from "react";

export type CardVariant =
  | "default"
  | "neutral"
  | "danger"
  | "warning"
  | "success"
  | "info"
  | "primary"
  | "emerald"
  | "blue"
  | "amber"
  | "rose"
  | "indigo"
  | "purple"
  | "teal"
  | "sky"
  | "slate";

export type CardAccentColor =
  | "emerald"
  | "blue"
  | "amber"
  | "slate"
  | "indigo"
  | "rose"
  | "purple"
  | "teal"
  | "sky"
  | "neutral"
  | "default";

export interface CardProps {
  id?: string;
  title?: React.ReactNode;
  value?: React.ReactNode;
  subtitle?: React.ReactNode;
  currency?: string | boolean;
  variant?: CardVariant;
  accentColor?: CardAccentColor;
  loading?: boolean;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: {
    label: string;
    up?: boolean;
    neutral?: boolean;
  };
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

interface VariantStyle {
  container: string;
  title: string;
  value: string;
  subtitle: string;
  iconBg: string;
  badge: string;
}

const VARIANT_STYLES: Record<string, VariantStyle> = {
  default: {
    container:
      "bg-white border-slate-200/90 hover:border-slate-300 text-slate-900 shadow-2xs hover:shadow-xs",
    title: "text-slate-500",
    value: "text-slate-900",
    subtitle: "text-slate-400",
    iconBg: "bg-slate-50 text-slate-700 border border-slate-200/80",
    badge: "bg-slate-50 text-slate-700 border-slate-200",
  },
  emerald: {
    container:
      "bg-white border-slate-200/90 hover:border-emerald-300 text-slate-900 shadow-2xs hover:shadow-xs",
    title: "text-emerald-700",
    value: "text-slate-900",
    subtitle: "text-slate-400",
    iconBg: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  rose: {
    container:
      "bg-white border-slate-200/90 hover:border-rose-300 text-slate-900 shadow-2xs hover:shadow-xs",
    title: "text-rose-700",
    value: "text-rose-600",
    subtitle: "text-slate-400",
    iconBg: "bg-rose-50 text-rose-800 border border-rose-200",
    badge: "bg-rose-50 text-rose-800 border-rose-200",
  },
  amber: {
    container:
      "bg-white border-slate-200/90 hover:border-amber-300 text-slate-900 shadow-2xs hover:shadow-xs",
    title: "text-amber-700",
    value: "text-slate-900",
    subtitle: "text-slate-400",
    iconBg: "bg-amber-50 text-amber-800 border border-amber-200",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
  },
  blue: {
    container:
      "bg-white border-slate-200/90 hover:border-sky-300 text-slate-900 shadow-2xs hover:shadow-xs",
    title: "text-sky-700",
    value: "text-slate-900",
    subtitle: "text-slate-400",
    iconBg: "bg-sky-50 text-sky-800 border border-sky-200",
    badge: "bg-sky-50 text-sky-800 border-sky-200",
  },
  sky: {
    container:
      "bg-white border-slate-200/90 hover:border-sky-300 text-slate-900 shadow-2xs hover:shadow-xs",
    title: "text-sky-700",
    value: "text-slate-900",
    subtitle: "text-slate-400",
    iconBg: "bg-sky-50 text-sky-800 border border-sky-200",
    badge: "bg-sky-50 text-sky-800 border-sky-200",
  },
  indigo: {
    container:
      "bg-white border-slate-200/90 hover:border-indigo-300 text-slate-900 shadow-2xs hover:shadow-xs",
    title: "text-indigo-700",
    value: "text-slate-900",
    subtitle: "text-slate-400",
    iconBg: "bg-indigo-50 text-indigo-800 border border-indigo-200",
    badge: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  purple: {
    container:
      "bg-white border-slate-200/90 hover:border-purple-300 text-slate-900 shadow-2xs hover:shadow-xs",
    title: "text-purple-700",
    value: "text-slate-900",
    subtitle: "text-slate-400",
    iconBg: "bg-purple-50 text-purple-800 border border-purple-200",
    badge: "bg-purple-50 text-purple-800 border-purple-200",
  },
  teal: {
    container:
      "bg-white border-slate-200/90 hover:border-teal-300 text-slate-900 shadow-2xs hover:shadow-xs",
    title: "text-teal-700",
    value: "text-slate-900",
    subtitle: "text-slate-400",
    iconBg: "bg-teal-50 text-teal-800 border border-teal-200",
    badge: "bg-teal-50 text-teal-800 border-teal-200",
  },
};

function resolveVariant(
  variant?: CardVariant,
  accentColor?: CardAccentColor,
): string {
  const chosen = accentColor || variant || "default";
  switch (chosen) {
    case "rose":
    case "danger":
      return "rose";
    case "amber":
    case "warning":
      return "amber";
    case "emerald":
    case "success":
      return "emerald";
    case "blue":
    case "info":
      return "blue";
    case "sky":
      return "sky";
    case "indigo":
    case "primary":
      return "indigo";
    case "purple":
      return "purple";
    case "teal":
      return "teal";
    case "slate":
    case "neutral":
    case "default":
    default:
      return "default";
  }
}

export const Card: React.FC<CardProps> = ({
  id,
  title,
  value,
  subtitle,
  currency = false,
  variant,
  accentColor,
  loading = false,
  badge,
  icon,
  trend,
  onClick,
  className = "",
  children,
}) => {
  const key = resolveVariant(variant, accentColor);
  const styles = VARIANT_STYLES[key] || VARIANT_STYLES.default;
  const currencySymbol = currency === true ? "AED" : currency || null;

  const valueStr = typeof value === "string" ? value : "";
  const isValuePlaceholder =
    valueStr.trim() === "..." || valueStr.trim() === "AED ...";
  const hasAedPrefix = valueStr.trim().startsWith("AED");
  const displayValue = hasAedPrefix ? valueStr.replace(/^AED\s*/, "") : value;
  const showCurrency = currencySymbol || (hasAedPrefix ? "AED" : null);
  const isLoading = loading || isValuePlaceholder;

  if (children && title === undefined && value === undefined) {
    return (
      <div
        id={id}
        onClick={onClick}
        className={`relative rounded-xl border bg-white transition-all duration-200 overflow-hidden ${styles.container} ${
          onClick
            ? "cursor-pointer hover:border-slate-300 hover:shadow-xs active:scale-[0.99]"
            : ""
        } ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      id={id}
      onClick={onClick}
      className={`p-3.5 sm:p-4 border rounded-xl flex flex-col justify-between space-y-2 transition-all duration-200 overflow-hidden ${styles.container} ${
        onClick
          ? "cursor-pointer hover:border-slate-300 hover:shadow-xs active:scale-[0.99]"
          : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[11px] font-bold uppercase tracking-wider leading-tight truncate ${styles.title}`}
        >
          {title}
        </span>
        {badge && <div className="shrink-0">{badge}</div>}
        {!badge && icon && (
          <div
            className={`shrink-0 p-1.5 rounded-lg flex items-center justify-center ${styles.iconBg}`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline flex-wrap gap-1 pt-0.5">
        {isLoading ? (
          <div className="h-7 w-24 rounded bg-slate-100 animate-pulse my-0.5" />
        ) : (
          <>
            <span
              className={`text-xl sm:text-[20px] font-black font-mono tracking-tight leading-none ${styles.value}`}
            >
              {displayValue}
            </span>
            {showCurrency && (
              <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wide ml-1 select-none">
                {showCurrency}
              </span>
            )}
          </>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 min-h-[20px]">
          {subtitle && (
            <span
              className={`truncate text-[11.5px] font-medium ${styles.subtitle}`}
            >
              {subtitle}
            </span>
          )}
          {trend && !isLoading && (
            <span
              className={`shrink-0 ml-auto font-bold text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 font-mono ${
                trend.up
                  ? "text-emerald-700 bg-emerald-50/80 border-emerald-200"
                  : trend.neutral
                    ? "text-slate-600 bg-slate-50 border-slate-200"
                    : "text-rose-700 bg-rose-50/80 border-rose-200"
              }`}
            >
              <span>{trend.up ? "↑" : trend.neutral ? "•" : "↓"}</span>
              <span>{trend.label}</span>
            </span>
          )}
        </div>
      )}

      {children && <div className="pt-1.5">{children}</div>}
    </div>
  );
};

export interface CardGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({
  children,
  cols = 4,
  className = "",
}) => {
  const colClasses =
    {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
      6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
    }[cols] || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={`grid ${colClasses} gap-3 sm:gap-4 ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div
    className={`p-3.5 sm:p-4 border-b border-slate-100 flex flex-col space-y-1 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <h3
    className={`font-black text-slate-900 tracking-tight text-sm sm:text-base ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ className = "", children, ...props }) => (
  <p className={`text-xs text-slate-500 font-normal ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div className={`p-3.5 sm:p-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div
    className={`p-3.5 sm:p-4 border-t border-slate-100 flex items-center justify-between ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const DashboardCard = Card;
export const StatCard = Card;
export const DashboardCardGrid = CardGrid;

export type DashboardCardProps = CardProps;
export type StatCardProps = CardProps;
export type DashboardCardVariant = CardVariant;
export type DashboardCardAccentColor = CardAccentColor;
export type DashboardCardGridProps = CardGridProps;

export default Card;
