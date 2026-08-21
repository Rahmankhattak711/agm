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
import { TrialBalanceReport as TrialBalanceData, TrialBalanceRow } from "@/lib/hooks/api-hooks";
import { formatCurrency, formatNumber } from "./types";

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

  const allRows: TrialBalanceRow[] = trialBalance?.rows || [];

  const filteredRows = useMemo(() => {
    return allRows.filter((r: TrialBalanceRow) => {
      const matchesSearch =
        !tbSearch ||
        (r.accountName && r.accountName.toLowerCase().includes(tbSearch.toLowerCase())) ||
        (r.accountCode && r.accountCode.toLowerCase().includes(tbSearch.toLowerCase()));
      const matchesType =
        tbTypeFilter === "ALL" || (r.type && r.type.toUpperCase() === tbTypeFilter);
      return matchesSearch && matchesType;
    });
  }, [allRows, tbSearch, tbTypeFilter]);

  const totalDebit =
    trialBalance?.totalDebit !== undefined
      ? trialBalance.totalDebit
      : allRows.reduce((s: number, r: TrialBalanceRow) => s + Number(r.debit || 0), 0);
  const totalCredit =
    trialBalance?.totalCredit !== undefined
      ? trialBalance.totalCredit
      : allRows.reduce((s: number, r: TrialBalanceRow) => s + Number(r.credit || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-base text-slate-900">
            Trial Balance Summary
          </h3>
          <p className="text-xs text-slate-500">
            AGM FITOUT TECHNICAL SERVICES LLC — Comprehensive debit and credit audit across active general ledger accounts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isBalanced
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {isBalanced ? "✓ In Balance" : "⚠️ Variance"}
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
          Loading Trial Balance...
        </div>
      ) : (
        <div className="space-y-6">
          {/* 4 KPI Top Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  1. Total Debits
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Assets & expense ledger postings
                </p>
              </div>
              <p className="text-xl font-black text-emerald-900 font-mono">
                {formatCurrency(totalDebit)}
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                  2. Total Credits
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Liabilities, equity & revenues
                </p>
              </div>
              <p className="text-xl font-black text-blue-900 font-mono">
                {formatCurrency(totalCredit)}
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between space-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
                  3. Accounts Count
                </p>
                <p className="text-xs text-purple-700 mt-0.5">
                  Active chart of accounts
                </p>
              </div>
              <p className="text-xl font-black text-purple-950 font-mono">
                {allRows.length} Accounts
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-900 text-white flex flex-col justify-between space-y-2 shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    4. Audit Status
                  </p>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isBalanced
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {isBalanced ? "Balanced" : "Diff"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Difference: {formatCurrency(difference)}
                </p>
              </div>
              <p
                className={`text-xl font-black font-mono ${
                  isBalanced ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {isBalanced ? "0.00 Variance" : formatCurrency(difference)}
              </p>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
            <div className="max-w-sm flex-1">
              <Input
                placeholder="Search accounts by name or code..."
                value={tbSearch}
                onChange={(e) => setTbSearch(e.target.value)}
                leftIcon={<SearchIcon className="w-4 h-4 text-slate-400" strokeWidth={2} />}
                className="bg-slate-50 border-slate-200 text-xs"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {["ALL", "ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={tbTypeFilter === type ? "dark" : "secondary"}
                  size="sm"
                  onClick={() => setTbTypeFilter(type)}
                  className="text-[11px]"
                >
                  {type === "ALL" ? "All Types" : type}
                </Button>
              ))}
            </div>
          </div>

          {/* Detailed Statement Table */}
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <Table className="w-full text-xs text-left">
              <TableHead className="bg-slate-50/90 border-b border-slate-200">
                <TableHeaderCell className="py-3 px-5 w-24 text-slate-500 font-bold uppercase text-[11px] tracking-wider">Code</TableHeaderCell>
                <TableHeaderCell className="py-3 px-5 text-slate-500 font-bold uppercase text-[11px] tracking-wider">Account Name</TableHeaderCell>
                <TableHeaderCell className="py-3 px-5 w-32 text-slate-500 font-bold uppercase text-[11px] tracking-wider">Type</TableHeaderCell>
                <TableHeaderCell align="right" className="py-3 px-5 text-right w-36 text-slate-500 font-bold uppercase text-[11px] tracking-wider">Debit (AED)</TableHeaderCell>
                <TableHeaderCell align="right" className="py-3 px-5 text-right w-36 text-slate-500 font-bold uppercase text-[11px] tracking-wider">Credit (AED)</TableHeaderCell>
              </TableHead>
              <TableBody className="divide-y divide-slate-100">
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-400">
                      No accounts match the current filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((r: TrialBalanceRow) => {
                    const typeColors: Record<string, string> = {
                      ASSET: "bg-blue-50 text-blue-700 border-blue-200",
                      LIABILITY: "bg-orange-50 text-orange-700 border-orange-200",
                      EQUITY: "bg-purple-50 text-purple-700 border-purple-200",
                      REVENUE: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      EXPENSE: "bg-rose-50 text-rose-700 border-rose-200",
                    };

                    return (
                      <TableRow key={r.accountId} className="hover:bg-slate-50/50 text-slate-700 transition">
                        <TableCell className="py-2.5 px-5 font-mono font-bold text-slate-900">
                          {r.accountCode || "—"}
                        </TableCell>
                        <TableCell className="py-2.5 px-5 font-semibold text-slate-900">
                          {r.accountName || "Unnamed Account"}
                        </TableCell>
                        <TableCell className="py-2.5 px-5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                              typeColors[r.type || ""] || "bg-slate-50 text-slate-600 border-slate-200"
                            }`}
                          >
                            {r.type || "OTHER"}
                          </span>
                        </TableCell>
                        <TableCell align="right" className="py-2.5 px-5 text-right font-mono font-semibold text-slate-900">
                          {r.debit > 0 ? formatNumber(r.debit) : "—"}
                        </TableCell>
                        <TableCell align="right" className="py-2.5 px-5 text-right font-mono font-semibold text-slate-900">
                          {r.credit > 0 ? formatNumber(r.credit) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}

                {/* SUMMARY TOTALS ROW */}
                <TableRow className="bg-slate-900 text-white font-black">
                  <TableCell colSpan={3} className="py-3.5 px-5 text-xs uppercase tracking-wider font-bold">
                    TOTAL TRIAL BALANCE
                  </TableCell>
                  <TableCell align="right" className="py-3.5 px-5 text-right font-mono font-black text-sm text-emerald-400">
                    {formatNumber(totalDebit)}
                  </TableCell>
                  <TableCell align="right" className="py-3.5 px-5 text-right font-mono font-black text-sm text-emerald-400">
                    {formatNumber(totalCredit)}
                  </TableCell>
                </TableRow>

                {/* AUDIT STATUS ROW */}
                <TableRow
                  className={`font-black ${
                    isBalanced
                      ? "bg-emerald-50 text-emerald-950"
                      : "bg-amber-50 text-amber-950"
                  }`}
                >
                  <TableCell colSpan={3} className="py-3 px-5 text-xs uppercase tracking-wider font-bold">
                    DIFFERENCE / VARIANCE (DEBITS - CREDITS)
                  </TableCell>
                  <TableCell
                    colSpan={2}
                    align="right"
                    className={`py-3 px-5 text-right font-mono font-black text-sm ${
                      isBalanced ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {isBalanced ? "0.00 (In Balance)" : formatNumber(difference)}
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
