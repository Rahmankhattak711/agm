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
  RegisterTable,
  RegisterColumn,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  FilterBar,
} from "@/components/ui";
import { Customer } from "@/lib/hooks/api-hooks";
import { CustomerExpandedRow } from "./CustomerExpandedRow";
import { formatNumber } from "@/lib/utils/format";

const COLUMNS: RegisterColumn[] = [
  { label: "Customer Code", className: "whitespace-nowrap min-w-[160px]" },
  { label: "Customer / Company", className: "min-w-[170px]" },
  { label: "Phone / Mobile", className: "whitespace-nowrap min-w-[140px]" },
  { label: "Email / Address", className: "min-w-[160px]" },
  {
    label: "Credit Limit (AED)",
    align: "right",
    className: "whitespace-nowrap",
  },
  {
    label: "Outstanding (AED)",
    align: "right",
    className: "whitespace-nowrap",
  },
  {
    label: "Actions",
    align: "center",
    hideOnPrint: true,
    className: "whitespace-nowrap",
  },
];

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
      <FilterBar
        tabs={filterTabs}
        activeTab={statusFilter}
        onTabChange={(tabId) =>
          onStatusFilterChange(tabId as CustomerFilterTab)
        }
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search customer name, company, code, TRN, phone..."
        totalCount={customers.length}
        countLabel="Clients Displayed"
      />

      {error ? (
        <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
          Error loading customer directory: {(error as any).message}
        </div>
      ) : (
        <RegisterTable
          title="Master Customer Directory & Ledger"
          countLabel={`${customers.length} Clients`}
          columns={COLUMNS}
        >
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
                      <TableCell className="py-2.5 px-4 font-mono font-bold text-teal-800 whitespace-nowrap min-w-[160px]">
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
                              isExpanded ? "Collapse preview" : "Expand preview"
                            }
                          >
                            <ChevronDownIcon
                              size={14}
                              className={`transition-transform duration-200 ${
                                isExpanded ? "rotate-180 text-emerald-800" : ""
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
        </RegisterTable>
      )}
    </div>
  );
}
