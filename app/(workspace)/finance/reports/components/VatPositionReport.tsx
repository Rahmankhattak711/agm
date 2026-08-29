"use client";

import React from "react";
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
  VatSummaryReport as VatSummaryData,
  VatQuarterDetail,
  VatMonthlyRow,
  VatMonthlyBreakdownRow,
} from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { formatCurrency, formatNumber } from "./types";
import {
  Receipt,
  Printer,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Percent,
} from "lucide-react";

interface VatPositionReportProps {
  vatSummary?: VatSummaryData;
  isLoading: boolean;
}

export const VatPositionReport: React.FC<VatPositionReportProps> = ({
  vatSummary,
  isLoading,
}) => {
  const quartersData: VatQuarterDetail[] =
    vatSummary?.quarters && vatSummary.quarters.length > 0
      ? vatSummary.quarters
      : [];

  const monthlyNetData: VatMonthlyRow[] =
    vatSummary?.monthlyNet && vatSummary.monthlyNet.length > 0
      ? vatSummary.monthlyNet
      : [];

  const purchasesData: VatMonthlyBreakdownRow[] =
    vatSummary?.monthlyPurchases && vatSummary.monthlyPurchases.length > 0
      ? vatSummary.monthlyPurchases
      : [];

  const incomeData: VatMonthlyBreakdownRow[] =
    vatSummary?.monthlyIncome && vatSummary.monthlyIncome.length > 0
      ? vatSummary.monthlyIncome
      : [];

  const totalInputVat =
    vatSummary?.inputVat !== undefined
      ? Number(vatSummary.inputVat)
      : monthlyNetData.reduce(
          (s: number, r: VatMonthlyRow) => s + Number(r.inputVat || 0),
          0,
        );

  const totalOutputVat =
    vatSummary?.outputVat !== undefined
      ? Number(vatSummary.outputVat)
      : monthlyNetData.reduce(
          (s: number, r: VatMonthlyRow) => s + Number(r.outputVat || 0),
          0,
        );

  const netVat = totalOutputVat - totalInputVat;

  const totalPurchasesTaxable = purchasesData.reduce(
    (s: number, r: VatMonthlyBreakdownRow) => s + Number(r.taxableAmount || 0),
    0,
  );
  const totalPurchasesNonVat = purchasesData.reduce(
    (s: number, r: VatMonthlyBreakdownRow) => s + Number(r.nonVatAmount || 0),
    0,
  );
  const totalPurchasesVat = purchasesData.reduce(
    (s: number, r: VatMonthlyBreakdownRow) => s + Number(r.vatAmount || 0),
    0,
  );
  const totalPurchasesAmount = purchasesData.reduce(
    (s: number, r: VatMonthlyBreakdownRow) => s + Number(r.totalAmount || 0),
    0,
  );

  const totalIncomeTaxable = incomeData.reduce(
    (s: number, r: VatMonthlyBreakdownRow) => s + Number(r.taxableAmount || 0),
    0,
  );
  const totalIncomeNonVat = incomeData.reduce(
    (s: number, r: VatMonthlyBreakdownRow) => s + Number(r.nonVatAmount || 0),
    0,
  );
  const totalIncomeVat = incomeData.reduce(
    (s: number, r: VatMonthlyBreakdownRow) => s + Number(r.vatAmount || 0),
    0,
  );
  const totalIncomeAmount = incomeData.reduce(
    (s: number, r: VatMonthlyBreakdownRow) => s + Number(r.totalAmount || 0),
    0,
  );

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6 print:p-0 print:m-0 print:border-none">
      <table className="print-page-table w-full border-collapse">
        <thead className="print-page-header-group">
          <tr>
            <th className="p-0 font-normal text-left border-none">
              <div className="hidden print:block mb-4">
                <QuotationHeader />
                <div className="px-6 pt-3 pb-2 border-b border-slate-200 flex justify-between items-end">
                  <div>
                    <h1 className="text-lg font-black text-slate-900 uppercase">
                      VAT Return &amp; Tax Position Statement (FTA Form 201)
                    </h1>
                    <p className="text-xs text-slate-500">
                      AGM FITOUT TECHNICAL SERVICES LLC — TRN 104094432200003 — 5% Standard Rated Supplies &amp; Recoverable Input Tax
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
              <div className="space-y-6">
                {/* Header Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 print:hidden">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-1 rounded-lg bg-teal-700 text-white font-black text-xs shadow-xs">
                        VAT
                      </span>
                      <h3 className="font-black text-lg text-slate-900 tracking-tight">
                        VAT Summary Report &amp; Returns (FTA Form 201 Ready)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      AGM FITOUT TECHNICAL SERVICES LLC — TRN:{" "}
                      <span className="font-mono font-bold text-slate-700">104094432200003</span> • Standard Tax Rate: 5%
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        netVat >= 0
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {netVat >= 0 ? (
                        <AlertTriangle size={13} className="text-amber-700" />
                      ) : (
                        <CheckCircle2 size={13} className="text-emerald-700" />
                      )}
                      {netVat >= 0 ? "Tax Payable to FTA" : "Tax Refund Claim"}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Printer size={14} />}
                      onClick={() => window.print()}
                      className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      Print Statement
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="py-16 text-center text-xs text-slate-400 animate-pulse space-y-2">
                    <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto" />
                    <p>Calculating UAE VAT Position &amp; FTA Form 201 Schedules...</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* 4 Summary KPI Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-4 print:gap-2.5 print-avoid-break">
                      {/* 1. Taxable Turnover */}
                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
                        <div>
                          <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            1. Taxable Turnover
                          </span>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            Total sales (excl. VAT)
                          </span>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                            AED
                          </span>
                          <span className="text-xl print:text-base font-black text-slate-900 font-mono">
                            {formatNumber(totalIncomeTaxable)}
                          </span>
                        </div>
                      </div>

                      {/* 2. Output VAT */}
                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-amber-500" />
                        <div>
                          <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            2. Output VAT (5%)
                          </span>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            Tax collected on sales
                          </span>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                            AED
                          </span>
                          <span className="text-xl print:text-base font-black text-amber-800 font-mono">
                            {formatNumber(totalOutputVat)}
                          </span>
                        </div>
                      </div>

                      {/* 3. Recoverable Input VAT */}
                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
                        <div>
                          <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            3. Recoverable Input VAT
                          </span>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            Tax paid on purchases
                          </span>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                            AED
                          </span>
                          <span className="text-xl print:text-base font-black text-emerald-800 font-mono">
                            {formatNumber(totalInputVat)}
                          </span>
                        </div>
                      </div>

                      {/* 4. Net Tax Position */}
                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className={`absolute inset-x-0 top-0 h-[2.5px] ${netVat >= 0 ? "bg-amber-500" : "bg-teal-500"}`} />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              4. Net VAT Position
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                netVat >= 0
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
                              }`}
                            >
                              {netVat >= 0 ? "Payable" : "Refund"}
                            </span>
                          </div>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            Output minus Input VAT
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

                    {/* Schedule 1: Quarterly VAT Returns & Position */}
                    <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs print-avoid-break">
                      <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
                        <h4 className="font-black text-xs uppercase tracking-wider text-white">
                          1. Quarterly VAT Returns &amp; Position
                        </h4>
                        <span className="text-[11px] font-mono text-emerald-300 font-bold">
                          Standard Rate: 5%
                        </span>
                      </div>

                      <Table className="w-full text-xs text-left">
                        <TableHead className="bg-slate-50/95 border-b border-slate-200">
                          <TableHeaderCell className="py-3 px-5 font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                            Quarter Details
                          </TableHeaderCell>
                          {quartersData.map((q: VatQuarterDetail, idx: number) => (
                            <TableHeaderCell
                              key={idx}
                              align="right"
                              className="py-3 px-4 font-bold text-slate-600 uppercase text-[10px] tracking-wider"
                            >
                              {q.quarter}
                            </TableHeaderCell>
                          ))}
                        </TableHead>
                        <TableBody className="divide-y divide-slate-100 font-medium">
                          <TableRow className="hover:bg-slate-50/60 transition-colors">
                            <TableCell className="py-2.5 px-5 font-bold text-slate-900">
                              VAT Rate
                            </TableCell>
                            {quartersData.map((q: VatQuarterDetail, idx: number) => (
                              <TableCell
                                key={idx}
                                align="right"
                                className="py-2.5 px-4 font-mono font-bold text-slate-800"
                              >
                                {q.vatRate || "5%"}
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-slate-50/60 transition-colors">
                            <TableCell className="py-2.5 px-5 font-bold text-slate-900">
                              Total Input VAT
                            </TableCell>
                            {quartersData.map((q: VatQuarterDetail, idx: number) => (
                              <TableCell
                                key={idx}
                                align="right"
                                className="py-2.5 px-4 font-mono font-semibold text-emerald-800"
                              >
                                {formatNumber(q.inputVat)}
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-slate-50/60 transition-colors">
                            <TableCell className="py-2.5 px-5 font-bold text-slate-900">
                              Total Output VAT
                            </TableCell>
                            {quartersData.map((q: VatQuarterDetail, idx: number) => (
                              <TableCell
                                key={idx}
                                align="right"
                                className="py-2.5 px-4 font-mono font-semibold text-rose-800"
                              >
                                {formatNumber(q.outputVat)}
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="bg-slate-100 font-bold">
                            <TableCell className="py-3 px-5 text-slate-950 font-black">
                              Net VAT (Output - Input)
                            </TableCell>
                            {quartersData.map((q: VatQuarterDetail, idx: number) => (
                              <TableCell
                                key={idx}
                                align="right"
                                className={`py-3 px-4 font-mono font-black ${
                                  q.netVat >= 0 ? "text-amber-800" : "text-emerald-800"
                                }`}
                              >
                                {formatNumber(q.netVat)}
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-slate-50/60 transition-colors">
                            <TableCell className="py-2.5 px-5 font-bold text-slate-900">
                              VAT Position
                            </TableCell>
                            {quartersData.map((q: VatQuarterDetail, idx: number) => (
                              <TableCell
                                key={idx}
                                align="right"
                                className="py-2.5 px-4 font-semibold"
                              >
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase border ${
                                    q.position === "VAT Receivable"
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                      : "bg-amber-50 text-amber-800 border-amber-200"
                                  }`}
                                >
                                  {q.position}
                                </span>
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-slate-50/60 transition-colors">
                            <TableCell className="py-2.5 px-5 font-bold text-slate-900">
                              Filing Status
                            </TableCell>
                            {quartersData.map((q: VatQuarterDetail, idx: number) => (
                              <TableCell
                                key={idx}
                                align="right"
                                className="py-2.5 px-4 font-mono text-[11px] font-bold text-slate-600"
                              >
                                {q.status || "—"}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Schedule 2: Monthly Net VAT Summary */}
                    <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs print-avoid-break">
                      <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
                        <h4 className="font-black text-xs uppercase tracking-wider text-white">
                          2. Monthly Net VAT Summary
                        </h4>
                        <span className="text-[11px] font-mono text-slate-300 font-bold">
                          12-Month Financial Year
                        </span>
                      </div>

                      <Table className="w-full text-xs text-left">
                        <TableHead className="bg-slate-50/95 border-b border-slate-200">
                          <TableHeaderCell className="py-3 px-5 w-1/4 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Month
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-5 text-right w-1/4 text-slate-600 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Input VAT (AED)
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-5 text-right w-1/4 text-slate-600 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Output VAT (AED)
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-5 text-right w-1/4 text-slate-700 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Net VAT (AED)
                          </TableHeaderCell>
                        </TableHead>
                        <TableBody className="divide-y divide-slate-100">
                          {monthlyNetData.map((r: VatMonthlyRow, idx: number) => (
                            <TableRow
                              key={idx}
                              className="hover:bg-slate-50/60 text-slate-700 transition-colors"
                            >
                              <TableCell className="py-2.5 px-5 font-bold text-slate-900">
                                {r.month}
                              </TableCell>
                              <TableCell
                                align="right"
                                className="py-2.5 px-5 font-mono font-medium text-emerald-800"
                              >
                                {formatNumber(r.inputVat)}
                              </TableCell>
                              <TableCell
                                align="right"
                                className="py-2.5 px-5 font-mono font-medium text-rose-800"
                              >
                                {formatNumber(r.outputVat)}
                              </TableCell>
                              <TableCell
                                align="right"
                                className={`py-2.5 px-5 font-mono font-bold ${
                                  r.netVat >= 0 ? "text-amber-800" : "text-emerald-800"
                                }`}
                              >
                                {formatNumber(r.netVat)}
                              </TableCell>
                            </TableRow>
                          ))}

                          <TableRow className="bg-slate-900 text-white font-black">
                            <TableCell className="py-4 px-5 uppercase tracking-wider font-bold text-xs">
                              TOTAL YEAR-TO-DATE
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-4 px-5 text-right font-mono font-black text-sm text-emerald-400"
                            >
                              {formatNumber(totalInputVat)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-4 px-5 text-right font-mono font-black text-sm text-rose-400"
                            >
                              {formatNumber(totalOutputVat)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-4 px-5 text-right font-mono font-black text-sm text-amber-400"
                            >
                              {formatNumber(netVat)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Schedule 3: Monthly Purchase / Expense Summary */}
                    <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs print-avoid-break">
                      <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
                        <h4 className="font-black text-xs uppercase tracking-wider text-white">
                          3. Monthly Purchase / Expense Summary (Input VAT Breakdown)
                        </h4>
                        <span className="text-[11px] font-mono text-emerald-300 font-bold">
                          Recoverable Input Tax
                        </span>
                      </div>

                      <Table className="w-full text-xs text-left">
                        <TableHead className="bg-slate-50/95 border-b border-slate-200">
                          <TableHeaderCell className="py-3 px-5 w-1/5 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Month
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-4 text-right w-1/5 text-slate-600 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Taxable (Excl. VAT)
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-4 text-right w-1/5 text-slate-600 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Non-VAT Amount
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-4 text-right w-1/5 text-slate-600 font-bold uppercase text-[10px] tracking-wider"
                          >
                            VAT Amount (5%)
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-5 text-right w-1/5 text-slate-700 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Total Amount (AED)
                          </TableHeaderCell>
                        </TableHead>
                        <TableBody className="divide-y divide-slate-100">
                          {purchasesData.map((r: VatMonthlyBreakdownRow, idx: number) => (
                            <TableRow
                              key={idx}
                              className="hover:bg-slate-50/60 text-slate-700 transition-colors"
                            >
                              <TableCell className="py-2.5 px-5 font-bold text-slate-900">
                                {r.month}
                              </TableCell>
                              <TableCell
                                align="right"
                                className="py-2.5 px-4 font-mono font-medium text-slate-900"
                              >
                                {formatNumber(r.taxableAmount)}
                              </TableCell>
                              <TableCell
                                align="right"
                                className="py-2.5 px-4 font-mono font-medium text-slate-500"
                              >
                                {formatNumber(r.nonVatAmount)}
                              </TableCell>
                              <TableCell
                                align="right"
                                className="py-2.5 px-4 font-mono font-bold text-emerald-800"
                              >
                                {formatNumber(r.vatAmount)}
                              </TableCell>
                              <TableCell
                                align="right"
                                className="py-2.5 px-5 font-mono font-semibold text-slate-900"
                              >
                                {formatNumber(r.totalAmount)}
                              </TableCell>
                            </TableRow>
                          ))}

                          <TableRow className="bg-slate-900 text-white font-black">
                            <TableCell className="py-4 px-5 uppercase tracking-wider font-bold text-xs">
                              TOTAL PURCHASES
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-4 px-4 text-right font-mono font-black text-sm text-slate-200"
                            >
                              {formatNumber(totalPurchasesTaxable)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-4 px-4 text-right font-mono font-bold text-slate-400"
                            >
                              {formatNumber(totalPurchasesNonVat)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-4 px-4 text-right font-mono font-black text-sm text-emerald-400"
                            >
                              {formatNumber(totalPurchasesVat)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-4 px-5 text-right font-mono font-black text-sm text-white"
                            >
                              {formatNumber(totalPurchasesAmount)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Schedule 4: Monthly Income Summary */}
                    <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs print-avoid-break">
                      <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
                        <h4 className="font-black text-xs uppercase tracking-wider text-white">
                          4. Monthly Income Summary (Output VAT Breakdown)
                        </h4>
                        <span className="text-[11px] font-mono text-rose-300 font-bold">
                          Sales &amp; Service Revenue
                        </span>
                      </div>

                      <Table className="w-full text-xs text-left">
                        <TableHead className="bg-slate-50/95 border-b border-slate-200">
                          <TableHeaderCell className="py-3 px-5 w-1/5 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Month
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-4 text-right w-1/5 text-slate-600 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Taxable (Excl. VAT)
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-4 text-right w-1/5 text-slate-600 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Non-VAT Amount
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-4 text-right w-1/5 text-slate-600 font-bold uppercase text-[10px] tracking-wider"
                          >
                            VAT Amount (5%)
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-5 text-right w-1/5 text-slate-700 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Total Amount (AED)
                          </TableHeaderCell>
                        </TableHead>
                        <TableBody className="divide-y divide-slate-100">
                          {incomeData.map((r: VatMonthlyBreakdownRow, idx: number) => (
                            <TableRow
                              key={idx}
                              className="hover:bg-slate-50/60 text-slate-700 transition-colors"
                            >
                              <TableCell className="py-2.5 px-5 font-bold text-slate-900">
                                {r.month}
                              </TableCell>
                              <TableCell
                                align="right"
                                className="py-2.5 px-4 font-mono font-medium text-slate-900"
                              >
                                {formatNumber(r.taxableAmount)}
                              </TableCell>
                              <TableCell
                                align="right"
                                className="py-2.5 px-4 font-mono font-medium text-slate-500"
                              >
                                {formatNumber(r.nonVatAmount)}
                              </TableCell>
                              <TableCell
                                align="right"
                                className="py-2.5 px-4 font-mono font-bold text-rose-800"
                              >
                                {formatNumber(r.vatAmount)}
                              </TableCell>
                              <TableCell
                                align="right"
                                className="py-2.5 px-5 font-mono font-semibold text-slate-900"
                              >
                                {formatNumber(r.totalAmount)}
                              </TableCell>
                            </TableRow>
                          ))}

                          <TableRow className="bg-slate-900 text-white font-black">
                            <TableCell className="py-4 px-5 uppercase tracking-wider font-bold text-xs">
                              TOTAL REVENUE
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-4 px-4 text-right font-mono font-black text-sm text-slate-200"
                            >
                              {formatNumber(totalIncomeTaxable)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-4 px-4 text-right font-mono font-bold text-slate-400"
                            >
                              {formatNumber(totalIncomeNonVat)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-4 px-4 text-right font-mono font-black text-sm text-rose-400"
                            >
                              {formatNumber(totalIncomeVat)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-4 px-5 text-right font-mono font-black text-sm text-white"
                            >
                              {formatNumber(totalIncomeAmount)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Schedule 5: Federal Tax Authority — Form 201 Box Breakdown */}
                    <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs print-avoid-break">
                      <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
                        <h4 className="font-black text-xs uppercase tracking-wider text-white">
                          5. Federal Tax Authority — Form 201 Box Breakdown
                        </h4>
                        <span className="text-[11px] font-mono text-emerald-300 font-bold">
                          Official Tax Box Schedule
                        </span>
                      </div>

                      <Table className="w-full text-xs text-left">
                        <TableHead className="bg-slate-50/95 border-b border-slate-200">
                          <TableHeaderCell className="py-3 px-5 w-24 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Box #
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-5 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Description
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-5 text-right w-44 text-slate-600 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Taxable Amount (AED)
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-5 text-right w-44 text-slate-700 font-bold uppercase text-[10px] tracking-wider"
                          >
                            VAT Amount (AED)
                          </TableHeaderCell>
                        </TableHead>
                        <TableBody className="divide-y divide-slate-100">
                          <TableRow className="hover:bg-slate-50/60 transition-colors">
                            <TableCell className="py-2.5 px-5 font-mono font-bold text-slate-900">
                              Box 1
                            </TableCell>
                            <TableCell className="py-2.5 px-5 font-semibold text-slate-900">
                              Standard rated supplies in Dubai / UAE (Sales &amp; Turnover)
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-2.5 px-5 text-right font-mono font-medium text-slate-900"
                            >
                              {formatNumber(totalIncomeTaxable)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-2.5 px-5 text-right font-mono font-bold text-rose-700"
                            >
                              {formatNumber(totalOutputVat)}
                            </TableCell>
                          </TableRow>

                          <TableRow className="hover:bg-slate-50/60 transition-colors">
                            <TableCell className="py-2.5 px-5 font-mono font-bold text-slate-900">
                              Box 9
                            </TableCell>
                            <TableCell className="py-2.5 px-5 font-semibold text-slate-900">
                              Standard rated expenses &amp; materials (Recoverable Input Tax)
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-2.5 px-5 text-right font-mono font-medium text-slate-900"
                            >
                              {formatNumber(totalPurchasesTaxable)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-2.5 px-5 text-right font-mono font-bold text-emerald-700"
                            >
                              {formatNumber(totalInputVat)}
                            </TableCell>
                          </TableRow>

                          <TableRow className="bg-slate-50/80 font-bold text-slate-900">
                            <TableCell className="py-2.5 px-5 font-mono font-bold text-slate-900">
                              Box 11
                            </TableCell>
                            <TableCell className="py-2.5 px-5 font-bold text-slate-900">
                              Total value of due tax for the period (Output Tax)
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-2.5 px-5 text-right font-mono font-bold text-slate-500"
                            >
                              —
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-2.5 px-5 text-right font-mono font-black text-rose-800"
                            >
                              {formatNumber(totalOutputVat)}
                            </TableCell>
                          </TableRow>

                          <TableRow className="bg-slate-50/80 font-bold text-slate-900">
                            <TableCell className="py-2.5 px-5 font-mono font-bold text-slate-900">
                              Box 12
                            </TableCell>
                            <TableCell className="py-2.5 px-5 font-bold text-slate-900">
                              Total value of recoverable tax for the period (Input Tax)
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-2.5 px-5 text-right font-mono font-bold text-slate-500"
                            >
                              —
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-2.5 px-5 text-right font-mono font-black text-emerald-800"
                            >
                              {formatNumber(totalInputVat)}
                            </TableCell>
                          </TableRow>

                          <TableRow className="bg-slate-900 text-white font-black">
                            <TableCell className="py-3.5 px-5 font-mono font-black text-amber-400">
                              Box 13
                            </TableCell>
                            <TableCell className="py-3.5 px-5 text-xs uppercase tracking-wider font-bold">
                              PAYABLE TAX FOR THE PERIOD (NET TAX LIABILITY)
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-3.5 px-5 text-right font-mono font-bold text-slate-400"
                            >
                              —
                            </TableCell>
                            <TableCell
                              align="right"
                              className={`py-3.5 px-5 text-right font-mono font-black text-sm ${
                                netVat >= 0 ? "text-amber-400" : "text-emerald-400"
                              }`}
                            >
                              {formatNumber(netVat)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
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

export default VatPositionReport;
