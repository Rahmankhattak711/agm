"use client";

import React, { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  PrintIcon,
  SearchIcon,
} from "@/components/icons";
import { Button } from "@/components/ui";
import { useReceivables } from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { formatNumber } from "./types";

export const AccountsReceivableReport: React.FC = () => {
  const { data: receivables, isLoading } = useReceivables();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBucket, setSelectedBucket] = useState<string>("ALL");

  const items = (receivables as any)?.items || [];
  const aging = receivables?.aging || {
    current: 0,
    days30: 0,
    days60: 0,
    days90Plus: 0,
  };

  const filteredItems = items.filter((item: any) => {
    const matchesSearch =
      item.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.createdByUser?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBucket =
      selectedBucket === "ALL" || item.agingBucket === selectedBucket;

    return matchesSearch && matchesBucket;
  });

  const totalFilteredAmount = filteredItems.reduce(
    (s: number, i: any) => s + (i.remainingBalance ?? i.totalAmount ?? 0),
    0,
  );

  const totalAllReceivables =
    (aging.current || 0) +
    (aging.days30 || 0) +
    (aging.days60 || 0) +
    (aging.days90Plus || 0);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Accounts-Receivable-Aging-Statement",
  });

  const agingPills = [
    { key: "ALL", label: "All Receivables" },
    { key: "current", label: "0–30 Days (Current)" },
    { key: "days30", label: "31–60 Days" },
    { key: "days60", label: "61–90 Days" },
    { key: "days90Plus", label: "90+ Days (Critical)" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2.5 bg-agm-card rounded-2xl border border-agm-box-border shadow-2xs print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <SearchIcon
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-agm-muted"
            />
            <input
              type="text"
              placeholder="Search customer, invoice, project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-agm-box-border bg-agm-box-bg text-agm-text outline-none focus:border-agm-green w-56 sm:w-64"
            />
          </div>

          <div className="inline-flex items-center p-1 bg-agm-box-bg rounded-xl border border-agm-box-border overflow-x-auto">
            {agingPills.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelectedBucket(p.key)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  selectedBucket === p.key
                    ? "bg-agm-card text-agm-navy shadow-xs border border-agm-box-border"
                    : "text-agm-muted hover:text-agm-text"
                }`}
              >
                {p.label}
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
          Print A/R Statement
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-agm-muted animate-pulse space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-agm-green border-t-transparent animate-spin mx-auto" />
          <p>Loading Accounts Receivable statement data...</p>
        </div>
      ) : (
        /* Printable Sheet */
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

                      {/* 2. Title Banner */}
                      <div
                        className="w-full text-center py-2.5 px-4 font-bold text-[13px] print:text-[12.5px] text-white tracking-wide uppercase mb-0 bg-agm-navy"
                        style={{
                          WebkitPrintColorAdjust: "exact",
                          printColorAdjust: "exact",
                        }}
                      >
                        AGM FITOUT TECHNICAL SERVICES LLC - ACCOUNTS RECEIVABLE AGING STATEMENT
                      </div>

                      {/* 4. Table */}
                      <table className="w-full border-collapse text-[12px] print:text-[11.5px] text-agm-text">
                        <thead>
                          <tr className="bg-agm-box-bg font-bold text-agm-text border-b border-agm-box-border">
                            <th className="py-2.5 px-3 text-left font-bold w-[25%]">
                              Customer / Client
                            </th>
                            <th className="py-2.5 px-3 text-left font-bold w-[20%]">
                              Invoice No / Ref
                            </th>
                            <th className="py-2.5 px-3 text-left font-bold w-[20%]">
                              Project
                            </th>
                            <th className="py-2.5 px-3 text-left font-bold w-[15%]">
                              Aging Bracket
                            </th>
                            <th className="py-2.5 px-3 text-right font-bold w-[20%]">
                              Balance Due (AED)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
                                className="py-6 text-center text-agm-muted italic border-b border-agm-box-border"
                              >
                                No open accounts receivable invoices found.
                              </td>
                            </tr>
                          ) : (
                            filteredItems.map((item: any, idx: number) => (
                              <tr
                                key={item.id || idx}
                                className="border-b border-agm-box-border/50 hover:bg-agm-box-bg/50"
                              >
                                <td className="py-1.5 px-3 font-semibold text-agm-text">
                                  {item.customer || "General Customer"}
                                </td>
                                <td className="py-1.5 px-3 font-mono font-medium text-agm-navy">
                                  {item.reference || item.invoiceNumber || "—"}
                                </td>
                                <td className="py-1.5 px-3 text-agm-muted">
                                  {item.project || "—"}
                                </td>
                                <td className="py-1.5 px-3">
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                      item.agingBucket === "days90Plus"
                                        ? "bg-rose-50 text-rose-700"
                                        : item.agingBucket === "days60"
                                          ? "bg-amber-50 text-amber-700"
                                          : "bg-emerald-50 text-emerald-700"
                                    }`}
                                  >
                                    {item.agingBucket === "days90Plus"
                                      ? "90+ Days"
                                      : item.agingBucket === "days60"
                                        ? "61-90 Days"
                                        : item.agingBucket === "days30"
                                          ? "31-60 Days"
                                          : "Current"}
                                  </span>
                                </td>
                                <td className="py-1.5 px-3 text-right font-mono font-bold text-agm-text">
                                  {formatNumber(item.remainingBalance ?? item.totalAmount ?? 0)}
                                </td>
                              </tr>
                            ))
                          )}

                          {/* Total Balance Row */}
                          <tr className="bg-agm-sidebar text-white font-bold border-t-2 border-agm-green">
                            <td colSpan={4} className="py-2.5 px-3 font-black text-white text-[12.5px]">
                              Total Accounts Receivable Outstanding
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-300 text-[12.5px]">
                              {formatNumber(totalFilteredAmount || totalAllReceivables)}
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

export default AccountsReceivableReport;
