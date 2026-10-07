"use client";

import React, { Fragment } from "react";
import {
  BuildingIcon,
  ChevronDownIcon,
  EditIcon,
  PrintIcon,
  SearchIcon,
  TrashIcon,
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
  { label: "Customer Code", compact: true, className: "whitespace-nowrap" },
  { label: "Customer / Company", compact: true },
  { label: "Phone / Mobile", compact: true, className: "whitespace-nowrap" },
  { label: "Email / Address", compact: true },
  {
    label: "Credit Limit (AED)",
    align: "right",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Outstanding (AED)",
    align: "right",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Actions",
    align: "right",
    compact: true,
    hideOnPrint: true,
    className: "whitespace-nowrap pr-3",
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
  onEditCustomer?: (customer: Customer) => void;
  onDeleteCustomer?: (customer: Customer) => void;
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
  onEditCustomer,
  onDeleteCustomer,
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
                      key={c.id}
                      onClick={() => onToggleExpand(c.id)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isExpanded ? "bg-slate-50/90 font-medium" : ""
                      }`}
                    >
                      <TableCell className="py-2 px-2.5 sm:px-3 font-mono font-bold text-teal-800 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <BuildingIcon
                            size={14}
                            className="text-teal-700 shrink-0"
                          />
                          <span className="hover:text-emerald-800 transition-colors">
                            {c.customerCode}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 px-2.5 sm:px-3 text-slate-900 text-xs">
                        <div
                          className="font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[180px]"
                          title={c.name}
                        >
                          {c.name}
                        </div>
                        {c.companyName && (
                          <div className="text-[10px] text-slate-400 font-normal truncate max-w-[140px]">
                            {c.companyName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-2 px-2.5 sm:px-3 font-mono text-slate-700 text-xs whitespace-nowrap">
                        {c.phone ? (
                          <span className="font-semibold text-slate-800 text-[11px]">
                            {c.phone}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 px-2.5 sm:px-3 text-slate-600 text-xs">
                        <div
                          className="font-semibold text-slate-800 truncate max-w-[150px] sm:max-w-[190px]"
                          title={c.email || ""}
                        >
                          {c.email || "—"}
                        </div>
                        {c.address && (
                          <div
                            className="text-[10px] text-slate-400 truncate max-w-[150px] sm:max-w-[190px]"
                            title={c.address}
                          >
                            {c.address}
                          </div>
                        )}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-2 px-2.5 text-right font-mono font-bold text-slate-700 text-xs whitespace-nowrap"
                      >
                        {formatNumber(c.creditLimit)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className={`py-2 px-2.5 text-right font-mono font-bold text-xs whitespace-nowrap ${
                          Number(c.currentBalance) > 0
                            ? "text-rose-700"
                            : "text-emerald-700"
                        }`}
                      >
                        {formatNumber(c.currentBalance)}
                      </TableCell>
                      <TableCell className="py-2 px-2 sm:pr-3 text-right print:hidden whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {onEditCustomer && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditCustomer(c);
                              }}
                              className="h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                              title="Edit Customer"
                            >
                              <EditIcon
                                size={18}
                                className="w-[18px] h-[18px]"
                              />
                            </Button>
                          )}
                          {onDeleteCustomer && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCustomer(c);
                              }}
                              className="h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                              title="Delete Customer"
                            >
                              <TrashIcon
                                size={18}
                                className="w-[18px] h-[18px]"
                              />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPrintCustomer(c);
                            }}
                            className="h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                            title="Print Statement (PDF)"
                          >
                            <PrintIcon
                              size={18}
                              className="w-[18px] h-[18px]"
                            />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleExpand(c.id);
                            }}
                            className={`h-8 w-8 p-0 flex items-center justify-center rounded-lg transition cursor-pointer ${
                              isExpanded
                                ? "text-emerald-800 bg-emerald-100"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                            }`}
                            title={
                              isExpanded ? "Collapse preview" : "Expand preview"
                            }
                          >
                            <ChevronDownIcon
                              size={18}
                              className={`w-[18px] h-[18px] transition-transform duration-200 ${
                                isExpanded ? "rotate-180 text-emerald-800" : ""
                              }`}
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <CustomerExpandedRow
                        customer={c}
                        onPrint={() => onPrintCustomer(c)}
                        onEdit={
                          onEditCustomer ? () => onEditCustomer(c) : undefined
                        }
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
