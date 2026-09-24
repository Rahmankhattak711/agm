"use client";

import React, { useState, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { PrintIcon, SearchIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import {
  TrialBalanceReport as TrialBalanceData,
  TrialBalanceRow,
} from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { formatNumber } from "./types";

interface TrialBalanceReportProps {
  trialBalance?: TrialBalanceData;
  isLoading: boolean;
}

export const TrialBalanceReport: React.FC<TrialBalanceReportProps> = ({
  trialBalance,
  isLoading,
}) => {
  const [tbSearch, setTbSearch] = useState<string>("");
  const [tbTypeFilter, setTbTypeFilter] = useState<string>("ALL");

  const allRows: TrialBalanceRow[] = useMemo(
    () => trialBalance?.rows || [],
    [trialBalance?.rows],
  );

  const filteredRows = useMemo(() => {
    return allRows.filter((r: TrialBalanceRow) => {
      const matchesSearch =
        !tbSearch ||
        (r.accountName &&
          r.accountName.toLowerCase().includes(tbSearch.toLowerCase())) ||
        (r.accountCode &&
          r.accountCode.toLowerCase().includes(tbSearch.toLowerCase()));
      const matchesType =
        tbTypeFilter === "ALL" ||
        (r.type && r.type.toUpperCase() === tbTypeFilter);
      return matchesSearch && matchesType;
    });
  }, [allRows, tbSearch, tbTypeFilter]);

  const totalDebit =
    trialBalance?.totalDebit !== undefined
      ? trialBalance.totalDebit
      : allRows.reduce(
          (s: number, r: TrialBalanceRow) => s + Number(r.debit || 0),
          0,
        );
  const totalCredit =
    trialBalance?.totalCredit !== undefined
      ? trialBalance.totalCredit
      : allRows.reduce(
          (s: number, r: TrialBalanceRow) => s + Number(r.credit || 0),
          0,
        );
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;

  const typeFilterOptions = [
    { id: "ALL", label: "All Accounts" },
    { id: "ASSET", label: "Assets" },
    { id: "LIABILITY", label: "Liabilities" },
    { id: "EQUITY", label: "Equity" },
    { id: "REVENUE", label: "Revenue" },
    { id: "EXPENSE", label: "Expenses" },
  ];

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Trial-Balance-Statement",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2.5 bg-agm-card rounded-2xl border border-agm-box-border shadow-2xs print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <SearchIcon
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-agm-muted"
            />
            <input
              type="text"
              placeholder="Search code or account..."
              value={tbSearch}
              onChange={(e) => setTbSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-agm-box-border bg-agm-box-bg text-agm-text outline-none focus:border-agm-green w-48 sm:w-56"
            />
          </div>

          <div className="inline-flex items-center p-1 bg-agm-box-bg rounded-xl border border-agm-box-border overflow-x-auto">
            {typeFilterOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTbTypeFilter(opt.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  tbTypeFilter === opt.id
                    ? "bg-agm-card text-agm-navy shadow-xs border border-agm-box-border"
                    : "text-agm-muted hover:text-agm-text"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePrint()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-agm-text border-agm-box-border bg-agm-card hover:bg-agm-box-bg cursor-pointer shadow-2xs rounded-xl h-auto shrink-0"
          icon={<PrintIcon size={14} />}
        >
          Print Trial Balance
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-agm-muted animate-pulse space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-agm-green border-t-transparent animate-spin mx-auto" />
          <p>Loading Trial Balance data...</p>
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
                    <div className="space-y-0">
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
                        AGM FITOUT TECHNICAL SERVICES LLC - TRIAL BALANCE
                        STATEMENT
                      </div>

                      <table className="w-full border-collapse text-[12px] print:text-[11.5px] text-agm-text">
                        <thead>
                          <tr className="bg-agm-box-bg font-bold text-agm-text border-b border-agm-box-border">
                            <th className="py-2.5 px-3 text-left font-bold w-[15%]">
                              Code
                            </th>
                            <th className="py-2.5 px-3 text-left font-bold w-[45%]">
                              Account Name
                            </th>
                            <th className="py-2.5 px-3 text-left font-bold w-[16%]">
                              Type
                            </th>
                            <th className="py-2.5 px-3 text-right font-bold w-[12%]">
                              Debit (AED)
                            </th>
                            <th className="py-2.5 px-3 text-right font-bold w-[12%]">
                              Credit (AED)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRows.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="py-6 text-center text-agm-muted italic border-b border-agm-box-border"
                              >
                                No trial balance account transactions found.
                              </td>
                            </tr>
                          ) : (
                            filteredRows.map(
                              (row: TrialBalanceRow, idx: number) => (
                                <tr
                                  key={row.accountCode || idx}
                                  className="border-b border-agm-box-border/50 hover:bg-agm-box-bg/50"
                                >
                                  <td className="py-1.5 px-3 font-mono font-medium text-agm-muted">
                                    {row.accountCode}
                                  </td>
                                  <td className="py-1.5 px-3 font-medium text-agm-text">
                                    {row.accountName}
                                  </td>
                                  <td className="py-1.5 px-3 text-agm-muted font-medium text-[11px] uppercase">
                                    {row.type}
                                  </td>
                                  <td className="py-1.5 px-3 text-right font-mono text-agm-text font-semibold">
                                    {Number(row.debit || 0) > 0
                                      ? formatNumber(row.debit)
                                      : "-"}
                                  </td>
                                  <td className="py-1.5 px-3 text-right font-mono text-agm-text font-semibold">
                                    {Number(row.credit || 0) > 0
                                      ? formatNumber(row.credit)
                                      : "-"}
                                  </td>
                                </tr>
                              ),
                            )
                          )}

                          <tr className="bg-agm-navy/10 text-agm-navy font-bold border-t border-b border-agm-navy/20">
                            <td
                              colSpan={3}
                              className="py-2 px-3 font-bold text-agm-navy"
                            >
                              Total Debits &amp; Credits
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-agm-navy">
                              {formatNumber(totalDebit)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-agm-navy">
                              {formatNumber(totalCredit)}
                            </td>
                          </tr>

                          <tr
                            className={`${
                              isBalanced ? "bg-emerald-700" : "bg-rose-700"
                            } text-white font-bold border-t border-b`}
                          >
                            <td
                              colSpan={3}
                              className="py-2 px-3 font-bold text-white"
                            >
                              Balance Audit:{" "}
                              {isBalanced
                                ? "In Balance (Debit = Credit)"
                                : "Out of Balance"}
                            </td>
                            <td
                              colSpan={2}
                              className="py-2 px-3 text-right font-mono font-black text-white"
                            >
                              Variance: {formatNumber(difference)} AED
                            </td>
                          </tr>
                        </tbody>
                      </table>

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

export default TrialBalanceReport;
