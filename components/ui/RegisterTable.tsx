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
  "py-2 font-bold text-slate-600 uppercase text-[10px] tracking-wider whitespace-nowrap";

export const RegisterTable: React.FC<RegisterTableProps> = ({
  title,
  countLabel,
  columns,
  children,
  wrapperClassName = "",
}) => (
  <div
    className={`rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs min-w-0 max-w-full ${wrapperClassName}`}
  >
    <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white py-2.5 px-4 sm:px-5 flex items-center justify-between">
      <h4 className="font-bold text-xs uppercase tracking-wider text-white">
        {title}
      </h4>
      {countLabel !== undefined && (
        <span className="text-[11px] font-mono text-emerald-300 font-bold">
          {countLabel}
        </span>
      )}
    </div>

    <Table className="w-full text-xs text-left">
      <TableHead className="bg-slate-50 border-b border-slate-200">
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
