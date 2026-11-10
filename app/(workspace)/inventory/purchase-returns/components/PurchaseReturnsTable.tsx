"use client";

import React, { Fragment, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { EyeIcon, MoreVerticalIcon, RotateCcwIcon } from "@/components/icons";
import { FileText, Eye, Printer, ChevronLeft, ChevronRight } from "lucide-react";
import {
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  EmptyState,
} from "@/components/ui";
import { PurchaseReturnItem, formatAed } from "./types";
import { PurchaseReturnExpandedRow } from "./PurchaseReturnExpandedRow";

interface PurchaseReturnsTableProps {
  filteredReturns: PurchaseReturnItem[];
  expandedReturnId: string | null;
  onToggleExpand: (id: string) => void;
  onPrintReturn: (item: PurchaseReturnItem) => void;
  onViewReturn?: (item: PurchaseReturnItem) => void;
  isLoading?: boolean;
  onOpenCreate?: () => void;
  isFiltered?: boolean;
  onClearFilters?: () => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "POSTED":
    case "COMPLETED":
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{ backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #86efac" }}
        >
          {status}
        </span>
      );
    case "APPROVED":
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
        >
          {status}
        </span>
      );
    case "SUBMITTED":
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{ backgroundColor: "#fefce8", color: "#a16207", border: "1px solid #fde047" }}
        >
          {status}
        </span>
      );
    case "CANCELLED":
    case "REJECTED":
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{ backgroundColor: "#fff1f2", color: "#be123c", border: "1px solid #fda4af" }}
        >
          {status}
        </span>
      );
    case "DRAFT":
    default:
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
          style={{ backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1" }}
        >
          {status || "DRAFT"}
        </span>
      );
  }
};

const PAGE_SIZE = 15;

