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
  EditIcon,
  TrashIcon,
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
  onEdit: (inv: SalesInvoice) => void;
  onDelete: (inv: SalesInvoice) => void;
}

export const SalesInvoiceRow: React.FC<SalesInvoiceRowProps> = ({
  inv,
  isExpanded,
  onToggleExpand,
  onPrint,
  onPost,
  onOpenPayment,
  onEdit,
  onDelete,
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
        <TableCell className="py-2 px-2.5 sm:px-3 font-mono font-bold text-slate-900 whitespace-nowrap text-xs">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <FileTextIcon
              size={16}
              className="w-4 h-4 text-emerald-700 shrink-0"
            />
            <span className="whitespace-nowrap">{inv.invoiceNumber}</span>
          </div>
          {inv.quotationRef && (
            <div className="text-[10px] text-teal-700 font-mono font-semibold mt-0.5 flex items-center gap-1 whitespace-nowrap">
              <span className="text-slate-400 font-normal">Quote:</span>
              <span className="whitespace-nowrap">{inv.quotationRef}</span>
            </div>
          )}
        </TableCell>
        <TableCell className="py-2 px-2.5 sm:px-3 text-slate-900 text-xs">
          <div
            className="font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[180px]"
            title={inv.customerName}
          >
            {inv.customerName}
          </div>
          {inv.customerTrn && (
            <div className="text-[10px] text-slate-400 font-mono font-normal whitespace-nowrap truncate max-w-[140px]">
              TRN: {inv.customerTrn}
            </div>
          )}
        </TableCell>
        <TableCell className="py-2 px-2.5 sm:px-3 text-slate-700 text-xs">
          <div
            className="truncate max-w-[110px] sm:max-w-[150px]"
            title={inv.projectScope || ""}
          >
            {inv.projectScope || "—"}
          </div>
        </TableCell>
        <TableCell className="py-2 px-2 text-center text-slate-600 font-mono text-[11px] whitespace-nowrap">
          {inv.invoiceDate
            ? new Date(inv.invoiceDate).toLocaleDateString("en-GB")
            : "—"}
        </TableCell>
        <TableCell
          align="right"
          className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap text-xs"
        >
          {formatNumber(inv.totalAmount)}
        </TableCell>
        <TableCell
          align="right"
          className={`py-2 px-2.5 text-right font-mono font-bold whitespace-nowrap text-xs ${
            Number(inv.remainingBalance) > 0
              ? "text-rose-700"
              : "text-emerald-700"
          }`}
        >
          {formatNumber(inv.remainingBalance)}
        </TableCell>
        <TableCell className="py-2 px-2 text-center whitespace-nowrap">
          <Badge tone={status.tone} className="text-[10.5px] px-2 py-0.5">
            {status.label}
          </Badge>
        </TableCell>
        <TableCell className="py-2 px-2 sm:pr-3 text-right print:hidden whitespace-nowrap">
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPrint(inv);
              }}
              className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
              title="Print Tax Invoice"
            >
              <PrintIcon size={18} className="w-[18px] h-[18px]" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(inv);
              }}
              className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-teal-800 rounded-lg hover:bg-teal-50 transition cursor-pointer"
              title="Edit Invoice"
            >
              <EditIcon size={18} className="w-[18px] h-[18px]" />
            </Button>
            {inv.status === "DRAFT" && (
              <Button
                variant="dark"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPost(inv.id);
                }}
                icon={
                  <FileCheck2Icon size={15} className="w-[15px] h-[15px]" />
                }
                className="text-[11px] font-bold bg-agm-green text-white hover:bg-agm-green-2 cursor-pointer h-8 px-2.5 gap-1.5"
                title="Post to General Ledger"
              >
                Post
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
                icon={
                  <CreditCardIcon size={15} className="w-[15px] h-[15px]" />
                }
                className="text-[11px] font-bold bg-teal-800 text-white hover:bg-teal-900 cursor-pointer h-8 px-2.5 gap-1.5"
                title="Record Payment"
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
                onDelete(inv);
              }}
              className="h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition cursor-pointer"
              title="Delete Invoice"
            >
              <TrashIcon size={18} className="w-[18px] h-[18px]" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className={`h-8 w-8 p-0 flex items-center justify-center rounded-lg transition cursor-pointer ${
                isExpanded
                  ? "text-emerald-800 bg-emerald-100"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
              title={isExpanded ? "Collapse Details" : "View Invoice Details"}
            >
              <ChevronDownIcon
                size={18}
                className={`w-[18px] h-[18px] transition-transform duration-200 ${
                  isExpanded ? "rotate-180 text-emerald-800" : ""
                }`}
              />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="hover:bg-transparent bg-slate-50/70">
          <TableCell colSpan={8} className="p-0 border-b border-slate-200/80">
            <SalesInvoiceExpandedDetail
              inv={inv}
              onPrint={onPrint}
              onPost={onPost}
              onOpenPayment={onOpenPayment}
              onEdit={() => onEdit(inv)}
              onDelete={() => onDelete(inv)}
              onClose={onToggleExpand}
            />
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
};

export default SalesInvoiceRow;
