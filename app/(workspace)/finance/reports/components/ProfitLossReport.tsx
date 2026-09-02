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
  DollarSign,
  Briefcase,
  PieChart,
  Scale,
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
import { ProfitLossItem, useProfitLoss } from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { formatCurrency, formatNumber } from "./types";

export type PeriodType =
  "daily" | "weekly" | "monthly" | "yearly" | "custom" | "all";

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
    { id: "daily", label: "Daily", icon: <Clock size={13} /> },
    { id: "weekly", label: "Weekly", icon: <CalendarDays size={13} /> },
    { id: "monthly", label: "Monthly", icon: <Calendar size={13} /> },
    { id: "yearly", label: "Yearly", icon: <CalendarRange size={13} /> },
    { id: "all", label: "All Time", icon: <Layers size={13} /> },
  ];

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6 print:p-0 print:m-0 print:border-none">
      <table className="print-page-table w-full border-collapse">
        <thead className="print-page-header-group">
          <tr>
            <th className="p-0 font-normal text-left border-none">
              <div className="hidden print:block">
                <QuotationHeader />
              </div>
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
              <div className="space-y-6 print:space-y-4 print:px-8 print:py-3">
                <div className="hidden print:flex justify-between items-center border-b-2 border-emerald-800 pb-2 print-avoid-break">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase block">
                      Financial Performance Statement
                    </span>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      PROFIT &amp; LOSS STATEMENT
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-700 font-mono font-bold text-xs">
                      {profitLoss?.periodLabel || "Financial Reporting Period"}
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      Printed: {new Date().toLocaleDateString("en-GB")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5 print:hidden">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-black text-xs shadow-xs">
                        P&amp;L
                      </span>
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
                    <button
                      type="button"
                      onClick={() => setCompare(!compare)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        compare
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Percent
                        size={13}
                        className={
                          compare ? "text-emerald-700" : "text-slate-400"
                        }
                      />
                      Compare Previous Period
                    </button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.print()}
                      className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
                      icon={<Printer size={14} />}
                    >
                      Print Statement
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs print:hidden">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {periodButtons.map((btn) => {
                      const isActive = period === btn.id;
                      return (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => setPeriod(btn.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 text-emerald-800"
                              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                          }`}
                        >
                          <span
                            className={
                              isActive ? "text-emerald-700" : "text-slate-400"
                            }
                          >
                            {btn.icon}
                          </span>
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <input
                      type="date"
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
                      value={customStart}
                      onChange={(e) => {
                        setCustomStart(e.target.value);
                        setPeriod("custom");
                      }}
                    />
                    <span className="text-slate-400 font-bold">to</span>
                    <input
                      type="date"
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
                      value={customEnd}
                      onChange={(e) => {
                        setCustomEnd(e.target.value);
                        setPeriod("custom");
                      }}
                    />
                  </div>
                </div>

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-4 print:gap-2.5 print-avoid-break">
                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              1. Total Income
                            </span>
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
                          <p className="text-xs print:text-[11px] text-slate-500 mt-0.5 truncate">
                            Contract revenue &amp; billings
                          </p>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                            AED
                          </span>
                          <span className="text-xl print:text-base font-black text-slate-900 font-mono">
                            {formatNumber(totalIncome)}
                          </span>
                          {compare && prevTotalIncome > 0 && (
                            <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium print:hidden">
                              Prior: {formatCurrency(prevTotalIncome)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-rose-500" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              2. Direct Costs (COGS)
                            </span>
                            <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200/60">
                              {totalIncome > 0
                                ? (
                                    (totalDirectExpenses / totalIncome) *
                                    100
                                  ).toFixed(1)
                                : "0.0"}
                              %
                            </span>
                          </div>
                          <p className="text-xs print:text-[11px] text-slate-500 mt-0.5 truncate">
                            Project materials &amp; labor
                          </p>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                            AED
                          </span>
                          <span className="text-xl print:text-base font-black text-rose-800 font-mono">
                            {formatNumber(totalDirectExpenses)}
                          </span>
                          {compare && prevTotalDirectExpenses > 0 && (
                            <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium print:hidden">
                              Prior: {formatCurrency(prevTotalDirectExpenses)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-600" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              3. Gross Profit
                            </span>
                            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                              {grossMargin.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs print:text-[11px] text-slate-500 mt-0.5 truncate">
                            Revenue after Direct COGS
                          </p>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                            AED
                          </span>
                          <span className="text-xl print:text-base font-black text-emerald-800 font-mono">
                            {formatNumber(grossProfit)}
                          </span>
                          {compare && prevGrossProfit > 0 && (
                            <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium print:hidden">
                              Prior: {formatCurrency(prevGrossProfit)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-indigo-500" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              4. Net Profit
                            </span>
                            <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-200/60">
                              {netMargin.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs print:text-[11px] text-slate-500 mt-0.5 truncate">
                            Bottom line yield
                          </p>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                            AED
                          </span>
                          <span
                            className={`text-xl print:text-base font-black font-mono ${
                              netProfit >= 0
                                ? "text-slate-900"
                                : "text-rose-700"
                            }`}
                          >
                            {formatNumber(netProfit)}
                          </span>
                          {compare && (
                            <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium print:hidden">
                              Prior: {formatCurrency(prevNetProfit)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs print-avoid-break">
                      <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
                        <h4 className="font-black text-xs uppercase tracking-wider text-white">
                          Comprehensive Income Statement Ledger
                        </h4>
                        <span className="text-[11px] font-mono text-emerald-300 font-bold">
                          IFRS Accrual Basis
                        </span>
                      </div>

                      <Table className="w-full text-xs text-left">
                        <TableHead className="bg-slate-50/95 border-b border-slate-200">
                          <TableHeaderCell className="py-3 px-5 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Account Name
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-3 text-slate-600 font-bold uppercase text-[10px] tracking-wider w-28">
                            Code
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-4 text-right font-bold uppercase text-[10px] tracking-wider text-slate-700"
                          >
                            Current Period (AED)
                          </TableHeaderCell>
                          {compare && (
                            <>
                              <TableHeaderCell
                                align="right"
                                className="py-3 px-4 text-right font-bold uppercase text-[10px] tracking-wider text-slate-500"
                              >
                                Prior Period (AED)
                              </TableHeaderCell>
                              <TableHeaderCell
                                align="right"
                                className="py-3 px-4 text-right font-bold uppercase text-[10px] tracking-wider text-slate-500"
                              >
                                Variance (AED)
                              </TableHeaderCell>
                              <TableHeaderCell
                                align="right"
                                className="py-3 px-4 text-right font-bold uppercase text-[10px] tracking-wider text-slate-500 w-24"
                              >
                                Change %
                              </TableHeaderCell>
                            </>
                          )}
                          {onDrillDownAccount && (
                            <TableHeaderCell className="py-3 px-3 text-center w-12 print:hidden">
                              GL
                            </TableHeaderCell>
                          )}
                        </TableHead>

                        <TableBody className="divide-y divide-slate-100">
                          <TableRow className="bg-emerald-50/70 font-bold text-emerald-950">
                            <TableCell
                              colSpan={
                                compare
                                  ? onDrillDownAccount
                                    ? 7
                                    : 6
                                  : onDrillDownAccount
                                    ? 4
                                    : 3
                              }
                              className="py-2.5 px-5 text-[11px] uppercase tracking-wider flex items-center justify-between"
                            >
                              <span>1. INCOME &amp; OPERATING REVENUE</span>
                              <span className="text-[10px] text-emerald-800 font-normal">
                                {incomeRows.length} accounts
                              </span>
                            </TableCell>
                          </TableRow>

                          {incomeRows.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={
                                  compare
                                    ? onDrillDownAccount
                                      ? 7
                                      : 6
                                    : onDrillDownAccount
                                      ? 4
                                      : 3
                                }
                                className="py-3 px-5 text-center text-slate-400 italic"
                              >
                                No revenue transactions recorded for this period
                              </TableCell>
                            </TableRow>
                          ) : (
                            incomeRows.map(
                              (item: ProfitLossItem, idx: number) => (
                                <TableRow
                                  key={`inc-${idx}`}
                                  className="hover:bg-slate-50/60 text-slate-700 transition-colors"
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
                                        onClick={() =>
                                          onDrillDownAccount(item.id!)
                                        }
                                        className="p-1 text-slate-400 hover:text-emerald-700 rounded-md hover:bg-emerald-50 transition-colors cursor-pointer"
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

                          <TableRow className="bg-emerald-100/70 font-bold text-emerald-950 border-t border-b border-emerald-200">
                            <TableCell
                              colSpan={2}
                              className="py-3 px-5 text-emerald-950 font-bold text-xs uppercase"
                            >
                              Total Operating Income
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

                          <TableRow className="bg-blue-50/70 font-bold text-blue-950">
                            <TableCell
                              colSpan={
                                compare
                                  ? onDrillDownAccount
                                    ? 7
                                    : 6
                                  : onDrillDownAccount
                                    ? 4
                                    : 3
                              }
                              className="py-2.5 px-5 text-[11px] uppercase tracking-wider flex items-center justify-between"
                            >
                              <span>
                                2. DIRECT MATERIAL EXPENSES &amp; COGS
                              </span>
                              <span className="text-[10px] text-blue-800 font-normal">
                                {directExpenseRows.length} accounts
                              </span>
                            </TableCell>
                          </TableRow>

                          {directExpenseRows.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={
                                  compare
                                    ? onDrillDownAccount
                                      ? 7
                                      : 6
                                    : onDrillDownAccount
                                      ? 4
                                      : 3
                                }
                                className="py-3 px-5 text-center text-slate-400 italic"
                              >
                                No direct project material expenses recorded for
                                this period
                              </TableCell>
                            </TableRow>
                          ) : (
                            directExpenseRows.map(
                              (item: ProfitLossItem, idx: number) => (
                                <TableRow
                                  key={`dir-${idx}`}
                                  className="hover:bg-slate-50/60 text-slate-700 transition-colors"
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
                                        onClick={() =>
                                          onDrillDownAccount(item.id!)
                                        }
                                        className="p-1 text-slate-400 hover:text-blue-700 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
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

                          <TableRow className="bg-rose-50/70 font-bold text-rose-950">
                            <TableCell
                              colSpan={
                                compare
                                  ? onDrillDownAccount
                                    ? 7
                                    : 6
                                  : onDrillDownAccount
                                    ? 4
                                    : 3
                              }
                              className="py-2.5 px-5 text-[11px] uppercase tracking-wider flex items-center justify-between"
                            >
                              <span>
                                3. OPERATING EXPENSES (OVERHEAD &amp; ADMIN)
                              </span>
                              <span className="text-[10px] text-rose-800 font-normal">
                                {operatingExpenseRows.length} accounts
                              </span>
                            </TableCell>
                          </TableRow>

                          {operatingExpenseRows.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={
                                  compare
                                    ? onDrillDownAccount
                                      ? 7
                                      : 6
                                    : onDrillDownAccount
                                      ? 4
                                      : 3
                                }
                                className="py-3 px-5 text-center text-slate-400 italic"
                              >
                                No operational overhead expenses recorded for
                                this period
                              </TableCell>
                            </TableRow>
                          ) : (
                            operatingExpenseRows.map(
                              (item: ProfitLossItem, idx: number) => (
                                <TableRow
                                  key={`op-${idx}`}
                                  className="hover:bg-slate-50/60 text-slate-700 transition-colors"
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
                                        onClick={() =>
                                          onDrillDownAccount(item.id!)
                                        }
                                        className="p-1 text-slate-400 hover:text-rose-700 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
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

                          <TableRow className="bg-rose-100/70 font-bold text-rose-950 border-t border-b border-rose-200">
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
                                  {totalOperatingExpenses -
                                    prevTotalOperatingExpenses >
                                  0
                                    ? "+"
                                    : ""}
                                  {formatNumber(
                                    totalOperatingExpenses -
                                      prevTotalOperatingExpenses,
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
                                netProfit >= 0
                                  ? "text-emerald-400"
                                  : "text-rose-400"
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

      <div className="fixed-print-footer hidden print:block">
        <QuotationFooter />
      </div>
    </div>
  );
};

export default ProfitLossReport;