const PurchaseReturnsTable: React.FC<PurchaseReturnsTableProps> = ({
  filteredReturns,
  expandedReturnId,
  onToggleExpand,
  onPrintReturn,
  onViewReturn,
  isLoading = false,
  onOpenCreate,
  isFiltered = false,
  onClearFilters,
}) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenu, setActiveMenu] = useState<{
    id: string;
    item: PurchaseReturnItem;
    top: number;
    right: number;
    openUpwards?: boolean;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredReturns.length]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    if (activeMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
      window.addEventListener("scroll", () => setActiveMenu(null), true);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", () => setActiveMenu(null), true);
    };
  }, [activeMenu]);

  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    item: PurchaseReturnItem,
  ) => {
    e.stopPropagation();
    if (activeMenu?.id === item.id) {
      setActiveMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const right = window.innerWidth - rect.right;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < 180;
    const top = openUpwards ? rect.top : rect.bottom + 4;
    setActiveMenu({ id: item.id, item, top, right, openUpwards });
  };

  const totalPages = Math.max(1, Math.ceil(filteredReturns.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedReturns = filteredReturns.slice(startIndex, startIndex + PAGE_SIZE);

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
              <th className="py-2.5 px-4 font-medium text-slate-600">Debit Note &amp; Ref</th>
              <th className="py-2.5 px-4 font-medium text-slate-600">Supplier / Vendor</th>
              <th className="py-2.5 px-4 font-medium text-slate-600">Project / Scope</th>
              <th className="py-2.5 px-4 font-medium text-slate-600">Return Reason</th>
              <th className="py-2.5 px-3 font-medium text-slate-600 text-center">Return Date</th>
              <th className="py-2.5 px-3 font-medium text-slate-600 text-center">Status</th>
              <th className="py-2.5 px-3 font-medium text-slate-600 text-right">Amount (AED)</th>
              <th className="py-2.5 px-3 font-medium text-slate-600 text-right pr-4">Actions</th>
            </tr>
          </thead>
          <TableBody className="divide-y divide-slate-100 font-normal">
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
              paginatedReturns.map((item) => {
                const isExpanded = expandedReturnId === item.id;
                const projectDisplay = item.projectName
                  ? `${item.projectCode ? `${item.projectCode} — ` : ""}${item.projectName}`
                  : "General / Warehouse Stock";
                const total = Number(item.totalAmount || 0);

                return (
                  <Fragment key={item.id}>
                    <TableRow
                      onClick={() => {
                        if (onViewReturn) {
                          onViewReturn(item);
                        } else {
                          onToggleExpand(item.id);
                        }
                      }}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isExpanded ? "bg-slate-50/90 font-medium" : ""
                      }`}
                    >
                      <TableCell className="py-2.5 px-2.5 sm:px-3 font-mono text-slate-800 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span
                            className="font-mono text-[11px] font-medium px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                            }}
                          >
                            {item.returnNumber}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-mono mt-0.5 truncate max-w-[130px]">
                          Ref: {item.poReference || "Direct Debit"}
                        </div>
                      </TableCell>

                      <TableCell className="py-2.5 px-2.5 sm:px-3 text-xs">
                        <div
                          className="font-medium text-slate-800 truncate max-w-[140px] sm:max-w-[180px]"
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

                      <TableCell className="py-2.5 px-2.5 sm:px-3 text-slate-700 text-xs">
                        <div
                          className="font-normal text-slate-700 truncate max-w-[120px] sm:max-w-[160px]"
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

                      <TableCell className="py-2.5 px-2.5 sm:px-3 text-slate-600 text-xs">
                        <div
                          className="truncate max-w-[130px] sm:max-w-[180px]"
                          title={item.reason}
                        >
                          {item.reason}
                        </div>
                      </TableCell>

                      <TableCell className="py-2.5 px-2 text-center font-mono text-slate-600 text-[11px] whitespace-nowrap">
                        {item.returnDate
                          ? new Date(item.returnDate).toLocaleDateString("en-GB")
                          : "—"}
                      </TableCell>

                      <TableCell className="py-2.5 px-2 text-center whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </TableCell>

                      <TableCell
                        align="right"
                        className="py-2.5 px-2.5 text-right font-mono font-medium text-rose-700 whitespace-nowrap text-xs"
                      >
                        {formatAed(total)}
                      </TableCell>

                      <TableCell className="py-2.5 px-2 sm:pr-3 text-right print:hidden whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (onViewReturn) {
                                onViewReturn(item);
                              } else {
                                onToggleExpand(item.id);
                              }
                            }}
                            className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#1d4ed8] hover:bg-[#eff6ff] border border-transparent hover:border-[#bfdbfe] transition-all cursor-pointer"
                            title="View Details"
                          >
                            <EyeIcon size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenMenu(e, item)}
                            className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                              activeMenu?.id === item.id
                                ? "bg-slate-900 text-white shadow-xs"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                            }`}
                            title="More actions"
                          >
                            <MoreVerticalIcon size={14} />
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
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredReturns.length > 0 && (
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t rounded-b-xl select-none"
          style={{ borderColor: "#cbd5e1" }}
        >
          <div className="text-xs text-slate-500 font-normal">
            Showing{" "}
            <span className="font-medium text-slate-800">
              {startIndex + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-slate-800">
              {Math.min(startIndex + PAGE_SIZE, filteredReturns.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-slate-800">
              {filteredReturns.length}
            </span>{" "}
            returns
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#cbd5e1] hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              const isActive = p === currentPage;
              if (
                p === 1 ||
                p === totalPages ||
                (p >= currentPage - 1 && p <= currentPage + 1)
              ) {
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    style={
                      isActive
                        ? {
                            backgroundColor: "#1d4ed8",
                            color: "#ffffff",
                            borderColor: "#1d4ed8",
                          }
                        : { borderColor: "#cbd5e1" }
                    }
                    className={`min-w-8 h-8 px-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      isActive
                        ? ""
                        : "text-slate-700 hover:bg-slate-50 bg-white"
                    }`}
                  >
                    {p}
                  </button>
                );
              }
              if (p === currentPage - 2 || p === currentPage + 2) {
                return (
                  <span key={p} className="px-1 text-slate-400 text-xs">
                    ...
                  </span>
                );
              }
              return null;
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#cbd5e1] hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating 3-Dots Portal Dropdown */}
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
              border: "1px solid #cbd5e1",
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-[195px] rounded-xl bg-white shadow-xl shadow-slate-900/10 p-1 z-[9999] animate-in fade-in zoom-in-95 duration-100 select-none"
          >
            {/* View Details */}
            <button
              type="button"
              onClick={() => {
                const item = activeMenu.item;
                setActiveMenu(null);
                if (onViewReturn) {
                  onViewReturn(item);
                } else {
                  onToggleExpand(item.id);
                }
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#1d4ed8] hover:bg-blue-50 transition-colors cursor-pointer text-left group"
            >
              <Eye className="w-3.5 h-3.5 text-[#1d4ed8] shrink-0" />
              <span className="truncate">View Debit Note Details</span>
            </button>

            {/* Print Debit Note */}
            <button
              type="button"
              onClick={() => {
                const item = activeMenu.item;
                setActiveMenu(null);
                onPrintReturn(item);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors cursor-pointer text-left group"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">Print Debit Note (PDF)</span>
            </button>

            {/* View Linked Bill */}
            {activeMenu.item.supplierBill?.id && (
              <button
                type="button"
                onClick={() => {
                  const billId = activeMenu.item.supplierBill!.id;
                  setActiveMenu(null);
                  router.push(`/commercial/supplier-bills/${billId}`);
                }}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors cursor-pointer text-left group"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">
                  View Linked Bill ({activeMenu.item.supplierBill.billNumber || activeMenu.item.poReference})
                </span>
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  );
};

export default PurchaseReturnsTable;
