import React, { ChangeEvent } from "react";
import { Plus, X } from "lucide-react";
import { DEFAULT_PAYMENT_TERMS } from "./constants";

export interface QuotationPaymentTermsProps {
  paymentTerms?: string[];
  onUpdatePaymentTerm?: (index: number, val: string) => void;
  onAddPaymentTerm?: () => void;
  onRemovePaymentTerm?: (index: number) => void;
}

export const QuotationPaymentTerms: React.FC<QuotationPaymentTermsProps> = ({
  paymentTerms = DEFAULT_PAYMENT_TERMS,
  onUpdatePaymentTerm,
  onAddPaymentTerm,
  onRemovePaymentTerm,
}) => {
  return (
    <div className="px-10 mt-3 print:px-8 print:mt-2 print-avoid-break break-inside-avoid print:break-inside-avoid">
      <div className="border border-agm-box-border bg-agm-box-bg p-3 print:p-2 rounded-xl print:rounded-lg">
        <div className="flex items-center justify-between mb-1.5 print:mb-1">
          <div className="font-bold text-slate-900 uppercase text-[11px] print:text-[12px] tracking-wider text-agm-green flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
            PAYMENT TERMS
          </div>

          {onAddPaymentTerm && (
            <button
              type="button"
              onClick={onAddPaymentTerm}
              className="print:hidden text-[10.5px] font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors"
            >
              <Plus size={12} /> Add Term
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 print:gap-1.5 text-[11.5px] print:text-[12px] text-slate-800 font-semibold">
          {paymentTerms.map((pt, idx) => (
            <div
              key={idx}
              className="bg-white border border-agm-box-border px-3 py-1.5 print:px-2.5 print:py-1.5 rounded-lg flex items-center justify-between gap-2 shadow-2xs break-inside-avoid print:break-inside-avoid"
            >
              <div className="flex items-center gap-1.5 flex-1">
                <span className="text-agm-green font-bold text-[11px] print:text-[12px] select-none">
                  •
                </span>
                {onUpdatePaymentTerm ? (
                  <input
                    type="text"
                    className="w-full bg-transparent outline-none font-semibold text-slate-800 text-[11px] print:text-[12px] print:text-slate-900 print:p-0"
                    value={pt}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      onUpdatePaymentTerm(idx, e.target.value)
                    }
                  />
                ) : (
                  <span className="text-[11px] print:text-[12px] print:text-slate-900">{pt}</span>
                )}
              </div>

              {onRemovePaymentTerm && paymentTerms.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemovePaymentTerm(idx)}
                  className="print:hidden text-slate-300 hover:text-red-500 transition-colors p-0.5"
                  title="Remove this payment term"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuotationPaymentTerms;
