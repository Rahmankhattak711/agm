"use client";

import React from "react";
import { DashboardCard, DashboardCardGrid } from "@/components/ui";
import { formatNumber } from "@/lib/utils/format";

export interface PurchaseOrdersKpisProps {
  totalPOs: number;
  draftCount: number;
  orderedCount: number;
  totalPurchasesValue: number;
}

export const PurchaseOrdersKpis: React.FC<PurchaseOrdersKpisProps> = ({
  totalPOs,
  draftCount,
  orderedCount,
  totalPurchasesValue,
}) => {
  return (
    <>
      <DashboardCardGrid cols={4}>
        <DashboardCard
          title="Total Purchase Orders"
          value={totalPOs.toString()}
          subtitle="All procurement records"
          variant="default"
        />
        <DashboardCard
          title="Draft Orders"
          value={draftCount.toString()}
          subtitle="Awaiting supplier issuance"
          variant={draftCount > 0 ? "warning" : "default"}
        />
        <DashboardCard
          title="Pending Deliveries"
          value={orderedCount.toString()}
          subtitle="Awaiting warehouse receipt"
          variant={orderedCount > 0 ? "default" : "default"}
        />
        <DashboardCard
          title="Total Procurement Spend"
          value={`AED ${formatNumber(totalPurchasesValue)}`}
          subtitle="Cumulative purchase volume"
          badge={
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Committed
            </span>
          }
          variant="default"
        />
      </DashboardCardGrid>

      <div className="hidden print:grid print:grid-cols-4 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
            Total Orders
          </span>
          <span className="font-mono font-bold text-slate-900">{totalPOs}</span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-amber-600 font-bold block">
            Drafts
          </span>
          <span className="font-mono font-bold text-amber-700">
            {draftCount}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-blue-600 font-bold block">
            Pending Delivery
          </span>
          <span className="font-mono font-bold text-blue-800">
            {orderedCount}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold block">
            Procurement Spend
          </span>
          <span className="font-mono font-bold text-emerald-800">
            AED {formatNumber(totalPurchasesValue)}
          </span>
        </div>
      </div>
    </>
  );
};

export default PurchaseOrdersKpis;
