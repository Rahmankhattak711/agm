"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  Fragment,
} from "react";
import { useReactToPrint } from "react-to-print";
import {
  BuildingIcon,
  ChevronDownIcon,
  CloseIcon,
  FileTextIcon,
  PlusIcon,
  PrintIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import {
  Button,
  Input,
  Modal,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
} from "@/components/ui";
import {
  useCustomers,
  useCustomerStatement,
  useCreateCustomer,
  Customer,
} from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";

const EMPTY_FORM = {
  customerCode: "",
  name: "",
  companyName: "",
  trn: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  creditLimit: "",
};

function formatNumber(val: number | string | undefined): string {
  const num = Number(val || 0);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ----------------------------------------------------------------------
// 1. Official Quotation-Style A4 Print Document for Statement of Account
// ----------------------------------------------------------------------
interface CustomerStatementDocumentProps {
  customer: Customer;
  statement: any[];
  summary: {
    totalBilled: number;
    totalPaid: number;
    totalCredits: number;
    currentOutstanding: number;
  };
}

const CustomerStatementDocument: React.FC<CustomerStatementDocumentProps> = ({
  customer,
  statement = [],
  summary,
}) => {
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
              {/* Spacer row to prevent body rows from overlapping the fixed bottom footer */}
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
          {/* Document Title Bar */}
          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 py-3.5 print:px-8 print:py-2.5 w-full border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between gap-8">
                  <div>
                    <h1 className="text-2xl print:text-2xl font-black text-slate-900 tracking-tight">
                      STATEMENT OF ACCOUNT
                    </h1>
                    <p className="text-[11px] print:text-[11px] font-semibold text-emerald-700 mt-0.5 print:mt-0">
                      Official UAE Commercial Account Statement &amp; Receivables Ledger
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

          {/* Client & Financial Recap Cards */}
          <tr>
            <td className="p-0 border-none align-top">
              <div className="grid grid-cols-2 gap-4 print:gap-3 px-10 py-3.5 print:px-8 print:py-2 text-[12px] print:text-[12px] print-avoid-break">
                {/* Left Card: Customer Profile */}
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

                {/* Right Card: Financial Recap */}
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

          {/* Ledger Table */}
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

          {/* Statement Remittance & Closing Summary */}
          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 print:px-8">
                <div className="flex items-stretch justify-between gap-4 mt-3.5 print:mt-2 print-avoid-break">
                  {/* Left: Remittance Instructions */}
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

                  {/* Right: Closing Net Summary */}
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

      {/* Fixed Footer pinned to the bottom of every page in print */}
      <div className="print-footer-bottom fixed-print-footer hidden print:block">
        <QuotationFooter />
      </div>

      {/* On-Screen / Print Preview Footer */}
      <div className="px-10 pb-6 print:hidden">
        <QuotationFooter className="mt-6" />
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 2. Landing Page QA-Style Accordion Expanded Drawer Component
// ----------------------------------------------------------------------
interface CustomerExpandedRowProps {
  customer: Customer;
  onPrint: () => void;
  onClose: () => void;
}

function CustomerExpandedRow({
  customer,
  onPrint,
  onClose,
}: CustomerExpandedRowProps) {
  const { data: statementData, isLoading } = useCustomerStatement(customer.id);
  const summary = statementData?.summary;
  const recentStatements = useMemo(() => {
    if (!statementData?.statement) return [];
    return statementData.statement.slice(-4).reverse();
  }, [statementData]);

  const outstanding = Number(
    summary?.currentOutstanding ?? customer.currentBalance ?? 0,
  );
  const creditLimit = Number(customer.creditLimit || 0);
  const availableCredit =
    creditLimit > 0 ? Math.max(0, creditLimit - outstanding) : 0;

  return (
    <TableRow className="hover:bg-transparent bg-slate-50/70">
      <TableCell colSpan={7} className="p-0 border-b-2 border-emerald-600/40">
        <div className="px-6 py-5 space-y-4 border-l-4 border-l-emerald-600 bg-gradient-to-b from-white via-slate-50/40 to-slate-100/40 shadow-inner">
          {/* QA Header Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-teal-900 text-teal-200 font-mono font-bold text-xs shadow-2xs">
                {customer.customerCode}
              </span>
              <span className="text-xs font-bold text-slate-900">
                {customer.name}
              </span>
              {customer.companyName && (
                <span className="text-[11px] font-medium text-slate-500">
                  ({customer.companyName})
                </span>
              )}
              {customer.trn ? (
                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                  <ShieldCheckIcon size={12} className="text-emerald-700" />
                  TRN: {customer.trn}
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  No TRN Registered
                </span>
              )}
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  outstanding > 0
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}
              >
                {outstanding > 0
                  ? `Outstanding: AED ${formatNumber(outstanding)}`
                  : "Account Settled"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrint}
                icon={<PrintIcon size={13} className="text-emerald-700" />}
                className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                Print Statement (PDF)
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                title="Collapse preview"
              >
                <CloseIcon size={15} />
              </button>
            </div>
          </div>

          {/* 4 Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-rose-50/90 border border-rose-200/80 rounded-xl space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                Outstanding Balance
              </span>
              <span className="text-base font-black font-mono text-rose-800 block">
                AED {formatNumber(outstanding)}
              </span>
              <span className="text-[10px] text-rose-600/90 font-medium block truncate">
                {outstanding > 0
                  ? "Pending collection / settlement"
                  : "Zero balance due"}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Credit Facility Limit
              </span>
              <span className="text-base font-black font-mono text-slate-900 block">
                AED {formatNumber(creditLimit)}
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                Available: AED {formatNumber(availableCredit)}
              </span>
            </div>

            <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Total Settled / Paid
              </span>
              <span className="text-base font-black font-mono text-emerald-900 block">
                AED {isLoading ? "..." : formatNumber(summary?.totalPaid ?? 0)}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium block truncate">
                Invoiced: AED{" "}
                {isLoading ? "..." : formatNumber(summary?.totalBilled ?? 0)}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Contact Person &amp; Phone
              </span>
              <span className="text-xs font-bold text-slate-900 block truncate">
                {customer.contactPerson || "Primary Representative"}
              </span>
              <span className="text-[11px] font-mono text-slate-600 block truncate">
                {customer.phone || customer.email || "No direct phone"}
              </span>
            </div>
          </div>

          {/* 2-Column QA Details Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Box: Client Profile & Billing Details */}
            <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                  <BuildingIcon size={14} className="text-teal-700" />
                  Client Profile &amp; Billing Data
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Verified Account
                </span>
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    Full Legal Name
                  </span>
                  <span className="font-bold text-slate-800">
                    {customer.name}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    Company / Trade Name
                  </span>
                  <span className="text-slate-700 font-medium">
                    {customer.companyName || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    UAE VAT TRN (15 Digits)
                  </span>
                  <span className="font-mono font-bold text-emerald-800">
                    {customer.trn || "Not Registered"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    Billing Location
                  </span>
                  <span className="text-slate-700 truncate block">
                    {customer.address || "United Arab Emirates"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    Phone / Mobile
                  </span>
                  <span className="font-mono text-slate-700">
                    {customer.phone || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    Email Address
                  </span>
                  <span className="text-slate-700 truncate block">
                    {customer.email || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Box: Ledger & Recent Activity Preview */}
            <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-2xs space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                    <FileTextIcon size={14} className="text-teal-700" />
                    Recent Transactions &amp; Activity
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                    {statementData?.statement?.length ?? 0} Total Records
                  </span>
                </div>

                {isLoading ? (
                  <div className="py-6 text-center text-slate-400 text-xs animate-pulse">
                    Loading ledger preview...
                  </div>
                ) : recentStatements.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs italic">
                    No transactions recorded on this account yet.
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-2">
                    {recentStatements.map((tx: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50/70 border border-slate-100 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                              tx.type === "INVOICE"
                                ? "bg-amber-100 text-amber-900"
                                : tx.type === "PAYMENT"
                                  ? "bg-emerald-100 text-emerald-900"
                                  : "bg-sky-100 text-sky-900"
                            }`}
                          >
                            {tx.type}
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {tx.ref || tx.reference}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            {tx.date}
                          </span>
                        </div>
                        <div className="font-mono text-right">
                          <span
                            className={`font-bold ${
                              tx.debit > 0
                                ? "text-slate-900"
                                : "text-emerald-700"
                            }`}
                          >
                            {tx.debit > 0
                              ? `+AED ${formatNumber(tx.debit)}`
                              : `-AED ${formatNumber(tx.credit)}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Real-time ledger activity &amp; payments history.
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPrint}
                  icon={<PrintIcon size={12} className="text-emerald-700" />}
                  className="text-xs font-bold text-teal-800 hover:text-teal-900 cursor-pointer p-0 h-auto flex items-center gap-1"
                >
                  Print Full Statement →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ----------------------------------------------------------------------
// 3. Main Customers Master Page
// ----------------------------------------------------------------------
export default function CustomersMasterPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "OUTSTANDING" | "SETTLED" | "TRN"
  >("ALL");
  const { data: customers = [], isLoading, error } = useCustomers(search);
  const createCustomerMutation = useCreateCustomer();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(
    null,
  );

  // Isolated Printing State
  const [statementToPrint, setStatementToPrint] = useState<{
    customer: Customer;
    statement: any[];
    summary: {
      totalBilled: number;
      totalPaid: number;
      totalCredits: number;
      currentOutstanding: number;
    };
  } | null>(null);

  const printDocumentRef = useRef<HTMLDivElement>(null);

  const triggerPrint = useReactToPrint({
    contentRef: printDocumentRef,
    documentTitle: statementToPrint?.customer?.customerCode
      ? `Statement-${statementToPrint.customer.customerCode}`
      : "Customer-Statement-of-Account",
  });

  const handlePrintCustomer = async (
    customer: Customer,
    existingData?: {
      customer: Customer;
      statement: any[];
      summary: {
        totalBilled: number;
        totalPaid: number;
        totalCredits: number;
        currentOutstanding: number;
      };
    },
  ) => {
    if (existingData) {
      setStatementToPrint(existingData);
      setTimeout(() => {
        triggerPrint();
      }, 100);
      return;
    }
    try {
      const res = await fetch(
        `/api/commercial/customers/${customer.id}/statement`,
      );
      if (!res.ok) throw new Error("Failed to load customer statement");
      const data = await res.json();
      setStatementToPrint(data);
      setTimeout(() => {
        triggerPrint();
      }, 100);
    } catch (err: any) {
      alert(`Unable to print statement: ${err.message}`);
    }
  };

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const setField = useCallback(
    <K extends keyof typeof EMPTY_FORM>(k: K, v: string) =>
      setForm((p) => ({ ...p, [k]: v })),
    [],
  );

  const handleCloseCreate = useCallback(() => {
    setIsCreateOpen(false);
    setForm({ ...EMPTY_FORM });
  }, []);

  const handleCreateCustomer = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await createCustomerMutation.mutateAsync({
          customerCode: form.customerCode || undefined,
          name: form.name,
          companyName: form.companyName || undefined,
          trn: form.trn || undefined,
          contactPerson: form.contactPerson || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          creditLimit: parseFloat(form.creditLimit) || 0,
        });
        handleCloseCreate();
      } catch (err: any) {
        alert(`Error creating customer: ${err.message}`);
      }
    },
    [createCustomerMutation, form, handleCloseCreate],
  );

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const bal = Number(c.currentBalance || 0);
      if (statusFilter === "OUTSTANDING") return bal > 0;
      if (statusFilter === "SETTLED") return bal <= 0;
      if (statusFilter === "TRN") return Boolean(c.trn);
      return true;
    });
  }, [customers, statusFilter]);

  const totalReceivables = useMemo(
    () =>
      customers.reduce(
        (s, c) => s + Math.max(0, Number(c.currentBalance || 0)),
        0,
      ),
    [customers],
  );

  const totalCreditLimits = useMemo(
    () => customers.reduce((s, c) => s + Number(c.creditLimit || 0), 0),
    [customers],
  );

  const trnCount = useMemo(
    () => customers.filter((c) => c.trn).length,
    [customers],
  );

  return (
    <div className="space-y-6">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Customers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage client profiles, credit limits, contact information, and real-time statements of account.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer flex-1 sm:flex-initial"
          >
            Add New Customer
          </Button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* 1. Total Active Clients */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Total Active Clients
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Registered client accounts
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {customers.length}
            </span>
            <span className="text-xs font-bold text-slate-500 font-sans ml-1.5">
              Clients
            </span>
          </div>
        </div>

        {/* 2. Outstanding Receivables */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-rose-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              2. Outstanding Receivables
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Open invoices due
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-rose-500 font-sans mr-1">
              AED
            </span>
            <span className="text-xl font-black text-rose-700 font-mono">
              {formatNumber(totalReceivables)}
            </span>
          </div>
        </div>

        {/* 3. Approved Credit Facility */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              3. Total Credit Facility
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Extended credit limits
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-emerald-600 font-sans mr-1">
              AED
            </span>
            <span className="text-xl font-black text-emerald-800 font-mono">
              {formatNumber(totalCreditLimits)}
            </span>
          </div>
        </div>

        {/* 4. VAT TRN Compliant */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-teal-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                4. Corporate TRN
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Tax Reg
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              VAT verified entities
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-teal-900 font-mono">
              {trnCount}
            </span>
            <span className="text-xs font-bold text-teal-700 font-sans ml-1.5">
              Verified
            </span>
          </div>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 min-w-0 max-w-full">
        {/* Search & Filter Strip */}
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {/* Status Quick Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              {[
                { id: "ALL", label: "All Clients" },
                { id: "OUTSTANDING", label: "Outstanding Due" },
                { id: "SETTLED", label: "Settled Accounts" },
                { id: "TRN", label: "Tax Registered (TRN)" },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            <span className="text-[11px] font-bold text-slate-500 font-mono shrink-0">
              {filteredCustomers.length} Clients Displayed
            </span>
          </div>

          <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
            <Input
              leftIcon={<SearchIcon size={14} className="text-slate-400" />}
              placeholder="Search customer name, company, code, TRN, phone..."
              containerClassName="w-full sm:w-80 md:w-96"
              className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading customer directory: {(error as any).message}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
              <h4 className="font-black text-xs uppercase tracking-wider text-white">
                Master Customer Directory &amp; Ledger
              </h4>
              <span className="text-[11px] font-mono text-emerald-300 font-bold">
                {filteredCustomers.length} Clients
              </span>
            </div>

            <Table className="w-full text-xs text-left">
              <TableHead className="bg-slate-50 border-b border-slate-200">
                <TableRow>
                  <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    Customer Code
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    Customer / Company
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    TRN (UAE VAT)
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    Contact / Phone
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-[10.5px] tracking-wider"
                  >
                    Credit Limit (AED)
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-[10.5px] tracking-wider"
                  >
                    Outstanding (AED)
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-4 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider print:hidden">
                    Actions
                  </TableHeaderCell>
                </TableRow>
              </TableHead>

              <TableBody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <TableLoading
                    colSpan={7}
                    message="Loading customer directory..."
                  />
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-slate-400 italic"
                    >
                      No customers match your search criteria. Click &quot;Add
                      New Customer&quot; to create a new profile.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((c) => {
                    const isExpanded = expandedCustomerId === c.id;
                    return (
                      <Fragment key={c.id}>
                        <TableRow
                          onClick={() =>
                            setExpandedCustomerId(isExpanded ? null : c.id)
                          }
                          className={`hover:bg-emerald-50/40 cursor-pointer transition-colors ${
                            isExpanded
                              ? "bg-emerald-50/50 font-semibold"
                              : "text-slate-700"
                          }`}
                        >
                          <TableCell className="py-3 px-4 font-mono font-bold text-teal-800">
                            <div className="flex items-center gap-2">
                              <ChevronDownIcon
                                size={15}
                                className={`shrink-0 transition-transform duration-200 ${
                                  isExpanded
                                    ? "rotate-180 text-emerald-800"
                                    : "text-slate-400"
                                }`}
                              />
                              <BuildingIcon
                                size={13}
                                className="text-teal-700 shrink-0"
                              />
                              <span className="hover:text-emerald-800 transition-colors">
                                {c.customerCode}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4 font-bold text-slate-900">
                            <div>{c.name}</div>
                            {c.companyName && (
                              <div className="text-[10px] text-slate-400 font-normal">
                                {c.companyName}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-4 font-mono text-slate-600">
                            {c.trn ? (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                                {c.trn}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-slate-600">
                            <div className="font-semibold text-slate-800">
                              {c.contactPerson || c.phone || "—"}
                            </div>
                            {c.email && (
                              <div className="text-[10px] text-slate-400">
                                {c.email}
                              </div>
                            )}
                          </TableCell>
                          <TableCell
                            align="right"
                            className="py-3 px-4 text-right font-mono font-semibold text-slate-700"
                          >
                            {formatNumber(c.creditLimit)}
                          </TableCell>
                          <TableCell
                            align="right"
                            className={`py-3 px-4 text-right font-mono font-black text-xs ${
                              Number(c.currentBalance) > 0
                                ? "text-rose-700"
                                : "text-emerald-700"
                            }`}
                          >
                            {formatNumber(c.currentBalance)}
                          </TableCell>
                          <TableCell className="py-3 px-4 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintCustomer(c);
                                }}
                                icon={<PrintIcon size={13} className="text-emerald-700" />}
                                className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                title="Print Statement (PDF)"
                              >
                                Print
                              </Button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedCustomerId(
                                    isExpanded ? null : c.id,
                                  );
                                }}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  isExpanded
                                    ? "text-emerald-800 bg-emerald-100"
                                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                }`}
                                title={
                                  isExpanded
                                    ? "Collapse preview"
                                    : "Expand preview"
                                }
                              >
                                <ChevronDownIcon
                                  size={14}
                                  className={`transition-transform duration-200 ${
                                    isExpanded
                                      ? "rotate-180 text-emerald-800"
                                      : ""
                                  }`}
                                />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* QA-Style Accordion Expanded Drawer */}
                        {isExpanded && (
                          <CustomerExpandedRow
                            customer={c}
                            onPrint={() => handlePrintCustomer(c)}
                            onClose={() => setExpandedCustomerId(null)}
                          />
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modal for Creating Customer */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Add New Customer Profile"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Customer Code"
                placeholder="Auto-generated if blank (e.g. CUST-001)"
                value={form.customerCode}
                onChange={(e) => setField("customerCode", e.target.value)}
                className="font-mono"
              />

              <Input
                label="Customer Name / Entity *"
                placeholder="Full Legal / Trading Name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Company / Organization Name"
                placeholder="Company LLC / Corporation"
                value={form.companyName}
                onChange={(e) => setField("companyName", e.target.value)}
              />

              <Input
                label="UAE VAT TRN (15 Digits)"
                placeholder="100XXXXXXXXX003"
                value={form.trn}
                onChange={(e) => setField("trn", e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Contact Person"
                placeholder="Managing Director / PM"
                value={form.contactPerson}
                onChange={(e) => setField("contactPerson", e.target.value)}
              />

              <Input
                label="Phone / Mobile"
                placeholder="+971 50 XXXXXXX"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="accounts@client.com"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Address / Site Location (UAE)"
                placeholder="Sheikh Zayed Rd, Dubai, UAE"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
              />

              <Input
                label="Credit Limit (AED)"
                type="number"
                step="0.01"
                placeholder="50000.00"
                value={form.creditLimit}
                onChange={(e) => setField("creditLimit", e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                type="button"
                onClick={handleCloseCreate}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={createCustomerMutation.isPending}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
              >
                {createCustomerMutation.isPending
                  ? "Saving..."
                  : "Save Customer Record"}
              </Button>
            </div>
          </form>
        </Modal>
      )}



      {/* Off-screen Isolated Container for direct useReactToPrint */}
      <div
        style={{
          position: "fixed",
          left: "-99999px",
          top: "-99999px",
          width: "210mm",
        }}
      >
        <div ref={printDocumentRef}>
          {statementToPrint && (
            <CustomerStatementDocument
              customer={statementToPrint.customer}
              statement={statementToPrint.statement}
              summary={statementToPrint.summary}
            />
          )}
        </div>
      </div>
    </div>
  );
}
