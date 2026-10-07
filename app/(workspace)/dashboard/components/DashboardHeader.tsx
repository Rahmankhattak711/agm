"use client";

import React from "react";
import { PageHeader } from "@/components/ui";

export type PeriodOption = "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR";

interface DashboardHeaderProps {
  period: PeriodOption;
  onPeriodChange: (period: PeriodOption) => void;
  lastUpdatedTime?: string;
}

export default function DashboardHeader({
  period,
  onPeriodChange,
  lastUpdatedTime,
}: DashboardHeaderProps) {
  return (
    <PageHeader
      title="Finance overview"
      description={
        lastUpdatedTime
          ? `Last updated today at ${lastUpdatedTime}`
          : "Real-time ledger overview"
      }
      actions={
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as PeriodOption)}
          className="bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-agm-navy shadow-2xs cursor-pointer"
        >
          <option value="THIS_MONTH">This month</option>
          <option value="THIS_QUARTER">This quarter</option>
          <option value="THIS_YEAR">This year</option>
        </select>
      }
    />
  );
}
