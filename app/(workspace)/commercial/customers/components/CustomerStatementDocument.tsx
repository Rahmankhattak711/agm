"use client";

import React from "react";
import { Customer } from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";

function formatNumber(val: number | string | undefined): string {
  const num = Number(val || 0);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export interface CustomerStatementDocumentProps {
  customer: Customer;
  statement: any[];
  summary: {
    totalBilled: number;
    totalPaid: number;
    totalCredits: number;
    currentOutstanding: number;
  };
}

export const CustomerStatementDocument: React.FC<
  CustomerStatementDocumentProps
> = ({ customer, statement = [], summary }) => {
  const currentDate = new Date().toLocaleDateString("en-GB");

  return (
    <div
      id="printable-statement"
      className="mx-auto bg-white max-w-4xl min-w-[700px] md:min-w-0 rounded-xl print:rounded-none overflow-visible print:overflow-visible print:w-full print:shadow-none font-sans"
    >
      <table className="print-page-table w-full border-collapse">
        <thead className="print-page-header-group">
          <tr>
            <th className="p-0 font-normal text-left border-none">
              <QuotationHeader />
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
              <div className="px-10 py-3.5 print:px-8 print:py-2.5 w-full border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between gap-8">
                  <div>
                    <h1 className="text-2xl print:text-2xl font-black text-slate-900 tracking-tight">
                      STATEMENT OF ACCOUNT
                    </h1>
                    <p className="text-[11px] print:text-[11px] font-semibold text-emerald-700 mt-0.5 print:mt-0">
                      Official UAE Commercial Account Statement &amp;
                      Receivables Ledger
                    </p>
                  </div>

                  <div className="w-[340px] print:w-[340px] space-y-1 text-[12px] print:text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Statement Date:
                      </span>
                      <span className="font-bold text-slate-900">
                        {currentDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Customer Code:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {customer.customerCode}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Currency:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        AED (UAE Dirham)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Account Status:
                      </span>
                      <span
                        className={`font-bold ${
                          summary.currentOutstanding > 0
                            ? "text-rose-700"
                            : "text-emerald-800"
                        }`}
                      >
                        {summary.currentOutstanding > 0
                          ? "OUTSTANDING DUE"
                          : "SETTLED"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-0 border-none align-top">
              <div className="grid grid-cols-2 gap-4 print:gap-3 px-10 py-3.5 print:px-8 print:py-2 text-[12px] print:text-[12px] print-avoid-break">
                <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2.5 rounded-xl shadow-2xs">
                  <div className="font-bold mb-2 print:mb-1.5 text-slate-900 uppercase text-[11px] print:text-[11px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                    CLIENT / ACCOUNT ENTITY
                  </div>
                  <div className="space-y-1.5 print:space-y-1">
                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Client Name:
                      </span>
                      <span className="font-bold text-slate-900">
                        {customer.name}
                      </span>
                    </div>

                    {customer.companyName && (
                      <div className="flex items-start gap-1">
                        <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                          Company:
                        </span>
                        <span className="text-slate-700 font-medium">
                          {customer.companyName}
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        UAE VAT TRN:
                      </span>
                      <span className="font-mono text-slate-800 font-bold">
                        {customer.trn || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Address:
                      </span>
                      <span className="text-slate-700">
                        {customer.address || "United Arab Emirates"}
                      </span>
                    </div>

                    {(customer.contactPerson || customer.phone) && (
                      <div className="flex items-start gap-1">
                        <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                          Contact:
                        </span>
                        <span className="text-slate-700">
                          {[customer.contactPerson, customer.phone]
                            .filter(Boolean)
                            .join(" • ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2.5 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="font-bold mb-2 print:mb-1.5 text-slate-900 uppercase text-[11px] print:text-[11px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                      FINANCIAL RECAPITULATION
                    </div>
                    <div className="space-y-1.5 print:space-y-1 text-[11.5px] print:text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          Total Invoiced (Debit):
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          AED {formatNumber(summary.totalBilled)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          Total Payments (Credit):
                        </span>
                        <span className="font-mono font-bold text-emerald-700">
                          AED {formatNumber(summary.totalPaid)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          Credit Note Adjustments:
                        </span>
                        <span className="font-mono font-bold text-sky-700">
                          AED {formatNumber(summary.totalCredits)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between bg-white print:bg-transparent p-2 rounded-lg border">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                      Closing Net Balance Due:
                    </span>
                    <span className="font-mono text-base font-black text-rose-700">
                      AED {formatNumber(summary.currentOutstanding)}
                    </span>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 py-2 print:px-8 print:py-1">
                <table className="w-full border-collapse text-[11.5px] print:text-[10.5px]">
                  <thead>
                    <tr className="bg-agm-green border border-agm-box-border text-white">
                      <th className="py-2.5 px-2.5 font-bold w-24 border border-agm-box-border text-white text-left align-middle">
                        Date
                      </th>
                      <th className="py-2.5 px-2.5 font-bold w-28 border border-agm-box-border text-white text-left align-middle">
                        Doc / Ref #
                      </th>
                      <th className="py-2.5 px-3 font-bold border border-agm-box-border text-white text-left align-middle">
                        Particulars / Description
                      </th>
                      <th className="py-2.5 px-2 font-bold w-24 border border-agm-box-border text-white text-center align-middle">
                        Doc Type
                      </th>
                      <th className="py-2.5 px-3 font-bold w-28 border border-agm-box-border text-white text-right align-middle">
                        Debit (AED)
                      </th>
                      <th className="py-2.5 px-3 font-bold w-28 border border-agm-box-border text-white text-right align-middle">
                        Credit (AED)
                      </th>
                      <th className="py-2.5 px-3 font-bold w-32 border border-agm-box-border text-white text-right align-middle">
                        Balance (AED)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-agm-box-border">
                    {statement.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-6 text-center text-slate-400 italic border border-agm-box-border"
                        >
                          No ledger transactions recorded for this account.
                        </td>
                      </tr>
                    ) : (
                      statement.map((tx, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/50 bg-white print-avoid-break"
                        >
                          <td className="py-2 px-2.5 align-middle text-left font-mono text-slate-700 border border-agm-box-border">
                            {tx.date}
                          </td>
                          <td className="py-2 px-2.5 align-middle text-left font-mono font-bold text-slate-900 border border-agm-box-border">
                            {tx.ref || tx.reference}
                          </td>
                          <td className="py-2 px-3 align-middle text-left font-medium text-slate-800 border border-agm-box-border">
                            {tx.description}
                          </td>
                          <td className="py-2 px-2 align-middle text-center border border-agm-box-border">
                            <span className="font-mono text-[10px] font-bold uppercase text-slate-700">
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-2 px-3 align-middle text-right font-mono font-semibold text-slate-900 border border-agm-box-border">
                            {Number(tx.debit) > 0
                              ? formatNumber(tx.debit)
                              : "—"}
                          </td>
                          <td className="py-2 px-3 align-middle text-right font-mono font-semibold text-emerald-700 border border-agm-box-border">
                            {Number(tx.credit) > 0
                              ? formatNumber(tx.credit)
                              : "—"}
                          </td>
                          <td className="py-2 px-3 align-middle text-right font-mono font-black text-slate-900 border border-agm-box-border">
                            {formatNumber(tx.runningBalance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 print:px-8">
                <div className="flex items-stretch justify-between gap-4 mt-3.5 print:mt-2 print-avoid-break">
                  <div className="flex-1 border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2 rounded-xl text-[11px] print:text-[10px] flex flex-col justify-center shadow-2xs">
                    <div className="font-bold mb-1 text-slate-900 uppercase text-[10.5px] print:text-[10px] tracking-wider text-agm-green flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                      PAYMENT &amp; REMITTANCE ADVICE
                    </div>
                    <div className="space-y-1 text-slate-600 font-medium leading-relaxed">
                      <div>
                        Please remit all outstanding dues in favor of{" "}
                        <strong>Al Ghaith Metal Industries LLC</strong> within
                        the agreed credit cycle.
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Remittance reference: Customer Code (
                        {customer.customerCode}) or corresponding Tax Invoice
                        numbers.
                      </div>
                    </div>
                  </div>

                  <div className="w-80 border border-slate-200 print:border-slate-300 bg-white rounded-xl overflow-hidden shadow-2xs text-[12px] print:text-[11px]">
                    <div className="divide-y divide-slate-100 print:divide-slate-200">
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/40">
                        <span className="font-semibold text-slate-600">
                          Total Billed Invoices:
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          AED {formatNumber(summary.totalBilled)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/40">
                        <span className="font-semibold text-slate-600">
                          Total Paid / Settled:
                        </span>
                        <span className="font-mono font-bold text-emerald-700">
                          AED {formatNumber(summary.totalPaid)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5 bg-agm-green text-white">
                        <span className="font-bold text-xs uppercase tracking-wider">
                          Net Due Balance:
                        </span>
                        <span className="font-mono font-black text-sm">
                          AED {formatNumber(summary.currentOutstanding)}
                        </span>
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

      <div className="px-10 pb-6 print:hidden">
        <QuotationFooter className="mt-6" />
      </div>
    </div>
  );
};
