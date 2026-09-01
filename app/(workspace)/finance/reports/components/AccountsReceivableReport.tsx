"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Clock,
  Filter,
  Phone,
  Printer,
  Search,
  User,
  Building2,
  Receipt,
  FileText,
  Mail,
  ShieldCheck,
  CreditCard,
  Layers,
  X,
  CheckCircle2,
  AlertTriangle,
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
import { useReceivables } from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { formatCurrency, formatNumber } from "./types";

export const AccountsReceivableReport: React.FC = () => {
  const { data: receivables, isLoading } = useReceivables();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBucket, setSelectedBucket] = useState<string>("ALL");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const items = (receivables as any)?.items || [];
  const aging = receivables?.aging || {
    current: 0,
    days30: 0,
    days60: 0,
    days90Plus: 0,
  };

  const filteredItems = items.filter((item: any) => {
    const matchesSearch =
      item.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.createdByUser?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBucket =
      selectedBucket === "ALL" || item.agingBucket === selectedBucket;

    return matchesSearch && matchesBucket;
  });

  const totalFilteredAmount = filteredItems.reduce(
    (s: number, i: any) => s + (i.remainingBalance ?? i.totalAmount ?? 0),
    0,
  );

  const handlePrint = () => {
    window.print();
  };

  const agingPills = [
    { key: "ALL", label: "All Receivables" },
    { key: "current", label: "0–30 Days (Current)" },
    { key: "days30", label: "31–60 Days" },
    { key: "days60", label: "61–90 Days" },
    { key: "days90Plus", label: "90+ Days (Critical)" },
  ];

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6 print:p-0 print:m-0 print:border-none">
      <table className="print-page-table w-full border-collapse">
        <thead className="print-page-header-group">
          <tr>
            <th className="p-0 font-normal text-left border-none">
              <div className="hidden print:block mb-4">
                <QuotationHeader />
                <div className="px-6 pt-3 pb-2 border-b border-slate-200 flex justify-between items-end">
                  <div>
                    <h1 className="text-lg font-black text-slate-900 uppercase">
                      Accounts Receivable &amp; Client Aging Statement
                    </h1>
                    <p className="text-xs text-slate-500">
                      AGM FITOUT TECHNICAL SERVICES LLC — Customer Balances
                      &amp; Overdue Aging Breakdown
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Printed: {new Date().toLocaleDateString("en-GB")}
                  </p>
                </div>
              </div>
            </th>
          </tr>
        </thead>

        <tfoot className="print-page-footer-group">
          <tr>
            <td className="p-0 border-none">
              <div className="h-[150px] w-full hidden print:block" />
            </td>
          </tr>
        </tfoot>

        <tbody className="print-page-body-group">
          <tr>
            <td className="p-0 border-none align-top">
              <div className="space-y-6">
                {}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 print:hidden">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-black text-xs shadow-xs">
                        A/R
                      </span>
                      <h3 className="font-black text-lg text-slate-900 tracking-tight">
                        Accounts Receivable &amp; Client Aging
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Real-time accounts receivable balances mapped to GL
                      Account{" "}
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        1200 - Accounts Receivable (Asset)
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
                      icon={<Printer size={14} />}
                    >
                      Print Statement
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="py-16 text-center text-xs text-slate-400 animate-pulse space-y-2">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mx-auto" />
                    <p>
                      Calculating Accounts Receivable &amp; Aging Schedule...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 print:grid-cols-5 gap-3.5 print:gap-2 print-avoid-break">
                      {}
                      <div className="relative overflow-hidden p-4.5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-rose-500" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Total Outstanding
                            </span>
                            <Receipt size={14} className="text-rose-600" />
                          </div>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            {items.length} Active Client Accounts
                          </span>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                            AED
                          </span>
                          <span className="text-xl print:text-base font-black text-rose-700 font-mono">
                            {formatNumber(receivables?.totalReceivables || 0)}
                          </span>
                        </div>
                      </div>

                      {}
                      <div className="relative overflow-hidden p-4.5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Current (0–30d)
                            </span>
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          </div>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            Normal Credit Terms
                          </span>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                            AED
                          </span>
                          <span className="text-xl print:text-base font-black text-emerald-800 font-mono">
                            {formatNumber(aging.current)}
                          </span>
                        </div>
                      </div>

                      {}
                      <div className="relative overflow-hidden p-4.5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-blue-500" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              31–60 Days
                            </span>
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                          </div>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            First Follow-up
                          </span>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                            AED
                          </span>
                          <span className="text-xl print:text-base font-black text-blue-800 font-mono">
                            {formatNumber(aging.days30)}
                          </span>
                        </div>
                      </div>

                      {}
                      <div className="relative overflow-hidden p-4.5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-amber-500" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              61–90 Days
                            </span>
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                          </div>
                          <span className="text-xs print:text-[11px] text-slate-500 mt-0.5 block truncate">
                            Overdue Notice
                          </span>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                            AED
                          </span>
                          <span className="text-xl print:text-base font-black text-amber-700 font-mono">
                            {formatNumber(aging.days60)}
                          </span>
                        </div>
                      </div>

                      {}
                      <div className="relative overflow-hidden p-4.5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                        <div className="absolute inset-x-0 top-0 h-[2.5px] bg-rose-600" />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              90+ Days Critical
                            </span>
                            <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
                          </div>
                          <span className="text-xs print:text-[11px] text-rose-600 font-bold mt-0.5 block truncate">
                            High Risk Recovery
                          </span>
                        </div>
                        <div className="pt-2 print:pt-0">
                          <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                            AED
                          </span>
                          <span className="text-xl print:text-base font-black text-rose-700 font-mono">
                            {formatNumber(aging.days90Plus)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {}
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-2 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs print:hidden">
                      <div className="relative flex-1 w-full max-w-sm">
                        <Search
                          size={14}
                          className="absolute left-3 top-2.5 text-slate-400"
                        />
                        <input
                          type="text"
                          placeholder="Search client, invoice, project, or user..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
                        />
                      </div>

                      <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                        {agingPills.map((tab) => (
                          <button
                            key={tab.key}
                            type="button"
                            onClick={() => setSelectedBucket(tab.key)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                              selectedBucket === tab.key
                                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 text-emerald-800"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs print-avoid-break">
                      <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
                        <h4 className="font-black text-xs uppercase tracking-wider text-white">
                          Customer Aging &amp; Outstanding Invoices Ledger
                        </h4>
                        <span className="text-[11px] font-mono text-emerald-300 font-bold">
                          GL 1200 • Trade Receivables
                        </span>
                      </div>

                      <Table className="w-full text-xs text-left">
                        <TableHead className="bg-slate-50/95 border-b border-slate-200">
                          <TableHeaderCell className="py-3 px-4 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Invoice / Ref
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Client &amp; TRN
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Impacted GL
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Created By
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Issue Date
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Aging Status
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-4 text-right text-slate-700 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Total Billed (AED)
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-4 text-right text-slate-700 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Balance Due (AED)
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 text-center w-24 text-slate-600 font-bold uppercase text-[10px] tracking-wider print:hidden">
                            Action
                          </TableHeaderCell>
                        </TableHead>

                        <TableBody className="divide-y divide-slate-100">
                          {filteredItems.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={9}
                                className="text-center py-12 text-slate-400 text-xs italic"
                              >
                                No accounts receivable records match your search
                                criteria.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredItems.map((item: any) => {
                              const rem =
                                item.remainingBalance ?? item.totalAmount ?? 0;

                              return (
                                <TableRow
                                  key={item.id}
                                  className="hover:bg-slate-50/60 text-slate-700 transition-colors text-xs"
                                >
                                  <TableCell className="py-2.5 px-4 font-mono font-bold text-slate-900">
                                    <div className="flex items-center gap-1.5">
                                      <Receipt
                                        size={13}
                                        className="text-emerald-700 shrink-0"
                                      />
                                      <span>{item.reference}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-sans truncate max-w-[140px] mt-0.5">
                                      {item.project}
                                    </p>
                                  </TableCell>

                                  <TableCell className="py-2.5 px-4">
                                    <p className="font-bold text-slate-900">
                                      {item.customer}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-mono">
                                      TRN: {item.customerTrn || "—"}
                                    </p>
                                  </TableCell>

                                  <TableCell className="py-2.5 px-4">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold font-mono">
                                      1200 - AR
                                    </span>
                                  </TableCell>

                                  <TableCell className="py-2.5 px-4">
                                    <div className="flex items-center gap-1.5">
                                      <div className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-bold">
                                        {(item.createdByUser || "U")[0]}
                                      </div>
                                      <div>
                                        <p className="font-medium text-slate-800 text-[11px] leading-tight">
                                          {item.createdByUser || "System"}
                                        </p>
                                        <p className="text-[9.5px] text-slate-400 leading-tight">
                                          {item.createdUserRole || "Admin"}
                                        </p>
                                      </div>
                                    </div>
                                  </TableCell>

                                  <TableCell className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                                    {item.date}
                                  </TableCell>

                                  <TableCell className="py-2.5 px-4">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        item.agingBucket === "current"
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                          : item.agingBucket === "days30"
                                            ? "bg-blue-50 text-blue-800 border-blue-200"
                                            : item.agingBucket === "days60"
                                              ? "bg-amber-50 text-amber-800 border-amber-200"
                                              : "bg-rose-50 text-rose-800 border-rose-200"
                                      }`}
                                    >
                                      <Clock size={10} />
                                      {item.daysOutstanding}d (
                                      {item.agingBucket})
                                    </span>
                                  </TableCell>

                                  <TableCell
                                    align="right"
                                    className="py-2.5 px-4 text-right font-mono font-medium text-slate-600"
                                  >
                                    {formatNumber(item.totalAmount)}
                                  </TableCell>

                                  <TableCell
                                    align="right"
                                    className="py-2.5 px-4 text-right font-mono font-bold text-rose-700"
                                  >
                                    {formatNumber(rem)}
                                  </TableCell>

                                  <TableCell className="py-2.5 px-4 text-center print:hidden">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedItem(item)}
                                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                    >
                                      View Details
                                    </button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>

                      <div className="bg-slate-50/95 p-3.5 px-5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-600">
                        <span>
                          Showing <strong>{filteredItems.length}</strong> of{" "}
                          <strong>{items.length}</strong> receivable records
                        </span>
                        <div className="font-bold text-xs text-slate-800">
                          Filtered Total Outstanding:{" "}
                          <span className="text-rose-700 font-mono text-sm ml-1">
                            {formatCurrency(totalFilteredAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedItem && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
                      <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] p-5 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Receipt className="text-emerald-300" size={20} />
                          <div>
                            <h3 className="font-bold text-base">
                              Receivable Audit Breakdown
                            </h3>
                            <p className="text-[11px] text-white/70">
                              Ref: {selectedItem.reference}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedItem(null)}
                          className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="p-6 space-y-4 text-xs text-slate-700">
                        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              Client / Debtor
                            </p>
                            <p className="font-bold text-slate-900 text-sm mt-0.5">
                              {selectedItem.customer}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              TRN: {selectedItem.customerTrn || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              Contact Details
                            </p>
                            <p className="text-slate-600 mt-0.5">
                              {selectedItem.customerEmail || "—"}
                            </p>
                            <p className="text-slate-600">
                              {selectedItem.customerPhone || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                            <p className="text-[10px] font-bold uppercase text-emerald-800">
                              Impacted GL Account
                            </p>
                            <p className="font-mono font-bold text-emerald-900 mt-0.5">
                              1200 - Accounts Receivable
                            </p>
                            <p className="text-[10px] text-emerald-700 mt-0.5">
                              Debit Balance (Asset Account)
                            </p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              Created By User
                            </p>
                            <p className="font-bold text-slate-800 mt-0.5">
                              {selectedItem.createdByUser || "Administrator"}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {selectedItem.createdUserEmail || "admin@agm.ae"}{" "}
                              ({selectedItem.createdUserRole || "Admin"})
                            </p>
                          </div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Project / Scope:
                            </span>
                            <span className="font-medium text-slate-800">
                              {selectedItem.project}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Issue Date:</span>
                            <span className="font-mono font-medium text-slate-800">
                              {selectedItem.date}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Days Outstanding:
                            </span>
                            <span className="font-bold text-rose-600">
                              {selectedItem.daysOutstanding} Days
                            </span>
                          </div>
                          <div className="h-px bg-slate-200 my-1" />
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Total Billed Amount:
                            </span>
                            <span className="font-mono font-bold text-slate-800">
                              {formatCurrency(selectedItem.totalAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Paid Amount:</span>
                            <span className="font-mono text-emerald-700 font-bold">
                              {formatCurrency(selectedItem.paidAmount || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs font-bold bg-rose-50 p-2.5 rounded-xl text-rose-950 border border-rose-200/80">
                            <span>Remaining Outstanding Balance:</span>
                            <span className="font-mono text-rose-700 text-sm">
                              {formatCurrency(
                                selectedItem.remainingBalance ??
                                  selectedItem.totalAmount,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedItem(null)}
                          className="text-xs cursor-pointer"
                        >
                          Close Audit View
                        </Button>
                      </div>
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

export default AccountsReceivableReport;
