"use client";

import React, { useMemo, useState } from "react";
import {
  CloseIcon,
  EyeIcon,
  FileSpreadsheetIcon,
  PrintIcon,
  ReceiptIcon,
  SearchIcon,
} from "@/components/icons";
import {
  Button,
  Input,
  Select,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  Modal,
} from "@/components/ui";
import { useSalesInvoices, SalesInvoice, useProfitLoss } from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { formatCurrency, formatNumber } from "./types";

export const TaxInvoicesReport: React.FC = () => {
  const { data: invoices = [], isLoading } = useSalesInvoices();
  const { data: profitLoss } = useProfitLoss({ period: "all" });

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

  const totalDirectCost = useMemo(() => {
    return Number(profitLoss?.totalDirectExpenses || 0);
  }, [profitLoss]);

  const totalOperatingCost = useMemo(() => {
    return Number(profitLoss?.totalOperatingExpenses || 0);
  }, [profitLoss]);

  const grossProfit = useMemo(
    () => totalNetTaxable - totalDirectCost,
    [totalNetTaxable, totalDirectCost],
  );

  const grossMarginPct = useMemo(
    () => (totalNetTaxable > 0 ? (grossProfit / totalNetTaxable) * 100 : 0),
    [grossProfit, totalNetTaxable],
  );

  const netProfit = useMemo(
    () => grossProfit - totalOperatingCost,
    [grossProfit, totalOperatingCost],
  );

  const netMarginPct = useMemo(
    () => (totalNetTaxable > 0 ? (netProfit / totalNetTaxable) * 100 : 0),
    [netProfit, totalNetTaxable],
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
              <div className="hidden print:block">
                <QuotationHeader />
              </div>
            </th>
          </tr>
        </thead>

        <tfoot className="print-page-footer-group">
          <tr>
            <td className="p-0 border-none align-bottom">
              <div className="w-full opacity-0 pointer-events-none" aria-hidden="true">
                <QuotationFooter />
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
                      Tax Invoices &amp; Output VAT Statement
                    </span>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      TAX INVOICES REGISTER
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-700 font-mono font-bold text-xs">
                      {filteredInvoices.length} Tax Invoices
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      Printed: {new Date().toLocaleDateString("en-GB")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4 print:hidden">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-2xs shrink-0">
                      <ReceiptIcon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                          Tax Invoices &amp; Output VAT
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-mono">
                          FTA Form 201
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Standard UAE FTA Tax Invoices &bull; Real-time output VAT &amp; taxable supplies auditing
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 print:hidden shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="text-xs font-bold text-slate-700 border-slate-300 bg-white hover:bg-slate-50 hover:text-slate-900 shadow-2xs cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl"
                      icon={<PrintIcon size={14} className="text-slate-500" />}
                    >
                      Print Statement
                    </Button>
                  </div>
                </div>

              {/* 4 Cards in a row with Profit & Loss UI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-4 print:gap-2.5 my-5 print:my-3 print-avoid-break">
                {/* Card 1 */}
                <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                  <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-600" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        1. Gross Invoiced
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                        {filteredInvoices.length} Invoices
                      </span>
                    </div>
                    <p className="text-xs print:text-[11px] text-slate-500 mt-0.5 truncate">
                      Total billing inclusive of VAT
                    </p>
                  </div>
                  <div className="pt-2 print:pt-0">
                    <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                      AED
                    </span>
                    <span className="text-xl print:text-base font-black text-slate-900 font-mono">
                      {formatNumber(totalGrossInvoiced)}
                    </span>
                    <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium print:hidden">
                      Net: {formatCurrency(totalNetTaxable)}
                    </p>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                  <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        2. Net Taxable Sales
                      </span>
                      <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-200/60">
                        Revenue Base
                      </span>
                    </div>
                    <p className="text-xs print:text-[11px] text-slate-500 mt-0.5 truncate">
                      Turnover before 5% Output VAT
                    </p>
                  </div>
                  <div className="pt-2 print:pt-0">
                    <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                      AED
                    </span>
                    <span className="text-xl print:text-base font-black text-slate-900 font-mono">
                      {formatNumber(totalNetTaxable)}
                    </span>
                    <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium print:hidden">
                      FTA Standard 5% Rated
                    </p>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                  <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        3. Output VAT (5%)
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                        UAE FTA
                      </span>
                    </div>
                    <p className="text-xs print:text-[11px] text-slate-500 mt-0.5 truncate">
                      Statutory tax liability assessed
                    </p>
                  </div>
                  <div className="pt-2 print:pt-0">
                    <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                      AED
                    </span>
                    <span className="text-xl print:text-base font-black text-emerald-800 font-mono">
                      {formatNumber(totalVatAssessed)}
                    </span>
                    <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium print:hidden">
                      Collected: {formatCurrency(totalPaidCollected)}
                    </p>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                  <div className="absolute inset-x-0 top-0 h-[2.5px] bg-amber-500" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        4. Outstanding Balance
                      </span>
                      <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                        {totalGrossInvoiced > 0
                          ? ((totalOutstanding / totalGrossInvoiced) * 100).toFixed(1)
                          : "0.0"}% Due
                      </span>
                    </div>
                    <p className="text-xs print:text-[11px] text-slate-500 mt-0.5 truncate">
                      Uncollected customer receivables
                    </p>
                  </div>
                  <div className="pt-2 print:pt-0">
                    <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                      AED
                    </span>
                    <span className="text-xl print:text-base font-black text-amber-800 font-mono">
                      {formatNumber(totalOutstanding)}
                    </span>
                    <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium print:hidden">
                      Settled: {formatCurrency(totalPaidCollected)}
                    </p>
                  </div>
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
                        <Button
                          key={p.key}
                          type="button"
                          variant="ghost"
                          onClick={() => setStatusFilter(p.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer h-auto ${
                            isActive
                              ? "bg-emerald-700 text-white shadow-xs hover:bg-emerald-800"
                              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                          }`}
                        >
                          {p.label}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500">
                      Period:
                    </span>
                    <Select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-emerald-600"
                    >
                      <option value="ALL">All Periods</option>
                      <option value="THIS_MONTH">This Month</option>
                      <option value="THIS_YEAR">This Year (2026)</option>
                      <option value="Q1">Q1 (Jan - Mar)</option>
                      <option value="Q2">Q2 (Apr - Jun)</option>
                      <option value="Q3">Q3 (Jul - Sep)</option>
                      <option value="Q4">Q4 (Oct - Dec)</option>
                    </Select>
                  </div>
                </div>

                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search by Invoice #, Customer name, TRN, Project scope, or Quotation Ref..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<SearchIcon size={14} />}
                    className="w-full text-xs font-medium"
                  />
                  {searchTerm && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 h-auto"
                    >
                      <CloseIcon size={12} />
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
                <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3 px-4 flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2">
                    <FileSpreadsheetIcon size={14} className="text-emerald-400" />
                    <span>Statutory Tax Invoices Register</span>
                  </h4>
                  <span className="text-[11px] font-mono text-emerald-300 font-bold">
                    {filteredInvoices.length} Recorded Tax Invoices
                  </span>
                </div>

                <Table className="w-full text-xs text-left">
                  <TableHead className="bg-slate-50 border-b border-slate-200">
                    <TableHeaderCell className="py-2.5 px-3 w-32 print:w-28 font-bold text-slate-700 uppercase text-[10px] tracking-wider whitespace-nowrap">
                      Invoice # &amp; Date
                    </TableHeaderCell>
                    <TableHeaderCell className="py-2.5 px-3 w-40 print:w-36 font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                      Customer &amp; TRN
                    </TableHeaderCell>
                    <TableHeaderCell className="py-2.5 px-3 min-w-[130px] font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                      Quotation / Scope
                    </TableHeaderCell>
                    <TableHeaderCell
                      align="right"
                      className="py-2.5 px-3 w-28 print:w-24 text-right font-bold text-slate-700 uppercase text-[10px] tracking-wider whitespace-nowrap"
                    >
                      Net (AED)
                    </TableHeaderCell>
                    <TableHeaderCell
                      align="right"
                      className="py-2.5 px-3 w-24 print:w-20 text-right font-bold text-slate-700 uppercase text-[10px] tracking-wider whitespace-nowrap"
                    >
                      VAT (5%)
                    </TableHeaderCell>
                    <TableHeaderCell
                      align="right"
                      className="py-2.5 px-3 w-28 print:w-24 text-right font-bold text-slate-700 uppercase text-[10px] tracking-wider whitespace-nowrap"
                    >
                      Gross (AED)
                    </TableHeaderCell>
                    <TableHeaderCell
                      align="right"
                      className="py-2.5 px-3 w-28 print:w-24 text-right font-bold text-slate-700 uppercase text-[10px] tracking-wider whitespace-nowrap"
                    >
                      Balance Due
                    </TableHeaderCell>
                    <TableHeaderCell
                      align="center"
                      className="py-2.5 px-2 w-20 print:w-16 text-center font-bold text-slate-700 uppercase text-[10px] tracking-wider whitespace-nowrap"
                    >
                      Status
                    </TableHeaderCell>
                    <TableHeaderCell
                      align="center"
                      className="py-2.5 px-2 w-12 text-center font-bold text-slate-700 uppercase text-[10px] tracking-wider print:hidden"
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
                            <TableCell className="py-2 px-3 whitespace-nowrap">
                              <div className="font-mono font-bold text-slate-900 text-xs print:text-[10px]">
                                {inv.invoiceNumber}
                              </div>
                              <div className="text-[10px] print:text-[8.5px] text-slate-400 font-mono">
                                Date: {invDate}
                              </div>
                            </TableCell>

                            <TableCell className="py-2 px-3">
                              <div className="font-bold text-slate-900 text-xs print:text-[10px] truncate max-w-[140px] print:max-w-[120px]">
                                {inv.customerName || "Valued Customer"}
                              </div>
                              {inv.customerTrn ? (
                                <div className="text-[10px] print:text-[8px] text-slate-400 font-mono whitespace-nowrap">
                                  TRN: {inv.customerTrn}
                                </div>
                              ) : (
                                <div className="text-[10px] print:text-[8px] text-slate-400 italic">
                                  No TRN
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="py-2 px-3">
                              <div className="flex flex-col gap-0.5">
                                {inv.quotationRef && (
                                  <span className="inline-block px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-mono text-[9.5px] print:text-[8px] font-bold border border-emerald-200 w-fit">
                                    {inv.quotationRef}
                                  </span>
                                )}
                                <span className="text-slate-600 text-xs print:text-[9.5px] truncate max-w-[180px] print:max-w-[150px]">
                                  {inv.projectScope || "—"}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell
                              align="right"
                              className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap text-xs print:text-[10px]"
                            >
                              {formatNumber(inv.subtotal)}
                            </TableCell>

                            <TableCell
                              align="right"
                              className="py-2 px-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap text-xs print:text-[10px]"
                            >
                              {formatNumber(inv.vatAmount)}
                            </TableCell>

                            <TableCell
                              align="right"
                              className="py-2 px-3 text-right font-mono font-black text-slate-950 whitespace-nowrap text-xs print:text-[10px]"
                            >
                              {formatNumber(inv.totalAmount)}
                            </TableCell>

                            <TableCell
                              align="right"
                              className={`py-2 px-3 text-right font-mono font-black whitespace-nowrap text-xs print:text-[10px] ${
                                Number(inv.remainingBalance) > 0
                                  ? "text-amber-800"
                                  : "text-emerald-700"
                              }`}
                            >
                              {formatNumber(inv.remainingBalance)}
                            </TableCell>

                            <TableCell className="py-2 px-2 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] print:text-[8px] font-bold border ${
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

                            <TableCell className="py-2 px-2 text-center print:hidden">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedInvoice(inv)}
                                className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition cursor-pointer h-auto"
                                title="View Line Items &amp; Tax Breakdown"
                              >
                                <EyeIcon size={13} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                <div className="bg-slate-50 border-t border-slate-200 p-3 px-4 flex flex-wrap items-center justify-between gap-4 font-bold text-xs print:text-[10px] text-slate-800 print-avoid-break">
                  <span>Grand Totals ({filteredInvoices.length} Invoices)</span>
                  <div className="flex items-center gap-6 font-mono text-xs print:text-[10px]">
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

              {/* TAX INVOICE PROFIT & LOSS REALIZATION SECTION */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 print:p-3 space-y-4 print:space-y-2.5 shadow-xs print-avoid-break">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        P&amp;L Analysis
                      </span>
                      <h4 className="font-black text-sm text-slate-900 tracking-tight">
                        Tax Invoices Profit &amp; Loss Statement
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-sans text-[11px]">Gross Margin:</span>
                        <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-900 text-xs">
                          {grossMarginPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-sans text-[11px]">Net Margin:</span>
                        <span className="px-2 py-0.5 rounded font-bold bg-indigo-100 text-indigo-900 text-xs">
                          {netMarginPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4 P&L Realization Cards matching ProfitLoss UI */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-4 print:gap-2.5">
                    {/* Card 1 */}
                    <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                      <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            1. Total Income
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                            100% Taxable
                          </span>
                        </div>
                        <p className="text-xs print:text-[11px] text-slate-500 mt-0.5 truncate">
                          Contract revenue &amp; billings
                        </p>
                      </div>
                      <div className="pt-2 print:pt-0">
                        <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                          AED
                        </span>
                        <span className="text-xl print:text-base font-black text-slate-900 font-mono">
                          {formatNumber(totalNetTaxable)}
                        </span>
                        <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium print:hidden">
                          Gross: {formatCurrency(totalGrossInvoiced)}
                        </p>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                      <div className="absolute inset-x-0 top-0 h-[2.5px] bg-rose-500" />
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            2. Direct Costs (COGS)
                          </span>
                          <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200/60">
                            {totalNetTaxable > 0
                              ? ((totalDirectCost / totalNetTaxable) * 100).toFixed(1)
                              : "0.0"}%
                          </span>
                        </div>
                        <p className="text-xs print:text-[11px] text-slate-500 mt-0.5 truncate">
                          Project materials &amp; labor
                        </p>
                      </div>
                      <div className="pt-2 print:pt-0">
                        <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                          AED
                        </span>
                        <span className="text-xl print:text-base font-black text-rose-800 font-mono">
                          {formatNumber(totalDirectCost)}
                        </span>
                        <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium print:hidden">
                          Cost of Sales Allocation
                        </p>
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                      <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-600" />
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            3. Gross Profit
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                            {grossMarginPct.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs print:text-[11px] text-slate-500 mt-0.5 truncate">
                          Revenue after Direct COGS
                        </p>
                      </div>
                      <div className="pt-2 print:pt-0">
                        <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                          AED
                        </span>
                        <span className="text-xl print:text-base font-black text-emerald-800 font-mono">
                          {formatNumber(grossProfit)}
                        </span>
                        <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium print:hidden">
                          Trading Profit Yield
                        </p>
                      </div>
                    </div>

                    {/* Card 4 */}
                    <div className="relative overflow-hidden p-5 print:p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2 print:space-y-1">
                      <div className="absolute inset-x-0 top-0 h-[2.5px] bg-indigo-500" />
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] print:text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            4. Net Profit
                          </span>
                          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-200/60">
                            {netMarginPct.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs print:text-[11px] text-slate-500 mt-0.5 truncate">
                          Net income after overheads
                        </p>
                      </div>
                      <div className="pt-2 print:pt-0">
                        <span className="text-xs font-semibold text-slate-400 font-sans mr-1">
                          AED
                        </span>
                        <span className={`text-xl print:text-base font-black font-mono ${netProfit >= 0 ? "text-indigo-950" : "text-rose-700"}`}>
                          {formatNumber(netProfit)}
                        </span>
                        <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium print:hidden">
                          Bottom Line Margin
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* P&L Statement Table Breakdown */}
                  <div className="rounded-xl border border-slate-200/80 overflow-hidden">
                    <Table className="w-full text-xs text-left">
                      <TableHead className="bg-slate-50 border-b border-slate-200">
                        <TableHeaderCell className="py-2.5 px-4 font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                          P&amp;L Accounting Statement Component
                        </TableHeaderCell>
                        <TableHeaderCell className="py-2.5 px-4 font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                          Statutory Recognition Basis
                        </TableHeaderCell>
                        <TableHeaderCell align="right" className="py-2.5 px-4 text-right font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                          Amount (AED)
                        </TableHeaderCell>
                        <TableHeaderCell align="right" className="py-2.5 px-4 text-right font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                          % of Revenue
                        </TableHeaderCell>
                      </TableHead>
                      <TableBody className="divide-y divide-slate-100 font-medium">
                        <TableRow className="hover:bg-slate-50/60">
                          <TableCell className="py-2.5 px-4 font-bold text-slate-900">
                            Recognized Tax Invoiced Revenue (Turnover)
                          </TableCell>
                          <TableCell className="py-2.5 px-4 text-slate-500">
                            {filteredInvoices.length} Tax Invoices (Excl. VAT)
                          </TableCell>
                          <TableCell align="right" className="py-2.5 px-4 font-mono font-bold text-slate-900">
                            {formatNumber(totalNetTaxable)}
                          </TableCell>
                          <TableCell align="right" className="py-2.5 px-4 font-mono font-bold text-slate-700">
                            100.0%
                          </TableCell>
                        </TableRow>

                        <TableRow className="hover:bg-slate-50/60">
                          <TableCell className="py-2.5 px-4 font-semibold text-rose-700">
                            Less: Cost of Goods Sold (Direct Project Materials)
                          </TableCell>
                          <TableCell className="py-2.5 px-4 text-slate-500">
                            Direct Material &amp; Supplier Cost Allocation
                          </TableCell>
                          <TableCell align="right" className="py-2.5 px-4 font-mono font-semibold text-rose-700">
                            ({formatNumber(totalDirectCost)})
                          </TableCell>
                          <TableCell align="right" className="py-2.5 px-4 font-mono text-rose-700">
                            {totalNetTaxable > 0 ? ((totalDirectCost / totalNetTaxable) * 100).toFixed(1) : "0.0"}%
                          </TableCell>
                        </TableRow>

                        <TableRow className="bg-emerald-50/50 font-bold">
                          <TableCell className="py-2.5 px-4 font-black text-emerald-950">
                            = GROSS OPERATING PROFIT
                          </TableCell>
                          <TableCell className="py-2.5 px-4 text-emerald-800">
                            Trading Contribution Realized
                          </TableCell>
                          <TableCell align="right" className="py-2.5 px-4 font-mono font-black text-emerald-900">
                            {formatNumber(grossProfit)}
                          </TableCell>
                          <TableCell align="right" className="py-2.5 px-4 font-mono font-black text-emerald-800">
                            {grossMarginPct.toFixed(1)}%
                          </TableCell>
                        </TableRow>

                        <TableRow className="hover:bg-slate-50/60">
                          <TableCell className="py-2.5 px-4 font-semibold text-slate-600">
                            Less: Administrative &amp; Operating Overheads
                          </TableCell>
                          <TableCell className="py-2.5 px-4 text-slate-500">
                            Operational Expense Recognition
                          </TableCell>
                          <TableCell align="right" className="py-2.5 px-4 font-mono text-slate-700">
                            ({formatNumber(totalOperatingCost)})
                          </TableCell>
                          <TableCell align="right" className="py-2.5 px-4 font-mono text-slate-600">
                            {totalNetTaxable > 0 ? ((totalOperatingCost / totalNetTaxable) * 100).toFixed(1) : "0.0"}%
                          </TableCell>
                        </TableRow>

                        <TableRow className="bg-slate-900 text-white font-black">
                          <TableCell className="py-3 px-4 uppercase tracking-wider font-bold">
                            = NET OPERATING PROFIT
                          </TableCell>
                          <TableCell className="py-3 px-4 text-slate-300 font-normal">
                            Bottom Line Margin Realization
                          </TableCell>
                          <TableCell align="right" className="py-3 px-4 font-mono font-black text-emerald-400">
                            {formatNumber(netProfit)}
                          </TableCell>
                          <TableCell align="right" className="py-3 px-4 font-mono font-black text-emerald-400">
                            {netMarginPct.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Fixed Footer pinned to bottom on every page, including the last page */}
      <div className="print-footer-bottom fixed-print-footer hidden print:block">
        <QuotationFooter />
      </div>

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
                  <span className="text-[10px] text-emerald-800 font-mono font-bold block">
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
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
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
