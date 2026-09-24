"use client";

import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { PrintIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import {
  VatSummaryReport as VatSummaryData,
  VatQuarterDetail,
  VatMonthlyRow,
  VatMonthlyBreakdownRow,
} from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { formatNumber } from "./types";

interface VatPositionReportProps {
  vatSummary?: VatSummaryData;
  isLoading: boolean;
}

export const VatPositionReport: React.FC<VatPositionReportProps> = ({
  vatSummary,
  isLoading,
}) => {
  const quartersData: VatQuarterDetail[] =
    vatSummary?.quarters && vatSummary.quarters.length > 0
      ? vatSummary.quarters
      : [];

  const monthlyNetData: VatMonthlyRow[] =
    vatSummary?.monthlyNet && vatSummary.monthlyNet.length > 0
      ? vatSummary.monthlyNet
      : [];

  const purchasesData: VatMonthlyBreakdownRow[] =
    vatSummary?.monthlyPurchases && vatSummary.monthlyPurchases.length > 0
      ? vatSummary.monthlyPurchases
      : [];

  const incomeData: VatMonthlyBreakdownRow[] =
    vatSummary?.monthlyIncome && vatSummary.monthlyIncome.length > 0
      ? vatSummary.monthlyIncome
      : [];

  const totalInputVat =
    vatSummary?.inputVat !== undefined
      ? Number(vatSummary.inputVat)
      : monthlyNetData.reduce(
          (s: number, r: VatMonthlyRow) => s + Number(r.inputVat || 0),
          0,
        );

  const totalOutputVat =
    vatSummary?.outputVat !== undefined
      ? Number(vatSummary.outputVat)
      : monthlyNetData.reduce(
          (s: number, r: VatMonthlyRow) => s + Number(r.outputVat || 0),
          0,
        );

  const netVat = totalOutputVat - totalInputVat;

  const totalPurchasesTaxable = purchasesData.reduce(
    (s: number, r: VatMonthlyBreakdownRow) => s + Number(r.taxableAmount || 0),
    0,
  );
  const totalPurchasesAmount = purchasesData.reduce(
    (s: number, r: VatMonthlyBreakdownRow) => s + Number(r.totalAmount || 0),
    0,
  );

  const totalIncomeTaxable = incomeData.reduce(
    (s: number, r: VatMonthlyBreakdownRow) => s + Number(r.taxableAmount || 0),
    0,
  );
  const totalIncomeAmount = incomeData.reduce(
    (s: number, r: VatMonthlyBreakdownRow) => s + Number(r.totalAmount || 0),
    0,
  );

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "VAT-Position-Declaration-Statement",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2.5 bg-agm-card rounded-2xl border border-agm-box-border shadow-2xs print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-agm-muted uppercase tracking-wide">
            UAE FTA VAT Return Form 201 Position
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePrint()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-agm-text border-agm-box-border bg-agm-card hover:bg-agm-box-bg cursor-pointer shadow-2xs rounded-xl h-auto shrink-0"
          icon={<PrintIcon size={14} />}
        >
          Print VAT Statement
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-agm-muted animate-pulse space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-agm-green border-t-transparent animate-spin mx-auto" />
          <p>Calculating Statutory VAT Position...</p>
        </div>
      ) : (
        <div className="flex justify-center w-full">
          <div
            ref={printRef}
            id="printable-voucher"
            className="w-full max-w-[950px] bg-agm-card border border-agm-box-border shadow-md rounded-xl p-8 sm:p-10 space-y-0 print:p-0 print:m-0 print:border-none print:shadow-none print:max-w-none text-agm-text"
            style={{
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          >
            <table className="print-page-table w-full border-collapse">
              <thead className="print-page-header-group">
                <tr>
                  <th className="p-0 font-normal text-left border-none">
                    <QuotationHeader className="!px-0 !pt-0 !pb-4 !border-b-0" />
                  </th>
                </tr>
              </thead>

              <tfoot className="print-page-footer-group">
                <tr>
                  <td className="p-0 border-none align-bottom">
                    <div
                      className="w-full opacity-0 pointer-events-none select-none"
                      style={{ minHeight: "175px" }}
                      aria-hidden="true"
                    >
                      <QuotationFooter />
                      <div style={{ height: "45px", minHeight: "45px" }} />
                    </div>
                  </td>
                </tr>
              </tfoot>

              <tbody className="print-page-body-group">
                <tr>
                  <td className="p-0 border-none align-top">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center py-2 text-[12px] font-bold text-agm-text print:text-[11px] border-t border-agm-box-border">
                        <span>
                          Corporate Tax Registration No: 104094432200001
                        </span>
                        <span>VAT Registration No:104094432200003</span>
                      </div>

                      <div
                        className="w-full text-center py-2.5 px-4 font-bold text-[13px] print:text-[12.5px] text-white tracking-wide uppercase mb-0 bg-agm-navy"
                        style={{
                          WebkitPrintColorAdjust: "exact",
                          printColorAdjust: "exact",
                        }}
                      >
                        AGM FITOUT TECHNICAL SERVICES LLC - STATUTORY VAT
                        POSITION DECLARATION
                      </div>

                      <table className="w-full border-collapse text-[12px] print:text-[11.5px] text-agm-text">
                        <thead>
                          <tr className="bg-agm-box-bg font-bold text-agm-text border-b border-agm-box-border">
                            <th className="py-2.5 px-4 text-left font-bold w-[45%]">
                              VAT Declaration Box / Category
                            </th>
                            <th className="py-2.5 px-4 text-right font-bold w-[27%]">
                              Taxable Amount (AED)
                            </th>
                            <th className="py-2.5 px-4 text-right font-bold w-[28%]">
                              VAT Amount 5% (AED)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-agm-green-soft text-agm-green-dark border-t border-b border-agm-box-border">
                            <td
                              colSpan={3}
                              className="py-1.5 px-4 font-bold text-agm-green-dark text-[11.5px] uppercase tracking-wider"
                            >
                              1. VAT on Sales &amp; Output Supplies (Box 1a)
                            </td>
                          </tr>
                          <tr className="border-b border-agm-box-border/50">
                            <td className="py-1.5 px-4 font-medium text-agm-text">
                              Standard Rated Supplies (Dubai &amp; UAE Fitout
                              Services)
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-agm-text font-semibold">
                              {formatNumber(
                                totalIncomeTaxable || totalIncomeAmount,
                              )}
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-agm-text font-bold">
                              {formatNumber(totalOutputVat)}
                            </td>
                          </tr>

                          <tr className="bg-agm-box-bg text-agm-navy border-t border-b border-agm-box-border">
                            <td
                              colSpan={3}
                              className="py-2 px-4 font-bold text-agm-navy text-[11.5px] uppercase tracking-wider"
                            >
                              2. VAT on Purchases &amp; Incurred Costs (Box 9)
                            </td>
                          </tr>
                          <tr className="border-b border-agm-box-border/50">
                            <td className="py-1.5 px-4 font-medium text-agm-text">
                              Standard Rated Expenses &amp; Direct Materials
                              Procurement
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-agm-text font-semibold">
                              {formatNumber(
                                totalPurchasesTaxable || totalPurchasesAmount,
                              )}
                            </td>
                            <td className="py-1.5 px-4 text-right font-mono text-agm-text font-bold">
                              {formatNumber(totalInputVat)}
                            </td>
                          </tr>

                          <tr className="bg-agm-sidebar text-white font-bold border-t-2 border-agm-green">
                            <td className="py-2.5 px-4 font-black text-white text-[12.5px]">
                              Net VAT Due to FTA:{" "}
                              {netVat >= 0 ? "Payable" : "Refundable"}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                              Net Output - Input
                            </td>
                            <td
                              className={`py-2.5 px-4 text-right font-mono font-black text-[13px] ${
                                netVat > 0
                                  ? "text-rose-300"
                                  : "text-emerald-300"
                              }`}
                            >
                              {netVat < 0
                                ? `(${formatNumber(Math.abs(netVat))})`
                                : formatNumber(netVat)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {quartersData.length > 0 && (
                        <div className="pt-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-agm-navy mb-2 block">
                            Quarterly VAT Returns Summary
                          </span>
                          <table className="w-full border-collapse text-[12px] print:text-[11.5px] text-agm-text">
                            <thead>
                              <tr className="bg-agm-box-bg font-bold text-agm-text border-b border-agm-box-border">
                                <th className="py-2 px-3 text-left font-bold">
                                  Quarter
                                </th>
                                <th className="py-2 px-3 text-right font-bold">
                                  Sales
                                </th>
                                <th className="py-2 px-3 text-right font-bold">
                                  Purchases
                                </th>
                                <th className="py-2 px-3 text-right font-bold">
                                  Output VAT
                                </th>
                                <th className="py-2 px-3 text-right font-bold">
                                  Input VAT
                                </th>
                                <th className="py-2 px-3 text-right font-bold">
                                  Net VAT
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {quartersData.map((q) => (
                                <tr
                                  key={q.key}
                                  className="border-b border-agm-box-border/50 hover:bg-agm-box-bg/50"
                                >
                                  <td className="py-2 px-3 font-semibold text-agm-navy">
                                    {q.quarter || q.key}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-agm-text">
                                    {formatNumber(q.sales)}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-agm-text">
                                    {formatNumber(q.purchases)}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-agm-text">
                                    {formatNumber(q.outputVat)}
                                  </td>
                                  <td className="py-2 px-3 text-right font-mono text-agm-text">
                                    {formatNumber(q.inputVat)}
                                  </td>
                                  <td
                                    className={`py-2 px-3 text-right font-mono font-bold ${
                                      Number(q.netVat || 0) > 0
                                        ? "text-rose-600"
                                        : "text-emerald-700"
                                    }`}
                                  >
                                    {formatNumber(q.netVat)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="pt-6 print:hidden">
                        <QuotationFooter className="!mt-0 !px-0" />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="print-footer-bottom fixed-print-footer hidden print:block">
              <QuotationFooter />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VatPositionReport;
