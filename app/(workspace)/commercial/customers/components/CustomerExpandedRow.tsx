"use client";

import React, { useMemo } from "react";
import {
  BuildingIcon,
  CloseIcon,
  FileTextIcon,
  PrintIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { Button, TableRow, TableCell } from "@/components/ui";
import { Customer, useCustomerStatement } from "@/lib/hooks/api-hooks";

function formatNumber(val: number | string | undefined): string {
  const num = Number(val || 0);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export interface CustomerExpandedRowProps {
  customer: Customer;
  onPrint: () => void;
  onClose: () => void;
}

export function CustomerExpandedRow({
  customer,
  onPrint,
  onClose,
}: CustomerExpandedRowProps) {
  const { data: statementData, isLoading } = useCustomerStatement(customer.id);
  const summary = statementData?.summary;
  const recentStatements = useMemo(() => {
    if (!statementData?.statement) return [];
    return statementData.statement.slice(-4).reverse();
  }, [statementData]);

  const outstanding = Number(
    summary?.currentOutstanding ?? customer.currentBalance ?? 0,
  );
  const creditLimit = Number(customer.creditLimit || 0);
  const availableCredit =
    creditLimit > 0 ? Math.max(0, creditLimit - outstanding) : 0;

  return (
    <TableRow className="hover:bg-transparent bg-slate-50/70">
      <TableCell colSpan={7} className="p-0 border-b-2 border-emerald-600/40">
        <div className="px-6 py-5 space-y-4 border-l-4 border-l-emerald-600 bg-gradient-to-b from-white via-slate-50/40 to-slate-100/40 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-teal-900 text-teal-200 font-mono font-bold text-xs shadow-2xs">
                {customer.customerCode}
              </span>
              <span className="text-xs font-bold text-slate-900">
                {customer.name}
              </span>
              {customer.companyName && (
                <span className="text-[11px] font-medium text-slate-500">
                  ({customer.companyName})
                </span>
              )}
              {customer.phone && (
                <span className="text-[11px] font-mono text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded font-medium">
                  {customer.phone}
                </span>
              )}
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  outstanding > 0
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}
              >
                {outstanding > 0
                  ? `Outstanding: AED ${formatNumber(outstanding)}`
                  : "Account Settled"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrint}
                icon={<PrintIcon size={13} className="text-emerald-700" />}
                className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                Print Statement (PDF)
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                title="Collapse preview"
              >
                <CloseIcon size={15} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-rose-50/90 border border-rose-200/80 rounded-xl space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                Outstanding Balance
              </span>
              <span className="text-base font-black font-mono text-rose-800 block">
                AED {formatNumber(outstanding)}
              </span>
              <span className="text-[10px] text-rose-600/90 font-medium block truncate">
                {outstanding > 0
                  ? "Pending collection / settlement"
                  : "Zero balance due"}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Credit Facility Limit
              </span>
              <span className="text-base font-black font-mono text-slate-900 block">
                AED {formatNumber(creditLimit)}
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                Available: AED {formatNumber(availableCredit)}
              </span>
            </div>

            <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Total Settled / Paid
              </span>
              <span className="text-base font-black font-mono text-emerald-900 block">
                AED {isLoading ? "..." : formatNumber(summary?.totalPaid ?? 0)}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium block truncate">
                Invoiced: AED{" "}
                {isLoading ? "..." : formatNumber(summary?.totalBilled ?? 0)}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Contact Phone &amp; Email
              </span>
              <span className="text-xs font-bold text-slate-900 block truncate">
                {customer.phone || "No direct phone"}
              </span>
              <span className="text-[11px] font-mono text-slate-600 block truncate">
                {customer.email || "No email registered"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-xs uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                  <BuildingIcon size={14} className="text-teal-700" />
                  Client Profile &amp; Billing Data
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Verified Account
                </span>
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    Full Legal Name
                  </span>
                  <span className="font-bold text-slate-800">
                    {customer.name}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    Company / Trade Name
                  </span>
                  <span className="text-slate-700 font-medium">
                    {customer.companyName || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    Contact Email
                  </span>
                  <span className="font-mono font-medium text-slate-800">
                    {customer.email || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    Billing Location
                  </span>
                  <span className="text-slate-700 truncate block">
                    {customer.address || "United Arab Emirates"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    Phone / Mobile
                  </span>
                  <span className="font-mono text-slate-700">
                    {customer.phone || "—"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">
                    Email Address
                  </span>
                  <span className="text-slate-700 truncate block">
                    {customer.email || "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-2xs space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                    <FileTextIcon size={14} className="text-teal-700" />
                    Recent Transactions &amp; Activity
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                    {statementData?.statement?.length ?? 0} Total Records
                  </span>
                </div>

                {isLoading ? (
                  <div className="py-6 text-center text-slate-400 text-xs animate-pulse">
                    Loading ledger preview...
                  </div>
                ) : recentStatements.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs italic">
                    No transactions recorded on this account yet.
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-2">
                    {recentStatements.map((tx: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50/70 border border-slate-100 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                              tx.type === "INVOICE"
                                ? "bg-amber-100 text-amber-900"
                                : tx.type === "PAYMENT"
                                  ? "bg-emerald-100 text-emerald-900"
                                  : "bg-sky-100 text-sky-900"
                            }`}
                          >
                            {tx.type}
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {tx.ref || tx.reference}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                            {tx.date}
                          </span>
                        </div>
                        <div className="font-mono text-right">
                          <span
                            className={`font-bold ${
                              tx.debit > 0
                                ? "text-slate-900"
                                : "text-emerald-700"
                            }`}
                          >
                            {tx.debit > 0
                              ? `+AED ${formatNumber(tx.debit)}`
                              : `-AED ${formatNumber(tx.credit)}`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Real-time ledger activity &amp; payments history.
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPrint}
                  icon={<PrintIcon size={12} className="text-emerald-700" />}
                  className="text-xs font-bold text-teal-800 hover:text-teal-900 cursor-pointer p-0 h-auto flex items-center gap-1"
                >
                  Print Full Statement →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
