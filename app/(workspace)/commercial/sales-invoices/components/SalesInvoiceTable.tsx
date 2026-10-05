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
} from "@/components/ui";
import {
  ReceiptIcon,
  PercentIcon,
  ScaleIcon,
  PrintIcon,
} from "@/components/icons";
import { SalesInvoice } from "@/lib/hooks/api-hooks";
import SalesInvoiceRow from "./SalesInvoiceRow";

export interface SalesInvoiceTableProps {
  invoices: SalesInvoice[];
  isLoading: boolean;
  error?: any;
  expandedInvoiceId: string | null;
  onToggleExpand: (id: string) => void;
  onPrint: (inv: SalesInvoice) => void;
  onPost: (invId: string) => void;
  onOpenPayment: (inv: SalesInvoice) => void;
  onOpenCreate: () => void;
  isFiltered?: boolean;
  onClearFilters?: () => void;
}

export const SalesInvoiceTable: React.FC<SalesInvoiceTableProps> = ({
  invoices,
  isLoading,
  error,
  expandedInvoiceId,
  onToggleExpand,
  onPrint,
  onPost,
  onOpenPayment,
  onOpenCreate,
  isFiltered = false,
  onClearFilters,
}) => {
  if (error) {
    return (
      <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
        Error loading sales invoices: {(error as any).message}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs min-w-0 max-w-full">
      <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
        <h4 className="font-black text-xs uppercase tracking-wider text-white">
          Commercial Sales Invoices Register
        </h4>
        <span className="text-[11px] font-mono text-emerald-300 font-bold">
          {invoices.length} Invoices
        </span>
      </div>

      <Table className="w-full text-xs text-left">
        <TableHead className="bg-slate-50 border-b border-slate-200">
          <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
            Invoice No
          </TableHeaderCell>
          <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
            Customer / Client
          </TableHeaderCell>
          <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
            Project Scope
          </TableHeaderCell>
          <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
            Date
          </TableHeaderCell>
          <TableHeaderCell
            align="right"
            className="py-3 px-3 text-right font-bold text-slate-600 uppercase text-[10.5px] tracking-wider"
          >
            Total (AED)
          </TableHeaderCell>
          <TableHeaderCell
            align="right"
            className="py-3 px-3 text-right font-bold text-slate-600 uppercase text-[10.5px] tracking-wider"
          >
            Balance Due
          </TableHeaderCell>
          <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
            Status
          </TableHeaderCell>
          <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider print:hidden">
            Actions
          </TableHeaderCell>
        </TableHead>

        <TableBody className="divide-y divide-slate-100 font-medium">
          {isLoading ? (
            <TableLoading colSpan={8} rows={5} />
          ) : invoices.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={8} className="p-0 border-0">
                <EmptyState
                  icon={<ReceiptIcon size={20} className="text-slate-400" />}
                  title="No sales invoices found"
                  description={
                    isFiltered
                      ? "No sales invoices matched your search criteria."
                      : "No sales invoices in database. Click 'Create Sales Invoice' to issue one."
                  }
                  actionLabel={
                    isFiltered ? "Reset Filters" : "Create Sales Invoice"
                  }
                  onAction={isFiltered ? onClearFilters : onOpenCreate}
                />
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((inv) => (
              <SalesInvoiceRow
                key={inv.id}
                inv={inv}
                isExpanded={expandedInvoiceId === inv.id}
                onToggleExpand={() => onToggleExpand(inv.id)}
                onPrint={onPrint}
                onPost={onPost}
                onOpenPayment={onOpenPayment}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default SalesInvoiceTable;
