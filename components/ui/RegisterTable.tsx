"use client";

import React from "react";
import { Table, TableHead, TableHeaderCell, TableRow } from "./Table";

export interface RegisterColumn {
  label: React.ReactNode;
  align?: "left" | "center" | "right";
  compact?: boolean;
  hideOnPrint?: boolean;
  className?: string;
}

export interface RegisterTableProps {
  title: React.ReactNode;
  countLabel?: React.ReactNode;
  columns: RegisterColumn[];
  children: React.ReactNode;
  wrapperClassName?: string;
}

const HEADER_CELL =
  "py-2 font-bold text-agm-text uppercase text-[10px] tracking-wider whitespace-nowrap";

export const RegisterTable: React.FC<RegisterTableProps> = ({
  title,
  countLabel,
  columns,
  children,
  wrapperClassName = "",
}) => (
  <div
    className={`rounded-2xl border border-agm-box-border overflow-hidden shadow-xs min-w-0 max-w-full ${wrapperClassName}`}
  >
    <div className="bg-agm-sidebar text-white py-2.5 px-4 sm:px-5 flex items-center justify-between">
      <h4 className="font-bold text-xs uppercase tracking-wider text-white">
        {title}
      </h4>
      {countLabel !== undefined && (
        <span className="text-[11px] font-mono text-agm-green-soft font-bold">
          {countLabel}
        </span>
      )}
    </div>

    <Table className="w-full text-xs text-left">
      <TableHead className="bg-agm-box-bg border-b border-agm-box-border">
        <TableRow>
          {columns.map((col, i) => {
            const align = col.align ?? "left";
            return (
              <TableHeaderCell
                key={i}
                align={align}
                className={`${HEADER_CELL} ${col.compact ? "px-2.5" : "px-3"} ${
                  col.hideOnPrint ? "print:hidden" : ""
                } ${col.className ?? ""}`}
              >
                {col.label}
              </TableHeaderCell>
            );
          })}
        </TableRow>
      </TableHead>
      {children}
    </Table>
  </div>
);

export default RegisterTable;
