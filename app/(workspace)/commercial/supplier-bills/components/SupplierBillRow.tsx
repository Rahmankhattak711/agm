"use client";

import React, { Fragment } from "react";
import { SupplierBill } from "@/lib/hooks/api-hooks";
import { TableRow, TableCell, Button } from "@/components/ui";
import {
  ReceiptIcon,
  PrintIcon,
  FileCheck2Icon,
  BanknoteIcon,
  ChevronDownIcon,
} from "@/components/icons";
import { formatNumber } from "@/lib/utils/format";
import { SupplierBillExpandedRow } from "./SupplierBillExpandedRow";

export interface SupplierBillRowProps {
  bill: SupplierBill;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPrint: () => void;
  onPost?: () => void;
  onDisburse?: () => void;
  onCloseExpand: () => void;
}

export const SupplierBillRow: React.FC<SupplierBillRowProps> = ({
  bill,
  isExpanded,
  onToggleExpand,
  onPrint,
  onPost,
  onDisburse,
  onCloseExpand,
}) => {
  return (
    <Fragment>
      <TableRow
        onClick={onToggleExpand}
        className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
          isExpanded ? "bg-slate-50/90 font-medium" : ""
        }`}
      >
        <TableCell className="py-2 px-2.5 sm:px-3 font-mono font-bold text-teal-800 whitespace-nowrap text-xs">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <ReceiptIcon size={14} className="text-teal-700 shrink-0" />
            <span className="font-mono font-bold text-slate-900 hover:text-emerald-800 transition-colors">
              {bill.billNumber}
            </span>
          </div>
        </TableCell>
        <TableCell className="py-2 px-2.5 sm:px-3 text-slate-900 text-xs">
          <div
            className="font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[200px]"
            title={bill.supplierName}
          >
            {bill.supplierName}
          </div>
          {bill.supplierTrn && (
            <div className="text-[10px] text-slate-400 font-mono font-normal">
              TRN: {bill.supplierTrn}
            </div>
          )}
        </TableCell>
        <TableCell className="py-2 px-2.5 text-center font-mono text-slate-600 text-xs whitespace-nowrap">
          {bill.billDate
            ? new Date(bill.billDate).toLocaleDateString("en-GB")
            : "-"}
        </TableCell>
        <TableCell className="py-2 px-2.5 text-center font-mono text-slate-600 text-xs whitespace-nowrap">
          {bill.dueDate
            ? new Date(bill.dueDate).toLocaleDateString("en-GB")
            : "-"}
        </TableCell>
        <TableCell
          align="right"
          className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 text-xs whitespace-nowrap"
        >
          {formatNumber(bill.totalAmount)}
        </TableCell>
        <TableCell
          align="right"
          className="py-2 px-2.5 text-right font-mono font-bold text-xs whitespace-nowrap"
        >
          <span
            className={
              Number(bill.remainingBalance) > 0
                ? "text-rose-700"
                : "text-emerald-700"
            }
          >
            {formatNumber(bill.remainingBalance)}
          </span>
        </TableCell>
        <TableCell className="py-2 px-2.5 text-center whitespace-nowrap">
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              bill.status === "PAID"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : bill.status === "POSTED"
                  ? "bg-sky-50 text-sky-700 border border-sky-200"
                  : bill.status === "PARTIALLY_PAID"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            {bill.status === "PAID"
              ? "Paid"
              : bill.status === "POSTED"
                ? "Posted"
                : bill.status === "PARTIALLY_PAID"
                  ? "Partial"
                  : "Draft"}
          </span>
        </TableCell>
        <TableCell className="py-2 px-2 sm:pr-3 text-right print:hidden whitespace-nowrap">
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPrint();
              }}
              className="h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
              title="Print Voucher (PDF)"
            >
              <PrintIcon size={18} className="w-[18px] h-[18px]" />
            </Button>
            {bill.status === "DRAFT" && onPost && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPost();
                }}
                className="h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                title="Post to General Ledger"
              >
                <FileCheck2Icon size={18} className="w-[18px] h-[18px]" />
              </Button>
            )}
            {bill.status !== "DRAFT" &&
              bill.status !== "PAID" &&
              onDisburse && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDisburse();
                  }}
                  className="h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-teal-700 rounded-lg hover:bg-teal-50 transition cursor-pointer"
                  title="Record Disbursement"
                >
                  <BanknoteIcon size={18} className="w-[18px] h-[18px]" />
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
              className={`h-8 w-8 p-0 flex items-center justify-center rounded-lg transition cursor-pointer ${
                isExpanded
                  ? "text-emerald-800 bg-emerald-100"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
              title={isExpanded ? "Collapse preview" : "Expand preview"}
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
        <SupplierBillExpandedRow
          bill={bill}
          onPrint={onPrint}
          onPost={onPost}
          onDisburse={onDisburse}
          onClose={onCloseExpand}
        />
      )}
    </Fragment>
  );
};

export default SupplierBillRow;
