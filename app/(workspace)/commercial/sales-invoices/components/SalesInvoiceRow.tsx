"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInvoiceStatus } from "@/lib/utils/status";
import {
  FileTextIcon,
  MoreVerticalIcon,
  EyeIcon,
} from "@/components/icons";
import { SalesInvoice } from "@/lib/hooks/api-hooks";
import { formatNumber } from "./types";

export interface SalesInvoiceRowProps {
  inv: SalesInvoice;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onPrint: (inv: SalesInvoice) => void;
  onPost: (invId: string) => void;
  onOpenPayment: (inv: SalesInvoice) => void;
  onEdit: (inv: SalesInvoice) => void;
  onDelete: (inv: SalesInvoice) => void;
  isMenuOpen: boolean;
  onOpenMenu: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const SalesInvoiceRow: React.FC<SalesInvoiceRowProps> = ({
  inv,
  isMenuOpen,
  onOpenMenu,
}) => {
  const router = useRouter();
  const status = getInvoiceStatus(inv.status);

  const handleOpenDetail = () => {
    router.push(`/commercial/sales-invoices/${inv.id}`);
  };

  const isPosted = inv.status === "POSTED";
  const isPaid = inv.status === "PAID";
  const isPartiallyPaid = inv.status === "PARTIALLY_PAID";
  const isDraft = inv.status === "DRAFT";

  const balanceDue = Number(inv.remainingBalance || 0);

  return (
    <tr
      onClick={handleOpenDetail}
      className="hover:bg-[#f8fafc] transition-colors cursor-pointer group"
    >
      <td className="py-2.5 px-4 font-mono text-slate-800 whitespace-nowrap">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <FileTextIcon
            size={14}
            className="text-[#1d4ed8] shrink-0"
          />
          <Link
            href={`/commercial/sales-invoices/${inv.id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-mono text-[11px] font-medium px-1.5 py-0.5 rounded transition-colors hover:bg-blue-100"
            style={{
              backgroundColor: "#eff6ff",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
            }}
            title="Open full invoice page"
          >
            {inv.invoiceNumber}
          </Link>
        </div>
        {inv.quotationRef && (
          <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-1 whitespace-nowrap">
            <span className="text-slate-400">Quote:</span>
            <span className="font-medium">{inv.quotationRef}</span>
          </div>
        )}
      </td>

      <td className="py-2.5 px-4 text-slate-900 text-xs">
        <div
          className="font-medium text-slate-800 truncate max-w-[150px] sm:max-w-[200px]"
          title={inv.customerName}
        >
          {inv.customerName}
        </div>
        {inv.customerTrn && (
          <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap truncate max-w-[150px]">
            TRN: {inv.customerTrn}
          </div>
        )}
      </td>

      <td className="py-2.5 px-4 text-slate-600 text-xs">
        <div
          className="truncate max-w-[120px] sm:max-w-[170px]"
          title={inv.projectScope || ""}
        >
          {inv.projectScope || "—"}
        </div>
      </td>

      <td className="py-2.5 px-3 text-center text-slate-600 font-mono text-[11px] whitespace-nowrap">
        {inv.invoiceDate
          ? new Date(inv.invoiceDate).toLocaleDateString("en-GB")
          : "—"}
      </td>

      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 whitespace-nowrap text-xs">
        AED {formatNumber(inv.totalAmount)}
      </td>

      <td
        className={`py-2.5 px-3 text-right font-mono font-medium whitespace-nowrap text-xs ${
          balanceDue > 0 ? "text-[#be123c]" : "text-[#15803d]"
        }`}
      >
        AED {formatNumber(inv.remainingBalance)}
      </td>

      <td className="py-2.5 px-3 text-center whitespace-nowrap">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-medium"
          style={{
            backgroundColor: isPaid
              ? "#f0fdf4"
              : isPosted
                ? "#eff6ff"
                : isPartiallyPaid
                  ? "#fefce8"
                  : isDraft
                    ? "#f1f5f9"
                    : "#fff1f2",
            color: isPaid
              ? "#15803d"
              : isPosted
                ? "#1d4ed8"
                : isPartiallyPaid
                  ? "#a16207"
                  : isDraft
                    ? "#475569"
                    : "#be123c",
            border: isPaid
              ? "1px solid #bbf7d0"
              : isPosted
                ? "1px solid #bfdbfe"
                : isPartiallyPaid
                  ? "1px solid #fef08a"
                  : isDraft
                    ? "1px solid #cbd5e1"
                    : "1px solid #fecdd3",
          }}
        >
          {status.label}
        </span>
      </td>

      <td className="py-2.5 px-3 text-right print:hidden whitespace-nowrap pr-4">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetail();
            }}
            className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-[#1d4ed8] hover:bg-[#eff6ff] border border-transparent hover:border-[#bfdbfe] transition-all cursor-pointer"
            title="Open Full Invoice View"
            aria-label="Open Full Invoice View"
          >
            <EyeIcon size={14} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenMenu(e);
            }}
            className={`h-7 w-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
              isMenuOpen
                ? "bg-slate-800 text-white"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200"
            }`}
            title="More actions"
            aria-label="More actions"
          >
            <MoreVerticalIcon size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default SalesInvoiceRow;
