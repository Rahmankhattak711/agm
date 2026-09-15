"use client";

import React, { Fragment } from "react";
import {
  ChevronDownIcon,
  CloseIcon,
  PrintIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import {
  Button,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui";
import {
  PurchaseReturnItem,
  STATUS_BADGE_CLASSES,
  formatAed,
  formatNumber,
} from "./types";

interface PurchaseReturnsTableProps {
  filteredReturns: PurchaseReturnItem[];
  expandedReturnId: string | null;
  onToggleExpand: (id: string) => void;
  onPrintReturn: (item: PurchaseReturnItem) => void;
}

const PurchaseReturnsTable: React.FC<PurchaseReturnsTableProps> = ({
  filteredReturns,
  expandedReturnId,
  onToggleExpand,
  onPrintReturn,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
      <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between print:bg-none print:!bg-slate-100 print:!text-slate-900">
        <h4 className="font-black text-xs uppercase tracking-wider text-white print:!text-slate-900">
          Vendor Return Vouchers &amp; Debit Notes Register
        </h4>
        <span className="text-[11px] font-mono text-emerald-300 font-bold print:!text-slate-700">
          {filteredReturns.length} Vouchers
        </span>
      </div>

      <Table className="w-full text-xs text-left">
        <TableHead className="bg-slate-50 border-b border-slate-200">
          <TableRow>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
              Return No &amp; PO
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
              Supplier / Vendor
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
              Return Reason
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
              Return Date
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
              Status
            </TableHeaderCell>
            <TableHeaderCell
              align="right"
              className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-[10.5px] tracking-wider"
            >
              Amount (AED)
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider print:hidden">
              Actions
            </TableHeaderCell>
          </TableRow>
        </TableHead>

        <TableBody className="divide-y divide-slate-100 font-medium">
          {filteredReturns.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-12 text-center text-slate-400 italic"
              >
                No purchase returns found. Click &quot;Log Purchase Return&quot;
                to register a vendor material rejection.
              </TableCell>
            </TableRow>
          ) : (
            filteredReturns.map((item) => {
              const isExpanded = expandedReturnId === item.id;
              return (
                <Fragment key={item.id}>
                  <TableRow
                    onClick={() => onToggleExpand(item.id)}
                    className={`hover:bg-emerald-50/40 cursor-pointer transition-colors ${
                      isExpanded
                        ? "bg-emerald-50/50 font-semibold"
                        : "text-slate-700"
                    }`}
                  >
                    <TableCell className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <ChevronDownIcon
                          size={15}
                          className={`shrink-0 transition-transform duration-200 ${
                            isExpanded
                              ? "rotate-180 text-emerald-800"
                              : "text-slate-400"
                          }`}
                        />
                        <RotateCcwIcon
                          size={13}
                          className="text-amber-600 shrink-0"
                        />
                        <span className="hover:text-emerald-800 transition-colors">
                          {item.returnNumber}
                        </span>
                      </div>
                      <p className="text-[10px] text-teal-800 font-mono font-semibold mt-0.5 ml-6">
                        Ref: {item.poReference}
                      </p>
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      <p className="font-bold text-slate-900">
                        {item.supplierName}
                      </p>
                      {item.supplierTrn && (
                        <p className="text-[10px] text-slate-400 font-mono">
                          TRN: {item.supplierTrn}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="py-3 px-4 text-slate-600 text-xs max-w-xs truncate">
                      {item.reason}
                    </TableCell>

                    <TableCell className="py-3 px-3 font-mono text-slate-700 text-xs">
                      {new Date(item.returnDate).toLocaleDateString("en-GB")}
                    </TableCell>

                    <TableCell className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE_CLASSES[item.status]}`}
                      >
                        {item.status}
                      </span>
                    </TableCell>

                    <TableCell
                      align="right"
                      className="py-3 px-4 text-right font-mono font-black text-rose-700 text-xs"
                    >
                      {formatAed(item.totalAmount)}
                    </TableCell>

                    <TableCell className="py-3 px-3 text-center print:hidden">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPrintReturn(item);
                          }}
                          icon={
                            <PrintIcon size={13} className="text-emerald-700" />
                          }
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 transition cursor-pointer"
                          title="Print Debit Note (PDF)"
                        >
                          Print
                        </Button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand(item.id);
                          }}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            isExpanded
                              ? "text-emerald-800 bg-emerald-100"
                              : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          }`}
                          title={
                            isExpanded ? "Collapse preview" : "Expand preview"
                          }
                        >
                          <ChevronDownIcon
                            size={14}
                            className={`transition-transform duration-200 ${
                              isExpanded ? "rotate-180 text-emerald-800" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="hover:bg-transparent bg-slate-50/70">
                      <TableCell
                        colSpan={7}
                        className="p-0 border-b-2 border-emerald-600/40"
                      >
                        <div className="px-6 py-5 space-y-4 border-l-4 border-l-emerald-600 bg-gradient-to-b from-white via-slate-50/40 to-slate-100/40 shadow-inner">
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="px-2.5 py-1 rounded-lg bg-teal-900 text-teal-200 font-mono font-bold text-xs shadow-2xs">
                                {item.returnNumber}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {item.supplierName}
                              </span>
                              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                                PO #{item.poReference}
                              </span>
                              {item.supplierTrn && (
                                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                  <ShieldCheckIcon
                                    size={12}
                                    className="text-emerald-700"
                                  />
                                  TRN: {item.supplierTrn}
                                </span>
                              )}
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE_CLASSES[item.status]}`}
                              >
                                {item.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onPrintReturn(item)}
                                icon={
                                  <PrintIcon
                                    size={13}
                                    className="text-emerald-700"
                                  />
                                }
                                className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
                              >
                                Print Debit Note (PDF)
                              </Button>
                              <button
                                type="button"
                                onClick={() => onToggleExpand(item.id)}
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
                                Total Debit Amount
                              </span>
                              <span className="text-base font-black font-mono text-rose-800 block">
                                {formatAed(item.totalAmount)}
                              </span>
                              <span className="text-[10px] text-rose-600/90 font-medium block">
                                Payable liability deduction
                              </span>
                            </div>

                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-2xs">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                Net Scope (Excl. VAT)
                              </span>
                              <span className="text-base font-black font-mono text-slate-900 block">
                                AED {formatNumber(item.totalAmount / 1.05)}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                Cost reduction reversal
                              </span>
                            </div>

                            <div className="p-3 bg-purple-50/80 border border-purple-200/80 rounded-xl space-y-0.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                                Input VAT Reversal (5%)
                              </span>
                              <span className="text-base font-black font-mono text-purple-800 block">
                                AED{" "}
                                {formatNumber(
                                  item.totalAmount - item.totalAmount / 1.05,
                                )}
                              </span>
                              <span className="text-[10px] text-purple-600 block">
                                FTA Input tax reduction
                              </span>
                            </div>

                            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-2xs">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                Return Date
                              </span>
                              <span className="text-xs font-bold text-slate-900 block font-mono">
                                {new Date(item.returnDate).toLocaleDateString(
                                  "en-GB",
                                )}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                PO #{item.poReference}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-2xs space-y-2.5">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="font-bold text-xs uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                                  <RotateCcwIcon
                                    size={14}
                                    className="text-teal-700"
                                  />
                                  Supplier &amp; PO Link Details
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                                  Debit Record
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                                <div>
                                  <span className="text-[10px] font-semibold text-slate-400 block">
                                    Vendor / Supplier
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {item.supplierName}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[10px] font-semibold text-slate-400 block">
                                    UAE VAT TRN
                                  </span>
                                  <span className="font-mono font-bold text-emerald-800">
                                    {item.supplierTrn || "Not Registered"}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[10px] font-semibold text-slate-400 block">
                                    Purchase Order Ref
                                  </span>
                                  <span className="font-mono text-slate-700 font-bold">
                                    #{item.poReference}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[10px] font-semibold text-slate-400 block">
                                    Return Execution Date
                                  </span>
                                  <span className="font-mono text-slate-700">
                                    {new Date(
                                      item.returnDate,
                                    ).toLocaleDateString("en-GB")}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-2xs space-y-2.5 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                  <span className="font-bold text-xs uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                                    <ShieldCheckIcon
                                      size={14}
                                      className="text-teal-700"
                                    />
                                    Material Rejection Justification
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                                    QA Certified
                                  </span>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 mt-2">
                                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                                    Documented Cause:
                                  </span>
                                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                                    {item.reason}
                                  </p>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10.5px] text-slate-500 font-mono">
                                  GL Impact: Dr. 2000 AP • Cr. 5000 Purchases •
                                  Cr. 2220 Input VAT
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onPrintReturn(item)}
                                  icon={
                                    <PrintIcon
                                      size={12}
                                      className="text-emerald-700"
                                    />
                                  }
                                  className="text-xs font-bold text-teal-800 hover:text-teal-900 cursor-pointer p-0 h-auto flex items-center gap-1"
                                >
                                  Print Debit Note →
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PurchaseReturnsTable;
