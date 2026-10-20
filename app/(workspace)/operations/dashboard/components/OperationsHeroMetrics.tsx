"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils/format";

interface OperationsHeroMetricsProps {
  totalActiveEmployees: number;
  totalEmployees: number;
  departmentCount: number;
  absentCount: number;
  pendingLeavesCount: number;
  monthlyPayroll: number;
  averageSalary: number;
}

export default function OperationsHeroMetrics({
  totalActiveEmployees,
  totalEmployees,
  departmentCount,
  absentCount,
  pendingLeavesCount,
  monthlyPayroll,
  averageSalary,
}: OperationsHeroMetricsProps) {
  const urgentCount = absentCount + pendingLeavesCount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-5 bg-agm-card border border-agm-box-border rounded-[12px] flex flex-col justify-between space-y-1">
        <span className="text-[13px] font-normal text-agm-muted">
          Active workforce
        </span>
        <div className="text-[26px] font-medium text-agm-text tracking-tight">
          {totalActiveEmployees}{" "}
          <span className="text-sm font-normal text-agm-muted">
            / {totalEmployees} total
          </span>
        </div>
        <span className="text-xs font-normal text-agm-muted">
          Across {departmentCount} operational{" "}
          {departmentCount === 1 ? "department" : "departments"}
        </span>
      </div>

      <div className="p-5 bg-[#fef2f2] border border-[#fecaca] rounded-[12px] flex flex-col justify-between space-y-1">
        <span className="text-[13px] font-normal text-[#991b1b]">
          Attention required
        </span>
        <div className="text-[26px] font-medium text-[#7f1d1d] tracking-tight">
          {urgentCount} {urgentCount === 1 ? "issue" : "issues"}
        </div>
        <span className="text-xs font-normal text-[#b91c1c]">
          {urgentCount > 0
            ? `${absentCount} absent today · ${pendingLeavesCount} pending leave approvals`
            : "All attendance & leave requests up to date"}
        </span>
      </div>

      <div className="p-5 bg-agm-card border border-agm-box-border rounded-[12px] flex flex-col justify-between space-y-1">
        <span className="text-[13px] font-normal text-agm-muted">
          Monthly payroll liability
        </span>
        <div className="text-[26px] font-medium text-agm-text tracking-tight">
          {formatCurrency(monthlyPayroll)}
        </div>
        <span className="text-xs font-normal text-agm-muted">
          Avg. {formatCurrency(averageSalary)} per active employee
        </span>
      </div>
    </div>
  );
}
