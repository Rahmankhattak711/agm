"use client";

import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import {
  useProfitLoss,
  useBalanceSheet,
  useReceivables,
  usePayables,
} from "@/lib/hooks/api-hooks";
import { ChevronLeftIcon, PrintIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";

function formatNumber(val: number | string | undefined): string {
  const num = Number(val || 0);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ManagementReportsPage() {
  const router = useRouter();
  const { data: profitLoss, isLoading: plLoading } = useProfitLoss();
  const { data: balanceSheet, isLoading: bsLoading } = useBalanceSheet();
  const { data: receivables, isLoading: recLoading } = useReceivables();
  const { data: payables, isLoading: payLoading } = usePayables();

  const isLoading = plLoading || bsLoading || recLoading || payLoading;

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

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Executive-Management-Financial-Summary",
  });

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
          <span className="text-slate-800 font-bold">Executive Summary</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Executive Summary
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Key financial performance, margins, and balance sheet overview.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePrint()}
              className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 shadow-2xs cursor-pointer"
              icon={<PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />}
            >
              Print Statement
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-agm-muted animate-pulse space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-agm-green border-t-transparent animate-spin mx-auto" />
          <p>Compiling Executive Management Summary...</p>
        </div>
      ) : (
        <div className="flex justify-center w-full">
          <div
            ref={printRef}
            id="printable-voucher"
            className="w-full max-w-[950px] bg-agm-card border border-agm-box-border shadow-md rounded-xl p-8 sm:p-10 space-y-0 print:p-0 print:m-0 print:border-none print:shadow-none print:max-w-none text-agm-text"
            style={{
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
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
                    <div className="space-y-6">
                      <div className="flex justify-between items-center py-2 text-[12px] font-bold text-agm-text print:text-[11px] border-t border-agm-box-border">
                        <span>
                          Corporate Tax Registration No: 104094432200001
                        </span>
                        <span>VAT Registration No: 104094432200003</span>
                      </div>

                      <div
                        className="w-full text-center py-2.5 px-4 font-bold text-[13px] print:text-[12.5px] text-white tracking-wide uppercase mb-0 bg-agm-navy"
                        style={{
                          WebkitPrintColorAdjust: "exact",
                          printColorAdjust: "exact",
                        }}
                      >
                        AGM FITOUT TECHNICAL SERVICES LLC - EXECUTIVE MANAGEMENT
                        &amp; FINANCIAL SUMMARY
                      </div>

                      <table className="w-full border-collapse text-[12px] print:text-[11.5px] text-agm-text">
                        <thead>
                          <tr className="bg-agm-box-bg font-bold text-agm-text border-b border-agm-box-border">
                            <th className="py-2.5 px-4 text-left font-bold w-[45%]">
                              Executive Financial Metric
                            </th>
                            <th className="py-2.5 px-4 text-right font-bold w-[27%]">
                              Statutory Amount (AED)
                            </th>
                            <th className="py-2.5 px-4 text-right font-bold w-[28%]">
                              Benchmark / Margin Ratio
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-agm-green-soft text-agm-green-dark border-t border-b border-agm-box-border">
                            <td
                              colSpan={3}
                              className="py-1.5 px-4 font-bold text-agm-green-dark text-[11.5px] uppercase tracking-wider"
                            >
                              1. Revenue &amp; Operating Performance
                            </td>
                          </tr>
                          <tr className="border-b border-agm-box-border/50">
                            <td className="py-1.5 px-4 font-medium text-agm-text">
                              Total Commercial Billed Turnover
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-agm-text font-bold">
                              {formatNumber(totalRevenue)}
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-agm-text font-semibold">
                              100.0% Base
                            </td>
                          </tr>
                          <tr className="border-b border-agm-box-border/50">
                            <td className="py-1.5 px-4 font-medium text-agm-text">
                              Gross Operational Margin (After Direct COGS)
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-emerald-700 font-bold">
                              {formatNumber(grossProfit)}
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-emerald-700 font-bold">
                              {grossMargin.toFixed(1)}% Gross Margin
                            </td>
                          </tr>
                          <tr className="border-b border-agm-box-border/50">
                            <td className="py-1.5 px-4 font-medium text-agm-text">
                              Operating Overheads &amp; Administrative Outflow
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-rose-600 font-semibold">
                              -{formatNumber(operatingExpenses)}
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-slate-500 font-medium">
                              {totalRevenue > 0
                                ? (
                                    (operatingExpenses / totalRevenue) *
                                    100
                                  ).toFixed(1)
                                : "0.0"}
                              % of Revenue
                            </td>
                          </tr>
                          <tr className="bg-agm-box-bg/80 border-b border-agm-box-border">
                            <td className="py-2 px-4 font-bold text-agm-text">
                              Net Operating Profit (EBITDA Position)
                            </td>
                            <td
                              className={`py-2 px-4 text-right font-mono font-bold ${
                                netProfit >= 0
                                  ? "text-emerald-700"
                                  : "text-rose-600"
                              }`}
                            >
                              {formatNumber(netProfit)}
                            </td>
                            <td
                              className={`py-2 px-4 text-right font-mono font-bold ${
                                netProfit >= 0
                                  ? "text-emerald-700"
                                  : "text-rose-600"
                              }`}
                            >
                              {netMargin.toFixed(1)}% Net Margin
                            </td>
                          </tr>

                          <tr className="bg-agm-box-bg text-agm-navy border-t border-b border-agm-box-border">
                            <td
                              colSpan={3}
                              className="py-2 px-4 font-bold text-agm-navy text-[11.5px] uppercase tracking-wider"
                            >
                              2. Working Capital &amp; Balance Sheet Structure
                            </td>
                          </tr>
                          <tr className="border-b border-agm-box-border/50">
                            <td className="py-1.5 px-4 font-medium text-agm-text">
                              Total Current Trading Assets (Cash, Bank, A/R)
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-agm-text font-semibold">
                              {formatNumber(currentAssets)}
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-slate-500 font-medium">
                              Short-term Liquid Assets
                            </td>
                          </tr>
                          <tr className="border-b border-agm-box-border/50">
                            <td className="py-1.5 px-4 font-medium text-agm-text">
                              Total Current Liabilities &amp; Vendor Payables
                              (A/P)
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-rose-600 font-semibold">
                              -{formatNumber(currentLiabilities)}
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-slate-500 font-medium">
                              Short-term Obligations
                            </td>
                          </tr>
                          <tr className="border-b border-agm-box-border/50">
                            <td className="py-1.5 px-4 font-medium text-agm-text">
                              Net Working Capital (Current Assets - Liabilities)
                            </td>
                            <td
                              className={`py-1.5 px-4 text-right font-mono font-bold ${
                                workingCapital >= 0
                                  ? "text-emerald-700"
                                  : "text-amber-700"
                              }`}
                            >
                              {formatNumber(workingCapital)}
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono font-semibold text-slate-700">
                              {workingCapital >= 0 ? "Surplus" : "Deficit"}
                            </td>
                          </tr>
                          <tr className="border-b border-agm-box-border/50">
                            <td className="py-1.5 px-4 font-medium text-agm-text">
                              Current Liquidity Solvency Ratio
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-agm-text font-bold">
                              {currentRatio > 0
                                ? `${currentRatio.toFixed(2)}x`
                                : "1.00x"}
                            </td>
                            <td
                              className={`py-1.5 px-4 text-right font-mono font-bold ${
                                currentRatio >= 1.5
                                  ? "text-emerald-700"
                                  : currentRatio >= 1.0
                                    ? "text-sky-700"
                                    : "text-rose-600"
                              }`}
                            >
                              {currentRatio >= 1.5
                                ? "Strong Liquidity"
                                : currentRatio >= 1.0
                                  ? "Adequate Buffer"
                                  : "Tight Capital"}
                            </td>
                          </tr>

                          <tr className="bg-agm-sidebar text-white font-bold border-t-2 border-agm-green">
                            <td className="py-2.5 px-4 font-black text-white text-[12.5px]">
                              Total Business Equity (Net Worth Position)
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                              Assets - Liabilities
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-black text-[13px] text-emerald-300">
                              AED {formatNumber(totalEquity)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="pt-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-agm-navy mb-2 block">
                          3. Commercial Trade Exposure &amp; Credit Gap
                        </span>
                        <table className="w-full border-collapse text-[12px] print:text-[11.5px] text-agm-text">
                          <thead>
                            <tr className="bg-agm-box-bg font-bold text-agm-text border-b border-agm-box-border">
                              <th className="py-2 px-3 text-left font-bold w-[45%]">
                                Trade Category
                              </th>
                              <th className="py-2 px-3 text-right font-bold w-[27%]">
                                Open Balance (AED)
                              </th>
                              <th className="py-2 px-3 text-right font-bold w-[28%]">
                                Working Capital Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-agm-box-border/50">
                              <td className="py-2 px-3 font-semibold text-agm-navy">
                                Trade Accounts Receivable (Client Invoices)
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-sky-800">
                                {formatNumber(totalAR)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-slate-600 text-xs">
                                Inflow In Progress
                              </td>
                            </tr>
                            <tr className="border-b border-agm-box-border/50">
                              <td className="py-2 px-3 font-semibold text-agm-navy">
                                Trade Accounts Payable (Supplier Bills)
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-amber-800">
                                {formatNumber(totalAP)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-slate-600 text-xs">
                                Outflow Pending
                              </td>
                            </tr>
                            <tr className="border-b border-agm-box-border/50 bg-slate-50">
                              <td className="py-2 px-3 font-bold text-slate-900">
                                Net Trade Gap (Receivables - Payables)
                              </td>
                              <td
                                className={`py-2 px-3 text-right font-mono font-bold ${
                                  netTradingCapital >= 0
                                    ? "text-emerald-700"
                                    : "text-rose-600"
                                }`}
                              >
                                {formatNumber(netTradingCapital)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 text-xs">
                                {netTradingCapital >= 0
                                  ? "Positive Cashflow Buffer"
                                  : "Payable Overhang"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="pt-6 print:hidden">
                        <QuotationFooter className="!mt-0 !px-0" />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="print-footer-bottom fixed-print-footer hidden print:block">
              <QuotationFooter />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
