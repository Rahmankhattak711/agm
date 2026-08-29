"use client";

import { VatPositionReport } from "@/app/(workspace)/finance/reports/components/VatPositionReport";
import { useVatSummary } from "@/lib/hooks/api-hooks";
import { Scale } from "lucide-react";

export default function VatReportsPage() {
  const { data: vatSummary, isLoading } = useVatSummary();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-[#1d3345] to-[#233c4d] p-6 rounded-2xl text-white shadow-lg border border-white/10">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Scale size={16} /> UAE Federal Tax Authority (FTA)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            VAT & Tax Compliance Reports
          </h1>
          <p className="text-white/70 text-sm mt-1">
            FTA VAT Form 201 returns, Output 5% Tax, Input 5% Recoverable Tax,
            and Net Payable audit reports.
          </p>
        </div>
      </div>

      <VatPositionReport vatSummary={vatSummary} isLoading={isLoading} />
    </div>
  );
}
