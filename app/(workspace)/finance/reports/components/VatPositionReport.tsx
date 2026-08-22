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
import { formatCurrency, formatNumber } from "./types";

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
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-base text-slate-900">
            VAT Summary Report & Returns (FTA Form 201 Ready)
          </h3>
          <p className="text-xs text-slate-500">
            AGM FITOUT TECHNICAL SERVICES LLC — Quarterly returns, monthly net
            tax, purchase expense summary, and sales income VAT breakdown.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            FTA Form 201 Compliant
          </span>
          <Button
            variant="outline"
            size="sm"
            icon={<PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />}
            onClick={() => window.print()}
            className="print:hidden"
          >
            Print / Save PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
          Loading VAT Summary Report...
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                  1. Taxable Turnover
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Total sales (excl. VAT)
                </p>
              </div>
              <p className="text-xl font-black text-blue-900 font-mono">
                {formatCurrency(totalIncomeTaxable)}
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col justify-between space-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                  2. Output VAT (5%)
                </p>
                <p className="text-xs text-rose-700 mt-0.5">
                  Tax collected on sales
                </p>
              </div>
              <p className="text-xl font-black text-rose-900 font-mono">
                {formatCurrency(totalOutputVat)}
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  3. Input VAT (5%)
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Recoverable tax on expenses
                </p>
              </div>
              <p className="text-xl font-black text-emerald-900 font-mono">
                {formatCurrency(totalInputVat)}
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-900 text-white flex flex-col justify-between space-y-2 shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    4. Net VAT Position
                  </p>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      netVat >= 0
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {netVat >= 0 ? "Payable to FTA" : "Refund from FTA"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Output VAT - Input VAT
                </p>
              </div>
              <p
                className={`text-xl font-black font-mono ${
                  netVat >= 0 ? "text-amber-400" : "text-emerald-400"
                }`}
              >
                {formatCurrency(netVat)}
              </p>
            </div>
          </div>

          {/* TABLE 1: QUARTER DETAILS */}
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs space-y-0">
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                1. Quarterly VAT Returns & Position
              </h4>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                Standard Rate: 5%
              </span>
            </div>

            <Table className="w-full text-xs text-left">
              <TableHead className="bg-slate-50 border-b border-slate-200">
                <TableHeaderCell className="py-2.5 px-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                  Quarter Details
                </TableHeaderCell>
                {quartersData.map((q: VatQuarterDetail, idx: number) => (
                  <TableHeaderCell
                    key={idx}
                    align="right"
                    className="py-2.5 px-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider"
                  >
                    {q.quarter}
                  </TableHeaderCell>
                ))}
              </TableHead>
              <TableBody className="divide-y divide-slate-100 font-medium">
                <TableRow className="hover:bg-slate-50/50">
                  <TableCell className="py-2 px-4 font-bold text-slate-700">
                    VAT Rate
                  </TableCell>
                  {quartersData.map((q: VatQuarterDetail, idx: number) => (
                    <TableCell
                      key={idx}
                      align="right"
                      className="py-2 px-4 font-mono font-bold text-slate-800"
                    >
                      {q.vatRate || "5%"}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="hover:bg-slate-50/50">
                  <TableCell className="py-2 px-4 font-bold text-slate-700">
                    Total Input VAT
                  </TableCell>
                  {quartersData.map((q: VatQuarterDetail, idx: number) => (
                    <TableCell
                      key={idx}
                      align="right"
                      className="py-2 px-4 font-mono font-semibold text-emerald-800"
                    >
                      {formatNumber(q.inputVat)}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="hover:bg-slate-50/50">
                  <TableCell className="py-2 px-4 font-bold text-slate-700">
                    Total Output VAT
                  </TableCell>
                  {quartersData.map((q: VatQuarterDetail, idx: number) => (
                    <TableCell
                      key={idx}
                      align="right"
                      className="py-2 px-4 font-mono font-semibold text-rose-800"
                    >
                      {formatNumber(q.outputVat)}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-slate-50 font-bold">
                  <TableCell className="py-2.5 px-4 text-slate-900">
                    Net VAT (Output - Input)
                  </TableCell>
                  {quartersData.map((q: VatQuarterDetail, idx: number) => (
                    <TableCell
                      key={idx}
                      align="right"
                      className={`py-2.5 px-4 font-mono font-black ${
                        q.netVat >= 0 ? "text-amber-800" : "text-emerald-800"
                      }`}
                    >
                      {formatNumber(q.netVat)}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="hover:bg-slate-50/50">
                  <TableCell className="py-2 px-4 font-bold text-slate-700">
                    VAT Position
                  </TableCell>
                  {quartersData.map((q: VatQuarterDetail, idx: number) => (
                    <TableCell
                      key={idx}
                      align="right"
                      className="py-2 px-4 font-semibold"
                    >
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                          q.position === "VAT Receivable"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {q.position}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="hover:bg-slate-50/50">
                  <TableCell className="py-2 px-4 font-bold text-slate-700">
                    Status
                  </TableCell>
                  {quartersData.map((q: VatQuarterDetail, idx: number) => (
                    <TableCell
                      key={idx}
                      align="right"
                      className="py-2 px-4 font-mono text-[11px] font-bold text-slate-600"
                    >
                      {q.status || "—"}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* TABLE 2: MONTHLY NET VAT SUMMARY */}
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                2. Monthly Net VAT Summary
              </h4>
              <span className="text-[11px] font-mono text-slate-300">
                12-Month Financial Year
              </span>
            </div>

            <Table className="w-full text-xs text-left">
              <TableHead className="bg-slate-50 border-b border-slate-200">
                <TableHeaderCell className="py-2.5 px-4 w-1/4 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  Month
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-2.5 px-4 text-right w-1/4 text-slate-500 font-bold uppercase text-[10px] tracking-wider"
                >
                  Input VAT (AED)
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-2.5 px-4 text-right w-1/4 text-slate-500 font-bold uppercase text-[10px] tracking-wider"
                >
                  Output VAT (AED)
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-2.5 px-4 text-right w-1/4 text-slate-500 font-bold uppercase text-[10px] tracking-wider"
                >
                  Net VAT (AED)
                </TableHeaderCell>
              </TableHead>
              <TableBody className="divide-y divide-slate-100">
                {monthlyNetData.map((r: VatMonthlyRow, idx: number) => (
                  <TableRow
                    key={idx}
                    className="hover:bg-slate-50/50 text-slate-700 transition"
                  >
                    <TableCell className="py-2 px-4 font-bold text-slate-900">
                      {r.month}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="py-2 px-4 font-mono font-medium text-slate-800"
                    >
                      {formatNumber(r.inputVat)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="py-2 px-4 font-mono font-medium text-slate-800"
                    >
                      {formatNumber(r.outputVat)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className={`py-2 px-4 font-mono font-bold ${
                        r.netVat >= 0 ? "text-amber-800" : "text-emerald-800"
                      }`}
                    >
                      {formatNumber(r.netVat)}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow className="bg-slate-900 text-white font-black">
                  <TableCell className="py-3 px-4 uppercase tracking-wider font-bold">
                    TOTAL
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-sm text-emerald-400"
                  >
                    {formatNumber(totalInputVat)}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-sm text-rose-400"
                  >
                    {formatNumber(totalOutputVat)}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-sm text-amber-400"
                  >
                    {formatNumber(netVat)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* TABLE 3: MONTHLY PURCHASE/EXPENSE SUMMARY */}
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                3. Monthly Purchase / Expense Summary (Input VAT Breakdown)
              </h4>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                Recoverable Input Tax
              </span>
            </div>

            <Table className="w-full text-xs text-left">
              <TableHead className="bg-slate-50 border-b border-slate-200">
                <TableHeaderCell className="py-2.5 px-4 w-1/5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  Month
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-2.5 px-4 text-right w-1/5 text-slate-500 font-bold uppercase text-[10px] tracking-wider"
                >
                  Taxable Amount (Excl. VAT)
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-2.5 px-4 text-right w-1/5 text-slate-500 font-bold uppercase text-[10px] tracking-wider"
                >
                  Non-VAT Amount
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-2.5 px-4 text-right w-1/5 text-slate-500 font-bold uppercase text-[10px] tracking-wider"
                >
                  VAT Amount (5%)
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-2.5 px-4 text-right w-1/5 text-slate-500 font-bold uppercase text-[10px] tracking-wider"
                >
                  Total Amount (AED)
                </TableHeaderCell>
              </TableHead>
              <TableBody className="divide-y divide-slate-100">
                {purchasesData.map((r: VatMonthlyBreakdownRow, idx: number) => (
                  <TableRow
                    key={idx}
                    className="hover:bg-slate-50/50 text-slate-700 transition"
                  >
                    <TableCell className="py-2 px-4 font-bold text-slate-900">
                      {r.month}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="py-2 px-4 font-mono font-medium text-slate-800"
                    >
                      {formatNumber(r.taxableAmount)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="py-2 px-4 font-mono font-medium text-slate-600"
                    >
                      {formatNumber(r.nonVatAmount)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="py-2 px-4 font-mono font-bold text-emerald-800"
                    >
                      {formatNumber(r.vatAmount)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="py-2 px-4 font-mono font-semibold text-slate-900"
                    >
                      {formatNumber(r.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow className="bg-slate-900 text-white font-black">
                  <TableCell className="py-3 px-4 uppercase tracking-wider font-bold">
                    TOTAL
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-sm text-slate-200"
                  >
                    {formatNumber(totalPurchasesTaxable)}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-bold text-slate-400"
                  >
                    {formatNumber(totalPurchasesNonVat)}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-sm text-emerald-400"
                  >
                    {formatNumber(totalPurchasesVat)}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-sm text-white"
                  >
                    {formatNumber(totalPurchasesAmount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* TABLE 4: MONTHLY INCOME SUMMARY */}
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                4. Monthly Income Summary (Output VAT Breakdown)
              </h4>
              <span className="text-[11px] font-mono text-rose-400 font-bold">
                Sales & Service Revenue
              </span>
            </div>

            <Table className="w-full text-xs text-left">
              <TableHead className="bg-slate-50 border-b border-slate-200">
                <TableHeaderCell className="py-2.5 px-4 w-1/5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  Month
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-2.5 px-4 text-right w-1/5 text-slate-500 font-bold uppercase text-[10px] tracking-wider"
                >
                  Taxable Amount (Excl. VAT)
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-2.5 px-4 text-right w-1/5 text-slate-500 font-bold uppercase text-[10px] tracking-wider"
                >
                  Non-VAT Amount
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-2.5 px-4 text-right w-1/5 text-slate-500 font-bold uppercase text-[10px] tracking-wider"
                >
                  VAT Amount (5%)
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-2.5 px-4 text-right w-1/5 text-slate-500 font-bold uppercase text-[10px] tracking-wider"
                >
                  Total Amount (AED)
                </TableHeaderCell>
              </TableHead>
              <TableBody className="divide-y divide-slate-100">
                {incomeData.map((r: VatMonthlyBreakdownRow, idx: number) => (
                  <TableRow
                    key={idx}
                    className="hover:bg-slate-50/50 text-slate-700 transition"
                  >
                    <TableCell className="py-2 px-4 font-bold text-slate-900">
                      {r.month}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="py-2 px-4 font-mono font-medium text-slate-800"
                    >
                      {formatNumber(r.taxableAmount)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="py-2 px-4 font-mono font-medium text-slate-600"
                    >
                      {formatNumber(r.nonVatAmount)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="py-2 px-4 font-mono font-bold text-rose-800"
                    >
                      {formatNumber(r.vatAmount)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="py-2 px-4 font-mono font-semibold text-slate-900"
                    >
                      {formatNumber(r.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow className="bg-slate-900 text-white font-black">
                  <TableCell className="py-3 px-4 uppercase tracking-wider font-bold">
                    TOTAL
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-sm text-slate-200"
                  >
                    {formatNumber(totalIncomeTaxable)}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-bold text-slate-400"
                  >
                    {formatNumber(totalIncomeNonVat)}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-sm text-rose-400"
                  >
                    {formatNumber(totalIncomeVat)}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-sm text-white"
                  >
                    {formatNumber(totalIncomeAmount)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* TABLE 5: UAE FTA Form 201 Box Schedule */}
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                5. Federal Tax Authority — Form 201 Box Breakdown
              </h4>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                Official Tax Box Schedule
              </span>
            </div>

            <Table className="w-full text-xs text-left">
              <TableHead className="bg-slate-50 border-b border-slate-200">
                <TableHeaderCell className="py-2.5 px-4 w-20 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  Box #
                </TableHeaderCell>
                <TableHeaderCell className="py-2.5 px-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  Description
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-2.5 px-4 text-right w-44 text-slate-500 font-bold uppercase text-[10px] tracking-wider"
                >
                  Taxable Amount (AED)
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-2.5 px-4 text-right w-44 text-slate-500 font-bold uppercase text-[10px] tracking-wider"
                >
                  VAT Amount (AED)
                </TableHeaderCell>
              </TableHead>
              <TableBody className="divide-y divide-slate-100">
                <TableRow className="hover:bg-slate-50/50">
                  <TableCell className="py-2.5 px-4 font-mono font-bold text-slate-900">
                    Box 1
                  </TableCell>
                  <TableCell className="py-2.5 px-4 font-semibold text-slate-900">
                    Standard rated supplies in Dubai / UAE (Sales & Turnover)
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-2.5 px-4 text-right font-mono font-medium text-slate-900"
                  >
                    {formatNumber(totalIncomeTaxable)}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-2.5 px-4 text-right font-mono font-bold text-rose-700"
                  >
                    {formatNumber(totalOutputVat)}
                  </TableCell>
                </TableRow>

                <TableRow className="hover:bg-slate-50/50">
                  <TableCell className="py-2.5 px-4 font-mono font-bold text-slate-900">
                    Box 9
                  </TableCell>
                  <TableCell className="py-2.5 px-4 font-semibold text-slate-900">
                    Standard rated expenses & materials (Recoverable Input Tax)
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-2.5 px-4 text-right font-mono font-medium text-slate-900"
                  >
                    {formatNumber(totalPurchasesTaxable)}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700"
                  >
                    {formatNumber(totalInputVat)}
                  </TableCell>
                </TableRow>

                <TableRow className="bg-slate-50/80 font-bold text-slate-900">
                  <TableCell className="py-2.5 px-4 font-mono font-bold text-slate-900">
                    Box 11
                  </TableCell>
                  <TableCell className="py-2.5 px-4 font-bold text-slate-900">
                    Total value of due tax for the period (Output Tax)
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-2.5 px-4 text-right font-mono font-bold text-slate-500"
                  >
                    —
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-2.5 px-4 text-right font-mono font-black text-rose-800"
                  >
                    {formatNumber(totalOutputVat)}
                  </TableCell>
                </TableRow>

                <TableRow className="bg-slate-50/80 font-bold text-slate-900">
                  <TableCell className="py-2.5 px-4 font-mono font-bold text-slate-900">
                    Box 12
                  </TableCell>
                  <TableCell className="py-2.5 px-4 font-bold text-slate-900">
                    Total value of recoverable tax for the period (Input Tax)
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-2.5 px-4 text-right font-mono font-bold text-slate-500"
                  >
                    —
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-2.5 px-4 text-right font-mono font-black text-emerald-800"
                  >
                    {formatNumber(totalInputVat)}
                  </TableCell>
                </TableRow>

                <TableRow className="bg-slate-900 text-white font-black">
                  <TableCell className="py-3 px-4 font-mono font-black text-amber-400">
                    Box 13
                  </TableCell>
                  <TableCell className="py-3 px-4 text-xs uppercase tracking-wider font-bold">
                    PAYABLE TAX FOR THE PERIOD (NET TAX LIABILITY)
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-bold text-slate-400"
                  >
                    —
                  </TableCell>
                  <TableCell
                    align="right"
                    className={`py-3 px-4 text-right font-mono font-black text-sm ${
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
  );
};
