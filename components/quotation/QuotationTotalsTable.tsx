import React, { ChangeEvent } from "react";
import { formatCurrency, numberToWords } from "./constants";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui";

export interface QuotationTotalsTableProps {
  subtotal: number;
  vatPct: number | string;
  vatAmt: number;
  discount: number | string;
  total: number;
  onUpdateVatPct: (val: string) => void;
  onUpdateDiscount: (val: string) => void;
}

export const QuotationTotalsTable: React.FC<QuotationTotalsTableProps> = ({
  subtotal,
  vatPct,
  vatAmt,
  discount,
  total,
  onUpdateVatPct,
  onUpdateDiscount,
}) => {
  const discountNum = Math.max(0, Number(discount) || 0);
  const afterDiscount = Math.max(0, subtotal - discountNum);

  const getAmountInWords = (amount: number): string => {
    const rounded = Math.round((Number(amount) || 0) * 100) / 100;
    const whole = Math.floor(rounded);
    const fils = Math.round((rounded - whole) * 100);
    const wholeWords = numberToWords(whole);
    if (fils > 0) {
      const filsWords = numberToWords(fils);
      return `${wholeWords} UAE Dirhams and ${filsWords} Fils Only`;
    }
    return `${wholeWords} UAE Dirhams Only`;
  };

  return (
    <div className="px-10 print:px-8 overflow-hidden">
      <div className="flex items-stretch justify-between overflow-hidden gap-4 mt-3.5 print:mt-3.5 print-avoid-break">
        <div className="flex-1 border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2.5 rounded-xl text-[11.5px] print:text-[12px] flex flex-col justify-between shadow-2xs">
          <div>
            <div className="font-bold mb-1.5 print:mb-1 text-slate-900 uppercase text-[11px] print:text-[11.5px] tracking-wider text-agm-green flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
              BANKING INFORMATION
            </div>
            <div className="space-y-1 print:space-y-1 text-slate-700 print:text-slate-800 font-medium print:text-[12px]">
              <div>
                Company:{" "}
                <strong className="text-slate-900">
                  A G M FITOUT TECHNICAL SERVICES LLC
                </strong>
              </div>
              <div>
                Bank:{" "}
                <strong className="text-slate-900">
                  The National Bank of Ras Al Khaimah (RAKBANK)
                </strong>
              </div>
              <div>
                Account (AED):{" "}
                <strong className="text-slate-900 font-mono">
                  0423141113001
                </strong>
              </div>
              <div>
                IBAN (AED):{" "}
                <strong className="text-slate-900 font-mono">
                  AE88 0400 0004 2314 1113 001
                </strong>
              </div>
              <div>
                SWIFT Code:{" "}
                <strong className="text-slate-900 font-mono">NBARAEAD</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="w-80 print:w-84 border border-slate-200 print:border-slate-300 bg-white rounded-xl overflow-hidden shadow-2xs text-[12px] print:text-[12.5px] flex flex-col justify-between">
          <div className="divide-y divide-slate-100 print:divide-slate-200 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between px-4 py-2.5 print:py-2 bg-slate-50/40">
              <span className="font-semibold text-slate-600 print:text-slate-700 print:text-[12.5px]">
                Subtotal
              </span>
              <span className="font-mono font-bold text-slate-900 text-[12.5px] print:text-[13px]">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-2 print:py-2">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-600 print:text-slate-700 print:text-[12.5px]">
                  Discount
                </span>
                <span className="text-[10px] print:text-[11px] text-slate-400 font-normal">
                  (AED)
                </span>
              </div>
              <div className="flex items-center justify-end">
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  step="any"
                  placeholder="0.00"
                  className="w-24 text-right font-mono font-semibold text-rose-600 bg-transparent outline-none border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded px-1.5 py-0.5 transition-colors print:hidden"
                  value={discount}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onUpdateDiscount(e.target.value)
                  }
                />
                <span className="hidden print:inline font-mono font-semibold text-slate-800 print:text-[12.5px]">
                  {discountNum > 0 ? `-${formatCurrency(discountNum)}` : "0.00"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between px-4 py-2.5 print:py-2 bg-slate-50/40">
              <span className="font-semibold text-slate-600 print:text-slate-700 print:text-[12.5px]">
                After Discount
              </span>
              <span className="font-mono font-bold text-slate-900 text-[12.5px] print:text-[13px]">
                {formatCurrency(afterDiscount)}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-2 print:py-2">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600 print:text-slate-700 print:text-[12.5px]">
                  VAT{" "}
                  <span className="hidden print:inline font-bold text-emerald-800">
                    ({vatPct}%)
                  </span>
                </span>
                <div className="flex items-center bg-emerald-50 print:hidden border border-emerald-200 rounded px-1 py-0.2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-7 text-center font-bold text-emerald-800 bg-transparent outline-none"
                    value={vatPct}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      onUpdateVatPct(e.target.value)
                    }
                  />
                  <span className="text-emerald-800 font-bold text-[10px]">
                    %
                  </span>
                </div>
              </div>
              <span className="font-mono font-semibold text-slate-800 print:text-[12.5px]">
                {formatCurrency(vatAmt)}
              </span>
            </div>
          </div>

          <div className="flex items-center overflow-hidden justify-between px-4 py-2.5 print:py-2.5 bg-agm-green text-white mt-auto border-t border-slate-100 print:border-slate-200">
            <span className="font-black tracking-wide text-white text-[12px] print:text-[13px] uppercase">
              TOTAL (AED)
            </span>
            <span className="font-mono font-black text-white text-[14px] print:text-[15px]">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      </div>
      <p className="text-[16px] text-agm-green font-bold mt-3">
        {getAmountInWords(total)}
      </p>
    </div>
  );
};

export default QuotationTotalsTable;
