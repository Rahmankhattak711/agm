"use client";

import React, { useState, useMemo } from "react";
import { PrintIcon, SearchIcon } from "@/components/icons";
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
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Layers,
  Search,
  Filter,
} from "lucide-react";

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
                      General Ledger Verification
                    </span>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      TRIAL BALANCE AUDIT
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-700 font-mono font-bold text-xs">
                      {isBalanced ? "Debits = Credits (Balanced)" : "Audit Review"}
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      Printed: {new Date().toLocaleDateString("en-GB")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 print:hidden">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-1 rounded-lg bg-teal-700 text-white font-black text-xs shadow-xs">
                        TB
                      </span>
                      <h3 className="font-black text-lg text-slate-900 tracking-tight">
                        Trial Balance Audit Statement
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      AGM FITOUT TECHNICAL SERVICES LLC — Comprehensive debit
                      &amp; <br /> credit audit across all active chart of
                      accounts
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
                      {isBalanced ? "In Balance" : "Variance Detected"}
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
                    <p>Calculating Trial Balance Ledger...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-4 print:gap-2.5 print-avoid-break">
                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
                        <div>
                          <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            1. Total Debits
                          </span>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            Assets &amp; Expense Postings
                          </span>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                            AED
                          </span>
                          <span className="text-xl print:text-base font-black text-slate-900 font-mono">
                            {formatNumber(totalDebit)}
                          </span>
                        </div>
                      </div>

                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
                        <div>
                          <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            2. Total Credits
                          </span>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            Liabilities, Equity &amp; Revenue
                          </span>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                            AED
                          </span>
                          <span className="text-xl print:text-base font-black text-slate-900 font-mono">
                            {formatNumber(totalCredit)}
                          </span>
                        </div>
                      </div>

                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-indigo-500" />
                        <div>
                          <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            3. Active Ledgers
                          </span>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            Chart of Accounts Monitored
                          </span>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xl print:text-base font-black text-slate-900 font-mono">
                            {allRows.length}
                          </span>
                          <span className="text-xs font-bold text-slate-500 font-sans ml-1.5">
                            Accounts
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
                              4. Ledger Equality
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                isBalanced
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {isBalanced ? "In Balance" : "Variance"}
                            </span>
                          </div>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            Total Debits - Total Credits
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
                            {isBalanced ? "0.00" : formatNumber(difference)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs print:hidden">
                      <div className="max-w-xs flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Filter by account code or title..."
                            value={tbSearch}
                            onChange={(e) => setTbSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-teal-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1">
                        {typeFilterOptions.map((btn) => {
                          const isActive = tbTypeFilter === btn.id;
                          return (
                            <button
                              key={btn.id}
                              type="button"
                              onClick={() => setTbTypeFilter(btn.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isActive
                                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 text-teal-800"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                              }`}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs print-avoid-break">
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
