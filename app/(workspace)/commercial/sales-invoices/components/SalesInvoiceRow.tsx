"use client";

import React, { Fragment } from "react";
import { TableRow, TableCell, Button } from "@/components/ui";
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
          <span className="text-[10px] text-slate-400 font-normal block">
            Incl. 5% VAT: {formatNumber(inv.vatAmount)}
          </span>
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
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              inv.status === "PAID"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : inv.status === "POSTED"
                  ? "bg-sky-50 text-sky-800 border-sky-200"
                  : inv.status === "PARTIALLY_PAID"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {inv.status === "PAID"
              ? "Paid"
              : inv.status === "POSTED"
                ? "Posted"
                : inv.status === "PARTIALLY_PAID"
                  ? "Partial"
                  : "Draft"}
          </span>
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
