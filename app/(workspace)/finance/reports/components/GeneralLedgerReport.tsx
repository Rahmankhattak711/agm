"use client";

import React from "react";
import { BookOpenIcon, PrintIcon } from "@/components/icons";
import {
  Button,
  Select,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui";
import {
  ChartOfAccount,
  LedgerReport as LedgerData,
} from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
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
  const netBalance = Number(
    ledger?.netBalance !== undefined ? ledger.netBalance : ledger?.balance || 0,
  );

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
                      General Ledger Audit Statement
                    </span>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      GENERAL LEDGER ACCOUNT DETAIL
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-700 font-mono font-bold text-xs">
                      {selectedAccount
                        ? `${selectedAccount.accountCode} - ${selectedAccount.accountName}`
                        : "All GL Accounts"}
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      Printed: {new Date().toLocaleDateString("en-GB")}
                    </p>
                  </div>
                </div>

                {/* Header Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 print:hidden">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-700 text-white font-black text-xs shadow-xs">
                        GL
                      </span>
                      <h3 className="font-black text-lg text-slate-900 tracking-tight">
                        General Ledger Drilldown &amp; Running Balance
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Inspect complete chronological transaction history,
                      debit/credit postings, and running balances by account.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="w-full sm:w-80">
                      <Select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="w-full text-xs font-bold text-slate-800 cursor-pointer"
                      >
                        <option value="">
                          Select an Account to Drill Down...
                        </option>
                        {accounts?.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.accountCode} - {acc.accountName} ({acc.type})
                          </option>
                        ))}
                      </Select>
                    </div>

                    {selectedAccountId && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<PrintIcon size={14} />}
                        onClick={() => window.print()}
                        className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
                      >
                        Print Statement
                      </Button>
                    )}
                  </div>
                </div>

                {!selectedAccountId ? (
                  <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
                      <BookOpenIcon size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Select an Account to View Ledger History
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        Choose any Asset, Liability, Equity, Revenue, or Expense
                        account from the dropdown above to view its running
                        balance and journal lines.
                      </p>
                    </div>
                  </div>
                ) : isLoading ? (
                  <div className="py-16 text-center text-xs text-slate-400 animate-pulse space-y-2">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
                    <p>
                      Calculating General Ledger &amp; Running Balance for{" "}
                      {selectedAccount?.accountName}...
                    </p>
                  </div>
                ) : lines.length === 0 ? (
                  <div className="py-16 text-center border border-slate-200 rounded-2xl bg-slate-50/40 text-slate-500 space-y-2">
                    <p className="text-sm font-bold text-slate-700">
                      No Journal Lines Recorded Yet
                    </p>
                    <p className="text-xs text-slate-400">
                      There are no transaction lines posted to account{" "}
                      <span className="font-mono font-bold text-slate-700">
                        {selectedAccount?.accountCode} -{" "}
                        {selectedAccount?.accountName}
                      </span>
                      .
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* 4 Summary Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-4 print:gap-2.5 print-avoid-break">
                      {/* 1. Total Debits */}
                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
                        <div>
                          <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            1. Total Debits
                          </span>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            Sum of all debit postings
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

                      {/* 2. Total Credits */}
                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
                        <div>
                          <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            2. Total Credits
                          </span>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            Sum of all credit postings
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

                      {/* 3. Journal Lines */}
                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-indigo-500" />
                        <div>
                          <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            3. Journal Lines
                          </span>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            Posted audit transactions
                          </span>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xl print:text-base font-black text-slate-900 font-mono">
                            {lines.length}
                          </span>
                          <span className="text-xs font-bold text-slate-500 font-sans ml-1.5">
                            Line Items
                          </span>
                        </div>
                      </div>

                      {/* 4. Net Account Balance */}
                      <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-teal-500" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              4. Net Account Balance
                            </span>
                            <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/70">
                              {selectedAccount?.type || "ACCOUNT"}
                            </span>
                          </div>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            {ledger?.isDebitNormal
                              ? "Debit Normal (Dr - Cr)"
                              : "Credit Normal (Cr - Dr)"}
                          </span>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                            AED
                          </span>
                          <span className="text-xl print:text-base font-black text-slate-900 font-mono">
                            {formatNumber(netBalance)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Account Identity Strip */}
                    <div className="p-3.5 px-5 rounded-2xl bg-slate-100/90 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-[#1d2f3f] text-white shadow-2xs">
                          {selectedAccount?.accountCode || "AC"}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">
                            {selectedAccount?.accountName}
                          </h4>
                          <p className="text-[10.5px] text-slate-500">
                            Classification:{" "}
                            <span className="font-semibold text-slate-700">
                              {selectedAccount?.type}
                            </span>{" "}
                            • Currency: AED
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-600">
                        {lines.length} Chronological Transactions
                      </span>
                    </div>

                    {/* General Ledger Table */}
                    <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs print-avoid-break">
                      <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
                        <h4 className="font-black text-xs uppercase tracking-wider text-white">
                          General Ledger Journal Lines &amp; Running Balance
                        </h4>
                        <span className="text-[11px] font-mono text-emerald-300 font-bold">
                          Chronological Audit Trail
                        </span>
                      </div>

                      <Table className="w-full text-xs text-left">
                        <TableHead className="bg-slate-50/95 border-b border-slate-200">
                          <TableHeaderCell className="py-3 px-4 w-28 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Date
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 w-32 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Voucher #
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 w-28 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Ref / Folio
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Description / Narration
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-4 text-right w-32 text-slate-700 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Debit (AED)
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-4 text-right w-32 text-slate-700 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Credit (AED)
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-4 text-right w-36 bg-slate-100/90 text-slate-800 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Running Balance
                          </TableHeaderCell>
                        </TableHead>

                        <TableBody className="divide-y divide-slate-100">
                          {lines.map((l: any) => (
                            <TableRow
                              key={l.id}
                              className="hover:bg-slate-50/60 text-slate-700 transition-colors text-xs"
                            >
                              <TableCell className="py-2.5 px-4 text-slate-600 font-medium whitespace-nowrap text-[11px]">
                                {l.journalEntry?.entryDate
                                  ? new Date(
                                      l.journalEntry.entryDate,
                                    ).toLocaleDateString("en-GB")
                                  : "—"}
                              </TableCell>
                              <TableCell className="py-2.5 px-4 font-mono font-bold text-slate-900 text-[11px]">
                                {l.journalEntry?.entryNumber || "—"}
                              </TableCell>
                              <TableCell className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                                {l.journalEntry?.reference || "—"}
                              </TableCell>
                              <TableCell className="py-2.5 px-4 text-slate-800 font-medium">
                                {l.journalEntry?.description ||
                                  "Journal Posting"}
                              </TableCell>
                              <TableCell
                                align="right"
                                className="py-2.5 px-4 text-right font-mono font-bold text-slate-900"
                              >
                                {Number(l.debit) > 0
                                  ? formatNumber(l.debit)
                                  : "—"}
                              </TableCell>
                              <TableCell
                                align="right"
                                className="py-2.5 px-4 text-right font-mono font-bold text-slate-900"
                              >
                                {Number(l.credit) > 0
                                  ? formatNumber(l.credit)
                                  : "—"}
                              </TableCell>
                              <TableCell
                                align="right"
                                className="py-2.5 px-4 text-right font-mono font-black text-slate-900 bg-slate-50/70"
                              >
                                {formatCurrency(l.runningBalance)}
                              </TableCell>
                            </TableRow>
                          ))}

                          {/* TOTAL ROW */}
                          <TableRow className="bg-slate-900 text-white font-black">
                            <TableCell
                              colSpan={4}
                              className="py-4 px-4 text-xs uppercase tracking-wider font-bold"
                            >
                              TOTAL ACCOUNT ACTIVITY
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-4 px-4 text-right font-mono font-black text-sm text-emerald-400"
                            >
                              {formatNumber(totalDebit)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-4 px-4 text-right font-mono font-black text-sm text-emerald-400"
                            >
                              {formatNumber(totalCredit)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="py-4 px-4 text-right font-mono font-black text-sm text-emerald-400 bg-slate-950"
                            >
                              {formatCurrency(netBalance)}
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

export default GeneralLedgerReport;
