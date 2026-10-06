"use client";

import React from "react";
import {
  RegisterTable,
  RegisterColumn,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  EmptyState,
} from "@/components/ui";
import { ReceiptIcon } from "@/components/icons";
import { SalesInvoice } from "@/lib/hooks/api-hooks";
import SalesInvoiceRow from "./SalesInvoiceRow";

const COLUMNS: RegisterColumn[] = [
  { label: "Invoice No" },
  { label: "Customer / Client" },
  { label: "Project Scope" },
  { label: "Date", compact: true },
  { label: "Total (AED)", align: "right", compact: true },
  { label: "Balance Due", align: "right", compact: true },
  { label: "Status", align: "center", compact: true },
  { label: "Actions", align: "center", compact: true, hideOnPrint: true },
];

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
    <RegisterTable
      title="Commercial Sales Invoices Register"
      countLabel={`${invoices.length} Invoices`}
      columns={COLUMNS}
    >
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
                actionLabel={isFiltered ? "Reset Filters" : "Create Sales Invoice"}
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
    </RegisterTable>
  );
};

export default SalesInvoiceTable;
