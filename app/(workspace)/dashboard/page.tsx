"use client";

import { useBalanceSheet, useEmployees, useJournalEntries, usePettyCash, useProfitLoss, useVatSummary } from "@/lib/hooks/api-hooks";
import StatCard from "@/components/StatCard";
import BarChart from "@/components/BarChart";
import Link from "next/link";
import QuotationTemplate from "@/components/QuotationTemplate";

export default function DashboardPage() {
  const { data: profitLoss, isLoading: plLoading } = useProfitLoss();
  const { data: balanceSheet, isLoading: bsLoading } = useBalanceSheet();
  const { data: journalEntries, isLoading: jeLoading } = useJournalEntries();
  const { data: pettyCash, isLoading: pcLoading } = usePettyCash();
  const { data: employees, isLoading: empLoading } = useEmployees();
  const { data: vatSummary, isLoading: vatLoading } = useVatSummary();

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const revenue = profitLoss?.revenue || 0;
  const expenses = profitLoss?.expenses || 0;
  const netIncome = profitLoss?.netIncome || 0;
  const totalAssets = balanceSheet?.assets || 0;
  const totalLiabilities = balanceSheet?.liabilities || 0;
  const totalEquity = balanceSheet?.equity || 0;
  const isBalanced = balanceSheet?.balanced ?? false;

  const totalPettyCashOut = (pettyCash || [])
    .filter((t) => t.transactionType === "DISBURSEMENT")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const activeEmployees = (employees || []).filter((e) => e.isActive).length;
  const recentEntries = (journalEntries || []).slice(0, 5);

  const comparisonChartData = [
    { label: "Revenue", value: revenue, color: "#2e7d32" },
    { label: "Expenses", value: expenses, color: "#d32f2f" },
    { label: "Net Profit", value: netIncome, color: netIncome >= 0 ? "#1976d2" : "#f57c00" },
  ];

  const bsChartData = [
    { label: "Total Assets", value: totalAssets, color: "#0284c7" },
    { label: "Liabilities", value: totalLiabilities, color: "#ea580c" },
    { label: "Equity", value: totalEquity, color: "#16a34a" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner & Status Bar */}
      {/* <QuotationTemplate/> */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#284257] to-[#1c3243] text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Live Enterprise Accounting</span>
          </div>
          <h2 className="text-xl font-black mt-1">Financial & Operations Command Center</h2>
          <p className="text-xs text-white/70 mt-0.5">Real-time balances, general ledger updates, and operational performance.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            isBalanced
              ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-200"
              : "bg-amber-500/15 border-amber-400/30 text-amber-200"
          }`}>
            <span className={`h-2 w-2 rounded-full ${isBalanced ? "bg-emerald-400" : "bg-amber-400"}`} />
            {isBalanced ? "Balance Sheet: Balanced" : "Balance Sheet: Action Required"}
          </div>

          <Link
            href="/finance/journal-entries"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-3.5 h-3.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Journal Entry
          </Link>
        </div>
      </div>

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          id="stat-revenue"
          title="Total Revenue"
          value={formatCurrency(revenue)}
          subtitle="Operating Income"
          gradient="bg-gradient-to-br from-[#215a36] via-[#1b4b2d] to-[#123620]"
          loading={plLoading}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          }
          trend={{ label: "Active Fiscal Year", up: true }}
          sparkline={[20, 35, 45, 60, 80, 95]}
        />

        <StatCard
          id="stat-net-income"
          title="Net Profit / Loss"
          value={formatCurrency(netIncome)}
          subtitle={netIncome >= 0 ? "Positive Net Margin" : "Net Deficit"}
          gradient="bg-gradient-to-br from-[#2a4d69] via-[#213f56] to-[#172c3d]"
          loading={plLoading}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          }
          trend={{ label: `${((netIncome / (revenue || 1)) * 100).toFixed(1)}% margin`, up: netIncome >= 0 }}
          sparkline={[10, 25, 30, 45, 55, 70]}
        />

        <StatCard
          id="stat-assets"
          title="Total Assets"
          value={formatCurrency(totalAssets)}
          subtitle="Current & Fixed Assets"
          gradient="bg-gradient-to-br from-[#3b5368] via-[#2d4052] to-[#202f3d]"
          loading={bsLoading}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          }
          sparkline={[40, 50, 60, 65, 80, 85]}
        />

        <StatCard
          id="stat-payroll"
          title="Active Workforce"
          value={`${activeEmployees} Employees`}
          subtitle="UAE WPS Payroll Ready"
          gradient="bg-gradient-to-br from-[#4a6b57] via-[#365241] to-[#24382c]"
          loading={empLoading}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          sparkline={[5, 10, 15, 20, 25, activeEmployees * 5 || 30]}
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Petty Cash Disbursed</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{pcLoading ? "..." : formatCurrency(totalPettyCashOut)}</p>
            <p className="text-xs text-slate-500 mt-0.5">{pettyCash?.length || 0} vouchers recorded</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">VAT Net Position</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{vatLoading ? "..." : formatCurrency(vatSummary?.net || 0)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Output: {formatCurrency(vatSummary?.outputVat || 0)} | Input: {formatCurrency(vatSummary?.inputVat || 0)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Journal Entries</p>
            <p className="text-lg font-black text-slate-800 mt-0.5">{jeLoading ? "..." : (journalEntries?.length || 0)}</p>
            <p className="text-xs text-slate-500 mt-0.5">Double-entry audit trail synced</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <BarChart
            title="Income Statement Breakdown"
            subtitle="Operational Revenue vs Expense & Net Margin"
            data={comparisonChartData}
            formatValue={(v) => `AED ${v.toLocaleString()}`}
            height={150}
          />
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <BarChart
            title="Balance Sheet Snapshot"
            subtitle="Assets vs Total Liabilities & Equity Distribution"
            data={bsChartData}
            formatValue={(v) => `AED ${v.toLocaleString()}`}
            height={150}
          />
        </div>
      </div>

      {/* Quick Navigation Cards & Recent Journal Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Quick Navigation</h3>
            <p className="text-xs text-slate-500 mt-0.5">Fast shortcuts to core operational modules.</p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Link
              href="/finance/accounts"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  COA
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Chart of Accounts</p>
                  <p className="text-[11px] text-slate-500">Asset, Liability, Equity & Ledger</p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-slate-700 text-xs font-bold">→</span>
            </Link>

            <Link
              href="/finance/petty-cash"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                  PC
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Petty Cash Vouchers</p>
                  <p className="text-[11px] text-slate-500">Daily expenses & approvals</p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-slate-700 text-xs font-bold">→</span>
            </Link>

            <Link
              href="/operations/employees"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                  HR
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Employees & Payroll</p>
                  <p className="text-[11px] text-slate-500">Staff directory & salaries</p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-slate-700 text-xs font-bold">→</span>
            </Link>

            <Link
              href="/operations/fixed-assets"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                  FA
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Fixed Assets</p>
                  <p className="text-[11px] text-slate-500">Vehicles & depreciation</p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-slate-700 text-xs font-bold">→</span>
            </Link>

            <Link
              href="/finance/reports"
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                  REP
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Financial Reports</p>
                  <p className="text-[11px] text-slate-500">P&L, Balance Sheet, Trial Balance</p>
                </div>
              </div>
              <span className="text-slate-400 group-hover:text-slate-700 text-xs font-bold">→</span>
            </Link>
          </div>
        </div>

        {/* Recent Journal Entries List */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Recent Journal Entries</h3>
              <p className="text-xs text-slate-500 mt-0.5">Latest posted and draft transactions</p>
            </div>
            <Link
              href="/finance/journal-entries"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              View All Entries →
            </Link>
          </div>

          {jeLoading ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">Loading journal entries...</div>
          ) : recentEntries.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 mx-auto mb-2 opacity-50">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              </svg>
              <p className="text-xs font-medium">No journal entries recorded yet.</p>
              <Link href="/finance/journal-entries" className="text-xs font-bold text-emerald-600 hover:underline mt-1 inline-block">
                Create first entry
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="pb-2.5">Entry #</th>
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5">Description</th>
                    <th className="pb-2.5 text-right">Debit / Credit</th>
                    <th className="pb-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentEntries.map((je) => {
                    const totalDebit = (je.lines || []).reduce((s, l) => s + Number(l.debit || 0), 0);
                    return (
                      <tr key={je.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 font-bold text-slate-800">{je.entryNumber}</td>
                        <td className="py-3 text-slate-600">
                          {new Date(je.entryDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="py-3 text-slate-600 max-w-[200px] truncate" title={je.description || "General Entry"}>
                          {je.description || "General Entry"}
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-800">
                          {formatCurrency(totalDebit)}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            je.isPosted
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {je.isPosted ? "Posted" : "Draft"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
