import React, { ChangeEvent } from "react";
import { QuotationMeta } from "./constants";

export interface QuotationDocTitleBarProps {
  docType: "QUOTATION" | "TAX_INVOICE";
  meta: QuotationMeta;
  onUpdateMeta: (key: keyof QuotationMeta, val: string) => void;
}

export const QuotationDocTitleBar: React.FC<QuotationDocTitleBarProps> = ({
  docType,
  meta,
  onUpdateMeta,
}) => {
  const inputClass =
    "w-36 print:w-40 bg-transparent outline-none focus:bg-emerald-50/70 rounded px-1.5 py-0.5 text-right font-bold text-slate-900 border-b border-dashed border-slate-300 focus:border-emerald-600 transition-colors print:bg-transparent print:p-0 print:border-none print:text-[13px] print:text-slate-900";

  return (
    <div className="px-10 py-3.5 print:px-0 print:py-2.5 w-full border-b border-slate-100 bg-slate-50/50">
      <div className="flex items-center justify-between gap-8">
        <div>
          <h1 className="text-2xl print:text-2xl font-black text-slate-900 tracking-tight">
            {docType === "TAX_INVOICE" ? "TAX INVOICE" : "QUOTATION"}
          </h1>
          {docType === "TAX_INVOICE" && (
            <p className="text-[11px] print:text-[11px] font-semibold text-emerald-700 mt-0.5 print:mt-0">
              Official UAE FTA Tax Invoice (Standard Rated 5% VAT)
            </p>
          )}
          {(meta.project || meta.customer) && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-700 print:text-[12px] print:text-slate-800 font-semibold">
              {meta.project && (
                <span className="font-bold text-slate-900">{meta.project}</span>
              )}
              {meta.project && meta.customer && (
                <span className="text-slate-400">•</span>
              )}
              {meta.customer && (
                <span className="text-slate-600 print:text-slate-700">
                  {meta.customer}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="w-[340px] print:w-[360px] space-y-1 print:space-y-1 text-[12px] print:text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 print:text-slate-600 font-semibold whitespace-nowrap print:text-[12.5px]">
              {docType === "TAX_INVOICE" ? "Invoice No:" : "Quotation No:"}
            </span>
            <input
              className={inputClass + " font-mono"}
              value={meta.quotationNo}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onUpdateMeta("quotationNo", e.target.value)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 print:text-slate-600 font-semibold whitespace-nowrap print:text-[12.5px]">
              {docType === "TAX_INVOICE" ? "Invoice Date:" : "Date:"}
            </span>
            <input
              className={inputClass}
              value={meta.date}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onUpdateMeta("date", e.target.value)
              }
            />
          </div>

          {docType === "QUOTATION" && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 print:text-slate-600 font-semibold whitespace-nowrap print:text-[12.5px]">
                Valid Until:
              </span>
              <input
                className={inputClass}
                value={meta.validUntil}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onUpdateMeta("validUntil", e.target.value)
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotationDocTitleBar;
