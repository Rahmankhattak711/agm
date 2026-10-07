"use client";

import React from "react";
import {
  FileTextIcon,
  PackageIcon,
  PrintIcon,
  ScaleIcon,
} from "@/components/icons";
import {
  Button,
  Badge,
  Card,
  CustomRowExpand,
  ExpandedRowSection,
} from "@/components/ui";
import { CreditNote } from "@/lib/hooks/commercial-hooks";
import { formatNumber } from "@/lib/utils/format";

const STATUS_BADGE_CLASSES: Record<string, string> = {
  POSTED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  APPROVED: "bg-sky-50 text-sky-800 border-sky-200",
  SUBMITTED: "bg-amber-50 text-amber-800 border-amber-200",
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELLED: "bg-rose-50 text-rose-800 border-rose-200",
  REJECTED: "bg-rose-50 text-rose-800 border-rose-200",
};

export interface SalesReturnExpandedRowProps {
  item: CreditNote;
  customerDisplay: string;
  invoiceRefDisplay: string;
  scopeDisplay: string;
  dateDisplay: string;
  totalAmt: number;
  subtotalAmt: number;
  vatAmt: number;
  onPrint: (item: CreditNote) => void;
  onClose: () => void;
}

export function SalesReturnExpandedRow({
  item,
  customerDisplay,
  invoiceRefDisplay,
  scopeDisplay,
  dateDisplay,
  totalAmt,
  subtotalAmt,
  vatAmt,
  onPrint,
  onClose,
}: SalesReturnExpandedRowProps) {
  return (
    <CustomRowExpand
      colSpan={8}
      onClose={onClose}
      headerLeft={
        <>
          <span className="px-2.5 py-1 rounded-lg bg-teal-900 text-teal-200 font-mono font-bold text-xs shadow-2xs">
            {item.creditNoteNumber}
          </span>
          <span className="text-xs font-bold text-slate-900">
            {customerDisplay}
          </span>
          {invoiceRefDisplay !== "—" && (
            <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              Invoice #{invoiceRefDisplay}
            </span>
          )}
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE_CLASSES[item.status] || STATUS_BADGE_CLASSES.DRAFT}`}
          >
            {item.status}
          </span>
        </>
      }
      headerRight={
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPrint(item)}
          icon={<PrintIcon size={13} className="text-emerald-700" />}
          className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
        >
          Print Voucher (PDF)
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card
          id="total-credit-amount"
          title="Total Credit Amount"
          value={`AED ${formatNumber(totalAmt)}`}
          subtitle="Receivable deduction"
          accentColor="rose"
        />

        <Card
          id="net-scope"
          title="Net Scope (Excl. VAT)"
          value={`AED ${formatNumber(subtotalAmt)}`}
          subtitle="Direct revenue deduction"
          accentColor="blue"
        />

        <Card
          id="vat-adjustment"
          title="Output VAT Adjustment (5%)"
          value={`AED ${formatNumber(vatAmt)}`}
          subtitle="UAE FTA standard rated (5%)"
          accentColor="emerald"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ExpandedRowSection
          title="Client & Scope Details"
          icon={<PackageIcon size={14} />}
          badge="Credit Note Assignment"
        >
          <div className="space-y-1.5 text-xs">
            <div className="flex items-start justify-between">
              <span className="text-slate-500 font-medium">Customer:</span>
              <span className="font-bold text-slate-900 text-right">
                {customerDisplay}
              </span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-slate-500 font-medium">Project Scope:</span>
              <span className="font-semibold text-slate-800 text-right">
                {scopeDisplay}
              </span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-slate-500 font-medium">
                Linked Invoice:
              </span>
              <span className="font-mono text-teal-800 font-bold text-right">
                {invoiceRefDisplay !== "—"
                  ? `#${invoiceRefDisplay}`
                  : "Direct Adjustment"}
              </span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-slate-500 font-medium">Return Date:</span>
              <span className="font-mono text-slate-700 text-right">
                {dateDisplay}
              </span>
            </div>
          </div>
        </ExpandedRowSection>

        <ExpandedRowSection
          title="Accounting & Ledger Audit"
          icon={<ScaleIcon size={14} />}
          badge="Financial Impact"
        >
          <div className="space-y-1.5 text-xs">
            <div className="flex items-start justify-between">
              <span className="text-slate-500 font-medium">Type:</span>
              <span className="font-bold text-slate-800 text-right">
                Sales Credit Note
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">
                Double-Entry Posting:
              </span>
              <span className="font-mono text-[11px] text-slate-700 block mt-0.5">
                Dr. Service Income (4000) • Dr. VAT Output (2210) • Cr. AR
                (1200)
              </span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-slate-500 font-medium">Status:</span>
              <span className="font-bold text-emerald-800 text-right">
                {item.status === "POSTED"
                  ? "Automated GL Reversal"
                  : "Draft / Pending Posting"}
              </span>
            </div>
          </div>
        </ExpandedRowSection>
      </div>

      <ExpandedRowSection
        title="Credit Adjustment Reason / Client Return Note"
        icon={<FileTextIcon size={14} />}
      >
        <p className="text-xs font-medium text-slate-800 pl-3 border-l-2 border-amber-400 mt-1">
          &ldquo;{item.reason || "No custom note provided"}&rdquo;
        </p>
      </ExpandedRowSection>
    </CustomRowExpand>
  );
}

export default SalesReturnExpandedRow;
