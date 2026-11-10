"use client";

import React from "react";
import { PurchaseOrder, PurchaseOrderStatus } from "@/lib/hooks/api-hooks";
import { TableRow, TableCell } from "@/components/ui";
import { ShoppingCartIcon, EyeIcon, MoreVerticalIcon } from "@/components/icons";
import { formatNumber } from "@/lib/utils/format";

export interface PurchaseOrderRowProps {
  po: PurchaseOrder;
  onView: (po: PurchaseOrder) => void;
  onOpenMenu: (e: React.MouseEvent<HTMLButtonElement>, po: PurchaseOrder) => void;
  isMenuOpen: boolean;
  getStatusBadge: (status: PurchaseOrderStatus, po?: any) => React.ReactNode;
}

export const PurchaseOrderRow: React.FC<PurchaseOrderRowProps> = ({
  po,
  onView,
  onOpenMenu,
  isMenuOpen,
  getStatusBadge,
}) => {
  return (
    <TableRow
      onClick={() => onView(po)}
      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
    >
      <TableCell className="py-2.5 px-3 font-mono whitespace-nowrap text-xs">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span
              className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium px-2 py-0.5 rounded-md max-w-fit transition-colors"
              style={{
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
              }}
            >
              <ShoppingCartIcon size={12} className="shrink-0" />
              <span>{po.poNumber}</span>
            </span>
            {po.vendorReference && (
              <span
                className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded inline-block mt-1 max-w-fit"
                style={{
                  backgroundColor: "#f8fafc",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                }}
              >
                Ref: {po.vendorReference}
              </span>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="py-2.5 px-3 text-slate-800 text-xs">
        <div
          className="font-medium text-slate-800 truncate max-w-[220px]"
          title={po.supplier?.name || po.shopName || "External Supplier"}
        >
          {po.supplier?.name || po.shopName || "External Supplier"}
        </div>
        {po.supplier?.trn ? (
          <div className="text-[10.5px] text-slate-400 font-mono">TRN: {po.supplier.trn}</div>
        ) : po.shopName && po.supplier?.name ? (
          <div className="text-[10.5px] text-slate-400 truncate max-w-[200px]">{po.shopName}</div>
        ) : null}
      </TableCell>

      <TableCell className="py-2.5 px-2.5 text-center font-mono text-slate-600 text-xs whitespace-nowrap">
        {po.orderDate ? new Date(po.orderDate).toLocaleDateString("en-GB") : "-"}
      </TableCell>

      <TableCell className="py-2.5 px-2.5 text-center font-mono text-slate-600 text-xs whitespace-nowrap">
        {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString("en-GB") : "-"}
      </TableCell>

      <TableCell className="py-2.5 px-2.5 text-center text-xs whitespace-nowrap font-normal text-slate-600">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium"
          style={{
            backgroundColor: "#f8fafc",
            color: "#334155",
            border: "1px solid #e2e8f0",
          }}
        >
          {po.items?.length || 0} {po.items?.length === 1 ? "Item" : "Items"}
        </span>
      </TableCell>

      <TableCell
        align="right"
        className="py-2.5 px-2.5 text-right font-mono font-semibold text-slate-800 text-xs whitespace-nowrap"
      >
        AED {formatNumber(po.totalAmount)}
      </TableCell>

      <TableCell className="py-2.5 px-2.5 text-center whitespace-nowrap">
        {getStatusBadge(po.status, po)}
      </TableCell>

      <TableCell className="py-2.5 px-2 sm:pr-3 text-right print:hidden whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onView(po)}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#1d4ed8] hover:bg-[#eff6ff] border border-transparent hover:border-[#bfdbfe] transition-all cursor-pointer"
            title="View Details"
          >
            <EyeIcon size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => onOpenMenu(e, po)}
            className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              isMenuOpen
                ? "bg-[#1d4ed8] text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200"
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

export default PurchaseOrderRow;
