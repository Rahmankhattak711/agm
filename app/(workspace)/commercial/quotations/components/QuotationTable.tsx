"use client";

import React from "react";
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  EmptyState,
  Button,
} from "@/components/ui";
import {
  FileSpreadsheetIcon,
  FileTextIcon,
  EyeIcon,
  SearchIcon,
} from "@/components/icons";

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
    <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs min-w-0 max-w-full">
      <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
        <h4 className="font-black text-xs uppercase tracking-wider text-white">
          Master Commercial Quotations Register
        </h4>
        <span className="text-[11px] font-mono text-emerald-300 font-bold">
          {quotations.length} Proposals
        </span>
      </div>

      <Table className="w-full text-xs text-left">
        <TableHead className="bg-slate-50 border-b border-slate-200">
          <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
            Quotation No
          </TableHeaderCell>
          <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
            Customer / Client
          </TableHeaderCell>
          <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
            Project Scope &amp; Ref
          </TableHeaderCell>
          <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
            Date
          </TableHeaderCell>
          <TableHeaderCell
            align="right"
            className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-[10.5px] tracking-wider"
          >
            Total (AED)
          </TableHeaderCell>
          <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
            Status
          </TableHeaderCell>
          <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
            Actions
          </TableHeaderCell>
        </TableHead>

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
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      q.status === "ACCEPTED"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : q.status === "REJECTED"
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : q.status === "SENT"
                            ? "bg-sky-50 text-sky-800 border-sky-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {q.status === "ACCEPTED"
                      ? "Accepted"
                      : q.status === "REJECTED"
                        ? "Declined"
                        : q.status === "SENT"
                          ? "Sent"
                          : "Draft"}
                  </span>
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
      </Table>
    </div>
  );
};

export default QuotationTable;
