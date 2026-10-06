"use client";

import React, { Fragment } from "react";
import { TableRow, TableCell, Button, Badge } from "@/components/ui";
import { getInvoiceStatus } from "@/lib/utils/status";
import {
  ChevronDownIcon,
  CreditCardIcon,
  FileCheck2Icon,
  FileTextIcon,
  PrintIcon,
} from "@/components/icons";
import { SalesInvoice } from "@/lib/hooks/api-hooks";
import { formatNumber } from "./types";
import SalesInvoiceExpandedDetail from "./SalesInvoiceExpandedDetail";

export interface SalesInvoiceRowProps {
  inv: SalesInvoice;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPrint: (inv: SalesInvoice) => void;
  onPost: (invId: string) => void;
  onOpenPayment: (inv: SalesInvoice) => void;
}

export const SalesInvoiceRow: React.FC<SalesInvoiceRowProps> = ({
  inv,
  isExpanded,
  onToggleExpand,
  onPrint,
  onPost,
  onOpenPayment,
}) => {
  const status = getInvoiceStatus(inv.status);
  return (
    <Fragment>
      <TableRow
        onClick={onToggleExpand}
        className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
          isExpanded ? "bg-slate-50/90 font-medium" : ""
        }`}
      >
        <TableCell className="py-3 px-4 font-mono font-bold text-slate-900">
          <div className="flex items-center gap-1.5">
            <FileTextIcon size={13} className="text-emerald-700 shrink-0" />
            <span>{inv.invoiceNumber}</span>
          </div>
          {inv.quotationRef && (
            <div className="text-[10.5px] text-teal-700 font-mono font-bold mt-0.5 inline-flex items-center gap-1">
              <span className="text-slate-400 font-normal">Quote:</span> {inv.quotationRef}
            </div>
          )}
        </TableCell>
        <TableCell className="py-3 px-4 font-bold text-slate-900">
          <div>{inv.customerName}</div>
          {inv.customerTrn && (
            <div className="text-[10px] text-slate-400 font-mono font-normal">
              TRN: {inv.customerTrn}
            </div>
          )}
        </TableCell>
        <TableCell className="py-3 px-4 max-w-xs truncate text-slate-700">
          {inv.projectScope || "—"}
        </TableCell>
        <TableCell className="py-3 px-3 text-slate-600 font-mono text-xs">
          {inv.invoiceDate
            ? new Date(inv.invoiceDate).toLocaleDateString("en-GB")
            : "—"}
        </TableCell>
        <TableCell
          align="right"
          className="py-3 px-3 text-right font-mono font-black text-slate-900"
        >
          {formatNumber(inv.totalAmount)}
        </TableCell>
        <TableCell
          align="right"
          className={`py-3 px-3 text-right font-mono font-bold ${
            Number(inv.remainingBalance) > 0
              ? "text-rose-700"
              : "text-emerald-700"
          }`}
        >
          {formatNumber(inv.remainingBalance)}
        </TableCell>
        <TableCell className="py-3 px-3 text-center">
          <Badge tone={status.tone}>{status.label}</Badge>
        </TableCell>
        <TableCell className="py-3 px-3 text-center print:hidden">
          <div className="flex items-center justify-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPrint(inv);
              }}
              className="p-1.5 text-slate-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
              title="Print Tax Invoice"
            >
              <PrintIcon size={13} />
            </Button>
            {inv.status === "DRAFT" && (
              <Button
                variant="dark"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPost(inv.id);
                }}
                icon={<FileCheck2Icon size={12} />}
                className="text-[10px] font-bold bg-agm-green text-white hover:bg-agm-green-2 cursor-pointer"
              >
                Post to GL
              </Button>
            )}
            {inv.status !== "DRAFT" && inv.status !== "PAID" && (
              <Button
                variant="dark"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPayment(inv);
                }}
                icon={<CreditCardIcon size={12} />}
                className="text-[10px] font-bold bg-teal-800 text-white hover:bg-teal-900 cursor-pointer"
              >
                Receive
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isExpanded
                  ? "text-emerald-800 bg-emerald-100"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
              title={isExpanded ? "Collapse Details" : "View Invoice Details"}
            >
              <ChevronDownIcon
                size={14}
                className={`transition-transform duration-200 ${
                  isExpanded ? "rotate-180 text-emerald-800" : ""
                }`}
              />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="hover:bg-transparent bg-slate-50/70">
          <TableCell
            colSpan={8}
            className="p-0 border-b-2 border-emerald-600/40"
          >
            <SalesInvoiceExpandedDetail
              inv={inv}
              onPrint={onPrint}
              onPost={onPost}
              onOpenPayment={onOpenPayment}
              onClose={onToggleExpand}
            />
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
};

export default SalesInvoiceRow;
