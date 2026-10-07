"use client";

import React, { TableHTMLAttributes } from "react";

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string;
}

export const Table: React.FC<TableProps> = ({
  children,
  className = "",
  wrapperClassName = "",
  ...props
}) => {
  return (
    <div
      className={`overflow-x-auto min-w-0 max-w-full w-full custom-scrollbar ${wrapperClassName}`}
    >
      <table className={`w-full text-left text-xs ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHead: React.FC<
  React.HTMLAttributes<HTMLTableSectionElement>
> = ({ children, className = "", ...props }) => {
  const hasRow = React.Children.toArray(children).some(
    (child) =>
      React.isValidElement(child) &&
      (child.type === TableRow ||
        (typeof child.type === "string" && child.type === "tr")),
  );

  return (
    <thead className={className} {...props}>
      {hasRow ? (
        children
      ) : (
        <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
          {children}
        </tr>
      )}
    </thead>
  );
};

export const TableHeaderCell: React.FC<
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    align?: "left" | "center" | "right";
  }
> = ({ children, align = "left", className = "", ...props }) => {
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";
  const cleanClassName = className
    .replace(/\bpy-3\.5\b/g, "py-2")
    .replace(/\bpy-3\b/g, "py-2");
  return (
    <th
      className={`py-2 px-3 text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap ${alignClass} ${cleanClassName}`}
      {...props}
    >
      {children}
    </th>
  );
};

export const TableBody: React.FC<
  React.HTMLAttributes<HTMLTableSectionElement>
> = ({ children, className = "", ...props }) => {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <tr
      className={`hover:bg-slate-50/70 transition-colors ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
};

export const TableCell: React.FC<
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    align?: "left" | "center" | "right";
  }
> = ({ children, align = "left", className = "", ...props }) => {
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";
  return (
    <td className={`py-3 px-3 ${alignClass} ${className}`} {...props}>
      {children}
    </td>
  );
};

export const TableEmpty: React.FC<{
  title?: string;
  message?: string;
  colSpan?: number;
}> = ({ title = "No records found", message, colSpan = 8 }) => {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-slate-400">
        <p className="text-sm font-semibold text-slate-600">{title}</p>
        {message && <p className="text-xs mt-1">{message}</p>}
      </td>
    </tr>
  );
};

export const TableLoading: React.FC<{
  message?: string;
  colSpan?: number;
  rows?: number;
}> = ({ colSpan = 8, rows = 5 }) => {
  const widths = [
    "w-3/4",
    "w-1/2",
    "w-4/5",
    "w-2/3",
    "w-5/6",
    "w-3/5",
    "w-4/6",
  ];

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="hover:bg-slate-50/40">
          {Array.from({ length: colSpan }).map((_, colIdx) => {
            const width = widths[(rowIdx + colIdx) % widths.length];
            return (
              <td key={colIdx} className="py-3.5 px-3">
                <div
                  className={`h-3.5 ${width} rounded-md bg-slate-200/75 animate-pulse`}
                />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
};

import OutsideClickHandler from "react-outside-click-handler";
import { useEffect } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  closeOnOutsideClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
  closeOnOutsideClick = true,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClass: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-3 sm:p-4 print:p-0 print:bg-transparent print:static print:block print:inset-auto print:z-auto">
      <OutsideClickHandler
        onOutsideClick={() => {
          if (closeOnOutsideClick) {
            onClose();
          }
        }}
      >
        <div
          className={`w-full ${widthClass[maxWidth]} max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:rounded-none print:w-full print:max-w-full print:p-0`}
        >
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-100 bg-slate-50/50 print:hidden">
            <h3 className="font-bold text-sm text-slate-900 truncate pr-2">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer p-1"
            >
              ✕
            </button>
          </div>
          <div className="p-4 sm:p-5 print:p-0">{children}</div>
        </div>
      </OutsideClickHandler>
    </div>
  );
};
