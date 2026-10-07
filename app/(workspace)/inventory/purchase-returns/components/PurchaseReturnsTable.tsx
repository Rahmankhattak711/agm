"use client";

import React, { Fragment } from "react";
import { ChevronDownIcon, PrintIcon, RotateCcwIcon } from "@/components/icons";
import {
  Button,
  Badge,
  RegisterTable,
  RegisterColumn,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  EmptyState,
} from "@/components/ui";
import { PurchaseReturnItem, formatAed } from "./types";
import { PurchaseReturnExpandedRow } from "./PurchaseReturnExpandedRow";

const COLUMNS: RegisterColumn[] = [
  { label: "Debit Note & Ref", compact: true, className: "whitespace-nowrap" },
  { label: "Supplier / Vendor", compact: true },
  { label: "Project / Scope", compact: true },
  { label: "Return Reason", compact: true },
  {
    label: "Return Date",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Status",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Amount (AED)",
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

interface PurchaseReturnsTableProps {
  filteredReturns: PurchaseReturnItem[];
  expandedReturnId: string | null;
  onToggleExpand: (id: string) => void;
  onPrintReturn: (item: PurchaseReturnItem) => void;
  isLoading?: boolean;
  onOpenCreate?: () => void;
  isFiltered?: boolean;
  onClearFilters?: () => void;
}

const getStatusTone = (
  status: string,
): "emerald" | "sky" | "amber" | "slate" | "rose" => {
  switch (status) {
    case "POSTED":
    case "COMPLETED":
      return "emerald";
    case "APPROVED":
      return "sky";
    case "SUBMITTED":
      return "amber";
    case "DRAFT":
      return "slate";
    case "CANCELLED":
    case "REJECTED":
      return "rose";
    default:
      return "slate";
  }
};

const PurchaseReturnsTable: React.FC<PurchaseReturnsTableProps> = ({
  filteredReturns,
  expandedReturnId,
  onToggleExpand,
  onPrintReturn,
  isLoading = false,
  onOpenCreate,
  isFiltered = false,
  onClearFilters,
}) => {
  return (
    <RegisterTable
      title="Vendor Return Vouchers & Debit Notes Register"
      countLabel={`${filteredReturns.length} Active Records`}
      columns={COLUMNS}
    >
      <TableBody className="divide-y divide-slate-100 font-medium">
        {isLoading ? (
          <TableLoading colSpan={8} rows={5} />
        ) : filteredReturns.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={8} className="p-0 border-0">
              <EmptyState
                icon={<RotateCcwIcon size={20} className="text-slate-400" />}
                title="No purchase returns found"
                description={
                  isFiltered
                    ? "No purchase returns matched your search criteria."
                    : "No purchase returns in database. Click 'Log Purchase Return' to create one."
                }
                actionLabel={
                  isFiltered ? "Reset Filters" : "Log Purchase Return"
                }
                onAction={isFiltered ? onClearFilters : onOpenCreate}
              />
            </TableCell>
          </TableRow>
        ) : (
          filteredReturns.map((item) => {
            const isExpanded = expandedReturnId === item.id;
            const projectDisplay = item.projectName
              ? `${item.projectCode ? `${item.projectCode} — ` : ""}${item.projectName}`
              : "General / Warehouse Stock";
            const total = Number(item.totalAmount || 0);

            return (
              <Fragment key={item.id}>
                <TableRow
                  onClick={() => onToggleExpand(item.id)}
                  className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                    isExpanded ? "bg-slate-50/90 font-medium" : ""
                  }`}
                >
                  <TableCell className="py-2 px-2.5 sm:px-3 font-mono font-bold text-slate-900 whitespace-nowrap text-xs">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <RotateCcwIcon
                        size={14}
                        className="text-amber-600 shrink-0"
                      />
                      <span className="hover:text-emerald-800 transition-colors">
                        {item.returnNumber}
                      </span>
                    </div>
                    <div className="text-[10px] text-teal-800 font-mono font-semibold mt-0.5 ml-5 truncate max-w-[130px]">
                      Ref: {item.poReference || "Direct Debit"}
                    </div>
                  </TableCell>

                  <TableCell className="py-2 px-2.5 sm:px-3 text-xs">
                    <div
                      className="font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[180px]"
                      title={item.supplierName}
                    >
                      {item.supplierName}
                    </div>
                    {item.supplierTrn && (
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                        TRN: {item.supplierTrn}
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="py-2 px-2.5 sm:px-3 text-slate-700 text-xs">
                    <div
                      className="font-medium text-slate-800 truncate max-w-[120px] sm:max-w-[160px]"
                      title={projectDisplay}
                    >
                      {projectDisplay}
                    </div>
                    {item.clientName && (
                      <div
                        className="text-[10px] text-slate-400 truncate max-w-[120px] sm:max-w-[160px]"
                        title={item.clientName}
                      >
                        Client: {item.clientName}
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="py-2 px-2.5 sm:px-3 text-slate-600 text-xs">
                    <div
                      className="truncate max-w-[130px] sm:max-w-[180px]"
                      title={item.reason}
                    >
                      {item.reason}
                    </div>
                  </TableCell>

                  <TableCell className="py-2 px-2 text-center font-mono text-slate-600 text-[11px] whitespace-nowrap">
                    {item.returnDate
                      ? new Date(item.returnDate).toLocaleDateString("en-GB")
                      : "—"}
                  </TableCell>

                  <TableCell className="py-2 px-2 text-center whitespace-nowrap">
                    <Badge
                      tone={getStatusTone(item.status)}
                      className="text-[10.5px] px-2 py-0.5"
                    >
                      {item.status}
                    </Badge>
                  </TableCell>

                  <TableCell
                    align="right"
                    className="py-2 px-2.5 text-right font-mono font-bold text-rose-700 whitespace-nowrap text-xs"
                  >
                    {formatAed(total)}
                  </TableCell>

                  <TableCell className="py-2 px-2 sm:pr-3 text-right print:hidden whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPrintReturn(item);
                        }}
                        className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                        title="Print Debit Note (PDF)"
                      >
                        <PrintIcon size={18} className="w-[18px] h-[18px]" />
                      </Button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleExpand(item.id);
                        }}
                        className={`h-8 w-8 p-0 flex items-center justify-center rounded-lg transition cursor-pointer ${
                          isExpanded
                            ? "text-emerald-800 bg-emerald-100"
                            : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
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
                      </button>
                    </div>
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <PurchaseReturnExpandedRow
                    item={item}
                    onPrint={() => onPrintReturn(item)}
                    onClose={() => onToggleExpand(item.id)}
                  />
                )}
              </Fragment>
            );
          })
        )}
      </TableBody>
    </RegisterTable>
  );
};

export default PurchaseReturnsTable;
