"use client";

import React from "react";
import { DashboardCard, DashboardCardGrid } from "@/components/ui";
import { formatNumber } from "./types";

export interface SalesInvoiceKPIsProps {
  totalBilled: number;
  totalOutstanding: number;
  totalSettled: number;
  totalVatOutput: number;
}

export const SalesInvoiceKPIs: React.FC<SalesInvoiceKPIsProps> = ({
  totalBilled,
  totalOutstanding,
  totalSettled,
  totalVatOutput,
}) => {
  return (
    <DashboardCardGrid cols={4}>
      <DashboardCard
        title="Total Invoiced"
        value={`AED ${formatNumber(totalBilled)}`}
        subtitle="Gross sales billings"
        variant="default"
      />
      <DashboardCard
        title="Outstanding Receivables"
        value={`AED ${formatNumber(totalOutstanding)}`}
        subtitle="Open client balances"
        variant={totalOutstanding > 0 ? "danger" : "default"}
      />
      <DashboardCard
        title="Settled Receipts"
        value={`AED ${formatNumber(totalSettled)}`}
        subtitle="Collected payments"
        variant="default"
      />
      <DashboardCard
        title="Output VAT (5%)"
        value={`AED ${formatNumber(totalVatOutput)}`}
        subtitle="FTA Form 201 Tax Due"
        badge={
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
            Box 1
          </span>
        }
        variant="default"
      />
    </DashboardCardGrid>
  );
};

export default SalesInvoiceKPIs;
