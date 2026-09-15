"use client";

import React from "react";
import { DashboardCard, DashboardCardGrid } from "@/components/ui";

function formatNumber(val: number | string | undefined): string {
  const num = Number(val || 0);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export interface CustomerKpisProps {
  totalClients: number;
  totalReceivables: number;
  totalCreditLimits: number;
  trnCount: number;
}

export function CustomerKpis({
  totalClients,
  totalReceivables,
  totalCreditLimits,
  trnCount,
}: CustomerKpisProps) {
  return (
    <DashboardCardGrid cols={4}>
      <DashboardCard
        title="Total Active Clients"
        value={totalClients}
        subtitle={`${totalClients} registered client accounts`}
        variant="default"
      />

      <DashboardCard
        title="Outstanding Receivables"
        value={`AED ${formatNumber(totalReceivables)}`}
        subtitle="Open invoices due for collection"
        variant={totalReceivables > 0 ? "danger" : "default"}
      />

      <DashboardCard
        title="Total Credit Facility"
        value={`AED ${formatNumber(totalCreditLimits)}`}
        subtitle="Extended credit limits"
        variant="default"
      />

      <DashboardCard
        title="Corporate TRN"
        value={trnCount}
        subtitle="VAT verified corporate entities"
        badge={
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
            Tax Reg
          </span>
        }
        variant="default"
      />
    </DashboardCardGrid>
  );
}
