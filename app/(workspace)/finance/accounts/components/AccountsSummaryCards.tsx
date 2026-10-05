"use client";

import { DashboardCard } from "@/components/ui";
import { ACCOUNT_TYPES } from "./types";

interface AccountsSummaryCardsProps {
  selectedType: string;
  onSelectType: (type: string) => void;
  classSummary: Record<string, { count: number; totalBalance: number }>;
  formatNumber: (val: number | string | undefined) => string;
}

export function AccountsSummaryCards({
  selectedType,
  onSelectType,
  classSummary,
  formatNumber,
}: AccountsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {ACCOUNT_TYPES.map((t) => {
        const isSelected = selectedType === t.value;
        const summary = classSummary[t.value] || {
          count: 0,
          totalBalance: 0,
        };
        return (
          <DashboardCard
            key={t.value}
            onClick={() => onSelectType(isSelected ? "ALL" : t.value)}
            title={t.label}
            value={`AED ${formatNumber(summary.totalBalance)}`}
            badge={
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${t.color}`}
              >
                {summary.count} A/C
              </span>
            }
            variant="default"
            className={
              isSelected ? "ring-2 ring-emerald-500/30 border-emerald-500" : ""
            }
          />
        );
      })}
    </div>
  );
}
