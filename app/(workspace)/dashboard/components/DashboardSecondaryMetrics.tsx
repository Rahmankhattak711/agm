"use client";

import React from "react";
import { DashboardCard, DashboardCardGrid } from "@/components/ui";
import { formatCurrency } from "@/lib/utils/format";

interface DashboardSecondaryMetricsProps {
  totalReceivables: number;
  totalPayables: number;
  operatingSpend: number;
  debtToEquity: number;
}

export default function DashboardSecondaryMetrics({
  totalReceivables,
  totalPayables,
  operatingSpend,
  debtToEquity,
}: DashboardSecondaryMetricsProps) {
  return (
    <DashboardCardGrid cols={4}>
      <DashboardCard
        title="Total receivables"
        value={formatCurrency(totalReceivables)}
        accentColor="blue"
      />

      <DashboardCard
        title="Total payables"
        value={formatCurrency(totalPayables)}
        accentColor="amber"
      />

      <DashboardCard
        title="Operating spend"
        value={formatCurrency(operatingSpend)}
        accentColor="indigo"
      />

      <DashboardCard
        title="Debt to equity"
        value={debtToEquity.toFixed(2)}
        accentColor="slate"
      />
    </DashboardCardGrid>
  );
}
