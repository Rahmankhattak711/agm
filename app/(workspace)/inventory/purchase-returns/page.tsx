"use client";

import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  Fragment,
} from "react";
import { useReactToPrint } from "react-to-print";
import {
  ChevronDownIcon,
  CloseIcon,
  PlusIcon,
  PrintIcon,
  RotateCcwIcon,
  SearchIcon,
  ShieldCheckIcon,
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
  Select,
} from "@/components/ui";
import { useSuppliers } from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";

type ReturnStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "COMPLETED"
  | "REJECTED";

interface PurchaseReturnItem {
  id: string;
  returnNumber: string;
  poReference: string;
  supplierName: string;
  supplierTrn: string;
  returnDate: string;
  reason: string;
  itemsCount: number;
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

const INITIAL_PURCHASE_RETURNS: PurchaseReturnItem[] = [
  {
    id: "pr-1",
    returnNumber: "PR-2026-001",
    poReference: "PO-2026-001",
    supplierName: "Al Futtaim Hardware LLC",
    supplierTrn: "100234567800003",
    returnDate: "2026-09-13",
    reason: "Damaged aluminum extrusion profile batch #B44",
    itemsCount: 1,
    totalAmount: 3450.0,
    status: "SUBMITTED",
  },
];

function generateReturnNumber(count: number): string {
  return `PR-2026-${String(count + 1).padStart(3, "0")}`;
}

function formatNumber(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatAed(amount: number): string {
  return `AED ${formatNumber(amount)}`;
}

interface ReturnFormState {
  poReference: string;
  selectedSupplier: string;
  returnReason: string;
  returnAmount: string;
}

const EMPTY_FORM: ReturnFormState = {
  poReference: "",
  selectedSupplier: "",
  returnReason: "",
  returnAmount: "",
};

// ----------------------------------------------------------------------
// Official Quotation-Style A4 Print Voucher for Purchase Return
// ----------------------------------------------------------------------
interface PurchaseReturnDocumentProps {
  item: PurchaseReturnItem;
}

const PurchaseReturnDocument: React.FC<PurchaseReturnDocumentProps> = ({
  item,
}) => {
  const subtotal = item.totalAmount / 1.05;
  const vatAmount = item.totalAmount - subtotal;
  const formattedDate = item.returnDate
    ? new Date(item.returnDate).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");

  return (
    <div
      id="printable-purchase-return"
      className="mx-auto bg-white max-w-4xl min-w-[700px] md:min-w-0 rounded-xl print:rounded-none overflow-visible print:overflow-visible print:w-full print:shadow-none font-sans"
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
          {/* Document Title Bar */}
          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 py-3.5 print:px-8 print:py-2.5 w-full border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between gap-8">
                  <div>
                    <h1 className="text-2xl print:text-2xl font-black text-slate-900 tracking-tight">
                      PURCHASE DEBIT NOTE
                    </h1>
                    <p className="text-[11px] print:text-[11px] font-semibold text-emerald-700 mt-0.5 print:mt-0">
                      Official Vendor Material Rejection &amp; Debit Voucher (Standard Rated 5% VAT)
                    </p>
                  </div>

                  <div className="w-[320px] print:w-[320px] space-y-1 text-[12px] print:text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Debit Note No:
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
                        PO Reference:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {item.poReference}
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

          {/* Supplier & Debit Details Cards */}
          <tr>
            <td className="p-0 border-none align-top">
              <div className="grid grid-cols-2 gap-4 print:gap-3 px-10 py-3.5 print:px-8 print:py-2 text-[12px] print:text-[12px] print-avoid-break">
                {/* Left Card: Supplier Details */}
                <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2.5 rounded-xl shadow-2xs">
                  <div className="font-bold mb-2 print:mb-1.5 text-slate-900 uppercase text-[11px] print:text-[11px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                    SUPPLIER / VENDOR BILLED
                  </div>
                  <div className="space-y-1.5 print:space-y-1">
                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Supplier Name:
                      </span>
                      <span className="font-bold text-slate-900">
                        {item.supplierName}
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        UAE VAT TRN:
                      </span>
                      <span className="font-mono text-slate-800 font-bold">
                        {item.supplierTrn || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Purchase Order:
                      </span>
                      <span className="font-mono text-slate-800 font-bold">
                        #{item.poReference}
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Warehouse:
                      </span>
                      <span className="text-slate-700">
                        AGM Central Receiving Bay, Dubai
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Financial Recap */}
                <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2.5 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="font-bold mb-2 print:mb-1.5 text-slate-900 uppercase text-[11px] print:text-[11px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                      FINANCIAL DEBIT RECAP
                    </div>
                    <div className="space-y-1.5 print:space-y-1 text-[11.5px] print:text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          Debit Scope (Excl. VAT):
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          AED {formatNumber(subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          Input VAT Reversal (5%):
                        </span>
                        <span className="font-mono font-bold text-purple-700">
                          AED {formatNumber(vatAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between bg-white print:bg-transparent p-2 rounded-lg border">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                      Total Debit Adjustment:
                    </span>
                    <span className="font-mono text-base font-black text-rose-700">
                      {formatAed(item.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          {/* Items Table */}
          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 py-2 print:px-8 print:py-1">
                <table className="w-full border-collapse text-[11.5px] print:text-[10.5px]">
                  <thead>
                    <tr className="bg-agm-green border border-agm-box-border text-white">
                      <th className="py-2.5 px-2.5 font-bold w-12 border border-agm-box-border text-white text-center align-middle">
                        S.No
                      </th>
                      <th className="py-2.5 px-3 font-bold border border-agm-box-border text-white text-left align-middle">
                        DESCRIPTION OF REJECTED MATERIALS / REASON
                      </th>
                      <th className="py-2.5 px-2 font-bold w-20 border border-agm-box-border text-white text-center align-middle">
                        QTY
                      </th>
                      <th className="py-2.5 px-3 font-bold w-28 border border-agm-box-border text-white text-right align-middle">
                        RATE (AED)
                      </th>
                      <th className="py-2.5 px-3 font-bold w-32 border border-agm-box-border text-white text-right align-middle">
                        TOTAL (AED)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-agm-box-border">
                    <tr className="hover:bg-slate-50/50 bg-white print-avoid-break">
                      <td className="py-2 px-2.5 align-middle text-center font-bold text-slate-700 border border-agm-box-border">
                        1
                      </td>
                      <td className="py-2 px-3 align-middle text-left font-medium text-slate-800 border border-agm-box-border">
                        <div className="font-bold text-slate-900 leading-snug">
                          {item.reason}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Debit Note against PO #{item.poReference} • Supplier: {item.supplierName}
                        </div>
                      </td>
                      <td className="py-2 px-2 align-middle text-center font-mono font-bold text-slate-800 border border-agm-box-border">
                        {item.itemsCount || 1}
                      </td>
                      <td className="py-2 px-3 align-middle text-right font-mono font-semibold text-slate-800 border border-agm-box-border">
                        {formatNumber(subtotal)}
                      </td>
                      <td className="py-2 px-3 align-middle text-right font-mono font-bold text-slate-900 border border-agm-box-border">
                        {formatNumber(subtotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>

          {/* GL Accounting & Totals */}
          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 print:px-8">
                <div className="flex items-stretch justify-between gap-4 mt-3.5 print:mt-2 print-avoid-break">
                  {/* Left: Accounting Memo */}
                  <div className="flex-1 border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2 rounded-xl text-[11px] print:text-[10px] flex flex-col justify-center shadow-2xs">
                    <div className="font-bold mb-1 text-slate-900 uppercase text-[10.5px] print:text-[10px] tracking-wider text-agm-green flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                      GENERAL LEDGER &amp; TAX ADJUSTMENT MEMO
                    </div>
                    <div className="space-y-1 text-slate-600 font-medium leading-relaxed">
                      <div>
                        This Debit Note certifies a deduction in Accounts Payable due to vendor <strong>{item.supplierName}</strong>.
                      </div>
                      <div className="text-[10.5px] text-slate-600 font-mono">
                        Double-Entry Impact: Dr. Accounts Payable (2000) • Cr. Purchase Returns / Cost (5000) • Cr. Input VAT (2220)
                      </div>
                    </div>
                  </div>

                  {/* Right: Subtotal, VAT, Total */}
                  <div className="w-80 border border-slate-200 print:border-slate-300 bg-white rounded-xl overflow-hidden shadow-2xs text-[12px] print:text-[11px]">
                    <div className="divide-y divide-slate-100 print:divide-slate-200">
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/40">
                        <span className="font-semibold text-slate-600">
                          Debit Subtotal (Excl. VAT):
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          AED {formatNumber(subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/40">
                        <span className="font-semibold text-slate-600">
                          VAT Adjustment (5%):
                        </span>
                        <span className="font-mono font-bold text-purple-700">
                          AED {formatNumber(vatAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5 bg-agm-green text-white">
                        <span className="font-bold text-xs uppercase tracking-wider">
                          Net Debit Total:
                        </span>
                        <span className="font-mono font-black text-sm">
                          {formatAed(item.totalAmount)}
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

      {/* Fixed Footer pinned to the bottom of every page in print */}
      <div className="print-footer-bottom fixed-print-footer hidden print:block">
        <QuotationFooter />
      </div>

      {/* On-Screen / Print Preview Footer */}
      <div className="px-10 pb-6 print:hidden">
        <QuotationFooter className="mt-6" />
      </div>
    </div>
  );
};

export default function PurchaseReturnsPage() {
  const { data: suppliers = [] } = useSuppliers();

  const [returnsList, setReturnsList] = useState<PurchaseReturnItem[]>(
    INITIAL_PURCHASE_RETURNS,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedReturnId, setExpandedReturnId] = useState<string | null>(null);

  // Direct A4 Print State
  const [returnToPrint, setReturnToPrint] =
    useState<PurchaseReturnItem | null>(null);
  const printDocumentRef = useRef<HTMLDivElement>(null);

  const triggerPrint = useReactToPrint({
    contentRef: printDocumentRef,
    documentTitle: returnToPrint?.returnNumber
      ? `Debit-Note-${returnToPrint.returnNumber}`
      : "Purchase-Debit-Note",
  });

  const handlePrintReturn = (item: PurchaseReturnItem) => {
    setReturnToPrint(item);
    setTimeout(() => {
      triggerPrint();
    }, 80);
  };

  const [form, setForm] = useState<ReturnFormState>(EMPTY_FORM);

  const currentReturnNumber = useMemo(
    () => generateReturnNumber(returnsList.length),
    [returnsList.length],
  );

  const filteredReturns = useMemo(() => {
    const q = search.toLowerCase();
    return returnsList.filter((item) => {
      const matchesSearch =
        item.returnNumber.toLowerCase().includes(q) ||
        item.poReference.toLowerCase().includes(q) ||
        item.supplierName.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [returnsList, search, statusFilter]);

  const totalReturnVal = useMemo(
    () => filteredReturns.reduce((s, r) => s + r.totalAmount, 0),
    [filteredReturns],
  );

  const completedCount = useMemo(
    () => returnsList.filter((r) => r.status === "COMPLETED").length,
    [returnsList],
  );

  const activeReviewCount = useMemo(
    () =>
      returnsList.filter(
        (r) => r.status === "SUBMITTED" || r.status === "APPROVED",
      ).length,
    [returnsList],
  );

  const resetForm = useCallback(() => setForm(EMPTY_FORM), []);

  const handleOpenCreate = useCallback(() => {
    resetForm();
    setIsCreateOpen(true);
  }, [resetForm]);

  const handleCloseCreate = useCallback(() => {
    setIsCreateOpen(false);
    resetForm();
  }, [resetForm]);

  const setField = useCallback(
    <K extends keyof ReturnFormState>(key: K, value: ReturnFormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const handleCreateReturn = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.poReference || !form.selectedSupplier || !form.returnAmount) {
        return;
      }

      const supplierObj = suppliers.find((s) => s.id === form.selectedSupplier);
      const supplierName = supplierObj ? supplierObj.name : "Vendor";
      const supplierTrn = supplierObj?.trn || "";

      const newReturn: PurchaseReturnItem = {
        id: `pr-${Date.now()}`,
        returnNumber: currentReturnNumber,
        poReference: form.poReference,
        supplierName,
        supplierTrn,
        returnDate: new Date().toISOString().slice(0, 10),
        reason: form.returnReason || "Material defect / Debit Note",
        itemsCount: 1,
        totalAmount: parseFloat(form.returnAmount) || 0,
        status: "SUBMITTED",
      };

      setReturnsList((prev) => [newReturn, ...prev]);
      handleCloseCreate();
    },
    [form, suppliers, currentReturnNumber, handleCloseCreate],
  );

  return (
    <div className="space-y-6">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Purchase Returns (Debit Notes)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log rejected vendor supplies, process Accounts Payable debit notes, and deduct supplier balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Log Purchase Return
          </Button>
        </div>
      </div>

      {/* 4 Elevated Summary KPI Cards */}
      <ReportKpiGrid cols={4}>
        <ReportKpiCard
          title="1. Total Debit Notes Value"
          subtitle="Cumulative supplier returns"
          value={formatNumber(totalReturnVal)}
          currency="AED"
          accentColor="rose"
          valueColor="text-rose-700"
        />
        <ReportKpiCard
          title="2. Total Return Vouchers"
          subtitle="All logged RTV orders"
          value={returnsList.length}
          currency={false}
          accentColor="sky"
          footerText="Records"
        />
        <ReportKpiCard
          title="3. Settled Reversals"
          subtitle="Credited by vendor"
          value={completedCount}
          currency={false}
          accentColor="emerald"
          valueColor="text-emerald-800"
          footerText="Settled"
        />
        <ReportKpiCard
          title="4. In-Review Reversals"
          subtitle="Pending supplier credit note"
          value={activeReviewCount}
          currency={false}
          accentColor="amber"
          valueColor="text-amber-700"
          footerText="Pending"
        />
      </ReportKpiGrid>

      {/* Main Filter & Table Card */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        {/* Search & Filter Strip */}
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Status Quick Pills */}
            <div className="flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              {[
                { id: "ALL", label: "All Returns" },
                { id: "DRAFT", label: "Draft" },
                { id: "SUBMITTED", label: "Submitted" },
                { id: "APPROVED", label: "Approved" },
                { id: "COMPLETED", label: "Completed" },
                { id: "REJECTED", label: "Rejected" },
              ].map((tab) => {
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
              placeholder="Search return #, PO reference, vendor, reason..."
              containerClassName="w-full sm:w-80"
              className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Master Table */}
        <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between print:bg-none print:!bg-slate-100 print:!text-slate-900">
            <h4 className="font-black text-xs uppercase tracking-wider text-white print:!text-slate-900">
              Vendor Return Vouchers &amp; Debit Notes Register
            </h4>
            <span className="text-[11px] font-mono text-emerald-300 font-bold print:!text-slate-700">
              {filteredReturns.length} Vouchers
            </span>
          </div>

          <Table className="w-full text-xs text-left">
            <TableHead className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Return No &amp; PO
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Supplier / Vendor
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Return Reason
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Return Date
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
                <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider print:hidden">
                  Actions
                </TableHeaderCell>
              </TableRow>
            </TableHead>

            <TableBody className="divide-y divide-slate-100 font-medium">
              {filteredReturns.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-slate-400 italic"
                  >
                    No purchase returns found. Click &quot;Log Purchase Return&quot; to register a vendor material rejection.
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
                        <TableCell className="py-3 px-4 font-mono font-bold text-slate-900">
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
                              className="text-amber-600 shrink-0"
                            />
                            <span className="hover:text-emerald-800 transition-colors">
                              {item.returnNumber}
                            </span>
                          </div>
                          <p className="text-[10px] text-teal-800 font-mono font-semibold mt-0.5 ml-6">
                            Ref: {item.poReference}
                          </p>
                        </TableCell>

                        <TableCell className="py-3 px-4">
                          <p className="font-bold text-slate-900">
                            {item.supplierName}
                          </p>
                          {item.supplierTrn && (
                            <p className="text-[10px] text-slate-400 font-mono">
                              TRN: {item.supplierTrn}
                            </p>
                          )}
                        </TableCell>

                        <TableCell className="py-3 px-4 text-slate-600 text-xs max-w-xs truncate">
                          {item.reason}
                        </TableCell>

                        <TableCell className="py-3 px-3 font-mono text-slate-700 text-xs">
                          {new Date(item.returnDate).toLocaleDateString("en-GB")}
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

                        <TableCell className="py-3 px-3 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePrintReturn(item);
                              }}
                              icon={
                                <PrintIcon
                                  size={13}
                                  className="text-emerald-700"
                                />
                              }
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 transition cursor-pointer"
                              title="Print Debit Note (PDF)"
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

                      {/* QA-Style Accordion Expanded Drawer */}
                      {isExpanded && (
                        <TableRow className="hover:bg-transparent bg-slate-50/70">
                          <TableCell
                            colSpan={7}
                            className="p-0 border-b-2 border-emerald-600/40"
                          >
                            <div className="px-6 py-5 space-y-4 border-l-4 border-l-emerald-600 bg-gradient-to-b from-white via-slate-50/40 to-slate-100/40 shadow-inner">
                              {/* QA Header Ribbon */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span className="px-2.5 py-1 rounded-lg bg-teal-900 text-teal-200 font-mono font-bold text-xs shadow-2xs">
                                    {item.returnNumber}
                                  </span>
                                  <span className="text-xs font-bold text-slate-900">
                                    {item.supplierName}
                                  </span>
                                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                                    PO #{item.poReference}
                                  </span>
                                  {item.supplierTrn && (
                                    <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                      <ShieldCheckIcon
                                        size={12}
                                        className="text-emerald-700"
                                      />
                                      TRN: {item.supplierTrn}
                                    </span>
                                  )}
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
                                    onClick={() => handlePrintReturn(item)}
                                    icon={
                                      <PrintIcon
                                        size={13}
                                        className="text-emerald-700"
                                      />
                                    }
                                    className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
                                  >
                                    Print Debit Note (PDF)
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedReturnId(null)}
                                    className="text-xs text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                                    title="Collapse preview"
                                  >
                                    <CloseIcon size={15} />
                                  </button>
                                </div>
                              </div>

                              {/* 4 Metric Summary Cards */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="p-3 bg-rose-50/90 border border-rose-200/80 rounded-xl space-y-0.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                                    Total Debit Amount
                                  </span>
                                  <span className="text-base font-black font-mono text-rose-800 block">
                                    {formatAed(item.totalAmount)}
                                  </span>
                                  <span className="text-[10px] text-rose-600/90 font-medium block">
                                    Payable liability deduction
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
                                    Cost reduction reversal
                                  </span>
                                </div>

                                <div className="p-3 bg-purple-50/80 border border-purple-200/80 rounded-xl space-y-0.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                                    Input VAT Reversal (5%)
                                  </span>
                                  <span className="text-base font-black font-mono text-purple-800 block">
                                    AED{" "}
                                    {formatNumber(
                                      item.totalAmount -
                                        item.totalAmount / 1.05,
                                    )}
                                  </span>
                                  <span className="text-[10px] text-purple-600 block">
                                    FTA Input tax reduction
                                  </span>
                                </div>

                                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-2xs">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                    Return Date
                                  </span>
                                  <span className="text-xs font-bold text-slate-900 block font-mono">
                                    {new Date(
                                      item.returnDate,
                                    ).toLocaleDateString("en-GB")}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block">
                                    PO #{item.poReference}
                                  </span>
                                </div>
                              </div>

                              {/* 2-Column QA Details Section */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Left: Supplier Profile */}
                                <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-2xs space-y-2.5">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <span className="font-bold text-xs uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                                      <RotateCcwIcon
                                        size={14}
                                        className="text-teal-700"
                                      />
                                      Supplier &amp; PO Link Details
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                                      Debit Record
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                                    <div>
                                      <span className="text-[10px] font-semibold text-slate-400 block">
                                        Vendor / Supplier
                                      </span>
                                      <span className="font-bold text-slate-800">
                                        {item.supplierName}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-[10px] font-semibold text-slate-400 block">
                                        UAE VAT TRN
                                      </span>
                                      <span className="font-mono font-bold text-emerald-800">
                                        {item.supplierTrn || "Not Registered"}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-[10px] font-semibold text-slate-400 block">
                                        Purchase Order Ref
                                      </span>
                                      <span className="font-mono text-slate-700 font-bold">
                                        #{item.poReference}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="text-[10px] font-semibold text-slate-400 block">
                                        Return Execution Date
                                      </span>
                                      <span className="font-mono text-slate-700">
                                        {new Date(
                                          item.returnDate,
                                        ).toLocaleDateString("en-GB")}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Rejection Memo & GL Accounting */}
                                <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-2xs space-y-2.5 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                      <span className="font-bold text-xs uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                                        <ShieldCheckIcon
                                          size={14}
                                          className="text-teal-700"
                                        />
                                        Material Rejection Justification
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                                        QA Certified
                                      </span>
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 mt-2">
                                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                                        Documented Cause:
                                      </span>
                                      <p className="text-xs text-slate-800 font-medium leading-relaxed">
                                        {item.reason}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[10.5px] text-slate-500 font-mono">
                                      GL Impact: Dr. 2000 AP • Cr. 5000 Purchases • Cr. 2220 Input VAT
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePrintReturn(item)}
                                      icon={
                                        <PrintIcon
                                          size={12}
                                          className="text-emerald-700"
                                        />
                                      }
                                      className="text-xs font-bold text-teal-800 hover:text-teal-900 cursor-pointer p-0 h-auto flex items-center gap-1"
                                    >
                                      Print Debit Note →
                                    </Button>
                                  </div>
                                </div>
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

      {/* Modal for Creating Purchase Return */}
      <Modal
        isOpen={isCreateOpen}
        onClose={handleCloseCreate}
        title="Log Purchase Return / Material Rejection"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateReturn} className="space-y-4 text-xs">
          <Input
            label="Original Purchase Order Reference *"
            placeholder="e.g. PO-2026-001"
            value={form.poReference}
            onChange={(e) => setField("poReference", e.target.value)}
            required
            className="font-mono"
          />

          <Select
            label="Supplier / Vendor *"
            value={form.selectedSupplier}
            onChange={(e) => setField("selectedSupplier", e.target.value)}
            required
          >
            <option value="">-- Select Registered Vendor --</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.trn ? `(TRN: ${s.trn})` : ""}
              </option>
            ))}
          </Select>

          <Input
            label="Return Reason / Quality Defect *"
            placeholder="Describe material rejection or damage..."
            value={form.returnReason}
            onChange={(e) => setField("returnReason", e.target.value)}
            required
          />

          <Input
            label="Debit Note Return Amount (AED) *"
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
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
            >
              Submit Purchase Return
            </Button>
          </div>
        </form>
      </Modal>

      {/* Off-screen Isolated Container for direct useReactToPrint */}
      <div
        style={{
          position: "fixed",
          left: "-99999px",
          top: "-99999px",
          width: "210mm",
        }}
      >
        <div ref={printDocumentRef}>
          {returnToPrint && <PurchaseReturnDocument item={returnToPrint} />}
        </div>
      </div>
    </div>
  );
}
