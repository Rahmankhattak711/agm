"use client";

import React, { Fragment, useCallback, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
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

      <div className="px-10 pb-6 print:hidden">
        <QuotationFooter className="mt-6" />
      </div>
    </div>
  );
};

export default function SalesReturnsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [itemToPrint, setItemToPrint] = useState<CreditNote | null>(null);
  const [expandedReturnId, setExpandedReturnId] = useState<string | null>(null);
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
    <div className="space-y-6">
      <PageHeader
        title="Sales Returns"
        description="Process customer returned goods, issue credit notes, and manage inventory restocks."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs rounded-lg px-3.5 py-1.5 cursor-pointer transition-colors"
          >
            New Sales Return
          </Button>
        }
      />

      <div className="print:hidden">
        <ReportKpiGrid cols={4}>
          <ReportKpiCard
            title="1. Total Sales Credit Notes"
            subtitle="Cumulative client credits"
            value={formatNumber(totalReturnAmount)}
            currency="AED"
            accentColor="rose"
            valueColor="text-rose-700"
          />
          <ReportKpiCard
            title="2. Total Credit Vouchers"
            subtitle="Registered credit memos"
            value={creditNotes.length}
            currency={false}
            accentColor="sky"
            footerText="Vouchers"
          />
          <ReportKpiCard
            title="3. Posted / Active Reversals"
            subtitle="Settled customer credits"
            value={approvedCount}
            currency={false}
            accentColor="emerald"
            valueColor="text-emerald-800"
            footerText="Posted"
          />
          <ReportKpiCard
            title="4. Draft Requests"
            subtitle="Unposted credit vouchers"
            value={pendingCount}
            currency={false}
            accentColor="amber"
            valueColor="text-amber-700"
            footerText="Drafts"
          />
        </ReportKpiGrid>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 print:hidden">
        <FilterBar
          tabs={STATUS_FILTERS as any}
          activeTab={statusFilter}
          onTabChange={(id) => setStatusFilter(id as any)}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search return number, invoice ref, client..."
          totalCount={filteredReturns.length}
          countLabel="Vouchers Listed"
        />

        <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white py-2.5 px-4 sm:px-5 flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-white">
              Sales Returns Register
            </h4>
            <span className="text-[11px] font-mono text-emerald-300 font-bold">
              {filteredReturns.length} Returns Listed
            </span>
          </div>

          <Table className="w-full text-xs text-left">
            <TableHead className="bg-slate-50 border-b border-slate-200">
              <TableHeaderCell className="py-2 px-2.5 sm:px-3 font-bold text-slate-600 uppercase text-[10px] tracking-wider whitespace-nowrap">
                Credit Note Voucher
              </TableHeaderCell>
              <TableHeaderCell className="py-2 px-2.5 sm:px-3 font-bold text-slate-600 uppercase text-[10px] tracking-wider whitespace-nowrap">
                Invoice Ref
              </TableHeaderCell>
              <TableHeaderCell className="py-2 px-2.5 sm:px-3 font-bold text-slate-600 uppercase text-[10px] tracking-wider whitespace-nowrap">
                Customer / Entity
              </TableHeaderCell>
              <TableHeaderCell className="py-2 px-2 text-center font-bold text-slate-600 uppercase text-[10px] tracking-wider whitespace-nowrap">
                Date
              </TableHeaderCell>
              <TableHeaderCell className="py-2 px-2.5 sm:px-3 font-bold text-slate-600 uppercase text-[10px] tracking-wider whitespace-nowrap">
                Return Reason
              </TableHeaderCell>
              <TableHeaderCell className="py-2 px-2 text-center font-bold text-slate-600 uppercase text-[10px] tracking-wider whitespace-nowrap">
                Status
              </TableHeaderCell>
              <TableHeaderCell
                align="right"
                className="py-2 px-2.5 text-right font-bold text-slate-600 uppercase text-[10px] tracking-wider whitespace-nowrap"
              >
                Amount (AED)
              </TableHeaderCell>
              <TableHeaderCell className="py-2 px-2 sm:pr-3 text-right font-bold text-slate-600 uppercase text-[10px] tracking-wider whitespace-nowrap">
                Actions
              </TableHeaderCell>
            </TableHead>

            <TableBody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-slate-400 italic"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                      <span>Loading sales returns from database...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredReturns.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={8} className="p-0 border-0">
                    <EmptyState
                      icon={
                        <RotateCcwIcon size={20} className="text-slate-400" />
                      }
                      title="No sales returns found"
                      description={
                        search.trim() !== "" || statusFilter !== "ALL"
                          ? "No sales returns matched your search criteria."
                          : "No sales returns recorded yet. Click 'New Sales Return' to create one."
                      }
                      actionLabel={
                        search.trim() !== "" || statusFilter !== "ALL"
                          ? "Reset Filters"
                          : "New Sales Return"
                      }
                      onAction={
                        search.trim() !== "" || statusFilter !== "ALL"
                          ? () => {
                              setSearch("");
                              setStatusFilter("ALL");
                            }
                          : () => setIsCreateOpen(true)
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredReturns.map((item) => {
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
                      <TableRow
                        onClick={() =>
                          setExpandedReturnId(isExpanded ? null : item.id)
                        }
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          isExpanded
                            ? "bg-slate-50/90 font-medium"
                            : "text-slate-700"
                        }`}
                      >
                        <TableCell className="py-2 px-2.5 sm:px-3 font-mono font-bold text-teal-800 whitespace-nowrap text-xs">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <RotateCcwIcon
                              size={14}
                              className="text-teal-700 shrink-0"
                            />
                            <span className="hover:text-emerald-800 transition-colors">
                              {item.creditNoteNumber}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-2.5 sm:px-3 font-mono font-semibold text-slate-800 whitespace-nowrap text-xs">
                          {invoiceRefDisplay}
                        </TableCell>
                        <TableCell className="py-2 px-2.5 sm:px-3 text-slate-900 text-xs">
                          <div
                            className="font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[180px]"
                            title={customerDisplay}
                          >
                            {customerDisplay}
                          </div>
                          {scopeDisplay && (
                            <div className="text-[10px] text-slate-400 font-normal truncate max-w-[140px]">
                              {scopeDisplay}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-2 px-2 text-center text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {dateDisplay}
                        </TableCell>
                        <TableCell className="py-2 px-2.5 sm:px-3 text-slate-600 text-xs">
                          <div
                            className="truncate max-w-[120px] sm:max-w-[160px]"
                            title={item.reason || ""}
                          >
                            {item.reason || "Credit adjustment"}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-2 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE_CLASSES[item.status] || STATUS_BADGE_CLASSES.DRAFT}`}
                          >
                            {item.status}
                          </span>
                        </TableCell>
                        <TableCell
                          align="right"
                          className="py-2 px-2.5 text-right font-mono font-bold text-rose-700 text-xs whitespace-nowrap"
                        >
                          {formatNumber(totalAmt)}
                        </TableCell>
                        <TableCell className="py-2 px-2 sm:pr-3 text-right print:hidden whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintRow(item);
                              }}
                              className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                              title="Print Credit Note Voucher"
                            >
                              <PrintIcon
                                size={18}
                                className="w-[18px] h-[18px]"
                              />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedReturnId(
                                  isExpanded ? null : item.id,
                                );
                              }}
                              className={`h-8 w-8 p-0 flex items-center justify-center rounded-lg transition cursor-pointer ${
                                isExpanded
                                  ? "text-emerald-800 bg-emerald-100"
                                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                              }`}
                              title={
                                isExpanded
                                  ? "Collapse details"
                                  : "View credit note details"
                              }
                            >
                              <ChevronDownIcon
                                size={18}
                                className={`w-[18px] h-[18px] transition-transform duration-200 ${
                                  isExpanded
                                    ? "rotate-180 text-emerald-800"
                                    : ""
                                }`}
                              />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

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
            </TableBody>
          </Table>
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
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
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
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
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
            <Button
              variant="outline"
              type="button"
              onClick={handleCloseCreate}
              className="cursor-pointer"
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={createMutation.isPending}
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
            >
              {createMutation.isPending ? "Saving..." : "Save Sales Return"}
            </Button>
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
