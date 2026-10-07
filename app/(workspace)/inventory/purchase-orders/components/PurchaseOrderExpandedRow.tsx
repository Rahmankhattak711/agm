"use client";

import React from "react";
import {
  BuildingIcon,
  CreditCardIcon,
  FileTextIcon,
  ShieldCheckIcon,
  TruckIcon,
  PrintIcon,
  PackageIcon,
  ShoppingCartIcon,
} from "@/components/icons";
import {
  Button,
  Badge,
  Card,
  CustomRowExpand,
  ExpandedRowSection,
} from "@/components/ui";
import { PurchaseOrder } from "@/lib/hooks/api-hooks";
import { formatNumber } from "@/lib/utils/format";

export interface PurchaseOrderExpandedRowProps {
  po: PurchaseOrder;
  canEdit: boolean;
  onPrint: () => void;
  onSend?: () => void;
  onReceive?: () => void;
  isUpdating?: boolean;
  onClose: () => void;
}

export function PurchaseOrderExpandedRow({
  po,
  canEdit,
  onPrint,
  onSend,
  onReceive,
  isUpdating,
  onClose,
}: PurchaseOrderExpandedRowProps) {
  const calculatedSubtotal = (po.items || []).reduce(
    (acc, it) =>
      acc + Number(it.quantityOrdered || 0) * Number(it.unitCost || 0),
    0,
  );
  const vatAmount = calculatedSubtotal * 0.05;
  const grandTotal = Number(po.totalAmount || calculatedSubtotal + vatAmount);

  const getStatusTone = (
    status: string,
  ): "amber" | "sky" | "emerald" | "rose" => {
    switch (status) {
      case "DRAFT":
        return "amber";
      case "ORDERED":
        return "sky";
      case "RECEIVED":
        return "emerald";
      default:
        return "rose";
    }
  };

  return (
    <CustomRowExpand
      colSpan={8}
      onClose={onClose}
      headerLeft={
        <>
          <span className="px-2.5 py-1 rounded-lg bg-teal-900 text-teal-200 font-mono font-bold text-xs shadow-2xs">
            {po.poNumber}
          </span>
          <span className="text-xs font-bold text-slate-900">
            {po.supplier?.name || po.shopName || "External Supplier"}
          </span>
          {po.vendorReference && (
            <span className="text-[11px] font-mono text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-semibold">
              Ref: {po.vendorReference}
            </span>
          )}
          {po.orderDate && (
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              Ordered: {new Date(po.orderDate).toLocaleDateString("en-GB")}
            </span>
          )}
          <Badge tone={getStatusTone(po.status)}>{po.status}</Badge>
        </>
      }
      headerRight={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPrint}
            icon={
              <PrintIcon size={14} className="w-3.5 h-3.5 text-emerald-700" />
            }
            className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            Print PO Voucher
          </Button>

          {onSend && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={isUpdating}
              onClick={onSend}
              className="text-xs font-bold cursor-pointer shadow-2xs"
            >
              Send to Supplier
            </Button>
          )}

          {onReceive && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onReceive}
              className="bg-agm-green hover:bg-agm-green-2 text-white text-xs font-bold cursor-pointer shadow-2xs"
            >
              Receive Goods
            </Button>
          )}
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card
          id="po-total"
          value={`AED ${formatNumber(grandTotal)}`}
          title="Total PO Value"
          subtitle="Gross procurement liability"
          icon={<CreditCardIcon size={16} />}
          accentColor="emerald"
        />

        <Card
          id="po-subtotal"
          value={`AED ${formatNumber(calculatedSubtotal)}`}
          title="Net Subtotal"
          subtitle="Excl. 5% UAE VAT"
          icon={<FileTextIcon size={16} />}
          accentColor="sky"
        />

        <Card
          id="po-vat"
          value={`AED ${formatNumber(vatAmount)}`}
          title="UAE Input VAT (5%)"
          subtitle="Claimable tax credit"
          icon={<ShieldCheckIcon size={16} />}
          accentColor="amber"
        />

        <Card
          id="po-due"
          value={
            po.expectedDate
              ? new Date(po.expectedDate).toLocaleDateString("en-GB")
              : "Standard"
          }
          title="Expected Delivery"
          subtitle={
            po.orderDate
              ? `Ordered: ${new Date(po.orderDate).toLocaleDateString("en-GB")}`
              : "Order date pending"
          }
          icon={<TruckIcon size={16} />}
          accentColor="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <ExpandedRowSection
          title="Vendor & Requisition Profile"
          icon={<BuildingIcon size={14} />}
          badge="Procurement Partner"
          className="lg:col-span-1"
        >
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                Supplier / Vendor
              </span>
              <span className="font-bold text-slate-900">
                {po.supplier?.name || po.shopName || "External Supplier"}
              </span>
            </div>

            {po.supplier?.trn && (
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                  UAE Tax Registration (TRN)
                </span>
                <span className="font-mono text-emerald-800 font-bold">
                  {po.supplier.trn}
                </span>
              </div>
            )}

            {po.shopName && (
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                  Store / Shop Branch
                </span>
                <span className="text-slate-800 font-medium">
                  {po.shopName}
                </span>
              </div>
            )}

            {po.vendorReference && (
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                  Vendor Reference / Quote #
                </span>
                <span className="font-mono text-teal-800 font-bold">
                  {po.vendorReference}
                </span>
              </div>
            )}

            {po.creator?.fullName && (
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                  Procurement Officer
                </span>
                <span className="text-slate-800 font-semibold">
                  {po.creator.fullName}
                </span>
              </div>
            )}

            {po.notes && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                  Order Instructions / Terms
                </span>
                <p className="text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1 leading-relaxed">
                  {po.notes}
                </p>
              </div>
            )}
          </div>
        </ExpandedRowSection>

        <ExpandedRowSection
          title={`Itemized Procurement Materials (${po.items?.length || 0})`}
          icon={<PackageIcon size={14} />}
          badge={`Subtotal: AED ${formatNumber(calculatedSubtotal)}`}
          className="lg:col-span-2"
        >
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5">#</th>
                    <th className="py-2 px-2.5">Product / SKU</th>
                    <th className="py-2 px-2.5">Supplier SKU</th>
                    <th className="py-2 px-2 text-center">Ordered</th>
                    <th className="py-2 px-2 text-center">Received</th>
                    <th className="py-2 px-2.5 text-right">Unit Rate</th>
                    <th className="py-2 px-2.5 text-right">Total (AED)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(po.items || []).map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-slate-50/60">
                      <td className="py-2 px-2.5 text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2.5">
                        <div className="font-bold text-slate-900">
                          {it.product?.name || "Product Item"}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          SKU: {it.product?.sku || "-"}
                        </div>
                        {it.itemNotes && (
                          <div className="text-[10px] text-slate-400 italic">
                            {it.itemNotes}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-slate-600 text-[10.5px]">
                        {it.supplierSku || it.product?.supplierSku || "-"}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-900">
                        {Number(it.quantityOrdered).toLocaleString()}{" "}
                        <span className="text-[10px] font-normal text-slate-400">
                          {it.product?.unit || "PCS"}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-slate-600">
                        {Number(it.quantityReceived || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono text-slate-700">
                        {formatNumber(it.unitCost)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                        {formatNumber(it.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-slate-500">
                  VAT (5%):{" "}
                  <strong className="text-slate-800">
                    AED {formatNumber(vatAmount)}
                  </strong>
                </span>
                <span className="text-slate-900 font-bold text-sm">
                  Grand Total:{" "}
                  <strong className="text-emerald-800">
                    AED {formatNumber(grandTotal)}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </ExpandedRowSection>
      </div>
    </CustomRowExpand>
  );
}
