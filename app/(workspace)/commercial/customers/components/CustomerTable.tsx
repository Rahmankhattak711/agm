"use client";

import React, { Fragment } from "react";
import {
  BuildingIcon,
  ChevronDownIcon,
  PrintIcon,
  SearchIcon,
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
  TableLoading,
} from "@/components/ui";
import { Customer } from "@/lib/hooks/api-hooks";
import { CustomerExpandedRow } from "./CustomerExpandedRow";

function formatNumber(val: number | string | undefined): string {
  const num = Number(val || 0);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

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
}

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
}: CustomerTableProps) {
  const filterTabs: { id: CustomerFilterTab; label: string }[] = [
    { id: "ALL", label: "All Clients" },
    { id: "OUTSTANDING", label: "Outstanding Due" },
    { id: "SETTLED", label: "Settled Accounts" },
    { id: "TRN", label: "Tax Registered (TRN)" },
  ];

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 min-w-0 max-w-full">
      <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {filterTabs.map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <Button
                  key={tab.id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onStatusFilterChange(tab.id)}
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
            {customers.length} Clients Displayed
          </span>
        </div>

        <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
          <Input
            leftIcon={<SearchIcon size={14} className="text-slate-400" />}
            placeholder="Search customer name, company, code, TRN, phone..."
            containerClassName="w-full sm:w-80 md:w-96"
            className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
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
              {customers.length} Clients
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
                  Phone / Mobile
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Email / Address
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
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-slate-400 italic"
                  >
                    No customers match your search criteria. Click &quot;Add New
                    Customer&quot; to create a new profile.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => {
                  const isExpanded = expandedCustomerId === c.id;
                  return (
                    <Fragment key={c.id}>
                      <TableRow
                        onClick={() => onToggleExpand(c.id)}
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
                        <TableCell className="py-3 px-4 font-mono text-slate-700">
                          {c.phone ? (
                            <span className="font-semibold text-slate-800 text-[11px]">
                              {c.phone}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-slate-600">
                          <div className="font-semibold text-slate-800">
                            {c.email || "—"}
                          </div>
                          {c.address && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                              {c.address}
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
                                onPrintCustomer(c);
                              }}
                              icon={
                                <PrintIcon
                                  size={13}
                                  className="text-emerald-700"
                                />
                              }
                              className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                              title="Print Statement (PDF)"
                            >
                              Print
                            </Button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpand(c.id);
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

                      {isExpanded && (
                        <CustomerExpandedRow
                          customer={c}
                          onPrint={() => onPrintCustomer(c)}
                          onClose={() => onToggleExpand(c.id)}
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
  );
}
