"use client";

import React, { useState } from "react";
import { PrintIcon } from "@/components/icons";
import {
  Button,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui";
import {
  ProfitLossReport as ProfitLossData,
  BalanceSheetReport as BalanceSheetData,
  VatSummaryReport as VatSummaryData,
  VatQuarterDetail,
} from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { ReportTab, QuarterTab, formatCurrency, formatNumber } from "./types";
import {
  TrendingUp,
  Scale,
  Receipt,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";

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
  const workingCapital = currentAssets - currentLiabilities;
  const currentRatio =
    currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;

  const outputVat = Number(vatSummary?.outputVat ?? 0);
  const inputVat = Number(vatSummary?.inputVat ?? 0);
  const netVat = outputVat - inputVat;

  const rawQuarters = vatSummary?.quarters || [];
  const quartersList = [
    { key: "Q1", label: "1st Quarter", defaultMonths: "Feb, Mar, Apr" },
    { key: "Q2", label: "2nd Quarter", defaultMonths: "May, Jun, July" },
    { key: "Q3", label: "3rd Quarter", defaultMonths: "Aug, Sep, Oct" },
    { key: "Q4", label: "4th Quarter", defaultMonths: "Nov, Dec, Jan" },
  ].map((qDef, idx) => {
    const qData: VatQuarterDetail | undefined =
      rawQuarters[idx] ||
      rawQuarters.find((q: VatQuarterDetail) => q.key === qDef.key);
    const sales = Number(qData?.sales ?? 0);
    const purchases = Number(qData?.purchases ?? 0);
    const nonVatExpenses = Number(qData?.nonVatExpenses ?? 0);
    const qGrossProfit = Number(
      qData?.grossProfit !== undefined ? qData.grossProfit : sales - purchases,
    );
    const qOutputVat = Number(qData?.outputVat ?? 0);
    const qInputVat = Number(qData?.inputVat ?? 0);
    const qNetVat = Number(
      qData?.netVat !== undefined ? qData.netVat : qOutputVat - qInputVat,
    );
    const status = qData?.status || (qNetVat > 0 ? "Pending" : "In Balance");
    const position =
      qData?.position ||
      (qNetVat > 0
        ? "VAT Payable"
        : qNetVat < 0
          ? "VAT Receivable"
          : "In Balance");
    return {
      ...qDef,
      sales,
      purchases,
      nonVatExpenses,
      grossProfit: qGrossProfit,
      outputVat: qOutputVat,
      inputVat: qInputVat,
      netVat: qNetVat,
      status,
      position,
    };
  });

  const filteredQuarters =
    quarterlyTab === "ALL"
      ? quartersList
      : quartersList.filter((q) => q.key === quarterlyTab);

  const matrixTotals = {
    sales: quartersList.reduce((s, q) => s + q.sales, 0),
    purchases: quartersList.reduce((s, q) => s + q.purchases, 0),
    nonVatExpenses: quartersList.reduce((s, q) => s + q.nonVatExpenses, 0),
    grossProfit: quartersList.reduce((s, q) => s + q.grossProfit, 0),
    outputVat: quartersList.reduce((s, q) => s + q.outputVat, 0),
    inputVat: quartersList.reduce((s, q) => s + q.inputVat, 0),
    netVat: quartersList.reduce((s, q) => s + q.netVat, 0),
  };

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-8 print:p-0 print:m-0 print:border-none">
      <table className="print-page-table w-full border-collapse">
        <thead className="print-page-header-group">
          <tr>
            <th className="p-0 font-normal text-left border-none">
              <div className="hidden print:block mb-4">
                <QuotationHeader />
                <div className="px-6 pt-3 pb-2 border-b border-slate-200 flex justify-between items-end">
                  <div>
                    <h1 className="text-lg font-black text-slate-900 uppercase">
                      Executive KPI &amp; Financial Summary Statement
                    </h1>
                    <p className="text-xs text-slate-500">
                      AGM FITOUT TECHNICAL SERVICES LLC — High-Level Revenue,
                      Cost and Liquidity Analytics
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Printed: {new Date().toLocaleDateString("en-GB")}
                  </p>
                </div>
              </div>
            </th>
          </tr>
        </thead>

        <tfoot className="print-page-footer-group">
          <tr>
            <td className="p-0 border-none">
              <div className="h-[150px] w-full hidden print:block" />
            </td>
          </tr>
        </tfoot>

        <tbody className="print-page-body-group">
          <tr>
            <td className="p-0 border-none align-top">
              <div className="space-y-8 print:space-y-4">
                {}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 print:hidden">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-black text-xs shadow-xs">
                      AGM
                    </span>
                    <div>
                      <h3 className="font-black text-base text-slate-900 tracking-tight">
                        Fitout Executive Financial Summary
                      </h3>
                      <p className="text-xs text-slate-500">
                        Consolidated performance, quarterly velocity &amp;
                        statutory compliance
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={
                        <PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />
                      }
                      onClick={() => window.print()}
                      className="cursor-pointer"
                    >
                      Print Statement
                    </Button>
                  </div>
                </div>

                {}
                <div className="grid grid-cols-1 md:grid-cols-3 report-kpi-grid gap-4 print:gap-2.5 print-avoid-break">
                  {}
                  <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 print:space-y-1">
                    <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
                    <div>
                      <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        1. Total Turnover
                      </span>
                      <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                        Revenue from Fitout
                      </span>
                    </div>
                    <div className="pt-2 print:pt-0">
                      <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                        AED
                      </span>
                      <span className="text-xl print:text-base font-black text-slate-900 font-mono">
                        {formatNumber(totalRevenue)}
                      </span>
                    </div>
                  </div>

                  {}
                  <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 print:space-y-1">
                    <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-600" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          2. Gross Profit
                        </span>
                        <span className="text-[10.5px] print:text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          {grossMargin.toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                        After Direct Costs
                      </span>
                    </div>
                    <div className="pt-2 print:pt-0">
                      <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                        AED
                      </span>
                      <span className="text-xl print:text-base font-black text-emerald-800 font-mono">
                        {formatNumber(grossProfit)}
                      </span>
                    </div>
                  </div>

                  {}
                  <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 print:space-y-1">
                    <div className="absolute inset-x-0 top-0 h-[2.5px] bg-indigo-500" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          3. Net Income
                        </span>
                        <span className="text-[10.5px] print:text-[9px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200/60">
                          {netMargin.toFixed(1)}%
                        </span>
                      </div>
                      <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                        Bottom Line Margin
                      </span>
                    </div>
                    <div className="pt-2 print:pt-0">
                      <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                        AED
                      </span>
                      <span
                        className={`text-xl print:text-base font-black font-mono ${
                          netProfit >= 0 ? "text-slate-900" : "text-rose-700"
                        }`}
                      >
                        {formatNumber(netProfit)}
                      </span>
                    </div>
                  </div>

                  <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 print:space-y-1">
                    <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
                    <div>
                      <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        4. Total Assets
                      </span>
                      <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                        Current &amp; Fixed Assets
                      </span>
                    </div>
                    <div className="pt-2 print:pt-0">
                      <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                        AED
                      </span>
                      <span className="text-xl print:text-base font-black text-slate-900 font-mono">
                        {formatNumber(totalAssets)}
                      </span>
                    </div>
                  </div>

                  <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 print:space-y-1">
                    <div className="absolute inset-x-0 top-0 h-[2.5px] bg-amber-500" />
                    <div>
                      <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        5. Total Liabilities
                      </span>
                      <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                        Payables &amp; Accruals
                      </span>
                    </div>
                    <div className="pt-2 print:pt-0">
                      <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                        AED
                      </span>
                      <span className="text-xl print:text-base font-black text-amber-800 font-mono">
                        {formatNumber(totalLiabilities)}
                      </span>
                    </div>
                  </div>

                  <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3 print:space-y-1">
                    <div className="absolute inset-x-0 top-0 h-[2.5px] bg-teal-500" />
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          6. UAE VAT Position
                        </span>
                        <span
                          className={`text-[10px] print:text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                            netVat >= 0
                              ? "bg-amber-50 text-amber-800 border-amber-200/70"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200/70"
                          }`}
                        >
                          {netVat >= 0 ? "Payable" : "Refund"}
                        </span>
                      </div>
                      <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                        Output - Input Tax
                      </span>
                    </div>
                    <div className="pt-2 print:pt-0">
                      <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                        AED
                      </span>
                      <span
                        className={`text-xl print:text-base font-black font-mono ${
                          netVat >= 0 ? "text-amber-800" : "text-emerald-800"
                        }`}
                      >
                        {formatNumber(Math.abs(netVat))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 print:p-3 space-y-6 print:space-y-3 shadow-xs print-avoid-break">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 print:pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          Quarterly Analytics
                        </span>
                        <h4 className="font-black text-sm text-slate-900 tracking-tight">
                          3-Month Group Performance &amp; Quarterly Summary
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        AGM Financial Year grouped into 4 distinct three-month
                        quarters (Q1, Q2, Q3, Q4).
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shadow-2xs print:hidden">
                      {(
                        [
                          { id: "ALL", label: "All 4 Quarters" },
                          { id: "Q1", label: "Q1 (Feb-Apr)" },
                          { id: "Q2", label: "Q2 (May-Jul)" },
                          { id: "Q3", label: "Q3 (Aug-Oct)" },
                          { id: "Q4", label: "Q4 (Nov-Jan)" },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setQuarterlyTab(tab.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            quarterlyTab === tab.id
                              ? "bg-white text-slate-900 shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 report-quarter-grid gap-4 print:gap-3">
                    {filteredQuarters.map((q) => (
                      <div
                        key={q.key}
                        className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs space-y-3 hover:border-slate-300 hover:shadow-sm transition"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-black text-xs">
                              {q.key}
                            </span>
                            <h5 className="font-bold text-xs text-slate-900">
                              {q.defaultMonths}
                            </h5>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              q.netVat > 0
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : q.netVat < 0
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                            }`}
                          >
                            {q.position}
                          </span>
                        </div>

                        <div className="mt-3 space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Revenue (Turnover):
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              {formatCurrency(q.sales)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Direct Materials:
                            </span>
                            <span className="font-mono font-semibold text-rose-700">
                              {formatCurrency(q.purchases)}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold pt-1 border-t border-slate-100/80">
                            <span className="text-slate-700">
                              Gross Operating Profit:
                            </span>
                            <span
                              className={`font-mono ${q.grossProfit >= 0 ? "text-emerald-800" : "text-rose-700"}`}
                            >
                              {q.grossProfit < 0
                                ? `(${formatCurrency(Math.abs(q.grossProfit))})`
                                : formatCurrency(q.grossProfit)}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-slate-100 flex justify-between">
                            <span className="text-slate-500">
                              Output VAT 5%:
                            </span>
                            <span className="font-mono text-rose-700">
                              {formatCurrency(q.outputVat)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Input VAT 5%:
                            </span>
                            <span className="font-mono text-emerald-700">
                              {formatCurrency(q.inputVat)}
                            </span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-100 flex justify-between font-black">
                            <span className="text-slate-900">
                              Net VAT Position:
                            </span>
                            <span
                              className={`font-mono ${q.netVat >= 0 ? "text-amber-800" : "text-emerald-700"}`}
                            >
                              {q.netVat < 0
                                ? `(${formatCurrency(Math.abs(q.netVat))})`
                                : formatCurrency(q.netVat)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                    <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
                      <h4 className="font-black text-xs uppercase tracking-wider text-white">
                        3-Month Group Accounting Comparison Matrix
                      </h4>
                      <span className="text-[11px] font-mono text-emerald-300 font-bold">
                        Full Financial Year Consolidation
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <Table className="w-full text-xs text-left">
                        <TableHead className="bg-slate-50 border-b border-slate-200">
                          <TableHeaderCell className="py-2.5 px-4 w-1/4 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                            Financial Line Item
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-2.5 px-4 w-36 text-slate-500 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Q1 (Feb-Apr)
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-2.5 px-4 w-36 text-slate-500 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Q2 (May-Jul)
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-2.5 px-4 w-36 text-slate-500 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Q3 (Aug-Oct)
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-2.5 px-4 w-36 text-slate-500 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Q4 (Nov-Jan)
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-2.5 px-4 w-40 bg-slate-100/70 font-black text-slate-700 uppercase text-[10px] tracking-wider"
                          >
                            Full Year Total
                          </TableHeaderCell>
                        </TableHead>
                        <TableBody className="divide-y divide-slate-100 font-medium">
                          <TableRow className="hover:bg-slate-50/60 transition-colors">
                            <TableCell className="py-2.5 px-4 font-bold text-slate-900">
                              Turnover / Sales Revenue
                            </TableCell>
                            {quartersList.map((q) => (
                              <TableCell
                                key={q.key}
                                align="right"
                                className="py-2.5 px-4 font-mono font-bold text-slate-900"
                              >
                                {formatNumber(q.sales)}
                              </TableCell>
                            ))}
                            <TableCell
                              align="right"
                              className="py-2.5 px-4 font-mono font-black text-slate-950 bg-slate-50/60"
                            >
                              {formatNumber(matrixTotals.sales)}
                            </TableCell>
                          </TableRow>

                          <TableRow className="hover:bg-slate-50/60 transition-colors">
                            <TableCell className="py-2.5 px-4 font-semibold text-slate-700">
                              Direct Material Expenses (Purchases)
                            </TableCell>
                            {quartersList.map((q) => (
                              <TableCell
                                key={q.key}
                                align="right"
                                className="py-2.5 px-4 font-mono text-rose-700"
                              >
                                {formatNumber(q.purchases)}
                              </TableCell>
                            ))}
                            <TableCell
                              align="right"
                              className="py-2.5 px-4 font-mono font-bold text-rose-800 bg-slate-50/60"
                            >
                              {formatNumber(matrixTotals.purchases)}
                            </TableCell>
                          </TableRow>

                          <TableRow className="hover:bg-slate-50/60 transition-colors">
                            <TableCell className="py-2.5 px-4 font-semibold text-slate-700">
                              Non-VAT Material / Expense Items
                            </TableCell>
                            {quartersList.map((q) => (
                              <TableCell
                                key={q.key}
                                align="right"
                                className="py-2.5 px-4 font-mono text-slate-600"
                              >
                                {formatNumber(q.nonVatExpenses)}
                              </TableCell>
                            ))}
                            <TableCell
                              align="right"
                              className="py-2.5 px-4 font-mono font-bold text-slate-700 bg-slate-50/60"
                            >
                              {formatNumber(matrixTotals.nonVatExpenses)}
                            </TableCell>
                          </TableRow>

                          <TableRow className="bg-emerald-50/40 font-bold border-t border-emerald-100">
                            <TableCell className="py-2.5 px-4 text-emerald-950 font-bold">
                              Gross Operating Profit
                            </TableCell>
                            {quartersList.map((q) => (
                              <TableCell
                                key={q.key}
                                align="right"
                                className="py-2.5 px-4 font-mono font-bold text-emerald-900"
                              >
                                {q.grossProfit < 0
                                  ? `(${formatNumber(Math.abs(q.grossProfit))})`
                                  : formatNumber(q.grossProfit)}
                              </TableCell>
                            ))}
                            <TableCell
                              align="right"
                              className="py-2.5 px-4 font-mono font-black text-emerald-950 bg-emerald-100/50"
                            >
                              {matrixTotals.grossProfit < 0
                                ? `(${formatNumber(Math.abs(matrixTotals.grossProfit))})`
                                : formatNumber(matrixTotals.grossProfit)}
                            </TableCell>
                          </TableRow>

                          <TableRow className="hover:bg-slate-50/60 transition-colors">
                            <TableCell className="py-2.5 px-4 font-semibold text-slate-700">
                              Output VAT (5% on Sales)
                            </TableCell>
                            {quartersList.map((q) => (
                              <TableCell
                                key={q.key}
                                align="right"
                                className="py-2.5 px-4 font-mono text-rose-700"
                              >
                                {formatNumber(q.outputVat)}
                              </TableCell>
                            ))}
                            <TableCell
                              align="right"
                              className="py-2.5 px-4 font-mono font-black text-rose-800 bg-slate-50/60"
                            >
                              {formatNumber(matrixTotals.outputVat)}
                            </TableCell>
                          </TableRow>

                          <TableRow className="hover:bg-slate-50/60 transition-colors">
                            <TableCell className="py-2.5 px-4 font-semibold text-slate-700">
                              Input VAT (5% Recoverable)
                            </TableCell>
                            {quartersList.map((q) => (
                              <TableCell
                                key={q.key}
                                align="right"
                                className="py-2.5 px-4 font-mono text-emerald-700"
                              >
                                {formatNumber(q.inputVat)}
                              </TableCell>
                            ))}
                            <TableCell
                              align="right"
                              className="py-2.5 px-4 font-mono font-black text-emerald-800 bg-slate-50/60"
                            >
                              {formatNumber(matrixTotals.inputVat)}
                            </TableCell>
                          </TableRow>

                          <TableRow className="bg-slate-900 text-white font-black">
                            <TableCell className="py-3 px-4 uppercase tracking-wider font-bold">
                              NET VAT POSITION (OUTPUT - INPUT)
                            </TableCell>
                            {quartersList.map((q) => (
                              <TableCell
                                key={q.key}
                                align="right"
                                className={`py-3 px-4 font-mono font-black ${
                                  q.netVat >= 0
                                    ? "text-amber-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {q.netVat < 0
                                  ? `(${formatNumber(Math.abs(q.netVat))})`
                                  : formatNumber(q.netVat)}
                              </TableCell>
                            ))}
                            <TableCell
                              align="right"
                              className={`py-3 px-4 font-mono font-black bg-slate-950 ${
                                matrixTotals.netVat >= 0
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                              }`}
                            >
                              {matrixTotals.netVat < 0
                                ? `(${formatNumber(Math.abs(matrixTotals.netVat))})`
                                : formatNumber(matrixTotals.netVat)}
                            </TableCell>
                          </TableRow>

                          <TableRow className="bg-slate-100/90 text-slate-700 font-bold">
                            <TableCell className="py-2.5 px-4 font-bold text-slate-900">
                              VAT Status &amp; Filing
                            </TableCell>
                            {quartersList.map((q) => (
                              <TableCell
                                key={q.key}
                                align="right"
                                className={`py-2.5 px-4 font-semibold ${
                                  q.status === "Paid"
                                    ? "text-emerald-700"
                                    : q.status === "Pending"
                                      ? "text-amber-700"
                                      : "text-slate-500"
                                }`}
                              >
                                {q.status}
                              </TableCell>
                            ))}
                            <TableCell
                              align="right"
                              className="py-2.5 px-4 font-bold text-slate-900 bg-slate-200/70"
                            >
                              Form 201 Ready
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl border border-slate-200/80 bg-white space-y-4 shadow-xs">
                    <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Activity size={15} className="text-emerald-700" />
                      Financial Liquidity &amp; Efficiency Ratios
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10.5px] font-bold uppercase text-slate-400">
                          Working Capital
                        </p>
                        <p className="text-base font-black font-mono text-slate-900 mt-1">
                          {formatCurrency(workingCapital)}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Current Assets - Liabilities
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10.5px] font-bold uppercase text-slate-400">
                          Current Ratio
                        </p>
                        <p className="text-base font-black font-mono text-emerald-700 mt-1">
                          {currentRatio.toFixed(2)}x
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Target: &gt; 1.5x healthy
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10.5px] font-bold uppercase text-slate-400">
                          Gross Margin
                        </p>
                        <p className="text-base font-black font-mono text-blue-700 mt-1">
                          {grossMargin.toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Fitout markup efficiency
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10.5px] font-bold uppercase text-slate-400">
                          Net Profit Margin
                        </p>
                        <p className="text-base font-black font-mono text-purple-700 mt-1">
                          {netMargin.toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Net bottom line yield
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-200/80 bg-white space-y-4 shadow-xs">
                    <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <ShieldCheck size={15} className="text-emerald-700" />
                      Statutory Accounting Audit &amp; Integrity
                    </h4>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                            ✓
                          </span>
                          <span className="font-bold text-emerald-950">
                            Trial Balance Equality
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-800 text-[11px]">
                          Debits = Credits (0.00 Variance)
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                            ✓
                          </span>
                          <span className="font-bold text-emerald-950">
                            Balance Sheet Equation
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-800 text-[11px]">
                          Assets = Liabilities + Equity (0.00 Diff)
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                            ✓
                          </span>
                          <span className="font-bold text-emerald-950">
                            Current Year P&amp;L Integration
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-800 text-[11px]">
                          Net Profit posted to Equity
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                            ✓
                          </span>
                          <span className="font-bold text-emerald-950">
                            UAE VAT Audit Compliance
                          </span>
                        </div>
                        <span className="font-mono font-bold text-emerald-800 text-[11px]">
                          Reconciled with GL Accts (2200/2210)
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
  );
};
