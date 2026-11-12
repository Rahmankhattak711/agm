"use client";

import React, { Fragment, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { getQuotationStatus } from "@/lib/utils/status";
import {
  FileSpreadsheetIcon,
  FileTextIcon,
  EditIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  SearchIcon,
  MoreVerticalIcon,
  EyeIcon,
} from "@/components/icons";
import { QuotationExpandedRow } from "./QuotationExpandedRow";

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
  const [internalExpandedId, setInternalExpandedId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<{
    id: string;
    quotation: any;
    top: number;
    right: number;
    openUpwards: boolean;
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;
  const totalPages = Math.ceil(quotations.length / PAGE_SIZE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedQuotations = quotations.slice(startIndex, startIndex + PAGE_SIZE);

  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    quotation: any,
  ) => {
    e.stopPropagation();
    if (activeMenu?.id === quotation.id) {
      setActiveMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 140;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < menuHeight && rect.top > menuHeight;

    setActiveMenu({
      id: quotation.id,
      quotation,
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
        Error loading quotations: {(error as any).message}
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
                Quotation No
              </th>
              <th className="py-2.5 px-4 font-medium text-slate-600">
                Customer / Client
              </th>
              <th className="py-2.5 px-4 font-medium text-slate-600">
                Project Scope &amp; Ref
              </th>
              <th className="py-2.5 px-3 font-medium text-slate-600 text-center whitespace-nowrap">
                Date
              </th>
              <th className="py-2.5 px-3 font-medium text-slate-600 text-right whitespace-nowrap">
                Total (AED)
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
                  colSpan={7}
                  className="py-12 text-center text-slate-400 text-xs"
                >
                  Loading commercial quotations...
                </td>
              </tr>
            ) : quotations.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center">
                  <div className="max-w-xs mx-auto flex flex-col items-center justify-center text-center space-y-2">
                    <div
                      className="p-3 rounded-full mb-1"
                      style={{
                        backgroundColor: "#eff6ff",
                        border: "1px solid #bfdbfe",
                        color: "#1d4ed8",
                      }}
                    >
                      {isFiltered ? (
                        <SearchIcon size={20} />
                      ) : (
                        <FileSpreadsheetIcon size={20} />
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      {isFiltered
                        ? "No matching quotations found"
                        : "No active commercial quotations"}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {isFiltered
                        ? "No quotations match your current search query or filter."
                        : "All converted quotations have moved to Sales Invoices. Create a new quotation proposal to get started."}
                    </p>
                    {isFiltered ? (
                      <button
                        type="button"
                        onClick={onClearFilters}
                        className="mt-2 text-xs font-medium text-[#1d4ed8] hover:underline cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenEditor()}
                        className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-2xs cursor-pointer"
                        style={{ backgroundColor: "#1d4ed8" }}
                      >
                        Create New Quotation
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedQuotations.map((q) => {
                const isExpanded = activeExpandedId === q.id;
                const statusMeta = getQuotationStatus(q.status);
                const isAccepted = q.status === "ACCEPTED";
                const isRejected = q.status === "REJECTED";
                const isSent = q.status === "SENT";

                return (
                  <Fragment key={q.id}>
                    <tr
                      onClick={() => handleToggle(q.id)}
                      className={`hover:bg-[#f8fafc] transition-colors cursor-pointer ${
                        isExpanded ? "bg-[#f8fafc]/90 font-medium" : ""
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono text-slate-800 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <FileSpreadsheetIcon
                            size={14}
                            className="text-[#1d4ed8] shrink-0"
                          />
                          <span
                            className="font-mono text-[11px] font-medium px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                            }}
                          >
                            {q.quotationNo}
                          </span>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-slate-900 text-xs">
                        <div
                          className="font-medium text-slate-800 truncate max-w-[150px] sm:max-w-[200px]"
                          title={q.customer || ""}
                        >
                          {q.customer || "—"}
                        </div>
                        {q.customerRel?.customerCode && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[150px]">
                            [{q.customerRel.customerCode}]
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-slate-600 text-xs">
                        <div
                          className="truncate max-w-[140px] sm:max-w-[190px]"
                          title={q.project || q.reference || ""}
                        >
                          {q.project || q.reference || "—"}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono text-slate-600 text-[11px] whitespace-nowrap">
                        {q.date || "—"}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 whitespace-nowrap text-xs">
                        AED {formatNumber(q.totalAmount)}
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-medium"
                          style={{
                            backgroundColor: isAccepted
                              ? "#f0fdf4"
                              : isRejected
                                ? "#fff1f2"
                                : isSent
                                  ? "#eff6ff"
                                  : "#fefce8",
                            color: isAccepted
                              ? "#15803d"
                              : isRejected
                                ? "#be123c"
                                : isSent
                                  ? "#1d4ed8"
                                  : "#a16207",
                            border: isAccepted
                              ? "1px solid #bbf7d0"
                              : isRejected
                                ? "1px solid #fecdd3"
                                : isSent
                                  ? "1px solid #bfdbfe"
                                  : "1px solid #fef08a",
                          }}
                        >
                          {statusMeta.label}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right print:hidden whitespace-nowrap pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggle(q.id);
                            }}
                            className={`h-7 w-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                              isExpanded
                                ? "bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]"
                                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent"
                            }`}
                            title={
                              isExpanded ? "Collapse preview" : "Expand preview"
                            }
                          >
                            <ChevronDownIcon
                              size={14}
                              className={`transition-transform duration-200 ${
                                isExpanded ? "rotate-180 text-[#1d4ed8]" : ""
                              }`}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleOpenMenu(e, q)}
                            className={`h-7 w-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                              activeMenu?.id === q.id
                                ? "bg-slate-800 text-white"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                            }`}
                            title="More actions"
                            aria-label="More actions"
                          >
                            <MoreVerticalIcon size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>

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
          </tbody>
        </table>
      </div>

      {/* Responsive Clean Pagination Footer */}
      {quotations.length > 0 && (
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t select-none print:hidden"
          style={{ borderColor: "#cbd5e1" }}
        >
          <div className="text-xs text-slate-500 font-normal">
            Showing{" "}
            <span className="font-medium text-slate-800">{startIndex + 1}</span> to{" "}
            <span className="font-medium text-slate-800">
              {Math.min(startIndex + PAGE_SIZE, quotations.length)}
            </span>{" "}
            of <span className="font-medium text-slate-800">{quotations.length}</span> quotations
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
            {/* Edit Proposal */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const q = activeMenu.quotation;
                handleCloseMenu();
                onOpenEditor(q);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-[#1d4ed8] hover:bg-[#eff6ff] transition-colors cursor-pointer text-left group"
            >
              <EditIcon size={14} className="text-[#1d4ed8] shrink-0" />
              <span className="truncate">Edit Quotation</span>
            </button>

            {/* Convert to Tax Invoice */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const q = activeMenu.quotation;
                handleCloseMenu();
                onConvertToInvoice(q);
              }}
              disabled={convertingId === activeMenu.quotation.id}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-[#15803d] hover:bg-[#f0fdf4] transition-colors cursor-pointer text-left group disabled:opacity-50"
            >
              <FileTextIcon size={14} className="text-[#15803d] shrink-0" />
              <span className="truncate">Convert to Invoice</span>
            </button>

            {/* Preview Details */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const qId = activeMenu.quotation.id;
                handleCloseMenu();
                handleToggle(qId);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors cursor-pointer text-left group"
            >
              <EyeIcon size={14} className="text-slate-500 shrink-0" />
              <span className="truncate">
                {activeExpandedId === activeMenu.quotation.id
                  ? "Collapse Preview"
                  : "Preview Details"}
              </span>
            </button>

            {/* Delete Option */}
            {onDeleteQuotation && (
              <>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const q = activeMenu.quotation;
                    handleCloseMenu();
                    onDeleteQuotation(q);
                  }}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-[#fff1f2] transition-colors cursor-pointer text-left group"
                >
                  <TrashIcon size={14} className="text-rose-500 shrink-0" />
                  <span className="truncate">Delete Quotation</span>
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
};

// Helper for ChevronRightIcon
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

export default QuotationTable;
