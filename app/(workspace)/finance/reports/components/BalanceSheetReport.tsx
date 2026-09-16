"use client";

import React, { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  CalendarIcon,
  LayersIcon,
  PrintIcon,
} from "@/components/icons";
import { Button, DateRangePicker } from "@/components/ui";
import {
  BalanceSheetReport as BalanceSheetData,
  BalanceSheetItem,
  useBalanceSheet,
} from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { formatNumber } from "./types";

interface BalanceSheetReportProps {
  balanceSheet?: BalanceSheetData;
  isLoading?: boolean;
}

export const BalanceSheetReport: React.FC<BalanceSheetReportProps> = ({
  balanceSheet: initialBalanceSheet,
  isLoading: initialLoading = false,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [customDate, setCustomDate] = useState<string>("");
  const [useCustom, setUseCustom] = useState<boolean>(false);

  const endDateParam = useCustom
    ? customDate
    : `${selectedYear}-12-31`;

  const { data: fetchedData, isLoading: fetchLoading } = useBalanceSheet({
    endDate: endDateParam || undefined,
  });

  const balanceSheet = fetchedData || initialBalanceSheet;
  const isLoading = fetchLoading || initialLoading;

  const currentAssetsRows: BalanceSheetItem[] =
    balanceSheet?.currentAssets && balanceSheet.currentAssets.length > 0
      ? balanceSheet.currentAssets
      : [];
  const fixedAssetsRows: BalanceSheetItem[] =
    balanceSheet?.fixedAssets && balanceSheet.fixedAssets.length > 0
      ? balanceSheet.fixedAssets
      : [];
  const currentLiabilitiesRows: BalanceSheetItem[] =
    balanceSheet?.currentLiabilities &&
    balanceSheet.currentLiabilities.length > 0
      ? balanceSheet.currentLiabilities
      : [];
  const equityRows: BalanceSheetItem[] =
    balanceSheet?.equity && balanceSheet.equity.length > 0
      ? balanceSheet.equity
      : [];

  const totalCurrentAssets =
    balanceSheet?.totalCurrentAssets !== undefined
      ? balanceSheet.totalCurrentAssets
      : currentAssetsRows.reduce(
          (s: number, i: BalanceSheetItem) => s + Number(i.amount || 0),
          0,
        );

  const totalFixedAssets =
    balanceSheet?.totalFixedAssets !== undefined
      ? balanceSheet.totalFixedAssets
      : fixedAssetsRows.reduce(
          (s: number, i: BalanceSheetItem) => s + Number(i.amount || 0),
          0,
        );

  const totalAssets =
    balanceSheet?.totalAssets !== undefined
      ? balanceSheet.totalAssets
      : totalCurrentAssets + totalFixedAssets;

  const totalCurrentLiabilities =
    balanceSheet?.totalCurrentLiabilities !== undefined
      ? balanceSheet.totalCurrentLiabilities
      : currentLiabilitiesRows.reduce(
          (s: number, i: BalanceSheetItem) => s + Number(i.amount || 0),
          0,
        );

  const totalLiabilities =
    balanceSheet?.totalLiabilities !== undefined
      ? balanceSheet.totalLiabilities
      : totalCurrentLiabilities;

  const totalEquity =
    balanceSheet?.totalEquity !== undefined
      ? balanceSheet.totalEquity
      : equityRows.reduce(
          (s: number, i: BalanceSheetItem) => s + Number(i.amount || 0),
          0,
        );

  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
  const balanceCheck = totalAssets - totalLiabilitiesAndEquity;

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Balance-Sheet-Report-${useCustom ? customDate : selectedYear}`,
  });

  const statementTitle = useCustom
    ? `AGM FITOUT TECHNICAL SERVICES LLC - BALANCE SHEET AS OF ${customDate}`
    : `AGM FITOUT TECHNICAL SERVICES LLC - BALANCE SHEET ${selectedYear}`;

  return (
    <div className="space-y-6">
      {/* Modern Controls Header Bar (Hidden in Print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2.5 bg-agm-card rounded-2xl border border-agm-box-border shadow-2xs print:hidden">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Year Toggle */}
          <div className="inline-flex items-center p-1 bg-agm-box-bg rounded-xl border border-agm-box-border">
            <button
              type="button"
              onClick={() => {
                setUseCustom(false);
                setCustomDate("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !useCustom
                  ? "bg-agm-card text-agm-navy shadow-xs border border-agm-box-border"
                  : "text-agm-muted hover:text-agm-text hover:bg-white/50"
              }`}
            >
              <CalendarIcon
                size={13}
                className={!useCustom ? "text-agm-green" : "text-agm-muted"}
              />
              <span>Year Ended</span>
            </button>

            {!useCustom && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="ml-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-agm-box-border bg-agm-card text-agm-text shadow-2xs outline-none focus:border-agm-green cursor-pointer"
              >
                {[2023, 2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => {
                setUseCustom(false);
                setSelectedYear(new Date().getFullYear());
                setCustomDate("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !useCustom && selectedYear === new Date().getFullYear()
                  ? "bg-agm-card text-agm-navy shadow-xs border border-agm-box-border"
                  : "text-agm-muted hover:text-agm-text hover:bg-white/50"
              }`}
            >
              <LayersIcon
                size={13}
                className={
                  !useCustom && selectedYear === new Date().getFullYear()
                    ? "text-agm-green"
                    : "text-agm-muted"
                }
              />
              <span>Current Year</span>
            </button>
          </div>

          {/* Modern Date Picker */}
          <DateRangePicker
            startDate={customDate}
            endDate={customDate}
            placeholder="As of Date"
            onChange={({ endDate }) => {
              if (endDate) {
                setCustomDate(endDate);
                setUseCustom(true);
              } else {
                setCustomDate("");
                setUseCustom(false);
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
          Print Balance Sheet
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-agm-muted animate-pulse space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-agm-green border-t-transparent animate-spin mx-auto" />
          <p>Loading Balance Sheet statement data...</p>
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

                      {/* 4. Balance Sheet Table */}
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
                          {/* --- ASSETS CATEGORY --- */}
                          <tr className="bg-agm-green-soft text-agm-green-dark border-t border-b border-agm-box-border">
                            <td
                              colSpan={3}
                              className="py-1.5 px-4 font-bold text-agm-green-dark text-[11.5px] uppercase tracking-wider"
                            >
                              ASSETS
                            </td>
                          </tr>

                          {/* Current Assets */}
                          {currentAssetsRows.length === 0 ? (
                            <tr className="border-b border-agm-box-border/50">
                              <td className="py-1.5 px-4 text-agm-muted">
                                Current Asset
                              </td>
                              <td className="py-1.5 px-4 font-medium text-agm-text">
                                Operating Bank Account
                              </td>
                              <td className="py-1.5 px-4 text-right font-mono text-agm-muted">
                                -
                              </td>
                            </tr>
                          ) : (
                            currentAssetsRows.map((item, idx) => (
                              <tr
                                key={`ca-${idx}`}
                                className="border-b border-agm-box-border/50 hover:bg-agm-box-bg/50"
                              >
                                <td className="py-1.5 px-4 text-agm-muted">
                                  {item.section || "Current Asset"}
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

                          {/* Fixed Assets */}
                          {fixedAssetsRows.length === 0 ? (
                            <tr className="border-b border-agm-box-border/50">
                              <td className="py-1.5 px-4 text-agm-muted">Fixed Asset</td>
                              <td className="py-1.5 px-4 font-medium text-agm-text">
                                Equipment &amp; Vehicles
                              </td>
                              <td className="py-1.5 px-4 text-right font-mono text-agm-muted">
                                -
                              </td>
                            </tr>
                          ) : (
                            fixedAssetsRows.map((item, idx) => (
                              <tr
                                key={`fa-${idx}`}
                                className="border-b border-agm-box-border/50 hover:bg-agm-box-bg/50"
                              >
                                <td className="py-1.5 px-4 text-agm-muted">
                                  {item.section || "Fixed Asset"}
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

                          {/* Total Assets Row */}
                          <tr className="bg-agm-green/10 text-agm-green-dark font-bold border-t border-b border-agm-green/20">
                            <td
                              colSpan={2}
                              className="py-2 px-4 font-bold text-agm-green-dark"
                            >
                              Total Assets
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-agm-green-dark">
                              {formatNumber(totalAssets)}
                            </td>
                          </tr>

                          {/* --- LIABILITIES CATEGORY --- */}
                          <tr className="bg-agm-box-bg text-agm-navy border-t border-b border-agm-box-border">
                            <td
                              colSpan={3}
                              className="py-2 px-4 font-bold text-agm-navy text-[11.5px] uppercase tracking-wider"
                            >
                              LIABILITIES
                            </td>
                          </tr>

                          {currentLiabilitiesRows.length === 0 ? (
                            <tr className="border-b border-agm-box-border/50">
                              <td className="py-1.5 px-4 text-agm-muted">
                                Current Liability
                              </td>
                              <td className="py-1.5 px-4 font-medium text-agm-text">
                                Accounts Payable &amp; Accruals
                              </td>
                              <td className="py-1.5 px-4 text-right font-mono text-agm-muted">
                                -
                              </td>
                            </tr>
                          ) : (
                            currentLiabilitiesRows.map((item, idx) => (
                              <tr
                                key={`cl-${idx}`}
                                className="border-b border-agm-box-border/50 hover:bg-agm-box-bg/50"
                              >
                                <td className="py-1.5 px-4 text-agm-muted">
                                  {item.section || "Current Liability"}
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

                          {/* Total Liabilities Row */}
                          <tr className="bg-agm-navy/10 text-agm-navy font-bold border-t border-b border-agm-navy/20">
                            <td
                              colSpan={2}
                              className="py-2 px-4 font-bold text-agm-navy"
                            >
                              Total Liabilities
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-agm-navy">
                              {formatNumber(totalLiabilities)}
                            </td>
                          </tr>

                          {/* --- EQUITY CATEGORY --- */}
                          <tr className="bg-agm-box-bg text-agm-navy border-t border-b border-agm-box-border">
                            <td
                              colSpan={3}
                              className="py-2 px-4 font-bold text-agm-navy text-[11.5px] uppercase tracking-wider"
                            >
                              EQUITY
                            </td>
                          </tr>

                          {equityRows.length === 0 ? (
                            <tr className="border-b border-agm-box-border/50">
                              <td className="py-1.5 px-4 text-agm-muted">Equity</td>
                              <td className="py-1.5 px-4 font-medium text-agm-text">
                                Owner Capital
                              </td>
                              <td className="py-1.5 px-4 text-right font-mono text-agm-muted">
                                -
                              </td>
                            </tr>
                          ) : (
                            equityRows.map((item, idx) => {
                              const isCurrentYear =
                                item.section === "Retained Earnings" ||
                                item.accountName.toLowerCase().includes("earning") ||
                                item.accountName.toLowerCase().includes("profit");

                              return (
                                <tr
                                  key={`eq-${idx}`}
                                  className="border-b border-agm-box-border/50 hover:bg-agm-box-bg/50"
                                >
                                  <td className="py-1.5 px-4 text-agm-muted">
                                    {isCurrentYear
                                      ? "Current Year"
                                      : item.section || "Equity"}
                                  </td>
                                  <td className="py-1.5 px-4 font-medium text-agm-text">
                                    {isCurrentYear
                                      ? "Current Year Profit / (Loss)"
                                      : item.accountName}
                                  </td>
                                  <td
                                    className={`py-1.5 px-4 text-right font-mono ${
                                      item.amount < 0
                                        ? "text-rose-600 font-bold"
                                        : "text-agm-text"
                                    }`}
                                  >
                                    {item.amount < 0
                                      ? `(${formatNumber(Math.abs(item.amount))})`
                                      : item.amount > 0
                                        ? formatNumber(item.amount)
                                        : "-"}
                                  </td>
                                </tr>
                              );
                            })
                          )}

                          {/* Total Equity Row */}
                          <tr className="bg-agm-navy/10 text-agm-navy font-bold border-t border-b border-agm-navy/20">
                            <td
                              colSpan={2}
                              className="py-2 px-4 font-bold text-agm-navy"
                            >
                              Total Equity
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-agm-navy">
                              {formatNumber(totalEquity)}
                            </td>
                          </tr>

                          {/* --- LIABILITIES + EQUITY ROW --- */}
                          <tr className="bg-agm-sidebar text-white font-bold border-t-2 border-agm-green">
                            <td
                              colSpan={2}
                              className="py-2.5 px-4 font-black text-white text-[12.5px]"
                            >
                              Liabilities + Equity
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-300 text-[12.5px]">
                              {formatNumber(totalLiabilitiesAndEquity)}
                            </td>
                          </tr>

                          {/* --- BALANCE CHECK ROW --- */}
                          <tr className="bg-emerald-700 text-white font-bold border-t border-emerald-600">
                            <td
                              colSpan={2}
                              className="py-2 px-4 font-bold text-white text-[12px]"
                            >
                              Balance Check
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-white text-[12px]">
                              {formatNumber(balanceCheck)}
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

export default BalanceSheetReport;
