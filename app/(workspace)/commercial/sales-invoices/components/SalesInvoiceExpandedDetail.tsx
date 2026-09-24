"use client";

import React from "react";
import { Button } from "@/components/ui";
import {
  CloseIcon,
  CreditCardIcon,
  FileCheck2Icon,
  FileTextIcon,
  PrintIcon,
} from "@/components/icons";
import { SalesInvoice } from "@/lib/hooks/api-hooks";
import { formatNumber, parseDescriptionPoints } from "./types";

export interface SalesInvoiceExpandedDetailProps {
  inv: SalesInvoice;
  onPrint: (inv: SalesInvoice) => void;
  onPost: (invId: string) => void;
  onOpenPayment: (inv: SalesInvoice) => void;
  onClose: () => void;
}

export const SalesInvoiceExpandedDetail: React.FC<
  SalesInvoiceExpandedDetailProps
> = ({ inv, onPrint, onPost, onOpenPayment, onClose }) => {
  return (
    <div className="px-5 py-4 space-y-4 border-l-4 border-l-emerald-600 bg-gradient-to-b from-white to-slate-50/40 shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-800 text-white font-bold text-xs shadow-2xs">
            {inv.invoiceNumber}
          </span>
          <span className="text-xs font-bold text-slate-800">
            {inv.customerName}
          </span>
          {inv.customerTrn && (
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              TRN: {inv.customerTrn}
            </span>
          )}
          {inv.projectScope && (
            <span className="text-xs text-slate-600 hidden sm:inline">
              Project:{" "}
              <strong className="text-slate-800">{inv.projectScope}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPrint(inv);
            }}
            icon={<PrintIcon size={13} />}
            className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            Print Full Tax Invoice
          </Button>
          {inv.status === "DRAFT" && (
            <Button
              variant="dark"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPost(inv.id);
              }}
              icon={<FileCheck2Icon size={12} />}
              className="text-xs font-bold bg-agm-green text-white hover:bg-agm-green-2 cursor-pointer shadow-2xs"
            >
              Post to GL
            </Button>
          )}
          {inv.status !== "DRAFT" && inv.status !== "PAID" && (
            <Button
              variant="dark"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPayment(inv);
              }}
              icon={<CreditCardIcon size={12} />}
              className="text-xs font-bold bg-teal-800 text-white hover:bg-teal-900 cursor-pointer shadow-2xs"
            >
              Receive Payment
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
            title="Close Details"
          >
            <CloseIcon size={15} />
          </Button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
        <div className="bg-emerald-800 text-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FileTextIcon size={13} />
            <span>Description of Work / Services (Scope Breakdown)</span>
          </div>
          <span className="text-[11px] font-normal opacity-90 font-mono">
            {inv.items?.length || 0} Scope Item(s)
          </span>
        </div>

        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px]">
              <th className="py-2 px-3 text-center w-12 border-r border-slate-200">
                S.No
              </th>
              <th className="py-2 px-3 text-left border-r border-slate-200">
                Description of Work / Services
              </th>
              <th className="py-2 px-3 text-center w-24 border-r border-slate-200">
                Qty / SQM
              </th>
              <th className="py-2 px-3 text-right w-32 border-r border-slate-200">
                Rate (AED)
              </th>
              <th className="py-2 px-3 text-right w-36">Total (AED)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inv.items && inv.items.length > 0 ? (
              inv.items.map((item: any, idx: number) => {
                const points = parseDescriptionPoints(item.description);
                return (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500 border-r border-slate-200/80 align-top">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-200/80 text-left align-top font-medium">
                      {points.length <= 1 ? (
                        <div className="leading-relaxed text-slate-800 whitespace-pre-line">
                          {item.description}
                        </div>
                      ) : (
                        <div className="space-y-1.5 text-slate-800">
                          {points.map((pt, pIdx) => {
                            const match = pt.match(
                              /^(\d+[\.\)]|[•\-*])\s*(.*)$/,
                            );
                            if (match) {
                              const [, bullet, text] = match;
                              return (
                                <div
                                  key={pIdx}
                                  className="leading-relaxed flex items-start gap-1.5"
                                >
                                  <span className="font-bold text-slate-900 shrink-0 select-none">
                                    {bullet}
                                  </span>
                                  <span className="text-slate-800">{text}</span>
                                </div>
                              );
                            }
                            return (
                              <div key={pIdx} className="leading-relaxed">
                                {pt}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 border-r border-slate-200/80 align-top">
                      {item.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 border-r border-slate-200/80 align-top">
                      {formatNumber(item.unitPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 align-top">
                      {formatNumber(item.totalAmount)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 text-center text-slate-400 italic"
                >
                  No line items found for this invoice.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 pt-1">
        <div className="text-xs text-slate-600 max-w-md space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Invoice Date:</span>
            <span className="font-medium text-slate-800">
              {inv.invoiceDate
                ? new Date(inv.invoiceDate).toLocaleDateString("en-GB")
                : "—"}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-semibold">Due Date:</span>
            <span className="font-medium text-slate-800">
              {inv.dueDate
                ? new Date(inv.dueDate).toLocaleDateString("en-GB")
                : "—"}
            </span>
          </div>
          {inv.quotationRef && (
            <div>
              <span className="text-slate-500 font-semibold">
                Quotation Ref:
              </span>{" "}
              <span className="font-mono text-slate-800 font-bold">
                {inv.quotationRef}
              </span>
            </div>
          )}
          {inv.notes && (
            <div className="text-slate-700">
              <strong className="text-slate-800">Notes:</strong> {inv.notes}
            </div>
          )}
          {inv.terms && (
            <div className="text-slate-700">
              <strong className="text-slate-800">Terms:</strong> {inv.terms}
            </div>
          )}
        </div>

        <div className="w-72 bg-white rounded-xl border border-slate-200 p-3 space-y-1.5 font-mono text-xs shadow-2xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal (Excl. VAT):</span>
            <span className="font-semibold">
              {formatNumber(inv.subtotal)} AED
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>5% UAE Output VAT:</span>
            <span className="font-semibold">
              {formatNumber(inv.vatAmount)} AED
            </span>
          </div>
          <div className="flex justify-between text-slate-900 font-black border-t border-slate-100 pt-1 text-[13px]">
            <span>Total Due:</span>
            <span className="text-emerald-900">
              {formatNumber(inv.totalAmount)} AED
            </span>
          </div>
          <div className="flex justify-between text-emerald-700 font-semibold">
            <span>Paid / Settled:</span>
            <span>{formatNumber(inv.paidAmount)} AED</span>
          </div>
          <div className="flex justify-between text-rose-700 font-bold border-t border-slate-100 pt-1">
            <span>Balance Due:</span>
            <span>{formatNumber(inv.remainingBalance)} AED</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesInvoiceExpandedDetail;
