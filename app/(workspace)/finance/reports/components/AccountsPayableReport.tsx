"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Building2,
  Clock,
  Filter,
  Phone,
  Printer,
  Search,
  ShoppingCart,
  User,
  Mail,
  Receipt,
  X,
} from "lucide-react";
import {
  Button,
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

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 print:p-0 print:m-0">
      <table className="print-page-table w-full border-collapse">
        <thead className="print-page-header-group">
          <tr>
            <th className="p-0 font-normal text-left border-none">
              <div className="hidden print:block mb-4">
                <QuotationHeader />
                <div className="px-6 pt-3 pb-2 border-b border-slate-200 flex justify-between items-end">
                  <div>
                    <h1 className="text-lg font-black text-slate-900 uppercase">
                      Accounts Payable &amp; Vendor Aging Statement
                    </h1>
                    <p className="text-xs text-slate-500">
                      AGM FITOUT TECHNICAL SERVICES LLC — Supplier Liabilities
                      &amp; Outstanding Procurement Invoices
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Printed: {new Date().toLocaleDateString("en-GB")}
                  </p>
                </div>
              </div>
            </th>
          </tr>
        </thead>

        <tfoot className="print-page-footer-group">
          <tr>
            <td className="p-0 border-none">
              <div className="h-[80px] w-full hidden print:block" />
            </td>
          </tr>
        </tfoot>

        <tbody className="print-page-body-group">
          <tr>
            <td className="p-0 border-none align-top">
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      Accounts Payable & Vendor Aging
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Vendor liabilities and procurement bills mapped to GL
                      Account{" "}
                      <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        2000 - Accounts Payable (Liability)
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="flex items-center gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Printer size={15} />
                      Print Statement
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 print:grid-cols-5">
                  <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Total Payables (AP)
                      </span>
                      <ShoppingCart size={16} className="text-amber-700" />
                    </div>
                    <p className="text-2xl font-black mt-1 text-amber-700 font-mono">
                      {formatCurrency(payables?.totalPayables || 0)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {items.length} Active Vendor Bills
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Current (0–30d)
                      </span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                    <p className="text-2xl font-black text-emerald-800 mt-1 font-mono">
                      {formatCurrency(aging.current)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Within Credit Limit
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        31–60 Days
                      </span>
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    </div>
                    <p className="text-2xl font-black text-blue-800 mt-1 font-mono">
                      {formatCurrency(aging.days30)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Upcoming Due Date
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        61–90 Days
                      </span>
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                    </div>
                    <p className="text-2xl font-black text-amber-700 mt-1 font-mono">
                      {formatCurrency(aging.days60)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Payment Scheduled
                    </p>
                  </div>

                  <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        90+ Days Overdue
                      </span>
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    </div>
                    <p className="text-2xl font-black text-rose-700 mt-1 font-mono">
                      {formatCurrency(aging.days90Plus)}
                    </p>
                    <p className="text-xs text-rose-600 font-bold mt-0.5">
                      Immediate Clearance
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
                  <div className="relative flex-1 w-full">
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      placeholder="Search by supplier name, bill number, contact person, or creator user..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    {[
                      { key: "ALL", label: "All Bills" },
                      { key: "current", label: "0–30 Days" },
                      { key: "days30", label: "31–60 Days" },
                      { key: "days60", label: "61–90 Days" },
                      { key: "days90Plus", label: "90+ Days" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setSelectedBucket(tab.key)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                          selectedBucket === tab.key
                            ? "bg-[#1d3345] text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHead>
                        <TableRow className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          <TableHeaderCell className="py-3 px-4">
                            Bill / PO #
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4">
                            Supplier & TRN
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4">
                            Impacted GL Account
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4">
                            Created By (User)
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4">
                            Bill Date
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4">
                            Aging
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 text-right">
                            Total Bill
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 text-right">
                            Balance Payable
                          </TableHeaderCell>
                          <TableHeaderCell className="py-3 px-4 text-center print:hidden">
                            Action
                          </TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredItems.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={9}
                              className="text-center py-12 text-slate-400 text-sm"
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
                                className="hover:bg-slate-50/70 border-b border-slate-100 transition-colors text-xs"
                              >
                                <TableCell className="py-3 px-4 font-mono font-bold text-slate-800">
                                  <div className="flex items-center gap-1.5">
                                    <ShoppingCart
                                      size={14}
                                      className="text-blue-600 shrink-0"
                                    />
                                    <span>{item.poNumber}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-sans">
                                    Type:{" "}
                                    {item.type?.replace("_", " ") || "Bill"}
                                  </p>
                                </TableCell>

                                <TableCell className="py-3 px-4">
                                  <p className="font-bold text-slate-800">
                                    {item.supplierName}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    TRN: {item.supplierTrn || "—"}
                                  </p>
                                </TableCell>

                                <TableCell className="py-3 px-4">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[10.5px] font-semibold font-mono">
                                    2000 - AP
                                  </span>
                                </TableCell>

                                <TableCell className="py-3 px-4">
                                  <div className="flex items-center gap-1.5">
                                    <div className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-bold">
                                      {(item.createdByUser || "U")[0]}
                                    </div>
                                    <div>
                                      <p className="font-medium text-slate-700 text-[11px] leading-tight">
                                        {item.createdByUser || "System"}
                                      </p>
                                      <p className="text-[9.5px] text-slate-400 leading-tight">
                                        {item.createdUserRole || "Accountant"}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>

                                <TableCell className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                                  {item.orderDate}
                                </TableCell>

                                <TableCell className="py-3 px-4">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      item.agingBucket === "current"
                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                        : item.agingBucket === "days30"
                                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                                          : item.agingBucket === "days60"
                                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                                            : "bg-rose-100 text-rose-800 border border-rose-200"
                                    }`}
                                  >
                                    <Clock size={10} />
                                    {item.daysOutstanding}d ({item.agingBucket})
                                  </span>
                                </TableCell>

                                <TableCell className="py-3 px-4 text-right font-mono text-slate-500">
                                  {formatCurrency(item.totalAmount)}
                                </TableCell>

                                <TableCell className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                                  {formatCurrency(rem)}
                                </TableCell>

                                <TableCell className="py-3 px-4 text-center print:hidden">
                                  <button
                                    onClick={() => setSelectedItem(item)}
                                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                                  >
                                    View Details
                                  </button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-600">
                    <span>
                      Showing <strong>{filteredItems.length}</strong> of{" "}
                      <strong>{items.length}</strong> supplier payable records
                    </span>
                    <div className="font-bold text-sm text-slate-800">
                      Filtered Total Payable:{" "}
                      <span className="text-blue-700 font-mono">
                        {formatCurrency(totalFilteredAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedItem && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
                      <div className="bg-gradient-to-r from-[#1d3345] to-[#233c4d] p-5 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Building2 className="text-blue-400" size={20} />
                          <div>
                            <h3 className="font-bold text-base">
                              Payable Audit Breakdown
                            </h3>
                            <p className="text-[11px] text-white/70">
                              Ref: {selectedItem.poNumber}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedItem(null)}
                          className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="p-6 space-y-4 text-xs text-slate-700">
                        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              Supplier / Vendor
                            </p>
                            <p className="font-bold text-slate-800 text-sm mt-0.5">
                              {selectedItem.supplierName}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
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
                          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                            <p className="text-[10px] font-bold uppercase text-blue-800">
                              Impacted GL Account
                            </p>
                            <p className="font-mono font-bold text-blue-900 mt-0.5">
                              2000 - Accounts Payable
                            </p>
                            <p className="text-[10px] text-blue-700 mt-0.5">
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
                            <span className="font-mono text-emerald-600 font-bold">
                              {formatCurrency(selectedItem.paidAmount || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm font-bold bg-blue-100/60 p-2 rounded-xl text-blue-950">
                            <span>Remaining Payable Liability:</span>
                            <span className="font-mono text-blue-800">
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
                          className="text-xs"
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

      <div className="hidden print:block">
        <QuotationFooter />
      </div>
    </div>
  );
};
