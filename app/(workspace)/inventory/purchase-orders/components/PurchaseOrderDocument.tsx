"use client";

import React from "react";
import { PurchaseOrder } from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";

export interface PurchaseOrderDocumentProps {
  po: PurchaseOrder;
}

export const PurchaseOrderDocument: React.FC<PurchaseOrderDocumentProps> = ({
  po,
}) => {
  const calculatedSubtotal = (po.items || []).reduce(
    (acc: number, it) =>
      acc + Number(it.quantityOrdered || 0) * Number(it.unitCost || 0),
    0,
  );
  const vatAmount = calculatedSubtotal * 0.05;
  const grandTotal = calculatedSubtotal + vatAmount;
  const formattedOrderDate = po.orderDate
    ? new Date(po.orderDate).toLocaleDateString("en-GB")
    : "-";
  const formattedExpectedDate = po.expectedDate
    ? new Date(po.expectedDate).toLocaleDateString("en-GB")
    : "-";

  return (
    <div
      id="printable-purchase-order"
      className="mx-auto bg-white max-w-4xl min-w-[700px] md:min-w-0 rounded-xl print:rounded-none overflow-visible print:overflow-visible print:w-full print:shadow-none font-sans"
    >
      <table className="print-page-table w-full border-collapse">
        <thead className="print-page-header-group">
          <tr>
            <th className="p-0 font-normal text-left border-none">
              <QuotationHeader />
            </th>
          </tr>
        </thead>

        <tfoot className="print-page-footer-group">
          <tr>
            <td className="p-0 border-none align-bottom">
              <div
                className="w-full opacity-0 pointer-events-none select-none"
                style={{ minHeight: "175px" }}
                aria-hidden="true"
              >
                <QuotationFooter />
                <div style={{ height: "45px", minHeight: "45px" }} />
              </div>
            </td>
          </tr>
        </tfoot>

        <tbody className="print-page-body-group">
          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 py-3.5 print:px-8 print:py-2.5 w-full border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between gap-8">
                  <div>
                    <h1 className="text-2xl print:text-2xl font-black text-slate-900 tracking-tight">
                      PURCHASE ORDER
                    </h1>
                    <p className="text-[11px] print:text-[11px] font-semibold text-emerald-700 mt-0.5 print:mt-0">
                      Official Commercial Procurement &amp; Supply Requisition
                      (UAE Standard 5% VAT)
                    </p>
                  </div>

                  <div className="w-[320px] print:w-[320px] space-y-1 text-[12px] print:text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        PO Number:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {po.poNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Order Date:
                      </span>
                      <span className="font-bold text-slate-900">
                        {formattedOrderDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Expected Delivery:
                      </span>
                      <span className="font-bold text-slate-900">
                        {formattedExpectedDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Status:
                      </span>
                      <span className="font-bold text-emerald-800">
                        {po.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-0 border-none align-top">
              <div className="grid grid-cols-2 gap-4 print:gap-3 px-10 py-3.5 print:px-8 print:py-2 text-[12px] print:text-[12px] print-avoid-break">
                <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2.5 rounded-xl shadow-2xs">
                  <div className="font-bold mb-2 print:mb-1.5 text-slate-900 uppercase text-[11px] print:text-[11px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                    SUPPLIER / VENDOR DETAILS
                  </div>
                  <div className="space-y-1.5 print:space-y-1">
                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Vendor Name:
                      </span>
                      <span className="font-bold text-slate-900">
                        {po.supplier?.name ||
                          po.shopName ||
                          "External Supplier"}
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        UAE VAT TRN:
                      </span>
                      <span className="font-mono text-slate-800 font-bold">
                        {po.supplier?.trn || "N/A"}
                      </span>
                    </div>

                    {po.shopName && (
                      <div className="flex items-start gap-1">
                        <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                          Shop / Branch:
                        </span>
                        <span className="text-slate-800 font-medium">
                          {po.shopName}
                        </span>
                      </div>
                    )}

                    {po.vendorReference && (
                      <div className="flex items-start gap-1">
                        <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                          Vendor Ref:
                        </span>
                        <span className="font-mono text-slate-800 font-bold">
                          {po.vendorReference}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2.5 rounded-xl shadow-2xs">
                  <div className="font-bold mb-2 print:mb-1.5 text-slate-900 uppercase text-[11px] print:text-[11px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                    LOGISTICS &amp; SPECIFICATIONS
                  </div>
                  <div className="space-y-1.5 print:space-y-1">
                    <div className="flex items-start gap-1">
                      <span className="w-28 print:w-28 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Delivery Destination:
                      </span>
                      <span className="font-bold text-slate-900">
                        Central Warehouse / Site Direct
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-28 print:w-28 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Raised By:
                      </span>
                      <span className="text-slate-800 font-semibold">
                        {po.creator?.fullName || "Procurement Officer"}
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-28 print:w-28 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Currency:
                      </span>
                      <span className="font-bold text-emerald-800">
                        AED - United Arab Emirates Dirham
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 py-2 print:px-8 print:py-1">
                <table className="w-full text-[11px] print:text-[11px] border border-slate-200 print:border-slate-300">
                  <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 text-left w-8">#</th>
                      <th className="py-2 px-3 text-left">
                        Item Description / SKU
                      </th>
                      <th className="py-2 px-3 text-left">Supplier SKU</th>
                      <th className="py-2 px-3 text-center w-16">Unit</th>
                      <th className="py-2 px-3 text-right w-20">Qty</th>
                      <th className="py-2 px-3 text-right w-24">Unit Rate</th>
                      <th className="py-2 px-3 text-right w-28">
                        Amount (AED)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {po.items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="py-2 px-3 text-slate-500 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">
                            {it.product?.name || "Material Item"}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            SKU: {it.product?.sku || "-"}
                          </div>
                          {it.itemNotes && (
                            <div className="text-[10px] text-slate-400 italic">
                              {it.itemNotes}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600 text-[10.5px]">
                          {it.supplierSku || it.product?.supplierSku || "-"}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-600">
                          {it.product?.unit || "PCS"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {Number(it.quantityOrdered).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">
                          {Number(it.unitCost).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {Number(it.totalCost).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 py-3 print:px-8 print:py-2 print-avoid-break">
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1 text-[11px] text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                      Terms &amp; Delivery Instructions:
                    </div>
                    {po.notes ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                        {po.notes}
                      </p>
                    ) : (
                      <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
                        <li>
                          All goods must match specified SKU codes and quality
                          standards.
                        </li>
                        <li>
                          Original Tax Invoice referencing this Purchase Order
                          must accompany shipment.
                        </li>
                        <li>
                          Damaged or non-compliant materials will be rejected at
                          supplier cost.
                        </li>
                      </ol>
                    )}
                  </div>

                  <div className="w-72 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <div className="flex justify-between px-3.5 py-2 border-b border-slate-200">
                      <span className="text-slate-600 font-semibold">
                        Subtotal
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        AED {calculatedSubtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between px-3.5 py-2 border-b border-slate-200">
                      <span className="text-slate-600 font-semibold">
                        UAE VAT (5%)
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        AED {vatAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between px-3.5 py-2.5 bg-emerald-900 text-white font-bold text-sm">
                      <span>Grand Total (AED)</span>
                      <span className="font-mono">
                        AED {grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="print-footer-bottom fixed-print-footer hidden print:block">
        <QuotationFooter />
      </div>

      <div className="px-10 pb-6 print:hidden">
        <QuotationFooter className="mt-6" />
      </div>
    </div>
  );
};

export default PurchaseOrderDocument;
