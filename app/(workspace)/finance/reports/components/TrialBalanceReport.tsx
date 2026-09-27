"use client";

import React, { useState, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { PrintIcon, ChevronDownIcon, ChevronUpIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import {
  TrialBalanceReport as TrialBalanceData,
  TrialBalanceRow,
  useTrialBalance,
} from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { formatNumber } from "./types";

interface TrialBalanceReportProps {
  trialBalance?: TrialBalanceData;
  isLoading?: boolean;
}

export const TrialBalanceReport: React.FC<TrialBalanceReportProps> = ({
  trialBalance: propTrialBalance,
  isLoading: propLoading = false,
}) => {
  const { data: fetchedTrialBalance, isLoading: fetchLoading } =
    useTrialBalance();
  const trialBalance = propTrialBalance || fetchedTrialBalance;
  const isLoading = propLoading || (fetchLoading && !propTrialBalance);

  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(
    null,
  );
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(
    null,
  );
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(
    null,
  );

  const allRows: TrialBalanceRow[] = useMemo(
    () => trialBalance?.rows || [],
    [trialBalance?.rows],
  );

  const allProjects = useMemo(
    () => trialBalance?.projects || [],
    [trialBalance?.projects],
  );

  const allCustomers = useMemo(
    () => trialBalance?.customers || [],
    [trialBalance?.customers],
  );

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

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "AGM-Trial-Balance-Complete-Statement",
  });

  const toggleProject = (id: string) => {
    setExpandedProjectId((prev) => (prev === id ? null : id));
  };

  const toggleCustomer = (id: string) => {
    setExpandedCustomerId((prev) => (prev === id ? null : id));
  };

  const toggleAccount = (id: string) => {
    setExpandedAccountId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 p-3 bg-agm-card rounded-2xl border border-agm-box-border shadow-2xs print:hidden">
        <div>
          <h3 className="text-sm font-bold text-agm-navy">
            Trial Balance &amp; Statutory Statement
          </h3>
          <p className="text-xs text-slate-500">
            Click on any project or customer row to expand detailed
            transactions, labor, invoices, and payment receipts.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePrint()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-agm-text border-agm-box-border bg-agm-card hover:bg-agm-box-bg cursor-pointer shadow-2xs rounded-xl h-auto shrink-0"
          icon={<PrintIcon size={14} />}
        >
          Print Statement
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
            className="w-full max-w-[1000px] bg-agm-card border border-agm-box-border shadow-md rounded-xl p-8 sm:p-10 space-y-0 print:p-0 print:m-0 print:border-none print:shadow-none print:max-w-none text-agm-text"
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
                        <span>VAT Registration No: 104094432200003</span>
                      </div>

                      <div className="space-y-2">
                        <div
                          className="w-full text-center py-2.5 px-4 font-bold text-[13px] print:text-[12.5px] text-white tracking-wide uppercase bg-agm-navy"
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
                              <th className="py-2.5 px-3 text-left font-bold w-[14%]">
                                Code
                              </th>
                              <th className="py-2.5 px-3 text-left font-bold w-[46%]">
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
                            {allRows.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="py-6 text-center text-agm-muted italic border-b border-agm-box-border"
                                >
                                  No trial balance account transactions found.
                                </td>
                              </tr>
                            ) : (
                              allRows.map(
                                (row: TrialBalanceRow, idx: number) => {
                                  const accKey =
                                    row.accountId ||
                                    row.accountCode ||
                                    `tb-${idx}`;
                                  const isExpanded =
                                    expandedAccountId === accKey;
                                  return (
                                    <React.Fragment key={accKey}>
                                      <tr
                                        onClick={() => toggleAccount(accKey)}
                                        className={`border-b border-agm-box-border/50 hover:bg-slate-100/80 cursor-pointer transition-colors ${
                                          isExpanded
                                            ? "bg-slate-100/90 font-semibold"
                                            : ""
                                        }`}
                                      >
                                        <td className="py-2 px-3 font-mono font-medium text-agm-muted">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-slate-400 print:hidden">
                                              {isExpanded ? (
                                                <ChevronUpIcon size={12} />
                                              ) : (
                                                <ChevronDownIcon size={12} />
                                              )}
                                            </span>
                                            <span>{row.accountCode}</span>
                                          </div>
                                        </td>
                                        <td className="py-2 px-3 font-medium text-agm-text">
                                          {row.accountName}
                                        </td>
                                        <td className="py-2 px-3 text-agm-muted font-medium text-[11px] uppercase">
                                          {row.type}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono text-agm-text font-semibold">
                                          {Number(row.debit || 0) > 0
                                            ? formatNumber(row.debit)
                                            : "-"}
                                        </td>
                                        <td className="py-2 px-3 text-right font-mono text-agm-text font-semibold">
                                          {Number(row.credit || 0) > 0
                                            ? formatNumber(row.credit)
                                            : "-"}
                                        </td>
                                      </tr>
                                      {isExpanded && (
                                        <tr className="bg-slate-50 border-b-2 border-slate-200">
                                          <td colSpan={5} className="p-3.5">
                                            {row.details &&
                                            row.details.length > 0 ? (
                                              <div className="space-y-2">
                                                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                                  <span>
                                                    Account Sub-Ledger &amp;
                                                    Source Transactions
                                                  </span>
                                                  <span className="text-slate-500 font-normal">
                                                    ({row.details.length}{" "}
                                                    Records)
                                                  </span>
                                                </div>
                                                <table className="w-full bg-white rounded-lg border border-slate-200 text-[11px] border-collapse">
                                                  <thead>
                                                    <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                                                      <th className="py-1.5 px-3 text-left w-[14%]">
                                                        Date
                                                      </th>
                                                      <th className="py-1.5 px-3 text-left w-[18%]">
                                                        Reference
                                                      </th>
                                                      <th className="py-1.5 px-3 text-left w-[24%]">
                                                        Counterparty / Name
                                                      </th>
                                                      <th className="py-1.5 px-3 text-left w-[24%]">
                                                        Description
                                                      </th>
                                                      <th className="py-1.5 px-3 text-right w-[10%]">
                                                        Debit (AED)
                                                      </th>
                                                      <th className="py-1.5 px-3 text-right w-[10%]">
                                                        Credit (AED)
                                                      </th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {row.details.map(
                                                      (d, dIdx) => (
                                                        <tr
                                                          key={
                                                            d.id ||
                                                            `tb-d-${dIdx}`
                                                          }
                                                          className="border-b border-slate-100 hover:bg-slate-50/80"
                                                        >
                                                          <td className="py-1.5 px-3 text-slate-500 whitespace-nowrap">
                                                            {d.date || "-"}
                                                          </td>
                                                          <td className="py-1.5 px-3 font-mono font-bold text-slate-800">
                                                            {d.reference || "-"}
                                                          </td>
                                                          <td className="py-1.5 px-3 text-slate-700 font-medium">
                                                            {d.partyName || "-"}
                                                          </td>
                                                          <td className="py-1.5 px-3 text-slate-600">
                                                            {d.description ||
                                                              "-"}
                                                          </td>
                                                          <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-800">
                                                            {d.debit &&
                                                            d.debit > 0
                                                              ? formatNumber(
                                                                  d.debit,
                                                                )
                                                              : "-"}
                                                          </td>
                                                          <td className="py-1.5 px-3 text-right font-mono font-medium text-slate-800">
                                                            {d.credit &&
                                                            d.credit > 0
                                                              ? formatNumber(
                                                                  d.credit,
                                                                )
                                                              : "-"}
                                                          </td>
                                                        </tr>
                                                      ),
                                                    )}
                                                  </tbody>
                                                </table>
                                              </div>
                                            ) : (
                                              <div className="text-center py-2 text-xs text-slate-500 italic">
                                                No sub-ledger records available
                                                for this account.
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                },
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
                      </div>

                      <div className="space-y-2 pt-2">
                        <div
                          className="w-full text-center py-2.5 px-4 font-bold text-[13px] print:text-[12.5px] text-white tracking-wide uppercase bg-agm-navy"
                          style={{
                            WebkitPrintColorAdjust: "exact",
                            printColorAdjust: "exact",
                          }}
                        >
                          ACTIVE PROJECTS &amp; COMMERCIAL COST-CENTER STATEMENT
                        </div>

                        <table className="w-full border-collapse text-[12px] print:text-[11.5px] text-agm-text">
                          <thead>
                            <tr className="bg-agm-box-bg font-bold text-agm-text border-b border-agm-box-border">
                              <th className="py-2.5 px-3 text-left font-bold w-[12%]">
                                Code
                              </th>
                              <th className="py-2.5 px-3 text-left font-bold w-[28%]">
                                Project / Client
                              </th>
                              <th className="py-2.5 px-3 text-right font-bold w-[15%]">
                                Contract (AED)
                              </th>
                              <th className="py-2.5 px-3 text-right font-bold w-[15%]">
                                Invoiced (AED)
                              </th>
                              <th className="py-2.5 px-3 text-right font-bold w-[15%]">
                                Costs (AED)
                              </th>
                              <th className="py-2.5 px-3 text-right font-bold w-[15%]">
                                Margin %
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {allProjects.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={6}
                                  className="py-6 text-center text-agm-muted italic border-b border-agm-box-border"
                                >
                                  No active project balances recorded.
                                </td>
                              </tr>
                            ) : (
                              allProjects.map((p) => {
                                const isExpanded = expandedProjectId === p.id;
                                return (
                                  <React.Fragment key={p.id}>
                                    <tr
                                      onClick={() => toggleProject(p.id)}
                                      className={`border-b border-agm-box-border/50 hover:bg-slate-100/80 cursor-pointer transition-colors ${
                                        isExpanded
                                          ? "bg-slate-100/90 font-semibold"
                                          : ""
                                      }`}
                                    >
                                      <td className="py-2 px-3 font-mono font-bold text-slate-700">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-slate-400 print:hidden">
                                            {isExpanded ? (
                                              <ChevronUpIcon size={12} />
                                            ) : (
                                              <ChevronDownIcon size={12} />
                                            )}
                                          </span>
                                          <span>{p.code}</span>
                                        </div>
                                      </td>
                                      <td className="py-2 px-3">
                                        <div className="font-bold text-slate-900">
                                          {p.name}
                                        </div>
                                        <div className="text-[10.5px] text-slate-500">
                                          Client: {p.customerName}
                                        </div>
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-medium">
                                        {formatNumber(p.contractValue)}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                                        {formatNumber(p.invoicedAmount)}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-800">
                                        {formatNumber(p.directCost)}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-black">
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[11px] ${
                                            p.marginPercent >= 20
                                              ? "bg-emerald-100 text-emerald-800"
                                              : p.marginPercent > 0
                                                ? "bg-amber-100 text-amber-800"
                                                : "bg-rose-100 text-rose-800"
                                          }`}
                                        >
                                          {p.marginPercent}%
                                        </span>
                                      </td>
                                    </tr>

                                    {isExpanded && (
                                      <tr className="bg-slate-50 border-b-2 border-slate-200">
                                        <td
                                          colSpan={6}
                                          className="p-3.5 space-y-3"
                                        >
                                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                            <div className="p-2 bg-white rounded-lg border border-slate-200">
                                              <div className="text-[10px] text-slate-500 uppercase font-bold">
                                                Material Costs
                                              </div>
                                              <div className="font-mono font-bold text-slate-900 mt-0.5">
                                                {formatNumber(
                                                  p.materialCost || 0,
                                                )}{" "}
                                                AED
                                              </div>
                                            </div>
                                            <div className="p-2 bg-white rounded-lg border border-slate-200">
                                              <div className="text-[10px] text-slate-500 uppercase font-bold">
                                                Labor &amp; Workforce
                                              </div>
                                              <div className="font-mono font-bold text-blue-900 mt-0.5">
                                                {formatNumber(p.laborCost || 0)}{" "}
                                                AED
                                              </div>
                                            </div>
                                            <div className="p-2 bg-white rounded-lg border border-slate-200">
                                              <div className="text-[10px] text-slate-500 uppercase font-bold">
                                                Direct Site Costs
                                              </div>
                                              <div className="font-mono font-bold text-rose-900 mt-0.5">
                                                {formatNumber(
                                                  p.actualCost || 0,
                                                )}{" "}
                                                AED
                                              </div>
                                            </div>
                                            <div className="p-2 bg-white rounded-lg border border-slate-200">
                                              <div className="text-[10px] text-slate-500 uppercase font-bold">
                                                Gross Profit / Margin
                                              </div>
                                              <div className="font-mono font-bold text-emerald-900 mt-0.5">
                                                {formatNumber(
                                                  p.grossMargin || 0,
                                                )}{" "}
                                                AED ({p.marginPercent}%)
                                              </div>
                                            </div>
                                          </div>

                                          {p.costs && p.costs.length > 0 && (
                                            <div className="space-y-1.5">
                                              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                                Itemized Cost Breakdown (
                                                {p.costs.length} Entries)
                                              </div>
                                              <table className="w-full bg-white rounded-lg border border-slate-200 text-[11px]">
                                                <thead>
                                                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                                    <th className="py-1 px-2.5 text-left">
                                                      Description
                                                    </th>
                                                    <th className="py-1 px-2.5 text-left">
                                                      Type
                                                    </th>
                                                    <th className="py-1 px-2.5 text-center">
                                                      Date
                                                    </th>
                                                    <th className="py-1 px-2.5 text-right">
                                                      Amount (AED)
                                                    </th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {p.costs.map((c, cIdx) => (
                                                    <tr
                                                      key={c.id || cIdx}
                                                      className="border-b border-slate-100"
                                                    >
                                                      <td className="py-1 px-2.5 text-slate-800 font-medium">
                                                        {c.description}
                                                      </td>
                                                      <td className="py-1 px-2.5 text-slate-500 uppercase font-mono text-[10px]">
                                                        {c.costType}
                                                      </td>
                                                      <td className="py-1 px-2.5 text-center text-slate-500 font-mono text-[10px]">
                                                        {c.date || "—"}
                                                      </td>
                                                      <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900">
                                                        {formatNumber(c.amount)}
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}

                                          {p.invoices &&
                                            p.invoices.length > 0 && (
                                              <div className="space-y-1.5">
                                                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                                  Project Invoices &amp; Billing
                                                </div>
                                                <table className="w-full bg-white rounded-lg border border-slate-200 text-[11px]">
                                                  <thead>
                                                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                                      <th className="py-1 px-2.5 text-left">
                                                        Invoice No
                                                      </th>
                                                      <th className="py-1 px-2.5 text-center">
                                                        Date
                                                      </th>
                                                      <th className="py-1 px-2.5 text-center">
                                                        Status
                                                      </th>
                                                      <th className="py-1 px-2.5 text-right">
                                                        Total Amount (AED)
                                                      </th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {p.invoices.map(
                                                      (inv, iIdx) => (
                                                        <tr
                                                          key={inv.id || iIdx}
                                                          className="border-b border-slate-100"
                                                        >
                                                          <td className="py-1 px-2.5 font-mono font-bold text-slate-800">
                                                            {inv.invoiceNumber}
                                                          </td>
                                                          <td className="py-1 px-2.5 text-center text-slate-500 font-mono text-[10px]">
                                                            {inv.invoiceDate ||
                                                              "—"}
                                                          </td>
                                                          <td className="py-1 px-2.5 text-center">
                                                            <span
                                                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                                                inv.status ===
                                                                "PAID"
                                                                  ? "bg-emerald-100 text-emerald-800"
                                                                  : "bg-amber-100 text-amber-800"
                                                              }`}
                                                            >
                                                              {inv.status}
                                                            </span>
                                                          </td>
                                                          <td className="py-1 px-2.5 text-right font-mono font-bold text-emerald-800">
                                                            {formatNumber(
                                                              inv.totalAmount,
                                                            )}
                                                          </td>
                                                        </tr>
                                                      ),
                                                    )}
                                                  </tbody>
                                                </table>
                                              </div>
                                            )}
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div
                          className="w-full text-center py-2.5 px-4 font-bold text-[13px] print:text-[12.5px] text-white tracking-wide uppercase bg-agm-navy"
                          style={{
                            WebkitPrintColorAdjust: "exact",
                            printColorAdjust: "exact",
                          }}
                        >
                          CUSTOMERS SUB-LEDGER &amp; RECEIVABLES POSITION
                        </div>

                        <table className="w-full border-collapse text-[12px] print:text-[11.5px] text-agm-text">
                          <thead>
                            <tr className="bg-agm-box-bg font-bold text-agm-text border-b border-agm-box-border">
                              <th className="py-2.5 px-3 text-left font-bold w-[35%]">
                                Customer / Company
                              </th>
                              <th className="py-2.5 px-3 text-left font-bold w-[20%]">
                                Contact / Email
                              </th>
                              <th className="py-2.5 px-3 text-right font-bold w-[15%]">
                                Billed (AED)
                              </th>
                              <th className="py-2.5 px-3 text-right font-bold w-[15%]">
                                Collected (AED)
                              </th>
                              <th className="py-2.5 px-3 text-right font-bold w-[15%]">
                                Balance (AED)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {allCustomers.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="py-6 text-center text-agm-muted italic border-b border-agm-box-border"
                                >
                                  No customer subledger data found.
                                </td>
                              </tr>
                            ) : (
                              allCustomers.map((c) => {
                                const isExpanded = expandedCustomerId === c.id;
                                return (
                                  <React.Fragment key={c.id}>
                                    <tr
                                      onClick={() => toggleCustomer(c.id)}
                                      className={`border-b border-agm-box-border/50 hover:bg-slate-100/80 cursor-pointer transition-colors ${
                                        isExpanded
                                          ? "bg-slate-100/90 font-semibold"
                                          : ""
                                      }`}
                                    >
                                      <td className="py-2 px-3">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-slate-400 print:hidden">
                                            {isExpanded ? (
                                              <ChevronUpIcon size={12} />
                                            ) : (
                                              <ChevronDownIcon size={12} />
                                            )}
                                          </span>
                                          <div>
                                            <div className="font-bold text-slate-900">
                                              {c.name}
                                            </div>
                                            <div className="text-[10.5px] text-slate-500 font-medium">
                                              {c.companyName}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-2 px-3 text-slate-600 font-medium text-[11px]">
                                        <div>{c.phone}</div>
                                        <div className="text-slate-400">
                                          {c.email}
                                        </div>
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-medium">
                                        {formatNumber(c.totalInvoiced)}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                                        {formatNumber(c.totalPaid)}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-bold text-blue-900">
                                        {formatNumber(c.currentBalance)}
                                      </td>
                                    </tr>

                                    {isExpanded && (
                                      <tr className="bg-slate-50 border-b-2 border-slate-200">
                                        <td
                                          colSpan={5}
                                          className="p-3.5 space-y-3"
                                        >
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                                Invoices Issued (
                                                {c.invoices?.length || 0})
                                              </div>
                                              {c.invoices &&
                                              c.invoices.length > 0 ? (
                                                <table className="w-full bg-white rounded-lg border border-slate-200 text-[11px]">
                                                  <thead>
                                                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                                      <th className="py-1 px-2.5 text-left">
                                                        Invoice No
                                                      </th>
                                                      <th className="py-1 px-2.5 text-center">
                                                        Date
                                                      </th>
                                                      <th className="py-1 px-2.5 text-center">
                                                        Status
                                                      </th>
                                                      <th className="py-1 px-2.5 text-right">
                                                        Amount (AED)
                                                      </th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {c.invoices.map(
                                                      (inv, iIdx) => (
                                                        <tr
                                                          key={inv.id || iIdx}
                                                          className="border-b border-slate-100"
                                                        >
                                                          <td className="py-1 px-2.5 font-mono font-bold text-slate-800">
                                                            {inv.invoiceNumber}
                                                          </td>
                                                          <td className="py-1 px-2.5 text-center text-slate-500 font-mono text-[10px]">
                                                            {inv.invoiceDate ||
                                                              "—"}
                                                          </td>
                                                          <td className="py-1 px-2.5 text-center">
                                                            <span
                                                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                                                inv.status ===
                                                                "PAID"
                                                                  ? "bg-emerald-100 text-emerald-800"
                                                                  : "bg-amber-100 text-amber-800"
                                                              }`}
                                                            >
                                                              {inv.status}
                                                            </span>
                                                          </td>
                                                          <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900">
                                                            {formatNumber(
                                                              inv.totalAmount,
                                                            )}
                                                          </td>
                                                        </tr>
                                                      ),
                                                    )}
                                                  </tbody>
                                                </table>
                                              ) : (
                                                <div className="text-xs text-slate-400 italic bg-white p-2.5 rounded-lg border border-slate-200">
                                                  No invoices issued for this
                                                  customer.
                                                </div>
                                              )}
                                            </div>

                                            <div className="space-y-1.5">
                                              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                                Payments Received (
                                                {c.payments?.length || 0})
                                              </div>
                                              {c.payments &&
                                              c.payments.length > 0 ? (
                                                <table className="w-full bg-white rounded-lg border border-slate-200 text-[11px]">
                                                  <thead>
                                                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                                      <th className="py-1 px-2.5 text-left">
                                                        Receipt No
                                                      </th>
                                                      <th className="py-1 px-2.5 text-center">
                                                        Date
                                                      </th>
                                                      <th className="py-1 px-2.5 text-center">
                                                        Method
                                                      </th>
                                                      <th className="py-1 px-2.5 text-right">
                                                        Amount (AED)
                                                      </th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {c.payments.map(
                                                      (pay, pIdx) => (
                                                        <tr
                                                          key={pay.id || pIdx}
                                                          className="border-b border-slate-100"
                                                        >
                                                          <td className="py-1 px-2.5 font-mono font-bold text-slate-800">
                                                            {pay.receiptNumber}
                                                          </td>
                                                          <td className="py-1 px-2.5 text-center text-slate-500 font-mono text-[10px]">
                                                            {pay.paymentDate ||
                                                              "—"}
                                                          </td>
                                                          <td className="py-1 px-2.5 text-center font-mono text-[10px] text-slate-600">
                                                            {pay.paymentMethod}
                                                          </td>
                                                          <td className="py-1 px-2.5 text-right font-mono font-bold text-emerald-800">
                                                            {formatNumber(
                                                              pay.amount,
                                                            )}
                                                          </td>
                                                        </tr>
                                                      ),
                                                    )}
                                                  </tbody>
                                                </table>
                                              ) : (
                                                <div className="text-xs text-slate-400 italic bg-white p-2.5 rounded-lg border border-slate-200">
                                                  No payment receipts recorded
                                                  for this customer.
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

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
