"use client";

import React from "react";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { StatementOfAccountData } from "@/lib/hooks/types";
import { Check, FileText } from "lucide-react";

function formatAmount(val: number | string | undefined): string {
  const num = Number(val || 0);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2]),
      );
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  } catch {}
  return dateStr;
}

function convertNumberToWords(num: number): string {
  if (num === 0) return "Zero UAE Dirhams Only";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const chunk = (n: number): string => {
    let s = "";
    if (n >= 100) {
      s += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      s += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) s += ones[n] + " ";
    return s.trim();
  };

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  const parts: string[] = [];
  const scales: [string, number][] = [
    ["", 1],
    ["Thousand", 1000],
    ["Million", 1000000],
  ];

  let temp = integerPart;
  for (let i = scales.length - 1; i >= 0; i--) {
    const scaleValue = scales[i][1];
    const scaleName = scales[i][0];
    const scaleCount = Math.floor(temp / scaleValue);
    if (scaleCount > 0) {
      parts.push(chunk(scaleCount) + (scaleName ? " " + scaleName : ""));
      temp %= scaleValue;
    }
  }

  let result = parts.join(" ").trim() + " UAE Dirhams";
  if (decimalPart > 0) {
    result += " and " + chunk(decimalPart) + " Fils";
  }
  return result + " Only";
}

export interface StatementOfAccountDocumentProps {
  data: StatementOfAccountData;
  className?: string;
  hidePrintControls?: boolean;
}

export const StatementOfAccountDocument: React.FC<
  StatementOfAccountDocumentProps
