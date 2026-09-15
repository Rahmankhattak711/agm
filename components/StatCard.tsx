"use client";

import React from "react";
import { DashboardCard, DashboardCardVariant } from "./ui/DashboardCard";

export interface StatCardProps {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: "emerald" | "blue" | "amber" | "slate" | "indigo" | "rose";
  loading?: boolean;
  trend?: { label: string; up: boolean; neutral?: boolean };
}

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
  let variant: DashboardCardVariant = "default";
  if (accentColor === "rose") variant = "danger";
  else if (accentColor === "amber") variant = "warning";
  else if (accentColor === "emerald") variant = "default";

  return (
    <DashboardCard
      id={id}
      title={title}
      value={loading ? "..." : value}
      subtitle={subtitle}
      icon={icon}
      variant={variant}
      trend={trend}
    />
  );
}
