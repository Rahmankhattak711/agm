import React from "react";
import { DEFAULT_PAYMENT_TERMS } from "./constants";

export interface QuotationPaymentTermsProps {
  paymentTermsList?: string[];
}

export const QuotationPaymentTerms: React.FC<QuotationPaymentTermsProps> = ({
  paymentTermsList = DEFAULT_PAYMENT_TERMS,
}) => {
  return (
    <div className="px-10 mt-4 print-avoid-break">
      <div className="border border-agm-box-border bg-agm-box-bg p-3.5 rounded-xl">
        <div className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-agm-green mb-2">
          PAYMENT TERMS
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11.5px] text-slate-800 font-semibold">
          {paymentTermsList.map((pt, idx) => (
            <div
              key={idx}
              className="bg-white/90 border border-agm-box-border px-3 py-1.5 rounded-lg shadow-2xs"
            >
              • {pt}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuotationPaymentTerms;
