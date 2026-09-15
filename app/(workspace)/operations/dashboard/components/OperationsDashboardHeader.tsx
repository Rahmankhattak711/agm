"use client";

import React from "react";

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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
      <div>
        <h1 className="text-xl font-medium text-agm-text tracking-tight">
          Operations overview
        </h1>
        <p className="text-xs font-normal text-agm-muted mt-0.5">
          {lastUpdatedTime
            ? `Last updated today at ${lastUpdatedTime}`
            : "Workforce, attendance & assets"}
        </p>
      </div>

      <div>
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as PeriodOption)}
          className="bg-white border border-agm-box-border rounded-[12px] px-3 py-1.5 text-xs font-normal text-agm-text focus:outline-none focus:border-agm-navy cursor-pointer"
        >
          <option value="THIS_MONTH">This month</option>
          <option value="THIS_QUARTER">This quarter</option>
          <option value="THIS_YEAR">This year</option>
        </select>
      </div>
    </div>
  );
}
