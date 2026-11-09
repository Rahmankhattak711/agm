"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Modal,
  Button,
  Badge,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui";
import { PrintIcon } from "@/components/icons";
import { FileText, ShieldCheck, Building, Calendar, Hash, ArrowUpRight } from "lucide-react";
import { PurchaseReturnItem, formatAed } from "./types";

export interface PurchaseReturnDetailModalProps {
  item: PurchaseReturnItem | null;
  onClose: () => void;
  onPrint: (item: PurchaseReturnItem) => void;
}

const getStatusTone = (
  status: string,
): "emerald" | "sky" | "amber" | "slate" | "rose" => {
  switch (status) {
    case "POSTED":
    case "COMPLETED":
      return "emerald";
    case "APPROVED":
      return "sky";
    case "SUBMITTED":
      return "amber";
    case "DRAFT":
      return "slate";
    case "CANCELLED":
    case "REJECTED":
      return "rose";
    default:
      return "slate";
  }
};

export const PurchaseReturnDetailModal: React.FC<
  PurchaseReturnDetailModalProps
> = ({ item, onClose, onPrint }) => {
  const router = useRouter();

  if (!item) return null;

  const total = Number(item.totalAmount || 0);
  const subtotal = Number(item.subtotal || total / 1.05);
  const vat = Number(item.vatAmount || total - subtotal);
  const projectDisplay = item.projectName
    ? `${item.projectCode ? `${item.projectCode} — ` : ""}${item.projectName}`
    : "General / Warehouse Stock";

  return (
    <Modal
      isOpen={!!item}
      onClose={onClose}
      title={`Debit Note Details - ${item.returnNumber}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Header Summary */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 font-mono">
                {item.returnNumber}
              </h3>
              <Badge tone={getStatusTone(item.status)}>{item.status}</Badge>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Return Date:{" "}
              {item.returnDate
                ? new Date(item.returnDate).toLocaleDateString("en-GB")
                : "—"}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Total Debit Note
            </span>
            <span className="text-base font-black text-rose-700 font-mono">
              {formatAed(total)}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Supplier / Vendor
            </span>
            <div className="font-bold text-slate-900 text-xs">
              {item.supplierName}
            </div>
            {item.supplierTrn && (
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                TRN: {item.supplierTrn}
              </div>
            )}
            {item.poReference && (
              <div className="text-[11px] text-teal-800 font-mono font-semibold mt-1">
                Ref / Bill: {item.poReference}
              </div>
            )}
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Project & Return Reason
            </span>
            <div className="font-semibold text-slate-800 text-xs">
              {projectDisplay}
            </div>
            {item.clientName && (
              <div className="text-[11px] text-slate-500 mt-0.5">
                Client: {item.clientName}
              </div>
            )}
            <div className="text-[11px] text-slate-600 mt-1 italic">
              &quot;{item.reason}&quot;
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Item / Description</TableHeaderCell>
                <TableHeaderCell align="center">Qty Returned</TableHeaderCell>
                <TableHeaderCell align="right">Unit Cost (AED)</TableHeaderCell>
                <TableHeaderCell align="right">Total (AED)</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {item.items && item.items.length > 0 ? (
                item.items.map((it: any, idx: number) => (
                  <TableRow key={it.id || idx}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">
                        {it.description || "Returned item"}
                      </div>
                    </TableCell>
                    <TableCell align="center" className="font-mono font-bold">
                      {it.quantity}
                    </TableCell>
                    <TableCell align="right" className="font-mono">
                      {Number(it.unitCost || 0).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" className="font-mono font-bold">
                      {Number(it.totalAmount || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell>
                    <div className="font-semibold text-slate-900">
                      Material return / debit note adjustment
                    </div>
                  </TableCell>
                  <TableCell align="center" className="font-mono font-bold">
                    1
                  </TableCell>
                  <TableCell align="right" className="font-mono">
                    {subtotal.toFixed(2)}
                  </TableCell>
                  <TableCell align="right" className="font-mono font-bold">
                    {subtotal.toFixed(2)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Financial Breakdown */}
        <div className="flex justify-end pt-2">
          <div className="w-64 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal (Excl. VAT):</span>
              <span className="font-mono font-semibold">{formatAed(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Input VAT (5%):</span>
              <span className="font-mono font-semibold">{formatAed(vat)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1.5 text-sm">
              <span>Total Debit Note:</span>
              <span className="font-mono text-rose-700">{formatAed(total)}</span>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="md" onClick={onClose}>
            Close
          </Button>

          {item.supplierBill?.id && (
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                onClose();
                router.push(`/commercial/supplier-bills/${item.supplierBill.id}`);
              }}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 font-bold cursor-pointer inline-flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              View Linked Bill ({item.supplierBill.billNumber || item.poReference})
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            icon={<PrintIcon className="w-4 h-4" strokeWidth={2} />}
            onClick={() => onPrint(item)}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
          >
            Print Debit Note (PDF)
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PurchaseReturnDetailModal;
