import React, { useState, Fragment } from "react";
import { Plus, X } from "lucide-react";

export interface SalesInvoiceTermsProps {
  className?: string;
  terms?: string[];
  onUpdateTerm?: (index: number, val: string) => void;
  onAddTerm?: () => void;
  onRemoveTerm?: (index: number) => void;
  paymentPlans?: string[];
  onUpdatePaymentPlan?: (index: number, val: string) => void;
  onAddPaymentPlan?: () => void;
  onRemovePaymentPlan?: (index: number) => void;
  customTerms?: string | null;
}

export const DEFAULT_SALES_INVOICE_TERMS_TEXT = [
  "Invoice Note: Please quote the invoice number when making payment.",
  "All materials, specifications, quantities, and prices are as per the approved quotation.",
  "Any additional or variation works requested by the Client shall be charged separately and shall be payable 100% as per the issued invoice.",
  "This invoice is issued in accordance with the terms and conditions stated in the approved quotation.",
  "Payment shall be made as per the payment schedule and terms mentioned in the approved quotation.",
  "Payment Conditions: Variation works shall be paid as per the issued invoice. The quotation number mentioned is for source/reference purposes only and does not constitute the payment terms for the variation works.",
];

export const DEFAULT_SALES_INVOICE_PAYMENT_PLANS = ["100 % Advance"];

function renderHighlightedText(text: string) {
  if (!text) return null;
  if (text.includes("100%")) {
    const parts = text.split("100%");
    return (
      <span>
        {parts.map((part, i) => (
          <Fragment key={i}>
            {part}
            {i < parts.length - 1 && (
              <span className="text-red-600 font-bold">100%</span>
            )}
          </Fragment>
        ))}
      </span>
    );
  }
  return <span>{text}</span>;
}

export const SalesInvoiceTerms: React.FC<SalesInvoiceTermsProps> = ({
  className = "",
  terms: externalTerms,
  onUpdateTerm,
  onAddTerm,
  onRemoveTerm,
  paymentPlans: externalPaymentPlans,
  onUpdatePaymentPlan,
  onAddPaymentPlan,
  onRemovePaymentPlan,
  customTerms,
}) => {
  const [internalTerms, setInternalTerms] = useState<string[]>(
    DEFAULT_SALES_INVOICE_TERMS_TEXT,
  );
  const [internalPaymentPlans, setInternalPaymentPlans] = useState<string[]>(
    DEFAULT_SALES_INVOICE_PAYMENT_PLANS,
  );

  const termsList = externalTerms || internalTerms;
  const paymentPlansList = externalPaymentPlans || internalPaymentPlans;

  const handleUpdateTerm = (idx: number, val: string) => {
    if (onUpdateTerm) {
      onUpdateTerm(idx, val);
    } else {
      setInternalTerms((prev) =>
        prev.map((item, i) => (i === idx ? val : item)),
      );
    }
  };

  const handleAddTerm = () => {
    if (onAddTerm) {
      onAddTerm();
    } else {
      setInternalTerms((prev) => [
        ...prev,
        "New term condition or operational clause.",
      ]);
    }
  };

  const handleRemoveTerm = (idx: number) => {
    if (onRemoveTerm) {
      onRemoveTerm(idx);
    } else {
      setInternalTerms((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleUpdatePaymentPlan = (idx: number, val: string) => {
    if (onUpdatePaymentPlan) {
      onUpdatePaymentPlan(idx, val);
    } else {
      setInternalPaymentPlans((prev) =>
        prev.map((item, i) => (i === idx ? val : item)),
      );
    }
  };

  const handleAddPaymentPlan = () => {
    if (onAddPaymentPlan) {
      onAddPaymentPlan();
    } else {
      setInternalPaymentPlans((prev) => [
        ...prev,
        "Progress payment milestone as agreed",
      ]);
    }
  };

  const handleRemovePaymentPlan = (idx: number) => {
    if (onRemovePaymentPlan) {
      onRemovePaymentPlan(idx);
    } else {
      setInternalPaymentPlans((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const hasCustomTerms =
    customTerms &&
    customTerms.trim().length > 0 &&
    !customTerms.includes("DEFAULT");

  return (
    <div
      className={`sales-invoice-terms print-avoid-break break-inside-avoid ${className}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="font-bold text-red-600 text-[12px] print:text-[11px]">
          Terms and Conditions:
        </div>

        <button
          type="button"
          onClick={handleAddTerm}
          className="print:hidden text-[10.5px] font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Plus size={12} /> Add Term
        </button>
      </div>

      {hasCustomTerms ? (
        <div className="w-full text-[11px] print:text-[9.5px] text-slate-800 font-semibold leading-relaxed whitespace-pre-line py-1">
          {customTerms}
        </div>
      ) : (
        <div className="w-full space-y-0.5">
          {termsList.map((term, idx) => (
            <div
              key={idx}
              className="flex items-start gap-1 py-0.5 text-[11px] print:text-[9.5px] font-semibold text-slate-900 leading-snug group"
            >
              <span className="w-5 shrink-0 font-bold select-none text-slate-900 mt-0.5">
                {idx + 1}.
              </span>
              <div className="flex-1">
                <textarea
                  rows={1}
                  value={term}
                  onChange={(e) => handleUpdateTerm(idx, e.target.value)}
                  className="w-full bg-transparent hover:bg-slate-50 focus:bg-emerald-50/50 border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded px-1.5 py-0.5 text-[11px] print:text-[9.5px] font-semibold text-slate-900 leading-snug resize-y outline-none transition-colors print:hidden"
                  placeholder="Enter term or condition clause..."
                />
                <div className="hidden print:block leading-snug">
                  {renderHighlightedText(term)}
                </div>
              </div>

              {termsList.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTerm(idx)}
                  className="print:hidden opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5 rounded cursor-pointer shrink-0 mt-0.5"
                  title="Delete term"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 mb-1">
        <div className="font-bold text-red-600 text-[11.5px] print:text-[10px] tracking-wider uppercase">
          PAYMENT TERMS
        </div>

        <button
          type="button"
          onClick={handleAddPaymentPlan}
          className="print:hidden text-[10.5px] font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Plus size={12} /> Add Payment Plan
        </button>
      </div>

      <div className="w-full space-y-0.5">
        {paymentPlansList.map((plan, idx) => (
          <div
            key={idx}
            className="flex items-start gap-1 py-0.5 text-[11px] print:text-[9.5px] font-semibold text-slate-900 leading-snug group"
          >
            <span className="w-5 shrink-0 font-bold select-none text-slate-900 mt-0.5">
              {idx + 1}
            </span>
            <div className="flex-1">
              <input
                type="text"
                value={plan}
                onChange={(e) => handleUpdatePaymentPlan(idx, e.target.value)}
                className="w-full bg-transparent hover:bg-slate-50 focus:bg-emerald-50/50 border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded px-1.5 py-0.5 text-[11px] print:text-[9.5px] font-semibold text-slate-900 leading-snug outline-none transition-colors print:hidden"
                placeholder="e.g. 100 % Advance or milestone..."
              />
              <div className="hidden print:block leading-snug">
                {renderHighlightedText(plan)}
              </div>
            </div>

            {paymentPlansList.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemovePaymentPlan(idx)}
                className="print:hidden opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5 rounded cursor-pointer shrink-0 mt-0.5"
                title="Delete payment plan"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesInvoiceTerms;
