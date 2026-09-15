"use client";

import React from "react";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";
import { formatNumber } from "./types";

interface PurchaseReturnsKpisProps {
  totalReturnVal: number;
  returnsCount: number;
  completedCount: number;
  activeReviewCount: number;
}

const PurchaseReturnsKpis: React.FC<PurchaseReturnsKpisProps> = ({
  totalReturnVal,
  returnsCount,
  completedCount,
  activeReviewCount,
}) => {
  return (
    <ReportKpiGrid cols={4}>
      <ReportKpiCard
        title="1. Total Debit Notes Value"
        subtitle="Cumulative supplier returns"
        value={formatNumber(totalReturnVal)}
        currency="AED"
        accentColor="rose"
        valueColor="text-rose-700"
      />
      <ReportKpiCard
        title="2. Total Return Vouchers"
        subtitle="All logged RTV orders"
        value={returnsCount}
        currency={false}
        accentColor="sky"
        footerText="Records"
      />
      <ReportKpiCard
        title="3. Settled Reversals"
        subtitle="Credited by vendor"
        value={completedCount}
        currency={false}
        accentColor="emerald"
        valueColor="text-emerald-800"
        footerText="Settled"
      />
      <ReportKpiCard
        title="4. In-Review Reversals"
        subtitle="Pending supplier credit note"
        value={activeReviewCount}
        currency={false}
        accentColor="amber"
        valueColor="text-amber-700"
        footerText="Pending"
      />
    </ReportKpiGrid>
  );
};

export default PurchaseReturnsKpis;
