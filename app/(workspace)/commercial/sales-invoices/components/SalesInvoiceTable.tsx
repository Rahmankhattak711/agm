"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  RegisterTable,
  RegisterColumn,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  EmptyState,
} from "@/components/ui";
import {
  ReceiptIcon,
  PrintIcon,
  EditIcon,
  TrashIcon,
  FileCheck2Icon,
  CreditCardIcon,
  EyeIcon,
} from "@/components/icons";
import { SalesInvoice } from "@/lib/hooks/api-hooks";
import SalesInvoiceRow from "./SalesInvoiceRow";

const COLUMNS: RegisterColumn[] = [
  { label: "Invoice No", compact: true, className: "whitespace-nowrap" },
  { label: "Customer / Client", compact: true },
  { label: "Project Scope", compact: true },
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
    label: "Balance Due",
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

export interface SalesInvoiceTableProps {
  invoices: SalesInvoice[];
  isLoading: boolean;
  error?: any;
  expandedInvoiceId: string | null;
  onToggleExpand: (id: string) => void;
  onPrint: (inv: SalesInvoice) => void;
  onPost: (invId: string) => void;
  onOpenPayment: (inv: SalesInvoice) => void;
  onEdit: (inv: SalesInvoice) => void;
  onDelete: (inv: SalesInvoice) => void;
  onOpenCreate?: () => void;
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
  onEdit,
  onDelete,
  onOpenCreate,
  isFiltered = false,
  onClearFilters,
}) => {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<{
    id: string;
    inv: SalesInvoice;
    top: number;
    right: number;
    openUpwards: boolean;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    inv: SalesInvoice,
  ) => {
    e.stopPropagation();
    if (activeMenu?.id === inv.id) {
      setActiveMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 180;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < menuHeight && rect.top > menuHeight;

    setActiveMenu({
      id: inv.id,
      inv,
      top: openUpwards ? rect.top - 4 : rect.bottom + 4,
      right: Math.max(8, window.innerWidth - rect.right),
      openUpwards,
    });
  };

  const handleCloseMenu = () => {
    setActiveMenu(null);
  };

  useEffect(() => {
    if (!activeMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenu(null);
      }
    };

    const handleScrollOrResize = () => {
      setActiveMenu(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [activeMenu]);

  if (error) {
    return (
      <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
        Error loading sales invoices: {(error as any).message}
      </div>
    );
  }

  return (
    <>
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
                      : "No sales invoices recorded in the system yet."
                  }
                  actionLabel={isFiltered ? "Reset Filters" : undefined}
                  onAction={isFiltered ? onClearFilters : undefined}
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
                onEdit={onEdit}
                onDelete={onDelete}
                isMenuOpen={activeMenu?.id === inv.id}
                onOpenMenu={(e) => handleOpenMenu(e, inv)}
              />
            ))
          )}
        </TableBody>
      </RegisterTable>

      {activeMenu &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: activeMenu.openUpwards ? undefined : `${activeMenu.top}px`,
              bottom: activeMenu.openUpwards
                ? `${window.innerHeight - activeMenu.top}px`
                : undefined,
              right: `${activeMenu.right}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-[175px] rounded-xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/10 p-1 z-[9999] animate-in fade-in zoom-in-95 duration-100 select-none"
          >
            {/* Print Tax Invoice */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const inv = activeMenu.inv;
                handleCloseMenu();
                onPrint(inv);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors cursor-pointer text-left group"
            >
              <PrintIcon size={14} className="text-slate-500 shrink-0" />
              <span className="truncate">Print Invoice</span>
            </button>

            {/* Edit Invoice */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const inv = activeMenu.inv;
                handleCloseMenu();
                onEdit(inv);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50/70 transition-colors cursor-pointer text-left group"
            >
              <EditIcon size={14} className="text-blue-600 shrink-0" />
              <span className="truncate">Edit Invoice</span>
            </button>

            {/* Post to GL (Draft only) */}
            {activeMenu.inv.status === "DRAFT" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const invId = activeMenu.inv.id;
                  handleCloseMenu();
                  onPost(invId);
                }}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/70 transition-colors cursor-pointer text-left group"
              >
                <FileCheck2Icon
                  size={14}
                  className="text-emerald-600 shrink-0"
                />
                <span className="truncate">Post to GL</span>
              </button>
            )}

            {/* Receive Payment (Non-draft, Non-paid) */}
            {activeMenu.inv.status !== "DRAFT" &&
              activeMenu.inv.status !== "PAID" && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const inv = activeMenu.inv;
                    handleCloseMenu();
                    onOpenPayment(inv);
                  }}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-teal-700 hover:bg-teal-50/70 transition-colors cursor-pointer text-left group"
                >
                  <CreditCardIcon
                    size={14}
                    className="text-teal-600 shrink-0"
                  />
                  <span className="truncate">Receive Payment</span>
                </button>
              )}

            {/* Open Full Invoice Page */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const invId = activeMenu.inv.id;
                handleCloseMenu();
                router.push(`/commercial/sales-invoices/${invId}`);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 transition-colors cursor-pointer text-left group"
            >
              <EyeIcon size={14} className="text-indigo-600 shrink-0" />
              <span className="truncate">View Full Invoice</span>
            </button>

            {/* Delete Option */}
            <div className="my-1 border-t border-slate-100" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const inv = activeMenu.inv;
                handleCloseMenu();
                onDelete(inv);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50/70 transition-colors cursor-pointer text-left group"
            >
              <TrashIcon size={14} className="text-rose-500 shrink-0" />
              <span className="truncate">Delete Invoice</span>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
};

export default SalesInvoiceTable;
