"use client";

import React from "react";
import { DashboardCard, DashboardCardGrid } from "@/components/ui";
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
    <DashboardCardGrid cols={3}>
      <DashboardCard
        title="Sales order value"
        value={formatCurrency(salesOrderValue)}
        subtitle={`${salesOrderCount} active sales ${
          salesOrderCount === 1 ? "order" : "orders"
        }`}
        accentColor="blue"
      />

      <DashboardCard
        title="Total overdue"
        value={formatCurrency(overdueAmount)}
        subtitle={
          overdueCount > 0
            ? `${overdueCount} ${
                overdueCount === 1 ? "invoice requires" : "invoices require"
              } immediate follow-up`
            : "No overdue invoices"
        }
        accentColor={overdueAmount > 0 ? "rose" : "slate"}
      />

      <DashboardCard
        title="Net profit margin"
        value={`${netProfitMargin.toFixed(1)}%`}
        subtitle={
          revenue > 0
            ? `${formatCurrency(netIncome)} net on ${formatCurrency(revenue)} revenue`
            : "Operating profit on recognized revenue"
        }
        accentColor="emerald"
      />
    </DashboardCardGrid>
  );
}
