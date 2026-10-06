"use client";

import React from "react";
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 border border-agm-box-border bg-transparent rounded-[12px] space-y-1">
        <span className="text-[12px] font-normal text-agm-muted block">
          Total receivables
        </span>
        <span className="text-[17px] font-medium text-agm-text block">
          {formatCurrency(totalReceivables)}
        </span>
      </div>

      <div className="p-4 border border-agm-box-border bg-transparent rounded-[12px] space-y-1">
        <span className="text-[12px] font-normal text-agm-muted block">
          Total payables
        </span>
        <span className="text-[17px] font-medium text-agm-text block">
          {formatCurrency(totalPayables)}
        </span>
      </div>

      <div className="p-4 border border-agm-box-border bg-transparent rounded-[12px] space-y-1">
        <span className="text-[12px] font-normal text-agm-muted block">
          Operating spend
        </span>
        <span className="text-[17px] font-medium text-agm-text block">
          {formatCurrency(operatingSpend)}
        </span>
      </div>

      <div className="p-4 border border-agm-box-border bg-transparent rounded-[12px] space-y-1">
        <span className="text-[12px] font-normal text-agm-muted block">
          Debt to equity
        </span>
        <span className="text-[17px] font-medium text-agm-text block">
          {debtToEquity.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
