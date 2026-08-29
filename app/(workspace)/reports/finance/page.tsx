"use client";

import React, { useState } from "react";
import { ProfitLossReport } from "@/app/(workspace)/finance/reports/components/ProfitLossReport";
import { BalanceSheetReport } from "@/app/(workspace)/finance/reports/components/BalanceSheetReport";
import { TrialBalanceReport } from "@/app/(workspace)/finance/reports/components/TrialBalanceReport";
import { Landmark, FileSpreadsheet, Scale, TrendingUp } from "lucide-react";

export default function FinanceReportsPage() {
  const [activeSubTab, setActiveSubTab] = useState<"pnl" | "balance-sheet" | "trial-balance">("pnl");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-[#1d3345] to-[#233c4d] p-6 rounded-2xl text-white shadow-lg border border-white/10">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Landmark size={16} /> Statutory Accounts
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Financial Statements & General Ledger
          </h1>
          <p className="text-white/70 text-sm mt-1">
            Statement of Profit & Loss, Balance Sheet, and Trial Balance audit statements.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-white/10 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab("pnl")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "pnl"
                ? "bg-white text-[#1d3345] shadow"
                : "text-white/80 hover:text-white"
            }`}
          >
            Profit & Loss
          </button>
          <button
            onClick={() => setActiveSubTab("balance-sheet")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "balance-sheet"
                ? "bg-white text-[#1d3345] shadow"
                : "text-white/80 hover:text-white"
            }`}
          >
            Balance Sheet
          </button>
          <button
            onClick={() => setActiveSubTab("trial-balance")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "trial-balance"
                ? "bg-white text-[#1d3345] shadow"
                : "text-white/80 hover:text-white"
            }`}
          >
            Trial Balance
          </button>
        </div>
      </div>

      {activeSubTab === "pnl" && <ProfitLossReport />}
      {activeSubTab === "balance-sheet" && <BalanceSheetReport isLoading={false} />}
      {activeSubTab === "trial-balance" && <TrialBalanceReport isLoading={false} />}
    </div>
  );
}
