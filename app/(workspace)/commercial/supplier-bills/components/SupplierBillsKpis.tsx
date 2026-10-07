"use client";

import React from "react";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";
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
    <ReportKpiGrid cols={4}>
      <ReportKpiCard
        title="1. Gross Vendor Payables"
        subtitle="Cumulative procurement billed"
        value={formatNumber(totalPayables)}
        currency="AED"
        accentColor="sky"
        valueColor="text-sky-900"
      />
      <ReportKpiCard
        title="2. Open AP Balance Due"
        subtitle="Pending vendor disbursements"
        value={formatNumber(totalOutstanding)}
        currency="AED"
        accentColor="rose"
        valueColor="text-rose-700"
      />
      <ReportKpiCard
        title="3. Settled Disbursements"
        subtitle="Disbursed vendor liabilities"
        value={formatNumber(totalSettled)}
        currency="AED"
        accentColor="emerald"
        valueColor="text-emerald-800"
      />
      <ReportKpiCard
        title="4. Recoverable VAT (5%)"
        subtitle="Input tax claimable from FTA"
        value={formatNumber(totalInputVat)}
        currency="AED"
        accentColor="purple"
        valueColor="text-purple-800"
      />
    </ReportKpiGrid>
  );
};

export default SupplierBillsKpis;
