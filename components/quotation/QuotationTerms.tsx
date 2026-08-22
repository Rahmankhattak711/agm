import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DEFAULT_TERMS_AND_CONDITIONS } from "./constants";
import { Button } from "@/components/ui";

export interface QuotationTermsProps {
  termsList?: typeof DEFAULT_TERMS_AND_CONDITIONS;
}

export const QuotationTerms: React.FC<QuotationTermsProps> = ({
  termsList = DEFAULT_TERMS_AND_CONDITIONS,
}) => {
  const [showAllTerms, setShowAllTerms] = useState<boolean>(true);

  return (
    <div className="px-10 mt-6 print-avoid-break">
      <div className="border border-agm-box-border bg-agm-box-bg p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-slate-900 uppercase text-[11.5px] tracking-wider text-agm-green">
            TERMS AND CONDITIONS (20 CLAUSES)
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAllTerms(!showAllTerms)}
            className="print:hidden text-[11px] text-emerald-800 hover:text-emerald-900 hover:bg-emerald-100/60 font-bold"
            icon={
              showAllTerms ? <ChevronUp size={14} /> : <ChevronDown size={14} />
            }
          >
            {showAllTerms ? "Collapse View" : "Expand All 20 Terms"}
          </Button>
        </div>

        <div
          className={`space-y-1 text-[11px] text-slate-700 leading-relaxed ${
            showAllTerms ? "" : "max-h-48 overflow-hidden print:max-h-none"
          }`}
        >
          {termsList.map((t) => (
            <div key={t.id} className="flex items-start gap-1.5 py-0.5">
              <span className="font-bold text-agm-green min-w-[18px]">
                {t.id}.
              </span>
              <div>
                <strong className="text-slate-900 mr-1">{t.title}</strong>
                <span>{t.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuotationTerms;
