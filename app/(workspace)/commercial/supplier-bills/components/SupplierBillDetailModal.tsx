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
import { SupplierBill } from "@/lib/hooks/api-hooks";
import { formatNumber } from "@/lib/utils/format";

export interface SupplierBillDetailModalProps {
  bill: SupplierBill | null;
  onClose: () => void;
  onPrint: (bill: SupplierBill) => void;
}

export const SupplierBillDetailModal: React.FC<
  SupplierBillDetailModalProps
> = ({ bill, onClose, onPrint }) => {
  return (
    <Modal
      isOpen={!!bill}
      onClose={onClose}
      title={bill ? `Supplier Bill — ${bill.billNumber}` : ""}
      maxWidth="lg"
    >
      {bill && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Vendor
              </p>
              <p className="font-bold text-slate-900 text-sm">
                {bill.supplierName}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                TRN: {bill.supplierTrn || "N/A"}
              </p>
            </div>
            <div className="text-right font-mono">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Status
              </p>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 uppercase">
                {bill.status}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Due:{" "}
                {bill.dueDate
                  ? new Date(bill.dueDate).toLocaleDateString("en-GB")
                  : "-"}
              </p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <Table className="w-full text-xs">
              <TableHead className="bg-slate-100">
                <TableRow>
                  <TableHeaderCell className="py-2 px-3">
                    Description
                  </TableHeaderCell>
                  <TableHeaderCell className="py-2 px-3 text-center">
                    Qty
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-2 px-3 text-right"
                  >
                    Cost
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-2 px-3 text-right"
                  >
                    Total
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y divide-slate-100">
                {!bill.items || bill.items.length === 0 ? (
                  <TableRow>
                    <TableCell className="py-2 px-3">
                      Direct procurement
                    </TableCell>
                    <TableCell className="py-2 px-3 text-center font-mono">
                      1
                    </TableCell>
                    <TableCell
                      align="right"
                      className="py-2 px-3 text-right font-mono"
                    >
                      {formatNumber(bill.totalAmount)}
                    </TableCell>
                    <TableCell
                      align="right"
                      className="py-2 px-3 text-right font-mono font-bold"
                    >
                      {formatNumber(bill.totalAmount)}
                    </TableCell>
                  </TableRow>
                ) : (
                  bill.items.map((it: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="py-2 px-3">
                        {it.description || "Supply line"}
                      </TableCell>
                      <TableCell className="py-2 px-3 text-center font-mono">
                        {it.quantity}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-2 px-3 text-right font-mono"
                      >
                        {formatNumber(it.unitCost)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-2 px-3 text-right font-mono font-bold"
                      >
                        {formatNumber(it.quantity * it.unitCost)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl font-mono text-xs">
            <span className="font-bold text-slate-700">Balance Due:</span>
            <span
              className={`font-black text-sm ${
                Number(bill.remainingBalance) > 0
                  ? "text-rose-700"
                  : "text-emerald-700"
              }`}
            >
              AED {formatNumber(bill.remainingBalance)}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPrint(bill)}
              icon={<PrintIcon size={13} className="text-emerald-700" />}
              className="cursor-pointer"
            >
              Print Voucher (PDF)
            </Button>
            <Button
              variant="dark"
              size="sm"
              onClick={onClose}
              className="cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SupplierBillDetailModal;
