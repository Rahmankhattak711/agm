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
      <TableCell className="py-2.5 px-2.5 sm:px-3 font-mono whitespace-nowrap text-xs">
        <span
          className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium px-2 py-0.5 rounded-md max-w-fit"
          style={{
            backgroundColor: "#eff6ff",
            color: "#1d4ed8",
            border: "1px solid #bfdbfe",
          }}
        >
          <ReceiptIcon size={12} className="shrink-0" />
          <span>{bill.billNumber}</span>
        </span>
      </TableCell>
      <TableCell className="py-2.5 px-2.5 sm:px-3 text-slate-800 text-xs">
        <div
          className="font-medium text-slate-800 truncate max-w-[140px] sm:max-w-[200px]"
          title={bill.supplierName}
        >
          {bill.supplierName}
        </div>
        {bill.supplierTrn && (
          <div className="text-[10.5px] text-slate-400 font-mono font-normal">
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
        className="py-2.5 px-2.5 text-right font-mono font-medium text-slate-800 text-xs whitespace-nowrap"
      >
        AED {formatNumber(bill.totalAmount)}
      </TableCell>
      <TableCell
        align="right"
        className="py-2.5 px-2.5 text-right font-mono font-semibold text-xs whitespace-nowrap"
      >
        <span
          className={
            Number(bill.remainingBalance) > 0
              ? "text-rose-700"
              : "text-emerald-700"
          }
        >
          AED {formatNumber(bill.remainingBalance)}
        </span>
      </TableCell>
      <TableCell className="py-2.5 px-2.5 text-center whitespace-nowrap">
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-medium tracking-tight ${
            bill.status === "PAID"
              ? "bg-[#f0fdf4] text-[#166534] border border-[#86efac]"
              : bill.status === "POSTED"
                ? "bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]"
                : bill.status === "PARTIALLY_PAID"
                  ? "bg-[#fefce8] text-[#92400e] border border-[#fde047]"
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
            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#1d4ed8] hover:bg-[#eff6ff] border border-transparent hover:border-[#bfdbfe] transition-all cursor-pointer"
            title="View Bill Details Page"
          >
            <EyeIcon size={14} />
          </button>
          <button
            type="button"
            onClick={onOpenMenu}
            className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              isMenuOpen
                ? "bg-[#1d4ed8] text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200"
            }`}
            title="More actions"
          >
            <MoreVerticalIcon size={14} />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default SupplierBillRow;
