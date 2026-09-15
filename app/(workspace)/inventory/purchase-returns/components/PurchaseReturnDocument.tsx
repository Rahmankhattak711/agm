"use client";

import React from "react";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { PurchaseReturnItem, formatNumber, formatAed } from "./types";

interface PurchaseReturnDocumentProps {
  item: PurchaseReturnItem;
}

const PurchaseReturnDocument: React.FC<PurchaseReturnDocumentProps> = ({
  item,
}) => {
  const subtotal = item.totalAmount / 1.05;
  const vatAmount = item.totalAmount - subtotal;
  const formattedDate = item.returnDate
    ? new Date(item.returnDate).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");

  return (
    <div
      id="printable-purchase-return"
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
                      PURCHASE DEBIT NOTE
                    </h1>
                    <p className="text-[11px] print:text-[11px] font-semibold text-emerald-700 mt-0.5 print:mt-0">
                      Official Vendor Material Rejection &amp; Debit Voucher
                      (Standard Rated 5% VAT)
                    </p>
                  </div>

                  <div className="w-[320px] print:w-[320px] space-y-1 text-[12px] print:text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Debit Note No:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {item.returnNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Date:
                      </span>
                      <span className="font-bold text-slate-900">
                        {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        PO Reference:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {item.poReference}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Status:
                      </span>
                      <span className="font-bold text-emerald-800">
                        {item.status}
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
                    SUPPLIER / VENDOR BILLED
                  </div>
                  <div className="space-y-1.5 print:space-y-1">
                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Supplier Name:
                      </span>
                      <span className="font-bold text-slate-900">
                        {item.supplierName}
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        UAE VAT TRN:
                      </span>
                      <span className="font-mono text-slate-800 font-bold">
                        {item.supplierTrn || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Purchase Order:
                      </span>
                      <span className="font-mono text-slate-800 font-bold">
                        #{item.poReference}
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Warehouse:
                      </span>
                      <span className="text-slate-700">
                        AGM Central Receiving Bay, Dubai
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2.5 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="font-bold mb-2 print:mb-1.5 text-slate-900 uppercase text-[11px] print:text-[11px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                      FINANCIAL DEBIT RECAP
                    </div>
                    <div className="space-y-1.5 print:space-y-1 text-[11.5px] print:text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          Debit Scope (Excl. VAT):
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          AED {formatNumber(subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          Input VAT Reversal (5%):
                        </span>
                        <span className="font-mono font-bold text-purple-700">
                          AED {formatNumber(vatAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between bg-white print:bg-transparent p-2 rounded-lg border">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                      Total Debit Adjustment:
                    </span>
                    <span className="font-mono text-base font-black text-rose-700">
                      {formatAed(item.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 py-2 print:px-8 print:py-1">
                <table className="w-full border-collapse text-[11.5px] print:text-[10.5px]">
                  <thead>
                    <tr className="bg-agm-green border border-agm-box-border text-white">
                      <th className="py-2.5 px-2.5 font-bold w-12 border border-agm-box-border text-white text-center align-middle">
                        S.No
                      </th>
                      <th className="py-2.5 px-3 font-bold border border-agm-box-border text-white text-left align-middle">
                        DESCRIPTION OF REJECTED MATERIALS / REASON
                      </th>
                      <th className="py-2.5 px-2 font-bold w-20 border border-agm-box-border text-white text-center align-middle">
                        QTY
                      </th>
                      <th className="py-2.5 px-3 font-bold w-28 border border-agm-box-border text-white text-right align-middle">
                        RATE (AED)
                      </th>
                      <th className="py-2.5 px-3 font-bold w-32 border border-agm-box-border text-white text-right align-middle">
                        TOTAL (AED)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-agm-box-border">
                    <tr className="hover:bg-slate-50/50 bg-white print-avoid-break">
                      <td className="py-2 px-2.5 align-middle text-center font-bold text-slate-700 border border-agm-box-border">
                        1
                      </td>
                      <td className="py-2 px-3 align-middle text-left font-medium text-slate-800 border border-agm-box-border">
                        <div className="font-bold text-slate-900 leading-snug">
                          {item.reason}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Debit Note against PO #{item.poReference} • Supplier:{" "}
                          {item.supplierName}
                        </div>
                      </td>
                      <td className="py-2 px-2 align-middle text-center font-mono font-bold text-slate-800 border border-agm-box-border">
                        {item.itemsCount || 1}
                      </td>
                      <td className="py-2 px-3 align-middle text-right font-mono font-semibold text-slate-800 border border-agm-box-border">
                        {formatNumber(subtotal)}
                      </td>
                      <td className="py-2 px-3 align-middle text-right font-mono font-bold text-slate-900 border border-agm-box-border">
                        {formatNumber(subtotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 print:px-8">
                <div className="flex items-stretch justify-between gap-4 mt-3.5 print:mt-2 print-avoid-break">
                  <div className="flex-1 border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2 rounded-xl text-[11px] print:text-[10px] flex flex-col justify-center shadow-2xs">
                    <div className="font-bold mb-1 text-slate-900 uppercase text-[10.5px] print:text-[10px] tracking-wider text-agm-green flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                      GENERAL LEDGER &amp; TAX ADJUSTMENT MEMO
                    </div>
                    <div className="space-y-1 text-slate-600 font-medium leading-relaxed">
                      <div>
                        This Debit Note certifies a deduction in Accounts
                        Payable due to vendor{" "}
                        <strong>{item.supplierName}</strong>.
                      </div>
                      <div className="text-[10.5px] text-slate-600 font-mono">
                        Double-Entry Impact: Dr. Accounts Payable (2000) • Cr.
                        Purchase Returns / Cost (5000) • Cr. Input VAT (2220)
                      </div>
                    </div>
                  </div>

                  <div className="w-80 border border-slate-200 print:border-slate-300 bg-white rounded-xl overflow-hidden shadow-2xs text-[12px] print:text-[11px]">
                    <div className="divide-y divide-slate-100 print:divide-slate-200">
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/40">
                        <span className="font-semibold text-slate-600">
                          Debit Subtotal (Excl. VAT):
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          AED {formatNumber(subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/40">
                        <span className="font-semibold text-slate-600">
                          VAT Adjustment (5%):
                        </span>
                        <span className="font-mono font-bold text-purple-700">
                          AED {formatNumber(vatAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5 bg-agm-green text-white">
                        <span className="font-bold text-xs uppercase tracking-wider">
                          Net Debit Total:
                        </span>
                        <span className="font-mono font-black text-sm">
                          {formatAed(item.totalAmount)}
                        </span>
                      </div>
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

export default PurchaseReturnDocument;
