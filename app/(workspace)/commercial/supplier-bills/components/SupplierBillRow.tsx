"use client";

import React, { Fragment } from "react";
import { SupplierBill } from "@/lib/hooks/api-hooks";
import { TableRow, TableCell } from "@/components/ui";
import {
  ReceiptIcon,
  EyeIcon,
  MoreVerticalIcon,
} from "@/components/icons";
import { formatNumber } from "@/lib/utils/format";

export interface SupplierBillRowProps {
  bill: SupplierBill;
  onView: () => void;
  onOpenMenu: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isMenuOpen: boolean;
}

export const SupplierBillRow: React.FC<SupplierBillRowProps> = ({
  bill,
  onView,
  onOpenMenu,
  isMenuOpen,
}) => {
  return (
    <TableRow
      onClick={onView}
      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
    >
      <TableCell className="py-2.5 px-2.5 sm:px-3 font-mono font-bold text-teal-800 whitespace-nowrap text-xs">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <ReceiptIcon size={14} className="text-teal-700 shrink-0" />
          <span className="font-mono font-bold text-slate-900 hover:text-indigo-600 transition-colors">
            {bill.billNumber}
          </span>
        </div>
      </TableCell>
      <TableCell className="py-2.5 px-2.5 sm:px-3 text-slate-900 text-xs">
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
      <TableCell className="py-2.5 px-2.5 text-center font-mono text-slate-600 text-xs whitespace-nowrap">
        {bill.billDate
          ? new Date(bill.billDate).toLocaleDateString("en-GB")
          : "-"}
      </TableCell>
      <TableCell className="py-2.5 px-2.5 text-center font-mono text-slate-600 text-xs whitespace-nowrap">
        {bill.dueDate
          ? new Date(bill.dueDate).toLocaleDateString("en-GB")
          : "-"}
      </TableCell>
      <TableCell
        align="right"
        className="py-2.5 px-2.5 text-right font-mono font-bold text-slate-900 text-xs whitespace-nowrap"
      >
        {formatNumber(bill.totalAmount)}
      </TableCell>
      <TableCell
        align="right"
        className="py-2.5 px-2.5 text-right font-mono font-bold text-xs whitespace-nowrap"
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
      <TableCell className="py-2.5 px-2.5 text-center whitespace-nowrap">
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
      <TableCell className="py-2.5 px-2 sm:pr-3 text-right print:hidden whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onView}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all cursor-pointer"
            title="View Bill Details Page"
          >
            <EyeIcon size={15} />
          </button>
          <button
            type="button"
            onClick={onOpenMenu}
            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              isMenuOpen
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200"
            }`}
            title="More actions"
          >
            <MoreVerticalIcon size={15} />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default SupplierBillRow;
