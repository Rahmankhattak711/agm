"use client";

import React from "react";
import { DashboardCard, DashboardCardGrid } from "@/components/ui";
import { formatNumber } from "@/lib/utils/format";

export interface SupplierBillsKpisProps {
  totalPayables: number;
  totalOutstanding: number;
  totalSettled: number;
  totalInputVat: number;
}

export const SupplierBillsKpis: React.FC<SupplierBillsKpisProps> = ({
  totalPayables,
  totalOutstanding,
  totalSettled,
  totalInputVat,
}) => {
  return (
    <DashboardCardGrid cols={4}>
      <DashboardCard
        title="Total Purchases Billed"
        value={`AED ${formatNumber(totalPayables)}`}
        subtitle="Cumulative procurement billed"
        variant="default"
      />
      <DashboardCard
        title="Open AP Balance Due"
        value={`AED ${formatNumber(totalOutstanding)}`}
        subtitle="Pending vendor disbursements"
        variant={totalOutstanding > 0 ? "danger" : "default"}
      />
      <DashboardCard
        title="Settled Disbursements"
        value={`AED ${formatNumber(totalSettled)}`}
        subtitle="Disbursed vendor liabilities"
        variant="default"
      />
      <DashboardCard
        title="Recoverable Input VAT (5%)"
        value={`AED ${formatNumber(totalInputVat)}`}
        subtitle="FTA Form 201 claimable"
        badge={
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
            Box 9
          </span>
        }
        variant="default"
      />
    </DashboardCardGrid>
  );
};

export default SupplierBillsKpis;
