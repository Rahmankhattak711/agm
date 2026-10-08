"use client";

import React from "react";
import { SalesInvoice } from "@/lib/hooks/api-hooks";
import {
  QuotationHeader,
  QuotationFooter,
  SalesInvoiceTerms,
} from "@/components/quotation";
import { formatNumber, parseDescriptionPoints } from "./types";

export interface PrintableTaxInvoiceProps {
  invoice: SalesInvoice | null;
}

export const PrintableTaxInvoice: React.FC<PrintableTaxInvoiceProps> = ({
  invoice,
}) => {
  if (!invoice) return null;

  const itemsSum =
    invoice.items?.reduce(
      (sum: number, item: any) => sum + Number(item.totalAmount || 0),
      0,
    ) || Number(invoice.subtotal || 0);
  const discount = Number(invoice.discount || 0);
  const calculatedSubtotal = Math.max(0, itemsSum - discount);
  const dbVatRate =
    invoice.vatRate !== undefined && invoice.vatRate !== null
      ? Number(invoice.vatRate)
      : 0;
  const dbVatAmount = Number(invoice.vatAmount || 0);
  const dbTotalAmount = Number(invoice.totalAmount || 0);

  const calculatedVat =
    dbVatAmount > 0
      ? dbVatAmount
      : dbVatRate > 0 && dbTotalAmount > calculatedSubtotal
        ? Math.round(((calculatedSubtotal * dbVatRate) / 100) * 100) / 100
        : 0;
  const calculatedTotal =
    dbTotalAmount > 0
      ? dbTotalAmount
      : Math.round((calculatedSubtotal + calculatedVat) * 100) / 100;

  let paymentList: string[] = [];
  if (invoice.terms) {
    try {
      const parsed = JSON.parse(invoice.terms);
      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.paymentPlans))
          paymentList = parsed.paymentPlans;
        else if (Array.isArray(parsed.paymentTerms))
          paymentList = parsed.paymentTerms;
      }
    } catch {}
  }

  let totalMilestonePct = 0;
  let totalMilestoneAmount = 0;

  if (paymentList.length > 0) {
    paymentList.forEach((plan) => {
      const match = plan.match(/(\d+(?:\.\d+)?)\s*%/);
      const pct = match ? parseFloat(match[1]) : 0;
      totalMilestonePct += pct;
      totalMilestoneAmount +=
        Math.round(((calculatedTotal * pct) / 100) * 100) / 100;
    });
  } else {
    totalMilestonePct = 100;
  }

  const isPartialMilestone =
    Math.abs(totalMilestonePct - 100) > 0.1 && totalMilestoneAmount > 0;
  const displaySubtotal = isPartialMilestone
    ? totalMilestoneAmount
    : calculatedSubtotal;
  const displayVatAmount =
    dbVatRate > 0
      ? Math.round(((displaySubtotal * dbVatRate) / 100) * 100) / 100
      : isPartialMilestone && dbVatAmount > 0 && calculatedSubtotal > 0
        ? Math.round(
            displaySubtotal * (dbVatAmount / calculatedSubtotal) * 100,
          ) / 100
        : calculatedVat;
  const displayTotalAmount = isPartialMilestone
    ? displaySubtotal + displayVatAmount
    : calculatedTotal;
  const displayRemainingBalance = Math.max(
    0,
    displayTotalAmount - Number(invoice.paidAmount || 0),
  );

  return (
    <div
      id="printable-voucher"
      className="hidden print:block mx-auto bg-white max-w-4xl overflow-visible"
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
              <div className="px-10 py-3.5 print:px-8 print:py-1 w-full border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between gap-8">
                  <div>
                    <h1 className="text-2xl print:text-lg font-black text-slate-900 tracking-tight">
                      TAX INVOICE
                    </h1>
                    <p className="text-[11px] print:text-[9.5px] font-semibold text-emerald-700 mt-0.5 print:mt-0">
                      Official UAE FTA Tax Invoice (Standard Rated 5% VAT)
                    </p>
                  </div>

                  <div className="w-[340px] space-y-1 text-[12px] print:text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Invoice No:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {invoice.invoiceNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Invoice Date:
                      </span>
                      <span className="font-bold text-slate-900">
                        {invoice.invoiceDate
                          ? new Date(invoice.invoiceDate).toLocaleDateString(
                              "en-GB",
                            )
                          : "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Payment Due:
                      </span>
                      <span className="font-bold text-slate-900">
                        {invoice.dueDate
                          ? new Date(invoice.dueDate).toLocaleDateString(
                              "en-GB",
                            )
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-0 border-none align-top">
              <div className="grid grid-cols-2 gap-4 print:gap-2 px-10 py-3.5 print:px-8 print:py-1 text-[12px] print:text-[9.5px] print-avoid-break">
                <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-1.5 rounded-xl shadow-2xs">
                  <div className="font-bold mb-2 print:mb-0.5 text-slate-900 uppercase text-[11px] print:text-[9px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                    CLIENT / BILL TO
                  </div>
                  <div className="space-y-1 print:space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="w-24 print:w-20 text-[11px] print:text-[9px] font-semibold text-slate-500 shrink-0">
                        Client Name:
                      </span>
                      <span className="font-bold text-slate-900">
                        {invoice.customerName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="w-24 print:w-20 text-[11px] print:text-[9px] font-semibold text-slate-500 shrink-0">
                        Customer TRN:
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {invoice.customerTrn || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="w-24 print:w-20 text-[11px] print:text-[9px] font-semibold text-slate-500 shrink-0">
                        Address:
                      </span>
                      <span className="text-slate-700">
                        Dubai, United Arab Emirates
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-1.5 rounded-xl shadow-2xs">
                  <div className="font-bold mb-2 print:mb-0.5 text-slate-900 uppercase text-[11px] print:text-[9px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                    PROJECT / SITE DETAILS
                  </div>
                  <div className="space-y-1 print:space-y-0.5">
                    <div className="flex items-center gap-1">
                      <span className="w-24 print:w-20 text-[11px] print:text-[9px] font-semibold text-slate-500 shrink-0">
                        Project:
                      </span>
                      <span className="font-bold text-slate-900">
                        {invoice.projectScope || "Commercial Fitout Contract"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="w-24 print:w-20 text-[11px] print:text-[9px] font-semibold text-slate-500 shrink-0">
                        Location:
                      </span>
                      <span className="text-slate-700">
                        Dubai, United Arab Emirates
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="w-24 print:w-20 text-[11px] print:text-[9px] font-semibold text-slate-500 shrink-0">
                        Reference:
                      </span>
                      <span className="font-mono text-slate-800">
                        {invoice.quotationRef || invoice.invoiceNumber}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 mt-2 print:px-8 print:mt-1">
                <table className="w-full text-[12px] print:text-[11px] border-collapse border border-agm-box-border bg-white rounded-lg overflow-hidden shadow-xs">
                  <thead>
                    <tr className="text-center text-white bg-agm-green print-avoid-break">
                      <th className="py-2.5 px-2 print:py-1.5 print:px-1 font-bold w-12 border border-agm-box-border text-white text-center align-middle">
                        S.No
                      </th>
                      <th className="py-2.5 px-3 print:py-1.5 print:px-2 font-bold border border-agm-box-border text-white text-left align-middle">
                        DESCRIPTION OF WORK / SERVICES
                      </th>
                      <th className="py-2.5 px-2 print:py-1.5 print:px-1 font-bold w-20 border border-agm-box-border text-white text-center align-middle">
                        QTY / SQM
                      </th>
                      <th className="py-2.5 px-3 print:py-1.5 print:px-2 font-bold w-28 border border-agm-box-border text-white text-right align-middle">
                        RATE (AED)
                      </th>
                      <th className="py-2.5 px-3 print:py-1.5 print:px-2 font-bold w-32 border border-agm-box-border text-white text-right align-middle">
                        TOTAL (AED)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-agm-box-border">
                    {invoice.items && invoice.items.length > 0 ? (
                      invoice.items.map((it: any, idx: number) => (
                        <tr
                          key={it.id || idx}
                          className="hover:bg-slate-50/50 bg-white print-avoid-break"
                        >
                          <td className="py-2.5 px-2 print:py-1 print:px-1 align-middle text-center font-bold text-slate-700 border border-agm-box-border">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 print:py-1.5 print:px-2 align-middle text-left font-medium text-slate-800 border border-agm-box-border">
                            {(() => {
                              const points = parseDescriptionPoints(
                                it.description,
                              );
                              if (points.length <= 1) {
                                return (
                                  <div className="leading-snug print:leading-snug text-slate-800 whitespace-pre-line text-left">
                                    {it.description}
                                  </div>
                                );
                              }
                              return (
                                <div className="space-y-1.5 print:space-y-1 text-slate-800 text-left">
                                  {points.map((pt, pIdx) => {
                                    const match = pt.match(
                                      /^(\d+[\.\)]|[•\-*])\s*(.*)$/,
                                    );
                                    if (match) {
                                      const [, bullet, text] = match;
                                      return (
                                        <div
                                          key={pIdx}
                                          className="leading-snug print:leading-snug flex items-start gap-1.5"
                                        >
                                          <span className="font-bold text-slate-900 shrink-0 select-none">
                                            {bullet}
                                          </span>
                                          <span className="text-slate-800">
                                            {text}
                                          </span>
                                        </div>
                                      );
                                    }
                                    return (
                                      <div
                                        key={pIdx}
                                        className="leading-snug print:leading-snug"
                                      >
                                        {pt}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-2.5 px-2 print:py-1 print:px-1 align-middle text-center font-mono font-bold text-slate-800 border border-agm-box-border">
                            {it.quantity}
                          </td>
                          <td className="py-2.5 px-3 print:py-1 print:px-2 align-middle text-right font-mono font-semibold text-slate-800 border border-agm-box-border">
                            {formatNumber(it.unitPrice)}
                          </td>
                          <td className="py-2.5 px-3 print:py-1 print:px-2 align-middle text-right font-mono font-bold text-slate-900 border border-agm-box-border">
                            {formatNumber(it.totalAmount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="bg-white">
                        <td
                          colSpan={5}
                          className="py-6 text-center text-slate-400 italic border border-agm-box-border"
                        >
                          No item details found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 print:px-8">
                <div className="flex items-stretch justify-between gap-4 mt-3.5 print:mt-1.5 print-avoid-break">
                  <div className="flex-1 border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-1.5 rounded-xl text-[11.5px] print:text-[9.5px] flex flex-col justify-center shadow-2xs">
                    <div className="font-bold mb-1.5 print:mb-0.5 text-slate-900 uppercase text-[11px] print:text-[9px] tracking-wider text-agm-green flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                      BANKING INFORMATION
                    </div>
                    <div className="space-y-1 print:space-y-0.5 text-slate-700 font-medium">
                      <div>
                        Company:{" "}
                        <strong className="text-slate-900">
                          A G M FITOUT TECHNICAL SERVICES LLC
                        </strong>
                      </div>
                      <div>
                        Bank:{" "}
                        <strong className="text-slate-900">
                          The National Bank of Ras Al Khaimah (RAKBANK)
                        </strong>
                      </div>
                      <div>
                        Account (AED):{" "}
                        <strong className="text-slate-900 font-mono">
                          0423141113001
                        </strong>
                      </div>
                      <div>
                        IBAN (AED):{" "}
                        <strong className="text-slate-900 font-mono">
                          AE88 0400 0004 2314 1113 001
                        </strong>
                      </div>
                      <div>
                        SWIFT Code:{" "}
                        <strong className="text-slate-900 font-mono">
                          NBARAEAD
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="w-80 border border-slate-200 print:border-slate-300 bg-white rounded-xl overflow-hidden shadow-2xs text-[12px] print:text-[10px]">
                    <div className="divide-y divide-slate-100 print:divide-slate-200">
                      <div className="flex items-center justify-between px-4 py-2.5 print:py-1 bg-slate-50/40">
                        <span className="font-semibold text-slate-600">
                          Subtotal (Excl. VAT)
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-[12.5px] print:text-[10.5px]">
                          AED {formatNumber(displaySubtotal)}
                        </span>
                      </div>

                      {displayVatAmount > 0 && (
                        <div className="flex items-center justify-between px-4 py-2 print:py-1">
                          <span className="font-semibold text-slate-600">
                            Output VAT ({Number(invoice.vatRate || 0)}%)
                          </span>
                          <span className="font-mono font-semibold text-emerald-800">
                            AED {formatNumber(displayVatAmount)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between px-4 py-2.5 print:py-1.5 bg-agm-green text-white">
                        <span className="font-black tracking-wide text-white text-[12px] print:text-[10.5px] uppercase">
                          TOTAL AMOUNT
                        </span>
                        <span className="font-mono font-black text-white text-[14px] print:text-[11.5px]">
                          AED {formatNumber(displayTotalAmount)}
                        </span>
                      </div>

                      {Number(invoice.paidAmount || 0) > 0 && (
                        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-50 text-slate-700 font-semibold">
                          <span>Paid / Settled</span>
                          <span className="font-mono text-emerald-700">
                            AED {formatNumber(invoice.paidAmount)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-50 text-slate-900 font-bold">
                        <span>Balance Due</span>
                        <span
                          className={`font-mono ${
                            displayRemainingBalance > 0
                              ? "text-rose-700"
                              : "text-emerald-700"
                          }`}
                        >
                          AED {formatNumber(displayRemainingBalance)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          {invoice.notes && (
            <tr>
              <td className="p-0 border-none align-top">
                <div className="px-10 mt-3.5 print:px-8 print:mt-1.5 print-avoid-break">
                  <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-1.5 rounded-xl text-[11.5px] print:text-[9.5px]">
                    <div className="font-bold mb-1 text-slate-900 uppercase text-[11px] print:text-[9px] tracking-wider text-agm-green flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                      NOTES &amp; SPECIAL REMARKS
                    </div>
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                      {invoice.notes}
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          )}

          <tr>
            <td className="p-0 border-none align-top">
              <SalesInvoiceTerms
                className="px-10 mt-3.5 print:px-8 print:mt-1.5"
                customTerms={invoice.terms}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div className="print-footer-bottom fixed-print-footer hidden print:block">
        <QuotationFooter />
      </div>
    </div>
  );
};

export default PrintableTaxInvoice;
