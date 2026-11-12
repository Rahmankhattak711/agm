"use client";

import React, { useMemo } from "react";
import {
  BuildingIcon,
  CreditCardIcon,
  EditIcon,
  FileTextIcon,
  PrintIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import {
  Button,
  Badge,
  Card,
  CustomRowExpand,
  ExpandedRowSection,
} from "@/components/ui";
import { Customer, useCustomerStatement } from "@/lib/hooks/api-hooks";
import { formatNumber } from "@/lib/utils/format";

export interface CustomerExpandedRowProps {
  customer: Customer;
  onPrint: () => void;
  onEdit?: () => void;
  onClose: () => void;
}

export function CustomerExpandedRow({
  customer,
  onPrint,
  onEdit,
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
    <CustomRowExpand
      colSpan={7}
      onClose={onClose}
      headerLeft={
        <>
          <span
            className="px-2.5 py-1 rounded-lg font-mono font-bold text-xs shadow-2xs"
            style={{
              backgroundColor: "#eff6ff",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
            }}
          >
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
          <Badge tone={outstanding > 0 ? "rose" : "emerald"}>
            {outstanding > 0
              ? `Outstanding: AED ${formatNumber(outstanding)}`
              : "Account Settled"}
          </Badge>
        </>
      }
      headerRight={
        <>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              icon={
                <EditIcon size={14} className="w-3.5 h-3.5 text-blue-700" />
              }
              className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              Edit Profile
            </Button>
          )}
          <a
            href={`/finance/reports?tab=statement-of-account&customerId=${customer.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 shadow-2xs transition-colors"
          >
            <FileTextIcon size={14} className="w-3.5 h-3.5 text-emerald-700" />
            <span>Full SOA Report</span>
          </a>
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            icon={
              <PrintIcon size={14} className="w-3.5 h-3.5 text-emerald-700" />
            }
            className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            Print Statement (PDF)
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card
          id="outstanding-balance"
          value={`AED ${formatNumber(outstanding)}`}
          title="Outstanding Balance"
          subtitle={
            outstanding > 0
              ? "Pending collection / settlement"
              : "Zero balance due"
          }
          accentColor="rose"
        />

        <Card
          id="credit-limit"
          value={`AED ${formatNumber(creditLimit)}`}
          title="Credit Limit"
          subtitle={`Available: AED ${formatNumber(availableCredit)}`}
          icon={<CreditCardIcon size={16} />}
          accentColor="blue"
        />

        <Card
          id="total-paid"
          value={`AED ${formatNumber(summary?.totalPaid ?? 0)}`}
          loading={isLoading}
          title="Total Settled / Paid"
          subtitle={`Billed: AED ${formatNumber(summary?.totalBilled ?? 0)}`}
          icon={<ShieldCheckIcon size={16} />}
          accentColor="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <ExpandedRowSection
          title="Client Profile & Billing Data"
          icon={<BuildingIcon size={14} />}
          badge="Verified Account"
        >
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block">
                Full Legal Name
              </span>
              <span className="font-bold text-slate-800">{customer.name}</span>
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
              <span className="font-mono font-medium text-slate-800 truncate block">
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
                Tax Registration (TRN)
              </span>
              <span className="font-mono font-medium text-slate-800 truncate block">
                {customer.trn || "—"}
              </span>
            </div>
          </div>
        </ExpandedRowSection>

        <ExpandedRowSection
          title="Recent Transactions & Activity"
          icon={<FileTextIcon size={14} />}
          badge={`${statementData?.statement?.length ?? 0} Total Records`}
          className="flex flex-col justify-between"
        >
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
                        tx.debit > 0 ? "text-slate-900" : "text-emerald-700"
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
        </ExpandedRowSection>
      </div>
    </CustomRowExpand>
  );
}
