import React, { ChangeEvent } from "react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui";
import { formatCurrency, numberToWords } from "./constants";

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
  return (
    <div className="px-10">
      <div className="flex items-stretch justify-between gap-4 mt-4 print-avoid-break">
        <div className="flex-1 border border-agm-box-border bg-agm-box-bg p-3.5 rounded-xl text-[11.5px] flex flex-col justify-center">
          <div className="font-bold mb-1.5 text-slate-900 uppercase text-[11px] tracking-wider text-agm-green">
            BANKING INFORMATION
          </div>
          <div className="space-y-1 text-slate-700 font-medium">
            <div>
              Company: <strong className="text-slate-900">A G M FITOUT TECHNICAL SERVICES LLC</strong>
            </div>
            <div>
              Bank: <strong className="text-slate-900">The National Bank of Ras Al Khaimah (RAKBANK)</strong>
            </div>
            <div>
              Account (AED): <strong className="text-slate-900 font-mono">0323111672001</strong>
            </div>
            <div>
              IBAN: <strong className="text-slate-900 font-mono">AE44 0400 0003 2311 1672 001</strong>
            </div>
            <div>
              SWIFT Code: <strong className="text-slate-900 font-mono">NRAKAEAK</strong>
            </div>
          </div>
        </div>

        <Table
          className="text-[12.5px] border-collapse border border-agm-box-border w-84 rounded-xl overflow-hidden"
          wrapperClassName="overflow-visible"
        >
          <TableBody>
            <TableRow className="hover:bg-agm-box-bg">
              <TableCell
                align="right"
                className="py-2 px-3 font-bold border border-agm-box-border bg-agm-box-bg text-slate-700"
              >
                Subtotal
              </TableCell>
              <TableCell
                align="right"
                className="py-2 px-3 font-mono font-bold border border-agm-box-border bg-agm-box-bg text-slate-900"
              >
                {formatCurrency(subtotal)}
              </TableCell>
            </TableRow>
            <TableRow className="hover:bg-agm-box-bg">
              <TableCell
                align="right"
                className="py-2 px-3 font-bold border border-agm-box-border bg-agm-box-bg text-slate-700"
              >
                <span className="inline-flex items-center gap-1 justify-end">
                  VAT
                  <input
                    type="number"
                    className="w-9 bg-transparent outline-none border-b border-dotted border-slate-400 text-center font-bold text-agm-green"
                    value={vatPct}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      onUpdateVatPct(e.target.value)
                    }
                  />
                  %
                </span>
              </TableCell>
              <TableCell
                align="right"
                className="py-2 px-3 font-mono font-bold border border-agm-box-border bg-agm-box-bg text-slate-900"
              >
                {formatCurrency(vatAmt)}
              </TableCell>
            </TableRow>
            <TableRow className="hover:bg-agm-box-bg">
              <TableCell
                align="right"
                className="py-2 px-3 font-bold border border-agm-box-border bg-agm-box-bg text-slate-700"
              >
                Discount (AED)
              </TableCell>
              <TableCell
                align="right"
                className="py-2 px-3 border border-agm-box-border bg-agm-box-bg text-slate-900"
              >
                <input
                  type="number"
                  placeholder="0.00"
                  className="text-right w-full bg-transparent outline-none font-mono font-bold"
                  value={discount}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onUpdateDiscount(e.target.value)
                  }
                />
              </TableCell>
            </TableRow>
            <TableRow className="bg-agm-green text-white hover:bg-agm-green">
              <TableCell
                align="right"
                className="py-2.5 px-3 font-black text-white"
              >
                TOTAL (AED)
              </TableCell>
              <TableCell
                align="right"
                className="py-2.5 px-3 font-black font-mono text-sm text-white"
              >
                {formatCurrency(total)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="mt-3.5 p-2.5 rounded-xl bg-agm-box-bg border border-agm-box-border text-[12px] font-bold text-agm-green print-avoid-break">
        Amount in words: AED {numberToWords(total)} Dhs Only
      </div>
    </div>
  );
};

export default QuotationTotalsTable;
