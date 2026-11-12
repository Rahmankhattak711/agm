"use client";

import React from "react";
import {
  BuildingIcon,
  CreditCardIcon,
  EditIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import {
  CustomRowExpand,
  ExpandedRowSection,
} from "@/components/ui";
import { getQuotationStatus } from "@/lib/utils/status";

export interface QuotationExpandedRowProps {
  quotation: any;
  onOpenEditor: (q: any) => void;
  onConvertToInvoice: (q: any) => void;
  onClose: () => void;
  formatNumber: (val: number | string | undefined) => string;
}

export function QuotationExpandedRow({
  quotation,
  onOpenEditor,
  onConvertToInvoice,
  onClose,
  formatNumber,
}: QuotationExpandedRowProps) {
  const status = getQuotationStatus(quotation.status);
  const items = quotation.items || [];
  const subtotal = Number(quotation.subtotal || 0);
  const vatAmount = Number(quotation.vatAmount || 0);
  const totalAmount = Number(quotation.totalAmount || 0);

  const isAccepted = quotation.status === "ACCEPTED";
  const isRejected = quotation.status === "REJECTED";
  const isSent = quotation.status === "SENT";

  return (
    <CustomRowExpand
      colSpan={7}
      onClose={onClose}
      headerLeft={
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="px-2 py-0.5 rounded font-mono font-medium text-xs shadow-2xs"
            style={{
              backgroundColor: "#eff6ff",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
            }}
          >
            {quotation.quotationNo}
          </span>
          <span className="text-xs font-semibold text-slate-800">
            {quotation.customer || quotation.customerRel?.name || "Client"}
          </span>
          {quotation.customerRel?.customerCode && (
            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 border border-[#cbd5e1] px-1.5 py-0.5 rounded font-medium">
              [{quotation.customerRel.customerCode}]
            </span>
          )}
          {quotation.validUntil && (
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              Valid until: {quotation.validUntil}
            </span>
          )}
          <span
            className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-medium"
            style={{
              backgroundColor: isAccepted
                ? "#f0fdf4"
                : isRejected
                  ? "#fff1f2"
                  : isSent
                    ? "#eff6ff"
                    : "#fefce8",
              color: isAccepted
                ? "#15803d"
                : isRejected
                  ? "#be123c"
                  : isSent
                    ? "#1d4ed8"
                    : "#a16207",
              border: isAccepted
                ? "1px solid #bbf7d0"
                : isRejected
                  ? "1px solid #fecdd3"
                  : isSent
                    ? "1px solid #bfdbfe"
                    : "1px solid #fef08a",
            }}
          >
            {status.label}
          </span>
        </div>
      }
      headerRight={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenEditor(quotation)}
            className="px-2.5 py-1.5 rounded-lg border border-[#cbd5e1] text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <EditIcon size={13} className="text-[#1d4ed8]" />
            <span>Open in Editor</span>
          </button>
          <button
            type="button"
            onClick={() => onConvertToInvoice(quotation)}
            className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            style={{ backgroundColor: "#1d4ed8" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e40af")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
          >
            <FileTextIcon size={13} className="text-white" />
            <span>Convert to Invoice</span>
          </button>
        </div>
      }
    >
      {/* 3 Compact Pastel KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          className="rounded-xl p-3 flex flex-col justify-between"
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1",
          }}
        >
          <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-slate-500">
            <span>Gross Subtotal</span>
            <CreditCardIcon size={14} className="text-slate-400" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-800 my-1">
            AED {formatNumber(subtotal)}
          </div>
          <div className="text-[11px] text-slate-500">
            {items.length} Scope Item(s)
          </div>
        </div>

        <div
          className="rounded-xl p-3 flex flex-col justify-between"
          style={{
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
          }}
        >
          <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-[#1d4ed8]">
            <span>VAT ({quotation.vatPct || 5}%)</span>
            <ShieldCheckIcon size={14} className="text-[#1d4ed8]" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-[#1d4ed8] my-1">
            AED {formatNumber(vatAmount)}
          </div>
          <div className="text-[11px] text-blue-600">
            Standard UAE 5% Tax
          </div>
        </div>

        <div
          className="rounded-xl p-3 flex flex-col justify-between"
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
          }}
        >
          <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-[#15803d]">
            <span>Net Proposal Value</span>
            <FileTextIcon size={14} className="text-[#15803d]" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-[#15803d] my-1">
            AED {formatNumber(totalAmount)}
          </div>
          <div className="text-[11px] text-emerald-600">
            Total Contract Price
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div
          className="rounded-xl bg-white p-3.5 space-y-2.5"
          style={{ border: "1px solid #cbd5e1" }}
        >
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "#cbd5e1" }}>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <BuildingIcon size={14} className="text-[#1d4ed8]" />
              <span>Client &amp; Project Information</span>
            </div>
            <span
              className="text-[10px] font-mono font-medium px-2 py-0.5 rounded"
              style={{
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
              }}
            >
              {quotation.reference || "Official Quote"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
            <div>
              <span className="text-[10px] font-medium text-slate-400 block uppercase">
                Client / Company
              </span>
              <span className="font-semibold text-slate-800">
                {quotation.customer || quotation.customerRel?.name || "—"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-medium text-slate-400 block uppercase">
                Attention / Contact
              </span>
              <span className="text-slate-700 font-medium">
                {quotation.attention || "—"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-medium text-slate-400 block uppercase">
                Phone / Mobile
              </span>
              <span className="font-mono text-slate-700">
                {quotation.mobile || quotation.customerRel?.phone || "—"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-medium text-slate-400 block uppercase">
                Project Name
              </span>
              <span className="text-slate-700 font-medium truncate block">
                {quotation.project || "—"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-medium text-slate-400 block uppercase">
                Site Location
              </span>
              <span className="text-slate-700 truncate block">
                {quotation.location || quotation.address || "United Arab Emirates"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-medium text-slate-400 block uppercase">
                Prepared By
              </span>
              <span className="text-slate-700 font-medium truncate block">
                {quotation.preparedBy || quotation.createdBy?.fullName || "AGM Sales Desk"}
              </span>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl bg-white p-3.5 space-y-2.5"
          style={{ border: "1px solid #cbd5e1" }}
        >
          <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "#cbd5e1" }}>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <FileSpreadsheetIcon size={14} className="text-[#1d4ed8]" />
              <span>Itemized Scope of Work (BOQ)</span>
            </div>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "1px solid #cbd5e1",
              }}
            >
              {items.length} Item(s)
            </span>
          </div>

          {items.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs italic">
              No individual line items listed.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-56 overflow-y-auto rounded-lg border" style={{ borderColor: "#cbd5e1" }}>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr
                    className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500"
                    style={{
                      backgroundColor: "#f4f7fb",
                      borderBottom: "1px solid #cbd5e1",
                    }}
                  >
                    <th className="py-2 px-2.5 text-left w-8">#</th>
                    <th className="py-2 px-2.5 text-left">Description</th>
                    <th className="py-2 px-2 text-right w-14">Qty</th>
                    <th className="py-2 px-2 text-center w-12">Unit</th>
                    <th className="py-2 px-2 text-right w-20">Rate</th>
                    <th className="py-2 px-2.5 text-right w-24">Total (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {items.map((it: any, idx: number) => (
                    <tr key={it.id || idx} className="hover:bg-slate-50/60">
                      <td className="py-2 px-2.5 text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2.5 text-slate-800">
                        <div className="font-medium text-slate-800">{it.description}</div>
                        {it.product?.sku && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            SKU: {it.product.sku}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-700">
                        {it.quantity}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-500 text-[11px]">
                        {it.unit || "NOS"}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-700">
                        {formatNumber(it.unitRate)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-medium text-slate-900">
                        {formatNumber(it.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </CustomRowExpand>
  );
}
