"use client";

import React, { Fragment, useState, useMemo } from "react";
import {
  BuildingIcon,
  ChevronDownIcon,
  EditIcon,
  PrintIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import { Customer } from "@/lib/hooks/api-hooks";
import { CustomerExpandedRow } from "./CustomerExpandedRow";
import { formatNumber } from "@/lib/utils/format";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";

export type CustomerFilterTab = "ALL" | "OUTSTANDING" | "SETTLED" | "TRN";

export interface CustomerTableProps {
  customers: Customer[];
  isLoading: boolean;
  error: any;
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: CustomerFilterTab;
  onStatusFilterChange: (tab: CustomerFilterTab) => void;
  expandedCustomerId: string | null;
  onToggleExpand: (id: string) => void;
  onPrintCustomer: (customer: Customer) => void;
  onEditCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (customer: Customer) => void;
}

const ITEMS_PER_PAGE = 10;

export function CustomerTable({
  customers,
  isLoading,
  error,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  expandedCustomerId,
  onToggleExpand,
  onPrintCustomer,
  onEditCustomer,
  onDeleteCustomer,
}: CustomerTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const filterTabs: { id: CustomerFilterTab; label: string }[] = [
    { id: "ALL", label: "All Clients" },
    { id: "OUTSTANDING", label: "Outstanding Due" },
    { id: "SETTLED", label: "Settled Accounts" },
    { id: "TRN", label: "Tax Registered (TRN)" },
  ];

  // Pagination logic
  const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return customers.slice(start, start + ITEMS_PER_PAGE);
  }, [customers, currentPage]);

  const startIndex = customers.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, customers.length);

  return (
    <div className="space-y-4">
      {/* ══════════ SLEEK UNIFIED FILTER BAR ══════════ */}
      <div
        className="p-2 sm:p-2.5 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  onStatusFilterChange(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                  isActive
                    ? "text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-[#cbd5e1]"
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: "#1d4ed8",
                      }
                    : undefined
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right side: Search Input + Total Count Pill */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <SearchIcon
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search customer name, company, code..."
              value={search}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border bg-white text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-[#1d4ed8]"
              style={{ borderColor: "#cbd5e1" }}
            />
          </div>

          <span
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-white border shrink-0 shadow-2xs"
            style={{ borderColor: "#cbd5e1" }}
          >
            Total: {customers.length}
          </span>
        </div>
      </div>

      {/* ══════════ CLEAN TABLE CONTAINER (NO DARK BANNER) ══════════ */}
      {error ? (
        <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
          Error loading customer directory: {(error as any).message}
        </div>
      ) : (
        <div
          className="bg-white rounded-xl overflow-hidden shadow-2xs"
          style={{ border: "1px solid #cbd5e1" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className="border-b text-[10.5px] font-bold text-slate-600 uppercase tracking-wider"
                  style={{
                    backgroundColor: "#f4f7fb",
                    borderColor: "#cbd5e1",
                  }}
                >
                  <th className="py-3 px-3.5 whitespace-nowrap">CUSTOMER CODE</th>
                  <th className="py-3 px-3.5">CUSTOMER / COMPANY</th>
                  <th className="py-3 px-3.5 whitespace-nowrap">PHONE / MOBILE</th>
                  <th className="py-3 px-3.5">EMAIL / LOCATION</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">CREDIT LIMIT (AED)</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap">OUTSTANDING (AED)</th>
                  <th className="py-3 px-3.5 text-right whitespace-nowrap pr-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="w-6 h-6 border-2 border-[#1d4ed8] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading customer directory...
                    </td>
                  </tr>
                ) : paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                      No customers match your search criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((c) => {
                    const isExpanded = expandedCustomerId === c.id;
                    const bal = Number(c.currentBalance || 0);
                    return (
                      <Fragment key={c.id}>
                        <tr
                          onClick={() => onToggleExpand(c.id)}
                          className={`hover:bg-[#f8fafc] transition-colors cursor-pointer ${
                            isExpanded ? "bg-[#f8fafc]" : ""
                          }`}
                        >
                          {/* Customer Code Badge */}
                          <td className="py-3 px-3.5 font-mono whitespace-nowrap">
                            <span
                              className="px-2 py-0.5 rounded text-[11px] font-bold"
                              style={{
                                backgroundColor: "#eff6ff",
                                color: "#1d4ed8",
                                border: "1px solid #bfdbfe",
                              }}
                            >
                              {c.customerCode || "CUST"}
                            </span>
                          </td>

                          {/* Customer Name & Company */}
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-900 truncate max-w-[200px]" title={c.name}>
                              {c.name}
                            </div>
                            {c.companyName && (
                              <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                                {c.companyName}
                              </div>
                            )}
                          </td>

                          {/* Phone / Mobile */}
                          <td className="py-3 px-3.5 font-mono text-slate-700 whitespace-nowrap">
                            {c.phone ? (
                              <span className="font-semibold text-slate-800 text-[11px]">
                                {c.phone}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          {/* Email / Address */}
                          <td className="py-3 px-3.5 text-slate-600">
                            <div className="font-medium text-slate-800 truncate max-w-[180px]">
                              {c.email || "—"}
                            </div>
                            {c.address && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                {c.address}
                              </div>
                            )}
                          </td>

                          {/* Credit Limit */}
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                            {formatNumber(c.creditLimit)}
                          </td>

                          {/* Outstanding */}
                          <td
                            className={`py-3 px-3.5 text-right font-mono font-bold whitespace-nowrap ${
                              bal > 0 ? "text-rose-600" : "text-emerald-700"
                            }`}
                          >
                            AED {formatNumber(bal)}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3.5 text-right pr-4 whitespace-nowrap">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* View SOA Profile */}
                              <Link
                                href={`/commercial/customers/${c.id}`}
                                className="p-1.5 text-slate-400 hover:text-[#1d4ed8] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="View Customer Profile & Statement"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>

                              {/* Print SOA PDF */}
                              <button
                                type="button"
                                onClick={() => onPrintCustomer(c)}
                                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Print Statement of Account (PDF)"
                              >
                                <PrintIcon size={16} />
                              </button>

                              {/* Edit Customer */}
                              {onEditCustomer && (
                                <button
                                  type="button"
                                  onClick={() => onEditCustomer(c)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Customer"
                                >
                                  <EditIcon size={16} />
                                </button>
                              )}

                              {/* Delete Customer */}
                              {onDeleteCustomer && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteCustomer(c)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Customer"
                                >
                                  <TrashIcon size={16} />
                                </button>
                              )}

                              {/* Toggle Expand */}
                              <button
                                type="button"
                                onClick={() => onToggleExpand(c.id)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  isExpanded
                                    ? "text-[#1d4ed8] bg-blue-50"
                                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                }`}
                                title={isExpanded ? "Collapse preview" : "Expand preview"}
                              >
                                <ChevronDownIcon
                                  size={16}
                                  className={`transition-transform duration-200 ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <CustomerExpandedRow
                            customer={c}
                            onPrint={() => onPrintCustomer(c)}
                            onEdit={onEditCustomer ? () => onEditCustomer(c) : undefined}
                            onClose={() => onToggleExpand(c.id)}
                          />
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ══════════ RESPONSIVE PAGINATION FOOTER ══════════ */}
          <div
            className="px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 bg-white"
            style={{ borderColor: "#cbd5e1" }}
          >
            <p className="text-xs text-slate-500 font-medium">
              Showing <span className="font-semibold text-slate-800">{startIndex}</span> to{" "}
              <span className="font-semibold text-slate-800">{endIndex}</span> of{" "}
              <span className="font-semibold text-slate-800">{customers.length}</span> clients
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border text-slate-500 hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                style={{ borderColor: "#cbd5e1" }}
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((page, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && page - prev > 1;
                  const isActive = currentPage === page;

                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "text-white shadow-2xs"
                            : "bg-white text-slate-600 hover:bg-[#f8fafc] border"
                        }`}
                        style={{
                          backgroundColor: isActive ? "#1d4ed8" : undefined,
                          borderColor: isActive ? "#1d4ed8" : "#cbd5e1",
                        }}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border text-slate-500 hover:bg-[#f8fafc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                style={{ borderColor: "#cbd5e1" }}
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
