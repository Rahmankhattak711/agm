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
    <div className={`overflow-x-auto ${wrapperClassName}`}>
      <table className={`w-full text-left text-xs ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHead: React.FC<
  React.HTMLAttributes<HTMLTableSectionElement>
> = ({ children, className = "", ...props }) => {
  return (
    <thead className={className} {...props}>
      <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
        {children}
      </tr>
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
  return (
    <th className={`pb-3 px-3 ${alignClass} ${className}`} {...props}>
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
}> = ({ message = "Loading records...", colSpan = 8 }) => {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="py-12 text-center text-xs text-slate-400 animate-pulse"
      >
        {message}
      </td>
    </tr>
  );
};

import OutsideClickHandler from "react-outside-click-handler";
import { useEffect } from "react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <OutsideClickHandler
        onOutsideClick={() => {
          if (closeOnOutsideClick) {
            onClose();
          }
        }}
      >
        <div
          className={`w-full ${widthClass[maxWidth]} bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-900">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </OutsideClickHandler>
    </div>
  );
};
