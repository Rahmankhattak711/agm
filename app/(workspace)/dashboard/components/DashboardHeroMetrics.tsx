"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils/format";

interface DashboardHeroMetricsProps {
  salesOrderValue: number;
  salesOrderCount: number;
  overdueAmount: number;
  overdueCount: number;
  netProfitMargin: number;
  netIncome: number;
  revenue: number;
}

export default function DashboardHeroMetrics({
  salesOrderValue,
  salesOrderCount,
  overdueAmount,
  overdueCount,
  netProfitMargin,
  netIncome,
  revenue,
}: DashboardHeroMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-5 bg-white border border-agm-box-border rounded-[12px] flex flex-col justify-between space-y-1">
        <span className="text-[13px] font-normal text-agm-muted">
          Sales order value
        </span>
        <div className="text-[26px] font-medium text-agm-text tracking-tight">
          {formatCurrency(salesOrderValue)}
        </div>
        <span className="text-xs font-normal text-agm-muted">
          {salesOrderCount} active sales{" "}
          {salesOrderCount === 1 ? "order" : "orders"}
        </span>
      </div>

      <div className="p-5 bg-[#fef2f2] border border-[#fecaca] rounded-[12px] flex flex-col justify-between space-y-1">
        <span className="text-[13px] font-normal text-[#991b1b]">
          Total overdue
        </span>
        <div className="text-[26px] font-medium text-[#7f1d1d] tracking-tight">
          {formatCurrency(overdueAmount)}
        </div>
        <span className="text-xs font-normal text-[#b91c1c]">
          {overdueCount > 0
            ? `${overdueCount} ${overdueCount === 1 ? "invoice requires" : "invoices require"} immediate follow-up`
            : "No overdue invoices"}
        </span>
      </div>

      <div className="p-5 bg-white border border-agm-box-border rounded-[12px] flex flex-col justify-between space-y-1">
        <span className="text-[13px] font-normal text-agm-muted">
          Net profit margin
        </span>
        <div className="text-[26px] font-medium text-agm-text tracking-tight">
          {`${netProfitMargin.toFixed(1)}%`}
        </div>
        <span className="text-xs font-normal text-agm-muted">
          {revenue > 0
            ? `${formatCurrency(netIncome)} net on ${formatCurrency(revenue)} revenue`
            : "Operating profit on recognized revenue"}
        </span>
      </div>
    </div>
  );
}
