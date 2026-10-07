"use client";

import React from "react";
import {
  BanknoteIcon,
  CalendarIcon,
  CreditCardIcon,
  FileCheck2Icon,
  PrintIcon,
  ReceiptIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import {
  Button,
  Badge,
  Card,
  CustomRowExpand,
  ExpandedRowSection,
} from "@/components/ui";
import { SupplierBill } from "@/lib/hooks/api-hooks";
import { formatNumber } from "@/lib/utils/format";

export interface SupplierBillExpandedRowProps {
  bill: SupplierBill;
  onPrint: () => void;
  onPost?: () => void;
  onDisburse?: () => void;
  onClose: () => void;
}

export function SupplierBillExpandedRow({
  bill,
  onPrint,
  onPost,
  onDisburse,
  onClose,
}: SupplierBillExpandedRowProps) {
  const vatAmount = Number(
    bill.vatAmount || bill.totalAmount - bill.totalAmount / 1.05 || 0,
  );
  const remaining = Number(bill.remainingBalance || 0);

  const getStatusTone = (
    status: string,
  ): "emerald" | "sky" | "amber" | "slate" => {
    switch (status) {
      case "PAID":
        return "emerald";
      case "POSTED":
        return "sky";
      case "PARTIALLY_PAID":
        return "amber";
      default:
        return "slate";
    }
  };

  return (
    <CustomRowExpand
      colSpan={8}
      onClose={onClose}
      headerLeft={
        <>
          <span className="px-2.5 py-1 rounded-lg bg-teal-900 text-teal-200 font-mono font-bold text-xs shadow-2xs">
            {bill.billNumber}
          </span>
          <span className="text-xs font-bold text-slate-900">
            {bill.supplierName}
          </span>
          {bill.supplierTrn && (
            <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
              <ShieldCheckIcon size={12} className="text-emerald-700" />
              TRN: {bill.supplierTrn}
            </span>
          )}
          {bill.billDate && (
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              Date: {new Date(bill.billDate).toLocaleDateString("en-GB")}
            </span>
          )}
          <Badge tone={getStatusTone(bill.status)}>{bill.status}</Badge>
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
            Print Voucher (PDF)
          </Button>

          {onPost && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onPost}
              icon={
                <FileCheck2Icon size={14} className="w-3.5 h-3.5 text-white" />
              }
              className="bg-agm-green hover:bg-agm-green-2 text-white text-xs font-bold cursor-pointer shadow-2xs"
            >
              Post to GL
            </Button>
          )}

          {onDisburse && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onDisburse}
              icon={
                <BanknoteIcon size={14} className="w-3.5 h-3.5 text-white" />
              }
              className="bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold cursor-pointer shadow-2xs"
            >
              Disburse Payment
            </Button>
          )}
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card
          id="bill-total"
          value={`AED ${formatNumber(bill.totalAmount)}`}
          title="Total Bill Value"
          subtitle="Gross payable amount"
          icon={<CreditCardIcon size={16} />}
          accentColor="blue"
        />

        <Card
          id="bill-balance"
          value={`AED ${formatNumber(remaining)}`}
          title="Remaining Balance Due"
          subtitle={
            remaining > 0 ? "Awaiting payment settlement" : "Fully settled"
          }
          icon={<ScaleIcon size={16} />}
          accentColor={remaining > 0 ? "rose" : "emerald"}
        />

        <Card
          id="bill-vat"
          value={`AED ${formatNumber(vatAmount)}`}
          title="Recoverable VAT (5%)"
          subtitle="FTA Input Tax credit"
          icon={<ShieldCheckIcon size={16} />}
          accentColor="purple"
        />

        <Card
          id="bill-due"
          value={
            bill.dueDate
              ? new Date(bill.dueDate).toLocaleDateString("en-GB")
              : "Immediate"
          }
          title="Payment Maturity"
          subtitle={`Bill Date: ${
            bill.billDate
              ? new Date(bill.billDate).toLocaleDateString("en-GB")
              : "-"
          }`}
          icon={<CalendarIcon size={16} />}
          accentColor="slate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ExpandedRowSection
          title="Vendor & Invoice Information"
          icon={<ReceiptIcon size={14} />}
          badge="AP Ledger Record"
        >
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Vendor / Supplier
              </span>
              <span className="font-bold text-slate-800">
                {bill.supplierName}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                UAE VAT TRN
              </span>
              <span className="font-mono font-bold text-emerald-800">
                {bill.supplierTrn || "Not Registered"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Invoice Issue Date
              </span>
              <span className="font-mono text-slate-700">
                {bill.billDate
                  ? new Date(bill.billDate).toLocaleDateString("en-GB")
                  : "-"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Payment Maturity
              </span>
              <span className="font-mono text-slate-700">
                {bill.dueDate
                  ? new Date(bill.dueDate).toLocaleDateString("en-GB")
                  : "-"}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Paid Disbursal
              </span>
              <span className="font-mono font-bold text-emerald-700">
                AED {formatNumber(bill.paidAmount || 0)}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                GL Ledger Status
              </span>
              <span className="font-bold text-slate-800">
                {bill.status === "POSTED" || bill.status === "PAID"
                  ? "Posted to Ledger"
                  : "Draft Entry"}
              </span>
            </div>
          </div>
        </ExpandedRowSection>

        <ExpandedRowSection
          title="Line Items & Accounting Scope"
          icon={<BanknoteIcon size={14} />}
          badge={`${bill.items?.length || 1} Item(s)`}
          className="flex flex-col justify-between"
        >
          <div>
            <div className="space-y-1.5 pt-1">
              {!bill.items || bill.items.length === 0 ? (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">
                      Direct Procurement / Site Supply
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Direct material supplies
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    AED {formatNumber(bill.totalAmount)}
                  </span>
                </div>
              ) : (
                bill.items.map((it: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">
                        {it.description || it.product?.name || "Material line"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Qty: {it.quantity || 1} • Unit: AED{" "}
                        {formatNumber(it.unitCost || 0)}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      AED{" "}
                      {formatNumber(
                        Number(it.quantity || 1) * Number(it.unitCost || 0),
                      )}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10.5px] text-slate-500 font-mono">
              GL Impact: Dr. Purchases • Dr. Input VAT • Cr. AP
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onPrint}
              icon={<PrintIcon size={12} className="text-emerald-700" />}
              className="text-xs font-bold text-teal-800 hover:text-teal-900 cursor-pointer p-0 h-auto flex items-center gap-1"
            >
              Print Full Voucher →
            </Button>
          </div>
        </ExpandedRowSection>
      </div>
    </CustomRowExpand>
  );
}
