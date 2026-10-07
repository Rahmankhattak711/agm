"use client";

import React, { Fragment } from "react";
import { PurchaseOrder, PurchaseOrderStatus } from "@/lib/hooks/api-hooks";
import { TableRow, TableCell, Button } from "@/components/ui";
import {
  ShoppingCartIcon,
  PrintIcon,
  TrashIcon,
  ChevronDownIcon,
} from "@/components/icons";
import { formatNumber } from "@/lib/utils/format";
import { PurchaseOrderExpandedRow } from "./PurchaseOrderExpandedRow";

export interface PurchaseOrderRowProps {
  po: PurchaseOrder;
  isExpanded: boolean;
  canEdit: boolean;
  onToggleExpand: () => void;
  onPrint: () => void;
  onDelete: () => void;
  onSend?: () => void;
  onReceive?: () => void;
  isUpdating?: boolean;
  onCloseExpand: () => void;
  getStatusBadge: (status: PurchaseOrderStatus) => React.ReactNode;
}

export const PurchaseOrderRow: React.FC<PurchaseOrderRowProps> = ({
  po,
  isExpanded,
  canEdit,
  onToggleExpand,
  onPrint,
  onDelete,
  onSend,
  onReceive,
  isUpdating = false,
  onCloseExpand,
  getStatusBadge,
}) => {
  const isDraft = po.status === "DRAFT";

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
            <ShoppingCartIcon size={14} className="text-teal-700 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 hover:text-emerald-800 transition-colors">
                {po.poNumber}
              </span>
              {po.vendorReference && (
                <span className="text-[10px] text-teal-800 font-mono font-semibold bg-teal-50 px-1 py-0.2 rounded border border-teal-200 inline-block mt-0.5 max-w-fit">
                  Ref: {po.vendorReference}
                </span>
              )}
            </div>
          </div>
        </TableCell>

        <TableCell className="py-2 px-2.5 sm:px-3 text-slate-900 text-xs">
          <div
            className="font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[200px]"
            title={po.supplier?.name || po.shopName || "External Supplier"}
          >
            {po.supplier?.name || po.shopName || "External Supplier"}
          </div>
          {po.supplier?.trn ? (
            <div className="text-[10px] text-slate-400 font-mono font-normal">
              TRN: {po.supplier.trn}
            </div>
          ) : po.shopName && po.supplier?.name ? (
            <div className="text-[10px] text-slate-400 font-normal truncate max-w-[140px] sm:max-w-[200px]">
              {po.shopName}
            </div>
          ) : null}
        </TableCell>

        <TableCell className="py-2 px-2.5 text-center font-mono text-slate-600 text-xs whitespace-nowrap">
          {po.orderDate
            ? new Date(po.orderDate).toLocaleDateString("en-GB")
            : "-"}
        </TableCell>

        <TableCell className="py-2 px-2.5 text-center font-mono text-slate-600 text-xs whitespace-nowrap">
          {po.expectedDate
            ? new Date(po.expectedDate).toLocaleDateString("en-GB")
            : "-"}
        </TableCell>

        <TableCell className="py-2 px-2.5 text-center text-xs whitespace-nowrap font-semibold text-slate-700">
          {po.items?.length || 0} Items
        </TableCell>

        <TableCell
          align="right"
          className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 text-xs whitespace-nowrap"
        >
          {formatNumber(po.totalAmount)}
        </TableCell>

        <TableCell className="py-2 px-2.5 text-center whitespace-nowrap">
          {getStatusBadge(po.status)}
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
              title="Print PO Voucher"
            >
              <PrintIcon size={18} className="w-[18px] h-[18px]" />
            </Button>

            {isDraft && canEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                title="Delete PO"
              >
                <TrashIcon size={18} className="w-[18px] h-[18px]" />
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
        <PurchaseOrderExpandedRow
          po={po}
          canEdit={canEdit}
          onPrint={onPrint}
          onSend={onSend}
          onReceive={onReceive}
          isUpdating={isUpdating}
          onClose={onCloseExpand}
        />
      )}
    </Fragment>
  );
};

export default PurchaseOrderRow;