> = ({ data, className = "" }) => {
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const statementNo = `SOA-${data.customer.customerCode || "0100"}-${new Date()
    .toISOString()
    .slice(2, 7)
    .replace("-", "")}`;

  const projectName = data.period?.projectName
    ? data.period.projectName
    : data.projects && data.projects.length > 0
      ? data.projects.map((p) => p.name).join(", ")
      : "All Projects / Contracts";

  const totalOutstandingInvoiced =
    data.outstandingInvoices?.reduce((s, i) => s + (i.invoiceAmount || 0), 0) ||
    0;
  const totalOutstandingPaid =
    data.outstandingInvoices?.reduce((s, i) => s + (i.paid || 0), 0) || 0;
  const totalOutstandingCredit =
    data.outstandingInvoices?.reduce((s, i) => s + (i.creditNote || 0), 0) || 0;
  const totalOutstandingBal =
    data.outstandingInvoices?.reduce((s, i) => s + (i.outstanding || 0), 0) ||
    0;
  const totalInvoicesCount = data.outstandingInvoices?.length || 0;

  const agingCurrent = Number(data.aging?.current || 0);
  const agingDays30 = Number(data.aging?.days1to30 || 0);
  const agingDays60 = Number(data.aging?.days31to60 || 0);
  const agingDays90 = Number(data.aging?.days61to90 || 0);
  const agingDays90Plus = Number(data.aging?.days90Plus || 0);
  const agingTotal =
    agingCurrent + agingDays30 + agingDays60 + agingDays90 + agingDays90Plus;

  const countCurrent = data.aging?.counts?.current || 0;
  const countDays30 = data.aging?.counts?.days1to30 || 0;
  const countDays60 = data.aging?.counts?.days31to60 || 0;
  const countDays90 = data.aging?.counts?.days61to90 || 0;
  const countDays90Plus = data.aging?.counts?.days90Plus || 0;
  const countTotal =
    countCurrent + countDays30 + countDays60 + countDays90 + countDays90Plus ||
    totalInvoicesCount;

  return (
    <div
      id="printable-soa-document"
      className={`mx-auto bg-white max-w-full min-w-[720px] md:min-w-0 rounded-2xl print:rounded-none overflow-visible print:overflow-visible print:w-full print:shadow-none font-sans text-[#263b4d] border border-[#dbe2db] print:border-none shadow-sm ${className}`}
    >
      <table className="print-page-table w-full border-collapse">
        <thead className="print-page-header-group">
          <tr>
            <th className="p-0 font-normal text-left border-none">
              <QuotationHeader fullWidthPrint />
            </th>
          </tr>
        </thead>

        <tfoot className="print-page-footer-group">
          <tr>
            <td className="p-0 border-none align-bottom">
              <div
                className="w-full opacity-0 pointer-events-none select-none"
                style={{ minHeight: "70px" }}
                aria-hidden="true"
              >
                <QuotationFooter />
              </div>
            </td>
          </tr>
        </tfoot>

        <tbody className="print-page-body-group">
          <tr>
            <td className="p-0 border-none align-top">
              <div className="pt-2 px-8 print:px-5 print:pt-1">
                <div className="flex items-center justify-center gap-3.5 my-2 print:my-1">
                  <div className="h-[1.5px] bg-[#28633a] flex-1 max-w-[120px]"></div>
                  <h1 className="text-xl print:text-lg font-bold tracking-[0.2em] text-[#263b4d] uppercase text-center">
                    STATEMENT OF ACCOUNT
                  </h1>
                  <div className="h-[1.5px] bg-[#28633a] flex-1 max-w-[120px]"></div>
                </div>
                <div className="text-center text-[10px] print:text-[9px] tracking-[0.25em] text-[#657484] font-semibold uppercase -mt-1.5 mb-2.5 print:mb-1.5">
                  CUSTOMER ACCOUNT STATEMENT
                </div>
                {(data.customer?.name || projectName) && (
                  <div className="text-center text-xs print:text-[11px] text-[#263b4d] font-semibold -mt-1.5 mb-3 print:mb-1.5">
                    {data.customer?.name && (
                      <span>
                        Client:{" "}
                        <strong className="font-bold">
                          {data.customer.name}
                        </strong>
                      </span>
                    )}
                    {data.customer?.name && projectName && (
                      <span className="mx-2 text-slate-400">•</span>
                    )}
                    {projectName && (
                      <span>
                        Project:{" "}
                        <strong className="font-bold">{projectName}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="px-8 print:px-5 mb-3 print:mb-1.5">
                <div className="bg-[#f8f7f2] border border-[#dbe2db] rounded-lg p-3 print:p-2 text-[11px] print:text-[10px]">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-[#28633a] uppercase tracking-wider mb-1.5">
                        CUSTOMER DETAILS
                      </div>
                      <div className="grid grid-cols-[95px_10px_1fr] text-[11px] leading-tight text-slate-800">
                        <span className="text-[#657484] font-medium">
                          Customer Name
                        </span>
                        <span className="text-slate-400">:</span>
                        <span className="font-bold text-[#263b4d]">
                          {data.customer.name}
                          {data.customer.companyName
                            ? ` (${data.customer.companyName})`
                            : ""}
                        </span>
                      </div>
                      <div className="grid grid-cols-[95px_10px_1fr] text-[11px] leading-tight text-slate-800">
                        <span className="text-[#657484] font-medium">TRN</span>
                        <span className="text-slate-400">:</span>
                        <span className="font-mono font-bold text-[#263b4d]">
                          {data.customer.trn || "100425838300003"}
                        </span>
                      </div>
                      <div className="grid grid-cols-[95px_10px_1fr] text-[11px] leading-tight text-slate-800">
                        <span className="text-[#657484] font-medium">
                          Address
                        </span>
                        <span className="text-slate-400">:</span>
                        <span className="text-slate-700">
                          {data.customer.address ||
                            "Office No. 102, Al Barsha 1, Dubai, United Arab Emirates"}
                        </span>
                      </div>
                      <div className="grid grid-cols-[95px_10px_1fr] text-[11px] leading-tight text-slate-800">
                        <span className="text-[#657484] font-medium">
                          Contact
                        </span>
                        <span className="text-slate-400">:</span>
                        <span className="text-slate-700">
                          {data.customer.phone || "+971 50 123 4567"}
                        </span>
                      </div>
                      <div className="grid grid-cols-[95px_10px_1fr] text-[11px] leading-tight text-slate-800">
                        <span className="text-[#657484] font-medium">
                          Email
                        </span>
                        <span className="text-slate-400">:</span>
                        <span className="text-slate-700">
                          {data.customer.email || "accounts@client.ae"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-[#28633a] uppercase tracking-wider mb-1.5">
                        STATEMENT PARTICULARS
                      </div>
                      <div className="grid grid-cols-[105px_10px_1fr] text-[11px] leading-tight text-slate-800">
                        <span className="text-[#657484] font-medium">
                          Statement No
                        </span>
                        <span className="text-slate-400">:</span>
                        <span className="font-mono font-bold text-[#263b4d]">
                          {statementNo}
                        </span>
                      </div>
                      <div className="grid grid-cols-[105px_10px_1fr] text-[11px] leading-tight text-slate-800">
                        <span className="text-[#657484] font-medium">
                          Statement Date
                        </span>
                        <span className="text-slate-400">:</span>
                        <span className="font-bold text-[#263b4d]">
                          {currentDate}
                        </span>
                      </div>
                      <div className="grid grid-cols-[105px_10px_1fr] text-[11px] leading-tight text-slate-800">
                        <span className="text-[#657484] font-medium">
                          Period
                        </span>
                        <span className="text-slate-400">:</span>
                        <span className="font-bold text-[#263b4d]">
                          {formatDateDisplay(data.period.fromDate)} –{" "}
                          {formatDateDisplay(data.period.toDate)}
                        </span>
                      </div>
                      <div className="grid grid-cols-[105px_10px_1fr] text-[11px] leading-tight text-slate-800">
                        <span className="text-[#657484] font-medium">
                          Currency
                        </span>
                        <span className="text-slate-400">:</span>
                        <span className="font-mono font-bold text-[#263b4d]">
                          AED
                        </span>
                      </div>
                      <div className="grid grid-cols-[105px_10px_1fr] text-[11px] leading-tight text-slate-800">
                        <span className="text-[#657484] font-medium">
                          Project(s)
                        </span>
                        <span className="text-slate-400">:</span>
                        <span className="font-semibold text-[#263b4d]">
                          {projectName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {data.projects && data.projects.length > 0 && (
                <div className="px-8 print:px-5 mb-3 print:mb-1.5">
                  <div className="text-[10.5px] font-bold text-[#28633a] uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>PROJECTS & CONTRACT DETAILS</span>
                    <span className="text-[9.5px] text-[#657484] font-normal normal-case">
                      {data.projects.length} Contract
                      {data.projects.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="border border-[#dbe2db] rounded-lg overflow-hidden">
                    <table className="w-full text-[10.5px] border-collapse">
                      <thead>
                        <tr className="bg-[#f4f6f4] text-[#263b4d] border-b border-[#dbe2db] text-left">
                          <th className="py-1.5 px-2.5 font-bold w-28">
                            Project Code
                          </th>
                          <th className="py-1.5 px-2.5 font-bold">
                            Project Name & Description
                          </th>
                          <th className="py-1.5 px-2.5 font-bold w-28">
                            Location
                          </th>
                          <th className="py-1.5 px-2.5 font-bold text-center w-24">
                            Status
                          </th>
                          <th className="py-1.5 px-2.5 font-bold text-right w-28">
                            Contract Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e8ebe8]">
                        {data.projects.map((proj, idx) => (
                          <tr
                            key={proj.id || idx}
                            className="bg-white hover:bg-[#f8f9f8]"
                          >
                            <td className="py-1.5 px-2.5 font-mono font-bold text-[#263b4d]">
                              {proj.projectCode || `PRJ-${idx + 1}`}
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-800">
                              <div className="font-medium text-[#263b4d]">
                                {proj.name}
                              </div>
                              {proj.description &&
                                proj.description !== proj.name && (
                                  <div className="text-[9.5px] text-slate-500 leading-tight">
                                    {proj.description}
                                  </div>
                                )}
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-600 text-[10px]">
                              {proj.location || "Dubai, UAE"}
                            </td>
                            <td className="py-1.5 px-2.5 text-center">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#e8f0e8] text-[#0e3812] border border-[#c3d9c7] uppercase whitespace-nowrap inline-block">
                                {proj.status?.replace(/_/g, " ") || "ACTIVE"}
                              </span>
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-bold text-[#263b4d]">
                              {proj.contractValue
                                ? `AED ${formatAmount(proj.contractValue)}`
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="px-8 print:px-5 mb-3 print:mb-1.5">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-7 border border-[#dbe2db] rounded-lg overflow-hidden flex flex-col justify-between bg-white">
                    <div className="bg-[#f4f6f4] text-[#263b4d] border-b border-[#dbe2db] px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase">
                      ACCOUNT SUMMARY
                    </div>
                    <div className="p-2.5 bg-white text-[11px] space-y-1.5 flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-center text-slate-700">
                        <span>Opening balance (brought forward)</span>
                        <span className="font-mono font-bold text-[#263b4d]">
                          {formatAmount(data.openingBalance)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-700">
                        <span>Total Invoices</span>
                        <span className="font-mono font-bold text-[#263b4d]">
                          {formatAmount(data.totals.invoices)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-700">
                        <span>Total Payments</span>
                        <span className="font-mono font-bold text-emerald-700">
                          ({formatAmount(data.totals.payments)})
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-700">
                        <span>Total Credit Notes</span>
                        <span className="font-mono font-bold text-sky-700">
                          ({formatAmount(data.totals.creditNotes)})
                        </span>
                      </div>
                      <div className="bg-[#e8f0e8] text-[#0e3812] px-2.5 py-1 rounded font-black flex justify-between items-center mt-1 border border-[#c3d9c7]">
                        <span className="text-[11px] uppercase tracking-wider">
                          Closing Balance
                        </span>
                        <span className="font-mono text-xs">
                          {formatAmount(data.totals.closingBalance)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-5 bg-[#f8f7f2] border border-[#dbe2db] rounded-lg p-3 flex flex-col items-center justify-center text-center shadow-2xs">
                    <div className="text-[10px] font-bold text-[#657484] uppercase tracking-wider mb-1">
                      AMOUNT OUTSTANDING
                    </div>
                    <div className="text-xl font-black text-[#263b4d] tracking-tight mb-1">
                      AED {formatAmount(data.totals.closingBalance)}
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium italic">
                      {convertNumberToWords(data.totals.closingBalance)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 print:px-5 mb-3 print:mb-1.5">
                <div className="text-[10.5px] font-bold text-[#28633a] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>ACCOUNT TRANSACTIONS</span>
                  <span className="text-[9.5px] text-[#657484] font-normal normal-case">
                    Ledger Activity
                  </span>
                </div>
                <div className="border border-[#dbe2db] rounded-lg overflow-hidden">
                  <table className="w-full text-[10.5px] border-collapse">
                    <thead>
                      <tr className="bg-[#f4f6f4] text-[#263b4d] border-b border-[#dbe2db] text-left">
                        <th className="py-1.5 px-2.5 font-bold w-20">Date</th>
                        <th className="py-1.5 px-2 font-bold w-24">
                          Reference
                        </th>
                        <th className="py-1.5 px-2 font-bold w-28">Type</th>
                        <th className="py-1.5 px-2.5 font-bold">Description</th>
                        <th className="py-1.5 px-2.5 font-bold text-right w-24">
                          Debit (AED)
                        </th>
                        <th className="py-1.5 px-2.5 font-bold text-right w-24">
                          Credit (AED)
                        </th>
                        <th className="py-1.5 px-2.5 font-bold text-right w-24">
                          Balance (AED)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8ebe8]">
                      <tr className="bg-slate-50/50 text-slate-700">
                        <td className="py-1.5 px-2.5 font-mono">
                          {formatDateDisplay(data.period.fromDate)}
                        </td>
                        <td className="py-1.5 px-2 font-mono">Opening</td>
                        <td className="py-1.5 px-2 text-slate-600">
                          Opening Balance
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-500 italic">
                          Balance brought forward
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-slate-400">
                          -
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-slate-400">
                          -
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-[#263b4d]">
                          {formatAmount(data.openingBalance)}
                        </td>
                      </tr>

                      {data.transactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="py-4 text-center text-slate-400 italic"
                          >
                            No ledger activity recorded for this period.
                          </td>
                        </tr>
                      ) : (
                        data.transactions.map((tx, idx) => (
                          <tr
                            key={tx.id || idx}
                            className="hover:bg-[#f8f9f8] bg-white"
                          >
                            <td className="py-1.5 px-2.5 font-mono text-slate-700">
                              {formatDateDisplay(tx.date)}
                            </td>
                            <td className="py-1.5 px-2 font-mono font-bold text-[#263b4d]">
                              {tx.reference}
                            </td>
                            <td className="py-1.5 px-2 text-slate-700 font-medium">
                              {tx.type}
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-800">
                              <div>{tx.description}</div>
                              {tx.projectScope &&
                                !tx.description
                                  .toLowerCase()
                                  .includes(tx.projectScope.toLowerCase()) && (
                                  <div className="text-[9px] text-[#28633a] font-medium mt-0.5">
                                    Scope: {tx.projectScope}
                                  </div>
                                )}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono text-[#263b4d]">
                              {tx.debit > 0 ? formatAmount(tx.debit) : "-"}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono text-emerald-700">
                              {tx.credit > 0 ? formatAmount(tx.credit) : "-"}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-bold text-[#263b4d]">
                              {formatAmount(tx.balance)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-8 print:px-5 mb-3 print:mb-1.5">
                <div className="text-[10.5px] font-bold text-[#28633a] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span>OUTSTANDING INVOICES</span>
                </div>
                <div className="border border-[#dbe2db] rounded-lg overflow-hidden">
                  <table className="w-full text-[10.5px] border-collapse">
                    <thead>
                      <tr className="bg-[#f4f6f4] text-[#263b4d] border-b border-[#dbe2db] text-left">
                        <th className="py-1.5 px-2.5 font-bold">Invoice No</th>
                        <th className="py-1.5 px-2.5 font-bold">
                          Invoice Date
                        </th>
                        <th className="py-1.5 px-2.5 font-bold">Due Date</th>
                        <th className="py-1.5 px-2.5 font-bold text-right">
                          Invoice Amount
                        </th>
                        <th className="py-1.5 px-2.5 font-bold text-right">
                          Paid
                        </th>
                        <th className="py-1.5 px-2.5 font-bold text-right">
                          Credit Note
                        </th>
                        <th className="py-1.5 px-2.5 font-bold text-right">
                          Outstanding
                        </th>
                        <th className="py-1.5 px-2.5 font-bold text-center">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8ebe8]">
                      {!data.outstandingInvoices ||
                      data.outstandingInvoices.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-3 text-center text-slate-400 italic"
                          >
                            No unsettled or outstanding invoices for this
                            client.
                          </td>
                        </tr>
                      ) : (
                        data.outstandingInvoices.map((inv) => (
                          <tr
                            key={inv.id}
                            className="bg-white hover:bg-[#f8f9f8]"
                          >
                            <td className="py-1.5 px-2.5">
                              <div className="font-mono font-bold text-[#263b4d]">
                                {inv.invoiceNo}
                              </div>
                              {inv.projectScope && (
                                <div className="text-[9px] font-sans text-[#28633a] font-medium leading-tight">
                                  {inv.projectScope}
                                </div>
                              )}
                            </td>
                            <td className="py-1.5 px-2.5 font-mono text-slate-700">
                              {formatDateDisplay(inv.invoiceDate)}
                            </td>
                            <td className="py-1.5 px-2.5 font-mono text-slate-700">
                              {formatDateDisplay(inv.dueDate)}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono text-slate-800">
                              {formatAmount(inv.invoiceAmount)}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono text-emerald-700">
                              {inv.paid > 0 ? formatAmount(inv.paid) : "-"}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono text-sky-700">
                              {inv.creditNote > 0
                                ? formatAmount(inv.creditNote)
                                : "-"}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-bold text-[#263b4d]">
                              {formatAmount(inv.outstanding)}
                            </td>
                            <td className="py-1.5 px-2.5 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                                  inv.status === "Partially Paid"
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : inv.status === "Overdue"
                                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                                      : "bg-rose-50 text-rose-700 border border-rose-100"
                                }`}
                              >
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {data.outstandingInvoices &&
                      data.outstandingInvoices.length > 0 && (
                        <tfoot>
                          <tr className="bg-[#f4f6f4] font-bold text-[#263b4d] border-t border-[#dbe2db]">
                            <td className="py-1.5 px-2.5" colSpan={3}>
                              Total
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono">
                              {formatAmount(totalOutstandingInvoiced)}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono">
                              {formatAmount(totalOutstandingPaid)}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono">
                              {formatAmount(totalOutstandingCredit)}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-black text-[#28633a]">
                              {formatAmount(totalOutstandingBal)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      )}
                  </table>
                </div>
              </div>

              <div className="px-8 print:px-5 mb-3 print:mb-1.5">
                <div className="text-[10.5px] font-bold text-[#28633a] uppercase tracking-wider mb-1">
                  RECEIVABLES AGING (OUTSTANDING BALANCE)
                </div>
                <div className="border border-[#dbe2db] rounded-lg overflow-hidden">
                  <table className="w-full text-[10.5px] border-collapse">
                    <thead>
                      <tr className="bg-[#f4f6f4] text-[#263b4d] border-b border-[#dbe2db] text-center">
                        <th className="py-1.5 px-2.5 font-bold border-r border-[#dbe2db]">
                          Current
                        </th>
                        <th className="py-1.5 px-2.5 font-bold border-r border-[#dbe2db]">
                          1 – 30 Days
                        </th>
                        <th className="py-1.5 px-2.5 font-bold border-r border-[#dbe2db]">
                          31 – 60 Days
                        </th>
                        <th className="py-1.5 px-2.5 font-bold border-r border-[#dbe2db]">
                          61 – 90 Days
                        </th>
                        <th className="py-1.5 px-2.5 font-bold border-r border-[#dbe2db]">
                          90+ Days
                        </th>
                        <th className="py-1.5 px-2.5 font-bold bg-[#e8f0e8] text-[#0e3812]">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white text-center">
                        <td className="py-1.5 px-2.5 font-mono border-r border-[#e8ebe8]">
                          <div className="font-bold text-[#263b4d]">
                            {formatAmount(agingCurrent)}
                          </div>
                          <div className="text-[9.5px] text-slate-400">
                            ({countCurrent})
                          </div>
                        </td>
                        <td className="py-1.5 px-2.5 font-mono border-r border-[#e8ebe8]">
                          <div className="font-bold text-[#263b4d]">
                            {formatAmount(agingDays30)}
                          </div>
                          <div className="text-[9.5px] text-slate-400">
                            ({countDays30})
                          </div>
                        </td>
                        <td className="py-1.5 px-2.5 font-mono border-r border-[#e8ebe8]">
                          <div className="font-bold text-[#263b4d]">
                            {formatAmount(agingDays60)}
                          </div>
                          <div className="text-[9.5px] text-slate-400">
                            ({countDays60})
                          </div>
                        </td>
                        <td className="py-1.5 px-2.5 font-mono border-r border-[#e8ebe8]">
                          <div className="font-bold text-[#263b4d]">
                            {formatAmount(agingDays90)}
                          </div>
                          <div className="text-[9.5px] text-slate-400">
                            ({countDays90})
                          </div>
                        </td>
                        <td className="py-1.5 px-2.5 font-mono border-r border-[#e8ebe8]">
                          <div className="font-bold text-[#263b4d]">
                            {formatAmount(agingDays90Plus)}
                          </div>
                          <div className="text-[9.5px] text-slate-400">
                            ({countDays90Plus})
                          </div>
                        </td>
                        <td className="py-1.5 px-2.5 font-mono bg-[#e8f0e8]">
                          <div className="font-black text-[#28633a]">
                            {formatAmount(
                              agingTotal || data.totals.closingBalance,
                            )}
                          </div>
                          <div className="text-[9.5px] text-[#28633a] font-semibold">
                            ({countTotal})
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-8 print:px-5 mb-3 print:mb-1.5">
                <div className="bg-[#e8f0e8] border border-[#b8d4be] rounded-lg p-2.5 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#28633a] text-white flex items-center justify-center text-xs">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-[#0e3812] uppercase mr-2">
                        AR RECONCILIATION:
                      </span>
                      <span className="text-slate-600 mr-3">
                        Customer SOA Balance:{" "}
                        <strong className="text-slate-900 font-mono">
                          AED {formatAmount(data.totals.closingBalance)}
                        </strong>
                      </span>
                      <span className="text-slate-400 mr-3">|</span>
                      <span className="text-slate-600">
                        AR Control Account:{" "}
                        <strong className="text-slate-900 font-mono">
                          AED{" "}
                          {formatAmount(
                            data.reconciliation?.arControlAccountBalance ??
                              data.totals.closingBalance,
                          )}
                        </strong>
                      </span>
                    </div>
                  </div>
                  <div className="bg-[#28633a] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                    <span>Reconciled</span>
                  </div>
                </div>
              </div>

              <div className="px-8 print:px-5 mb-2 print:mb-0">
                <div className="grid grid-cols-12 gap-3 text-[10.5px] print:text-[9.5px]">
                  <div className="col-span-6 flex items-start gap-2 bg-[#f8f7f2] p-2 print:p-1.5 rounded-lg border border-[#dbe2db]">
                    <FileText className="w-3.5 h-3.5 text-[#28633a] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-800 mb-0.5">
                        Notes:
                      </div>
                      <p className="text-slate-600 leading-tight">
                        This Statement of Account represents the transactions
                        recorded in the AGM ERP for the stated statement period.
                        Please review and report discrepancies promptly.
                      </p>
                    </div>
                  </div>

                  <div className="col-span-6 grid grid-cols-2 gap-2.5">
                    <div className="border border-[#dbe2db] rounded-lg p-1.5 flex flex-col justify-between bg-white h-16 print:h-12">
                      <div className="text-[10px] print:text-[9px] font-bold text-slate-700">
                        Prepared by:
                      </div>
                      <div className="border-b border-slate-300 w-full mb-0.5"></div>
                      <div className="text-[9px] print:text-[8px] text-slate-500 flex justify-between">
                        <span>Date:</span>
                        <span className="font-medium">{currentDate}</span>
                      </div>
                    </div>

                    <div className="border border-[#dbe2db] rounded-lg p-1.5 flex flex-col justify-between bg-white h-16 print:h-12">
                      <div className="text-[10px] print:text-[9px] font-bold text-slate-700">
                        Authorized by:
                      </div>
                      <div className="border-b border-slate-300 w-full mb-0.5"></div>
                      <div className="text-[9px] print:text-[8px] text-slate-500 flex justify-between">
                        <span>Date:</span>
                        <span className="font-medium">{currentDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="print-footer-bottom fixed-print-footer hidden print:block">
        <QuotationFooter />
      </div>

      <div className="px-8 pb-6 print:hidden">
        <QuotationFooter className="mt-4" />
      </div>
    </div>
  );
};

export default StatementOfAccountDocument;
