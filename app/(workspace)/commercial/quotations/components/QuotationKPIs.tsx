"use client";

import React from "react";
import { DashboardCard, DashboardCardGrid } from "@/components/ui";

export interface QuotationKPIsProps {
  totalQuotedVolume: number;
  totalCount: number;
  acceptedCount: number;
  rejectedCount: number;
  formatNumber: (val: number | string | undefined) => string;
}

export const QuotationKPIs: React.FC<QuotationKPIsProps> = ({
  totalQuotedVolume,
  totalCount,
  acceptedCount,
  rejectedCount,
  formatNumber,
}) => {
  return (
    <DashboardCardGrid cols={4} className="print:hidden">
      <DashboardCard
        title="Total Proposal Pipeline"
        value={`AED ${formatNumber(totalQuotedVolume)}`}
        subtitle="Cumulative quotation volume"
        variant="default"
      />
      <DashboardCard
        title="Proposals Issued"
        value={totalCount}
        subtitle={`${totalCount} commercial proposals`}
        variant="default"
      />
      <DashboardCard
        title="Accepted Deals"
        value={acceptedCount}
        subtitle="Approved proposals"
        variant="success"
      />
      <DashboardCard
        title="Rejected Deals"
        value={rejectedCount}
        subtitle="Declined proposals"
        variant={rejectedCount > 0 ? "warning" : "default"}
      />
    </DashboardCardGrid>
  );
};

export default QuotationKPIs;
