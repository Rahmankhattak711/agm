"use client";

import React, { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  CalendarIcon,
  ClockIcon,
  LayersIcon,
  PrintIcon,
} from "@/components/icons";
import { Button, DateRangePicker } from "@/components/ui";
import { ProfitLossItem, useProfitLoss } from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { formatNumber } from "./types";

export type PeriodType =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "custom"
  | "all";

interface ProfitLossReportProps {
  onDrillDownAccount?: (accountId: string) => void;
}

export const ProfitLossReport: React.FC<ProfitLossReportProps> = ({
  onDrillDownAccount,
}) => {
  const [period, setPeriod] = useState<PeriodType>("yearly");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  const startDateParam =
    period === "yearly"
      ? `${selectedYear}-01-01`
      : customStart || undefined;
  const endDateParam =
    period === "yearly"
      ? `${selectedYear}-12-31`
      : customEnd || undefined;

  const { data: profitLoss, isLoading } = useProfitLoss({
    period,
    startDate: startDateParam,
    endDate: endDateParam,
    compare: false,
  });

  const incomeRows: ProfitLossItem[] = profitLoss?.income || [];
  const directExpenseRows: ProfitLossItem[] = profitLoss?.directExpenses || [];
  const operatingExpenseRows: ProfitLossItem[] =
    profitLoss?.operatingExpenses || [];

  const totalIncome = profitLoss?.totalIncome ?? 0;
  const totalDirectExpenses = profitLoss?.totalDirectExpenses ?? 0;
  const grossProfit =
    profitLoss?.grossProfit ?? totalIncome - totalDirectExpenses;
  const totalOperatingExpenses = profitLoss?.totalOperatingExpenses ?? 0;
  const netProfit =
    profitLoss?.netProfit ?? grossProfit - totalOperatingExpenses;

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Profit-and-Loss-Statement-${period === "yearly" ? selectedYear : "Report"}`,
  });

  const statementTitle =
    period === "yearly"
      ? `AGM FITOUT TECHNICAL SERVICES LLC - PROFIT & LOSS - YEAR ENDED ${selectedYear}`
      : `AGM FITOUT TECHNICAL SERVICES LLC - PROFIT & LOSS - ${profitLoss?.periodLabel?.toUpperCase() || "STATEMENT"}`;

  return (
    <div className="space-y-6">
      {/* Modern Controls Header Bar (Hidden in Print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2.5 bg-agm-card rounded-2xl border border-agm-box-border shadow-2xs print:hidden">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Period Controls */}
          <div className="inline-flex items-center p-1 bg-agm-box-bg rounded-xl border border-agm-box-border">
            <button
              type="button"
              onClick={() => {
                setPeriod("yearly");
                setCustomStart("");
                setCustomEnd("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === "yearly"
                  ? "bg-agm-card text-agm-navy shadow-xs border border-agm-box-border"
                  : "text-agm-muted hover:text-agm-text hover:bg-white/50"
              }`}
            >
              <CalendarIcon
                size={13}
                className={
                  period === "yearly" ? "text-agm-green" : "text-agm-muted"
                }
              />
              <span>Yearly</span>
            </button>

            {period === "yearly" && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="ml-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-agm-box-border bg-agm-card text-agm-text shadow-2xs outline-none focus:border-agm-green cursor-pointer"
              >
                {[2023, 2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    Year Ended {yr}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => {
                setPeriod("monthly");
                setCustomStart("");
                setCustomEnd("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === "monthly"
                  ? "bg-agm-card text-agm-navy shadow-xs border border-agm-box-border"
                  : "text-agm-muted hover:text-agm-text hover:bg-white/50"
              }`}
            >
              <ClockIcon
                size={13}
                className={
                  period === "monthly" ? "text-agm-green" : "text-agm-muted"
                }
              />
              <span>Monthly</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPeriod("all");
                setCustomStart("");
                setCustomEnd("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                period === "all"
                  ? "bg-agm-card text-agm-navy shadow-xs border border-agm-box-border"
                  : "text-agm-muted hover:text-agm-text hover:bg-white/50"
              }`}
            >
              <LayersIcon
                size={13}
                className={
                  period === "all" ? "text-agm-green" : "text-agm-muted"
                }
              />
              <span>All Time</span>
            </button>
          </div>

          {/* Modern Date Range Picker */}
          <DateRangePicker
            startDate={customStart}
            endDate={customEnd}
            placeholder="Custom Date Range"
            onChange={({ startDate, endDate }) => {
              setCustomStart(startDate);
              setCustomEnd(endDate);
              if (startDate || endDate) {
                setPeriod("custom");
              } else {
                setPeriod("yearly");
              }
            }}
          />
        </div>

        {/* Print Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePrint()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-agm-text border-agm-box-border bg-agm-card hover:bg-agm-box-bg cursor-pointer shadow-2xs rounded-xl h-auto shrink-0"
          icon={<PrintIcon size={14} />}
        >
          Print Profit &amp; Loss
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-agm-muted animate-pulse space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-agm-green border-t-transparent animate-spin mx-auto" />
          <p>Loading Profit &amp; Loss statement data...</p>
        </div>
      ) : (
        /* Printable Statement Paper Document */
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
            {/* Multi-page Print Table Wrapper */}
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
                    <div className="space-y-0">
                      {/* 1. Tax Registration Subheader */}
                      <div className="flex justify-between items-center py-2 text-[12px] font-bold text-agm-text print:text-[11px] border-t border-agm-box-border">
                        <span>Corporate Tax Registration No: 104094432200001</span>
                        <span>VAT Registration No:104094432200003</span>
                      </div>

                      {/* 2. Theme Title Banner */}
                      <div
                        className="w-full text-center py-2.5 px-4 font-bold text-[13px] print:text-[12.5px] text-white tracking-wide uppercase mb-0 bg-agm-navy"
                        style={{
                          WebkitPrintColorAdjust: "exact",
                          printColorAdjust: "exact",
                        }}
                      >
                        {statementTitle}
                      </div>

                      {/* 4. Profit & Loss Table */}
                      <table className="w-full border-collapse text-[12px] print:text-[11.5px] text-agm-text">
                        <thead>
                          <tr className="bg-agm-box-bg font-bold text-agm-text border-b border-agm-box-border">
                            <th className="py-2.5 px-4 text-left font-bold w-[25%]">
                              Section
                            </th>
                            <th className="py-2.5 px-4 text-left font-bold w-[50%]">
                              Account Name
                            </th>
                            <th className="py-2.5 px-4 text-right font-bold w-[25%]">
                              Amount (AED)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* --- INCOME CATEGORY --- */}
                          <tr className="bg-agm-green-soft text-agm-green-dark border-t border-b border-agm-box-border">
                            <td
                              colSpan={3}
                              className="py-1.5 px-4 font-bold text-agm-green-dark text-[11.5px] uppercase tracking-wider"
                            >
                              INCOME
                            </td>
                          </tr>
                          {incomeRows.length === 0 ? (
                            <tr className="border-b border-agm-box-border/50">
                              <td className="py-1.5 px-4 text-agm-muted">Income</td>
                              <td className="py-1.5 px-4 font-medium text-agm-text">
                                Service Income
                              </td>
                              <td className="py-1.5 px-4 text-right font-mono text-agm-muted">
                                -
                              </td>
                            </tr>
                          ) : (
                            incomeRows.map((item, idx) => (
                              <tr
                                key={`inc-${idx}`}
                                className="border-b border-agm-box-border/50 hover:bg-agm-box-bg/50"
                              >
                                <td className="py-1.5 px-4 text-agm-muted">
                                  {item.section || "Income"}
                                </td>
                                <td className="py-1.5 px-4 font-medium text-agm-text">
                                  {item.accountName}
                                </td>
                                <td className="py-1.5 px-4 text-right font-mono text-agm-text">
                                  {item.amount > 0 ? formatNumber(item.amount) : "-"}
                                </td>
                              </tr>
                            ))
                          )}
                          {/* Total Income Row */}
                          <tr className="bg-agm-green/10 text-agm-green-dark font-bold border-t border-b border-agm-green/20">
                            <td
                              colSpan={2}
                              className="py-2 px-4 font-bold text-agm-green-dark"
                            >
                              Total Income
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-agm-green-dark">
                              {formatNumber(totalIncome)}
                            </td>
                          </tr>

                          {/* --- DIRECT EXPENSE CATEGORY --- */}
                          <tr className="bg-agm-box-bg text-agm-navy border-t border-b border-agm-box-border">
                            <td
                              colSpan={3}
                              className="py-2 px-4 font-bold text-agm-navy text-[11.5px] uppercase tracking-wider"
                            >
                              DIRECT EXPENSE
                            </td>
                          </tr>
                          {directExpenseRows.length === 0 ? (
                            <tr className="border-b border-agm-box-border/50">
                              <td className="py-1.5 px-4 text-agm-muted">
                                Direct Material Expense
                              </td>
                              <td className="py-1.5 px-4 font-medium text-agm-text">
                                Purchase Materials
                              </td>
                              <td className="py-1.5 px-4 text-right font-mono text-agm-muted">
                                -
                              </td>
                            </tr>
                          ) : (
                            directExpenseRows.map((item, idx) => (
                              <tr
                                key={`dir-${idx}`}
                                className="border-b border-agm-box-border/50 hover:bg-agm-box-bg/50"
                              >
                                <td className="py-1.5 px-4 text-agm-muted">
                                  {item.section || "Direct Material Expense"}
                                </td>
                                <td className="py-1.5 px-4 font-medium text-agm-text">
                                  {item.accountName}
                                </td>
                                <td className="py-1.5 px-4 text-right font-mono text-agm-text">
                                  {item.amount > 0 ? formatNumber(item.amount) : "-"}
                                </td>
                              </tr>
                            ))
                          )}
                          {/* Gross Profit Row */}
                          <tr className="bg-agm-navy/10 text-agm-navy font-bold border-t border-b border-agm-navy/20">
                            <td
                              colSpan={2}
                              className="py-2 px-4 font-bold text-agm-navy"
                            >
                              Gross Profit / (Loss)
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-agm-navy">
                              {formatNumber(grossProfit)}
                            </td>
                          </tr>

                          {/* --- OPERATING EXPENSES CATEGORY --- */}
                          <tr className="bg-agm-box-bg text-agm-navy border-t border-b border-agm-box-border">
                            <td
                              colSpan={3}
                              className="py-2 px-4 font-bold text-agm-navy text-[11.5px] uppercase tracking-wider"
                            >
                              OPERATING EXPENSES
                            </td>
                          </tr>
                          {operatingExpenseRows.length === 0 ? (
                            <tr className="border-b border-agm-box-border/50">
                              <td className="py-1.5 px-4 text-agm-muted">
                                Operating Expense
                              </td>
                              <td className="py-1.5 px-4 font-medium text-agm-text">
                                Operational Expenses
                              </td>
                              <td className="py-1.5 px-4 text-right font-mono text-agm-muted">
                                -
                              </td>
                            </tr>
                          ) : (
                            operatingExpenseRows.map((item, idx) => (
                              <tr
                                key={`op-${idx}`}
                                className="border-b border-agm-box-border/50 hover:bg-agm-box-bg/50"
                              >
                                <td className="py-1.5 px-4 text-agm-muted">
                                  {item.section || "Operating Expense"}
                                </td>
                                <td className="py-1.5 px-4 font-medium text-agm-text">
                                  {item.accountName}
                                </td>
                                <td className="py-1.5 px-4 text-right font-mono text-agm-text">
                                  {item.amount > 0 ? formatNumber(item.amount) : "-"}
                                </td>
                              </tr>
                            ))
                          )}
                          {/* Total Operating Expenses Row */}
                          <tr className="bg-agm-navy/10 text-agm-navy font-bold border-t border-b border-agm-navy/20">
                            <td
                              colSpan={2}
                              className="py-2 px-4 font-bold text-agm-navy"
                            >
                              Total Operating Expenses
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-agm-navy">
                              {formatNumber(totalOperatingExpenses)}
                            </td>
                          </tr>

                          {/* --- NET PROFIT / (LOSS) ROW --- */}
                          <tr className="bg-agm-sidebar text-white font-bold border-t-2 border-agm-green">
                            <td
                              colSpan={2}
                              className="py-2.5 px-4 font-black text-white text-[12.5px]"
                            >
                              Net Profit / (Loss)
                            </td>
                            <td
                              className={`py-2.5 px-4 text-right font-mono font-black text-[12.5px] ${
                                netProfit < 0 ? "text-rose-400" : "text-emerald-300"
                              }`}
                            >
                              {netProfit < 0
                                ? `(${formatNumber(Math.abs(netProfit))})`
                                : formatNumber(netProfit)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Screen Footer */}
                      <div className="pt-6 print:hidden">
                        <QuotationFooter className="!mt-0 !px-0" />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Fixed Print Footer across every single printed page */}
            <div className="print-footer-bottom fixed-print-footer hidden print:block">
              <QuotationFooter />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitLossReport;
