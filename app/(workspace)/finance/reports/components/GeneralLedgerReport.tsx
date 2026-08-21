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
import { ChartOfAccount, LedgerReport as LedgerData } from "@/lib/hooks/api-hooks";
import { formatCurrency, formatNumber } from "./types";

interface GeneralLedgerReportProps {
  accounts?: ChartOfAccount[];
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  selectedAccount?: ChartOfAccount;
  ledger?: LedgerData;
  isLoading: boolean;
}

export const GeneralLedgerReport: React.FC<GeneralLedgerReportProps> = ({
  accounts,
  selectedAccountId,
  setSelectedAccountId,
  selectedAccount,
  ledger,
  isLoading,
}) => {
  const lines = ledger?.lines || [];
  const totalDebit = Number(ledger?.totalDebit || 0);
  const totalCredit = Number(ledger?.totalCredit || 0);
  const netBalance = Number(ledger?.netBalance !== undefined ? ledger.netBalance : ledger?.balance || 0);

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-base text-slate-900">
            General Ledger Drilldown & Running Balance
          </h3>
          <p className="text-xs text-slate-500">
            Inspect complete chronological transaction history, debit/credit postings, and running balances by account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-full sm:w-80">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800"
            >
              <option value="">Select an Account to Drill Down...</option>
              {accounts?.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountCode} - {acc.accountName} ({acc.type})
                </option>
              ))}
            </select>
          </div>

          {selectedAccountId && (
            <Button
              variant="outline"
              size="sm"
              icon={<PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />}
              onClick={() => window.print()}
              className="print:hidden"
            >
              Print / Save PDF
            </Button>
          )}
        </div>
      </div>

      {!selectedAccountId ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-black">
            📖
          </div>
          <p className="text-sm font-bold text-slate-800">
            Select an Account to View Ledger History
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Choose any Asset, Liability, Equity, Revenue, or Expense account from the dropdown above to view its running balance and journal lines.
          </p>
        </div>
      ) : isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
          Loading Ledger lines & running balance...
        </div>
      ) : lines.length === 0 ? (
        <div className="py-12 text-center border border-slate-200 rounded-2xl bg-slate-50/30 text-slate-500 space-y-1">
          <p className="text-sm font-semibold text-slate-700">
            No Journal Lines Recorded Yet
          </p>
          <p className="text-xs text-slate-400">
            There are no transaction lines posted to account{" "}
            <span className="font-mono font-bold text-slate-700">
              {selectedAccount?.accountCode} - {selectedAccount?.accountName}
            </span>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  1. Total Debits
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Sum of all debit postings
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
                  Sum of all credit postings
                </p>
              </div>
              <p className="text-xl font-black text-blue-900 font-mono">
                {formatCurrency(totalCredit)}
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between space-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
                  3. Transactions Count
                </p>
                <p className="text-xs text-purple-700 mt-0.5">
                  Posted journal lines
                </p>
              </div>
              <p className="text-xl font-black text-purple-950 font-mono">
                {lines.length} Line Items
              </p>
            </div>

            <div className="p-4.5 rounded-2xl bg-slate-900 text-white flex flex-col justify-between space-y-2 shadow-xs">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    4. Net Account Balance
                  </p>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {selectedAccount?.type || "ACCOUNT"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {ledger?.isDebitNormal ? "Debit Normal (Dr - Cr)" : "Credit Normal (Cr - Dr)"}
                </p>
              </div>
              <p
                className={`text-xl font-black font-mono ${
                  netBalance >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatCurrency(netBalance)}
              </p>
            </div>
          </div>

          {/* Account Details Header */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-black px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                {selectedAccount?.accountCode || "AC"}
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {selectedAccount?.accountName}
                </h4>
                <p className="text-[11px] text-slate-500">
                  Classification: {selectedAccount?.type}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-700">
              Showing {lines.length} chronological ledger entries
            </span>
          </div>

          {/* Ledger Lines Table with Running Balance */}
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <Table className="w-full text-xs text-left">
              <TableHead className="bg-slate-50/90 border-b border-slate-200">
                <TableHeaderCell className="py-3 px-4 w-28 text-slate-500 font-bold uppercase text-[11px] tracking-wider">Date</TableHeaderCell>
                <TableHeaderCell className="py-3 px-4 w-32 text-slate-500 font-bold uppercase text-[11px] tracking-wider">Voucher #</TableHeaderCell>
                <TableHeaderCell className="py-3 px-4 w-28 text-slate-500 font-bold uppercase text-[11px] tracking-wider">Ref / Folio</TableHeaderCell>
                <TableHeaderCell className="py-3 px-4 text-slate-500 font-bold uppercase text-[11px] tracking-wider">Description / Narration</TableHeaderCell>
                <TableHeaderCell align="right" className="py-3 px-4 text-right w-28 text-slate-500 font-bold uppercase text-[11px] tracking-wider">Debit (AED)</TableHeaderCell>
                <TableHeaderCell align="right" className="py-3 px-4 text-right w-28 text-slate-500 font-bold uppercase text-[11px] tracking-wider">Credit (AED)</TableHeaderCell>
                <TableHeaderCell align="right" className="py-3 px-4 text-right w-36 bg-slate-100/70 text-slate-500 font-bold uppercase text-[11px] tracking-wider">Running Balance</TableHeaderCell>
              </TableHead>
              <TableBody className="divide-y divide-slate-100">
                {lines.map((l: any) => (
                  <TableRow key={l.id} className="hover:bg-slate-50/50 text-slate-700 transition">
                    <TableCell className="py-2.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {l.journalEntry?.entryDate
                        ? new Date(l.journalEntry.entryDate).toLocaleDateString("en-GB")
                        : "—"}
                    </TableCell>
                    <TableCell className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {l.journalEntry?.entryNumber || "—"}
                    </TableCell>
                    <TableCell className="py-2.5 px-4 font-mono text-slate-500">
                      {l.journalEntry?.reference || "—"}
                    </TableCell>
                    <TableCell className="py-2.5 px-4 text-slate-800 font-medium">
                      {l.journalEntry?.description || "Journal Posting"}
                    </TableCell>
                    <TableCell align="right" className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                      {Number(l.debit) > 0 ? formatNumber(l.debit) : "—"}
                    </TableCell>
                    <TableCell align="right" className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900">
                      {Number(l.credit) > 0 ? formatNumber(l.credit) : "—"}
                    </TableCell>
                    <TableCell align="right" className="py-2.5 px-4 text-right font-mono font-black text-slate-900 bg-slate-50/40">
                      {formatCurrency(l.runningBalance)}
                    </TableCell>
                  </TableRow>
                ))}

                {/* SUMMARY TOTALS ROW */}
                <TableRow className="bg-slate-900 text-white font-black">
                  <TableCell colSpan={4} className="py-3.5 px-4 text-xs uppercase tracking-wider font-bold">
                    TOTAL ACCOUNT ACTIVITY
                  </TableCell>
                  <TableCell align="right" className="py-3.5 px-4 text-right font-mono font-black text-sm text-emerald-400">
                    {formatNumber(totalDebit)}
                  </TableCell>
                  <TableCell align="right" className="py-3.5 px-4 text-right font-mono font-black text-sm text-emerald-400">
                    {formatNumber(totalCredit)}
                  </TableCell>
                  <TableCell align="right" className="py-3.5 px-4 text-right font-mono font-black text-sm text-emerald-400 bg-slate-950">
                    {formatCurrency(netBalance)}
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
