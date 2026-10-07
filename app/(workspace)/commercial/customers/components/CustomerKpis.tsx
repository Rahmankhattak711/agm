"use client";

import React from "react";
import { DashboardCard, DashboardCardGrid } from "@/components/ui";
import {
  BuildingIcon,
  CreditCardIcon,
  AlertCircleIcon,
  UserIcon,
} from "@/components/icons";
import { formatNumber } from "@/lib/utils/format";

export interface CustomerKpisProps {
  totalClients: number;
  totalReceivables: number;
  totalCreditLimits: number;
  corporateCount: number;
}

export function CustomerKpis({
  totalClients,
  totalReceivables,
  totalCreditLimits,
  corporateCount,
}: CustomerKpisProps) {
  return (
    <DashboardCardGrid cols={4}>
      <DashboardCard
        title="Total Active Clients"
        value={totalClients}
        subtitle={`${totalClients} registered client accounts`}
        icon={<UserIcon size={16} />}
        accentColor="blue"
      />

      <DashboardCard
        title="Outstanding Receivables"
        value={`AED ${formatNumber(totalReceivables)}`}
        subtitle="Open invoices due for collection"
        icon={<AlertCircleIcon size={16} />}
        accentColor={totalReceivables > 0 ? "rose" : "slate"}
      />

      <DashboardCard
        title="Total Credit Facility"
        value={`AED ${formatNumber(totalCreditLimits)}`}
        subtitle="Extended credit limits"
        icon={<CreditCardIcon size={16} />}
        accentColor="indigo"
      />

      <DashboardCard
        title="Corporate Accounts"
        value={corporateCount}
        subtitle="Registered company entities"
        icon={<BuildingIcon size={16} />}
        accentColor="emerald"
      />
    </DashboardCardGrid>
  );
}
