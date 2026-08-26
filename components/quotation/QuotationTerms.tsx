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
    <div className="px-10 mt-4 print:px-8 print:mt-2">
      <div className="border border-agm-box-border bg-agm-box-bg p-4 print:p-2.5 rounded-xl print:rounded-lg">
        <div className="flex items-center justify-between mb-2 print:mb-1">
          <div className="font-bold text-slate-900 uppercase text-[11.5px] print:text-[10px] tracking-wider text-agm-green">
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
          className={`space-y-1.5 print:space-y-0.5 text-[11px] print:text-[9.5px] print:leading-snug text-slate-700 leading-relaxed ${
            showAllTerms ? "" : "max-h-48 overflow-hidden print:max-h-none"
          }`}
        >
          {termsList.map((t) => (
            <div
              key={t.id}
              className="flex items-start gap-1.5 py-0.5 print:py-0.5 break-inside-avoid print:break-inside-avoid print-avoid-break"
            >
              <span className="font-bold text-agm-green min-w-[18px] print:min-w-[15px] shrink-0">
                {t.id}.
              </span>
              <div className="break-inside-avoid print:break-inside-avoid">
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
