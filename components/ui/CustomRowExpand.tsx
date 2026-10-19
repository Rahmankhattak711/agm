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
    cell: "border-b border-agm-box-border",
    container: "",
  },
  blue: {
    cell: "border-b border-agm-box-border",
    container: "",
  },
  indigo: {
    cell: "border-b border-agm-box-border",
    container: "",
  },
  rose: {
    cell: "border-b border-agm-box-border",
    container: "",
  },
  amber: {
    cell: "border-b border-agm-box-border",
    container: "",
  },
  slate: {
    cell: "border-b border-agm-box-border",
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
  rowClassName = "hover:bg-transparent bg-agm-box-bg/80",
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
          className={`px-3.5 py-3 sm:px-4 sm:py-3.5 space-y-3 bg-agm-box-bg/60 text-agm-text min-w-0 max-w-full overflow-hidden ${className}`}
        >
          {hasHeader && (
            <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-agm-box-border flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                {headerLeft || header}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {headerRight}
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded-md text-agm-muted hover:text-agm-text hover:bg-agm-box-border/40 transition cursor-pointer"
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
      className={`border border-agm-box-border bg-agm-card text-agm-text rounded-xl p-3 sm:p-3.5 shadow-2xs space-y-2.5 ${className}`}
    >
      <div
        className={`flex items-center justify-between border-b border-agm-box-border pb-1.5 ${headerClassName}`}
      >
        <span className="font-bold text-xs uppercase tracking-wider text-agm-text flex items-center gap-1.5">
          {icon && <span className="text-agm-green">{icon}</span>}
          {title}
        </span>
        {badge && (
          <span className="text-[10px] font-bold text-agm-muted uppercase">
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
