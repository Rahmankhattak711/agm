"use client";

import React from "react";
import { useRouter } from "next/navigation";
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
import { FileText, ExternalLink } from "lucide-react";
import { PurchaseOrder, PurchaseOrderStatus } from "@/lib/hooks/api-hooks";

export interface PurchaseOrderDetailModalProps {
  po: PurchaseOrder | null;
  onClose: () => void;
  onPrint: (po: PurchaseOrder) => void;
  getStatusBadge: (status: PurchaseOrderStatus, po?: any) => React.ReactNode;
  onConvertToBill?: (po: PurchaseOrder) => void;
}

export const PurchaseOrderDetailModal: React.FC<
  PurchaseOrderDetailModalProps
> = ({ po, onClose, onPrint, getStatusBadge, onConvertToBill }) => {
  const router = useRouter();
  const isBilled = Boolean(po?.supplierBills && po.supplierBills.length > 0);
  const linkedBill = isBilled && po?.supplierBills ? po.supplierBills[0] : null;

  return (
    <Modal
      isOpen={!!po}
      onClose={onClose}
      title={po ? `Purchase Order Details - ${po.poNumber}` : ""}
      maxWidth="2xl"
    >
      {po && (
        <div className="space-y-4 text-xs">
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{
              backgroundColor: "#f4f7fb",
              border: "1px solid #cbd5e1",
            }}
          >
            <div>
              <h3 className="font-semibold text-sm text-slate-800 font-mono">
                {po.poNumber}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Order Date: {new Date(po.orderDate).toLocaleDateString("en-GB")}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div>{getStatusBadge(po.status, po)}</div>
              {isBilled && linkedBill && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/commercial/supplier-bills/${linkedBill.id}`);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1d4ed8] hover:underline cursor-pointer"
                  title="View Linked Supplier Bill"
                >
                  <span>Bill: {linkedBill.billNumber}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl text-xs"
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
            }}
          >
            <div>
              <span className="text-[10px] font-medium text-slate-500 uppercase block">
                Vendor / Shop
              </span>
              <span className="font-medium text-slate-800 block mt-0.5">
                {po.supplier?.name || po.shopName || "External Vendor"}
              </span>
              {po.shopName && (
                <span className="text-slate-500 block">
                  Store: {po.shopName}
                </span>
              )}
              <span className="text-slate-500 font-mono text-[11px] block">
                TRN: {po.supplier?.trn || "N/A"}
              </span>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] font-medium text-slate-500 uppercase block">
                Vendor Reference &amp; Delivery
              </span>
              {po.vendorReference && (
                <span className="font-mono font-medium text-[#1d4ed8] block mt-0.5">
                  Ref: {po.vendorReference}
                </span>
              )}
              <span className="font-normal text-slate-700 block mt-0.5">
                Due:{" "}
                {po.expectedDate
                  ? new Date(po.expectedDate).toLocaleDateString("en-GB")
                  : "Not specified"}
              </span>
            </div>
          </div>

          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid #cbd5e1" }}
          >
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
                      <div className="font-medium text-slate-800">
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
                      <span className="font-mono font-medium text-slate-800">
                        {it.quantityOrdered}
                      </span>{" "}
                      <span className="text-[10px] text-slate-400">
                        {it.product?.unit}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <span className="font-mono text-slate-700">
                        {it.quantityReceived}
                      </span>
                    </TableCell>
                    <TableCell align="right" className="font-mono text-slate-700">
                      {Number(it.unitCost).toFixed(2)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="font-mono font-semibold text-slate-800"
                    >
                      {Number(it.totalCost).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div
            className="flex justify-between items-center p-3 rounded-xl"
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
            }}
          >
            <span className="text-xs text-slate-600">{po.notes || "Total Order Value"}</span>
            <span className="text-sm font-semibold text-[#1d4ed8] font-mono">
              Total: AED {Number(po.totalAmount).toFixed(2)}
            </span>
          </div>

          <div
            className="flex flex-wrap justify-end items-center gap-2 pt-3"
            style={{ borderTop: "1px solid #e2e8f0" }}
          >
            <Button variant="outline" size="md" onClick={onClose}>
              Close
            </Button>
            {isBilled && linkedBill ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(`/commercial/supplier-bills/${linkedBill.id}`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white shadow-2xs transition-colors cursor-pointer"
                style={{ backgroundColor: "#1d4ed8" }}
              >
                <FileText className="w-4 h-4" />
                View Bill ({linkedBill.billNumber})
              </button>
            ) : onConvertToBill && po.status === "RECEIVED" ? (
              <Button
                variant="primary"
                size="md"
                onClick={() => onConvertToBill(po)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
              >
                Convert to Bill &amp; Post
              </Button>
            ) : null}
            <button
              type="button"
              onClick={() => onPrint(po)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium text-white shadow-2xs transition-colors cursor-pointer"
              style={{ backgroundColor: "#1d4ed8" }}
            >
              <PrintIcon className="w-4 h-4" strokeWidth={2} />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PurchaseOrderDetailModal;
