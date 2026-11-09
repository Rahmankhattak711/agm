"use client";

import React, { Fragment, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { EyeIcon, MoreVerticalIcon, PrintIcon, RotateCcwIcon } from "@/components/icons";
import { FileText, Eye, Printer, ChevronDown } from "lucide-react";
import {
  Badge,
  RegisterTable,
  RegisterColumn,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  EmptyState,
} from "@/components/ui";
import { PurchaseReturnItem, formatAed } from "./types";
import { PurchaseReturnExpandedRow } from "./PurchaseReturnExpandedRow";

const COLUMNS: RegisterColumn[] = [
  { label: "Debit Note & Ref", compact: true, className: "whitespace-nowrap" },
  { label: "Supplier / Vendor", compact: true },
  { label: "Project / Scope", compact: true },
  { label: "Return Reason", compact: true },
  {
    label: "Return Date",
    align: "center",
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
    label: "Amount (AED)",
    align: "right",
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

const getStatusTone = (
  status: string,
): "emerald" | "sky" | "amber" | "slate" | "rose" => {
  switch (status) {
    case "POSTED":
    case "COMPLETED":
      return "emerald";
    case "APPROVED":
      return "sky";
    case "SUBMITTED":
      return "amber";
    case "DRAFT":
      return "slate";
    case "CANCELLED":
    case "REJECTED":
      return "rose";
    default:
      return "slate";
  }
};

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
  const [activeMenu, setActiveMenu] = useState<{
    id: string;
    item: PurchaseReturnItem;
    top: number;
    right: number;
    openUpwards?: boolean;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <>
      <RegisterTable
        title="Vendor Return Vouchers & Debit Notes Register"
        countLabel={`${filteredReturns.length} Active Records`}
        columns={COLUMNS}
      >
        <TableBody className="divide-y divide-slate-100 font-medium">
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
            filteredReturns.map((item) => {
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
                    <TableCell className="py-2.5 px-2.5 sm:px-3 font-mono font-bold text-slate-900 whitespace-nowrap text-xs">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <RotateCcwIcon
                          size={14}
                          className="text-amber-600 shrink-0"
                        />
                        <span className="hover:text-emerald-800 transition-colors">
                          {item.returnNumber}
                        </span>
                      </div>
                      <div className="text-[10px] text-teal-800 font-mono font-semibold mt-0.5 ml-5 truncate max-w-[130px]">
                        Ref: {item.poReference || "Direct Debit"}
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5 px-2.5 sm:px-3 text-xs">
                      <div
                        className="font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[180px]"
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
                        className="font-medium text-slate-800 truncate max-w-[120px] sm:max-w-[160px]"
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
                      <Badge
                        tone={getStatusTone(item.status)}
                        className="text-[10.5px] px-2 py-0.5"
                      >
                        {item.status}
                      </Badge>
                    </TableCell>

                    <TableCell
                      align="right"
                      className="py-2.5 px-2.5 text-right font-mono font-bold text-rose-700 whitespace-nowrap text-xs"
                    >
                      {formatAed(total)}
                    </TableCell>

                    <TableCell className="py-2.5 px-2 sm:pr-3 text-right print:hidden whitespace-nowrap">
                      <div
                        className="flex items-center justify-end gap-1.5"
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
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all cursor-pointer"
                          title="View Details"
                        >
                          <EyeIcon size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleOpenMenu(e, item)}
                          className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            activeMenu?.id === item.id
                              ? "bg-slate-900 text-white shadow-xs"
                              : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                          }`}
                          title="More actions"
                        >
                          <MoreVerticalIcon size={15} />
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
      </RegisterTable>

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
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-[195px] rounded-xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/10 p-1 z-[9999] animate-in fade-in zoom-in-95 duration-100 select-none"
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
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 transition-colors cursor-pointer text-left group"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
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
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-teal-700 hover:text-teal-900 hover:bg-teal-50 transition-colors cursor-pointer text-left group"
              >
                <FileText className="w-3.5 h-3.5 text-teal-600 shrink-0" />
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
