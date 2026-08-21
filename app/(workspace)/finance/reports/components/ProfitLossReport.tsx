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
import { ProfitLossReport as ProfitLossData, ProfitLossItem } from "@/lib/hooks/api-hooks";
import { formatCurrency, formatNumber } from "./types";

interface ProfitLossReportProps {
  profitLoss?: ProfitLossData;
  isLoading: boolean;
}

export const ProfitLossReport: React.FC<ProfitLossReportProps> = ({
  profitLoss,
  isLoading,
}) => {
  const incomeRows: ProfitLossItem[] =
    profitLoss?.income && profitLoss.income.length > 0 ? profitLoss.income : [];
  const directExpenseRows: ProfitLossItem[] =
    profitLoss?.directExpenses && profitLoss.directExpenses.length > 0 ? profitLoss.directExpenses : [];
  const operatingExpenseRows: ProfitLossItem[] =
    profitLoss?.operatingExpenses && profitLoss.operatingExpenses.length > 0 ? profitLoss.operatingExpenses : [];

  const totalIncome =
    profitLoss?.totalIncome !== undefined
      ? profitLoss.totalIncome
      : incomeRows.reduce((s: number, i: ProfitLossItem) => s + Number(i.amount || 0), 0);

  const totalDirectExpenses =
    profitLoss?.totalDirectExpenses !== undefined
      ? profitLoss.totalDirectExpenses
      : directExpenseRows.reduce((s: number, i: ProfitLossItem) => s + Number(i.amount || 0), 0);

  const grossProfit =
    profitLoss?.grossProfit !== undefined
      ? profitLoss.grossProfit
      : totalIncome - totalDirectExpenses;

  const totalExpenses =
    profitLoss?.totalExpenses !== undefined
      ? profitLoss.totalExpenses
      : operatingExpenseRows.reduce((s: number, i: ProfitLossItem) => s + Number(i.amount || 0), 0);

  const netProfit =
    profitLoss?.netProfit !== undefined
      ? profitLoss.netProfit
      : grossProfit - totalExpenses;

  const netMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-base text-slate-900">
            Statement of Profit & Loss (Income Statement)
          </h3>
          <p className="text-xs text-slate-500">
            AGM FITOUT TECHNICAL SERVICES LLC — Summary of earned revenue, direct costs, and operational overhead.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Live GAAP Basis
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
          Loading Statement of Profit & Loss...
        </div>
      ) : (
        <div className="space-y-6">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  1. Total Income
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Service income & revenues
                </p>
              </div>
              <p className="text-xl font-black text-emerald-900 font-mono">
                {formatCurrency(totalIncome)}
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                  2. Gross Profit
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  After direct materials (AED {formatNumber(totalDirectExpenses)})
                </p>
              </div>
              <p className="text-xl font-black text-blue-900 font-mono">
                {formatCurrency(grossProfit)}
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col justify-between space-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                  3. Operating Overhead
                </p>
                <p className="text-xs text-rose-700 mt-0.5">
                  Salaries, rent, utilities & admin
                </p>
              </div>
              <p className="text-xl font-black text-rose-900 font-mono">
                {formatCurrency(totalExpenses)}
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-900 text-white flex flex-col justify-between space-y-2 shadow-xs">
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
              <p
                className={`text-xl font-black font-mono ${
                  netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatCurrency(netProfit)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <Table className="w-full text-xs text-left">
              <TableHead className="bg-slate-50/90 border-b border-slate-200">
                <TableHeaderCell className="py-3 px-5 w-1/4 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                  Section
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-5 w-1/2 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                  Account Name
                </TableHeaderCell>
                <TableHeaderCell align="right" className="py-3 px-5 text-right w-1/4 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                  Amount (AED)
                </TableHeaderCell>
              </TableHead>
              <TableBody className="divide-y divide-slate-100">
                {/* SECTION 1: INCOME */}
                <TableRow className="bg-emerald-50/40 font-bold text-emerald-900">
                  <TableCell colSpan={3} className="py-2.5 px-5 text-[11px] uppercase tracking-wider">
                    INCOME
                  </TableCell>
                </TableRow>
                {incomeRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-3 px-5 text-center text-slate-400 italic">
                      No income accounts recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  incomeRows.map((item: ProfitLossItem, idx: number) => (
                    <TableRow key={`inc-${idx}`} className="hover:bg-slate-50/50 text-slate-700 transition">
                      <TableCell className="py-2 px-5 text-slate-500">{item.section || "Income"}</TableCell>
                      <TableCell className="py-2 px-5 font-semibold text-slate-900">{item.accountName}</TableCell>
                      <TableCell align="right" className="py-2 px-5 text-right font-mono font-medium text-slate-800">
                        {formatNumber(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow className="bg-emerald-100/60 font-bold text-emerald-950 border-t border-b border-emerald-200">
                  <TableCell colSpan={2} className="py-2.5 px-5 text-emerald-900 font-bold">
                    Total Income
                  </TableCell>
                  <TableCell align="right" className="py-2.5 px-5 text-right font-mono font-black text-emerald-900 text-sm">
                    {formatNumber(totalIncome)}
                  </TableCell>
                </TableRow>

                {/* SECTION 2: DIRECT EXPENSE */}
                <TableRow className="bg-blue-50/40 font-bold text-blue-900">
                  <TableCell colSpan={3} className="py-2.5 px-5 text-[11px] uppercase tracking-wider">
                    Direct Expense
                  </TableCell>
                </TableRow>
                {directExpenseRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-3 px-5 text-center text-slate-400 italic">
                      No direct expense accounts recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  directExpenseRows.map((item: ProfitLossItem, idx: number) => (
                    <TableRow key={`dir-${idx}`} className="hover:bg-slate-50/50 text-slate-700 transition">
                      <TableCell className="py-2 px-5 text-slate-500">{item.section || "Direct Material Expense"}</TableCell>
                      <TableCell className="py-2 px-5 font-semibold text-slate-900">{item.accountName}</TableCell>
                      <TableCell align="right" className="py-2 px-5 text-right font-mono font-medium text-slate-800">
                        {formatNumber(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow className="bg-blue-100/60 font-bold text-blue-950 border-t border-b border-blue-200">
                  <TableCell colSpan={2} className="py-2.5 px-5 text-blue-900 font-bold">
                    Gross Profit /loss
                  </TableCell>
                  <TableCell align="right" className="py-2.5 px-5 text-right font-mono font-black text-blue-900 text-sm">
                    {formatNumber(grossProfit)}
                  </TableCell>
                </TableRow>

                {/* SECTION 3: OPERATING EXPENSE */}
                <TableRow className="bg-rose-50/30 font-bold text-rose-900">
                  <TableCell colSpan={3} className="py-2.5 px-5 text-[11px] uppercase tracking-wider">
                    Operating Expense
                  </TableCell>
                </TableRow>
                {operatingExpenseRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-3 px-5 text-center text-slate-400 italic">
                      No operating expense accounts recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  operatingExpenseRows.map((item: ProfitLossItem, idx: number) => (
                    <TableRow key={`op-${idx}`} className="hover:bg-slate-50/50 text-slate-700 transition">
                      <TableCell className="py-2 px-5 text-slate-500">{item.section || "Operating Expense"}</TableCell>
                      <TableCell className="py-2 px-5 font-semibold text-slate-900">{item.accountName}</TableCell>
                      <TableCell align="right" className="py-2 px-5 text-right font-mono font-medium text-slate-800">
                        {formatNumber(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow className="bg-rose-100/60 font-bold text-rose-950 border-t border-b border-rose-200">
                  <TableCell colSpan={2} className="py-2.5 px-5 text-rose-900 font-bold">
                    Total Expenses
                  </TableCell>
                  <TableCell align="right" className="py-2.5 px-5 text-right font-mono font-black text-rose-900 text-sm">
                    {formatNumber(totalExpenses)}
                  </TableCell>
                </TableRow>

                {/* FINAL NET PROFIT / (LOSS) ROW */}
                <TableRow className="bg-slate-900 text-white font-black">
                  <TableCell colSpan={2} className="py-3.5 px-5 text-xs uppercase tracking-wider font-bold">
                    Net Profit / (Loss)
                  </TableCell>
                  <TableCell
                    align="right"
                    className={`py-3.5 px-5 text-right font-mono font-black text-sm ${
                      netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatNumber(netProfit)}
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
