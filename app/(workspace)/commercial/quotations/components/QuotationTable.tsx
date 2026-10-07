"use client";

import React, { Fragment, useState } from "react";
import {
  RegisterTable,
  RegisterColumn,
  Badge,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  EmptyState,
  Button,
} from "@/components/ui";
import { getQuotationStatus } from "@/lib/utils/status";
import {
  FileSpreadsheetIcon,
  FileTextIcon,
  EditIcon,
  TrashIcon,
  ChevronDownIcon,
  SearchIcon,
} from "@/components/icons";
import { QuotationExpandedRow } from "./QuotationExpandedRow";

const COLUMNS: RegisterColumn[] = [
  { label: "Quotation No", compact: true, className: "whitespace-nowrap" },
  { label: "Customer / Client", compact: true },
  { label: "Project Scope & Ref", compact: true },
  {
    label: "Date",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Total (AED)",
    align: "right",
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
    label: "Actions",
    align: "right",
    compact: true,
    hideOnPrint: true,
    className: "whitespace-nowrap pr-3",
  },
];

export interface QuotationTableProps {
  quotations: any[];
  isLoading: boolean;
  error?: any;
  isFiltered: boolean;
  convertingId: string | null;
  expandedQuotationId?: string | null;
  onToggleExpand?: (id: string) => void;
  onClearFilters: () => void;
  onOpenEditor: (q?: any) => void;
  onConvertToInvoice: (q: any) => void;
  onDeleteQuotation?: (q: any) => void;
  formatNumber: (val: number | string | undefined) => string;
}

export const QuotationTable: React.FC<QuotationTableProps> = ({
  quotations,
  isLoading,
  error,
  isFiltered,
  convertingId,
  expandedQuotationId,
  onToggleExpand,
  onClearFilters,
  onOpenEditor,
  onConvertToInvoice,
  onDeleteQuotation,
  formatNumber,
}) => {
  const [internalExpandedId, setInternalExpandedId] = useState<string | null>(
    null,
  );

  const activeExpandedId =
    expandedQuotationId !== undefined
      ? expandedQuotationId
      : internalExpandedId;

  const handleToggle = (id: string) => {
    if (onToggleExpand) {
      onToggleExpand(id);
    } else {
      setInternalExpandedId((prev) => (prev === id ? null : id));
    }
  };

  if (error) {
    return (
      <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
        Error loading quotations: {(error as any).message}
      </div>
    );
  }

  return (
    <RegisterTable
      title="Master Commercial Quotations Register"
      countLabel={`${quotations.length} Proposals`}
      columns={COLUMNS}
    >
      <TableBody className="divide-y divide-slate-100 font-medium">
        {isLoading ? (
          <TableLoading colSpan={7} rows={5} />
        ) : quotations.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={7} className="p-0 border-0">
              <EmptyState
                icon={
                  isFiltered ? (
                    <SearchIcon size={22} className="text-slate-400" />
                  ) : (
                    <FileSpreadsheetIcon size={22} className="text-slate-400" />
                  )
                }
                title={
                  isFiltered
                    ? "No matching quotations found"
                    : "No active commercial quotations"
                }
                description={
                  isFiltered
                    ? "No quotations match your current search query or filter."
                    : "All converted quotations have moved to Sales Invoices. Create a new quotation proposal to get started."
                }
                actionLabel={
                  isFiltered ? "Reset Filters" : "Create New Quotation"
                }
                onAction={isFiltered ? onClearFilters : () => onOpenEditor()}
              />
            </TableCell>
          </TableRow>
        ) : (
          quotations.map((q) => {
            const isExpanded = activeExpandedId === q.id;
            return (
              <Fragment key={q.id}>
                <TableRow
                  onClick={() => handleToggle(q.id)}
                  className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    isExpanded ? "bg-slate-50/90 font-medium" : ""
                  }`}
                >
                  <TableCell className="py-2 px-2.5 sm:px-3 font-mono font-bold text-slate-900 whitespace-nowrap text-xs">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <FileSpreadsheetIcon
                        size={14}
                        className="text-teal-700 shrink-0"
                      />
                      <span className="hover:text-emerald-800 transition-colors">
                        {q.quotationNo}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-2.5 sm:px-3 text-slate-900 text-xs">
                    <div
                      className="font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[180px]"
                      title={q.customer || ""}
                    >
                      {q.customer || "—"}
                    </div>
                    {q.customerRel?.customerCode && (
                      <div className="text-[10px] text-emerald-700 font-mono font-medium truncate max-w-[140px]">
                        [{q.customerRel.customerCode}]
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-2 px-2.5 sm:px-3 text-slate-600 text-xs">
                    <div
                      className="truncate max-w-[120px] sm:max-w-[170px]"
                      title={q.project || q.reference || ""}
                    >
                      {q.project || q.reference || "—"}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-2 text-center font-mono text-slate-600 text-[11px] whitespace-nowrap">
                    {q.date || "—"}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-2 px-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap text-xs"
                  >
                    {formatNumber(q.totalAmount)}
                  </TableCell>
                  <TableCell className="py-2 px-2 text-center whitespace-nowrap">
                    <Badge
                      tone={getQuotationStatus(q.status).tone}
                      className="text-[10.5px] px-2 py-0.5"
                    >
                      {getQuotationStatus(q.status).label}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-2 sm:pr-3 text-right print:hidden whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConvertToInvoice(q);
                        }}
                        disabled={convertingId === q.id}
                        className="h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                        title="Convert to Tax Invoice"
                      >
                        <FileTextIcon size={18} className="w-[18px] h-[18px]" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditor(q);
                        }}
                        className="h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                        title="Open in Editor"
                      >
                        <EditIcon size={18} className="w-[18px] h-[18px]" />
                      </Button>
                      {onDeleteQuotation && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteQuotation(q);
                          }}
                          className="h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Quotation"
                        >
                          <TrashIcon size={18} className="w-[18px] h-[18px]" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(q.id);
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
                  <QuotationExpandedRow
                    quotation={q}
                    onOpenEditor={onOpenEditor}
                    onConvertToInvoice={onConvertToInvoice}
                    onClose={() => handleToggle(q.id)}
                    formatNumber={formatNumber}
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

export default QuotationTable;
