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
  | string;

export type CardAccentColor = "default" | "neutral" | string;

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

export const Card: React.FC<CardProps> = ({
  id,
  title,
  value,
  subtitle,
  currency = false,
  loading = false,
  badge,
  icon,
  trend,
  onClick,
  className = "",
  children,
}) => {
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
        className={`relative rounded-xl border border-agm-box-border bg-agm-card text-agm-text transition-all duration-200 overflow-hidden shadow-2xs ${
          onClick
            ? "cursor-pointer hover:border-agm-border hover:shadow-xs active:scale-[0.99]"
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
      className={`p-3.5 sm:p-4 border border-agm-box-border rounded-xl flex flex-col justify-between space-y-2 transition-all duration-200 overflow-hidden bg-agm-card text-agm-text shadow-2xs hover:shadow-xs ${
        onClick
          ? "cursor-pointer hover:border-agm-border hover:shadow-xs active:scale-[0.99]"
          : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider leading-tight truncate text-agm-muted">
          {title}
        </span>
        {badge && <div className="shrink-0">{badge}</div>}
        {!badge && icon && (
          <div className="shrink-0 p-1.5 rounded-lg flex items-center justify-center bg-agm-box-bg text-agm-text border border-agm-box-border">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline flex-wrap gap-1 pt-0.5">
        {isLoading ? (
          <div className="h-7 w-24 rounded bg-agm-box-bg animate-pulse my-0.5" />
        ) : (
          <>
            <span className="text-xl sm:text-[20px] font-black font-mono tracking-tight leading-none text-agm-text">
              {displayValue}
            </span>
            {showCurrency && (
              <span className="text-xs font-bold font-mono text-agm-muted uppercase tracking-wide ml-1 select-none">
                {showCurrency}
              </span>
            )}
          </>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center justify-between text-xs pt-2 border-t border-agm-box-border min-h-[20px]">
          {subtitle && (
            <span className="truncate text-[11.5px] font-medium text-agm-muted">
              {subtitle}
            </span>
          )}
          {trend && !isLoading && (
            <span
              className={`shrink-0 ml-auto font-bold text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 font-mono ${
                trend.up
                  ? "text-agm-green-dark bg-agm-green-soft border-agm-green/30"
                  : trend.neutral
                    ? "text-agm-muted bg-agm-box-bg border-agm-box-border"
                    : "text-rose-700 bg-rose-50 border-rose-200"
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
    className={`p-3.5 sm:p-4 border-b border-agm-box-border flex flex-col space-y-1 ${className}`}
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
    className={`font-bold text-agm-text tracking-tight text-sm sm:text-base ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ className = "", children, ...props }) => (
  <p className={`text-xs text-agm-muted font-normal ${className}`} {...props}>
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
    className={`p-3.5 sm:p-4 border-t border-agm-box-border flex items-center justify-between ${className}`}
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
