"use client";

import React from "react";
import {
  Modal,
  Button,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui";
import { PrintIcon } from "@/components/icons";
import { PurchaseOrder, PurchaseOrderStatus } from "@/lib/hooks/api-hooks";

export interface PurchaseOrderDetailModalProps {
  po: PurchaseOrder | null;
  onClose: () => void;
  onPrint: (po: PurchaseOrder) => void;
  getStatusBadge: (status: PurchaseOrderStatus) => React.ReactNode;
}

export const PurchaseOrderDetailModal: React.FC<
  PurchaseOrderDetailModalProps
> = ({ po, onClose, onPrint, getStatusBadge }) => {
  return (
    <Modal
      isOpen={!!po}
      onClose={onClose}
      title={po ? `Purchase Order Details - ${po.poNumber}` : ""}
      maxWidth="2xl"
    >
      {po && (
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {po.poNumber}
              </h3>
              <p className="text-[11px] text-slate-400">
                Order Date: {new Date(po.orderDate).toLocaleDateString("en-GB")}
              </p>
            </div>
            <div>{getStatusBadge(po.status)}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Vendor / Shop
              </span>
              <span className="font-bold text-slate-800 block">
                {po.supplier?.name || po.shopName || "External Vendor"}
              </span>
              {po.shopName && (
                <span className="text-slate-500 block">
                  Store: {po.shopName}
                </span>
              )}
              <span className="text-slate-400 block">
                TRN: {po.supplier?.trn || "N/A"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Vendor Reference &amp; Delivery
              </span>
              {po.vendorReference && (
                <span className="font-mono font-bold text-emerald-800 block">
                  Ref: {po.vendorReference}
                </span>
              )}
              <span className="font-medium text-slate-700 block">
                Due:{" "}
                {po.expectedDate
                  ? new Date(po.expectedDate).toLocaleDateString("en-GB")
                  : "Not specified"}
              </span>
            </div>
          </div>

          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Product / Item</TableHeaderCell>
                <TableHeaderCell>Shop Reference</TableHeaderCell>
                <TableHeaderCell align="center">Ordered</TableHeaderCell>
                <TableHeaderCell align="center">Received</TableHeaderCell>
                <TableHeaderCell align="right">Unit Cost</TableHeaderCell>
                <TableHeaderCell align="right">Total</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {po.items.map((it) => (
                <TableRow key={it.id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900">
                      {it.product?.name}
                    </div>
                    {it.product?.brand && (
                      <div className="text-[10px] text-slate-500">
                        Brand:{" "}
                        <span className="font-medium text-slate-700">
                          {it.product.brand}
                        </span>
                      </div>
                    )}
                    {it.itemNotes && (
                      <div className="text-[10px] text-slate-400 italic">
                        {it.itemNotes}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-slate-600">
                      {it.supplierSku || it.product?.supplierSku || "-"}
                    </span>
                  </TableCell>
                  <TableCell align="center">
                    <span className="font-mono font-bold">
                      {it.quantityOrdered}
                    </span>{" "}
                    <span className="text-[10px] text-slate-400">
                      {it.product?.unit}
                    </span>
                  </TableCell>
                  <TableCell align="center">
                    <span className="font-mono">{it.quantityReceived}</span>
                  </TableCell>
                  <TableCell align="right" className="font-mono">
                    {Number(it.unitCost).toFixed(2)}
                  </TableCell>
                  <TableCell align="right" className="font-mono font-bold">
                    {Number(it.totalCost).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400">{po.notes || ""}</span>
            <span className="text-sm font-black text-slate-900 font-mono">
              Total: AED {Number(po.totalAmount).toFixed(2)}
            </span>
          </div>

          <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="md" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={<PrintIcon className="w-4 h-4" strokeWidth={2} />}
              onClick={() => onPrint(po)}
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
            >
              Print / Save PDF
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PurchaseOrderDetailModal;
