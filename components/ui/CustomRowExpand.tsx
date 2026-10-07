"use client";

import React from "react";
import { TableRow, TableCell } from "./Table";
import { CloseIcon } from "@/components/icons";

export type CustomRowExpandAccent =
  "emerald" | "blue" | "indigo" | "rose" | "amber" | "slate";

export interface CustomRowExpandProps {
  colSpan: number;
  onClose?: () => void;
  header?: React.ReactNode;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  accentColor?: CustomRowExpandAccent;
  className?: string;
  rowClassName?: string;
  cellClassName?: string;
}

const ACCENT_STYLES: Record<
  CustomRowExpandAccent,
  { cell: string; container: string }
> = {
  emerald: {
    cell: "border-b border-slate-200/80",
    container: "",
  },
  blue: {
    cell: "border-b border-slate-200/80",
    container: "",
  },
  indigo: {
    cell: "border-b border-slate-200/80",
    container: "",
  },
  rose: {
    cell: "border-b border-slate-200/80",
    container: "",
  },
  amber: {
    cell: "border-b border-slate-200/80",
    container: "",
  },
  slate: {
    cell: "border-b border-slate-200/80",
    container: "",
  },
};

export const CustomRowExpand: React.FC<CustomRowExpandProps> = ({
  colSpan,
  onClose,
  header,
  headerLeft,
  headerRight,
  children,
  accentColor = "emerald",
  className = "",
  rowClassName = "hover:bg-transparent bg-slate-50/70",
  cellClassName = "p-0",
}) => {
  const accent = ACCENT_STYLES[accentColor] || ACCENT_STYLES.emerald;
  const hasHeader = Boolean(header || headerLeft || headerRight || onClose);

  return (
    <TableRow className={rowClassName}>
      <TableCell
        colSpan={colSpan}
        className={`${cellClassName} ${accent.cell}`}
      >
        <div
          className={`px-3.5 py-3 sm:px-4 sm:py-3.5 space-y-3 bg-slate-50/60 min-w-0 max-w-full overflow-hidden ${className}`}
        >
          {hasHeader && (
            <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-200/80 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {headerLeft || header}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {headerRight}
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
                    title="Close preview"
                  >
                    <CloseIcon size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
          {children}
        </div>
      </TableCell>
    </TableRow>
  );
};

export interface ExpandedRowSectionProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export const ExpandedRowSection: React.FC<ExpandedRowSectionProps> = ({
  title,
  icon,
  badge,
  children,
  className = "",
  headerClassName = "",
}) => {
  return (
    <div
      className={`border border-slate-200 bg-white rounded-xl p-3 sm:p-3.5 shadow-2xs space-y-2 ${className}`}
    >
      <div
        className={`flex items-center justify-between border-b border-slate-100 pb-1.5 ${headerClassName}`}
      >
        <span className="font-bold text-xs uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
          {icon && <span className="text-teal-700">{icon}</span>}
          {title}
        </span>
        {badge && (
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
};

export const TableExpandedRow = CustomRowExpand;
export const ExpandedRow = CustomRowExpand;

export default CustomRowExpand;
