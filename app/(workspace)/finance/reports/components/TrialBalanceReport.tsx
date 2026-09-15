"use client";

import React, { useState, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  PrintIcon,
  SearchIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
} from "@/components/icons";
import {
  Button,
  Input,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui";
import {
  TrialBalanceReport as TrialBalanceData,
  TrialBalanceRow,
} from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { formatCurrency, formatNumber } from "./types";
import { ReportKpiCard, ReportKpiGrid } from "./ReportKpiCard";

interface TrialBalanceReportProps {
  trialBalance?: TrialBalanceData;
  isLoading: boolean;
}

export const TrialBalanceReport: React.FC<TrialBalanceReportProps> = ({
  trialBalance,
  isLoading,
}) => {
  const [tbSearch, setTbSearch] = useState<string>("");
  const [tbTypeFilter, setTbTypeFilter] = useState<string>("ALL");

  const allRows: TrialBalanceRow[] = useMemo(
    () => trialBalance?.rows || [],
    [trialBalance?.rows],
  );

  const filteredRows = useMemo(() => {
    return allRows.filter((r: TrialBalanceRow) => {
      const matchesSearch =
        !tbSearch ||
        (r.accountName &&
          r.accountName.toLowerCase().includes(tbSearch.toLowerCase())) ||
        (r.accountCode &&
          r.accountCode.toLowerCase().includes(tbSearch.toLowerCase()));
      const matchesType =
        tbTypeFilter === "ALL" ||
        (r.type && r.type.toUpperCase() === tbTypeFilter);
      return matchesSearch && matchesType;
    });
  }, [allRows, tbSearch, tbTypeFilter]);

  const totalDebit =
    trialBalance?.totalDebit !== undefined
      ? trialBalance.totalDebit
      : allRows.reduce(
          (s: number, r: TrialBalanceRow) => s + Number(r.debit || 0),
          0,
        );
  const totalCredit =
    trialBalance?.totalCredit !== undefined
      ? trialBalance.totalCredit
      : allRows.reduce(
          (s: number, r: TrialBalanceRow) => s + Number(r.credit || 0),
          0,
        );
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;

  const typeFilterOptions = [
    { id: "ALL", label: "All Types" },
    { id: "ASSET", label: "Assets" },
    { id: "LIABILITY", label: "Liabilities" },
    { id: "EQUITY", label: "Equity" },
    { id: "REVENUE", label: "Revenue" },
    { id: "EXPENSE", label: "Expenses" },
  ];

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Trial-Balance-Report",
  });

  return (
    <div
      ref={printRef}
      className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6 print:p-0 print:m-0 print:border-none"
    >
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
                      General Ledger Verification
                    </span>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      TRIAL BALANCE AUDIT
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-700 font-mono font-bold text-xs">
                      {isBalanced
                        ? "Debits = Credits (Balanced)"
                        : "Audit Review"}
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
                        Trial Balance Audit Statement
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Comprehensive debit and credit audit across all active
                      accounts
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint()}
                      className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
                      icon={<PrintIcon size={14} />}
                    >
                      {" "}
                      Print Statement
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="py-16 text-center text-xs text-slate-400 animate-pulse space-y-2">
                    <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mx-auto" />
                    <p>Calculating Trial Balance Ledger...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <ReportKpiGrid cols={4}>
                      <ReportKpiCard
                        title="1. Total Debits"
                        subtitle="Assets & Expense Postings"
                        value={formatNumber(totalDebit)}
                        accentColor="sky"
                        valueColor="text-slate-900"
                      />
                      <ReportKpiCard
                        title="2. Total Credits"
                        subtitle="Liabilities, Equity & Revenue"
                        value={formatNumber(totalCredit)}
                        accentColor="emerald"
                        valueColor="text-emerald-800"
                      />
                      <ReportKpiCard
                        title="3. Active Ledgers"
                        subtitle="Chart of Accounts Monitored"
                        value={
                          <span>
                            {allRows.length}
                            <span className="text-xs font-bold text-slate-500 font-sans ml-1.5">
                              Accounts
                            </span>
                          </span>
                        }
                        currency={false}
                        accentColor="indigo"
                        valueColor="text-slate-900"
                      />
                      <ReportKpiCard
                        title="4. Ledger Equality"
                        subtitle="Total Debits - Total Credits"
                        value={isBalanced ? "0.00" : formatNumber(difference)}
                        accentColor={isBalanced ? "emerald" : "amber"}
                        valueColor={
                          isBalanced ? "text-emerald-800" : "text-amber-800"
                        }
                        badge={
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              isBalanced
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            {isBalanced ? "In Balance" : "Variance"}
                          </span>
                        }
                      />
                    </ReportKpiGrid>

                    <div className="hidden print:grid grid-cols-4 gap-2.5 p-3 bg-white rounded-xl border border-slate-200 print-avoid-break mb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          1. Total Debits
                        </span>
                        <span className="font-mono font-black text-slate-900">
                          {formatCurrency(totalDebit)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          2. Total Credits
                        </span>
                        <span className="font-mono font-black text-slate-900">
                          {formatCurrency(totalCredit)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          3. Chart Accounts
                        </span>
                        <span className="font-mono font-black text-slate-900">
                          {allRows.length} Accounts
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          4. Audit Status
                        </span>
                        <span className="font-mono font-black text-emerald-800">
                          {isBalanced
                            ? "In Balance (0.00)"
                            : `Variance: ${formatCurrency(difference)}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs print:hidden">
                      <div className="max-w-xs flex-1">
                        <Input
                          type="text"
                          placeholder="Filter by account code or title..."
                          value={tbSearch}
                          onChange={(e) => setTbSearch(e.target.value)}
                          leftIcon={<SearchIcon size={14} />}
                          className="text-xs font-semibold"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        {typeFilterOptions.map((btn) => {
                          const isActive = tbTypeFilter === btn.id;
                          return (
                            <Button
                              key={btn.id}
                              type="button"
                              variant="ghost"
                              onClick={() => setTbTypeFilter(btn.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer h-auto ${
                                isActive
                                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 text-teal-800 hover:bg-white"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                              }`}
                            >
                              {btn.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                      <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
                        <h4 className="font-black text-xs uppercase tracking-wider text-white">
                          Trial Balance Ledger Postings
                        </h4>
                        <span className="text-[11px] font-mono text-emerald-300 font-bold">
                          Double Entry Verification
                        </span>
                      </div>

                      <Table className="w-full text-xs text-left">
                        <TableHead className="bg-slate-50/95 border-b border-slate-200">
                          <TableHeaderCell className="py-3 px-5 w-28 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Account Code
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-5 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Account Name &amp; Description
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-5 w-32 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Classification
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-5 text-right w-40 text-slate-700 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Debit Balance (AED)
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-5 text-right w-40 text-slate-700 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Credit Balance (AED)
                          </TableHeaderCell>
                        </TableHead>

                        <TableBody className="divide-y divide-slate-100">
                          {filteredRows.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="py-12 text-center text-slate-400 italic"
                              >
                                No accounts match the current filter criteria.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredRows.map((r: TrialBalanceRow) => {
                              const typeColors: Record<string, string> = {
                                ASSET:
                                  "bg-sky-50 text-sky-800 border-sky-200/80",
                                LIABILITY:
                                  "bg-amber-50 text-amber-800 border-amber-200/80",
                                EQUITY:
                                  "bg-purple-50 text-purple-800 border-purple-200/80",
                                REVENUE:
                                  "bg-emerald-50 text-emerald-800 border-emerald-200/80",
                                EXPENSE:
                                  "bg-rose-50 text-rose-800 border-rose-200/80",
                              };

                              return (
                                <TableRow
                                  key={r.accountId}
                                  className="hover:bg-slate-50/60 text-slate-700 transition-colors"
                                >
                                  <TableCell className="py-2.5 px-5 font-mono font-bold text-slate-900 text-[11px]">
                                    {r.accountCode || "—"}
                                  </TableCell>
                                  <TableCell className="py-2.5 px-5 font-semibold text-slate-900">
                                    {r.accountName || "Unnamed Account"}
                                  </TableCell>
                                  <TableCell className="py-2.5 px-5">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                        typeColors[r.type || ""] ||
                                        "bg-slate-50 text-slate-600 border-slate-200"
                                      }`}
                                    >
                                      {r.type || "OTHER"}
                                    </span>
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    className="py-2.5 px-5 text-right font-mono font-bold text-slate-900"
                                  >
                                    {r.debit > 0 ? formatNumber(r.debit) : "—"}
                                  </TableCell>
                                  <TableCell
                                    align="right"
                                    className="py-2.5 px-5 text-right font-mono font-bold text-slate-900"
                                  >
                                    {r.credit > 0
                                      ? formatNumber(r.credit)
                                      : "—"}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}

                          <TableRow className="bg-slate-900 text-white font-black">
                            <TableCell
                              colSpan={3}
                              className="py-4 px-5 text-xs uppercase tracking-wider font-bold"
                            >
                              TOTAL TRIAL BALANCE (DEBITS &amp; CREDITS)
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-4 px-5 text-right font-mono font-black text-sm text-emerald-400"
                            >
                              {formatNumber(totalDebit)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-4 px-5 text-right font-mono font-black text-sm text-emerald-400"
                            >
                              {formatNumber(totalCredit)}
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
                              colSpan={3}
                              className="py-3.5 px-5 text-xs uppercase tracking-wider font-bold"
                            >
                              AUDIT RECONCILIATION VARIANCE (DEBITS - CREDITS)
                            </TableCell>
                            <TableCell
                              colSpan={2}
                              align="right"
                              className={`py-3.5 px-5 text-right font-mono font-black text-sm ${
                                isBalanced
                                  ? "text-emerald-700"
                                  : "text-amber-700"
                              }`}
                            >
                              {isBalanced
                                ? "0.00 (In Balance)"
                                : formatNumber(difference)}
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
