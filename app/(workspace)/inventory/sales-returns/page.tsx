"use client";

import React, { Fragment, useCallback, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import {
  ChevronDownIcon,
  CloseIcon,
  PlusIcon,
  PrintIcon,
  RotateCcwIcon,
  SearchIcon,
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
} from "@/components/ui";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";

type ReturnStatus =
  "DRAFT" | "SUBMITTED" | "APPROVED" | "COMPLETED" | "REJECTED";

interface SalesReturnItem {
  id: string;
  returnNumber: string;
  invoiceReference: string;
  customerName: string;
  projectScope: string;
  returnDate: string;
  reason: string;
  totalAmount: number;
  status: ReturnStatus;
}

const STATUS_BADGE_CLASSES: Record<ReturnStatus, string> = {
  COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  APPROVED: "bg-sky-50 text-sky-800 border-sky-200",
  SUBMITTED: "bg-amber-50 text-amber-800 border-amber-200",
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  REJECTED: "bg-rose-50 text-rose-800 border-rose-200",
};

const STATUS_FILTERS = [
  { id: "ALL", label: "All Returns" },
  { id: "SUBMITTED", label: "Submitted" },
  { id: "APPROVED", label: "Approved" },
  { id: "COMPLETED", label: "Completed" },
  { id: "DRAFT", label: "Drafts" },
] as const;

const INITIAL_SALES_RETURNS: SalesReturnItem[] = [
  {
    id: "sr-1",
    returnNumber: "SR-2026-001",
    invoiceReference: "FSDFDSAFR",
    customerName: "RWERWE",
    projectScope: "REWREWQRR",
    returnDate: "2026-09-13",
    reason: "EWQRWE",
    totalAmount: 54.0,
    status: "SUBMITTED",
  },
];

function generateReturnNumber(count: number): string {
  return `SR-2026-${String(count + 1).padStart(3, "0")}`;
}

function formatNumber(val: number | string | undefined): string {
  const num = Number(val || 0);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatAed(amount: number): string {
  return `AED ${formatNumber(amount)}`;
}

interface ReturnFormState {
  invoiceReference: string;
  customerName: string;
  projectScope: string;
  returnReason: string;
  returnAmount: string;
}

const EMPTY_FORM: ReturnFormState = {
  invoiceReference: "",
  customerName: "",
  projectScope: "",
  returnReason: "",
  returnAmount: "",
};

interface SalesReturnDocumentProps {
  item: SalesReturnItem;
}

const SalesReturnDocument: React.FC<SalesReturnDocumentProps> = ({ item }) => {
  const subtotal = item.totalAmount / 1.05;
  const vatAmount = item.totalAmount - subtotal;
  const formattedDate = item.returnDate
    ? new Date(item.returnDate).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");

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
                        {item.returnNumber}
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
                        {item.invoiceReference}
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
                        {item.customerName}
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
                        Invoice #{item.invoiceReference}
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
                        {item.projectScope || "Commercial Fitout Adjustment"}
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Return Reason:
                      </span>
                      <span className="text-slate-700 font-medium">
                        {item.reason}
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
                    <tr className="hover:bg-slate-50/50 bg-white print-avoid-break">
                      <td className="py-3 px-2 print:py-2 print:px-1 align-middle text-center font-bold text-slate-700 border border-agm-box-border">
                        1
                      </td>
                      <td className="py-3 px-3 print:py-2 print:px-2 align-middle text-left font-medium text-slate-800 border border-agm-box-border">
                        <div className="font-bold text-slate-900 leading-snug">
                          {item.reason}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Scope: {item.projectScope} • Reversal against Tax
                          Invoice Ref: {item.invoiceReference}
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
                        <strong>{item.customerName}</strong>.
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
                          AED {formatNumber(item.totalAmount)}
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
  const [returnsList, setReturnsList] = useState<SalesReturnItem[]>(
    INITIAL_SALES_RETURNS,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [itemToPrint, setItemToPrint] = useState<SalesReturnItem | null>(
    INITIAL_SALES_RETURNS[0] || null,
  );
  const [expandedReturnId, setExpandedReturnId] = useState<string | null>(null);
  const [form, setForm] = useState<ReturnFormState>(EMPTY_FORM);

  const printDocumentRef = useRef<HTMLDivElement>(null);

  const triggerPrint = useReactToPrint({
    contentRef: printDocumentRef,
    documentTitle: itemToPrint
      ? `Credit-Note-${itemToPrint.returnNumber}`
      : "Sales-Credit-Note",
  });

  const handlePrintRow = (item: SalesReturnItem) => {
    setItemToPrint(item);
    setTimeout(() => {
      triggerPrint();
    }, 60);
  };

  const currentReturnNumber = useMemo(
    () => generateReturnNumber(returnsList.length),
    [returnsList.length],
  );

  const filteredReturns = useMemo(() => {
    const q = search.toLowerCase();
    return returnsList.filter((item) => {
      const matchesSearch =
        item.returnNumber.toLowerCase().includes(q) ||
        item.invoiceReference.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.projectScope.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [returnsList, search, statusFilter]);

  const totalReturnAmount = useMemo(
    () => filteredReturns.reduce((s, i) => s + i.totalAmount, 0),
    [filteredReturns],
  );

  const approvedCount = useMemo(
    () =>
      returnsList.filter(
        (r) => r.status === "APPROVED" || r.status === "COMPLETED",
      ).length,
    [returnsList],
  );

  const pendingCount = useMemo(
    () =>
      returnsList.filter(
        (r) => r.status === "SUBMITTED" || r.status === "DRAFT",
      ).length,
    [returnsList],
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

  const handleCreateReturn = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.invoiceReference || !form.customerName || !form.returnAmount)
        return;

      const newReturn: SalesReturnItem = {
        id: `sr-${Date.now()}`,
        returnNumber: currentReturnNumber,
        invoiceReference: form.invoiceReference,
        customerName: form.customerName,
        projectScope: form.projectScope || "Commercial Fitout Adjustment",
        returnDate: new Date().toISOString().slice(0, 10),
        reason: form.returnReason || "Client scope alteration / Credit Note",
        totalAmount: parseFloat(form.returnAmount) || 0,
        status: "SUBMITTED",
      };

      setReturnsList((prev) => [newReturn, ...prev]);
      handleCloseCreate();
    },
    [form, currentReturnNumber, handleCloseCreate],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Sales Returns
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process client returned goods, track credit adjustments, and update
            warehouse inventory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Log Sales Return
          </Button>
        </div>
      </div>

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
            value={returnsList.length}
            currency={false}
            accentColor="sky"
            footerText="Vouchers"
          />
          <ReportKpiCard
            title="3. Approved Reversals"
            subtitle="Settled customer credits"
            value={approvedCount}
            currency={false}
            accentColor="emerald"
            valueColor="text-emerald-800"
            footerText="Approved"
          />
          <ReportKpiCard
            title="4. In-Review Requests"
            subtitle="Pending management approval"
            value={pendingCount}
            currency={false}
            accentColor="amber"
            valueColor="text-amber-700"
            footerText="Pending"
          />
        </ReportKpiGrid>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 print:hidden">
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {STATUS_FILTERS.map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            <span className="text-[11px] font-bold text-slate-500 font-mono">
              {filteredReturns.length} Vouchers Listed
            </span>
          </div>

          <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
            <Input
              leftIcon={<SearchIcon size={14} className="text-slate-400" />}
              placeholder="Search return number, invoice ref, client..."
              containerClassName="w-full sm:w-96"
              className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
            <h4 className="font-black text-xs uppercase tracking-wider text-white">
              Sales Returns &amp; Client Credit Notes Register
            </h4>
            <span className="text-[11px] font-mono text-emerald-300 font-bold">
              {filteredReturns.length} Active Records
            </span>
          </div>

          <Table className="w-full text-xs text-left">
            <TableHead className="bg-slate-50 border-b border-slate-200">
              <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                Credit Note Voucher
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                Invoice Ref
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                Customer / Entity
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                Date
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                Return Reason
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                Status
              </TableHeaderCell>
              <TableHeaderCell
                align="right"
                className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-[10.5px] tracking-wider"
              >
                Amount (AED)
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                Actions
              </TableHeaderCell>
            </TableHead>

            <TableBody className="divide-y divide-slate-100 font-medium">
              {filteredReturns.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-12 text-center text-slate-400 italic"
                  >
                    No sales returns found. Log a customer credit note or
                    rejected scope item.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReturns.map((item) => {
                  const isExpanded = expandedReturnId === item.id;
                  return (
                    <Fragment key={item.id}>
                      <TableRow
                        onClick={() =>
                          setExpandedReturnId(isExpanded ? null : item.id)
                        }
                        className={`hover:bg-emerald-50/40 cursor-pointer transition-colors ${
                          isExpanded
                            ? "bg-emerald-50/50 font-semibold"
                            : "text-slate-700"
                        }`}
                      >
                        <TableCell className="py-3 px-4 font-mono font-bold text-teal-800">
                          <div className="flex items-center gap-2">
                            <ChevronDownIcon
                              size={15}
                              className={`shrink-0 transition-transform duration-200 ${
                                isExpanded
                                  ? "rotate-180 text-emerald-800"
                                  : "text-slate-400"
                              }`}
                            />
                            <RotateCcwIcon
                              size={13}
                              className="text-teal-700 shrink-0"
                            />
                            <span className="hover:text-emerald-800 transition-colors">
                              {item.returnNumber}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 font-mono font-semibold text-slate-800">
                          {item.invoiceReference}
                        </TableCell>
                        <TableCell className="py-3 px-4 font-bold text-slate-900">
                          <div>{item.customerName}</div>
                          {item.projectScope && (
                            <div className="text-[10px] text-slate-400 font-normal">
                              {item.projectScope}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-3 text-slate-600 font-mono text-xs">
                          {new Date(item.returnDate).toLocaleDateString(
                            "en-GB",
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4 max-w-xs truncate text-slate-600">
                          {item.reason}
                        </TableCell>
                        <TableCell className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE_CLASSES[item.status]}`}
                          >
                            {item.status}
                          </span>
                        </TableCell>
                        <TableCell
                          align="right"
                          className="py-3 px-4 text-right font-mono font-black text-rose-700 text-xs"
                        >
                          {formatAed(item.totalAmount)}
                        </TableCell>
                        <TableCell className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintRow(item);
                              }}
                              className="px-3 py-1.5 text-[11px] font-bold rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 transition cursor-pointer flex items-center gap-1.5 border border-slate-200/80 shadow-2xs"
                              icon={
                                <PrintIcon
                                  size={14}
                                  className="text-emerald-700"
                                />
                              }
                            >
                              Print
                            </Button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedReturnId(
                                  isExpanded ? null : item.id,
                                );
                              }}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                isExpanded
                                  ? "text-emerald-800 bg-emerald-100"
                                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              }`}
                              title={
                                isExpanded
                                  ? "Collapse preview"
                                  : "Expand preview"
                              }
                            >
                              <ChevronDownIcon
                                size={14}
                                className={`transition-transform duration-200 ${
                                  isExpanded
                                    ? "rotate-180 text-emerald-800"
                                    : ""
                                }`}
                              />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="hover:bg-transparent bg-slate-50/70">
                          <TableCell
                            colSpan={8}
                            className="p-0 border-b-2 border-emerald-600/40"
                          >
                            <div className="px-6 py-5 space-y-4 border-l-4 border-l-emerald-600 bg-gradient-to-b from-white via-slate-50/40 to-slate-100/40 shadow-inner">
                              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span className="px-2.5 py-1 rounded-lg bg-teal-900 text-teal-200 font-mono font-bold text-xs shadow-2xs">
                                    {item.returnNumber}
                                  </span>
                                  <span className="text-xs font-bold text-slate-900">
                                    {item.customerName}
                                  </span>
                                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                                    Invoice #{item.invoiceReference}
                                  </span>
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE_CLASSES[item.status]}`}
                                  >
                                    {item.status}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePrintRow(item)}
                                    icon={
                                      <PrintIcon
                                        size={13}
                                        className="text-emerald-700"
                                      />
                                    }
                                    className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
                                  >
                                    Print Voucher (PDF)
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedReturnId(null)}
                                    className="text-xs text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                                    title="Close preview"
                                  >
                                    <CloseIcon size={15} />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3 bg-rose-50/90 border border-rose-200/80 rounded-xl space-y-0.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                                    Total Credit Amount
                                  </span>
                                  <span className="text-base font-black font-mono text-rose-800 block">
                                    {formatAed(item.totalAmount)}
                                  </span>
                                  <span className="text-[10px] text-rose-600/90 font-medium block">
                                    Receivable deduction
                                  </span>
                                </div>

                                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-2xs">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                    Net Scope (Excl. VAT)
                                  </span>
                                  <span className="text-base font-black font-mono text-slate-900 block">
                                    AED {formatNumber(item.totalAmount / 1.05)}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block">
                                    Direct revenue deduction
                                  </span>
                                </div>

                                <div className="p-3 bg-emerald-50/90 border border-emerald-200/80 rounded-xl space-y-0.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                                    Output VAT Adjustment (5%)
                                  </span>
                                  <span className="text-base font-black font-mono text-emerald-800 block">
                                    AED{" "}
                                    {formatNumber(
                                      item.totalAmount -
                                        item.totalAmount / 1.05,
                                    )}
                                  </span>
                                  <span className="text-[10px] text-emerald-600/90 block">
                                    UAE FTA standard rated (5%)
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-white rounded-xl border border-slate-200/90 space-y-2.5 shadow-2xs">
                                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-slate-900 font-bold text-[11px] uppercase tracking-wider">
                                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                                    Client &amp; Scope Details
                                  </div>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex items-start justify-between">
                                      <span className="text-slate-500 font-medium">
                                        Customer:
                                      </span>
                                      <span className="font-bold text-slate-900 text-right">
                                        {item.customerName}
                                      </span>
                                    </div>
                                    <div className="flex items-start justify-between">
                                      <span className="text-slate-500 font-medium">
                                        Project Scope:
                                      </span>
                                      <span className="font-semibold text-slate-800 text-right">
                                        {item.projectScope ||
                                          "Commercial Fitout"}
                                      </span>
                                    </div>
                                    <div className="flex items-start justify-between">
                                      <span className="text-slate-500 font-medium">
                                        Linked Invoice:
                                      </span>
                                      <span className="font-mono text-teal-800 font-bold text-right">
                                        #{item.invoiceReference}
                                      </span>
                                    </div>
                                    <div className="flex items-start justify-between">
                                      <span className="text-slate-500 font-medium">
                                        Return Date:
                                      </span>
                                      <span className="font-mono text-slate-700 text-right">
                                        {new Date(
                                          item.returnDate,
                                        ).toLocaleDateString("en-GB")}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-4 bg-white rounded-xl border border-slate-200/90 space-y-2.5 shadow-2xs">
                                  <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-slate-900 font-bold text-[11px] uppercase tracking-wider">
                                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                    Accounting &amp; Ledger Audit
                                  </div>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex items-start justify-between">
                                      <span className="text-slate-500 font-medium">
                                        Type:
                                      </span>
                                      <span className="font-bold text-slate-800 text-right">
                                        Sales Credit Note
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-slate-500 font-medium block">
                                        Double-Entry Posting:
                                      </span>
                                      <span className="font-mono text-[11px] text-slate-700 block mt-0.5">
                                        Dr. Service Income (4000) • Dr. VAT
                                        Output (2210) • Cr. AR (1200)
                                      </span>
                                    </div>
                                    <div className="flex items-start justify-between">
                                      <span className="text-slate-500 font-medium">
                                        Status:
                                      </span>
                                      <span className="font-bold text-emerald-800 text-right">
                                        Automated GL Reversal
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/90 space-y-1">
                                <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-900 block">
                                  Credit Adjustment Reason / Client Return Note
                                </span>
                                <p className="text-xs font-medium text-slate-800 pl-3 border-l-2 border-amber-400 mt-1">
                                  &ldquo;{item.reason}&rdquo;
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
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
        title="Create Sales Return (Credit Note)"
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
              label="Invoice / QTN Ref *"
              placeholder="e.g. AGM-QTN-2026-01217"
              value={form.invoiceReference}
              onChange={(e) => setField("invoiceReference", e.target.value)}
              required
              className="font-mono"
            />
          </div>

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
            label="Credit Amount (AED) *"
            type="number"
            step="0.01"
            min="0"
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
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
            >
              Submit Sales Return
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
