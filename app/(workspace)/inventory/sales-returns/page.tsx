"use client";

import React, { Fragment, useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { ArrowLeft, RotateCcw, Plus, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import {
  ChevronDownIcon,
  PlusIcon,
  PrintIcon,
  RotateCcwIcon,
  SearchIcon,
  PackageIcon,
  ScaleIcon,
  FileTextIcon,
} from "@/components/icons";
import {
  Button,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  Input,
  Textarea,
  EmptyState,
  PageHeader,
  FilterBar,
} from "@/components/ui";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import {
  useCreditNotes,
  useCreateCreditNote,
  useSalesInvoices,
  useCustomers,
  CreditNote,
} from "@/lib/hooks/commercial-hooks";
import { formatNumber } from "@/lib/utils/format";
import { SalesReturnExpandedRow } from "./components/SalesReturnExpandedRow";

const STATUS_BADGE_CLASSES: Record<string, string> = {
  POSTED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  APPROVED: "bg-sky-50 text-sky-800 border-sky-200",
  SUBMITTED: "bg-amber-50 text-amber-800 border-amber-200",
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELLED: "bg-rose-50 text-rose-800 border-rose-200",
  REJECTED: "bg-rose-50 text-rose-800 border-rose-200",
};

const STATUS_FILTERS = [
  { id: "ALL", label: "All Returns" },
  { id: "POSTED", label: "Posted / Approved" },
  { id: "DRAFT", label: "Drafts" },
  { id: "CANCELLED", label: "Cancelled" },
] as const;

function formatAed(amount: number | string | undefined): string {
  return `AED ${formatNumber(amount)}`;
}

interface ReturnFormState {
  salesInvoiceId: string;
  invoiceReference: string;
  customerId: string;
  customerName: string;
  projectScope: string;
  returnReason: string;
  returnAmount: string;
  returnDate: string;
}

const EMPTY_FORM: ReturnFormState = {
  salesInvoiceId: "",
  invoiceReference: "",
  customerId: "",
  customerName: "",
  projectScope: "",
  returnReason: "",
  returnAmount: "",
  returnDate: new Date().toISOString().slice(0, 10),
};

interface SalesReturnDocumentProps {
  item: CreditNote;
}

const SalesReturnDocument: React.FC<SalesReturnDocumentProps> = ({ item }) => {
  const total = Number(item.totalAmount || 0);
  const subtotal = Number(item.subtotal || total / 1.05);
  const vatAmount = Number(item.vatAmount || total - subtotal);
  const formattedDate = item.returnDate
    ? new Date(item.returnDate).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");

  const customerDisplay =
    item.customerRel?.companyName ||
    item.customerRel?.name ||
    item.customerName ||
    "Valued Client";

  const invoiceRefDisplay =
    item.salesInvoice?.invoiceNumber || "Credit Adjustment";

  const scopeDisplay =
    item.salesInvoice?.projectScope || "Commercial Fitout Adjustment";

  return (
    <div
      id="printable-voucher"
      className="mx-auto bg-white max-w-4xl min-w-[700px] md:min-w-0 rounded-xl print:rounded-none overflow-visible print:overflow-visible print:w-full print:shadow-none"
    >
      <table className="print-page-table w-full border-collapse">
        <thead className="print-page-header-group">
          <tr>
            <th className="p-0 font-normal text-left border-none">
              <QuotationHeader />
            </th>
          </tr>
        </thead>

        <tfoot className="print-page-footer-group">
          <tr>
            <td className="p-0 border-none align-bottom">
              <div
                className="w-full opacity-0 pointer-events-none select-none"
                style={{ minHeight: "175px" }}
                aria-hidden="true"
              >
                <QuotationFooter />
                <div style={{ height: "45px", minHeight: "45px" }} />
              </div>
            </td>
          </tr>
        </tfoot>

        <tbody className="print-page-body-group">
          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 py-3.5 print:px-8 print:py-2.5 w-full border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between gap-8">
                  <div>
                    <h1 className="text-2xl print:text-2xl font-black text-slate-900 tracking-tight">
                      SALES CREDIT NOTE
                    </h1>
                    <p className="text-[11px] print:text-[11px] font-semibold text-emerald-700 mt-0.5 print:mt-0">
                      Official UAE FTA Credit Adjustment Document (Standard
                      Rated 5% VAT)
                    </p>
                  </div>

                  <div className="w-[340px] print:w-[340px] space-y-1 text-[12px] print:text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Credit Note No:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {item.creditNoteNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Date:
                      </span>
                      <span className="font-bold text-slate-900">
                        {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Invoice Ref:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {invoiceRefDisplay}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Status:
                      </span>
                      <span className="font-bold text-emerald-800">
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-0 border-none align-top">
              <div className="grid grid-cols-2 gap-4 print:gap-3 px-10 py-3.5 print:px-8 print:py-2 text-[12px] print:text-[12px] print-avoid-break">
                <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2.5 rounded-xl shadow-2xs">
                  <div className="font-bold mb-2 print:mb-1.5 text-slate-900 uppercase text-[11px] print:text-[11px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                    CLIENT / CREDIT TO
                  </div>
                  <div className="space-y-1.5 print:space-y-1">
                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Client Name:
                      </span>
                      <span className="font-bold text-slate-900">
                        {customerDisplay}
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Address:
                      </span>
                      <span className="text-slate-700">
                        Dubai, United Arab Emirates
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Linked Ref:
                      </span>
                      <span className="font-mono text-slate-800 font-bold">
                        Invoice #{invoiceRefDisplay}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2.5 rounded-xl shadow-2xs">
                  <div className="font-bold mb-2 print:mb-1.5 text-slate-900 uppercase text-[11px] print:text-[11px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                    PROJECT &amp; SCOPE ADJUSTMENT
                  </div>
                  <div className="space-y-1.5 print:space-y-1">
                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Project Scope:
                      </span>
                      <span className="font-bold text-slate-900">
                        {scopeDisplay}
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Return Reason:
                      </span>
                      <span className="text-slate-700 font-medium">
                        {item.reason || "Credit adjustment on invoice scope"}
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Jurisdiction:
                      </span>
                      <span className="text-slate-700">
                        Dubai FTA Standard Rated (5%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 mt-2 print:px-8 print:mt-1">
                <table className="w-full text-[12px] print:text-[11px] border-collapse border border-agm-box-border bg-white rounded-lg overflow-hidden shadow-xs">
                  <thead>
                    <tr className="text-center text-white bg-agm-green print-avoid-break">
                      <th className="py-2.5 px-2 print:py-1.5 print:px-1 font-bold w-12 border border-agm-box-border text-white text-center align-middle">
                        S.No
                      </th>
                      <th className="py-2.5 px-3 print:py-1.5 print:px-2 font-bold border border-agm-box-border text-white text-left align-middle">
                        DESCRIPTION OF WORK / CREDIT ADJUSTMENT SCOPE
                      </th>
                      <th className="py-2.5 px-2 print:py-1.5 print:px-1 font-bold w-20 border border-agm-box-border text-white text-center align-middle">
                        QTY
                      </th>
                      <th className="py-2.5 px-3 print:py-1.5 print:px-2 font-bold w-28 border border-agm-box-border text-white text-right align-middle">
                        RATE (AED)
                      </th>
                      <th className="py-2.5 px-3 print:py-1.5 print:px-2 font-bold w-32 border border-agm-box-border text-white text-right align-middle">
                        TOTAL (AED)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-agm-box-border">
                    {item.items && item.items.length > 0 ? (
                      item.items.map((it: any, idx: number) => {
                        const qty = Number(it.quantity || 1);
                        const price = Number(it.unitPrice || subtotal);
                        const lineTot = Number(it.totalAmount || qty * price);
                        return (
                          <tr
                            key={it.id || idx}
                            className="hover:bg-slate-50/50 bg-white print-avoid-break"
                          >
                            <td className="py-3 px-2 print:py-2 print:px-1 align-middle text-center font-bold text-slate-700 border border-agm-box-border">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3 print:py-2 print:px-2 align-middle text-left font-medium text-slate-800 border border-agm-box-border">
                              <div className="font-bold text-slate-900 leading-snug">
                                {it.description ||
                                  item.reason ||
                                  "Credit adjustment"}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Reversal against Invoice Ref:{" "}
                                {invoiceRefDisplay}
                              </div>
                            </td>
                            <td className="py-3 px-2 print:py-2 print:px-1 align-middle text-center font-mono font-bold text-slate-800 border border-agm-box-border">
                              {qty}
                            </td>
                            <td className="py-3 px-3 print:py-2 print:px-2 align-middle text-right font-mono font-semibold text-slate-800 border border-agm-box-border">
                              {formatNumber(price)}
                            </td>
                            <td className="py-3 px-3 print:py-2 print:px-2 align-middle text-right font-mono font-bold text-slate-900 border border-agm-box-border">
                              {formatNumber(lineTot)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="hover:bg-slate-50/50 bg-white print-avoid-break">
                        <td className="py-3 px-2 print:py-2 print:px-1 align-middle text-center font-bold text-slate-700 border border-agm-box-border">
                          1
                        </td>
                        <td className="py-3 px-3 print:py-2 print:px-2 align-middle text-left font-medium text-slate-800 border border-agm-box-border">
                          <div className="font-bold text-slate-900 leading-snug">
                            {item.reason || "Credit Adjustment"}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Scope: {scopeDisplay} • Reversal against Invoice
                            Ref: {invoiceRefDisplay}
                          </div>
                        </td>
                        <td className="py-3 px-2 print:py-2 print:px-1 align-middle text-center font-mono font-bold text-slate-800 border border-agm-box-border">
                          1
                        </td>
                        <td className="py-3 px-3 print:py-2 print:px-2 align-middle text-right font-mono font-semibold text-slate-800 border border-agm-box-border">
                          {formatNumber(subtotal)}
                        </td>
                        <td className="py-3 px-3 print:py-2 print:px-2 align-middle text-right font-mono font-bold text-slate-900 border border-agm-box-border">
                          {formatNumber(subtotal)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 print:px-8">
                <div className="flex items-stretch justify-between gap-4 mt-3.5 print:mt-2 print-avoid-break">
                  <div className="flex-1 border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2 rounded-xl text-[11.5px] print:text-[10px] flex flex-col justify-center shadow-2xs">
                    <div className="font-bold mb-1 text-slate-900 uppercase text-[11px] print:text-[10px] tracking-wider text-agm-green flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                      GENERAL LEDGER &amp; TAX ADJUSTMENT MEMO
                    </div>
                    <div className="space-y-1 text-slate-700 font-medium leading-relaxed">
                      <div>
                        This Credit Note certifies an agreed reduction in
                        Accounts Receivable for client{" "}
                        <strong>{customerDisplay}</strong>.
                      </div>
                      <div className="text-[10.5px] text-slate-600 font-mono">
                        Double-Entry GL Impact: Dr. Service Income (4000) • Dr.
                        VAT Output (2210) • Cr. Accounts Receivable (1200)
                      </div>
                    </div>
                  </div>

                  <div className="w-80 border border-slate-200 print:border-slate-300 bg-white rounded-xl overflow-hidden shadow-2xs text-[12px] print:text-[11px]">
                    <div className="divide-y divide-slate-100 print:divide-slate-200">
                      <div className="flex items-center justify-between px-4 py-2.5 print:py-1.5 bg-slate-50/40">
                        <span className="font-semibold text-slate-600">
                          Credit Subtotal (Excl. VAT):
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          AED {formatNumber(subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5 print:py-1.5 bg-slate-50/40">
                        <span className="font-semibold text-slate-600">
                          VAT Adjustment (5%):
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          AED {formatNumber(vatAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3 print:py-2 bg-rose-50/80 font-bold">
                        <span className="text-rose-900 uppercase tracking-tight text-[11.5px] print:text-[10.5px]">
                          Total Credit Note Value:
                        </span>
                        <span className="font-mono text-base print:text-sm font-black text-rose-700">
                          AED {formatNumber(total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="print-footer-bottom fixed-print-footer hidden print:block">
        <QuotationFooter />
      </div>

      {/* On-screen footer - full width flush with document bottom */}
      <div className="w-full mt-8 print:hidden overflow-hidden rounded-b-xl border-t border-slate-100">
        <QuotationFooter />
      </div>
    </div>
  );
};

export default function SalesReturnsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [itemToPrint, setItemToPrint] = useState<CreditNote | null>(null);
  const [expandedReturnId, setExpandedReturnId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState<ReturnFormState>(EMPTY_FORM);

  const { data: creditNotes = [], isLoading } = useCreditNotes(search);
  const { data: salesInvoices = [] } = useSalesInvoices();
  const { data: customers = [] } = useCustomers();
  const createMutation = useCreateCreditNote();

  const printDocumentRef = useRef<HTMLDivElement>(null);

  const triggerPrint = useReactToPrint({
    contentRef: printDocumentRef,
    documentTitle: itemToPrint
      ? `Credit-Note-${itemToPrint.creditNoteNumber}`
      : "Sales-Credit-Note",
  });

  const handlePrintRow = (item: CreditNote) => {
    setItemToPrint(item);
    setTimeout(() => {
      triggerPrint();
    }, 60);
  };

  const currentReturnNumber = useMemo(() => {
    const nextNum = creditNotes.length + 1;
    return `CN-2026-${String(nextNum).padStart(4, "0")}`;
  }, [creditNotes.length]);

  const filteredReturns = useMemo(() => {
    const q = search.toLowerCase();
    return creditNotes.filter((item) => {
      const custName =
        item.customerRel?.name ||
        item.customerRel?.companyName ||
        item.customerName ||
        "";
      const invRef = item.salesInvoice?.invoiceNumber || "";
      const matchesSearch =
        item.creditNoteNumber.toLowerCase().includes(q) ||
        invRef.toLowerCase().includes(q) ||
        custName.toLowerCase().includes(q) ||
        (item.reason || "").toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [creditNotes, search, statusFilter]);

  const totalReturnAmount = useMemo(
    () => filteredReturns.reduce((s, i) => s + Number(i.totalAmount || 0), 0),
    [filteredReturns],
  );

  const approvedCount = useMemo(
    () => creditNotes.filter((r) => r.status === "POSTED").length,
    [creditNotes],
  );

  const pendingCount = useMemo(
    () => creditNotes.filter((r) => r.status === "DRAFT").length,
    [creditNotes],
  );

  // Pagination logic
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredReturns.length / ITEMS_PER_PAGE) || 1;
  const paginatedReturns = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReturns.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReturns, currentPage]);

  const startIndex = filteredReturns.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, filteredReturns.length);

  const setField = useCallback(
    <K extends keyof ReturnFormState>(key: K, value: ReturnFormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const handleCloseCreate = useCallback(() => {
    setIsCreateOpen(false);
    setForm(EMPTY_FORM);
  }, []);

  const handleInvoiceSelect = (invoiceId: string) => {
    if (!invoiceId) {
      setForm((prev) => ({
        ...prev,
        salesInvoiceId: "",
        invoiceReference: "",
        customerId: "",
        customerName: "",
        projectScope: "",
      }));
      return;
    }

    const selectedInv = salesInvoices.find((inv) => inv.id === invoiceId);
    if (selectedInv) {
      setForm((prev) => ({
        ...prev,
        salesInvoiceId: selectedInv.id,
        invoiceReference: selectedInv.invoiceNumber,
        customerId: selectedInv.customerId || "",
        customerName:
          selectedInv.customerRel?.companyName ||
          selectedInv.customerRel?.name ||
          selectedInv.customerName ||
          "",
        projectScope:
          selectedInv.projectScope || "Commercial Fitout Adjustment",
        returnAmount:
          prev.returnAmount || String(selectedInv.totalAmount || ""),
      }));
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const selectedCust = customers.find((c) => c.id === customerId);
    if (selectedCust) {
      setForm((prev) => ({
        ...prev,
        customerId: selectedCust.id,
        customerName: selectedCust.companyName || selectedCust.name,
      }));
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.returnAmount) return;

    const amount = parseFloat(form.returnAmount) || 0;
    const subtotal = amount / 1.05;
    const vat = amount - subtotal;

    await createMutation.mutateAsync({
      creditNoteNumber: currentReturnNumber,
      salesInvoiceId: form.salesInvoiceId || null,
      customerId: form.customerId || null,
      customerName: form.customerName,
      returnDate: form.returnDate,
      reason: form.returnReason || "Customer scope adjustment / credit memo",
      subtotal,
      vatAmount: vat,
      totalAmount: amount,
      autoPost: true,
      items: [
        {
          description:
            form.returnReason ||
            `Credit Note adjustment for ${form.customerName}`,
          quantity: 1,
          unitPrice: subtotal,
        },
      ],
    });

    handleCloseCreate();
  };

  return (
    <div className="space-y-4">
      {/* ══════════ 1. EXECUTIVE COMPACT HEADER ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
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
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
            }}
          >
            <RotateCcw className="w-4 h-4" style={{ color: "#1d4ed8" }} />
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Sales Returns (Credit Notes)
            </h1>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#475569",
              }}
            >
              {creditNotes.length} records
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            style={{ backgroundColor: "#1d4ed8" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#1e40af")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#1d4ed8")
            }
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sales Return</span>
          </button>
        </div>
      </div>

      {/* ══════════ 2. COMPACT PASTEL KPIS ══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 print:hidden">
        {/* Card 1: Total Return Amount - Pastel Rose */}
        <div
          className="p-3 sm:p-3.5 rounded-xl transition-all"
          style={{
            backgroundColor: "#fff1f2",
            border: "1px solid #fecdd3",
          }}
        >
          <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            TOTAL CREDIT VALUE
          </p>
          <p className="text-lg sm:text-xl font-black text-rose-600">
            AED {formatNumber(totalReturnAmount)}
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
            Cumulative client credits
          </p>
        </div>

        {/* Card 2: Total Return Vouchers - Pastel Blue */}
        <div
          className="p-3 sm:p-3.5 rounded-xl transition-all"
          style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
          }}
        >
          <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            CREDIT VOUCHERS
          </p>
          <p className="text-lg sm:text-xl font-black" style={{ color: "#1d4ed8" }}>
            {creditNotes.length} Vouchers
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
            Logged credit memos
          </p>
        </div>

        {/* Card 3: Posted / Active Reversals - Pastel Green */}
        <div
          className="p-3 sm:p-3.5 rounded-xl transition-all"
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
          }}
        >
          <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            POSTED REVERSALS
          </p>
          <p className="text-lg sm:text-xl font-black" style={{ color: "#15803d" }}>
            {approvedCount} Settled
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
            Credited & restocked
          </p>
        </div>

        {/* Card 4: Draft Requests - Pastel Amber */}
        <div
          className="p-3 sm:p-3.5 rounded-xl transition-all"
          style={{
            backgroundColor: "#fefce8",
            border: "1px solid #fef08a",
          }}
        >
          <p className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            DRAFT REQUESTS
          </p>
          <p className="text-lg sm:text-xl font-black" style={{ color: "#a16207" }}>
            {pendingCount} Pending
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
            Awaiting manager posting
          </p>
        </div>
      </div>

      {/* ══════════ 3. SLEEK UNIFIED FILTER BAR ══════════ */}
      <div
        className="p-2 sm:p-2.5 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs print:hidden"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {STATUS_FILTERS.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${isActive
                    ? "text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-[#cbd5e1]"
                  }`}
                style={
                  isActive
                    ? {
                      backgroundColor: "#1d4ed8",
                    }
                    : undefined
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input + Count */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <SearchIcon
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search return #, invoice ref, client..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border bg-white text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#1d4ed8]"
              style={{ borderColor: "#cbd5e1" }}
            />
          </div>

          <span
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border shrink-0 shadow-2xs"
            style={{ borderColor: "#cbd5e1" }}
          >
            Total: {filteredReturns.length}
          </span>
        </div>
      </div>

      {/* ══════════ 4. CLEAN TABLE (NO DARK BANNER) ══════════ */}
      <div
        className="bg-white rounded-xl overflow-hidden shadow-2xs print:hidden"
        style={{ border: "1px solid #cbd5e1" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className="border-b text-[10.5px] font-bold text-slate-600 uppercase tracking-wider"
                style={{
                  backgroundColor: "#f4f7fb",
                  borderColor: "#cbd5e1",
                }}
              >
                <th className="py-3 px-3.5 whitespace-nowrap">CREDIT NOTE VOUCHER</th>
                <th className="py-3 px-3.5 whitespace-nowrap">INVOICE REF</th>
                <th className="py-3 px-3.5">CUSTOMER / ENTITY</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap">DATE</th>
                <th className="py-3 px-3.5">RETURN REASON</th>
                <th className="py-3 px-3.5 text-center whitespace-nowrap">STATUS</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap">AMOUNT (AED)</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap pr-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-[#1d4ed8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading sales returns...
                  </td>
                </tr>
              ) : paginatedReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                    No sales returns found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedReturns.map((item) => {
                  const isExpanded = expandedReturnId === item.id;
                  const customerDisplay =
                    item.customerRel?.companyName ||
                    item.customerRel?.name ||
                    item.customerName ||
                    "Valued Customer";
                  const invoiceRefDisplay =
                    item.salesInvoice?.invoiceNumber || "—";
                  const scopeDisplay =
                    item.salesInvoice?.projectScope || "Commercial Fitout";
                  const dateDisplay = item.returnDate
                    ? new Date(item.returnDate).toLocaleDateString("en-GB")
                    : "—";

                  const totalAmt = Number(item.totalAmount || 0);
                  const subtotalAmt = Number(item.subtotal || totalAmt / 1.05);
                  const vatAmt = Number(
                    item.vatAmount || totalAmt - subtotalAmt,
                  );

                  return (
                    <Fragment key={item.id}>
                      <tr
                        onClick={() =>
                          setExpandedReturnId(isExpanded ? null : item.id)
                        }
                        className={`hover:bg-[#f8fafc] cursor-pointer transition-colors ${isExpanded ? "bg-[#f8fafc]" : ""
                          }`}
                      >
                        {/* Credit Note Voucher Badge */}
                        <td className="py-3 px-3.5 font-mono whitespace-nowrap">
                          <span
                            className="px-2 py-0.5 rounded text-[11px] font-bold"
                            style={{
                              backgroundColor: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                            }}
                          >
                            {item.creditNoteNumber}
                          </span>
                        </td>

                        {/* Invoice Ref */}
                        <td className="py-3 px-3.5 font-mono text-slate-800 whitespace-nowrap font-medium">
                          {invoiceRefDisplay}
                        </td>

                        {/* Customer / Entity */}
                        <td className="py-3 px-3.5">
                          <div
                            className="font-bold text-slate-900 truncate max-w-[200px]"
                            title={customerDisplay}
                          >
                            {customerDisplay}
                          </div>
                          {scopeDisplay && (
                            <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                              {scopeDisplay}
                            </div>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3.5 text-center text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {dateDisplay}
                        </td>

                        {/* Return Reason */}
                        <td className="py-3 px-3.5 text-slate-600">
                          <div
                            className="truncate max-w-[160px] text-slate-700"
                            title={item.reason || ""}
                          >
                            {item.reason || "Credit adjustment"}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <span
                            className="px-2 py-0.5 rounded text-[10.5px] font-medium tracking-wide uppercase"
                            style={{
                              backgroundColor:
                                (item.status as string) === "POSTED"
                                  ? "#f0fdf4"
                                  : (item.status as string) === "DRAFT"
                                    ? "#fefce8"
                                    : "#fff1f2",
                              color:
                                (item.status as string) === "POSTED"
                                  ? "#15803d"
                                  : (item.status as string) === "DRAFT"
                                    ? "#a16207"
                                    : "#e11d48",
                              border:
                                (item.status as string) === "POSTED"
                                  ? "1px solid #bbf7d0"
                                  : (item.status as string) === "DRAFT"
                                    ? "1px solid #fef08a"
                                    : "1px solid #fecdd3",
                            }}
                          >
                            {item.status}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                          AED {formatNumber(totalAmt)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-right pr-4 whitespace-nowrap">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handlePrintRow(item)}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Print Credit Note Voucher (PDF)"
                            >
                              <PrintIcon size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedReturnId(
                                  isExpanded ? null : item.id,
                                )
                              }
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isExpanded
                                  ? "text-[#1d4ed8] bg-blue-50"
                                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                }`}
                              title={
                                isExpanded
                                  ? "Collapse details"
                                  : "View credit note details"
                              }
                            >
                              <ChevronDownIcon
                                size={16}
                                className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                                  }`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <SalesReturnExpandedRow
                          item={item}
                          customerDisplay={customerDisplay}
                          invoiceRefDisplay={invoiceRefDisplay}
                          scopeDisplay={scopeDisplay}
                          dateDisplay={dateDisplay}
                          totalAmt={totalAmt}
                          subtotalAmt={subtotalAmt}
                          vatAmt={vatAmt}
                          onPrint={handlePrintRow}
                          onClose={() => setExpandedReturnId(null)}
                        />
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ══════════ RESPONSIVE PAGINATION FOOTER ══════════ */}
        <div
          className="px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 bg-white"
          style={{ borderColor: "#cbd5e1" }}
        >
          <p className="text-xs text-slate-500 font-medium">
            Showing <span className="font-semibold text-slate-800">{startIndex}</span> to{" "}
            <span className="font-semibold text-slate-800">{endIndex}</span> of{" "}
            <span className="font-semibold text-slate-800">{filteredReturns.length}</span> returns
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border text-slate-500 hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              style={{ borderColor: "#cbd5e1" }}
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((page, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && page - prev > 1;
                const isActive = currentPage === page;

                return (
                  <React.Fragment key={page}>
                    {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${isActive
                          ? "text-white shadow-2xs"
                          : "bg-white text-slate-600 hover:bg-[#f8fafc] border"
                        }`}
                      style={{
                        backgroundColor: isActive ? "#1d4ed8" : undefined,
                        borderColor: isActive ? "#1d4ed8" : "#cbd5e1",
                      }}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border text-slate-500 hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              style={{ borderColor: "#cbd5e1" }}
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={handleCloseCreate}
        title="Record New Sales Return"
        maxWidth="md"
      >
        <form onSubmit={handleCreateReturn} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Credit Note No"
              value={currentReturnNumber}
              readOnly
              disabled
              className="font-mono font-bold"
            />
            <Input
              label="Return Date *"
              type="date"
              value={form.returnDate}
              onChange={(e) => setField("returnDate", e.target.value)}
              required
              className="font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-xs">
              Link Existing Tax Invoice (Optional)
            </label>
            <select
              value={form.salesInvoiceId}
              onChange={(e) => handleInvoiceSelect(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border bg-white text-slate-700 outline-none focus:ring-1 focus:ring-[#1d4ed8] shadow-2xs cursor-pointer"
              style={{ borderColor: "#cbd5e1" }}
            >
              <option value="">— Select an Invoice or enter manually —</option>
              {salesInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} —{" "}
                  {inv.customerRel?.companyName ||
                    inv.customerRel?.name ||
                    inv.customerName}{" "}
                  ({formatAed(inv.totalAmount)})
                </option>
              ))}
            </select>
          </div>

          {!form.salesInvoiceId && (
            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-xs">
                Select Customer
              </label>
              <select
                value={form.customerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border bg-white text-slate-700 outline-none focus:ring-1 focus:ring-[#1d4ed8] shadow-2xs cursor-pointer"
                style={{ borderColor: "#cbd5e1" }}
              >
                <option value="">— Select a Customer —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName ? `${c.companyName} (${c.name})` : c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Client / Customer Name *"
            placeholder="Client or Company Name"
            value={form.customerName}
            onChange={(e) => setField("customerName", e.target.value)}
            required
          />

          <Input
            label="Project Scope / Description"
            placeholder="Project Scope Name"
            value={form.projectScope}
            onChange={(e) => setField("projectScope", e.target.value)}
          />

          <Textarea
            label="Reason for Credit Note / Return *"
            rows={2}
            placeholder="Reason for scope reduction or return..."
            value={form.returnReason}
            onChange={(e) => setField("returnReason", e.target.value)}
            required
          />

          <Input
            label="Total Credit Amount (AED Incl. VAT) *"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={form.returnAmount}
            onChange={(e) => setField("returnAmount", e.target.value)}
            required
            className="font-mono font-bold"
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseCreate}
              className="px-3.5 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              style={{ borderColor: "#cbd5e1" }}
              disabled={createMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-1.5 rounded-lg text-white font-semibold text-xs transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: "#1d4ed8" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#1e40af")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#1d4ed8")
              }
            >
              {createMutation.isPending ? "Saving..." : "Save Sales Return"}
            </button>
          </div>
        </form>
      </Modal>

      <div
        style={{
          position: "fixed",
          left: "-99999px",
          top: "-99999px",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
        aria-hidden="true"
      >
        <div ref={printDocumentRef}>
          {itemToPrint && <SalesReturnDocument item={itemToPrint} />}
        </div>
      </div>
    </div>
  );
}
