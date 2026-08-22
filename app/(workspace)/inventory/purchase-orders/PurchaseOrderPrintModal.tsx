"use client";

import React from "react";
import { PrintIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { numberToWords } from "@/components/quotation/constants";
import { PurchaseOrder } from "@/lib/hooks/api-hooks";

interface PurchaseOrderPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  po: PurchaseOrder | null;
}

export const PurchaseOrderPrintModal: React.FC<
  PurchaseOrderPrintModalProps
> = ({ isOpen, onClose, po }) => {
  if (!isOpen || !po) return null;

  const totalAmount = Number(po.totalAmount || 0);
  const calculatedSubtotal = po.items.reduce(
    (acc, it) =>
      acc + Number(it.quantityOrdered || 0) * Number(it.unitCost || 0),
    0,
  );
  const vatAmount = calculatedSubtotal * 0.05;
  const grandTotal = calculatedSubtotal + vatAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm p-2 sm:p-6 md:p-8 flex justify-center items-start">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        <div className="sticky top-0 z-30 flex items-center justify-between px-5 sm:px-7 py-3.5 bg-slate-900 text-white border-b border-slate-800 shadow-md print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
              AGM
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-white">
                Purchase Order Document - {po.poNumber}
              </h3>
              <p className="text-[10.5px] text-slate-300">
                Official UAE Procurement & Supply Requisition
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="md"
              icon={<PrintIcon className="w-4 h-4" strokeWidth={2} />}
              onClick={handlePrint}
            >
              Print / Save PDF
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              className=" text-slate-200 border-slate-700"
            >
              ✕ Close
            </Button>
          </div>
        </div>

        <div className="bg-white p-2 sm:p-4 print:p-0 overflow-visible">
          <div
            id="printable-po"
            className="mx-auto bg-white shadow-lg print:shadow-none max-w-4xl rounded-xl print:rounded-none overflow-visible flex flex-col justify-between"
          >
            <QuotationHeader />

            <div className="px-10 pt-3 pb-2 print-avoid-break">
              <div className="flex items-center justify-between border-b-2 border-emerald-800 pb-2">
                <div>
                  <span className="text-[10.5px] font-bold tracking-widest text-emerald-800 uppercase block">
                    Commercial Procurement Order
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    PURCHASE ORDER
                  </h1>
                </div>
                <div className="text-right">
                  <div className="text-sm sm:text-base font-black font-mono text-emerald-800">
                    {po.poNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Status:{" "}
                    <span className="font-bold text-slate-800">
                      {po.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 px-10 py-3 text-[11.5px] print-avoid-break">
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                <div className="font-bold text-emerald-800 text-[10.5px] tracking-wider uppercase mb-1.5">
                  Vendor / Supplier Information
                </div>
                <div className="space-y-0.5 text-slate-700">
                  <div className="text-[12.5px] font-bold text-slate-900">
                    {po.supplier?.name || "N/A"}
                  </div>
                  {po.supplier?.supplierCode && (
                    <div>
                      <span className="text-slate-400">Code:</span>{" "}
                      <span className="font-mono font-medium">
                        {po.supplier.supplierCode}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">TRN:</span>{" "}
                    <span className="font-mono font-semibold text-slate-900">
                      {po.supplier?.trn || "Unregistered / N/A"}
                    </span>
                  </div>
                  {po.supplier?.contactPerson && (
                    <div>
                      <span className="text-slate-400">Attn:</span>{" "}
                      {po.supplier.contactPerson}
                    </div>
                  )}
                  {po.supplier?.phone && (
                    <div>
                      <span className="text-slate-400">Phone:</span>{" "}
                      {po.supplier.phone}
                    </div>
                  )}
                  {po.supplier?.email && (
                    <div>
                      <span className="text-slate-400">Email:</span>{" "}
                      {po.supplier.email}
                    </div>
                  )}
                  {po.supplier?.address && (
                    <div className="line-clamp-2">
                      <span className="text-slate-400">Address:</span>{" "}
                      {po.supplier.address}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                <div className="font-bold text-emerald-800 text-[10.5px] tracking-wider uppercase mb-1.5">
                  Order & Delivery Details
                </div>
                <div className="space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order Date:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {new Date(po.orderDate).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Delivery Due:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {po.expectedDate
                        ? new Date(po.expectedDate).toLocaleDateString("en-GB")
                        : "Upon Confirmation"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Buyer:</span>
                    <span className="font-semibold text-slate-900">
                      AGM Fitout Technical Services LLC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Buyer TRN:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      104094432200003
                    </span>
                  </div>
                  {po.creator?.fullName && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Issued By:</span>
                      <span className="text-slate-800">
                        {po.creator.fullName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-10 print-avoid-break">
              <table className="w-full border-collapse border border-slate-200 text-xs">
                <thead>
                  <tr className="bg-emerald-900 text-white font-bold">
                    <th className="py-2 px-3 text-left w-10">#</th>
                    <th className="py-2 px-3 text-left">Item Description</th>
                    <th className="py-2 px-3 text-left w-28">SKU</th>
                    <th className="py-2 px-3 text-center w-16">Unit</th>
                    <th className="py-2 px-3 text-center w-20">Qty</th>
                    <th className="py-2 px-3 text-right w-28">
                      Unit Cost (AED)
                    </th>
                    <th className="py-2 px-3 text-right w-28">Total (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {po.items.map((it, idx) => {
                    const lineTotal =
                      Number(it.quantityOrdered || 0) *
                      Number(it.unitCost || 0);
                    return (
                      <tr
                        key={it.id || idx}
                        className={
                          idx % 2 === 1 ? "bg-slate-50/60" : "bg-white"
                        }
                      >
                        <td className="py-2 px-3 font-mono text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {it.product?.name || "Product Item"}
                          {it.product?.description && (
                            <div className="text-[10px] font-normal text-slate-500">
                              {it.product.description}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {it.product?.sku || "-"}
                        </td>
                        <td className="py-2 px-3 text-center font-medium text-slate-600">
                          {it.product?.unit || "PCS"}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                          {it.quantityOrdered}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-800">
                          {Number(it.unitCost || 0).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {lineTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-10 mt-3 print-avoid-break">
              <div className="flex items-stretch justify-between gap-4">
                <div className="flex-1 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[11px] flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-emerald-800 uppercase text-[10px] tracking-wider mb-0.5">
                      Amount in Words (AED)
                    </div>
                    <div className="font-semibold text-slate-800 italic">
                      AED {numberToWords(calculatedSubtotal)} Only
                    </div>
                  </div>

                  {po.notes && (
                    <div className="mt-2 pt-1.5 border-t border-slate-200">
                      <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider mb-0.5">
                        Instructions / Notes:
                      </span>
                      <span className="text-slate-600 whitespace-pre-wrap leading-tight text-[10.5px]">
                        {po.notes}
                      </span>
                    </div>
                  )}
                </div>

                <div className="w-72 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="flex justify-between px-3 py-1.5 border-b border-slate-200">
                    <span className="text-slate-600 font-medium">Subtotal</span>
                    <span className="font-mono font-bold text-slate-900">
                      AED {calculatedSubtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between px-3 py-1.5 border-b border-slate-200">
                    <span className="text-slate-600 font-medium">
                      UAE VAT (5%)
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      AED {vatAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between px-3 py-2 bg-emerald-900 text-white font-bold text-xs sm:text-sm">
                    <span>Net Total (Incl. VAT)</span>
                    <span className="font-mono">
                      AED {grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-10 mt-3 print-avoid-break text-[10.5px] text-slate-600 leading-normal space-y-0.5">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                Terms & Conditions:
              </div>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
                <li>
                  All goods must match specified SKU codes and quality standards
                  upon receipt.
                </li>
                <li>
                  Original Tax Invoice referencing this Purchase Order number
                  must accompany shipment.
                </li>
                <li>
                  Damaged or non-compliant materials will be rejected at
                  supplier cost.
                </li>
              </ol>
            </div>

            <div className="grid grid-cols-2 gap-6 px-10 mt-3.5 mb-2 text-[11px] print-avoid-break">
              <div className="border border-slate-200 rounded-xl p-2.5 text-center bg-white">
                <div className="font-bold text-slate-800 mb-6">
                  Prepared & Authorized By (AGM Fitout)
                </div>
                <div className="border-t border-dashed border-slate-300 pt-1 text-[10px] text-slate-400">
                  Authorized Signature & Company Stamp
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl p-2.5 text-center bg-white">
                <div className="font-bold text-slate-800 mb-6">
                  Accepted & Confirmed By (Vendor / Supplier)
                </div>
                <div className="border-t border-dashed border-slate-300 pt-1 text-[10px] text-slate-400">
                  Supplier Signature, Date & Stamp
                </div>
              </div>
            </div>

            <QuotationFooter />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderPrintModal;
