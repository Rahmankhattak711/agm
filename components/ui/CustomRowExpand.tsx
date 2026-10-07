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
    cell: "border-b-2 border-emerald-600/40",
    container: "border-l-4 border-l-emerald-600",
  },
  blue: {
    cell: "border-b-2 border-blue-600/40",
    container: "border-l-4 border-l-blue-600",
  },
  indigo: {
    cell: "border-b-2 border-indigo-600/40",
    container: "border-l-4 border-l-indigo-600",
  },
  rose: {
    cell: "border-b-2 border-rose-600/40",
    container: "border-l-4 border-l-rose-600",
  },
  amber: {
    cell: "border-b-2 border-amber-600/40",
    container: "border-l-4 border-l-amber-600",
  },
  slate: {
    cell: "border-b-2 border-slate-400/40",
    container: "border-l-4 border-l-slate-500",
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
          className={`px-6 py-5 space-y-4 ${accent.container} bg-gradient-to-b from-white via-slate-50/40 to-slate-100/40 shadow-inner ${className}`}
        >
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
      className={`border border-slate-200 bg-white rounded-xl p-4 shadow-2xs space-y-2.5 ${className}`}
    >
      <div
        className={`flex items-center justify-between border-b border-slate-100 pb-2 ${headerClassName}`}
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
