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
import { ReportSummaryChart, ChartBarItem } from "../components";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Executive Summary
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review executive financial KPIs, working capital health, liquidity
              ratios, and business performance metrics.
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

        <ReportKpiGrid cols={4}>
          <ReportKpiCard
            title="1. Total Billed Revenue"
            subtitle="Gross commercial turnover"
            value={formatNumber(totalRevenue)}
            accentColor="sky"
            badge={
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {grossMargin.toFixed(1)}% GM
              </span>
            }
          />

          <ReportKpiCard
            title="2. Net Operating Profit"
            subtitle="Net earnings after overheads"
            value={formatNumber(netProfit)}
            accentColor="emerald"
            valueColor={netProfit >= 0 ? "text-emerald-800" : "text-rose-700"}
            badge={
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  netProfit >= 0
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                {netMargin.toFixed(1)}% Return
              </span>
            }
          />

          <ReportKpiCard
            title="3. Net Working Capital"
            subtitle="Current assets minus liabilities"
            value={formatNumber(workingCapital)}
            accentColor="indigo"
            valueColor={
              workingCapital >= 0 ? "text-blue-900" : "text-amber-700"
            }
          />

          <ReportKpiCard
            title="4. Current Liquidity Ratio"
            subtitle="Short-term solvency ratio"
            value={currentRatio > 0 ? `${currentRatio.toFixed(2)}x` : "1.00x"}
            currency={false}
            accentColor="teal"
            valueColor={
              currentRatio >= 1.5
                ? "text-emerald-800"
                : currentRatio >= 1.0
                  ? "text-blue-900"
                  : "text-rose-700"
            }
            badge={
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
            }
          />
        </ReportKpiGrid>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <ReportSummaryChart
            title="Executive Financial Performance &amp; Balance Sheet Drivers"
            subtitle="Visual snapshot of revenue, profitability thresholds, and trading capital exposure"
            data={financialHealthChartData}
            primaryLegend="Financial Balance (AED)"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <span className="text-emerald-900 font-bold">
                  Gross Profit:
                </span>
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

      <div
        id="printable-voucher"
        className="mx-auto bg-white max-w-4xl rounded-xl print:rounded-none overflow-visible print:overflow-visible hidden print:block w-full text-agm-text"
      >
        <table className="print-page-table w-full border-collapse">
          <thead className="print-page-header-group">
            <tr>
              <th className="p-0 font-normal text-left border-none">
                <QuotationHeader className="!px-0 !pt-0 !pb-4 !border-b-0" />
              </th>
            </tr>
          </thead>

          <tfoot className="print-page-footer-group">
            <tr>
              <td className="p-0 border-none align-bottom">
                <div
                  className="w-full opacity-0 pointer-events-none select-none"
                  style={{ minHeight: "175px" }}
                  aria-hidden="true"
                >
                  <QuotationFooter />
                  <div style={{ height: "45px", minHeight: "45px" }} />
                </div>
              </td>
            </tr>
          </tfoot>

          <tbody className="print-page-body-group">
            <tr>
              <td className="p-0 border-none align-top">
                <div className="space-y-0">
                  {/* 1. Tax Registration Subheader */}
                  <div className="flex justify-between items-center py-2 text-[12px] font-bold text-agm-text print:text-[11px] border-t border-agm-box-border">
                    <span>Corporate Tax Registration No: 104094432200001</span>
                    <span>VAT Registration No:104094432200003</span>
                  </div>

                  {/* 2. Theme Title Banner */}
                  <div
                    className="w-full text-center py-2.5 px-4 font-bold text-[13px] print:text-[12.5px] text-white tracking-wide uppercase mb-0 bg-agm-navy"
                    style={{
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  >
                    AGM FITOUT TECHNICAL SERVICES LLC - MANAGEMENT &amp; BOARD STATEMENT
                  </div>

                  {/* 3. Statement KPI Summary Cards */}
                  <div className="grid grid-cols-4 gap-3 p-4 bg-agm-box-bg rounded-xl border border-agm-box-border my-4 print-avoid-break">
                    <div>
                      <span className="text-[10px] text-agm-muted uppercase font-bold block">
                        Billed Revenue
                      </span>
                      <span className="font-mono font-black text-agm-text">
                        {formatCurrency(totalRevenue)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-agm-muted uppercase font-bold block">
                        Net Profit
                      </span>
                      <span className="font-mono font-black text-emerald-700">
                        {formatCurrency(netProfit)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-agm-muted uppercase font-bold block">
                        Working Capital
                      </span>
                      <span className="font-mono font-black text-blue-800">
                        {formatCurrency(workingCapital)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-agm-muted uppercase font-bold block">
                        Liquidity Ratio
                      </span>
                      <span className="font-mono font-black text-agm-text">
                        {currentRatio.toFixed(2)}x
                      </span>
                    </div>
                  </div>

                  {/* 4. Details Tables */}
                  <div className="grid grid-cols-2 gap-4 print-avoid-break">
                    <div className="space-y-2">
                      <h4 className="font-bold text-agm-text text-xs">
                        Income &amp; Margin
                      </h4>
                      <div className="rounded-xl border border-agm-box-border p-4 space-y-2 font-mono bg-agm-card text-xs">
                        <div className="flex justify-between">
                          <span className="text-agm-muted font-sans">
                            Gross Revenue:
                          </span>
                          <span className="font-bold text-agm-text">
                            {formatCurrency(totalRevenue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-agm-muted font-sans">
                            Direct Costs:
                          </span>
                          <span className="text-rose-600">
                            -{formatCurrency(directExpenses)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-agm-box-border pt-1.5">
                          <span className="text-agm-green-dark font-bold font-sans">
                            Gross Profit:
                          </span>
                          <span className="font-bold text-emerald-700">
                            {formatCurrency(grossProfit)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-agm-muted font-sans">
                            Operating Overheads:
                          </span>
                          <span className="text-rose-600">-{formatCurrency(operatingExpenses)}</span>
                        </div>
                        <div className="flex justify-between border-t border-agm-box-border pt-1.5 font-black bg-agm-box-bg/50 px-2 py-1 rounded">
                          <span className="font-sans text-agm-text">Net Profit:</span>
                          <span className="text-emerald-700 font-mono font-bold">
                            {formatCurrency(netProfit)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-agm-text text-xs">
                        Balance Sheet Summary
                      </h4>
                      <div className="rounded-xl border border-agm-box-border p-4 space-y-2 font-mono bg-agm-card text-xs">
                        <div className="flex justify-between">
                          <span className="text-agm-muted font-sans">
                            Current Assets:
                          </span>
                          <span className="font-bold text-agm-text">
                            {formatCurrency(currentAssets)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-agm-muted font-sans">
                            Fixed Assets:
                          </span>
                          <span className="text-agm-text">{formatCurrency(fixedAssets)}</span>
                        </div>
                        <div className="flex justify-between border-t border-agm-box-border pt-1.5">
                          <span className="font-sans text-blue-900 font-bold">
                            Total Assets:
                          </span>
                          <span className="font-bold text-blue-900">
                            {formatCurrency(totalAssets)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-agm-muted font-sans">
                            Current Liabilities:
                          </span>
                          <span className="text-amber-700">
                            {formatCurrency(currentLiabilities)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-agm-box-border pt-1.5 font-black bg-agm-box-bg/50 px-2 py-1 rounded">
                          <span className="font-sans text-agm-text">Total Equity:</span>
                          <span className="text-emerald-700 font-mono font-bold">
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

        {/* Fixed Print Footer across every single printed page */}
        <div className="print-footer-bottom fixed-print-footer hidden print:block">
          <QuotationFooter />
        </div>
      </div>
    </>
  );
}
