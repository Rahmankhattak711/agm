"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useVatReturn } from "@/lib/hooks/finance-hooks";
import {
  PrintIcon,
  ChevronLeftIcon,
  RefreshIcon,
  SparklesIcon,
  CheckIcon,
  PlusIcon,
  ArrowRightIcon,
  CloseIcon,
  ArrowUpRightIcon,
} from "@/components/icons";
import { useReactToPrint } from "react-to-print";
import type { VatBoxRow, VatBoxTransaction } from "@/lib/modules/accounting";

export default function VatReturnFta201Page() {
  const router = useRouter();

  // Timeline Range: By default Jan 2026 -> Oct 2026 (matching Wafeq screenshot exactly)
  const [startMonthIdx, setStartMonthIdx] = useState(0); // 0 = Jan 2026
  const [endMonthIdx, setEndMonthIdx] = useState(9); // 9 = Oct 2026

  const allMonths2026 = [
    { name: "Jan", full: "2026-01-01", end: "2026-01-31" },
    { name: "Feb", full: "2026-02-01", end: "2026-02-28" },
    { name: "Mar", full: "2026-03-01", end: "2026-03-31" },
    { name: "Apr", full: "2026-04-01", end: "2026-04-30" },
    { name: "May", full: "2026-05-01", end: "2026-05-31" },
    { name: "Jun", full: "2026-06-01", end: "2026-06-30" },
    { name: "Jul", full: "2026-07-01", end: "2026-07-31" },
    { name: "Aug", full: "2026-08-01", end: "2026-08-31" },
    { name: "Sep", full: "2026-09-01", end: "2026-09-30" },
    { name: "Oct", full: "2026-10-01", end: "2026-10-31" },
    { name: "Nov", full: "2026-11-01", end: "2026-11-30" },
    { name: "Dec", full: "2026-12-01", end: "2026-12-31" },
  ];

  const months2025 = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const startDate = allMonths2026[startMonthIdx].full;
  const endDate = allMonths2026[endMonthIdx].end;

  const { data, isLoading, refetch, isFetching } = useVatReturn({
    startDate,
    endDate,
    year: 2026,
  });

  // Selected Box for Drawer Drill-down & Edit/Create actions
  const [selectedBox, setSelectedBox] = useState<VatBoxRow | null>(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `UAE-FTA-VAT-201-Return-2026`,
  });

  // Formatting helpers matching Wafeq: purple dashes for zero, purple bold for amounts
  const renderAmount = (val?: number, isBold = false) => {
    if (val === undefined || val === null || val === 0) {
      return <span className="text-[#5e48e8] font-medium select-none">—</span>;
    }
    return (
      <span className={`text-[#5e48e8] font-mono ${isBold ? "font-bold text-[13px]" : "font-medium"}`}>
        {val.toFixed(2)}
      </span>
    );
  };

  const renderAdjustment = (val?: number) => {
    return <span className="text-slate-500 font-mono text-xs">{(val || 0).toFixed(2)}</span>;
  };

  return (
    <div className="bg-[#fcfcfd] min-h-screen text-slate-900 pb-16">
      {/* Top Breadcrumb & Actions Bar matching Wafeq Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-30 px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <button
            onClick={() => router.push("/finance/reports")}
            className="hover:text-[#5e48e8] transition-colors"
          >
            Reports
          </button>
          <span>&gt;</span>
          <span className="text-slate-900 font-semibold">VAT</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh Data"
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowChecklistModal(true)}
            className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
            VAT Checklist
          </button>

          <button
            onClick={() => handlePrint()}
            className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PrintIcon className="w-3.5 h-3.5" />
            Export
          </button>

          <button className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#5e48e8] text-white hover:bg-[#503cd1] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
            <SparklesIcon className="w-3.5 h-3.5" />
            Ask AI
          </button>
        </div>
      </div>

      <div className="max-w-[1350px] mx-auto px-8 py-6 space-y-6">
        {/* Timeline Range Selector Strip matching Wafeq Screenshot */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <span className="text-slate-400">📅 Date</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-900 border border-slate-200">
                {allMonths2026[startMonthIdx].name} 2026 → {allMonths2026[endMonthIdx].name} 2026
              </span>
            </div>

            <div className="text-[11px] text-slate-400 font-medium">
              Click any month to adjust reporting period
            </div>
          </div>

          {/* Interactive Timeline Bar */}
          <div className="relative border border-slate-200 rounded-lg bg-slate-50/70 p-2 flex items-center overflow-x-auto text-[11px]">
            {/* 2025 Segment */}
            <div className="flex items-center pr-4 border-r border-slate-200/80 mr-2 text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-2">2025</span>
              <div className="flex items-center gap-1">
                {months2025.map((m) => (
                  <span key={m} className="px-2 py-1 text-slate-400 cursor-not-allowed">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* 2026 Segment with Purple Range Slider Box */}
            <div className="flex items-center relative pl-1">
              <span className="text-[10px] font-bold text-[#5e48e8] mr-2">2026</span>
              <div className="flex items-center gap-0.5 relative">
                {/* Purple Active Slider Box */}
                <div
                  className="absolute top-0 bottom-0 bg-[#5e48e8]/10 border-2 border-[#5e48e8] rounded-lg pointer-events-none transition-all duration-200"
                  style={{
                    left: `${startMonthIdx * 42}px`,
                    width: `${(endMonthIdx - startMonthIdx + 1) * 42}px`,
                  }}
                >
                  {/* Left Pill Handle */}
                  <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-4 rounded bg-[#5e48e8]" />
                  {/* Right Pill Handle */}
                  <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-4 rounded bg-[#5e48e8]" />
                </div>

                {allMonths2026.map((m, idx) => {
                  const isSelected = idx >= startMonthIdx && idx <= endMonthIdx;
                  return (
                    <button
                      key={m.name}
                      onClick={() => {
                        if (idx < startMonthIdx) {
                          setStartMonthIdx(idx);
                        } else if (idx > endMonthIdx) {
                          setEndMonthIdx(idx);
                        } else {
                          // Toggle single or bounds
                          setEndMonthIdx(idx);
                        }
                      }}
                      className={`w-[42px] py-1 text-center font-medium rounded transition-colors cursor-pointer ${
                        isSelected
                          ? "text-[#5e48e8] font-bold"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* VAT Return Form Card */}
        <div
          ref={printRef}
          className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden print:border-none print:shadow-none"
        >
          {/* Printable Header */}
          <div className="hidden print:block p-8 border-b border-slate-200 text-center">
            <h1 className="text-xl font-bold">AGM FITOUT TECHNICAL SERVICES LLC</h1>
            <p className="text-xs text-slate-500">TRN: 104094432200003 | Official UAE FTA VAT 201 Return</p>
            <p className="text-xs font-mono mt-1">
              Period: {startDate} to {endDate}
            </p>
          </div>

          {isLoading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#5e48e8] border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Calculating statutory VAT Return boxes...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-900 bg-slate-50/60 font-semibold">
                    <th className="py-2.5 px-6 w-16">Box #</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-6 text-right w-44">Taxable amount</th>
                    <th className="py-2.5 px-6 text-right w-44">Tax amount</th>
                    <th className="py-2.5 px-6 text-right w-36">Adjustments</th>
                  </tr>
                </thead>

                <tbody>
                  {/* SECTION 1: VAT on Sales and all other Outputs */}
                  <tr className="bg-slate-50/30">
                    <td colSpan={5} className="py-3 px-6 font-bold text-slate-900 text-[13px]">
                      VAT on Sales and all other Outputs
                    </td>
                  </tr>

                  {data?.outputVat.boxes.map((box) => {
                    const isTotal = box.boxNumber === "8";
                    return (
                      <tr
                        key={box.boxNumber}
                        onClick={() => setSelectedBox(box)}
                        className={`group transition-colors cursor-pointer ${
                          isTotal
                            ? "font-bold text-slate-900 bg-white"
                            : "hover:bg-[#f8f8fc] text-slate-700"
                        }`}
                      >
                        <td className="py-2.5 px-6 font-mono text-slate-400 group-hover:text-[#5e48e8] transition-colors">
                          {box.boxNumber}
                        </td>
                        <td className="py-2.5 px-4 font-medium flex items-center justify-between">
                          <span>{box.label}</span>
                          {box.transactions && box.transactions.length > 0 && (
                            <span className="text-[10px] text-[#5e48e8] bg-[#5e48e8]/10 px-2 py-0.5 rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                              {box.transactions.length} Invoices ➔
                            </span>
                          )}
                        </td>
                        <td
                          className={`py-2.5 px-6 text-right ${
                            isTotal ? "border-t-2 border-slate-900" : ""
                          }`}
                        >
                          {renderAmount(box.taxableAmount, isTotal)}
                        </td>
                        <td
                          className={`py-2.5 px-6 text-right ${
                            isTotal ? "border-t-2 border-slate-900" : ""
                          }`}
                        >
                          {renderAmount(box.taxAmount, isTotal)}
                        </td>
                        <td className="py-2.5 px-6 text-right">
                          {renderAdjustment(box.adjustments)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Spacer */}
                  <tr>
                    <td colSpan={5} className="h-6" />
                  </tr>

                  {/* SECTION 2: VAT on Expenses and all other Inputs */}
                  <tr className="bg-slate-50/30">
                    <td colSpan={5} className="py-3 px-6 font-bold text-slate-900 text-[13px]">
                      VAT on Expenses and all other Inputs
                    </td>
                  </tr>

                  {data?.inputVat.boxes.map((box) => {
                    const isTotal = box.boxNumber === "11";
                    return (
                      <tr
                        key={box.boxNumber}
                        onClick={() => setSelectedBox(box)}
                        className={`group transition-colors cursor-pointer ${
                          isTotal
                            ? "font-bold text-slate-900 bg-white"
                            : "hover:bg-[#f8f8fc] text-slate-700"
                        }`}
                      >
                        <td className="py-2.5 px-6 font-mono text-slate-400 group-hover:text-[#5e48e8] transition-colors">
                          {box.boxNumber}
                        </td>
                        <td className="py-2.5 px-4 font-medium flex items-center justify-between">
                          <span>{box.label}</span>
                          {box.transactions && box.transactions.length > 0 && (
                            <span className="text-[10px] text-[#5e48e8] bg-[#5e48e8]/10 px-2 py-0.5 rounded-full font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                              {box.transactions.length} Records ➔
                            </span>
                          )}
                        </td>
                        <td
                          className={`py-2.5 px-6 text-right ${
                            isTotal ? "border-t-2 border-slate-900" : ""
                          }`}
                        >
                          {renderAmount(box.taxableAmount, isTotal)}
                        </td>
                        <td
                          className={`py-2.5 px-6 text-right ${
                            isTotal ? "border-t-2 border-slate-900" : ""
                          }`}
                        >
                          {renderAmount(box.taxAmount, isTotal)}
                        </td>
                        <td className="py-2.5 px-6 text-right">
                          {renderAdjustment(box.adjustments)}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Spacer */}
                  <tr>
                    <td colSpan={5} className="h-6" />
                  </tr>

                  {/* SECTION 3: Net VAT due */}
                  <tr className="bg-slate-50/30">
                    <td colSpan={5} className="py-3 px-6 font-bold text-slate-900 text-[13px]">
                      Net VAT due
                    </td>
                  </tr>

                  {/* Box 12 */}
                  <tr className="hover:bg-[#f8f8fc] transition-colors">
                    <td className="py-2.5 px-6 font-mono text-slate-400">12</td>
                    <td className="py-2.5 px-4 font-medium">Total value of due tax for the period</td>
                    <td className="py-2.5 px-6 text-right">{renderAmount(0)}</td>
                    <td className="py-2.5 px-6 text-right">
                      {renderAmount(data?.netVat.box12DueTax, true)}
                    </td>
                    <td className="py-2.5 px-6 text-right">{renderAdjustment(0)}</td>
                  </tr>

                  {/* Box 13 */}
                  <tr className="hover:bg-[#f8f8fc] transition-colors">
                    <td className="py-2.5 px-6 font-mono text-slate-400">13</td>
                    <td className="py-2.5 px-4 font-medium">Total value of recoverable tax for the period</td>
                    <td className="py-2.5 px-6 text-right font-mono font-bold text-[#5e48e8]">
                      {renderAmount(data?.inputVat.totalTaxableAmount, true)}
                    </td>
                    <td className="py-2.5 px-6 text-right font-mono font-bold text-[#5e48e8]">
                      {renderAmount(data?.netVat.box13RecoverableTax, true)}
                    </td>
                    <td className="py-2.5 px-6 text-right">{renderAdjustment(0)}</td>
                  </tr>

                  {/* Box 14 Net Result */}
                  <tr className="font-bold text-slate-900">
                    <td className="py-3 px-6 font-mono text-[#5e48e8]">14</td>
                    <td className="py-3 px-4 font-bold flex items-center gap-2">
                      <span>Net VAT payable (or reclaimable) for the period</span>
                    </td>
                    <td className="py-3 px-6 text-right border-t-2 border-slate-900 font-mono font-bold text-[#5e48e8]">
                      {(data?.netVat.box14NetVatPayable || 0) < 0
                        ? `-${Math.abs(data?.inputVat.totalTaxableAmount || 0).toFixed(2)}`
                        : (data?.outputVat.totalTaxableAmount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-6 text-right border-t-2 border-slate-900 font-mono font-bold text-[#5e48e8]">
                      {data?.netVat.box14NetVatPayable !== undefined
                        ? (data.netVat.box14NetVatPayable >= 0 ? "" : "-") +
                          Math.abs(data.netVat.box14NetVatPayable).toFixed(2)
                        : "0.00"}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {(data?.netVat.box14NetVatPayable || 0) >= 0 ? (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          PAYABLE
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          RECLAIMABLE
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom Bar matching Wafeq Screenshot */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 font-medium flex items-center gap-6">
            <span>
              Sum:{" "}
              <strong className="text-slate-900 font-mono">
                AED {data?.netVat.box14NetVatPayable.toFixed(2) || "0.00"}
              </strong>
            </span>
            <span>
              Count:{" "}
              <strong className="text-slate-900 font-mono">
                {(data?.outputVat.boxes.length || 0) + (data?.inputVat.boxes.length || 0)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Drill-Down Slide-over Drawer for Viewing, Editing, and Creating Transactions */}
      {selectedBox && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col justify-between p-6 space-y-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="space-y-3 pb-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#5e48e8] uppercase tracking-wider font-mono">
                  Box {selectedBox.boxNumber} Breakdown
                </span>
                <button
                  onClick={() => setSelectedBox(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-lg font-bold text-slate-900">{selectedBox.label}</h2>

              {/* Total Card */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono">
                <div>
                  <div className="text-[11px] text-slate-500 font-sans">Taxable Amount</div>
                  <div className="text-base font-bold text-slate-900">
                    AED {selectedBox.taxableAmount.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-sans">VAT Amount (5%)</div>
                  <div className="text-base font-bold text-[#5e48e8]">
                    AED {selectedBox.taxAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Quick Creation Actions */}
              <div className="flex items-center gap-2 pt-1">
                {selectedBox.boxNumber.startsWith("1") ? (
                  <button
                    onClick={() => router.push("/commercial/sales-invoices")}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-[#5e48e8] text-white hover:bg-[#503cd1] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    + Create New Sales Invoice
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => router.push("/commercial/supplier-bills")}
                      className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-[#5e48e8] text-white hover:bg-[#503cd1] flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      + Add Supplier Bill
                    </button>
                    <button
                      onClick={() => router.push("/finance/expenses")}
                      className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      + Record Expense
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Transactions List */}
            <div className="flex-1 space-y-3 overflow-y-auto">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Contributing Transactions ({selectedBox.transactions?.length || 0})
              </h3>

              {!selectedBox.transactions || selectedBox.transactions.length === 0 ? (
                <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 rounded-xl p-6">
                  <p className="text-xs text-slate-500 font-medium">
                    No transactions currently recorded for this box in the selected period.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Use the buttons above to create an invoice or bill; it will automatically appear here!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedBox.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl hover:border-[#5e48e8]/40 hover:shadow-xs transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {tx.number}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            {tx.type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 font-medium">{tx.contactName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{tx.date}</div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="text-xs font-bold font-mono text-slate-900">
                          AED {tx.totalAmount.toFixed(2)}
                        </div>
                        <div className="text-[11px] font-mono text-[#5e48e8] font-semibold">
                          VAT: AED {tx.vatAmount.toFixed(2)}
                        </div>
                        <button
                          onClick={() => router.push(tx.url)}
                          className="text-[11px] font-semibold text-[#5e48e8] hover:underline flex items-center gap-1 justify-end ml-auto pt-0.5 cursor-pointer"
                        >
                          View / Edit
                          <ArrowUpRightIcon className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Footer Explanation */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">💡 How VAT Data Works in this ERP:</p>
              <p>
                This return is <strong>never static</strong>. Every time you create, edit, or post a Sales Invoice, Supplier Bill, or Expense, the amounts recalculate in real time according to UAE FTA 5% rules.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VAT Checklist Modal */}
      {showChecklistModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckIcon className="w-5 h-5 text-emerald-600" />
                FTA VAT 201 Filing Checklist
              </h3>
              <button
                onClick={() => setShowChecklistModal(false)}
                className="text-slate-400 hover:text-slate-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="text-emerald-600">✓</span> Invoices Posted
                </div>
                <p className="text-slate-500 text-[11px]">
                  All commercial invoices for this quarter are in POSTED or PAID status.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="text-emerald-600">✓</span> Emirate Allocation
                </div>
                <p className="text-slate-500 text-[11px]">
                  Supplies are assigned to Dubai (AGM Fitout LLC registration) or customer/project location.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="text-emerald-600">✓</span> Input Tax Invoices
                </div>
                <p className="text-slate-500 text-[11px]">
                  Supplier bills have verified TRN numbers for valid input tax recovery under Box 9.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowChecklistModal(false)}
                className="px-4 py-2 bg-[#5e48e8] text-white text-xs font-semibold rounded-lg hover:bg-[#503cd1] transition-colors"
              >
                Close Checklist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
