"use client";

import React from "react";
import { PageHeader } from "@/components/ui";

export type PeriodOption = "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR";

interface OperationsDashboardHeaderProps {
  period: PeriodOption;
  onPeriodChange: (period: PeriodOption) => void;
  lastUpdatedTime?: string;
}

export default function OperationsDashboardHeader({
  period,
  onPeriodChange,
  lastUpdatedTime,
}: OperationsDashboardHeaderProps) {
  return (
    <PageHeader
      title="Operations Overview"
      description={
        lastUpdatedTime
          ? `Last updated today at ${lastUpdatedTime}`
          : "Workforce, attendance & assets"
      }
      actions={
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as PeriodOption)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
        >
          <option value="THIS_MONTH">This month</option>
          <option value="THIS_QUARTER">This quarter</option>
          <option value="THIS_YEAR">This year</option>
        </select>
      }
    />
  );
}
