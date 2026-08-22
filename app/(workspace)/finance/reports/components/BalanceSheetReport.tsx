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
  BalanceSheetReport as BalanceSheetData,
  BalanceSheetItem,
} from "@/lib/hooks/api-hooks";
import { formatCurrency, formatNumber } from "./types";

interface BalanceSheetReportProps {
  balanceSheet?: BalanceSheetData;
  isLoading: boolean;
}

export const BalanceSheetReport: React.FC<BalanceSheetReportProps> = ({
  balanceSheet,
  isLoading,
}) => {
  const currentAssetsRows: BalanceSheetItem[] =
    balanceSheet?.currentAssets && balanceSheet.currentAssets.length > 0
      ? balanceSheet.currentAssets
      : [];
  const fixedAssetsRows: BalanceSheetItem[] =
    balanceSheet?.fixedAssets && balanceSheet.fixedAssets.length > 0
      ? balanceSheet.fixedAssets
      : [];
  const currentLiabilitiesRows: BalanceSheetItem[] =
    balanceSheet?.currentLiabilities &&
    balanceSheet.currentLiabilities.length > 0
      ? balanceSheet.currentLiabilities
      : [];
  const equityRows: BalanceSheetItem[] =
    balanceSheet?.equity && balanceSheet.equity.length > 0
      ? balanceSheet.equity
      : [];

  const totalCurrentAssets =
    balanceSheet?.totalCurrentAssets !== undefined
      ? balanceSheet.totalCurrentAssets
      : currentAssetsRows.reduce(
          (s: number, i: BalanceSheetItem) => s + Number(i.amount || 0),
          0,
        );

  const totalFixedAssets =
    balanceSheet?.totalFixedAssets !== undefined
      ? balanceSheet.totalFixedAssets
      : fixedAssetsRows.reduce(
          (s: number, i: BalanceSheetItem) => s + Number(i.amount || 0),
          0,
        );

  const totalAssets =
    balanceSheet?.totalAssets !== undefined
      ? balanceSheet.totalAssets
      : totalCurrentAssets + totalFixedAssets;

  const totalCurrentLiabilities =
    balanceSheet?.totalCurrentLiabilities !== undefined
      ? balanceSheet.totalCurrentLiabilities
      : currentLiabilitiesRows.reduce(
          (s: number, i: BalanceSheetItem) => s + Number(i.amount || 0),
          0,
        );

  const totalLiabilities =
    balanceSheet?.totalLiabilities !== undefined
      ? balanceSheet.totalLiabilities
      : totalCurrentLiabilities;

  const totalEquity =
    balanceSheet?.totalEquity !== undefined
      ? balanceSheet.totalEquity
      : equityRows.reduce(
          (s: number, i: BalanceSheetItem) => s + Number(i.amount || 0),
          0,
        );

  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const balanceCheck = totalAssets - totalLiabilitiesAndEquity;

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-base text-slate-900">
            Balance Sheet Statement
          </h3>
          <p className="text-xs text-slate-500">
            AGM FITOUT TECHNICAL SERVICES LLC — Financial position overview:
            Assets = Liabilities + Equity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              balanceSheet?.balanced
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {balanceSheet?.balanced ? "✓ Balanced" : "Live GAAP Position"}
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
          Loading Balance Sheet...
        </div>
      ) : (
        <div className="space-y-6">
          {/* 4 KPI Top Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                  1. Total Assets
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Current & fixed assets
                </p>
              </div>
              <p className="text-xl font-black text-blue-900 font-mono">
                {formatCurrency(totalAssets)}
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-orange-50/60 border border-orange-100 flex flex-col justify-between space-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-orange-800">
                  2. Total Liabilities
                </p>
                <p className="text-xs text-orange-700 mt-0.5">
                  Payables, accrued salaries & VAT
                </p>
              </div>
              <p className="text-xl font-black text-orange-950 font-mono">
                {formatCurrency(totalLiabilities)}
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between space-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
                  3. Total Equity
                </p>
                <p className="text-xs text-purple-700 mt-0.5">
                  Managing partner capital & earnings
                </p>
              </div>
              <p
                className={`text-xl font-black font-mono ${
                  totalEquity >= 0 ? "text-purple-950" : "text-rose-700"
                }`}
              >
                {formatCurrency(totalEquity)}
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-900 text-white flex flex-col justify-between space-y-2 shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    4. Balance Check
                  </p>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      Math.abs(balanceCheck) < 0.01
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {Math.abs(balanceCheck) < 0.01 ? "Balanced" : "Diff"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assets - (Liabilities + Equity)
                </p>
              </div>
              <p
                className={`text-xl font-black font-mono ${
                  Math.abs(balanceCheck) < 0.01
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {formatCurrency(balanceCheck)}
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
                <TableHeaderCell
                  align="right"
                  className="py-3 px-5 text-right w-1/4 text-slate-500 font-bold uppercase text-[11px] tracking-wider"
                >
                  Amount (AED)
                </TableHeaderCell>
              </TableHead>
              <TableBody className="divide-y divide-slate-100">
                {/* SECTION 1: ASSETS */}
                <TableRow className="bg-blue-50/70 font-bold text-blue-950">
                  <TableCell
                    colSpan={3}
                    className="py-2.5 px-5 text-[11px] uppercase tracking-wider"
                  >
                    ASSETS
                  </TableCell>
                </TableRow>

                {/* Current Assets */}
                <TableRow className="bg-slate-50/60 font-semibold text-slate-700">
                  <TableCell
                    colSpan={3}
                    className="py-2 px-5 text-[11px] italic"
                  >
                    Current Assets
                  </TableCell>
                </TableRow>
                {currentAssetsRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-2.5 px-5 text-center text-slate-400 italic"
                    >
                      No current asset accounts
                    </TableCell>
                  </TableRow>
                ) : (
                  currentAssetsRows.map(
                    (item: BalanceSheetItem, idx: number) => (
                      <TableRow
                        key={`ca-${idx}`}
                        className="hover:bg-slate-50/50 text-slate-700 transition"
                      >
                        <TableCell className="py-2 px-5 text-slate-500">
                          {item.section || "Current Asset"}
                        </TableCell>
                        <TableCell className="py-2 px-5 font-semibold text-slate-900">
                          {item.accountName}
                        </TableCell>
                        <TableCell
                          align="right"
                          className="py-2 px-5 text-right font-mono font-medium text-slate-800"
                        >
                          {formatNumber(item.amount)}
                        </TableCell>
                      </TableRow>
                    ),
                  )
                )}
                <TableRow className="bg-blue-50/40 font-bold text-blue-900 border-t border-b border-blue-100">
                  <TableCell
                    colSpan={2}
                    className="py-2 px-5 text-blue-900 font-bold"
                  >
                    Total Current Assets
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-2 px-5 text-right font-mono font-bold text-blue-900"
                  >
                    {formatNumber(totalCurrentAssets)}
                  </TableCell>
                </TableRow>

                {/* Fixed Assets */}
                <TableRow className="bg-slate-50/60 font-semibold text-slate-700">
                  <TableCell
                    colSpan={3}
                    className="py-2 px-5 text-[11px] italic"
                  >
                    Fixed Assets
                  </TableCell>
                </TableRow>
                {fixedAssetsRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-2.5 px-5 text-center text-slate-400 italic"
                    >
                      No fixed asset accounts
                    </TableCell>
                  </TableRow>
                ) : (
                  fixedAssetsRows.map((item: BalanceSheetItem, idx: number) => (
                    <TableRow
                      key={`fa-${idx}`}
                      className="hover:bg-slate-50/50 text-slate-700 transition"
                    >
                      <TableCell className="py-2 px-5 text-slate-500">
                        {item.section || "Fixed Asset"}
                      </TableCell>
                      <TableCell className="py-2 px-5 font-semibold text-slate-900">
                        {item.accountName}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-2 px-5 text-right font-mono font-medium text-slate-800"
                      >
                        {formatNumber(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow className="bg-blue-50/40 font-bold text-blue-900 border-t border-b border-blue-100">
                  <TableCell
                    colSpan={2}
                    className="py-2 px-5 text-blue-900 font-bold"
                  >
                    Total Fixed Assets
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-2 px-5 text-right font-mono font-bold text-blue-900"
                  >
                    {formatNumber(totalFixedAssets)}
                  </TableCell>
                </TableRow>

                {/* TOTAL ASSETS ROW */}
                <TableRow className="bg-blue-100/70 font-bold text-blue-950 border-t-2 border-b-2 border-blue-200">
                  <TableCell
                    colSpan={2}
                    className="py-2.5 px-5 text-blue-950 font-black text-xs uppercase tracking-wider"
                  >
                    TOTAL ASSETS
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-2.5 px-5 text-right font-mono font-black text-blue-950 text-sm"
                  >
                    {formatNumber(totalAssets)}
                  </TableCell>
                </TableRow>

                {/* SECTION 2: LIABILITIES */}
                <TableRow className="bg-orange-50/70 font-bold text-orange-950">
                  <TableCell
                    colSpan={3}
                    className="py-2.5 px-5 text-[11px] uppercase tracking-wider"
                  >
                    LIABILITIES
                  </TableCell>
                </TableRow>

                {/* Current Liabilities */}
                <TableRow className="bg-slate-50/60 font-semibold text-slate-700">
                  <TableCell
                    colSpan={3}
                    className="py-2 px-5 text-[11px] italic"
                  >
                    Current Liabilities
                  </TableCell>
                </TableRow>
                {currentLiabilitiesRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-2.5 px-5 text-center text-slate-400 italic"
                    >
                      No current liability accounts
                    </TableCell>
                  </TableRow>
                ) : (
                  currentLiabilitiesRows.map(
                    (item: BalanceSheetItem, idx: number) => (
                      <TableRow
                        key={`cl-${idx}`}
                        className="hover:bg-slate-50/50 text-slate-700 transition"
                      >
                        <TableCell className="py-2 px-5 text-slate-500">
                          {item.section || "Current Liability"}
                        </TableCell>
                        <TableCell className="py-2 px-5 font-semibold text-slate-900">
                          {item.accountName}
                        </TableCell>
                        <TableCell
                          align="right"
                          className="py-2 px-5 text-right font-mono font-medium text-slate-800"
                        >
                          {formatNumber(item.amount)}
                        </TableCell>
                      </TableRow>
                    ),
                  )
                )}
                <TableRow className="bg-orange-50/40 font-bold text-orange-900 border-t border-b border-orange-100">
                  <TableCell
                    colSpan={2}
                    className="py-2 px-5 text-orange-900 font-bold"
                  >
                    Total Current Liabilities
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-2 px-5 text-right font-mono font-bold text-orange-900"
                  >
                    {formatNumber(totalCurrentLiabilities)}
                  </TableCell>
                </TableRow>

                {/* TOTAL LIABILITIES ROW */}
                <TableRow className="bg-orange-100/70 font-bold text-orange-950 border-t-2 border-b-2 border-orange-200">
                  <TableCell
                    colSpan={2}
                    className="py-2.5 px-5 text-orange-950 font-black text-xs uppercase tracking-wider"
                  >
                    TOTAL LIABILITIES
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-2.5 px-5 text-right font-mono font-black text-orange-950 text-sm"
                  >
                    {formatNumber(totalLiabilities)}
                  </TableCell>
                </TableRow>

                {/* SECTION 3: EQUITY */}
                <TableRow className="bg-purple-50/70 font-bold text-purple-950">
                  <TableCell
                    colSpan={3}
                    className="py-2.5 px-5 text-[11px] uppercase tracking-wider"
                  >
                    EQUITY
                  </TableCell>
                </TableRow>
                {equityRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-2.5 px-5 text-center text-slate-400 italic"
                    >
                      No equity accounts
                    </TableCell>
                  </TableRow>
                ) : (
                  equityRows.map((item: BalanceSheetItem, idx: number) => (
                    <TableRow
                      key={`eq-${idx}`}
                      className="hover:bg-slate-50/50 text-slate-700 transition"
                    >
                      <TableCell className="py-2 px-5 text-slate-500">
                        {item.section || "Capital"}
                      </TableCell>
                      <TableCell className="py-2 px-5 font-semibold text-slate-900">
                        {item.accountName}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-2 px-5 text-right font-mono font-medium text-slate-800"
                      >
                        {formatNumber(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow className="bg-purple-100/70 font-bold text-purple-950 border-t-2 border-b-2 border-purple-200">
                  <TableCell
                    colSpan={2}
                    className="py-2.5 px-5 text-purple-950 font-black text-xs uppercase tracking-wider"
                  >
                    TOTAL EQUITY
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-2.5 px-5 text-right font-mono font-black text-purple-950 text-sm"
                  >
                    {formatNumber(totalEquity)}
                  </TableCell>
                </TableRow>

                {/* TOTAL LIABILITIES + EQUITY ROW */}
                <TableRow className="bg-slate-100 font-bold text-slate-900 border-t-2 border-b-2 border-slate-300">
                  <TableCell
                    colSpan={2}
                    className="py-3 px-5 text-slate-950 font-black text-xs uppercase tracking-wider"
                  >
                    TOTAL LIABILITIES + EQUITY
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-5 text-right font-mono font-black text-slate-950 text-sm"
                  >
                    {formatNumber(totalLiabilitiesAndEquity)}
                  </TableCell>
                </TableRow>

                {/* BALANCE CHECK ROW */}
                <TableRow
                  className={`font-black ${
                    Math.abs(balanceCheck) < 0.01
                      ? "bg-emerald-50 text-emerald-950"
                      : "bg-amber-50 text-amber-950"
                  }`}
                >
                  <TableCell
                    colSpan={2}
                    className="py-3 px-5 text-xs uppercase tracking-wider font-bold"
                  >
                    BALANCE CHECK (Assets - Liabilities - Equity)
                  </TableCell>
                  <TableCell
                    align="right"
                    className={`py-3 px-5 text-right font-mono font-black text-sm ${
                      Math.abs(balanceCheck) < 0.01
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}
                  >
                    {formatNumber(balanceCheck)}
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
