"use client";

import React from "react";

interface OperationsSecondaryMetricsProps {
  presentCount: number;
  attendanceRate: number;
  onLeaveCount: number;
  totalAssetsValue: number;
  expiringDocsCount: number;
}

const formatCurrency = (val: number) => {
  return `AED ${val.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function OperationsSecondaryMetrics({
  presentCount,
  attendanceRate,
  onLeaveCount,
  totalAssetsValue,
  expiringDocsCount,
}: OperationsSecondaryMetricsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 border border-agm-box-border bg-transparent rounded-[12px] space-y-1">
        <span className="text-[12px] font-normal text-agm-muted block">
          Present today
        </span>
        <span className="text-[17px] font-medium text-agm-text block">
          {presentCount}{" "}
          <span className="text-xs text-agm-muted font-normal">
            ({attendanceRate.toFixed(0)}%)
          </span>
        </span>
      </div>

      <div className="p-4 border border-agm-box-border bg-transparent rounded-[12px] space-y-1">
        <span className="text-[12px] font-normal text-agm-muted block">
          On approved leave
        </span>
        <span className="text-[17px] font-medium text-agm-text block">
          {onLeaveCount} {onLeaveCount === 1 ? "staff" : "staff"}
        </span>
      </div>

      <div className="p-4 border border-agm-box-border bg-transparent rounded-[12px] space-y-1">
        <span className="text-[12px] font-normal text-agm-muted block">
          Fixed assets valuation
        </span>
        <span className="text-[17px] font-medium text-agm-text block">
          {formatCurrency(totalAssetsValue)}
        </span>
      </div>

      <div className="p-4 border border-agm-box-border bg-transparent rounded-[12px] space-y-1">
        <span className="text-[12px] font-normal text-agm-muted block">
          Visa / ID expiries (30d)
        </span>
        <span className="text-[17px] font-medium text-agm-text block">
          {expiringDocsCount}{" "}
          {expiringDocsCount === 1 ? "document" : "documents"}
        </span>
      </div>
    </div>
  );
}
