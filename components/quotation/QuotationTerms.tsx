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
      <div className="border border-agm-box-border bg-agm-box-bg p-4 print:p-0 rounded-xl print:rounded-none print:border-none print:bg-transparent">
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

        <table className="w-full border-collapse">
          <tbody>
            {termsList.map((t, idx) => (
              <tr
                key={t.id}
                className={`break-inside-avoid print:break-inside-avoid align-top ${
                  !showAllTerms && idx >= 6 ? "hidden print:table-row" : ""
                }`}
                style={{
                  breakInside: "avoid",
                  pageBreakInside: "avoid",
                }}
              >
                <td className="w-5 print:w-4.5 py-0.5 print:py-0.5 align-top font-bold text-agm-green text-[11px] print:text-[9.5px] select-none">
                  {t.id}.
                </td>
                <td className="py-0.5 print:py-0.5 align-top text-[11px] print:text-[9.5px] print:leading-snug text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 mr-1">{t.title}</strong>
                  <span>{t.text}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuotationTerms;
