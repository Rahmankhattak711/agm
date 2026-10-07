"use client";

import React from "react";
import { Card, CardVariant } from "@/components/ui/Card";

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
  badge,
  icon,
  footerText,
  className = "",
}) => {
  return (
    <Card
      title={title}
      value={value}
      subtitle={subtitle || footerText}
      currency={currency}
      accentColor={accentColor}
      badge={badge}
      icon={icon}
      className={className}
    />
  );
};

export interface ReportKpiGridProps {
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  printCols?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

export const ReportKpiGrid: React.FC<ReportKpiGridProps> = ({
  cols = 4,
  children,
  className = "",
}) => {
  const colClassMap: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  };

  return (
    <div
      className={`grid ${colClassMap[cols] || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"} gap-4 print:grid-cols-4 ${className}`}
    >
      {children}
    </div>
  );
};
