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
  getStatusBadge: (status: PurchaseOrderStatus) => React.ReactNode;
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
      <TableCell className="py-2.5 px-3 font-mono font-bold text-teal-800 whitespace-nowrap text-xs">
        <div className="flex items-center gap-2">
          <ShoppingCartIcon size={14} className="text-teal-700 shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 hover:text-indigo-600 transition-colors">
              {po.poNumber}
            </span>
            {po.vendorReference && (
              <span className="text-[10px] text-teal-800 font-mono font-semibold bg-teal-50 px-1 rounded border border-teal-200 inline-block mt-0.5 max-w-fit">
                Ref: {po.vendorReference}
              </span>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="py-2.5 px-3 text-slate-900 text-xs">
        <div
          className="font-bold text-slate-900 truncate max-w-[200px]"
          title={po.supplier?.name || po.shopName || "External Supplier"}
        >
          {po.supplier?.name || po.shopName || "External Supplier"}
        </div>
        {po.supplier?.trn ? (
          <div className="text-[10px] text-slate-400 font-mono">TRN: {po.supplier.trn}</div>
        ) : po.shopName && po.supplier?.name ? (
          <div className="text-[10px] text-slate-400 truncate max-w-[200px]">{po.shopName}</div>
        ) : null}
      </TableCell>

      <TableCell className="py-2.5 px-2.5 text-center font-mono text-slate-600 text-xs whitespace-nowrap">
        {po.orderDate ? new Date(po.orderDate).toLocaleDateString("en-GB") : "-"}
      </TableCell>

      <TableCell className="py-2.5 px-2.5 text-center font-mono text-slate-600 text-xs whitespace-nowrap">
        {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString("en-GB") : "-"}
      </TableCell>

      <TableCell className="py-2.5 px-2.5 text-center text-xs whitespace-nowrap font-semibold text-slate-700">
        {po.items?.length || 0} Items
      </TableCell>

      <TableCell
        align="right"
        className="py-2.5 px-2.5 text-right font-mono font-bold text-slate-900 text-xs whitespace-nowrap"
      >
        {formatNumber(po.totalAmount)}
      </TableCell>

      <TableCell className="py-2.5 px-2.5 text-center whitespace-nowrap">
        {getStatusBadge(po.status)}
      </TableCell>

      <TableCell className="py-2.5 px-2 sm:pr-3 text-right print:hidden whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onView(po)}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all cursor-pointer"
            title="View Details"
          >
            <EyeIcon size={15} />
          </button>
          <button
            type="button"
            onClick={(e) => onOpenMenu(e, po)}
            className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              isMenuOpen
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200"
            }`}
            title="More actions"
          >
            <MoreVerticalIcon size={16} />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default PurchaseOrderRow;
