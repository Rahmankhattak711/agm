"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useSalesInvoices,
  usePostSalesInvoice,
  useCreateCustomerPayment,
  SalesInvoice,
} from "@/lib/hooks/api-hooks";
import { formatAed, formatPdfDocumentTitle, printWithDocumentTitle } from "@/lib/utils/format";
import { toast } from "@/lib/toast";
import {
  ArrowLeft,
  Printer,
  CreditCard,
  Send,
  Edit,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  ChevronRight,
  Maximize2,
  Building,
  User,
  Calendar,
  Layers,
} from "lucide-react";
import { RecordPaymentModal } from "../components/RecordPaymentModal";
import { PrintableTaxInvoice } from "../components/PrintableTaxInvoice";

export default function SalesInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const invoiceId = (params?.id as string) || "";

  // Fetch full details of the active invoice
  const { data: invoice, isLoading, refetch } = useQuery<any>({
    queryKey: ["sales-invoice-detail", invoiceId],
    queryFn: async () => {
      const res = await fetch(`/api/commercial/sales-invoices/${encodeURIComponent(invoiceId)}`);
      if (!res.ok) throw new Error("Failed to load invoice");
      return await res.json();
    },
    enabled: Boolean(invoiceId),
  });

  // Fetch all invoices for master-detail left list matching Wafeq Image 2
  const { data: allInvoices = [] } = useSalesInvoices();

  const [searchSidebar, setSearchSidebar] = useState("");
  const [isJournalPopoverOpen, setIsJournalPopoverOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const postMutation = usePostSalesInvoice();
  const paymentMutation = useCreateCustomerPayment();

  // Filter sidebar invoices
  const filteredSidebarInvoices = useMemo(() => {
    const q = searchSidebar.toLowerCase().trim();
    if (!q) return allInvoices;
    return allInvoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerTrn && inv.customerTrn.toLowerCase().includes(q))
    );
  }, [allInvoices, searchSidebar]);

  const handlePostInvoice = async () => {
    if (!invoice?.id) return;
    try {
      await postMutation.mutateAsync(invoice.id);
      toast.success("Sales invoice posted to General Ledger!");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["general-ledger"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to post invoice");
    }
  };

  const handlePrint = () => {
    if (!invoice) return;
    const printTitle = formatPdfDocumentTitle(
      [invoice.invoiceNumber, invoice.customerName],
      "Tax-Invoice"
    );
    printWithDocumentTitle(printTitle);
  };

  // Journal Entry lines extracted from relation
  const journalLines = invoice?.journalEntry?.lines || [];
  const journalNumber = invoice?.journalEntry?.entryNumber || "";

  const journalTotals = useMemo(() => {
    let dr = 0;
    let cr = 0;
    journalLines.forEach((l: any) => {
      dr += Number(l.debit || 0);
      cr += Number(l.credit || 0);
    });
    return {
      dr: Math.round(dr * 100) / 100,
      cr: Math.round(cr * 100) / 100,
      isBalanced: Math.abs(dr - cr) < 0.05 && dr > 0,
    };
  }, [journalLines]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12 bg-white">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading sales invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white space-y-4">
        <p className="text-sm text-slate-600 font-semibold">Sales Invoice not found</p>
        <button
          type="button"
          onClick={() => router.push("/commercial/sales-invoices")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-indigo-700 cursor-pointer"
        >
          &larr; Back to Invoices
        </button>
      </div>
    );
  }

  const isFinalized = invoice.status === "POSTED" || invoice.status === "PAID" || invoice.status === "PARTIALLY_PAID";
  const balanceDue = Number(invoice.remainingBalance !== undefined ? invoice.remainingBalance : invoice.totalAmount || 0);

  return (
    <div className="w-full h-full min-h-screen bg-slate-100 flex overflow-hidden">
      {/* ══════════ LEFT PANE: INVOICES MASTER LIST matching Image 2 ══════════ */}
      <div
        className={`${
          isSidebarOpen ? "w-80 md:w-88" : "w-0 hidden md:block md:w-0"
        } shrink-0 bg-white border-r border-slate-200/90 flex flex-col transition-all duration-200 z-10 overflow-hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-100 space-y-2.5 bg-slate-50/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium">Sales</span>
              <span className="text-slate-300">&gt;</span>
              <span className="text-slate-900 font-bold">Invoices</span>
            </div>
            <button
              type="button"
              onClick={() => router.push("/commercial/sales-invoices")}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
            >
              All Invoices
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchSidebar}
              onChange={(e) => setSearchSidebar(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Invoice List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80 custom-scrollbar">
          {filteredSidebarInvoices.map((inv) => {
            const isActive = inv.id === invoice.id || inv.invoiceNumber === invoice.invoiceNumber;
            const isInvFinalized = inv.status === "POSTED" || inv.status === "PAID";
            return (
              <div
                key={inv.id}
                onClick={() => router.push(`/commercial/sales-invoices/${inv.id}`)}
                className={`p-3 cursor-pointer transition-colors ${
                  isActive
                    ? "bg-indigo-50/70 border-l-4 border-indigo-600 pl-2"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900 truncate max-w-[140px]">
                    {inv.customerName || "Customer"}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    AED {Number(inv.totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>
                    {new Date(inv.invoiceDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    | {inv.invoiceNumber}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold uppercase ${
                      isInvFinalized
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════ RIGHT PANE: DEDICATED INVOICE DETAIL VIEW matching Image 2 ══════════ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
        {/* Top Control Bar matching Image 2 */}
        <div className="bg-white px-6 py-3.5 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs">
          {/* Left: Back Button + Sidebar Toggle + Invoice Title + Status + Accounting Journal Badge (🟩🟩) */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/commercial/sales-invoices");
                }
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="Go back to previous page"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSidebarOpen((v) => !v)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer hidden md:flex"
              title={isSidebarOpen ? "Collapse Invoices List" : "Show Invoices List"}
            >
              <Layers className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Invoice {invoice.invoiceNumber}
                </h1>

                {/* Status Pill */}
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase ${
                    isFinalized
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {invoice.status === "POSTED" ? "FINALIZED" : invoice.status}
                </span>

                {/* ══════════ ACCOUNTING JOURNAL BADGE (🟩🟩) matching Image 2 red line ══════════ */}
                {isFinalized && (
                  <div
                    className="relative"
                    onMouseEnter={() => setIsJournalPopoverOpen(true)}
                    onMouseLeave={() => setIsJournalPopoverOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/finance/general-ledger?journalId=${encodeURIComponent(
                            journalNumber || invoice.invoiceNumber
                          )}`
                        )
                      }
                      className="inline-flex items-center gap-1 p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all cursor-pointer shadow-2xs group"
                      title="View in General Ledger (Click to open, hover to preview Dr/Cr)"
                    >
                      <div className="flex items-center -space-x-1">
                        <span className="w-2.5 h-3 bg-emerald-500 rounded-xs" />
                        <span className="w-2.5 h-3 bg-emerald-400 rounded-xs" />
                      </div>
                    </button>

                    {/* Popover showing Live Double-Entry Journal Lines matching Image 2 */}
                    {isJournalPopoverOpen && (
                      <div
                        className="absolute left-0 top-full mt-2 w-84 bg-white border border-slate-200 rounded-xl shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 text-xs">Accounting Entry</span>
                            {journalNumber && (
                              <span className="font-mono text-[10px] text-slate-400">#{journalNumber}</span>
                            )}
                          </div>
                          {journalTotals.isBalanced && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Balanced
                            </span>
                          )}
                        </div>

                        {journalLines.length === 0 ? (
                          <div className="text-center py-4 text-xs text-slate-400">
                            No journal lines found for this entry.
                          </div>
                        ) : (
                          <div className="space-y-1.5 font-mono text-xs">
                            {journalLines.map((line: any, idx: number) => {
                              const isDebit = Number(line.debit) > 0;
                              return (
                                <div
                                  key={line.id || idx}
                                  className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 text-[11px]"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className={`px-1 py-0.2 rounded font-sans text-[10px] font-bold ${
                                        isDebit
                                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                                          : "bg-amber-50 text-amber-700 border border-amber-200"
                                      }`}
                                    >
                                      {isDebit ? "Dr" : "Cr"}
                                    </span>
                                    <span className="font-sans text-slate-700 truncate" title={line.account?.accountName}>
                                      {line.account?.accountName || "Account"}
                                    </span>
                                  </div>
                                  <span className="font-bold text-slate-900 shrink-0">
                                    {isDebit ? Number(line.debit).toFixed(2) : Number(line.credit).toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}

                            <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px] font-sans text-slate-500">
                              <span>Total Debits / Credits:</span>
                              <span className="font-mono font-bold text-slate-900">AED {journalTotals.dr.toFixed(2)}</span>
                            </div>
                          </div>
                        )}

                        <div className="pt-2.5 mt-2.5 border-t border-slate-100 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/finance/general-ledger?journalId=${encodeURIComponent(
                                  journalNumber || invoice.invoiceNumber
                                )}`
                              )
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                          >
                            <span>Open in General Ledger</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {invoice.customerName} &bull; Created {new Date(invoice.createdAt || invoice.invoiceDate).toLocaleDateString("en-GB")}
              </p>
            </div>
          </div>

          {/* Right Action Buttons matching Image 2 */}
          <div className="flex items-center gap-2">
            {!isFinalized && (
              <button
                type="button"
                onClick={handlePostInvoice}
                disabled={postMutation.isPending}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Post to GL</span>
              </button>
            )}

            {isFinalized && balanceDue > 0 && (
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-4 py-1.5 rounded-lg bg-[#5046e5] hover:bg-[#4338ca] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record payment</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* ══════════ MAIN SCROLLABLE CANVAS: VISUAL INVOICE PREVIEW matching Image 2 ══════════ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Payments Summary Bar if payments exist */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Recorded Payments ({invoice.payments.length})</span>
                  </h3>
                  <span className="font-mono text-xs font-bold text-emerald-700">
                    Paid: AED {Number(invoice.paidAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="divide-y divide-slate-100 text-xs font-mono">
                  {invoice.payments.map((p: any) => (
                    <div key={p.id} className="py-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/finance/general-ledger?journalId=${encodeURIComponent(
                                p.referenceNumber || p.paymentNumber || invoice.invoiceNumber
                              )}`
                            )
                          }
                          className="inline-flex items-center gap-1 p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-all cursor-pointer shadow-2xs"
                          title="Open Payment Journal Entry in General Ledger"
                        >
                          <div className="flex items-center -space-x-1">
                            <span className="w-2 h-2.5 bg-emerald-500 rounded-xs" />
                            <span className="w-2 h-2.5 bg-emerald-400 rounded-xs" />
                          </div>
                        </button>
                        <span className="text-slate-600">{new Date(p.paymentDate).toLocaleDateString("en-GB")}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-sans font-medium text-[10px]">
                          {p.paymentMethod}
                        </span>
                        {p.referenceNumber && (
                          <span className="text-slate-400 text-[11px]">Ref: {p.referenceNumber}</span>
                        )}
                      </div>
                      <span className="font-bold text-slate-900">
                        AED {Number(p.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visual Tax Invoice Document Preview Canvas matching Image 2 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md p-8 sm:p-12 relative overflow-hidden">
              {/* Document Header */}
              <div className="flex justify-between items-start pb-8 border-b border-slate-100">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Invoice</h2>
                  <p className="text-xs text-slate-500 font-medium mt-1 font-mono">
                    Tax Invoice / فاتورة ضريبية
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 text-base">AGM Contracting & Fitout LLC</div>
                  <div className="text-xs text-slate-500">Business Bay, Dubai, United Arab Emirates</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">TRN: 100492819000003</div>
                </div>
              </div>

              {/* Client & Metadata Two-Column Grid */}
              <div className="grid grid-cols-2 gap-8 py-8 border-b border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-medium uppercase text-[10px] tracking-wider block mb-1">
                    Customer / Client
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{invoice.customerName}</div>
                  {invoice.customerTrn && (
                    <div className="text-slate-600 font-mono mt-0.5">TRN: {invoice.customerTrn}</div>
                  )}
                  {invoice.projectScope && (
                    <div className="text-slate-500 mt-1 italic">Scope: {invoice.projectScope}</div>
                  )}
                </div>

                <div className="text-right space-y-1">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-medium">Invoice Number: </span>
                    <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-medium">Date: </span>
                    <span className="font-mono text-slate-700">
                      {new Date(invoice.invoiceDate).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-medium">Due Date: </span>
                    <span className="font-mono text-slate-700">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-GB") : "Upon Receipt"}
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="text-slate-400 text-[10px] uppercase font-medium">Balance Due: </span>
                    <span className="font-mono text-base font-bold text-slate-900">
                      AED {balanceDue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="py-6">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <th className="py-2.5 px-2">#</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">VAT Rate</th>
                      <th className="py-2.5 px-3 text-right">Total (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {invoice.items && invoice.items.length > 0 ? (
                      invoice.items.map((it: any, idx: number) => (
                        <tr key={it.id || idx}>
                          <td className="py-3 px-2 text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3 font-sans font-medium text-slate-800">
                            {it.description}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600">
                            {Number(it.quantity || 1).toFixed(2)} {it.unit || "SQM"}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600">
                            {Number(it.unitPrice || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-500 font-sans text-[11px]">
                            5% Standard
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">
                            {Number(it.totalAmount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-3 px-2 text-slate-400">1</td>
                        <td className="py-3 px-3 font-sans font-medium text-slate-800">
                          {invoice.projectScope || "Commercial Fitout & Contracting Services"}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600">1.00 SQM</td>
                        <td className="py-3 px-3 text-right text-slate-600">
                          {Number(invoice.subtotal || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500 font-sans text-[11px]">
                          5% Standard
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {Number(invoice.subtotal || 0).toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals Breakdown */}
              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <div className="w-72 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-sans">Subtotal (Excl. VAT):</span>
                    <span>AED {Number(invoice.subtotal || 0).toFixed(2)}</span>
                  </div>

                  {Number(invoice.discount || 0) > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span className="font-sans">Discount:</span>
                      <span>- AED {Number(invoice.discount).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span className="font-sans">5% UAE Output VAT:</span>
                    <span>AED {Number(invoice.vatAmount || 0).toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t-2 border-slate-900 flex justify-between font-bold text-sm text-slate-900">
                    <span className="font-sans">Total (AED):</span>
                    <span>AED {Number(invoice.totalAmount || 0).toFixed(2)}</span>
                  </div>

                  {Number(invoice.paidAmount || 0) > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span className="font-sans">Amount Paid:</span>
                      <span>AED {Number(invoice.paidAmount).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-1 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                    <span className="font-sans">Balance Due:</span>
                    <span>AED {balanceDue.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Terms and Bank Transfer Details */}
              <div className="mt-12 pt-6 border-t border-slate-100 grid grid-cols-2 gap-6 text-[11px] text-slate-500">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">
                    Bank Account Details
                  </h4>
                  <p>Bank: RAK Bank PJSC</p>
                  <p className="font-mono">IBAN: AE920330000000123456789</p>
                  <p className="font-mono">Account: 0012345678901</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider mb-1">
                    Terms & Conditions
                  </h4>
                  <p>Payment is due according to agreed milestones.</p>
                  <p>All values in United Arab Emirates Dirham (AED).</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <RecordPaymentModal
          invoice={invoice}
          onClose={() => setIsPaymentModalOpen(false)}
          onSubmitPayment={async (paymentData) => {
            await paymentMutation.mutateAsync(paymentData);
            toast.success("Payment recorded and customer receipt generated!");
            setIsPaymentModalOpen(false);
            refetch();
            queryClient.invalidateQueries({ queryKey: ["sales-invoices"] });
            queryClient.invalidateQueries({ queryKey: ["general-ledger"] });
          }}
        />
      )}

      {/* Hidden printable tax invoice component for browser print */}
      <div className="hidden print:block">
        <PrintableTaxInvoice invoice={invoice} />
      </div>
    </div>
  );
}
