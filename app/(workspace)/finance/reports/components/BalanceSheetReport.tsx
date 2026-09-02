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
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { formatCurrency, formatNumber } from "./types";
import {
  Scale,
  ShieldCheck,
  Building2,
  CreditCard,
  PieChart,
  Printer,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

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
  const isBalanced = Math.abs(balanceCheck) < 0.01;

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
                      Financial Position Statement
                    </span>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      BALANCE SHEET
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-700 font-mono font-bold text-xs">
                      Assets = Liabilities + Equity
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      Printed: {new Date().toLocaleDateString("en-GB")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 print:hidden">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-1 rounded-lg bg-sky-700 text-white font-black text-xs shadow-xs">
                        BS
                      </span>
                      <h3 className="font-black text-lg text-slate-900 tracking-tight">
                        Statement of Financial Position (Balance Sheet)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      AGM FITOUT TECHNICAL SERVICES LLC — Statutory GAAP
                      Equation: Assets = Liabilities + Equity
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        isBalanced
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {isBalanced ? (
                        <CheckCircle2 size={13} className="text-emerald-700" />
                      ) : (
                        <AlertTriangle size={13} className="text-amber-700" />
                      )}
                      {isBalanced
                        ? "Equation Balanced"
                        : "Audit Review Required"}
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
                    <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin mx-auto" />
                    <p>Loading Statutory Balance Sheet...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-4 print:gap-2.5 print-avoid-break">
                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
                        <div>
                          <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            1. Total Assets
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

                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-amber-500" />
                        <div>
                          <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            2. Total Liabilities
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

                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
                        <div>
                          <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            3. Total Equity
                          </span>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            Partner Capital &amp; P&amp;L
                          </span>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                            AED
                          </span>
                          <span
                            className={`text-xl print:text-base font-black font-mono ${
                              totalEquity >= 0
                                ? "text-emerald-800"
                                : "text-rose-700"
                            }`}
                          >
                            {formatNumber(totalEquity)}
                          </span>
                        </div>
                      </div>

                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div
                          className={`absolute inset-x-0 top-0 h-[2.5px] ${isBalanced ? "bg-emerald-500" : "bg-amber-500"}`}
                        />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              4. Balance Check
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                isBalanced
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {isBalanced ? "Balanced" : "Variance"}
                            </span>
                          </div>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            Assets - (Liabilities + Equity)
                          </span>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                            AED
                          </span>
                          <span
                            className={`text-xl print:text-base font-black font-mono ${
                              isBalanced ? "text-emerald-800" : "text-amber-800"
                            }`}
                          >
                            {isBalanced ? "0.00" : formatNumber(balanceCheck)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs print-avoid-break">
                      <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
                        <h4 className="font-black text-xs uppercase tracking-wider text-white">
                          Balance Sheet Ledger Breakdown
                        </h4>
                        <span className="text-[11px] font-mono text-emerald-300 font-bold">
                          Assets = Liabilities + Equity
                        </span>
                      </div>

                      <Table className="w-full text-xs text-left">
                        <TableHead className="bg-slate-50/95 border-b border-slate-200">
                          <TableHeaderCell className="py-3 px-5 w-1/4 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Section / Group
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-5 w-1/2 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Account Name
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-5 text-right w-1/4 text-slate-700 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Amount (AED)
                          </TableHeaderCell>
                        </TableHead>

                        <TableBody className="divide-y divide-slate-100">
                          <TableRow className="bg-sky-50/70 font-bold text-sky-950">
                            <TableCell
                              colSpan={3}
                              className="py-2.5 px-5 text-[11px] uppercase tracking-wider"
                            >
                              1. ASSETS
                            </TableCell>
                          </TableRow>

                          <TableRow className="bg-slate-50/70 font-semibold text-slate-700">
                            <TableCell
                              colSpan={3}
                              className="py-2 px-5 text-[11px] italic"
                            >
                              Current Assets (Liquidity &amp; Short-Term
                              Receivables)
                            </TableCell>
                          </TableRow>
                          {currentAssetsRows.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="py-2.5 px-5 text-center text-slate-400 italic"
                              >
                                No current asset accounts recorded
                              </TableCell>
                            </TableRow>
                          ) : (
                            currentAssetsRows.map(
                              (item: BalanceSheetItem, idx: number) => (
                                <TableRow
                                  key={`ca-${idx}`}
                                  className="hover:bg-slate-50/60 text-slate-700 transition-colors"
                                >
                                  <TableCell className="py-2.5 px-5 text-slate-500">
                                    {item.section || "Current Asset"}
                                  </TableCell>
                                  <TableCell className="py-2.5 px-5 font-semibold text-slate-900">
                                    {item.accountName}
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    className="py-2.5 px-5 text-right font-mono font-bold text-slate-900"
                                  >
                                    {formatNumber(item.amount)}
                                  </TableCell>
                                </TableRow>
                              ),
                            )
                          )}
                          <TableRow className="bg-sky-50/50 font-bold text-sky-900 border-t border-b border-sky-100">
                            <TableCell
                              colSpan={2}
                              className="py-2 px-5 text-sky-900 font-bold"
                            >
                              Total Current Assets
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-2 px-5 text-right font-mono font-bold text-sky-900"
                            >
                              {formatNumber(totalCurrentAssets)}
                            </TableCell>
                          </TableRow>

                          <TableRow className="bg-slate-50/70 font-semibold text-slate-700">
                            <TableCell
                              colSpan={3}
                              className="py-2 px-5 text-[11px] italic"
                            >
                              Fixed &amp; Non-Current Assets
                            </TableCell>
                          </TableRow>
                          {fixedAssetsRows.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="py-2.5 px-5 text-center text-slate-400 italic"
                              >
                                No fixed asset accounts recorded
                              </TableCell>
                            </TableRow>
                          ) : (
                            fixedAssetsRows.map(
                              (item: BalanceSheetItem, idx: number) => (
                                <TableRow
                                  key={`fa-${idx}`}
                                  className="hover:bg-slate-50/60 text-slate-700 transition-colors"
                                >
                                  <TableCell className="py-2.5 px-5 text-slate-500">
                                    {item.section || "Fixed Asset"}
                                  </TableCell>
                                  <TableCell className="py-2.5 px-5 font-semibold text-slate-900">
                                    {item.accountName}
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    className="py-2.5 px-5 text-right font-mono font-bold text-slate-900"
                                  >
                                    {formatNumber(item.amount)}
                                  </TableCell>
                                </TableRow>
                              ),
                            )
                          )}
                          <TableRow className="bg-sky-50/50 font-bold text-sky-900 border-t border-b border-sky-100">
                            <TableCell
                              colSpan={2}
                              className="py-2 px-5 text-sky-900 font-bold"
                            >
                              Total Fixed Assets
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-2 px-5 text-right font-mono font-bold text-sky-900"
                            >
                              {formatNumber(totalFixedAssets)}
                            </TableCell>
                          </TableRow>

                          <TableRow className="bg-sky-100/70 font-bold text-sky-950 border-t-2 border-b-2 border-sky-200">
                            <TableCell
                              colSpan={2}
                              className="py-3 px-5 text-sky-950 font-black text-xs uppercase tracking-wider"
                            >
                              TOTAL ASSETS
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-3 px-5 text-right font-mono font-black text-sky-950 text-sm"
                            >
                              {formatNumber(totalAssets)}
                            </TableCell>
                          </TableRow>

                          <TableRow className="bg-amber-50/70 font-bold text-amber-950">
                            <TableCell
                              colSpan={3}
                              className="py-2.5 px-5 text-[11px] uppercase tracking-wider"
                            >
                              2. LIABILITIES
                            </TableCell>
                          </TableRow>

                          <TableRow className="bg-slate-50/70 font-semibold text-slate-700">
                            <TableCell
                              colSpan={3}
                              className="py-2 px-5 text-[11px] italic"
                            >
                              Current Liabilities (Payables &amp; Tax)
                            </TableCell>
                          </TableRow>
                          {currentLiabilitiesRows.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="py-2.5 px-5 text-center text-slate-400 italic"
                              >
                                No current liability accounts recorded
                              </TableCell>
                            </TableRow>
                          ) : (
                            currentLiabilitiesRows.map(
                              (item: BalanceSheetItem, idx: number) => (
                                <TableRow
                                  key={`cl-${idx}`}
                                  className="hover:bg-slate-50/60 text-slate-700 transition-colors"
                                >
                                  <TableCell className="py-2.5 px-5 text-slate-500">
                                    {item.section || "Current Liability"}
                                  </TableCell>
                                  <TableCell className="py-2.5 px-5 font-semibold text-slate-900">
                                    {item.accountName}
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    className="py-2.5 px-5 text-right font-mono font-bold text-slate-900"
                                  >
                                    {formatNumber(item.amount)}
                                  </TableCell>
                                </TableRow>
                              ),
                            )
                          )}
                          <TableRow className="bg-amber-50/50 font-bold text-amber-900 border-t border-b border-amber-100">
                            <TableCell
                              colSpan={2}
                              className="py-2 px-5 text-amber-900 font-bold"
                            >
                              Total Current Liabilities
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-2 px-5 text-right font-mono font-bold text-amber-900"
                            >
                              {formatNumber(totalCurrentLiabilities)}
                            </TableCell>
                          </TableRow>

                          <TableRow className="bg-amber-100/70 font-bold text-amber-950 border-t-2 border-b-2 border-amber-200">
                            <TableCell
                              colSpan={2}
                              className="py-3 px-5 text-amber-950 font-black text-xs uppercase tracking-wider"
                            >
                              TOTAL LIABILITIES
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-3 px-5 text-right font-mono font-black text-amber-950 text-sm"
                            >
                              {formatNumber(totalLiabilities)}
                            </TableCell>
                          </TableRow>

                          <TableRow className="bg-emerald-50/70 font-bold text-emerald-950">
                            <TableCell
                              colSpan={3}
                              className="py-2.5 px-5 text-[11px] uppercase tracking-wider"
                            >
                              3. PARTNERS&apos; &amp; OWNERS&apos; EQUITY
                            </TableCell>
                          </TableRow>
                          {equityRows.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="py-2.5 px-5 text-center text-slate-400 italic"
                              >
                                No equity accounts recorded
                              </TableCell>
                            </TableRow>
                          ) : (
                            equityRows.map(
                              (item: BalanceSheetItem, idx: number) => (
                                <TableRow
                                  key={`eq-${idx}`}
                                  className="hover:bg-slate-50/60 text-slate-700 transition-colors"
                                >
                                  <TableCell className="py-2.5 px-5 text-slate-500">
                                    {item.section || "Capital"}
                                  </TableCell>
                                  <TableCell className="py-2.5 px-5 font-semibold text-slate-900">
                                    {item.accountName}
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    className="py-2.5 px-5 text-right font-mono font-bold text-slate-900"
                                  >
                                    {formatNumber(item.amount)}
                                  </TableCell>
                                </TableRow>
                              ),
                            )
                          )}
                          <TableRow className="bg-emerald-100/70 font-bold text-emerald-950 border-t-2 border-b-2 border-emerald-200">
                            <TableCell
                              colSpan={2}
                              className="py-3 px-5 text-emerald-950 font-black text-xs uppercase tracking-wider"
                            >
                              TOTAL EQUITY
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-3 px-5 text-right font-mono font-black text-emerald-950 text-sm"
                            >
                              {formatNumber(totalEquity)}
                            </TableCell>
                          </TableRow>

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

                          <TableRow
                            className={`font-black ${
                              isBalanced
                                ? "bg-emerald-50 text-emerald-950"
                                : "bg-amber-50 text-amber-950"
                            }`}
                          >
                            <TableCell
                              colSpan={2}
                              className="py-3.5 px-5 text-xs uppercase tracking-wider font-bold"
                            >
                              BALANCE AUDIT RECONCILIATION (Assets - Liabilities
                              - Equity)
                            </TableCell>
                            <TableCell
                              align="right"
                              className={`py-3.5 px-5 text-right font-mono font-black text-sm ${
                                isBalanced
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
