"use client";

import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  PrintIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
} from "@/components/icons";
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
import { ReportKpiCard, ReportKpiGrid } from "./ReportKpiCard";

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

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Balance-Sheet-Report",
  });

  return (
    <div ref={printRef} className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6 print:p-0 print:m-0 print:border-none">
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
                      <h3 className="font-black text-lg text-slate-900 tracking-tight">
                        Statement of Financial Position
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Assets = Liabilities + Equity
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<PrintIcon size={14} />}
                      onClick={() => handlePrint()}
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
                    <ReportKpiGrid cols={3}>
                      <ReportKpiCard
                        title="1. Total Assets"
                        subtitle="Current & Fixed Assets"
                        value={formatNumber(totalAssets)}
                        accentColor="sky"
                        valueColor="text-slate-900"
                      />
                      <ReportKpiCard
                        title="2. Total Liabilities"
                        subtitle="Payables & Accruals"
                        value={formatNumber(totalLiabilities)}
                        accentColor="amber"
                        valueColor="text-amber-800"
                      />
                      <ReportKpiCard
                        title="3. Total Equity"
                        subtitle="Partner Capital & P&L"
                        value={formatNumber(totalEquity)}
                        accentColor="emerald"
                        valueColor={totalEquity >= 0 ? "text-emerald-800" : "text-rose-700"}
                      />
                      <ReportKpiCard
                        title="4. Balance Check"
                        subtitle="Assets - (Liabilities + Equity)"
                        value={isBalanced ? "0.00" : formatNumber(balanceCheck)}
                        accentColor={isBalanced ? "emerald" : "amber"}
                        valueColor={isBalanced ? "text-emerald-800" : "text-amber-800"}
                        badge={
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              isBalanced
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            {isBalanced ? "Balanced" : "Variance"}
                          </span>
                        }
                      />
                    </ReportKpiGrid>

                    {/* Compact Printable Balance Sheet Summary Strip */}
                    <div className="hidden print:grid grid-cols-4 gap-2.5 p-3 bg-white rounded-xl border border-slate-200 print-avoid-break mb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">1. Total Assets</span>
                        <span className="font-mono font-black text-slate-900">{formatCurrency(totalAssets)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">2. Total Liabilities</span>
                        <span className="font-mono font-black text-amber-800">{formatCurrency(totalLiabilities)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">3. Total Equity</span>
                        <span className="font-mono font-black text-emerald-800">{formatCurrency(totalEquity)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">4. Balance Status</span>
                        <span className="font-mono font-black text-emerald-800">{isBalanced ? "Balanced (0.00)" : formatCurrency(balanceCheck)}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
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
