"use client";

import React from "react";
import { DashboardCard, DashboardCardGrid } from "@/components/ui";
import { formatCurrency } from "@/lib/utils/format";

interface OperationsSecondaryMetricsProps {
  presentCount: number;
  attendanceRate: number;
  onLeaveCount: number;
  totalAssetsValue: number;
  expiringDocsCount: number;
}

export default function OperationsSecondaryMetrics({
  presentCount,
  attendanceRate,
  onLeaveCount,
  totalAssetsValue,
  expiringDocsCount,
}: OperationsSecondaryMetricsProps) {
  return (
    <DashboardCardGrid cols={4}>
      <DashboardCard
        title="Present today"
        value={presentCount}
        subtitle={`${attendanceRate.toFixed(0)}% attendance rate`}
        accentColor="emerald"
      />

      <DashboardCard
        title="On approved leave"
        value={onLeaveCount}
        subtitle={
          onLeaveCount === 1
            ? "1 staff member"
            : `${onLeaveCount} staff members`
        }
        accentColor="amber"
      />

      <DashboardCard
        title="Fixed assets valuation"
        value={formatCurrency(totalAssetsValue)}
        accentColor="blue"
      />

      <DashboardCard
        title="Visa / ID expiries (30d)"
        value={expiringDocsCount}
        subtitle={
          expiringDocsCount === 1
            ? "1 document requiring action"
            : `${expiringDocsCount} documents`
        }
        accentColor={expiringDocsCount > 0 ? "rose" : "slate"}
      />
    </DashboardCardGrid>
  );
}
