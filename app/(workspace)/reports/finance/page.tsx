"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ProfitLossReport } from "@/app/(workspace)/finance/reports/components/ProfitLossReport";
import { BalanceSheetReport } from "@/app/(workspace)/finance/reports/components/BalanceSheetReport";
import { TrialBalanceReport } from "@/app/(workspace)/finance/reports/components/TrialBalanceReport";
import { ChevronLeftIcon, PrintIcon } from "@/components/icons";
import { Button } from "@/components/ui";

export default function FinanceReportsPage() {
  const router = useRouter();
  const [activeSubTab, setActiveSubTab] = useState<
    "pnl" | "balance-sheet" | "trial-balance"
  >("pnl");

  return (
    <div className="space-y-6 pb-8">
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
          <span className="text-slate-800 font-bold">Financial Statements</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Financial Statements &amp; General Ledger
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Statement of Profit &amp; Loss, Balance Sheet, and Trial Balance
              audit statements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setActiveSubTab("pnl")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === "pnl"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Profit &amp; Loss
              </button>
              <button
                onClick={() => setActiveSubTab("balance-sheet")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === "balance-sheet"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Balance Sheet
              </button>
              <button
                onClick={() => setActiveSubTab("trial-balance")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === "trial-balance"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Trial Balance
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs cursor-pointer"
              icon={<PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />}
            >
              Print Statement
            </Button>
          </div>
        </div>
      </div>

      {activeSubTab === "pnl" && <ProfitLossReport />}
      {activeSubTab === "balance-sheet" && (
        <BalanceSheetReport isLoading={false} />
      )}
      {activeSubTab === "trial-balance" && (
        <TrialBalanceReport isLoading={false} />
      )}
    </div>
  );
}
