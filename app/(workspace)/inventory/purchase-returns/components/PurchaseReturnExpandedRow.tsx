"use client";

import React from "react";
import {
  BuildingIcon,
  CreditCardIcon,
  FileTextIcon,
  ShieldCheckIcon,
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
import { PurchaseReturnItem, formatAed, formatNumber } from "./types";

export interface PurchaseReturnExpandedRowProps {
  item: PurchaseReturnItem;
  onPrint: () => void;
  onClose: () => void;
}

export function PurchaseReturnExpandedRow({
  item,
  onPrint,
  onClose,
}: PurchaseReturnExpandedRowProps) {
  const total = Number(item.totalAmount || 0);
  const subtotal = Number(item.subtotal || total / 1.05);
  const vat = Number(item.vatAmount || total - subtotal);
  const projectDisplay = item.projectName
    ? `${item.projectCode ? `${item.projectCode} — ` : ""}${item.projectName}`
    : "General / Warehouse Stock";

  const getStatusTone = (
    status: string,
  ): "emerald" | "sky" | "amber" | "slate" | "rose" => {
    switch (status) {
      case "POSTED":
      case "COMPLETED":
        return "emerald";
      case "APPROVED":
        return "sky";
      case "SUBMITTED":
        return "amber";
      case "DRAFT":
        return "slate";
      case "CANCELLED":
      case "REJECTED":
        return "rose";
      default:
        return "slate";
    }
  };

  return (
    <CustomRowExpand
      colSpan={8}
      onClose={onClose}
      headerLeft={
        <>
          <span className="px-2.5 py-1 rounded-lg bg-teal-900 text-teal-200 font-mono font-bold text-xs shadow-2xs">
            {item.returnNumber}
          </span>
          <span className="text-xs font-bold text-slate-900">
            {item.supplierName}
          </span>
          {item.poReference && (
            <span className="text-[11px] font-mono text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-bold">
              Ref #{item.poReference}
            </span>
          )}
          {item.supplierTrn && (
            <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <ShieldCheckIcon size={12} className="text-emerald-700" />
              TRN: {item.supplierTrn}
            </span>
          )}
          <Badge tone={getStatusTone(item.status)}>{item.status}</Badge>
        </>
      }
      headerRight={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPrint}
          icon={
            <PrintIcon size={14} className="w-3.5 h-3.5 text-emerald-700" />
          }
          className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
        >
          Print Debit Note (PDF)
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card
          id={`return-total-${item.id}`}
          value={formatAed(total)}
          title="Total Debit Amount"
          subtitle="Payable liability deduction"
          icon={<CreditCardIcon size={16} />}
          accentColor="rose"
        />

        <Card
          id={`return-subtotal-${item.id}`}
          value={`AED ${formatNumber(subtotal)}`}
          title="Net Scope (Excl. VAT)"
          subtitle="Material cost reduction"
          icon={<FileTextIcon size={16} />}
          accentColor="slate"
        />

        <Card
          id={`return-vat-${item.id}`}
          value={`AED ${formatNumber(vat)}`}
          title="Input VAT Reversal (5%)"
          subtitle="UAE FTA standard rate deduction"
          icon={<ShieldCheckIcon size={16} />}
          accentColor="purple"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ExpandedRowSection
          title="Vendor & Project Assignment"
          icon={<BuildingIcon size={14} />}
          badge="Procurement Partner"
        >
          <div className="space-y-1.5 text-xs">
            <div className="flex items-start justify-between">
              <span className="text-slate-500 font-medium">Supplier:</span>
              <span className="font-bold text-slate-900 text-right">
                {item.supplierName}
              </span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-slate-500 font-medium">
                Associated Project:
              </span>
              <span className="font-bold text-emerald-800 text-right">
                {projectDisplay}
              </span>
            </div>
            {item.clientName && (
              <div className="flex items-start justify-between">
                <span className="text-slate-500 font-medium">
                  Project Client:
                </span>
                <span className="font-medium text-slate-700 text-right">
                  {item.clientName}
                </span>
              </div>
            )}
            <div className="flex items-start justify-between">
              <span className="text-slate-500 font-medium">
                Ref / PO Number:
              </span>
              <span className="font-mono text-slate-800 font-semibold text-right">
                {item.poReference || "Direct Return"}
              </span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-slate-500 font-medium">Return Date:</span>
              <span className="font-mono text-slate-700 text-right">
                {item.returnDate
                  ? new Date(item.returnDate).toLocaleDateString("en-GB")
                  : "—"}
              </span>
            </div>
          </div>
        </ExpandedRowSection>

        <ExpandedRowSection
          title="Accounting & Ledger Audit"
          icon={<ScaleIcon size={14} />}
          badge="Double-Entry"
        >
          <div className="space-y-1.5 text-xs">
            <div className="flex items-start justify-between">
              <span className="text-slate-500 font-medium">Type:</span>
              <span className="font-bold text-slate-800 text-right">
                Purchase Debit Note
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">
                Double-Entry Impact:
              </span>
              <span className="font-mono text-[11px] text-slate-700 block mt-0.5">
                Dr. Accounts Payable (2000) • Cr. Direct Cost (5010) • Cr. VAT
                Input (2200)
              </span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-slate-500 font-medium">
                Posting Status:
              </span>
              <span className="font-bold text-emerald-800 text-right">
                {item.status === "POSTED"
                  ? "Automated GL Liability Reduction"
                  : "Draft / Unposted"}
              </span>
            </div>
          </div>
        </ExpandedRowSection>
      </div>

      <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/90 space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
          Material Rejection Reason / Quality Note
        </span>
        <p className="text-xs font-medium text-slate-800 pl-3 border-l-2 border-amber-400 mt-1">
          &ldquo;{item.reason || "Material return / defect note"}&rdquo;
        </p>
      </div>
    </CustomRowExpand>
  );
}
