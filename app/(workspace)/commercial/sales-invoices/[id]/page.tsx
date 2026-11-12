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
          <div className="w-8 h-8 border-3 border-[#1d4ed8] border-t-transparent rounded-full animate-spin mx-auto" />
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
          className="px-4 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
        >
          &larr; Back to Invoices
        </button>
      </div>
    );
  }

  const isFinalized = invoice.status === "POSTED" || invoice.status === "PAID" || invoice.status === "PARTIALLY_PAID";
  const balanceDue = Number(invoice.remainingBalance !== undefined ? invoice.remainingBalance : invoice.totalAmount || 0);

  return (
    <div className="w-full h-full min-h-screen bg-[#f8fafc] flex overflow-hidden print:block print:bg-white print:overflow-visible print:min-h-0 print:h-auto print:p-0 print:m-0">
      {/* ══════════ LEFT PANE: INVOICES MASTER LIST ══════════ */}
      <div
        className={`${
          isSidebarOpen ? "w-80 md:w-88" : "w-0 hidden md:block md:w-0"
        } shrink-0 bg-white border-r border-slate-200/90 flex flex-col transition-all duration-200 z-10 overflow-hidden print:hidden`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-100 space-y-2.5 bg-slate-50/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium">Commercial</span>
              <span className="text-slate-300">&gt;</span>
              <span className="text-slate-900 font-bold">Invoices</span>
            </div>
            <button
              type="button"
              onClick={() => router.push("/commercial/sales-invoices")}
              className="text-[11px] font-semibold text-[#1d4ed8] hover:text-[#1e40af] cursor-pointer"
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
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
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
                    ? "bg-[#eff6ff] border-l-4 border-[#1d4ed8] pl-2"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                    {inv.customerName || "Customer"}
                  </span>
                  <span className="font-mono font-medium text-slate-800">
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
                    className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium uppercase"
                    style={{
                      backgroundColor:
                        inv.status === "PAID"
                          ? "#f0fdf4"
                          : isInvFinalized
                            ? "#eff6ff"
                            : "#fefce8",
                      color:
                        inv.status === "PAID"
                          ? "#15803d"
                          : isInvFinalized
                            ? "#1d4ed8"
                            : "#a16207",
                      border:
                        inv.status === "PAID"
                          ? "1px solid #bbf7d0"
                          : isInvFinalized
                            ? "1px solid #bfdbfe"
                            : "1px solid #fef08a",
                    }}
                  >
                    {inv.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════ RIGHT PANE: DEDICATED INVOICE DETAIL VIEW ══════════ */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50 print:block print:overflow-visible print:h-auto print:bg-white print:p-0 print:m-0">
        {/* Top Control Bar */}
        <div
          className="bg-white px-5 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-2xs print:hidden"
          style={{ borderColor: "#cbd5e1" }}
        >
          {/* Left: Back Button + Sidebar Toggle + Invoice Title + Status + Accounting Journal Badge */}
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
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-[#f8fafc] transition-colors shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
              style={{ border: "1px solid #cbd5e1" }}
              title="Go back to previous page"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsSidebarOpen((v) => !v)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-[#f8fafc] cursor-pointer hidden md:flex transition-colors shadow-2xs"
              style={{ border: "1px solid #cbd5e1" }}
              title={isSidebarOpen ? "Collapse Invoices List" : "Show Invoices List"}
            >
              <Layers className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-800 tracking-tight">
                  Invoice {invoice.invoiceNumber}
                </h1>

                {/* Status Pill */}
                <span
                  className="px-2 py-0.5 rounded text-[10.5px] font-medium tracking-wide uppercase"
                  style={{
                    backgroundColor:
                      invoice.status === "PAID"
                        ? "#f0fdf4"
                        : isFinalized
                          ? "#eff6ff"
                          : "#fefce8",
                    color:
                      invoice.status === "PAID"
                        ? "#15803d"
                        : isFinalized
                          ? "#1d4ed8"
                          : "#a16207",
                    border:
                      invoice.status === "PAID"
                        ? "1px solid #bbf7d0"
                        : isFinalized
                          ? "1px solid #bfdbfe"
                          : "1px solid #fef08a",
                  }}
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
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1d4ed8] hover:text-[#1e40af] hover:underline cursor-pointer"
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
                className="px-3.5 py-1.5 rounded-lg bg-[#15803d] hover:bg-[#166534] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Post to GL</span>
              </button>
            )}

            {isFinalized && balanceDue > 0 && (
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                style={{ backgroundColor: "#1d4ed8" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#1e40af")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#1d4ed8")
                }
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record payment</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg border border-[#cbd5e1] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* ══════════ MAIN SCROLLABLE CANVAS: VISUAL INVOICE PREVIEW ══════════ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar print:p-0 print:m-0 print:overflow-visible print:block print:w-full bg-[#f8fafc] print:bg-white">
          <div className="max-w-4xl mx-auto space-y-6 print:space-y-0 print:max-w-none print:w-full print:m-0 print:p-0">
            {/* Payments Summary Bar if payments exist */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs print:hidden">
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

            {/* Visual Official Tax Invoice Document (Identical to Quotation PDF / Template standard) */}
            <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar print:overflow-visible">
              <PrintableTaxInvoice invoice={invoice} />
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
    </div>
  );
}
