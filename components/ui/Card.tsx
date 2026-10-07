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
  currency: string;
  iconBg: string;
  badge: string;
  glow: string;
}

const VARIANT_STYLES: Record<string, VariantStyle> = {
  default: {
    container:
      "bg-white border-slate-200/80 hover:border-slate-300 text-slate-900 shadow-2xs hover:shadow-md",
    title: "text-slate-500",
    value: "text-slate-900",
    subtitle: "text-slate-400",
    currency: "text-slate-500 bg-slate-100/90 border-slate-200/70",
    iconBg:
      "bg-slate-100/90 text-slate-700 border border-slate-200/70 shadow-2xs",
    badge: "bg-slate-100 text-slate-700 border-slate-200/70",
    glow: "from-slate-400/10 to-transparent",
  },
  emerald: {
    container:
      "bg-gradient-to-b from-emerald-50/70 via-white to-white border-emerald-200/80 hover:border-emerald-400 text-emerald-950 shadow-2xs hover:shadow-md",
    title: "text-emerald-800",
    value: "text-emerald-950",
    subtitle: "text-emerald-700/80",
    currency: "text-emerald-700 bg-emerald-100/80 border-emerald-200/80",
    iconBg:
      "bg-emerald-100 text-emerald-800 border border-emerald-200/90 shadow-2xs",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    glow: "from-emerald-400/20 to-transparent",
  },
  rose: {
    container:
      "bg-gradient-to-b from-rose-50/70 via-white to-white border-rose-200/80 hover:border-rose-400 text-rose-950 shadow-2xs hover:shadow-md",
    title: "text-rose-800",
    value: "text-rose-950",
    subtitle: "text-rose-700/80",
    currency: "text-rose-700 bg-rose-100/80 border-rose-200/80",
    iconBg: "bg-rose-100 text-rose-800 border border-rose-200/90 shadow-2xs",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    glow: "from-rose-400/20 to-transparent",
  },
  amber: {
    container:
      "bg-gradient-to-b from-amber-50/70 via-white to-white border-amber-200/80 hover:border-amber-400 text-amber-950 shadow-2xs hover:shadow-md",
    title: "text-amber-800",
    value: "text-amber-950",
    subtitle: "text-amber-700/80",
    currency: "text-amber-700 bg-amber-100/80 border-amber-200/80",
    iconBg: "bg-amber-100 text-amber-800 border border-amber-200/90 shadow-2xs",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    glow: "from-amber-400/20 to-transparent",
  },
  blue: {
    container:
      "bg-gradient-to-b from-sky-50/70 via-white to-white border-sky-200/80 hover:border-sky-400 text-sky-950 shadow-2xs hover:shadow-md",
    title: "text-sky-800",
    value: "text-sky-950",
    subtitle: "text-sky-700/80",
    currency: "text-sky-700 bg-sky-100/80 border-sky-200/80",
    iconBg: "bg-sky-100 text-sky-800 border border-sky-200/90 shadow-2xs",
    badge: "bg-sky-100 text-sky-800 border-sky-200",
    glow: "from-sky-400/20 to-transparent",
  },
  sky: {
    container:
      "bg-gradient-to-b from-sky-50/70 via-white to-white border-sky-200/80 hover:border-sky-400 text-sky-950 shadow-2xs hover:shadow-md",
    title: "text-sky-800",
    value: "text-sky-950",
    subtitle: "text-sky-700/80",
    currency: "text-sky-700 bg-sky-100/80 border-sky-200/80",
    iconBg: "bg-sky-100 text-sky-800 border border-sky-200/90 shadow-2xs",
    badge: "bg-sky-100 text-sky-800 border-sky-200",
    glow: "from-sky-400/20 to-transparent",
  },
  indigo: {
    container:
      "bg-gradient-to-b from-indigo-50/70 via-white to-white border-indigo-200/80 hover:border-indigo-400 text-indigo-950 shadow-2xs hover:shadow-md",
    title: "text-indigo-800",
    value: "text-indigo-950",
    subtitle: "text-indigo-700/80",
    currency: "text-indigo-700 bg-indigo-100/80 border-indigo-200/80",
    iconBg:
      "bg-indigo-100 text-indigo-800 border border-indigo-200/90 shadow-2xs",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
    glow: "from-indigo-400/20 to-transparent",
  },
  purple: {
    container:
      "bg-gradient-to-b from-purple-50/70 via-white to-white border-purple-200/80 hover:border-purple-400 text-purple-950 shadow-2xs hover:shadow-md",
    title: "text-purple-800",
    value: "text-purple-950",
    subtitle: "text-purple-700/80",
    currency: "text-purple-700 bg-purple-100/80 border-purple-200/80",
    iconBg:
      "bg-purple-100 text-purple-800 border border-purple-200/90 shadow-2xs",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    glow: "from-purple-400/20 to-transparent",
  },
  teal: {
    container:
      "bg-gradient-to-b from-teal-50/70 via-white to-white border-teal-200/80 hover:border-teal-400 text-teal-950 shadow-2xs hover:shadow-md",
    title: "text-teal-800",
    value: "text-teal-950",
    subtitle: "text-teal-700/80",
    currency: "text-teal-700 bg-teal-100/80 border-teal-200/80",
    iconBg: "bg-teal-100 text-teal-800 border border-teal-200/90 shadow-2xs",
    badge: "bg-teal-100 text-teal-800 border-teal-200",
    glow: "from-teal-400/20 to-transparent",
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
        className={`relative rounded-2xl border transition-all duration-300 overflow-hidden ${styles.container} ${
          onClick
            ? "cursor-pointer hover:-translate-y-0.5 active:scale-[0.99]"
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
      className={`relative p-4 sm:p-5 border rounded-2xl flex flex-col justify-between space-y-2.5 transition-all duration-300 ease-out overflow-hidden group ${styles.container} ${
        onClick
          ? "cursor-pointer hover:-translate-y-0.5 active:scale-[0.99]"
          : ""
      } ${className}`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${styles.glow} rounded-full blur-2xl pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`}
      />

      <div className="flex items-start justify-between gap-2.5 relative z-10">
        <span
          className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider leading-tight truncate ${styles.title}`}
        >
          {title}
        </span>
        {badge && <div className="shrink-0">{badge}</div>}
        {!badge && icon && (
          <div
            className={`shrink-0 p-2 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${styles.iconBg}`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline flex-wrap gap-1.5 pt-0.5 relative z-10">
        {isLoading ? (
          <div className="flex flex-col gap-1.5 py-1">
            <div className="h-7 w-28 rounded-lg bg-slate-200/60 animate-pulse" />
          </div>
        ) : (
          <>
            {showCurrency && (
              <span
                className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${styles.currency}`}
              >
                {showCurrency}
              </span>
            )}
            <span
              className={`text-2xl sm:text-[28px] font-black font-mono tracking-tight leading-none ${styles.value}`}
            >
              {displayValue}
            </span>
          </>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center justify-between text-xs font-normal pt-1 border-t border-slate-100/80 min-h-[18px] relative z-10">
          {subtitle && (
            <span className={`truncate text-xs font-medium ${styles.subtitle}`}>
              {subtitle}
            </span>
          )}
          {trend && !isLoading && (
            <span
              className={`shrink-0 ml-auto font-bold text-[10.5px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                trend.up
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200/70"
                  : trend.neutral
                    ? "text-slate-600 bg-slate-50 border-slate-200/70"
                    : "text-rose-700 bg-rose-50 border-rose-200/70"
              }`}
            >
              <span>{trend.up ? "↑" : trend.neutral ? "•" : "↓"}</span>
              <span>{trend.label}</span>
            </span>
          )}
        </div>
      )}

      {children && <div className="relative z-10 pt-2">{children}</div>}
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
    <div className={`grid ${colClasses} gap-4 ${className}`}>{children}</div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div
    className={`p-4 sm:p-5 border-b border-slate-100/90 flex flex-col space-y-1.5 ${className}`}
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
    className={`font-black text-slate-900 tracking-tight text-base sm:text-lg ${className}`}
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
  <div className={`p-4 sm:p-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  children,
  ...props
}) => (
  <div
    className={`p-4 sm:p-5 border-t border-slate-100/90 flex items-center justify-between ${className}`}
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
