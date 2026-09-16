"use client";

import {
  PrintIcon,
  SearchIcon,
} from "@/components/icons";
import { QuotationFooter, QuotationHeader } from "@/components/quotation";
import {
  Button,
  Modal,
} from "@/components/ui";
import {
  SalesInvoice,
  useSalesInvoices,
} from "@/lib/hooks/api-hooks";
import React, { useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { formatNumber } from "./types";

export const TaxInvoicesReport: React.FC = () => {
  const { data: invoices = [], isLoading } = useSalesInvoices();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(
    null,
  );

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.customerName && inv.customerName.toLowerCase().includes(q)) ||
        (inv.customerTrn && inv.customerTrn.toLowerCase().includes(q)) ||
        (inv.quotationRef && inv.quotationRef.toLowerCase().includes(q)) ||
        (inv.projectScope && inv.projectScope.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "POSTED" && inv.status === "POSTED") ||
        (statusFilter === "DRAFT" && inv.status === "DRAFT") ||
        (statusFilter === "PAID" && inv.status === "PAID") ||
        (statusFilter === "PARTIALLY_PAID" &&
          inv.status === "PARTIALLY_PAID") ||
        (statusFilter === "OVERDUE" && inv.status === "OVERDUE");

      let matchesDate = true;
      if (dateFilter !== "ALL" && inv.invoiceDate) {
        const invDate = new Date(inv.invoiceDate);
        const now = new Date();
        if (dateFilter === "THIS_MONTH") {
          matchesDate =
            invDate.getMonth() === now.getMonth() &&
            invDate.getFullYear() === now.getFullYear();
        } else if (dateFilter === "THIS_YEAR") {
          matchesDate = invDate.getFullYear() === now.getFullYear();
        } else if (dateFilter === "Q1") {
          matchesDate = [0, 1, 2].includes(invDate.getMonth());
        } else if (dateFilter === "Q2") {
          matchesDate = [3, 4, 5].includes(invDate.getMonth());
        } else if (dateFilter === "Q3") {
          matchesDate = [6, 7, 8].includes(invDate.getMonth());
        } else if (dateFilter === "Q4") {
          matchesDate = [9, 10, 11].includes(invDate.getMonth());
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [invoices, searchTerm, statusFilter, dateFilter]);

  const totalGrossInvoiced = useMemo(
    () => filteredInvoices.reduce((s, i) => s + Number(i.totalAmount || 0), 0),
    [filteredInvoices],
  );

  const totalNetTaxable = useMemo(
    () => filteredInvoices.reduce((s, i) => s + Number(i.subtotal || 0), 0),
    [filteredInvoices],
  );

  const totalVatAssessed = useMemo(
    () => filteredInvoices.reduce((s, i) => s + Number(i.vatAmount || 0), 0),
    [filteredInvoices],
  );

  const totalBalanceDue = useMemo(
    () =>
      filteredInvoices.reduce(
        (s, i) => s + Number(i.remainingBalance ?? i.totalAmount ?? 0),
        0,
      ),
    [filteredInvoices],
  );

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Tax-Invoices-Register-Statement",
  });

  const modalPrintRef = useRef<HTMLDivElement>(null);
  const handlePrintSingle = useReactToPrint({
    contentRef: modalPrintRef,
    documentTitle: `Tax-Invoice-${selectedInvoice?.invoiceNumber || "Doc"}`,
  });

  const statusPills = [
    { key: "ALL", label: "All Invoices" },
    { key: "POSTED", label: "Posted" },
    { key: "PAID", label: "Paid" },
    { key: "PARTIALLY_PAID", label: "Partially Paid" },
    { key: "DRAFT", label: "Draft" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2.5 bg-agm-card rounded-2xl border border-agm-box-border shadow-2xs print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <SearchIcon
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-agm-muted"
            />
            <input
              type="text"
              placeholder="Search invoice #, customer, TRN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-agm-box-border bg-agm-box-bg text-agm-text outline-none focus:border-agm-green w-52 sm:w-60"
            />
          </div>

          {/* Status Pills */}
          <div className="inline-flex items-center p-1 bg-agm-box-bg rounded-xl border border-agm-box-border overflow-x-auto">
            {statusPills.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setStatusFilter(p.key)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === p.key
                    ? "bg-agm-card text-agm-navy shadow-xs border border-agm-box-border"
                    : "text-agm-muted hover:text-agm-text"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Period Select */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-agm-box-border bg-agm-card text-agm-text outline-none focus:border-agm-green cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Periods</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="THIS_YEAR">This Year (2026)</option>
            <option value="Q1">Q1 (Jan - Mar)</option>
            <option value="Q2">Q2 (Apr - Jun)</option>
            <option value="Q3">Q3 (Jul - Sep)</option>
            <option value="Q4">Q4 (Oct - Dec)</option>
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePrint()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-agm-text border-agm-box-border bg-agm-card hover:bg-agm-box-bg cursor-pointer shadow-2xs rounded-xl h-auto shrink-0"
          icon={<PrintIcon size={14} />}
        >
          Print Invoices Register
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-xs text-agm-muted animate-pulse space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-agm-green border-t-transparent animate-spin mx-auto" />
          <p>Loading Tax Invoices register...</p>
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
                        AGM FITOUT TECHNICAL SERVICES LLC - TAX INVOICES &amp; REVENUE REGISTER
                      </div>

                      {/* 4. Table */}
                      <table className="w-full border-collapse text-[12px] print:text-[11.5px] text-agm-text">
                        <thead>
                          <tr className="bg-agm-box-bg font-bold text-agm-text border-b border-agm-box-border">
                            <th className="py-2.5 px-3 text-left font-bold w-[18%]">
                              Invoice # &amp; Date
                            </th>
                            <th className="py-2.5 px-3 text-left font-bold w-[26%]">
                              Customer &amp; TRN
                            </th>
                            <th className="py-2.5 px-3 text-left font-bold w-[20%]">
                              Project / Scope
                            </th>
                            <th className="py-2.5 px-3 text-right font-bold w-[12%]">
                              Net (AED)
                            </th>
                            <th className="py-2.5 px-3 text-right font-bold w-[10%]">
                              VAT 5%
                            </th>
                            <th className="py-2.5 px-3 text-right font-bold w-[14%]">
                              Gross (AED)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInvoices.length === 0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="py-8 text-center text-agm-muted italic border-b border-agm-box-border"
                              >
                                No tax invoices matching the selected criteria.
                              </td>
                            </tr>
                          ) : (
                            filteredInvoices.map((inv) => (
                              <tr
                                key={inv.id}
                                className="border-b border-agm-box-border/50 hover:bg-agm-box-bg/50"
                              >
                                <td className="py-2 px-3">
                                  <span className="font-mono font-bold text-agm-navy block">
                                    {inv.invoiceNumber}
                                  </span>
                                  <span className="text-[10.5px] text-agm-muted">
                                    {inv.invoiceDate
                                      ? new Date(inv.invoiceDate).toLocaleDateString("en-GB")
                                      : "—"}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  <span className="font-semibold text-agm-text block">
                                    {inv.customerName || "General Customer"}
                                  </span>
                                  {inv.customerTrn && (
                                    <span className="text-[10px] font-mono text-agm-muted">
                                      TRN: {inv.customerTrn}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-agm-muted truncate max-w-[140px]">
                                  {inv.projectScope || inv.quotationRef || "—"}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-agm-text font-semibold">
                                  {formatNumber(inv.subtotal)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-agm-text">
                                  {formatNumber(inv.vatAmount)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-agm-text">
                                  {formatNumber(inv.totalAmount)}
                                </td>
                              </tr>
                            ))
                          )}

                          {/* Totals Row */}
                          <tr className="bg-agm-navy/10 text-agm-navy font-bold border-t border-b border-agm-navy/20">
                            <td colSpan={3} className="py-2.5 px-3 font-bold text-agm-navy">
                              Total Tax Invoices ({filteredInvoices.length} Invoices)
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-agm-navy">
                              {formatNumber(totalNetTaxable)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-agm-navy">
                              {formatNumber(totalVatAssessed)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-agm-navy">
                              {formatNumber(totalGrossInvoiced)}
                            </td>
                          </tr>

                          {/* Outstanding Due Row */}
                          <tr className="bg-agm-sidebar text-white font-bold border-t-2 border-agm-green">
                            <td colSpan={5} className="py-2.5 px-3 font-black text-white text-[12.5px]">
                              Total Balance Outstanding Due
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-300 text-[12.5px]">
                              {formatNumber(totalBalanceDue)}
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

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Tax Invoice: ${selectedInvoice.invoiceNumber}`}
          maxWidth="4xl"
        >
          <div className="space-y-4">
            <div className="flex justify-end gap-2 pb-3 border-b border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrintSingle()}
                icon={<PrintIcon size={14} />}
              >
                Print Invoice
              </Button>
            </div>

            <div
              ref={modalPrintRef}
              className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 print:p-0 print:border-none"
            >
              <QuotationHeader className="!px-0 !pt-0 !pb-2 !border-b-0" />
              <div className="text-center py-1.5 bg-agm-navy text-white font-bold uppercase text-xs">
                TAX INVOICE — {selectedInvoice.invoiceNumber}
              </div>
              <div className="grid grid-cols-2 text-xs gap-2 py-2 border-b border-slate-100">
                <div>
                  <strong>Customer:</strong> {selectedInvoice.customerName}
                  <br />
                  <strong>TRN:</strong> {selectedInvoice.customerTrn || "N/A"}
                </div>
                <div className="text-right">
                  <strong>Date:</strong>{" "}
                  {selectedInvoice.invoiceDate
                    ? new Date(selectedInvoice.invoiceDate).toLocaleDateString(
                        "en-GB",
                      )
                    : "—"}
                  <br />
                  <strong>Status:</strong> {selectedInvoice.status}
                </div>
              </div>
              <div className="flex justify-between font-bold text-sm pt-2">
                <span>Total Amount (Inc VAT 5%):</span>
                <span>AED {formatNumber(selectedInvoice.totalAmount)}</span>
              </div>
              <QuotationFooter className="!mt-4 !px-0" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TaxInvoicesReport;
