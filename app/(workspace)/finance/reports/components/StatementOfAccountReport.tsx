"use client";

import React, { useState, useEffect } from "react";
import { useCustomers, useStatementOfAccount } from "@/lib/hooks/api-hooks";
import { StatementOfAccountDocument } from "@/components/documents";
import { PrintIcon, RefreshIcon, ReceiptIcon } from "@/components/icons";
import { Button, DatePicker, Select, PageHeader } from "@/components/ui";
import { useSearchParams } from "next/navigation";

function formatAmount(val: number | string | undefined): string {
  const num = Number(val || 0);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface StatementOfAccountReportProps {
  initialCustomerId?: string | null;
}

export const StatementOfAccountReport: React.FC<
  StatementOfAccountReportProps
> = ({ initialCustomerId }) => {
  const searchParams = useSearchParams();

  const currentYear = new Date().getFullYear();
  const defaultFromDate = `${currentYear}-01-01`;
  const defaultToDate = new Date().toISOString().slice(0, 10);

  const customerIdParam =
    searchParams.get("customerId") || initialCustomerId || "";
  const fromDateParam = searchParams.get("fromDate") || defaultFromDate;
  const toDateParam = searchParams.get("toDate") || defaultToDate;

  const [selectedCustomerId, setSelectedCustomerId] =
    useState<string>(customerIdParam);
  const [fromDate, setFromDate] = useState<string>(fromDateParam);
  const [toDate, setToDate] = useState<string>(toDateParam);

  const { data: customers = [] } = useCustomers();

  useEffect(() => {
    if (customerIdParam) {
      setSelectedCustomerId(customerIdParam);
    }
  }, [customerIdParam]);

  const {
    data: soaData,
    isLoading: soaLoading,
    isFetching: soaFetching,
    refetch,
  } = useStatementOfAccount({
    customerId: selectedCustomerId || null,
    fromDate,
    toDate,
    transactionType: "ALL",
    status: "ALL",
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs print:hidden space-y-4">
        <PageHeader
          title="Customer Statement of Account (SOA)"
          description="Official client account ledger reconciling opening balances, tax invoices, receipts, credit notes, and outstanding receivables."
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => refetch()}
                icon={
                  <RefreshIcon
                    size={13}
                    className={soaFetching ? "animate-spin" : ""}
                  />
                }
                className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200 px-3.5 py-2"
              >
                <span>Refresh</span>
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handlePrint}
                disabled={!soaData}
                icon={<PrintIcon size={14} />}
                className="text-xs font-bold bg-agm-green text-white hover:bg-agm-green/90 shadow-xs px-4 py-2"
              >
                <span>Print SOA</span>
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <span>Customer / Client Entity</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full text-xs font-semibold bg-white border-slate-200 shadow-2xs pl-2.5 h-9"
              >
                <option value="">
                  -- Select Customer to View Statement --
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerCode} — {c.name}{" "}
                    {c.companyName ? `(${c.companyName})` : ""}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              From Date
            </label>
            <DatePicker
              value={fromDate}
              onChange={(val) => setFromDate(val)}
              placeholder="Select start date"
              className="w-full text-xs font-semibold bg-white border-slate-200 shadow-2xs h-9 rounded-xl"
            />
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              To Date
            </label>
            <DatePicker
              value={toDate}
              onChange={(val) => setToDate(val)}
              placeholder="Select end date"
              className="w-full text-xs font-semibold bg-white border-slate-200 shadow-2xs h-9 rounded-xl"
            />
          </div>
        </div>
      </div>

      {soaLoading && (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="inline-block animate-spin w-8 h-8 border-3 border-agm-green border-t-transparent rounded-full mb-3"></div>
          <p className="text-xs font-bold text-slate-600">
            Generating Statement of Account & Reconciling General Ledger...
          </p>
        </div>
      )}

      {!soaLoading && !soaData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
          <div className="max-w-xl mx-auto text-center space-y-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-agm-green border border-emerald-200/80 flex items-center justify-center mx-auto shadow-2xs">
              <ReceiptIcon size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Select a Customer to Generate Statement
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Choose an active customer from the list below or select from the
              dropdown above to load their complete ledger and receivables
              statement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {customers.map((c) => (
              <Button
                key={c.id}
                type="button"
                variant="outline"
                onClick={() => setSelectedCustomerId(c.id)}
                className="w-full text-left p-4 rounded-xl border-slate-200 hover:border-agm-green hover:bg-slate-50/70 transition-all group flex flex-col items-stretch justify-between cursor-pointer bg-white shadow-2xs h-auto block font-normal"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10.5px] font-bold text-slate-500">
                      {c.customerCode}
                    </span>
                    <span className="text-[10px] text-agm-green font-bold group-hover:underline">
                      View SOA →
                    </span>
                  </div>
                  <div className="font-bold text-sm text-slate-900 group-hover:text-agm-green transition-colors">
                    {c.name}
                  </div>
                  {c.companyName && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      {c.companyName}
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-normal">
                  <span className="text-slate-400 font-medium">Balance:</span>
                  <span className="font-mono font-bold text-slate-800">
                    AED {formatAmount(c.currentBalance || 0)}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {!soaLoading && soaData && (
        <div className="space-y-6">
          <StatementOfAccountDocument data={soaData} />
        </div>
      )}
    </div>
  );
};

export default StatementOfAccountReport;
