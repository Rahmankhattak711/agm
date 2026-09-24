"use client";

import React, { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { PrintIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import {
  ChartOfAccount,
  LedgerReport as LedgerData,
} from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { formatNumber } from "./types";

type LedgerLine = NonNullable<LedgerData["lines"]>[number];

interface GeneralLedgerReportProps {
  accounts?: ChartOfAccount[];
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
  selectedAccount?: ChartOfAccount;
  ledger?: LedgerData;
  isLoading: boolean;
}

export const GeneralLedgerReport: React.FC<GeneralLedgerReportProps> = ({
  accounts = [],
  selectedAccountId,
  setSelectedAccountId,
  selectedAccount,
  ledger,
  isLoading,
}) => {
  const lines: LedgerLine[] = ledger?.lines || [];
  const totalDebit = Number(ledger?.totalDebit || 0);
  const totalCredit = Number(ledger?.totalCredit || 0);
  const netBalance = Number(
    ledger?.netBalance !== undefined ? ledger.netBalance : ledger?.balance || 0,
  );

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `General-Ledger-${selectedAccount?.accountCode || "Report"}`,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2.5 bg-agm-card rounded-2xl border border-agm-box-border shadow-2xs print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-bold text-agm-muted">
            Select GL Account:
          </label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-agm-box-border bg-agm-card text-agm-text outline-none focus:border-agm-green w-64 sm:w-80 shadow-2xs cursor-pointer"
          >
            <option value="">— Select an Account to View Ledger —</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.accountCode} - {acc.accountName} ({acc.type})
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePrint()}
          disabled={!selectedAccountId}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-agm-text border-agm-box-border bg-agm-card hover:bg-agm-box-bg cursor-pointer shadow-2xs rounded-xl h-auto shrink-0 disabled:opacity-50"
          icon={<PrintIcon size={14} />}
        >
          Print Ledger Statement
        </Button>
      </div>

      {!selectedAccountId ? (
        <div className="py-20 text-center text-xs text-agm-muted bg-agm-card rounded-2xl border border-agm-box-border p-8">
          <p className="font-semibold text-agm-text text-sm mb-1">
            No Account Selected
          </p>
          <p>
            Please choose a Chart of Accounts code from the dropdown above to
            view its General Ledger activity.
          </p>
        </div>
      ) : isLoading ? (
        <div className="py-20 text-center text-xs text-agm-muted animate-pulse space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-agm-green border-t-transparent animate-spin mx-auto" />
          <p>Loading General Ledger transactions...</p>
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
                        AGM FITOUT TECHNICAL SERVICES LLC - GENERAL LEDGER
                        STATEMENT ({selectedAccount?.accountCode} -{" "}
                        {selectedAccount?.accountName})
                      </div>

                      <table className="w-full border-collapse text-[12px] print:text-[11.5px] text-agm-text">
                        <thead>
                          <tr className="bg-agm-box-bg font-bold text-agm-text border-b border-agm-box-border">
                            <th className="py-2.5 px-3 text-left font-bold w-[12%]">
                              Date
                            </th>
                            <th className="py-2.5 px-3 text-left font-bold w-[14%]">
                              Entry #
                            </th>
                            <th className="py-2.5 px-3 text-left font-bold w-[34%]">
                              Description &amp; Reference
                            </th>
                            <th className="py-2.5 px-3 text-right font-bold w-[13%]">
                              Debit (AED)
                            </th>
                            <th className="py-2.5 px-3 text-right font-bold w-[13%]">
                              Credit (AED)
                            </th>
                            <th className="py-2.5 px-3 text-right font-bold w-[14%]">
                              Balance (AED)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="py-8 text-center text-agm-muted italic border-b border-agm-box-border"
                              >
                                No transactions recorded for this account.
                              </td>
                            </tr>
                          ) : (
                            lines.map((line: any, idx: number) => (
                              <tr
                                key={line.id || idx}
                                className="border-b border-agm-box-border/50 hover:bg-agm-box-bg/50"
                              >
                                <td className="py-1.5 px-3 font-mono text-agm-muted">
                                  {line.entryDate
                                    ? new Date(
                                        line.entryDate,
                                      ).toLocaleDateString("en-GB")
                                    : "—"}
                                </td>
                                <td className="py-1.5 px-3 font-mono font-medium text-agm-navy">
                                  {line.entryNumber || "—"}
                                </td>
                                <td className="py-1.5 px-3 font-medium text-agm-text">
                                  {line.description || line.memo || "—"}
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono text-agm-text">
                                  {Number(line.debit || 0) > 0
                                    ? formatNumber(line.debit)
                                    : "-"}
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono text-agm-text">
                                  {Number(line.credit || 0) > 0
                                    ? formatNumber(line.credit)
                                    : "-"}
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono font-bold text-agm-text">
                                  {formatNumber(
                                    line.runningBalance ?? line.balance ?? 0,
                                  )}
                                </td>
                              </tr>
                            ))
                          )}

                          <tr className="bg-agm-navy/10 text-agm-navy font-bold border-t border-b border-agm-navy/20">
                            <td
                              colSpan={3}
                              className="py-2 px-3 font-bold text-agm-navy"
                            >
                              Total Period Activity
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-agm-navy">
                              {formatNumber(totalDebit)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-agm-navy">
                              {formatNumber(totalCredit)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-agm-navy">
                              —
                            </td>
                          </tr>

                          <tr className="bg-agm-sidebar text-white font-bold border-t-2 border-agm-green">
                            <td
                              colSpan={5}
                              className="py-2.5 px-3 font-black text-white text-[12.5px]"
                            >
                              Net Closing Balance
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-300 text-[12.5px]">
                              {formatNumber(netBalance)}
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

export default GeneralLedgerReport;
