"use client";

import React from "react";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";
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
      <ReportKpiGrid cols={4}>
        <ReportKpiCard
          title="1. Total Purchase Orders"
          subtitle="All procurement records"
          value={totalPOs}
          currency={false}
          accentColor="sky"
          footerText="Orders"
        />
        <ReportKpiCard
          title="2. Draft Orders"
          subtitle="Awaiting supplier issuance"
          value={draftCount}
          currency={false}
          accentColor="amber"
          valueColor="text-amber-700"
          footerText="Drafts"
        />
        <ReportKpiCard
          title="3. Pending Deliveries"
          subtitle="Awaiting warehouse receipt"
          value={orderedCount}
          currency={false}
          accentColor="blue"
          valueColor="text-blue-800"
          footerText="Ordered"
        />
        <ReportKpiCard
          title="4. Procurement Spend"
          subtitle="Cumulative purchase volume"
          badge={
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Active
            </span>
          }
          value={formatNumber(totalPurchasesValue)}
          currency="AED"
          accentColor="emerald"
          valueColor="text-emerald-800"
        />
      </ReportKpiGrid>

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
