"use client";

import React, { Fragment, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  RegisterTable,
  RegisterColumn,
  Badge,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  EmptyState,
} from "@/components/ui";
import { getQuotationStatus } from "@/lib/utils/status";
import {
  FileSpreadsheetIcon,
  FileTextIcon,
  EditIcon,
  TrashIcon,
  ChevronDownIcon,
  SearchIcon,
  MoreVerticalIcon,
  EyeIcon,
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
  const [activeMenu, setActiveMenu] = useState<{
    id: string;
    quotation: any;
    top: number;
    right: number;
    openUpwards: boolean;
  } | null>(null);

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
      <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
        Error loading quotations: {(error as any).message}
      </div>
    );
  }

  return (
    <>
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
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(q.id);
                        }}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isExpanded
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs"
                            : "text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent"
                        }`}
                        title={
                          isExpanded ? "Collapse preview" : "Expand preview"
                        }
                      >
                        <ChevronDownIcon
                          size={15}
                          className={`transition-transform duration-200 ${
                            isExpanded ? "rotate-180 text-emerald-700" : ""
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleOpenMenu(e, q)}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          activeMenu?.id === q.id
                            ? "bg-slate-900 text-white shadow-xs"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                        }`}
                        title="More actions"
                        aria-label="More actions"
                      >
                        <MoreVerticalIcon size={16} />
                      </button>
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
          {/* Edit Proposal */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const q = activeMenu.quotation;
              handleCloseMenu();
              onOpenEditor(q);
            }}
            className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50/70 transition-colors cursor-pointer text-left group"
          >
            <EditIcon size={14} className="text-blue-600 shrink-0" />
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
            className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/70 transition-colors cursor-pointer text-left group disabled:opacity-50"
          >
            <FileTextIcon size={14} className="text-emerald-600 shrink-0" />
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
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50/70 transition-colors cursor-pointer text-left group"
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

export default QuotationTable;
