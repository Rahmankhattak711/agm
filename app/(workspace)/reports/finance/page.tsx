"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ProfitLossReport } from "@/app/(workspace)/finance/reports/components/ProfitLossReport";
import { ChevronLeftIcon } from "@/components/icons";

export default function FinanceReportsPage() {
  const router = useRouter();

  return (
    <div className="space-y-8 pb-12">
      <div className="space-y-3 pb-3 border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <button
            type="button"
            onClick={() => router.push("/finance/reports")}
            className="hover:text-emerald-700 transition-colors flex items-center gap-1 cursor-pointer font-semibold"
          >
            <ChevronLeftIcon size={12} />
            <span>Reports Hub</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-bold">Profit &amp; Loss</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Profit &amp; Loss Statement
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive statement of revenue, direct project expenses,
              operating costs, and net profit.
            </p>
          </div>
        </div>
      </div>

      <div>
        <ProfitLossReport />
      </div>
    </div>
  );
}
