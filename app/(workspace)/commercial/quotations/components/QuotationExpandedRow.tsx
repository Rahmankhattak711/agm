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
  Button,
  Badge,
  Card,
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

  return (
    <CustomRowExpand
      colSpan={7}
      onClose={onClose}
      headerLeft={
        <>
          <span className="px-2.5 py-1 rounded-lg bg-teal-900 text-teal-200 font-mono font-bold text-xs shadow-2xs">
            {quotation.quotationNo}
          </span>
          <span className="text-xs font-bold text-slate-900">
            {quotation.customer || quotation.customerRel?.name || "Client"}
          </span>
          {quotation.customerRel?.customerCode && (
            <span className="text-[11px] font-mono text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium">
              [{quotation.customerRel.customerCode}]
            </span>
          )}
          {quotation.validUntil && (
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              Valid until: {quotation.validUntil}
            </span>
          )}
          <Badge tone={status.tone} className="text-[10.5px] px-2 py-0.5">
            {status.label}
          </Badge>
        </>
      }
      headerRight={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenEditor(quotation)}
            icon={<EditIcon size={14} className="w-3.5 h-3.5 text-blue-700" />}
            className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            Open in Editor
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onConvertToInvoice(quotation)}
            icon={<FileTextIcon size={14} className="w-3.5 h-3.5 text-white" />}
            className="text-xs font-bold bg-agm-green hover:bg-agm-green-2 text-white shadow-2xs cursor-pointer"
          >
            Convert to Invoice
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card
          id="qtn-subtotal"
          value={`AED ${formatNumber(subtotal)}`}
          title="Gross Subtotal"
          subtitle={`${items.length} Scope Item(s)`}
          icon={<CreditCardIcon size={16} />}
          accentColor="slate"
        />

        <Card
          id="qtn-vat"
          value={`AED ${formatNumber(vatAmount)}`}
          title={`VAT (${quotation.vatPct || 5}%)`}
          subtitle="Tax breakdown"
          icon={<ShieldCheckIcon size={16} />}
          accentColor="blue"
        />

        <Card
          id="qtn-total"
          value={`AED ${formatNumber(totalAmount)}`}
          title="Net Proposal Value"
          subtitle="Total Contract Price"
          accentColor="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ExpandedRowSection
          title="Client & Project Information"
          icon={<BuildingIcon size={14} />}
          badge={quotation.reference || "Official Quote"}
        >
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block">
                Client / Company
              </span>
              <span className="font-bold text-slate-800">
                {quotation.customer || quotation.customerRel?.name || "—"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 block">
                Attention / Contact Person
              </span>
              <span className="text-slate-700 font-medium">
                {quotation.attention || "—"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 block">
                Phone / Mobile
              </span>
              <span className="font-mono text-slate-700">
                {quotation.mobile || quotation.customerRel?.phone || "—"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 block">
                Project Name
              </span>
              <span className="text-slate-700 font-medium truncate block">
                {quotation.project || "—"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 block">
                Site / Delivery Location
              </span>
              <span className="text-slate-700 truncate block">
                {quotation.location ||
                  quotation.address ||
                  "United Arab Emirates"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 block">
                Prepared By
              </span>
              <span className="text-slate-700 font-medium truncate block">
                {quotation.preparedBy || quotation.createdBy?.fullName || "—"}
              </span>
            </div>
          </div>
        </ExpandedRowSection>

        <ExpandedRowSection
          title="Itemized Scope of Work (BOQ)"
          icon={<FileSpreadsheetIcon size={14} />}
          badge={`${items.length} Item(s)`}
        >
          {items.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs italic">
              No individual line items listed.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-56 overflow-y-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[10px] uppercase">
                    <th className="py-1.5 px-2 text-left w-6">#</th>
                    <th className="py-1.5 px-2 text-left">Description</th>
                    <th className="py-1.5 px-2 text-right w-14">Qty</th>
                    <th className="py-1.5 px-2 text-center w-12">Unit</th>
                    <th className="py-1.5 px-2 text-right w-18">Rate</th>
                    <th className="py-1.5 px-2 text-right w-20">Total (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {items.map((it: any, idx: number) => (
                    <tr key={it.id || idx} className="hover:bg-slate-50/60">
                      <td className="py-1.5 px-2 text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-2 text-slate-800">
                        <div className="font-semibold">{it.description}</div>
                        {it.product?.sku && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            SKU: {it.product.sku}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-slate-700">
                        {it.quantity}
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono text-slate-500 text-[11px]">
                        {it.unit || "NOS"}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-slate-700">
                        {formatNumber(it.unitRate)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                        {formatNumber(it.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ExpandedRowSection>
      </div>
    </CustomRowExpand>
  );
}
