"use client";

import React from "react";
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
  EyeIcon,
  SearchIcon,
} from "@/components/icons";

const COLUMNS: RegisterColumn[] = [
  { label: "Quotation No" },
  { label: "Customer / Client" },
  { label: "Project Scope & Ref" },
  { label: "Date", compact: true },
  { label: "Total (AED)", align: "right" },
  { label: "Status", align: "center", compact: true },
  { label: "Actions", align: "center", compact: true },
];

export interface QuotationTableProps {
  quotations: any[];
  isLoading: boolean;
  error?: any;
  isFiltered: boolean;
  convertingId: string | null;
  onClearFilters: () => void;
  onOpenEditor: (q?: any) => void;
  onConvertToInvoice: (q: any) => void;
  formatNumber: (val: number | string | undefined) => string;
}

export const QuotationTable: React.FC<QuotationTableProps> = ({
  quotations,
  isLoading,
  error,
  isFiltered,
  convertingId,
  onClearFilters,
  onOpenEditor,
  onConvertToInvoice,
  formatNumber,
}) => {
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
            quotations.map((q) => (
              <TableRow
                key={q.id}
                className="hover:bg-slate-50/70 text-slate-700 transition-colors"
              >
                <TableCell className="py-3 px-4 font-mono font-bold text-slate-900">
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheetIcon
                      size={13}
                      className="text-teal-700 shrink-0"
                    />
                    <span>{q.quotationNo}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4 font-bold text-slate-900">
                  <div className="flex flex-col">
                    <span>{q.customer || "—"}</span>
                    {q.customerRel?.customerCode && (
                      <span className="text-[10px] text-emerald-700 font-mono font-medium">
                        [{q.customerRel.customerCode}]
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4 text-slate-600 max-w-xs truncate">
                  {q.project || q.reference || "—"}
                </TableCell>
                <TableCell className="py-3 px-3 font-mono text-slate-600 text-xs">
                  {q.date}
                </TableCell>
                <TableCell
                  align="right"
                  className="py-3 px-4 text-right font-mono font-black text-slate-900"
                >
                  AED {formatNumber(q.totalAmount)}
                </TableCell>
                <TableCell className="py-3 px-3 text-center">
                  <Badge tone={getQuotationStatus(q.status).tone}>
                    {getQuotationStatus(q.status).label}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenEditor(q)}
                      className="p-1.5 text-slate-600 hover:text-teal-800 rounded-lg hover:bg-teal-50 transition cursor-pointer"
                      title="Edit / View in Editor"
                    >
                      <EyeIcon size={13} />
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onConvertToInvoice(q)}
                      disabled={convertingId === q.id}
                      icon={
                        <FileTextIcon
                          size={12}
                          className="text-white"
                        />
                      }
                      className="text-[11px] font-bold bg-agm-green hover:bg-agm-green-2 text-white shadow-2xs cursor-pointer"
                      title="Convert directly to Tax Invoice & initiate Project in Planning"
                    >
                      {convertingId === q.id
                        ? "Converting..."
                        : "Convert to Invoice"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
    </RegisterTable>
  );
};

export default QuotationTable;
