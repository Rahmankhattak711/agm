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
    "w-36 bg-transparent outline-none focus:bg-emerald-50/70 rounded px-1.5 py-0.5 text-right font-bold text-slate-900 border-b border-dashed border-slate-300 focus:border-emerald-600 transition-colors print:bg-transparent print:p-0 print:border-none";

  return (
    <div className="px-10 py-3.5 print:px-8 print:py-1.5 w-full border-b border-slate-100 bg-slate-50/50">
      <div className="flex items-center justify-between gap-8">
        <div>
          <h1 className="text-2xl print:text-xl font-black text-slate-900 tracking-tight">
            {docType === "TAX_INVOICE" ? "TAX INVOICE" : "QUOTATION"}
          </h1>
          {docType === "TAX_INVOICE" && (
            <p className="text-[11px] print:text-[10px] font-semibold text-emerald-700 mt-0.5">
              Official UAE FTA Tax Invoice (Standard Rated 5% VAT)
            </p>
          )}
        </div>

        <div className="w-[340px] space-y-1 text-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold whitespace-nowrap">
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
            <span className="text-slate-500 font-semibold whitespace-nowrap">
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
              <span className="text-slate-500 font-semibold whitespace-nowrap">
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
