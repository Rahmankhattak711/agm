"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useCustomers, useStatementOfAccount } from "@/lib/hooks/api-hooks";
import { StatementOfAccountDocument } from "@/components/documents";
import { PrintIcon, RefreshIcon, ReceiptIcon } from "@/components/icons";
import { Button, DatePicker, Select, PageHeader } from "@/components/ui";
import { useSearchParams } from "next/navigation";
import {
  formatPdfDocumentTitle,
  printWithDocumentTitle,
} from "@/lib/utils/format";
import {
  FileText,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Eye,
  SlidersHorizontal,
} from "lucide-react";

function formatAmount(val: number | string | undefined): string {
  const num = Number(val || 0);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2]),
      );
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  } catch {}
  return dateStr;
}

interface StatementOfAccountReportProps {
  initialCustomerId?: string | null;
}

export const StatementOfAccountReport: React.FC<
  StatementOfAccountReportProps
> = ({ initialCustomerId }) => {
  const searchParams = useSearchParams();

  const currentYear = new Date().getFullYear();
  const defaultFromDate = `${currentYear}-01-01`;
  const defaultToDate = new Date().toISOString().slice(0, 10);

  const customerIdParam =
    searchParams.get("customerId") || initialCustomerId || "";
  const fromDateParam = searchParams.get("fromDate") || defaultFromDate;
  const toDateParam = searchParams.get("toDate") || defaultToDate;

  const [selectedCustomerId, setSelectedCustomerId] =
    useState<string>(customerIdParam);
  const [fromDate, setFromDate] = useState<string>(fromDateParam);
  const [toDate, setToDate] = useState<string>(toDateParam);
  const [selectedInvoiceFilter, setSelectedInvoiceFilter] =
    useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"DASHBOARD" | "DOCUMENT">(
    "DASHBOARD",
  );
  const [tableSearch, setTableSearch] = useState<string>("");

  const { data: customers = [] } = useCustomers();

  useEffect(() => {
    if (customerIdParam) {
      setSelectedCustomerId(customerIdParam);
    }
  }, [customerIdParam]);

  // Reset invoice filter whenever customer changes
  useEffect(() => {
    setSelectedInvoiceFilter("ALL");
  }, [selectedCustomerId]);

  const {
    data: soaData,
    isLoading: soaLoading,
    isFetching: soaFetching,
    refetch,
  } = useStatementOfAccount({
    customerId: selectedCustomerId || null,
    fromDate,
    toDate,
    transactionType: "ALL",
    status: "ALL",
  });

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Available invoices list for the selected customer
  const availableInvoices = useMemo(() => {
    if (!soaData) return [];
    const invMap = new Map<
      string,
      { invoiceNo: string; amount: number; status: string; projectScope?: string }
    >();

    (soaData.outstandingInvoices || []).forEach((inv) => {
      if (inv.invoiceNo) {
        invMap.set(inv.invoiceNo, {
          invoiceNo: inv.invoiceNo,
          amount: Number(inv.invoiceAmount || 0),
          status: inv.status,
          projectScope: inv.projectScope || undefined,
        });
      }
    });

    (soaData.transactions || []).forEach((tx) => {
      if (tx.rawType === "INVOICE" && tx.reference) {
        if (!invMap.has(tx.reference)) {
          invMap.set(tx.reference, {
            invoiceNo: tx.reference,
            amount: Number(tx.debit || 0),
            status: tx.status,
            projectScope: tx.projectScope || undefined,
          });
        }
      }
    });

    return Array.from(invMap.values());
  }, [soaData]);

  // Filtered SOA dataset based on selected invoice filter
  const filteredData = useMemo(() => {
    if (!soaData) return null;
    if (selectedInvoiceFilter === "ALL") return soaData;

    const matchingInvoices = (soaData.outstandingInvoices || []).filter(
      (inv) => inv.invoiceNo === selectedInvoiceFilter,
    );

    const matchingTransactions = (soaData.transactions || []).filter(
      (tx) =>
        tx.reference === selectedInvoiceFilter ||
        (tx.description && tx.description.includes(selectedInvoiceFilter)),
    );

    const totalInv = matchingInvoices.reduce(
      (s, i) => s + (i.invoiceAmount || 0),
      0,
    );
    const totalPaid = matchingInvoices.reduce((s, i) => s + (i.paid || 0), 0);
    const totalCredit = matchingInvoices.reduce(
      (s, i) => s + (i.creditNote || 0),
      0,
    );
    const balance = matchingInvoices.reduce(
      (s, i) => s + (i.outstanding || 0),
      0,
    );

    return {
      ...soaData,
      period: {
        ...soaData.period,
        projectName:
          matchingInvoices[0]?.projectScope || soaData.period?.projectName,
      },
      transactions: matchingTransactions,
      outstandingInvoices: matchingInvoices,
      totals: {
        ...soaData.totals,
        invoices: totalInv,
        payments: totalPaid,
        creditNotes: totalCredit,
        closingBalance: balance,
      },
    };
  }, [soaData, selectedInvoiceFilter]);

  // Display transactions filtered by table search
  const displayedTransactions = useMemo(() => {
    if (!filteredData) return [];
    const q = tableSearch.trim().toLowerCase();
    if (!q) return filteredData.transactions;

    return filteredData.transactions.filter(
      (tx) =>
        (tx.reference && tx.reference.toLowerCase().includes(q)) ||
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.type && tx.type.toLowerCase().includes(q)) ||
        (tx.date && tx.date.toLowerCase().includes(q)) ||
        (tx.status && tx.status.toLowerCase().includes(q)),
    );
  }, [filteredData, tableSearch]);

  const handlePrint = () => {
    const invoiceSuffix =
      selectedInvoiceFilter !== "ALL" ? ` - ${selectedInvoiceFilter}` : "";
    const printTitle = formatPdfDocumentTitle(
      [
        "Statement of Account",
        selectedCustomer?.name || selectedCustomer?.companyName,
        `${fromDate} to ${toDate}${invoiceSuffix}`,
      ],
      "AGM-Statement-of-Account",
    );
    printWithDocumentTitle(printTitle);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Control Panel */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs print:hidden space-y-4">
        <PageHeader
          title="Customer Statement of Account (SOA)"
          description="Official client account ledger reconciling opening balances, tax invoices, receipts, and receivables."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {/* View Toggle */}
              {soaData && (
                <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setViewMode("DASHBOARD")}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      viewMode === "DASHBOARD"
                        ? "bg-white text-slate-900 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Modern View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("DOCUMENT")}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      viewMode === "DOCUMENT"
                        ? "bg-white text-slate-900 shadow-2xs font-bold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Document View</span>
                  </button>
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => refetch()}
                icon={
                  <RefreshIcon
                    size={13}
                    className={soaFetching ? "animate-spin" : ""}
                  />
                }
                className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200 px-3.5 py-2 cursor-pointer"
              >
                <span>Refresh</span>
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={handlePrint}
                disabled={!soaData}
                icon={<PrintIcon size={14} />}
                className="text-xs font-bold bg-agm-green text-white hover:bg-agm-green/90 shadow-xs px-4 py-2 cursor-pointer"
              >
                <span>Print SOA</span>
              </Button>
            </div>
          }
        />

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 pt-1">
          {/* 1. Customer Select */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <span>Customer / Client Entity</span>
              <span className="text-rose-500">*</span>
            </label>
            <Select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full text-xs font-semibold bg-white border-slate-200 shadow-2xs pl-2.5 h-9.5 rounded-xl"
            >
              <option value="">-- Select Customer to View Statement --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customerCode} — {c.name}{" "}
                  {c.companyName ? `(${c.companyName})` : ""}
                </option>
              ))}
            </Select>
          </div>

          {/* 2. Invoice Filter Dropdown */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span>Invoice Filter</span>
              {selectedInvoiceFilter !== "ALL" && (
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                  Filtered
                </span>
              )}
            </label>
            <Select
              value={selectedInvoiceFilter}
              onChange={(e) => setSelectedInvoiceFilter(e.target.value)}
              disabled={!soaData || availableInvoices.length === 0}
              className="w-full text-xs font-semibold bg-white border-slate-200 shadow-2xs pl-2.5 h-9.5 rounded-xl"
            >
              <option value="ALL">
                All Invoices ({availableInvoices.length} Total)
              </option>
              {availableInvoices.map((inv) => (
                <option key={inv.invoiceNo} value={inv.invoiceNo}>
                  {inv.invoiceNo} — AED {formatAmount(inv.amount)} (
                  {inv.status})
                </option>
              ))}
            </Select>
          </div>

          {/* 3. From Date */}
          <div className="md:col-span-2.5 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              From Date
            </label>
            <DatePicker
              value={fromDate}
              onChange={(val) => setFromDate(val)}
              placeholder="Start date"
              className="w-full text-xs font-semibold bg-white border-slate-200 shadow-2xs h-9.5 rounded-xl"
            />
          </div>

          {/* 4. To Date */}
          <div className="md:col-span-2.5 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              To Date
            </label>
            <DatePicker
              value={toDate}
              onChange={(val) => setToDate(val)}
              placeholder="End date"
              className="w-full text-xs font-semibold bg-white border-slate-200 shadow-2xs h-9.5 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {soaLoading && (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="inline-block animate-spin w-8 h-8 border-3 border-agm-green border-t-transparent rounded-full mb-3"></div>
          <p className="text-xs font-bold text-slate-600">
            Generating Statement of Account & Reconciling Ledgers...
          </p>
        </div>
      )}

      {/* Empty / Unselected Customer State */}
      {!soaLoading && !soaData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
          <div className="max-w-xl mx-auto text-center space-y-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-agm-green border border-emerald-200/80 flex items-center justify-center mx-auto shadow-2xs">
              <ReceiptIcon size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Select a Customer to Generate Statement
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Choose an active client from the cards below or select from the
              dropdown above to view their financial statement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customers.map((c) => (
              <Button
                key={c.id}
                type="button"
                variant="outline"
                onClick={() => setSelectedCustomerId(c.id)}
                className="w-full text-left p-4 rounded-xl border-slate-200 hover:border-agm-green hover:bg-slate-50/70 transition-all group flex flex-col items-stretch justify-between cursor-pointer bg-white shadow-2xs h-auto block font-normal"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10.5px] font-bold text-slate-500">
                      {c.customerCode}
                    </span>
                    <span className="text-[10px] text-agm-green font-bold group-hover:underline">
                      View SOA →
                    </span>
                  </div>
                  <div className="font-bold text-sm text-slate-900 group-hover:text-agm-green transition-colors">
                    {c.name}
                  </div>
                  {c.companyName && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      {c.companyName}
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-normal">
                  <span className="text-slate-400 font-medium">Balance:</span>
                  <span className="font-mono font-bold text-slate-800">
                    AED {formatAmount(c.currentBalance || 0)}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Loaded SOA View */}
      {!soaLoading && filteredData && (
        <div className="space-y-6">
          {/* VIEW 1: MODERN DASHBOARD VIEW (amounts focused, clean & user-friendly) */}
          {viewMode === "DASHBOARD" && (
            <div className="space-y-6 print:hidden">
              {/* Amounts-Focused KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Invoiced */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Total Invoiced
                    </span>
                    <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      {formatAmount(filteredData.totals.invoices)}
                      <span className="text-xs font-semibold text-slate-400 ml-1.5">
                        AED
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {selectedInvoiceFilter !== "ALL"
                        ? `Invoice #${selectedInvoiceFilter}`
                        : "Gross client billings"}
                    </div>
                  </div>
                </div>

                {/* 2. Total Collected */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Total Received
                    </span>
                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <ArrowDownLeft className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-emerald-700 tracking-tight">
                      {formatAmount(filteredData.totals.payments)}
                      <span className="text-xs font-semibold text-emerald-500/80 ml-1.5">
                        AED
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Collected payment receipts
                    </div>
                  </div>
                </div>

                {/* 3. Outstanding Balance */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Closing Balance Due
                    </span>
                    <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                      <DollarSign className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-black text-rose-600 tracking-tight">
                      {formatAmount(filteredData.totals.closingBalance)}
                      <span className="text-xs font-semibold text-rose-400 ml-1.5">
                        AED
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Open receivable balance
                    </div>
                  </div>
                </div>

                {/* 4. Filter Scope Status */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Filter Scope
                    </span>
                    <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                      <SlidersHorizontal className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {selectedInvoiceFilter === "ALL"
                        ? "All Invoices Statement"
                        : selectedInvoiceFilter}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                      Client: {selectedCustomer?.name || filteredData.customer.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions & Invoices Table Container */}
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-agm-green" />
                      <span>Account Transactions & Invoices</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Showing {displayedTransactions.length} transaction entries
                      {selectedInvoiceFilter !== "ALL" && (
                        <span> for {selectedInvoiceFilter}</span>
                      )}
                    </p>
                  </div>

                  {/* Search inside table */}
                  <div className="relative w-64 max-w-full">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search transactions, ref..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none transition-colors font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10.5px] tracking-wider">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Reference</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4 text-right">Debit (AED)</th>
                        <th className="py-3 px-4 text-right">Credit (AED)</th>
                        <th className="py-3 px-4 text-right">Balance (AED)</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedTransactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-12 text-center text-slate-400 text-xs font-medium"
                          >
                            No transactions found for the selected invoice or
                            filter.
                          </td>
                        </tr>
                      ) : (
                        displayedTransactions.map((tx, idx) => (
                          <tr
                            key={tx.id || idx}
                            className="hover:bg-slate-50/70 transition-colors"
                          >
                            <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                              {formatDateDisplay(tx.date)}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold ${
                                  tx.rawType === "INVOICE"
                                    ? "bg-blue-50 text-blue-700 border border-blue-200/80"
                                    : tx.rawType === "PAYMENT"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                                      : "bg-slate-100 text-slate-700 border border-slate-200/80"
                                }`}
                              >
                                {tx.type || tx.rawType}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                              {tx.reference || "—"}
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                              {tx.description || tx.projectScope || "—"}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                              {tx.debit > 0 ? formatAmount(tx.debit) : "—"}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-emerald-600">
                              {tx.credit > 0 ? formatAmount(tx.credit) : "—"}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-black text-slate-900">
                              {formatAmount(tx.balance)}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  tx.status === "Paid" ||
                                  tx.status === "POSTED" ||
                                  tx.status === "Cleared"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : tx.status === "Unpaid"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {tx.status || "Posted"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50/90 border-t border-slate-200 font-bold text-xs">
                      <tr>
                        <td colSpan={4} className="py-3 px-4 text-slate-700">
                          Total Summary ({displayedTransactions.length} records)
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-900 font-black">
                          {formatAmount(filteredData.totals.invoices)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-700 font-black">
                          {formatAmount(filteredData.totals.payments)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-rose-600 font-black">
                          {formatAmount(filteredData.totals.closingBalance)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: DOCUMENT PREVIEW ON SCREEN (When user toggles to document view) */}
          {viewMode === "DOCUMENT" && (
            <div className="print:hidden">
              <StatementOfAccountDocument data={filteredData} />
            </div>
          )}

          {/* PRINT-ONLY OFFICIAL DOCUMENT: Always rendered for the browser print engine */}
          <div className="hidden print:block">
            <StatementOfAccountDocument data={filteredData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default StatementOfAccountReport;
