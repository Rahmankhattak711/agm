"use client";

import React, { useState } from "react";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Clock,
  Eye,
  FileSpreadsheet,
  Layers,
  Percent,
  Printer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
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
  ProfitLossItem,
  useProfitLoss,
} from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { formatCurrency, formatNumber } from "./types";

export type PeriodType =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom"
  | "all";

interface ProfitLossReportProps {
  onDrillDownAccount?: (accountId: string) => void;
}

export const ProfitLossReport: React.FC<ProfitLossReportProps> = ({
  onDrillDownAccount,
}) => {
  const [period, setPeriod] = useState<PeriodType>("monthly");
  const [compare, setCompare] = useState<boolean>(true);
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  const { data: profitLoss, isLoading } = useProfitLoss({
    period,
    startDate: customStart || undefined,
    endDate: customEnd || undefined,
    compare,
  });

  const incomeRows: ProfitLossItem[] = profitLoss?.income || [];
  const directExpenseRows: ProfitLossItem[] = profitLoss?.directExpenses || [];
  const operatingExpenseRows: ProfitLossItem[] =
    profitLoss?.operatingExpenses || [];

  const totalIncome = profitLoss?.totalIncome ?? 0;
  const prevTotalIncome = profitLoss?.prevTotalIncome ?? 0;
  const incomeGrowth =
    prevTotalIncome !== 0
      ? ((totalIncome - prevTotalIncome) / Math.abs(prevTotalIncome)) * 100
      : 0;

  const totalDirectExpenses = profitLoss?.totalDirectExpenses ?? 0;
  const prevTotalDirectExpenses = profitLoss?.prevTotalDirectExpenses ?? 0;

  const grossProfit =
    profitLoss?.grossProfit ?? totalIncome - totalDirectExpenses;
  const prevGrossProfit =
    profitLoss?.prevGrossProfit ?? prevTotalIncome - prevTotalDirectExpenses;
  const grossMargin = totalIncome > 0 ? (grossProfit / totalIncome) * 100 : 0;
  const grossProfitGrowth =
    prevGrossProfit !== 0
      ? ((grossProfit - prevGrossProfit) / Math.abs(prevGrossProfit)) * 100
      : 0;

  const totalOperatingExpenses = profitLoss?.totalOperatingExpenses ?? 0;
  const prevTotalOperatingExpenses =
    profitLoss?.prevTotalOperatingExpenses ?? 0;

  const netProfit =
    profitLoss?.netProfit ?? grossProfit - totalOperatingExpenses;
  const prevNetProfit =
    profitLoss?.prevNetProfit ?? prevGrossProfit - prevTotalOperatingExpenses;
  const netMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
  const netProfitGrowth =
    prevNetProfit !== 0
      ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100
      : 0;


  const periodButtons: {
    id: PeriodType;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: "daily", label: "Daily Report", icon: <Clock size={14} /> },
    { id: "weekly", label: "Weekly Report", icon: <CalendarDays size={14} /> },
    { id: "monthly", label: "Monthly Report", icon: <Calendar size={14} /> },
    { id: "yearly", label: "Yearly Report", icon: <CalendarRange size={14} /> },
    { id: "all", label: "All Time", icon: <Layers size={14} /> },
  ];

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
                      Statement of Profit &amp; Loss (Income Statement)
                    </h1>
                    <p className="text-xs text-slate-500">
                      AGM FITOUT TECHNICAL SERVICES LLC — {profitLoss?.periodLabel || "Financial Reporting Period"}
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
              <div className="h-[80px] w-full hidden print:block" />
            </td>
          </tr>
        </tfoot>

        <tbody className="print-page-body-group">
          <tr>
            <td className="p-0 border-none align-top">
              <div className="space-y-6">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-black text-lg text-slate-900 tracking-tight">
              Statement of Profit &amp; Loss (Income Statement)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            AGM FITOUT TECHNICAL SERVICES LLC —{" "}
            {profitLoss?.periodLabel || "Financial Reporting Period"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Comparison Toggle */}
          <button
            type="button"
            onClick={() => setCompare(!compare)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              compare
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Percent
              size={13}
              className={compare ? "text-emerald-700" : "text-slate-400"}
            />
            Compare Previous Period
          </button>

          {/* Print / Save PDF */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50"
            icon={<Printer size={14} />}
          >
            Print / PDF
          </Button>
        </div>
      </div>

      {/* Period Selector Tabs & Date Range Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2 bg-slate-50/80 rounded-2xl border border-slate-200/70 print:hidden">
        <div className="flex flex-wrap items-center gap-1.5">
          {periodButtons.map((btn) => {
            const isActive = period === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setPeriod(btn.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200 text-emerald-800"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <span className={isActive ? "text-agm-green" : "text-slate-400"}>
                  {btn.icon}
                </span>
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Custom Range Picker */}
        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500"
            value={customStart}
            onChange={(e) => {
              setCustomStart(e.target.value);
              setPeriod("custom");
            }}
          />
          <span className="text-slate-400 font-bold">to</span>
          <input
            type="date"
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500"
            value={customEnd}
            onChange={(e) => {
              setCustomEnd(e.target.value);
              setPeriod("custom");
            }}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400 animate-pulse space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
          <p>
            Calculating Statement of Profit &amp; Loss for{" "}
            <span className="font-semibold text-slate-700">
              {period === "daily"
                ? "Daily Statement"
                : period === "weekly"
                ? "Weekly Statement"
                : period === "monthly"
                ? "Monthly Statement"
                : period === "yearly"
                ? "Fiscal Year Statement"
                : period === "custom"
                ? "Custom Period"
                : "All-Time Statement"}
            </span>
            ...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Income */}
            <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    1. Total Income
                  </p>
                  {compare && prevTotalIncome > 0 && (
                    <span
                      className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        incomeGrowth >= 0
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {incomeGrowth >= 0 ? (
                        <TrendingUp size={11} />
                      ) : (
                        <TrendingDown size={11} />
                      )}
                      {Math.abs(incomeGrowth).toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Contract revenue &amp; billings
                </p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900 font-mono">
                  {formatCurrency(totalIncome)}
                </p>
                {compare && prevTotalIncome > 0 && (
                  <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
                    Prior: {formatCurrency(prevTotalIncome)}
                  </p>
                )}
              </div>
            </div>

            {/* 2. Gross Profit */}
            <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    2. Gross Profit
                  </p>
                  <span className="text-[10.5px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                    Margin: {grossMargin.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  After Direct Materials (COGS)
                </p>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-800 font-mono">
                  {formatCurrency(grossProfit)}
                </p>
                {compare && prevGrossProfit > 0 && (
                  <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
                    Prior: {formatCurrency(prevGrossProfit)}
                  </p>
                )}
              </div>
            </div>

            {/* 3. Operating Overhead */}
            <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  3. Operating Overhead
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Salaries, rent, admin &amp; utilities
                </p>
              </div>
              <div>
                <p className="text-2xl font-black text-amber-700 font-mono">
                  {formatCurrency(totalOperatingExpenses)}
                </p>
                {compare && prevTotalOperatingExpenses > 0 && (
                  <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
                    Prior: {formatCurrency(prevTotalOperatingExpenses)}
                  </p>
                )}
              </div>
            </div>

            {/* 4. Net Profit */}
            <div className="p-4.5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xs flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    4. Net Profit / (Loss)
                  </p>
                  <span className="text-[10px] font-bold text-slate-400">
                    Margin: {netMargin.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gross Profit - Operating Expenses
                </p>
              </div>
              <div>
                <p
                  className={`text-2xl font-black font-mono ${
                    netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {formatCurrency(netProfit)}
                </p>
                {compare && (
                  <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
                    Prior: {formatCurrency(prevNetProfit)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Statement Table */}
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <Table className="w-full text-xs text-left">
              <TableHead className="bg-slate-50/95 border-b border-slate-200">
                <TableHeaderCell className="py-3 px-5 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  Account Name
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-3 text-slate-600 font-bold uppercase text-[11px] tracking-wider w-28">
                  Code
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-3 px-4 text-right font-bold uppercase text-[11px] tracking-wider text-slate-700"
                >
                  Current Period (AED)
                </TableHeaderCell>
                {compare && (
                  <>
                    <TableHeaderCell
                      align="right"
                      className="py-3 px-4 text-right font-bold uppercase text-[11px] tracking-wider text-slate-500"
                    >
                      Prior Period (AED)
                    </TableHeaderCell>
                    <TableHeaderCell
                      align="right"
                      className="py-3 px-4 text-right font-bold uppercase text-[11px] tracking-wider text-slate-500"
                    >
                      Variance (AED)
                    </TableHeaderCell>
                    <TableHeaderCell
                      align="right"
                      className="py-3 px-4 text-right font-bold uppercase text-[11px] tracking-wider text-slate-500 w-24"
                    >
                      Change %
                    </TableHeaderCell>
                  </>
                )}
                {onDrillDownAccount && (
                  <TableHeaderCell className="py-3 px-3 text-center w-12 print:hidden">
                    Ledger
                  </TableHeaderCell>
                )}
              </TableHead>

              <TableBody className="divide-y divide-slate-100">
                {/* 1. INCOME SECTION */}
                <TableRow className="bg-emerald-50/50 font-bold text-emerald-950">
                  <TableCell
                    colSpan={compare ? 6 : onDrillDownAccount ? 4 : 3}
                    className="py-2.5 px-5 text-[11px] uppercase tracking-wider flex items-center justify-between"
                  >
                    <span>1. INCOME & REVENUE</span>
                    <span className="text-[10px] text-emerald-800 font-normal">
                      {incomeRows.length} accounts
                    </span>
                  </TableCell>
                </TableRow>

                {incomeRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={compare ? 6 : onDrillDownAccount ? 4 : 3}
                      className="py-3 px-5 text-center text-slate-400 italic"
                    >
                      No revenue transactions recorded for this period
                    </TableCell>
                  </TableRow>
                ) : (
                  incomeRows.map((item: ProfitLossItem, idx: number) => (
                    <TableRow
                      key={`inc-${idx}`}
                      className="hover:bg-slate-50/60 text-slate-700 transition"
                    >
                      <TableCell className="py-2.5 px-5 font-semibold text-slate-900">
                        {item.accountName}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                        {item.accountCode || "—"}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-2.5 px-4 text-right font-mono font-bold text-slate-900"
                      >
                        {formatNumber(item.amount)}
                      </TableCell>
                      {compare && (
                        <>
                          <TableCell
                            align="right"
                            className="py-2.5 px-4 text-right font-mono text-slate-500"
                          >
                            {formatNumber(item.prevAmount)}
                          </TableCell>
                          <TableCell
                            align="right"
                            className={`py-2.5 px-4 text-right font-mono font-semibold ${
                              (item.variance || 0) >= 0
                                ? "text-emerald-700"
                                : "text-rose-700"
                            }`}
                          >
                            {(item.variance || 0) > 0 ? "+" : ""}
                            {formatNumber(item.variance)}
                          </TableCell>
                          <TableCell
                            align="right"
                            className={`py-2.5 px-4 text-right font-mono font-bold ${
                              (item.variancePct || 0) >= 0
                                ? "text-emerald-700"
                                : "text-rose-700"
                            }`}
                          >
                            {(item.variancePct || 0) > 0 ? "+" : ""}
                            {(item.variancePct || 0).toFixed(1)}%
                          </TableCell>
                        </>
                      )}
                      {onDrillDownAccount && item.id && (
                        <TableCell className="py-2 px-2 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => onDrillDownAccount(item.id!)}
                            className="p-1 text-slate-400 hover:text-emerald-700 rounded-md hover:bg-emerald-50 transition-colors"
                            title="Drill down to General Ledger"
                          >
                            <Eye size={13} />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}

                {/* Total Income Row */}
                <TableRow className="bg-emerald-100/60 font-bold text-emerald-950 border-t border-b border-emerald-200">
                  <TableCell
                    colSpan={2}
                    className="py-3 px-5 text-emerald-950 font-bold text-xs uppercase"
                  >
                    Total Income
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-emerald-950 text-sm"
                  >
                    {formatNumber(totalIncome)}
                  </TableCell>
                  {compare && (
                    <>
                      <TableCell
                        align="right"
                        className="py-3 px-4 text-right font-mono font-bold text-slate-700"
                      >
                        {formatNumber(prevTotalIncome)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className={`py-3 px-4 text-right font-mono font-bold ${
                          totalIncome >= prevTotalIncome
                            ? "text-emerald-800"
                            : "text-rose-800"
                        }`}
                      >
                        {totalIncome - prevTotalIncome > 0 ? "+" : ""}
                        {formatNumber(totalIncome - prevTotalIncome)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className={`py-3 px-4 text-right font-mono font-black ${
                          incomeGrowth >= 0
                            ? "text-emerald-800"
                            : "text-rose-800"
                        }`}
                      >
                        {incomeGrowth > 0 ? "+" : ""}
                        {incomeGrowth.toFixed(1)}%
                      </TableCell>
                    </>
                  )}
                  {onDrillDownAccount && (
                    <td className="print:hidden border-none" />
                  )}
                </TableRow>

                {/* 2. DIRECT EXPENSES / COGS SECTION */}
                <TableRow className="bg-blue-50/50 font-bold text-blue-950">
                  <TableCell
                    colSpan={compare ? 6 : onDrillDownAccount ? 4 : 3}
                    className="py-2.5 px-5 text-[11px] uppercase tracking-wider flex items-center justify-between"
                  >
                    <span>2. DIRECT MATERIAL EXPENSES & COGS</span>
                    <span className="text-[10px] text-blue-800 font-normal">
                      {directExpenseRows.length} accounts
                    </span>
                  </TableCell>
                </TableRow>

                {directExpenseRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={compare ? 6 : onDrillDownAccount ? 4 : 3}
                      className="py-3 px-5 text-center text-slate-400 italic"
                    >
                      No direct project material expenses recorded for this period
                    </TableCell>
                  </TableRow>
                ) : (
                  directExpenseRows.map((item: ProfitLossItem, idx: number) => (
                    <TableRow
                      key={`dir-${idx}`}
                      className="hover:bg-slate-50/60 text-slate-700 transition"
                    >
                      <TableCell className="py-2.5 px-5 font-semibold text-slate-900">
                        {item.accountName}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                        {item.accountCode || "—"}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-2.5 px-4 text-right font-mono font-bold text-slate-900"
                      >
                        {formatNumber(item.amount)}
                      </TableCell>
                      {compare && (
                        <>
                          <TableCell
                            align="right"
                            className="py-2.5 px-4 text-right font-mono text-slate-500"
                          >
                            {formatNumber(item.prevAmount)}
                          </TableCell>
                          <TableCell
                            align="right"
                            className="py-2.5 px-4 text-right font-mono font-semibold text-slate-700"
                          >
                            {(item.variance || 0) > 0 ? "+" : ""}
                            {formatNumber(item.variance)}
                          </TableCell>
                          <TableCell
                            align="right"
                            className="py-2.5 px-4 text-right font-mono font-bold text-slate-700"
                          >
                            {(item.variancePct || 0) > 0 ? "+" : ""}
                            {(item.variancePct || 0).toFixed(1)}%
                          </TableCell>
                        </>
                      )}
                      {onDrillDownAccount && item.id && (
                        <TableCell className="py-2 px-2 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => onDrillDownAccount(item.id!)}
                            className="p-1 text-slate-400 hover:text-blue-700 rounded-md hover:bg-blue-50 transition-colors"
                            title="Drill down to General Ledger"
                          >
                            <Eye size={13} />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}

                {/* Gross Profit Row */}
                <TableRow className="bg-blue-100/70 font-bold text-blue-950 border-t border-b border-blue-200">
                  <TableCell
                    colSpan={2}
                    className="py-3 px-5 text-blue-950 font-bold text-xs uppercase"
                  >
                    GROSS PROFIT (Income - Direct COGS)
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-blue-950 text-sm"
                  >
                    {formatNumber(grossProfit)}
                  </TableCell>
                  {compare && (
                    <>
                      <TableCell
                        align="right"
                        className="py-3 px-4 text-right font-mono font-bold text-slate-700"
                      >
                        {formatNumber(prevGrossProfit)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className={`py-3 px-4 text-right font-mono font-bold ${
                          grossProfit >= prevGrossProfit
                            ? "text-emerald-800"
                            : "text-rose-800"
                        }`}
                      >
                        {grossProfit - prevGrossProfit > 0 ? "+" : ""}
                        {formatNumber(grossProfit - prevGrossProfit)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className={`py-3 px-4 text-right font-mono font-black ${
                          grossProfitGrowth >= 0
                            ? "text-emerald-800"
                            : "text-rose-800"
                        }`}
                      >
                        {grossProfitGrowth > 0 ? "+" : ""}
                        {grossProfitGrowth.toFixed(1)}%
                      </TableCell>
                    </>
                  )}
                  {onDrillDownAccount && (
                    <td className="print:hidden border-none" />
                  )}
                </TableRow>

                {/* 3. OPERATING OVERHEAD SECTION */}
                <TableRow className="bg-rose-50/40 font-bold text-rose-950">
                  <TableCell
                    colSpan={compare ? 6 : onDrillDownAccount ? 4 : 3}
                    className="py-2.5 px-5 text-[11px] uppercase tracking-wider flex items-center justify-between"
                  >
                    <span>3. OPERATING EXPENSES (OVERHEAD)</span>
                    <span className="text-[10px] text-rose-800 font-normal">
                      {operatingExpenseRows.length} accounts
                    </span>
                  </TableCell>
                </TableRow>

                {operatingExpenseRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={compare ? 6 : onDrillDownAccount ? 4 : 3}
                      className="py-3 px-5 text-center text-slate-400 italic"
                    >
                      No operational overhead expenses recorded for this period
                    </TableCell>
                  </TableRow>
                ) : (
                  operatingExpenseRows.map(
                    (item: ProfitLossItem, idx: number) => (
                      <TableRow
                        key={`op-${idx}`}
                        className="hover:bg-slate-50/60 text-slate-700 transition"
                      >
                        <TableCell className="py-2.5 px-5 font-semibold text-slate-900">
                          {item.accountName}
                        </TableCell>
                        <TableCell className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                          {item.accountCode || "—"}
                        </TableCell>
                        <TableCell
                          align="right"
                          className="py-2.5 px-4 text-right font-mono font-bold text-slate-900"
                        >
                          {formatNumber(item.amount)}
                        </TableCell>
                        {compare && (
                          <>
                            <TableCell
                              align="right"
                              className="py-2.5 px-4 text-right font-mono text-slate-500"
                            >
                              {formatNumber(item.prevAmount)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-2.5 px-4 text-right font-mono font-semibold text-slate-700"
                            >
                              {(item.variance || 0) > 0 ? "+" : ""}
                              {formatNumber(item.variance)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-2.5 px-4 text-right font-mono font-bold text-slate-700"
                            >
                              {(item.variancePct || 0) > 0 ? "+" : ""}
                              {(item.variancePct || 0).toFixed(1)}%
                            </TableCell>
                          </>
                        )}
                        {onDrillDownAccount && item.id && (
                          <TableCell className="py-2 px-2 text-center print:hidden">
                            <button
                              type="button"
                              onClick={() => onDrillDownAccount(item.id!)}
                              className="p-1 text-slate-400 hover:text-rose-700 rounded-md hover:bg-rose-50 transition-colors"
                              title="Drill down to General Ledger"
                            >
                              <Eye size={13} />
                            </button>
                          </TableCell>
                        )}
                      </TableRow>
                    ),
                  )
                )}

                {/* Total Operating Expenses Row */}
                <TableRow className="bg-rose-100/60 font-bold text-rose-950 border-t border-b border-rose-200">
                  <TableCell
                    colSpan={2}
                    className="py-3 px-5 text-rose-950 font-bold text-xs uppercase"
                  >
                    Total Operating Overhead
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-rose-950 text-sm"
                  >
                    {formatNumber(totalOperatingExpenses)}
                  </TableCell>
                  {compare && (
                    <>
                      <TableCell
                        align="right"
                        className="py-3 px-4 text-right font-mono font-bold text-slate-700"
                      >
                        {formatNumber(prevTotalOperatingExpenses)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-3 px-4 text-right font-mono font-bold text-slate-700"
                      >
                        {totalOperatingExpenses - prevTotalOperatingExpenses > 0
                          ? "+"
                          : ""}
                        {formatNumber(
                          totalOperatingExpenses - prevTotalOperatingExpenses,
                        )}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-3 px-4 text-right font-mono font-bold text-slate-700"
                      >
                        —
                      </TableCell>
                    </>
                  )}
                  {onDrillDownAccount && (
                    <td className="print:hidden border-none" />
                  )}
                </TableRow>

                {/* NET PROFIT / (LOSS) ROW */}
                <TableRow className="bg-slate-900 text-white font-black">
                  <TableCell
                    colSpan={2}
                    className="py-4 px-5 text-xs uppercase tracking-wider font-bold"
                  >
                    NET PROFIT / (LOSS) FOR PERIOD
                  </TableCell>
                  <TableCell
                    align="right"
                    className={`py-4 px-4 text-right font-mono font-black text-base ${
                      netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatCurrency(netProfit)}
                  </TableCell>
                  {compare && (
                    <>
                      <TableCell
                        align="right"
                        className="py-4 px-4 text-right font-mono font-bold text-slate-300"
                      >
                        {formatCurrency(prevNetProfit)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className={`py-4 px-4 text-right font-mono font-bold ${
                          netProfit >= prevNetProfit
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {netProfit - prevNetProfit > 0 ? "+" : ""}
                        {formatCurrency(netProfit - prevNetProfit)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className={`py-4 px-4 text-right font-mono font-black ${
                          netProfitGrowth >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {netProfitGrowth > 0 ? "+" : ""}
                        {netProfitGrowth.toFixed(1)}%
                      </TableCell>
                    </>
                  )}
                  {onDrillDownAccount && (
                    <td className="print:hidden border-none bg-slate-900" />
                  )}
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

      {/* Pinned print footer rendered across all printed sheets */}
      <div className="hidden print:block">
        <QuotationFooter />
      </div>
    </div>
  );
};

export default ProfitLossReport;
