import React, { ChangeEvent } from "react";
import { QuotationMeta } from "./constants";

export interface QuotationDocTitleBarProps {
  docType: "QUOTATION" | "TAX_INVOICE";
  meta: QuotationMeta;
  onUpdateMeta: (key: keyof QuotationMeta, val: string) => void;
  paymentTerms: string[];
  onUpdatePaymentTerm: (index: number, val: string) => void;
}

export const QuotationDocTitleBar: React.FC<QuotationDocTitleBarProps> = ({
  docType,
  meta,
  onUpdateMeta,
  paymentTerms,
  onUpdatePaymentTerm,
}) => {
  const inputClass =
    "w-36 bg-transparent outline-none focus:bg-emerald-50/70 rounded px-1.5 py-0.5 text-right font-bold text-slate-900 border-b border-dashed border-slate-300 focus:border-emerald-600 transition-colors print:bg-transparent print:p-0 print:border-none";

  return (
    <div className="px-10 py-4 w-full border-b border-slate-100 bg-slate-50/50">
      <div className="flex items-start justify-between gap-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {docType === "TAX_INVOICE" ? "TAX INVOICE" : "QUOTATION"}
          </h1>
          {docType === "TAX_INVOICE" && (
            <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
              Official UAE FTA Tax Invoice (Standard Rated 5% VAT)
            </p>
          )}
        </div>

        <div className="w-[360px] space-y-2">
          <div className="text-[12px] space-y-1">
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
          </div>

          <div className="border border-agm-box-border bg-white/95 rounded-xl p-2.5 shadow-2xs">
            <div className="text-[10.5px] font-bold text-agm-green uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
              PAYMENT TERMS
            </div>
            <div className="space-y-1">
              {paymentTerms.map((term, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-[11px]"
                >
                  <span className="text-agm-green font-bold text-[10px] select-none">
                    •
                  </span>
                  <input
                    type="text"
                    className="w-full bg-transparent outline-none focus:bg-emerald-50 rounded px-1 py-0.5 font-medium text-slate-800 transition-colors print:p-0"
                    value={term}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      onUpdatePaymentTerm(idx, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationDocTitleBar;
