"use client";

import { useMemo, useState } from "react";
import {
  useProfitLoss,
  useBalanceSheet,
  useVatSummary,
  useReceivables,
  usePayables,
} from "@/lib/hooks/api-hooks";
import { PrintIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import {
  ReportSummaryChart,
  ChartBarItem,
} from "@/components/reports/ReportSummaryChart";

export default function ManagementReportsPage() {
  const { data: profitLoss, isLoading: plLoading } = useProfitLoss();
  const { data: balanceSheet, isLoading: bsLoading } = useBalanceSheet();
  const { data: vatSummary } = useVatSummary();
  const { data: receivables } = useReceivables();
  const { data: payables } = usePayables();

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatNumber = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const totalRevenue = Number(
    profitLoss?.totalIncome ?? (profitLoss as any)?.revenue ?? 0,
  );
  const directExpenses = Number(profitLoss?.totalDirectExpenses ?? 0);
  const grossProfit = Number(
    profitLoss?.grossProfit ?? totalRevenue - directExpenses,
  );
  const operatingExpenses = Number(profitLoss?.totalOperatingExpenses ?? 0);
  const netProfit = Number(
    profitLoss?.netProfit ?? grossProfit - operatingExpenses,
  );

  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const currentAssets = Number(balanceSheet?.totalCurrentAssets ?? 0);
  const fixedAssets = Number(balanceSheet?.totalFixedAssets ?? 0);
  const totalAssets = Number(
    balanceSheet?.totalAssets ?? currentAssets + fixedAssets,
  );
  const currentLiabilities = Number(balanceSheet?.totalCurrentLiabilities ?? 0);
  const totalLiabilities = Number(
    balanceSheet?.totalLiabilities ?? currentLiabilities,
  );
  const totalEquity = Number(
    balanceSheet?.totalEquity ?? totalAssets - totalLiabilities,
  );

  const workingCapital = currentAssets - currentLiabilities;
  const currentRatio =
    currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;

  const totalAR = Number(receivables?.totalReceivables ?? 0);
  const totalAP = Number(payables?.totalPayables ?? 0);
  const netTradingCapital = totalAR - totalAP;

  const financialHealthChartData: ChartBarItem[] = [
    {
      label: "Revenue",
      sublabel: "Total Sales",
      value: totalRevenue,
      color: "#233c4d",
    },
    {
      label: "Gross Profit",
      sublabel: "After COGS",
      value: grossProfit,
      color: "#059669",
    },
    {
      label: "Overheads",
      sublabel: "Operating Costs",
      value: operatingExpenses,
      color: "#e11d48",
    },
    {
      label: "Net Profit",
      sublabel: "Net Earnings",
      value: netProfit,
      color: netProfit >= 0 ? "#10b981" : "#ef4444",
    },
    {
      label: "Receivables",
      sublabel: "Client A/R",
      value: totalAR,
      color: "#0284c7",
    },
    {
      label: "Payables",
      sublabel: "Vendor A/P",
      value: totalAP,
      color: "#f59e0b",
    },
  ];

  return (
    <>
      <div className="space-y-6 print:hidden">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Executive Summary
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review executive financial KPIs, working capital health, liquidity ratios, and business performance metrics.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
          icon={<PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />}
        >
          Print Statement
        </Button>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* 1. Total Billed Revenue */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                1. Total Billed Revenue
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {grossMargin.toFixed(1)}% GM
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Gross commercial turnover
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
              AED
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {formatNumber(totalRevenue)}
            </span>
          </div>
        </div>

        {/* 2. Net Operating Profit */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                2. Net Operating Profit
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  netProfit >= 0
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                {netMargin.toFixed(1)}% Return
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Net earnings after overheads
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
              AED
            </span>
            <span
              className={`text-2xl font-black font-mono ${
                netProfit >= 0 ? "text-emerald-800" : "text-rose-700"
              }`}
            >
              {formatNumber(netProfit)}
            </span>
          </div>
        </div>

        {/* 3. Net Working Capital */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-indigo-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              3. Net Working Capital
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Current assets minus liabilities
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
              AED
            </span>
            <span
              className={`text-2xl font-black font-mono ${
                workingCapital >= 0 ? "text-blue-900" : "text-amber-700"
              }`}
            >
              {formatNumber(workingCapital)}
            </span>
          </div>
        </div>

        {/* 4. Current Liquidity Ratio */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-teal-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                4. Current Liquidity Ratio
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  currentRatio >= 1.5
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : currentRatio >= 1.0
                      ? "bg-sky-50 text-sky-800 border-sky-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                {currentRatio >= 1.5
                  ? "Strong"
                  : currentRatio >= 1.0
                    ? "Adequate"
                    : "Tight"}
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Short-term solvency ratio
            </span>
          </div>
          <div className="pt-2">
            <span
              className={`text-2xl font-black font-mono ${
                currentRatio >= 1.5
                  ? "text-emerald-800"
                  : currentRatio >= 1.0
                    ? "text-blue-900"
                    : "text-rose-700"
              }`}
            >
              {currentRatio > 0 ? `${currentRatio.toFixed(2)}x` : "1.00x"}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Chart */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
        <ReportSummaryChart
          title="Executive Financial Performance &amp; Balance Sheet Drivers"
          subtitle="Visual snapshot of revenue, profitability thresholds, and trading capital exposure"
          data={financialHealthChartData}
          primaryLegend="Financial Balance (AED)"
        />
      </div>

      {/* Operational Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profitability Structure */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
            <h3 className="font-black text-xs uppercase tracking-wider text-white">
              Profitability &amp; Operational Margin Structure
            </h3>
            <span className="text-[11px] font-mono text-emerald-300 font-bold">
              Income vs Costs
            </span>
          </div>

          <div className="p-5 space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">
                Gross Billed Revenue:
              </span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(totalRevenue)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">
                Direct Fitout / Material Costs (COGS):
              </span>
              <span className="font-mono font-bold text-rose-700">
                -{formatCurrency(directExpenses)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-emerald-900 font-bold">Gross Profit:</span>
              <div className="text-right">
                <span className="font-mono font-black text-emerald-800 block">
                  {formatCurrency(grossProfit)}
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  {grossMargin.toFixed(1)}% of Revenue
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">
                Operating &amp; Admin Overheads:
              </span>
              <span className="font-mono font-bold text-slate-700">
                -{formatCurrency(operatingExpenses)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900 text-white">
              <span className="font-bold text-sm">Net Operating Profit:</span>
              <div className="text-right">
                <span className="font-mono font-black text-sm text-emerald-400 block">
                  {formatCurrency(netProfit)}
                </span>
                <span className="text-[10px] text-slate-300">
                  {netMargin.toFixed(1)}% Net Margin
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Sheet & Capital Structure */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
            <h3 className="font-black text-xs uppercase tracking-wider text-white">
              Balance Sheet &amp; Capital Structure
            </h3>
            <span className="text-[11px] font-mono text-sky-300 font-bold">
              Assets vs Liabilities
            </span>
          </div>

          <div className="p-5 space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">
                Total Current Liquid Assets:
              </span>
              <span className="font-mono font-bold text-blue-900">
                {formatCurrency(currentAssets)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">
                Fixed &amp; Non-Current Assets:
              </span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(fixedAssets)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
              <span className="text-blue-900 font-bold">
                Total Capital Assets:
              </span>
              <span className="font-mono font-black text-blue-950">
                {formatCurrency(totalAssets)}
              </span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">
                Current Short-Term Liabilities:
              </span>
              <span className="font-mono font-bold text-amber-700">
                {formatCurrency(currentLiabilities)}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900 text-white">
              <span className="font-bold text-sm">
                Total Equity &amp; Retained Capital:
              </span>
              <span className="font-mono font-black text-sm text-emerald-400">
                {formatCurrency(totalEquity)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Working Capital & Trade Exposure Matrix */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
          <h3 className="font-black text-xs uppercase tracking-wider text-white">
            Working Capital &amp; Trade Exposure Matrix
          </h3>
          <span className="text-[11px] font-mono text-purple-300 font-bold">
            Receivables vs Payables
          </span>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Accounts Receivable (A/R)
              </span>
              <span className="text-xl font-black text-emerald-800 block mt-1 font-mono">
                {formatCurrency(totalAR)}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Realizable customer assets
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Accounts Payable (A/P)
              </span>
              <span className="text-xl font-black text-amber-700 block mt-1 font-mono">
                {formatCurrency(totalAP)}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                Short-term supplier obligations
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Net Trade Surplus / (Deficit)
              </span>
              <span
                className={`text-xl font-black block mt-1 font-mono ${
                  netTradingCapital >= 0 ? "text-blue-900" : "text-rose-700"
                }`}
              >
                {formatCurrency(netTradingCapital)}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">
                A/R minus A/P commercial balance
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Direct A4 Printable Document with exact Quotation styling & margins */}
      <div
        id="management-print-area"
        className="mx-auto bg-white max-w-4xl rounded-xl print:rounded-none overflow-visible print:overflow-visible hidden print:block w-full"
      >
        <table className="print-page-table w-full border-collapse">
          <thead className="print-page-header-group">
            <tr>
              <th className="p-0 font-normal text-left border-none">
                <QuotationHeader />
              </th>
            </tr>
          </thead>

          <tfoot className="print-page-footer-group">
            <tr>
              <td className="p-0 border-none">
                <div className="h-[140px] w-full hidden print:block" />
              </td>
            </tr>
          </tfoot>

          <tbody className="print-page-body-group">
            <tr>
              <td className="p-0 border-none align-top">
                <div className="px-8 py-3 space-y-4">
                  <div className="flex justify-between items-center border-b-2 border-emerald-800 pb-2 print-avoid-break">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase block">
                        Executive Performance Statement
                      </span>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        MANAGEMENT &amp; BOARD REPORT
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-700 font-mono font-bold text-xs">
                        Statutory Executive Audit
                      </p>
                      <p className="text-slate-400 text-[10px]">
                        Generated:{" "}
                        {new Date().toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 p-4 bg-white rounded-xl border border-slate-200 print-avoid-break">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Billed Revenue
                      </span>
                      <span className="font-mono font-black text-slate-900">
                        {formatCurrency(totalRevenue)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Net Profit
                      </span>
                      <span className="font-mono font-black text-emerald-800">
                        {formatCurrency(netProfit)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Working Capital
                      </span>
                      <span className="font-mono font-black text-blue-900">
                        {formatCurrency(workingCapital)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Liquidity Ratio
                      </span>
                      <span className="font-mono font-black text-slate-900">
                        {currentRatio.toFixed(2)}x
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 text-xs">
                        Income &amp; Margin
                      </h4>
                      <div className="rounded-xl border border-slate-200 p-4 space-y-2 font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">
                            Gross Revenue:
                          </span>
                          <span className="font-bold">
                            {formatCurrency(totalRevenue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">
                            Direct Costs:
                          </span>
                          <span className="text-rose-700">
                            -{formatCurrency(directExpenses)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-1.5">
                          <span className="text-emerald-800 font-bold font-sans">
                            Gross Profit:
                          </span>
                          <span className="font-bold text-emerald-800">
                            {formatCurrency(grossProfit)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">
                            Operating Overheads:
                          </span>
                          <span>
                            -{formatCurrency(operatingExpenses)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1.5 font-black">
                          <span className="font-sans">Net Profit:</span>
                          <span className="text-emerald-800">
                            {formatCurrency(netProfit)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 text-xs">
                        Balance Sheet Summary
                      </h4>
                      <div className="rounded-xl border border-slate-200 p-4 space-y-2 font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">
                            Current Assets:
                          </span>
                          <span className="font-bold">
                            {formatCurrency(currentAssets)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">
                            Fixed Assets:
                          </span>
                          <span>{formatCurrency(fixedAssets)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-1.5">
                          <span className="font-sans text-blue-900 font-bold">
                            Total Assets:
                          </span>
                          <span className="font-bold text-blue-900">
                            {formatCurrency(totalAssets)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">
                            Current Liabilities:
                          </span>
                          <span className="text-amber-700">
                            {formatCurrency(currentLiabilities)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-1.5 font-black">
                          <span className="font-sans">Total Equity:</span>
                          <span className="text-emerald-800">
                            {formatCurrency(totalEquity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="fixed-print-footer hidden print:block">
          <QuotationFooter />
        </div>
      </div>
    </>
  );
}
