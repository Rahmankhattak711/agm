"use client";

import React, { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { PrintIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import {
  ProfitLossReport as ProfitLossData,
  BalanceSheetReport as BalanceSheetData,
  VatSummaryReport as VatSummaryData,
  VatQuarterDetail,
} from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { ReportTab, QuarterTab, formatNumber } from "./types";

interface ExecutiveSummaryReportProps {
  profitLoss?: ProfitLossData;
  balanceSheet?: BalanceSheetData;
  vatSummary?: VatSummaryData;
  setActiveTab: (tab: ReportTab) => void;
}

export const ExecutiveSummaryReport: React.FC<ExecutiveSummaryReportProps> = ({
  profitLoss,
  balanceSheet,
  vatSummary,
  setActiveTab,
}) => {
  const [quarterlyTab, setQuarterlyTab] = useState<QuarterTab>("ALL");

  const totalRevenue = Number(
    profitLoss?.totalIncome ?? profitLoss?.revenue ?? 0,
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
  const totalEquity = Number(balanceSheet?.totalEquity ?? 0);
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const outputVat = Number(vatSummary?.outputVat ?? 0);
  const inputVat = Number(vatSummary?.inputVat ?? 0);
  const netVat = outputVat - inputVat;

  const rawQuarters = vatSummary?.quarters || [];
  const quartersList = [
    { key: "Q1", label: "1st Quarter (Feb - Apr)" },
    { key: "Q2", label: "2nd Quarter (May - Jul)" },
    { key: "Q3", label: "3rd Quarter (Aug - Oct)" },
    { key: "Q4", label: "4th Quarter (Nov - Jan)" },
  ].map((qDef, idx) => {
    const qData: VatQuarterDetail | undefined =
      rawQuarters[idx] ||
      rawQuarters.find((q: VatQuarterDetail) => q.key === qDef.key);
    const sales = Number(qData?.sales ?? 0);
    const purchases = Number(qData?.purchases ?? 0);
    const qGrossProfit = Number(
      qData?.grossProfit !== undefined ? qData.grossProfit : sales - purchases,
    );
    const qOutputVat = Number(qData?.outputVat ?? 0);
    const qInputVat = Number(qData?.inputVat ?? 0);
    const qNetVat = Number(
      qData?.netVat !== undefined ? qData.netVat : qOutputVat - qInputVat,
    );
    return {
      ...qDef,
      sales,
      purchases,
      grossProfit: qGrossProfit,
      outputVat: qOutputVat,
      inputVat: qInputVat,
      netVat: qNetVat,
    };
  });

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Executive-Financial-Summary",
  });

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2.5 bg-agm-card rounded-2xl border border-agm-box-border shadow-2xs print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-agm-muted uppercase tracking-wide">
            Executive Summary Overview
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePrint()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-agm-text border-agm-box-border bg-agm-card hover:bg-agm-box-bg cursor-pointer shadow-2xs rounded-xl h-auto shrink-0"
          icon={<PrintIcon size={14} />}
        >
          Print Summary Statement
        </Button>
      </div>

      {/* Printable Sheet */}
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
          {/* Multi-page Print Table Wrapper */}
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
                    {/* 1. Tax Registration Subheader */}
                    <div className="flex justify-between items-center py-2 text-[12px] font-bold text-agm-text print:text-[11px] border-t border-agm-box-border">
                      <span>Corporate Tax Registration No: 104094432200001</span>
                      <span>VAT Registration No:104094432200003</span>
                    </div>

                    {/* 2. Title Banner */}
                    <div
                      className="w-full text-center py-2.5 px-4 font-bold text-[13px] print:text-[12.5px] text-white tracking-wide uppercase mb-0 bg-agm-navy"
                      style={{
                        WebkitPrintColorAdjust: "exact",
                        printColorAdjust: "exact",
                      }}
                    >
                      AGM FITOUT TECHNICAL SERVICES LLC - EXECUTIVE FINANCIAL SUMMARY
                    </div>

                    {/* 3. Statement KPI Summary Cards (Hidden in print) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print-avoid-break print:hidden">
                      <div className="p-3.5 bg-agm-box-bg rounded-xl border border-agm-box-border">
                        <span className="text-[10px] font-bold text-agm-muted uppercase tracking-wider block">
                          Total Revenue
                        </span>
                        <span className="text-base font-black font-mono text-agm-text">
                          {formatNumber(totalRevenue)}
                        </span>
                        <span className="text-[11px] text-agm-green block mt-0.5 font-semibold">
                          Gross Margin: {grossMargin.toFixed(1)}%
                        </span>
                      </div>

                      <div className="p-3.5 bg-agm-box-bg rounded-xl border border-agm-box-border">
                        <span className="text-[10px] font-bold text-agm-muted uppercase tracking-wider block">
                          Net Profit / Yield
                        </span>
                        <span
                          className={`text-base font-black font-mono ${
                            netProfit >= 0 ? "text-emerald-700" : "text-rose-600"
                          }`}
                        >
                          {netProfit < 0
                            ? `(${formatNumber(Math.abs(netProfit))})`
                            : formatNumber(netProfit)}
                        </span>
                        <span className="text-[11px] text-agm-muted block mt-0.5 font-semibold">
                          Net Margin: {netMargin.toFixed(1)}%
                        </span>
                      </div>

                      <div className="p-3.5 bg-agm-box-bg rounded-xl border border-agm-box-border">
                        <span className="text-[10px] font-bold text-agm-muted uppercase tracking-wider block">
                          Total Assets
                        </span>
                        <span className="text-base font-black font-mono text-agm-text">
                          {formatNumber(totalAssets)}
                        </span>
                        <span className="text-[11px] text-agm-navy block mt-0.5 font-semibold">
                          Current: {formatNumber(currentAssets)}
                        </span>
                      </div>

                      <div className="p-3.5 bg-agm-box-bg rounded-xl border border-agm-box-border">
                        <span className="text-[10px] font-bold text-agm-muted uppercase tracking-wider block">
                          Net VAT Position
                        </span>
                        <span
                          className={`text-base font-black font-mono ${
                            netVat > 0 ? "text-rose-600" : "text-emerald-700"
                          }`}
                        >
                          {netVat > 0
                            ? `Payable: ${formatNumber(netVat)}`
                            : `Refund: ${formatNumber(Math.abs(netVat))}`}
                        </span>
                        <span className="text-[11px] text-agm-muted block mt-0.5 font-semibold">
                          Output: {formatNumber(outputVat)}
                        </span>
                      </div>
                    </div>

                    {/* 5. Key Financial Summary Tables */}
                    <div className="space-y-4">
                      {/* Table: Profit & Loss + Balance Sheet Highlights */}
                      <table className="w-full border-collapse text-[12px] print:text-[11.5px] text-agm-text">
                        <thead>
                          <tr className="bg-agm-box-bg font-bold text-agm-text border-b border-agm-box-border">
                            <th className="py-2.5 px-4 text-left font-bold w-[35%]">
                              Financial Metric / Statement
                            </th>
                            <th className="py-2.5 px-4 text-left font-bold w-[40%]">
                              Classification
                            </th>
                            <th className="py-2.5 px-4 text-right font-bold w-[25%]">
                              Amount (AED)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-agm-green-soft text-agm-green-dark border-t border-b border-agm-box-border">
                            <td
                              colSpan={3}
                              className="py-1.5 px-4 font-bold text-agm-green-dark text-[11.5px] uppercase tracking-wider"
                            >
                              1. Profit &amp; Loss Performance Summary
                            </td>
                          </tr>
                          <tr className="border-b border-agm-box-border/50">
                            <td className="py-1.5 px-4 text-agm-muted">Operating Revenue</td>
                            <td className="py-1.5 px-4 font-medium text-agm-text">
                              Total Contract &amp; Services Income
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-agm-text font-semibold">
                              {formatNumber(totalRevenue)}
                            </td>
                          </tr>
                          <tr className="border-b border-agm-box-border/50">
                            <td className="py-1.5 px-4 text-agm-muted">Direct Costs</td>
                            <td className="py-1.5 px-4 font-medium text-agm-text">
                              Direct Materials Procurement (COGS)
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-agm-text">
                              {formatNumber(directExpenses)}
                            </td>
                          </tr>
                          <tr className="bg-agm-navy/10 text-agm-navy font-bold border-t border-b border-agm-navy/20">
                            <td colSpan={2} className="py-2 px-4 font-bold text-agm-navy">
                              Gross Profit
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-agm-navy">
                              {formatNumber(grossProfit)}
                            </td>
                          </tr>
                          <tr className="border-b border-agm-box-border/50">
                            <td className="py-1.5 px-4 text-agm-muted">Operating Expenses</td>
                            <td className="py-1.5 px-4 font-medium text-agm-text">
                              Overheads, Admin, Salaries &amp; Utilities
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-agm-text">
                              {formatNumber(operatingExpenses)}
                            </td>
                          </tr>
                          <tr className="bg-agm-sidebar text-white font-bold border-t-2 border-agm-green">
                            <td colSpan={2} className="py-2.5 px-4 font-black text-white text-[12.5px]">
                              Net Profit / (Loss)
                            </td>
                            <td
                              className={`py-2.5 px-4 text-right font-mono font-black text-[12.5px] ${
                                netProfit < 0 ? "text-rose-400" : "text-emerald-300"
                              }`}
                            >
                              {netProfit < 0
                                ? `(${formatNumber(Math.abs(netProfit))})`
                                : formatNumber(netProfit)}
                            </td>
                          </tr>

                          <tr className="bg-agm-box-bg text-agm-navy border-t border-b border-agm-box-border">
                            <td
                              colSpan={3}
                              className="py-2 px-4 font-bold text-agm-navy text-[11.5px] uppercase tracking-wider"
                            >
                              2. Balance Sheet &amp; Financial Position Highlights
                            </td>
                          </tr>
                          <tr className="border-b border-agm-box-border/50">
                            <td className="py-1.5 px-4 text-agm-muted">Total Assets</td>
                            <td className="py-1.5 px-4 font-medium text-agm-text">
                              Current Assets + Fixed Assets
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-agm-text font-semibold">
                              {formatNumber(totalAssets)}
                            </td>
                          </tr>
                          <tr className="border-b border-agm-box-border/50">
                            <td className="py-1.5 px-4 text-agm-muted">Total Liabilities</td>
                            <td className="py-1.5 px-4 font-medium text-agm-text">
                              Payables, Accruals &amp; Tax Obligations
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-agm-text">
                              {formatNumber(totalLiabilities)}
                            </td>
                          </tr>
                          <tr className="bg-agm-navy/10 text-agm-navy font-bold border-t border-b border-agm-navy/20">
                            <td colSpan={2} className="py-2 px-4 font-bold text-agm-navy">
                              Total Equity + Liabilities
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-agm-navy">
                              {formatNumber(totalLiabilitiesAndEquity)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Quarterly Breakdown Table */}
                      <div className="pt-2 print-avoid-break">
                        <span className="text-xs font-bold uppercase tracking-wider text-agm-navy mb-2 block">
                          3. Quarterly Performance &amp; VAT Breakdown
                        </span>
                        <table className="w-full border-collapse text-[12px] print:text-[11.5px] text-agm-text">
                          <thead>
                            <tr className="bg-agm-box-bg font-bold text-agm-text border-b border-agm-box-border">
                              <th className="py-2 px-3 text-left font-bold">Quarter</th>
                              <th className="py-2 px-3 text-right font-bold">Revenue</th>
                              <th className="py-2 px-3 text-right font-bold">Purchases</th>
                              <th className="py-2 px-3 text-right font-bold">Output VAT</th>
                              <th className="py-2 px-3 text-right font-bold">Input VAT</th>
                              <th className="py-2 px-3 text-right font-bold">Net VAT</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-agm-box-border">
                            {quartersList.map((q) => (
                              <tr key={q.key}>
                                <td className="py-2 px-3 font-semibold text-agm-text">
                                  {q.label}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-agm-text">
                                  {formatNumber(q.sales)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-agm-text">
                                  {formatNumber(q.purchases)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-agm-text">
                                  {formatNumber(q.outputVat)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-agm-text">
                                  {formatNumber(q.inputVat)}
                                </td>
                                <td
                                  className={`py-2 px-3 text-right font-mono font-bold ${
                                    q.netVat > 0 ? "text-rose-600" : "text-emerald-700"
                                  }`}
                                >
                                  {formatNumber(q.netVat)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Screen Footer */}
                    <div className="pt-6 print:hidden">
                      <QuotationFooter className="!mt-0 !px-0" />
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
      </div>
    </div>
  );
};

export default ExecutiveSummaryReport;
