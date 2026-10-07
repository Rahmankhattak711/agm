"use client";

import React from "react";
import { SupplierBill } from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";

export interface SupplierBillDocumentProps {
  bill: SupplierBill;
}

export const SupplierBillDocument: React.FC<SupplierBillDocumentProps> = ({
  bill,
}) => {
  const formattedBillDate = bill.billDate
    ? new Date(bill.billDate).toLocaleDateString("en-GB")
    : "-";
  const formattedDueDate = bill.dueDate
    ? new Date(bill.dueDate).toLocaleDateString("en-GB")
    : "-";

  const subtotal = Number(bill.subtotal || bill.totalAmount / 1.05 || 0);
  const vatAmount = Number(bill.vatAmount || bill.totalAmount - subtotal || 0);
  const totalAmount = Number(bill.totalAmount || 0);
  const paidAmount = Number(bill.paidAmount || 0);
  const remainingBalance = Number(bill.remainingBalance || 0);

  const formatNum = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div
      id="printable-bill"
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
                      SUPPLIER BILL / AP VOUCHER
                    </h1>
                    <p className="text-[11px] print:text-[11px] font-semibold text-emerald-700 mt-0.5 print:mt-0">
                      Official Accounts Payable &amp; Tax Requisition Voucher
                      (UAE FTA 5% VAT)
                    </p>
                  </div>

                  <div className="w-[320px] print:w-[320px] space-y-1 text-[12px] print:text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Bill Voucher No:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {bill.billNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Bill Date:
                      </span>
                      <span className="font-bold text-slate-900">
                        {formattedBillDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Due Date:
                      </span>
                      <span className="font-bold text-slate-900">
                        {formattedDueDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Status:
                      </span>
                      <span className="font-bold text-emerald-800">
                        {bill.status}
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
                        {bill.supplierName}
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        UAE VAT TRN:
                      </span>
                      <span className="font-mono text-slate-800 font-bold">
                        {bill.supplierTrn || "N/A"}
                      </span>
                    </div>

                    {bill.purchaseOrderId && (
                      <div className="flex items-start gap-1">
                        <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                          Linked PO:
                        </span>
                        <span className="font-mono text-slate-700">
                          {bill.purchaseOrderId}
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Terms:
                      </span>
                      <span className="text-slate-700">
                        Standard Supplier 30-Day Credit
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2.5 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="font-bold mb-2 print:mb-1.5 text-slate-900 uppercase text-[11px] print:text-[11px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                      PAYABLE FINANCIAL SUMMARY
                    </div>
                    <div className="space-y-1.5 print:space-y-1 text-[11.5px] print:text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          Bill Subtotal (Excl. VAT):
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          AED {formatNum(subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          Recoverable VAT (5%):
                        </span>
                        <span className="font-mono font-bold text-purple-700">
                          AED {formatNum(vatAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          Amount Settled / Paid:
                        </span>
                        <span className="font-mono font-bold text-emerald-700">
                          AED {formatNum(paidAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between bg-white print:bg-transparent p-2 rounded-lg border">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                      Balance Due (Payable):
                    </span>
                    <span
                      className={`font-mono text-base font-black ${
                        remainingBalance > 0
                          ? "text-rose-700"
                          : "text-emerald-700"
                      }`}
                    >
                      AED {formatNum(remainingBalance)}
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
                        DESCRIPTION OF MATERIALS / SERVICES
                      </th>
                      <th className="py-2.5 px-2 font-bold w-20 border border-agm-box-border text-white text-center align-middle">
                        QTY
                      </th>
                      <th className="py-2.5 px-3 font-bold w-28 border border-agm-box-border text-white text-right align-middle">
                        UNIT COST (AED)
                      </th>
                      <th className="py-2.5 px-3 font-bold w-32 border border-agm-box-border text-white text-right align-middle">
                        TOTAL (AED)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-agm-box-border">
                    {!bill.items || bill.items.length === 0 ? (
                      <tr className="hover:bg-slate-50/50 bg-white print-avoid-break">
                        <td className="py-2 px-2.5 align-middle text-center font-bold text-slate-700 border border-agm-box-border">
                          1
                        </td>
                        <td className="py-2 px-3 align-middle text-left font-medium text-slate-800 border border-agm-box-border">
                          Direct Procurement Materials / Site Supply
                        </td>
                        <td className="py-2 px-2 align-middle text-center font-mono font-bold text-slate-800 border border-agm-box-border">
                          1
                        </td>
                        <td className="py-2 px-3 align-middle text-right font-mono font-semibold text-slate-800 border border-agm-box-border">
                          {formatNum(subtotal)}
                        </td>
                        <td className="py-2 px-3 align-middle text-right font-mono font-bold text-slate-900 border border-agm-box-border">
                          {formatNum(subtotal)}
                        </td>
                      </tr>
                    ) : (
                      bill.items.map((it: any, idx: number) => {
                        const itCost = Number(it.unitCost || 0);
                        const itQty = Number(it.quantity || 1);
                        const itTotal = itCost * itQty;
                        return (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/50 bg-white print-avoid-break"
                          >
                            <td className="py-2 px-2.5 align-middle text-center font-bold text-slate-700 border border-agm-box-border">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 align-middle text-left font-medium text-slate-800 border border-agm-box-border">
                              {it.description ||
                                it.product?.name ||
                                "Direct site supplies"}
                            </td>
                            <td className="py-2 px-2 align-middle text-center font-mono font-bold text-slate-800 border border-agm-box-border">
                              {itQty} {it.unit || "PCS"}
                            </td>
                            <td className="py-2 px-3 align-middle text-right font-mono font-semibold text-slate-800 border border-agm-box-border">
                              {formatNum(itCost)}
                            </td>
                            <td className="py-2 px-3 align-middle text-right font-mono font-bold text-slate-900 border border-agm-box-border">
                              {formatNum(itTotal)}
                            </td>
                          </tr>
                        );
                      })
                    )}
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
                      GENERAL LEDGER &amp; TAX ADJUSTMENT RECORD
                    </div>
                    <div className="space-y-1 text-slate-600 font-medium leading-relaxed">
                      <div>
                        Certified voucher for vendor invoice payable to{" "}
                        <strong>{bill.supplierName}</strong>.
                      </div>
                      <div className="text-[10.5px] text-slate-600 font-mono">
                        Double-Entry Impact: Dr. Direct Cost / Inventory (5000)
                        • Dr. Input VAT (2220) • Cr. Accounts Payable (2000)
                      </div>
                    </div>
                  </div>

                  <div className="w-80 border border-slate-200 print:border-slate-300 bg-white rounded-xl overflow-hidden shadow-2xs text-[12px] print:text-[11px]">
                    <div className="divide-y divide-slate-100 print:divide-slate-200">
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/40">
                        <span className="font-semibold text-slate-600">
                          Subtotal (Excl. VAT):
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          AED {formatNum(subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/40">
                        <span className="font-semibold text-slate-600">
                          Recoverable VAT (5%):
                        </span>
                        <span className="font-mono font-bold text-purple-700">
                          AED {formatNum(vatAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5 bg-agm-green text-white">
                        <span className="font-bold text-xs uppercase tracking-wider">
                          Grand Total (AED):
                        </span>
                        <span className="font-mono font-black text-sm">
                          AED {formatNum(totalAmount)}
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

export default SupplierBillDocument;
