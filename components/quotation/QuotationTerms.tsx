import React, { useState, ChangeEvent } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { DEFAULT_TERMS_AND_CONDITIONS } from "./constants";
import { Button } from "@/components/ui";

export interface QuotationTermItem {
  id: number | string;
  title: string;
  text: string;
}

export interface QuotationTermsProps {
  termsList?: QuotationTermItem[];
  onUpdateTerm?: (index: number, field: "title" | "text", val: string) => void;
  onAddTerm?: () => void;
  onRemoveTerm?: (index: number) => void;
}

export const QuotationTerms: React.FC<QuotationTermsProps> = ({
  termsList = DEFAULT_TERMS_AND_CONDITIONS,
  onUpdateTerm,
  onAddTerm,
  onRemoveTerm,
}) => {
  const [showAllTerms, setShowAllTerms] = useState<boolean>(true);

  return (
    <div className="px-10 mt-4 print:px-0 print:mt-3.5">
      <div className="border border-agm-box-border bg-agm-box-bg p-4 print:p-0 rounded-xl print:rounded-none print:border-none print:bg-transparent">
        <div className="flex items-center justify-between mb-2 print:mb-1.5">
          <div className="font-bold text-red-600 uppercase text-[11.5px] print:text-[12px] tracking-wider text-agm-green flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
            TERMS AND CONDITIONS
          </div>

          <div className="flex items-center gap-2 print:hidden">
            {onAddTerm && (
              <button
                type="button"
                onClick={onAddTerm}
                className="text-[10.5px] font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus size={12} /> Add Term
              </button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAllTerms(!showAllTerms)}
              className="text-[11px] text-emerald-800 hover:text-emerald-900 hover:bg-emerald-100/60 font-bold"
              icon={
                showAllTerms ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )
              }
            >
              {showAllTerms
                ? "Collapse View"
                : `Expand All (${termsList.length} Terms)`}
            </Button>
          </div>
        </div>

        <table className="w-full border-collapse">
          <tbody>
            {termsList.map((t, idx) => (
              <tr
                key={t.id ?? idx}
                className={`break-inside-avoid print:break-inside-avoid align-top group ${
                  !showAllTerms && idx >= 6 ? "hidden print:table-row" : ""
                }`}
                style={{
                  breakInside: "avoid",
                  pageBreakInside: "avoid",
                }}
              >
                <td className="w-6 print:w-5 py-1.5 print:py-0.5 align-top font-bold text-agm-green text-[11px] print:text-[11.5px] select-none">
                  {idx + 1}.
                </td>
                <td className="py-1 print:py-0.5 align-top text-[11px] print:text-[11.5px] print:leading-normal text-slate-700 leading-relaxed">
                  {onUpdateTerm ? (
                    <div className="flex items-start gap-2 flex-1">
                      <div className="flex-1 space-y-1 print:hidden">
                        <input
                          type="text"
                          className="w-full font-bold text-slate-900 bg-white border border-slate-200 focus:border-emerald-500 rounded px-2 py-0.5 text-[11px] outline-none transition-colors"
                          value={t.title}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            onUpdateTerm(idx, "title", e.target.value)
                          }
                          placeholder="Term Title:"
                        />
                        <textarea
                          rows={2}
                          className="w-full text-slate-700 bg-white border border-slate-200 focus:border-emerald-500 rounded px-2 py-1 text-[11px] outline-none transition-colors resize-y leading-relaxed"
                          value={t.text}
                          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                            onUpdateTerm(idx, "text", e.target.value)
                          }
                          placeholder="Term description / details..."
                        />
                      </div>

                      <div className="hidden print:block">
                        <strong className="text-slate-900 mr-1">
                          {t.title}
                        </strong>
                        <span>{t.text}</span>
                      </div>

                      {onRemoveTerm && termsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveTerm(idx)}
                          className="print:hidden text-slate-300 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 cursor-pointer"
                          title="Remove this term"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <strong className="text-slate-900 mr-1">{t.title}</strong>
                      <span>{t.text}</span>
                    </>
                  )}
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
