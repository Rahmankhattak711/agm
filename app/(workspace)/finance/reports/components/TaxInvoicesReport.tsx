"use client";

import React, { useMemo, useState } from "react";
import {
  FileText,
  Search,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  Eye,
  X,
  CreditCard,
  ShieldCheck,
  Calendar,
  Filter,
} from "lucide-react";
import {
  Button,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  Modal,
} from "@/components/ui";
import { useSalesInvoices, SalesInvoice } from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { formatCurrency, formatNumber } from "./types";

export const TaxInvoicesReport: React.FC = () => {
  const { data: invoices = [], isLoading } = useSalesInvoices();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(
    null,
  );

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
        (inv.customerTrn && inv.customerTrn.toLowerCase().includes(q)) ||
        (inv.quotationRef && inv.quotationRef.toLowerCase().includes(q)) ||
        (inv.projectScope && inv.projectScope.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "POSTED" && inv.status === "POSTED") ||
        (statusFilter === "DRAFT" && inv.status === "DRAFT") ||
        (statusFilter === "PAID" && inv.status === "PAID") ||
        (statusFilter === "PARTIALLY_PAID" &&
          inv.status === "PARTIALLY_PAID") ||
        (statusFilter === "OVERDUE" && inv.status === "OVERDUE");

      let matchesDate = true;
      if (dateFilter !== "ALL" && inv.invoiceDate) {
        const invDate = new Date(inv.invoiceDate);
        const now = new Date();
        if (dateFilter === "THIS_MONTH") {
          matchesDate =
            invDate.getMonth() === now.getMonth() &&
            invDate.getFullYear() === now.getFullYear();
        } else if (dateFilter === "THIS_YEAR") {
          matchesDate = invDate.getFullYear() === now.getFullYear();
        } else if (dateFilter === "Q1") {
          matchesDate = [0, 1, 2].includes(invDate.getMonth());
        } else if (dateFilter === "Q2") {
          matchesDate = [3, 4, 5].includes(invDate.getMonth());
        } else if (dateFilter === "Q3") {
          matchesDate = [6, 7, 8].includes(invDate.getMonth());
        } else if (dateFilter === "Q4") {
          matchesDate = [9, 10, 11].includes(invDate.getMonth());
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [invoices, searchTerm, statusFilter, dateFilter]);

  const totalGrossInvoiced = useMemo(
    () => filteredInvoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0),
    [filteredInvoices],
  );

  const totalNetTaxable = useMemo(
    () => filteredInvoices.reduce((s, i) => s + Number(i.subtotal || 0), 0),
    [filteredInvoices],
  );

  const totalVatAssessed = useMemo(
    () => filteredInvoices.reduce((s, i) => s + Number(i.vatAmount || 0), 0),
    [filteredInvoices],
  );

  const totalPaidCollected = useMemo(
    () => filteredInvoices.reduce((s, i) => s + Number(i.paidAmount || 0), 0),
    [filteredInvoices],
  );

  const totalOutstanding = useMemo(
    () =>
      filteredInvoices.reduce((s, i) => s + Number(i.remainingBalance || 0), 0),
    [filteredInvoices],
  );

  const handlePrint = () => {
    window.print();
  };

  const statusPills = [
    { key: "ALL", label: "All Tax Invoices" },
    { key: "POSTED", label: "Posted to GL" },
    { key: "DRAFT", label: "Draft Invoices" },
    { key: "PARTIALLY_PAID", label: "Partially Paid" },
    { key: "PAID", label: "Fully Settled" },
    { key: "OVERDUE", label: "Overdue" },
  ];

  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6 print:p-0 print:m-0 print:border-none">
      {}
      <table className="print-page-table w-full border-collapse">
        <thead className="print-page-header-group">
          <tr>
            <th className="p-0 font-normal text-left border-none">
              <div className="hidden print:block mb-4">
                <QuotationHeader />
                <div className="px-6 pt-3 pb-2 border-b border-slate-200 flex justify-between items-end">
                  <div>
                    <h1 className="text-lg font-black text-slate-900 uppercase">
                      Tax Invoices &amp; Output VAT Statement
                    </h1>
                    <p className="text-xs text-slate-500">
                      AGM FITOUT TECHNICAL SERVICES LLC — Statutory Tax Invoices
                      Register (UAE FTA Compliant)
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
        <tbody>
          <tr>
            <td className="p-0 border-none">
              {}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 shadow-2xs">
                    <Receipt size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      Tax Invoices &amp; Output VAT Register
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Statutory tax billing statement, line-item VAT recovery,
                      and revenue recognition register.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    icon={<Printer size={13} />}
                    className="text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Print Statement (A4)
                  </Button>
                </div>
              </div>

              {}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 my-5 print:grid-cols-5 print:gap-2 print:my-3">
                {}
                <div className="p-4 rounded-xl bg-slate-900 text-white relative overflow-hidden flex flex-col justify-between space-y-2">
                  <div className="absolute inset-x-0 top-0 h-[2.5px] bg-teal-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    1. Total Gross Invoiced
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-teal-400 font-sans mr-1">
                      AED
                    </span>
                    <span className="text-lg font-black text-white font-mono">
                      {formatNumber(totalGrossInvoiced)}
                    </span>
                  </div>
                  <span className="text-[10.5px] text-slate-400 block">
                    {filteredInvoices.length} Invoices Issued
                  </span>
                </div>

                {}
                <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-2">
                  <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    2. Net Taxable Sales
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-sky-600 font-sans mr-1">
                      AED
                    </span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {formatNumber(totalNetTaxable)}
                    </span>
                  </div>
                  <span className="text-[10.5px] text-slate-500 block">
                    Before 5% VAT
                  </span>
                </div>

                {}
                <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-2">
                  <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    3. Output VAT (5%)
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-emerald-600 font-sans mr-1">
                      AED
                    </span>
                    <span className="text-lg font-black text-emerald-800 font-mono">
                      {formatNumber(totalVatAssessed)}
                    </span>
                  </div>
                  <span className="text-[10.5px] text-slate-500 block">
                    UAE FTA Tax Payable
                  </span>
                </div>

                {}
                <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-2">
                  <div className="absolute inset-x-0 top-0 h-[2.5px] bg-blue-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    4. Total Collected
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-blue-600 font-sans mr-1">
                      AED
                    </span>
                    <span className="text-lg font-black text-blue-900 font-mono">
                      {formatNumber(totalPaidCollected)}
                    </span>
                  </div>
                  <span className="text-[10.5px] text-slate-500 block">
                    Customer Receipts
                  </span>
                </div>

                {}
                <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-2">
                  <div className="absolute inset-x-0 top-0 h-[2.5px] bg-amber-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    5. Outstanding Balance
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-amber-600 font-sans mr-1">
                      AED
                    </span>
                    <span className="text-lg font-black text-amber-800 font-mono">
                      {formatNumber(totalOutstanding)}
                    </span>
                  </div>
                  <span className="text-[10.5px] text-slate-500 block">
                    Unpaid Receivables
                  </span>
                </div>
              </div>

              {}
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/70 space-y-3 print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  {}
                  <div className="flex flex-wrap gap-1.5">
                    {statusPills.map((p) => {
                      const isActive = statusFilter === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setStatusFilter(p.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? "bg-teal-700 text-white shadow-xs"
                              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500">
                      Period:
                    </span>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-teal-600"
                    >
                      <option value="ALL">All Periods</option>
                      <option value="THIS_MONTH">This Month</option>
                      <option value="THIS_YEAR">This Year (2026)</option>
                      <option value="Q1">Q1 (Jan - Mar)</option>
                      <option value="Q2">Q2 (Apr - Jun)</option>
                      <option value="Q3">Q3 (Jul - Sep)</option>
                      <option value="Q4">Q4 (Oct - Dec)</option>
                    </select>
                  </div>
                </div>

                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search by Invoice #, Customer name, TRN, Project scope, or Quotation Ref..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-teal-600 font-medium"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
                <div className="bg-slate-900 text-white p-3 px-4 flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
                    <FileSpreadsheet size={14} className="text-teal-400" />
                    <span>Statutory Tax Invoices Register</span>
                  </h4>
                  <span className="text-[11px] font-mono text-teal-300 font-bold">
                    {filteredInvoices.length} Recorded Tax Invoices
                  </span>
                </div>

                <Table className="w-full text-xs text-left">
                  <TableHead className="bg-slate-50 border-b border-slate-200">
                    <TableHeaderCell className="py-3 px-4 font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                      Invoice # &amp; Date
                    </TableHeaderCell>
                    <TableHeaderCell className="py-3 px-4 font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                      Customer &amp; TRN
                    </TableHeaderCell>
                    <TableHeaderCell className="py-3 px-4 font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                      Quotation / Project Ref
                    </TableHeaderCell>
                    <TableHeaderCell
                      align="right"
                      className="py-3 px-4 text-right font-bold text-slate-700 uppercase text-[10px] tracking-wider"
                    >
                      Net Subtotal
                    </TableHeaderCell>
                    <TableHeaderCell
                      align="right"
                      className="py-3 px-4 text-right font-bold text-slate-700 uppercase text-[10px] tracking-wider"
                    >
                      VAT (5%)
                    </TableHeaderCell>
                    <TableHeaderCell
                      align="right"
                      className="py-3 px-4 text-right font-bold text-slate-700 uppercase text-[10px] tracking-wider"
                    >
                      Total Gross
                    </TableHeaderCell>
                    <TableHeaderCell
                      align="right"
                      className="py-3 px-4 text-right font-bold text-slate-700 uppercase text-[10px] tracking-wider"
                    >
                      Balance Due
                    </TableHeaderCell>
                    <TableHeaderCell
                      align="center"
                      className="py-3 px-3 text-center font-bold text-slate-700 uppercase text-[10px] tracking-wider"
                    >
                      Status
                    </TableHeaderCell>
                    <TableHeaderCell
                      align="center"
                      className="py-3 px-3 text-center font-bold text-slate-700 uppercase text-[10px] tracking-wider print:hidden"
                    >
                      Action
                    </TableHeaderCell>
                  </TableHead>

                  <TableBody className="divide-y divide-slate-100 font-medium">
                    {isLoading ? (
                      <TableLoading colSpan={9} rows={5} />
                    ) : filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="py-12 text-center text-slate-400 italic"
                        >
                          No tax invoices found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((inv) => {
                        const invDate = inv.invoiceDate
                          ? new Date(inv.invoiceDate).toLocaleDateString(
                              "en-GB",
                            )
                          : "—";

                        return (
                          <TableRow
                            key={inv.id}
                            className="hover:bg-slate-50/70 text-slate-700 transition"
                          >
                            <TableCell className="py-2.5 px-3">
                              <div className="font-mono font-bold text-slate-900">
                                {inv.invoiceNumber}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Date: {invDate}
                              </div>
                            </TableCell>

                            <TableCell className="py-2.5 px-3">
                              <div className="font-bold text-slate-900">
                                {inv.customerName || "Valued Customer"}
                              </div>
                              {inv.customerTrn ? (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  TRN: {inv.customerTrn}
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400 italic">
                                  No TRN
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="py-2.5 px-3 max-w-xs">
                              {inv.quotationRef && (
                                <span className="inline-block px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 font-mono text-[10px] font-bold border border-teal-200 mr-1.5">
                                  {inv.quotationRef}
                                </span>
                              )}
                              <span className="text-slate-600 text-xs truncate">
                                {inv.projectScope || "—"}
                              </span>
                            </TableCell>

                            <TableCell
                              align="right"
                              className="py-2.5 px-3 text-right font-mono font-medium text-slate-700"
                            >
                              AED {formatNumber(inv.subtotal)}
                            </TableCell>

                            <TableCell
                              align="right"
                              className="py-2.5 px-3 text-right font-mono font-medium text-emerald-700"
                            >
                              AED {formatNumber(inv.vatAmount)}
                            </TableCell>

                            <TableCell
                              align="right"
                              className="py-2.5 px-3 text-right font-mono font-bold text-slate-900"
                            >
                              AED {formatNumber(inv.totalAmount)}
                            </TableCell>

                            <TableCell
                              align="right"
                              className={`py-2.5 px-3 text-right font-mono font-bold ${
                                Number(inv.remainingBalance) > 0
                                  ? "text-amber-800"
                                  : "text-emerald-700"
                              }`}
                            >
                              AED {formatNumber(inv.remainingBalance)}
                            </TableCell>

                            <TableCell className="py-2.5 px-2 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${
                                  inv.status === "POSTED"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : inv.status === "PAID"
                                      ? "bg-blue-50 text-blue-800 border-blue-200"
                                      : inv.status === "PARTIALLY_PAID"
                                        ? "bg-amber-50 text-amber-800 border-amber-200"
                                        : inv.status === "OVERDUE"
                                          ? "bg-rose-50 text-rose-800 border-rose-200"
                                          : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                {inv.status === "POSTED"
                                  ? "Posted"
                                  : inv.status === "PAID"
                                    ? "Paid"
                                    : inv.status === "PARTIALLY_PAID"
                                      ? "Part-Paid"
                                      : inv.status === "OVERDUE"
                                        ? "Overdue"
                                        : "Draft"}
                              </span>
                            </TableCell>

                            <TableCell className="py-2.5 px-2 text-center print:hidden">
                              <button
                                type="button"
                                onClick={() => setSelectedInvoice(inv)}
                                className="p-1.5 text-slate-600 hover:text-teal-800 rounded-lg hover:bg-teal-50 transition cursor-pointer"
                                title="View Line Items &amp; Tax Breakdown"
                              >
                                <Eye size={13} />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                <div className="bg-slate-50 border-t border-slate-200 p-3 px-4 flex flex-wrap items-center justify-between gap-4 font-bold text-xs text-slate-800">
                  <span>Grand Totals ({filteredInvoices.length} Invoices)</span>
                  <div className="flex items-center gap-6 font-mono text-xs">
                    <div>
                      <span className="text-slate-400 font-sans mr-1">
                        Net:
                      </span>
                      <span>AED {formatNumber(totalNetTaxable)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans mr-1">
                        VAT (5%):
                      </span>
                      <span className="text-emerald-700">
                        AED {formatNumber(totalVatAssessed)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans mr-1">
                        Gross:
                      </span>
                      <span className="text-slate-900">
                        AED {formatNumber(totalGrossInvoiced)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans mr-1">
                        Balance Due:
                      </span>
                      <span className="text-amber-800">
                        AED {formatNumber(totalOutstanding)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot className="print-page-footer-group">
          <tr>
            <td className="p-0 border-none">
              <div className="hidden print:block mt-6">
                <QuotationFooter />
              </div>
            </td>
          </tr>
        </tfoot>
      </table>

      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Tax Invoice Details: ${selectedInvoice.invoiceNumber}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-bold block">
                  Customer Name:
                </span>
                <span className="font-bold text-slate-900">
                  {selectedInvoice.customerName}
                </span>
                {selectedInvoice.customerTrn && (
                  <span className="text-[10px] text-slate-500 font-mono block">
                    TRN: {selectedInvoice.customerTrn}
                  </span>
                )}
              </div>
              <div>
                <span className="text-slate-400 font-bold block">
                  Project Scope / Ref:
                </span>
                <span className="font-semibold text-slate-800">
                  {selectedInvoice.projectScope || "—"}
                </span>
                {selectedInvoice.quotationRef && (
                  <span className="text-[10px] text-teal-800 font-mono font-bold block">
                    Converted from: {selectedInvoice.quotationRef}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table className="w-full text-xs">
                <TableHead className="bg-slate-100 border-b border-slate-200">
                  <TableHeaderCell className="py-2 px-3 font-bold text-slate-700">
                    Description
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="center"
                    className="py-2 px-2 text-center font-bold text-slate-700"
                  >
                    Qty
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="center"
                    className="py-2 px-2 text-center font-bold text-slate-700"
                  >
                    Unit
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-2 px-3 text-right font-bold text-slate-700"
                  >
                    Rate (AED)
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-2 px-3 text-right font-bold text-slate-700"
                  >
                    Total (AED)
                  </TableHeaderCell>
                </TableHead>
                <TableBody className="divide-y divide-slate-100">
                  {selectedInvoice.items?.length > 0 ? (
                    selectedInvoice.items.map((it: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="py-2 px-3 font-medium text-slate-900">
                          {it.description}
                        </TableCell>
                        <TableCell className="py-2 px-2 text-center font-mono">
                          {formatNumber(it.quantity)}
                        </TableCell>
                        <TableCell className="py-2 px-2 text-center text-slate-500">
                          {it.unit || "SQM"}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-right font-mono">
                          {formatNumber(it.unitPrice)}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-right font-mono font-bold">
                          {formatNumber(it.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-4 text-center text-slate-400 italic"
                      >
                        No itemized lines recorded for this invoice.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Net):</span>
                <span>AED {formatNumber(selectedInvoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Output VAT (5%):</span>
                <span className="text-emerald-700">
                  AED {formatNumber(selectedInvoice.vatAmount)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 text-sm">
                <span>Total Gross Amount:</span>
                <span>AED {formatNumber(selectedInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>Paid / Collected:</span>
                <span>AED {formatNumber(selectedInvoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-amber-800">
                <span>Remaining Balance Due:</span>
                <span>
                  AED {formatNumber(selectedInvoice.remainingBalance)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  window.location.href = `/commercial/sales-invoices`;
                }}
                className="bg-teal-700 hover:bg-teal-800 text-white"
              >
                Open in Sales Invoices
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
