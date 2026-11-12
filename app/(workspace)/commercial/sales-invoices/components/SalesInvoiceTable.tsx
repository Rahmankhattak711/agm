"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  ReceiptIcon,
  PrintIcon,
  EditIcon,
  TrashIcon,
  FileCheck2Icon,
  CreditCardIcon,
  EyeIcon,
  ChevronLeftIcon,
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

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;
  const totalPages = Math.ceil(invoices.length / PAGE_SIZE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedInvoices = invoices.slice(startIndex, startIndex + PAGE_SIZE);

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
    const menuHeight = 200;
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
      <div className="py-8 text-center text-xs text-rose-600 bg-[#fff1f2] rounded-xl border border-[#fecdd3]">
        Error loading sales invoices: {(error as any).message}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr
              className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 select-none"
              style={{
                backgroundColor: "#f4f7fb",
                borderBottom: "1px solid #cbd5e1",
              }}
            >
              <th className="py-2.5 px-4 font-medium text-slate-600 whitespace-nowrap">
                Invoice No
              </th>
              <th className="py-2.5 px-4 font-medium text-slate-600">
                Customer / Client
              </th>
              <th className="py-2.5 px-4 font-medium text-slate-600">
                Project Scope
              </th>
              <th className="py-2.5 px-3 font-medium text-slate-600 text-center whitespace-nowrap">
                Date
              </th>
              <th className="py-2.5 px-3 font-medium text-slate-600 text-right whitespace-nowrap">
                Total (AED)
              </th>
              <th className="py-2.5 px-3 font-medium text-slate-600 text-right whitespace-nowrap">
                Balance Due
              </th>
              <th className="py-2.5 px-3 font-medium text-slate-600 text-center whitespace-nowrap">
                Status
              </th>
              <th className="py-2.5 px-3 font-medium text-slate-600 text-right whitespace-nowrap pr-4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {isLoading ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-slate-400 text-xs"
                >
                  Loading sales invoices...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center">
                  <div className="max-w-xs mx-auto flex flex-col items-center justify-center text-center space-y-2">
                    <div
                      className="p-3 rounded-full mb-1"
                      style={{
                        backgroundColor: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        color: "#1d4ed8",
                      }}
                    >
                      <ReceiptIcon size={20} />
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      {isFiltered
                        ? "No matching sales invoices found"
                        : "No sales invoices recorded yet"}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {isFiltered
                        ? "No invoices match your current search query or filter."
                        : "Create a new sales invoice or convert an approved quotation to get started."}
                    </p>
                    {isFiltered ? (
                      <button
                        type="button"
                        onClick={onClearFilters}
                        className="mt-2 text-xs font-medium text-[#1d4ed8] hover:underline cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    ) : onOpenCreate ? (
                      <button
                        type="button"
                        onClick={onOpenCreate}
                        className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-2xs cursor-pointer"
                        style={{ backgroundColor: "#1d4ed8" }}
                      >
                        Create New Invoice
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((inv) => (
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
          </tbody>
        </table>
      </div>

      {/* Responsive Clean Pagination Footer */}
      {invoices.length > 0 && (
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t select-none print:hidden"
          style={{ borderColor: "#cbd5e1" }}
        >
          <div className="text-xs text-slate-500 font-normal">
            Showing{" "}
            <span className="font-medium text-slate-800">{startIndex + 1}</span> to{" "}
            <span className="font-medium text-slate-800">
              {Math.min(startIndex + PAGE_SIZE, invoices.length)}
            </span>{" "}
            of <span className="font-medium text-slate-800">{invoices.length}</span> invoices
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded-lg border border-[#cbd5e1] hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeftIcon size={14} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
              if (
                pg === 1 ||
                pg === totalPages ||
                (pg >= safePage - 1 && pg <= safePage + 1)
              ) {
                return (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    className={`min-w-7 h-7 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      safePage === pg
                        ? "bg-[#1d4ed8] text-white"
                        : "border border-[#cbd5e1] hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {pg}
                  </button>
                );
              } else if (pg === safePage - 2 || pg === safePage + 2) {
                return (
                  <span key={pg} className="px-1 text-slate-400 text-xs">
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded-lg border border-[#cbd5e1] hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRightIcon size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 3-Dots Portal Action Menu */}
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
            className="w-[185px] rounded-xl bg-white border border-[#cbd5e1] shadow-xl p-1 z-[9999] animate-in fade-in zoom-in-95 duration-100 select-none"
          >
            {/* View Full Page */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const inv = activeMenu.inv;
                handleCloseMenu();
                router.push(`/commercial/sales-invoices/${inv.id}`);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-[#1d4ed8] hover:bg-[#eff6ff] transition-colors cursor-pointer text-left group"
            >
              <EyeIcon size={14} className="text-[#1d4ed8] shrink-0" />
              <span className="truncate">View Invoice</span>
            </button>

            {/* Print Tax Invoice */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const inv = activeMenu.inv;
                handleCloseMenu();
                onPrint(inv);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer text-left group"
            >
              <PrintIcon size={14} className="text-slate-500 shrink-0" />
              <span className="truncate">Print / PDF</span>
            </button>

            {/* Post to GL (if Draft) */}
            {activeMenu.inv.status === "DRAFT" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const inv = activeMenu.inv;
                  handleCloseMenu();
                  onPost(inv.id);
                }}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-[#15803d] hover:bg-[#f0fdf4] transition-colors cursor-pointer text-left group"
              >
                <FileCheck2Icon size={14} className="text-[#15803d] shrink-0" />
                <span className="truncate">Post to GL</span>
              </button>
            )}

            {/* Record Payment (if not paid) */}
            {activeMenu.inv.status !== "PAID" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const inv = activeMenu.inv;
                  handleCloseMenu();
                  onOpenPayment(inv);
                }}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-[#1d4ed8] hover:bg-[#eff6ff] transition-colors cursor-pointer text-left group"
              >
                <CreditCardIcon size={14} className="text-[#1d4ed8] shrink-0" />
                <span className="truncate">Record Payment</span>
              </button>
            )}

            {/* Edit Invoice */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const inv = activeMenu.inv;
                handleCloseMenu();
                onEdit(inv);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer text-left group"
            >
              <EditIcon size={14} className="text-slate-500 shrink-0" />
              <span className="truncate">Edit Invoice</span>
            </button>

            {/* Delete Invoice */}
            <div className="my-1 border-t border-slate-100" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const inv = activeMenu.inv;
                handleCloseMenu();
                onDelete(inv);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-[#fff1f2] transition-colors cursor-pointer text-left group"
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

// Helper ChevronRightIcon
function ChevronRightIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default SalesInvoiceTable;
