"use client";

import React, { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  BuildingIcon,
  ClockIcon,
  CloseIcon,
  PrintIcon,
  SearchIcon,
  ShoppingCartIcon,
} from "@/components/icons";
import {
  Button,
  Input,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui";
import { usePayables } from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import { formatCurrency, formatNumber } from "./types";
import { ReportKpiCard, ReportKpiGrid } from "./ReportKpiCard";

export const AccountsPayableReport: React.FC = () => {
  const { data: payables, isLoading } = usePayables();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBucket, setSelectedBucket] = useState<string>("ALL");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const items = (payables as any)?.items || [];
  const aging = payables?.aging || {
    current: 0,
    days30: 0,
    days60: 0,
    days90Plus: 0,
  };

  const filteredItems = items.filter((item: any) => {
    const matchesSearch =
      item.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplierContact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.createdByUser?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBucket =
      selectedBucket === "ALL" || item.agingBucket === selectedBucket;

    return matchesSearch && matchesBucket;
  });

  const totalFilteredAmount = filteredItems.reduce(
    (s: number, i: any) => s + (i.remainingBalance ?? i.totalAmount ?? 0),
    0,
  );

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Accounts-Payable-Aging-Report",
  });

  const agingPills = [
    { key: "ALL", label: "All Vendor Bills" },
    { key: "current", label: "0–30 Days (Current)" },
    { key: "days30", label: "31–60 Days" },
    { key: "days60", label: "61–90 Days" },
    { key: "days90Plus", label: "90+ Days (Overdue)" },
  ];

  return (
    <div ref={printRef} className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6 print:p-0 print:m-0 print:border-none">
      <table className="print-page-table w-full border-collapse">
        <thead className="print-page-header-group">
          <tr>
            <th className="p-0 font-normal text-left border-none">
              <div className="hidden print:block">
                <QuotationHeader />
              </div>
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
              <div className="space-y-6 print:space-y-4 print:px-8 print:py-3">
                <div className="hidden print:flex justify-between items-center border-b-2 border-emerald-800 pb-2 print-avoid-break">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase block">
                      Accounts Payable &amp; Vendor Aging Statement
                    </span>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      VENDOR BALANCES &amp; AP AGING
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-700 font-mono font-bold text-xs">
                      {filteredItems.length} Records
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      Printed: {new Date().toLocaleDateString("en-GB")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 print:hidden">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-lg text-slate-900 tracking-tight">
                        Accounts Payable &amp; Vendor Aging
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Vendor liabilities and procurement bills mapped to GL
                      Account
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<PrintIcon size={14} />}
                      onClick={() => handlePrint()}
                      className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      Print Statement
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="py-16 text-center text-xs text-slate-400 animate-pulse space-y-2">
                    <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
                    <p>
                      Calculating Accounts Payable &amp; Vendor Aging
                      Schedule...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {}
                    <ReportKpiGrid cols={3}>
                      <ReportKpiCard
                        title="Total Payables (AP)"
                        subtitle={`${items.length} Active Vendor Bills`}
                        value={formatNumber(payables?.totalPayables || 0)}
                        accentColor="amber"
                        valueColor="text-amber-800"
                        icon={<ShoppingCartIcon size={14} className="text-amber-700" />}
                      />

                      <ReportKpiCard
                        title="Current (0–30d)"
                        subtitle="Within Credit Limit"
                        value={formatNumber(aging.current)}
                        accentColor="emerald"
                        valueColor="text-emerald-800"
                        icon={<span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />}
                      />

                      <ReportKpiCard
                        title="31–60 Days"
                        subtitle="Upcoming Due Date"
                        value={formatNumber(aging.days30)}
                        accentColor="blue"
                        valueColor="text-blue-800"
                        icon={<span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />}
                      />

                      <ReportKpiCard
                        title="61–90 Days"
                        subtitle="Payment Scheduled"
                        value={formatNumber(aging.days60)}
                        accentColor="amber"
                        valueColor="text-amber-700"
                        icon={<span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />}
                      />

                      <ReportKpiCard
                        title="90+ Days Overdue"
                        subtitle="Immediate Clearance"
                        value={formatNumber(aging.days90Plus)}
                        accentColor="rose"
                        valueColor="text-rose-700"
                        icon={<span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse inline-block" />}
                      />
                    </ReportKpiGrid>

                    {/* Compact Printable Payables Summary Strip */}
                    <div className="hidden print:grid grid-cols-4 gap-2.5 p-3 bg-white rounded-xl border border-slate-200 print-avoid-break mb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Current (0-30d)</span>
                        <span className="font-mono font-black text-emerald-800">{formatCurrency(aging.current)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">31-60 Days</span>
                        <span className="font-mono font-black text-blue-800">{formatCurrency(aging.days30)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">61-90 Days</span>
                        <span className="font-mono font-black text-amber-700">{formatCurrency(aging.days60)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">90+ Days Overdue</span>
                        <span className="font-mono font-black text-rose-700">{formatCurrency(aging.days90Plus)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-2 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs print:hidden">
                      <div className="flex-1 w-full max-w-sm">
                        <Input
                          type="text"
                          placeholder="Search supplier, bill number, contact, or user..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          leftIcon={<SearchIcon size={14} />}
                          className="text-xs font-semibold"
                        />
                      </div>

                      <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                        {agingPills.map((tab) => (
                          <Button
                            key={tab.key}
                            type="button"
                            variant="ghost"
                            onClick={() => setSelectedBucket(tab.key)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer h-auto ${
                              selectedBucket === tab.key
                                ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 text-amber-800 hover:bg-white"
                                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                            }`}
                          >
                            {tab.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                      <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
                        <h4 className="font-black text-xs uppercase tracking-wider text-white">
                          Supplier Aging &amp; Outstanding Bills Ledger
                        </h4>
                        <span className="text-[11px] font-mono text-amber-300 font-bold">
                          GL 2000 • Trade Payables
                        </span>
                      </div>

                      <Table className="w-full text-xs text-left">
                        <TableHead className="bg-slate-50/95 border-b border-slate-200">
                          <TableHeaderCell className="py-3 px-4 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Bill / PO #
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Supplier &amp; TRN
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Impacted GL
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Created By
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Bill Date
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                            Aging Status
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-4 text-right text-slate-700 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Total Bill (AED)
                          </TableHeaderCell>
                          <TableHeaderCell
                            align="right"
                            className="py-3 px-4 text-right text-slate-700 font-bold uppercase text-[10px] tracking-wider"
                          >
                            Balance Payable (AED)
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 text-center w-24 text-slate-600 font-bold uppercase text-[10px] tracking-wider print:hidden">
                            Action
                          </TableHeaderCell>
                        </TableHead>

                        <TableBody className="divide-y divide-slate-100">
                          {filteredItems.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={9}
                                className="text-center py-12 text-slate-400 text-xs italic"
                              >
                                No supplier payable records match your search
                                criteria.
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredItems.map((item: any) => {
                              const rem =
                                item.remainingBalance ?? item.totalAmount ?? 0;

                              return (
                                <TableRow
                                  key={item.id}
                                  className="hover:bg-slate-50/60 text-slate-700 transition-colors text-xs"
                                >
                                  <TableCell className="py-2.5 px-4 font-mono font-bold text-slate-900">
                                    <div className="flex items-center gap-1.5">
                                      <ShoppingCartIcon
                                        size={14}
                                        className="text-amber-700"
                                      />
                                      <span>{item.poNumber}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                                      Type:{" "}
                                      {item.type?.replace("_", " ") || "Bill"}
                                    </p>
                                  </TableCell>

                                  <TableCell className="py-2.5 px-4">
                                    <p className="font-bold text-slate-900">
                                      {item.supplierName}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-mono">
                                      TRN: {item.supplierTrn || "—"}
                                    </p>
                                  </TableCell>

                                  <TableCell className="py-2.5 px-4">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold font-mono">
                                      2000 - AP
                                    </span>
                                  </TableCell>

                                  <TableCell className="py-2.5 px-4">
                                    <div className="flex items-center gap-1.5">
                                      <div className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-bold">
                                        {(item.createdByUser || "U")[0]}
                                      </div>
                                      <div>
                                        <p className="font-medium text-slate-800 text-[11px] leading-tight">
                                          {item.createdByUser || "System"}
                                        </p>
                                        <p className="text-[9.5px] text-slate-400 leading-tight">
                                          {item.createdUserRole || "Accountant"}
                                        </p>
                                      </div>
                                    </div>
                                  </TableCell>

                                  <TableCell className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">
                                    {item.orderDate}
                                  </TableCell>

                                  <TableCell className="py-2.5 px-4">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        item.agingBucket === "current"
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                          : item.agingBucket === "days30"
                                            ? "bg-blue-50 text-blue-800 border-blue-200"
                                            : item.agingBucket === "days60"
                                              ? "bg-amber-50 text-amber-800 border-amber-200"
                                              : "bg-rose-50 text-rose-800 border-rose-200"
                                      }`}
                                    >
                                      <ClockIcon size={10} />
                                      {item.daysOutstanding}d (
                                      {item.agingBucket})
                                    </span>
                                  </TableCell>

                                  <TableCell
                                    align="right"
                                    className="py-2.5 px-4 text-right font-mono font-medium text-slate-600"
                                  >
                                    {formatNumber(item.totalAmount)}
                                  </TableCell>

                                  <TableCell
                                    align="right"
                                    className="py-2.5 px-4 text-right font-mono font-bold text-amber-800"
                                  >
                                    {formatNumber(rem)}
                                  </TableCell>

                                  <TableCell className="py-2.5 px-4 text-center print:hidden">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedItem(item)}
                                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer h-auto"
                                    >
                                      View Details
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>

                      <div className="bg-slate-50/95 p-3.5 px-5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-600">
                        <span>
                          Showing <strong>{filteredItems.length}</strong> of{" "}
                          <strong>{items.length}</strong> supplier payable
                          records
                        </span>
                        <div className="font-bold text-xs text-slate-800">
                          Filtered Total Payable:{" "}
                          <span className="text-amber-800 font-mono text-sm ml-1">
                            {formatCurrency(totalFilteredAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedItem && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
                      <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] p-5 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <BuildingIcon className="text-amber-300" size={20} />
                          <div>
                            <h3 className="font-bold text-base">
                              Payable Audit Breakdown
                            </h3>
                            <p className="text-[11px] text-white/70">
                              Ref: {selectedItem.poNumber}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedItem(null)}
                          className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition cursor-pointer h-auto"
                        >
                          <CloseIcon size={16} />
                        </Button>
                      </div>

                      <div className="p-6 space-y-4 text-xs text-slate-700">
                        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              Supplier / Vendor
                            </p>
                            <p className="font-bold text-slate-900 text-sm mt-0.5">
                              {selectedItem.supplierName}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                              TRN: {selectedItem.supplierTrn || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              Vendor Contact
                            </p>
                            <p className="text-slate-600 mt-0.5">
                              {selectedItem.supplierEmail || "—"}
                            </p>
                            <p className="text-slate-600">
                              {selectedItem.supplierContact || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                            <p className="text-[10px] font-bold uppercase text-amber-800">
                              Impacted GL Account
                            </p>
                            <p className="font-mono font-bold text-amber-900 mt-0.5">
                              2000 - Accounts Payable
                            </p>
                            <p className="text-[10px] text-amber-700 mt-0.5">
                              Credit Balance (Liability Account)
                            </p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              Created By User
                            </p>
                            <p className="font-bold text-slate-800 mt-0.5">
                              {selectedItem.createdByUser || "Administrator"}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {selectedItem.createdUserEmail || "admin@agm.ae"}{" "}
                              ({selectedItem.createdUserRole || "Admin"})
                            </p>
                          </div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Bill / Order Date:
                            </span>
                            <span className="font-mono font-medium text-slate-800">
                              {selectedItem.orderDate}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Payment Due Date:
                            </span>
                            <span className="font-mono font-medium text-slate-800">
                              {selectedItem.dueDate || "30 Days Net"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Days Outstanding:
                            </span>
                            <span className="font-bold text-rose-600">
                              {selectedItem.daysOutstanding} Days
                            </span>
                          </div>
                          <div className="h-px bg-slate-200 my-1" />
                          <div className="flex justify-between">
                            <span className="text-slate-500">
                              Total Billed Amount:
                            </span>
                            <span className="font-mono font-bold text-slate-800">
                              {formatCurrency(selectedItem.totalAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Paid Amount:</span>
                            <span className="font-mono text-emerald-700 font-bold">
                              {formatCurrency(selectedItem.paidAmount || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs font-bold bg-amber-50 p-2.5 rounded-xl text-amber-950 border border-amber-200/80">
                            <span>Remaining Payable Liability:</span>
                            <span className="font-mono text-amber-800 text-sm">
                              {formatCurrency(
                                selectedItem.remainingBalance ??
                                  selectedItem.totalAmount,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedItem(null)}
                          className="text-xs cursor-pointer"
                        >
                          Close Audit View
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="fixed-print-footer hidden print:block">
        <QuotationFooter />
      </div>
    </div>
  );
};

export default AccountsPayableReport;
