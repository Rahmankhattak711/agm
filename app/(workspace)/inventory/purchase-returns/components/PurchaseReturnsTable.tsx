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
  isLoading?: boolean;
}

const PurchaseReturnsTable: React.FC<PurchaseReturnsTableProps> = ({
  filteredReturns,
  expandedReturnId,
  onToggleExpand,
  onPrintReturn,
  isLoading = false,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
      <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between print:bg-none print:!bg-slate-100 print:!text-slate-900">
        <h4 className="font-black text-xs uppercase tracking-wider text-white print:!text-slate-900">
          Vendor Return Vouchers &amp; Debit Notes Register
        </h4>
        <span className="text-[11px] font-mono text-emerald-300 font-bold print:!text-slate-700">
          {filteredReturns.length} Active Records
        </span>
      </div>

      <Table className="w-full text-xs text-left">
        <TableHead className="bg-slate-50 border-b border-slate-200">
          <TableRow>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
              Debit Note &amp; Ref
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
              Supplier / Vendor
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
              Project / Scope
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
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-12 text-center text-slate-400 italic"
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                  <span>Loading purchase returns from database...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : filteredReturns.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-12 text-center text-slate-400 italic"
              >
                No purchase returns found in database. Click &ldquo;Log Purchase
                Return&rdquo; to register a vendor material rejection.
              </TableCell>
            </TableRow>
          ) : (
            filteredReturns.map((item) => {
              const isExpanded = expandedReturnId === item.id;
              const projectDisplay = item.projectName
                ? `${item.projectCode ? `${item.projectCode} — ` : ""}${item.projectName}`
                : "General / Warehouse Stock";
              const total = Number(item.totalAmount || 0);
              const subtotal = Number(item.subtotal || total / 1.05);
              const vat = Number(item.vatAmount || total - subtotal);

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
                        Ref: {item.poReference || "Direct Debit"}
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

                    <TableCell className="py-3 px-4">
                      <p className="font-semibold text-slate-800">
                        {projectDisplay}
                      </p>
                      {item.clientName && (
                        <p className="text-[10px] text-slate-500">
                          Client: {item.clientName}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="py-3 px-4 text-slate-600 text-xs max-w-xs truncate">
                      {item.reason}
                    </TableCell>

                    <TableCell className="py-3 px-3 font-mono text-slate-700 text-xs">
                      {item.returnDate
                        ? new Date(item.returnDate).toLocaleDateString("en-GB")
                        : "—"}
                    </TableCell>

                    <TableCell className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE_CLASSES[item.status] || STATUS_BADGE_CLASSES.DRAFT}`}
                      >
                        {item.status}
                      </span>
                    </TableCell>

                    <TableCell
                      align="right"
                      className="py-3 px-4 text-right font-mono font-black text-rose-700 text-xs"
                    >
                      {formatAed(total)}
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
                        colSpan={8}
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
                              {item.poReference && (
                                <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                                  Ref #{item.poReference}
                                </span>
                              )}
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
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE_CLASSES[item.status] || STATUS_BADGE_CLASSES.DRAFT}`}
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
                                title="Close preview"
                              >
                                <CloseIcon size={15} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3 bg-rose-50/90 border border-rose-200/80 rounded-xl space-y-0.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                                Total Debit Amount
                              </span>
                              <span className="text-base font-black font-mono text-rose-800 block">
                                {formatAed(total)}
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
                                AED {formatNumber(subtotal)}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                Material cost reduction
                              </span>
                            </div>

                            <div className="p-3 bg-purple-50/80 border border-purple-200/80 rounded-xl space-y-0.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                                Input VAT Reversal (5%)
                              </span>
                              <span className="text-base font-black font-mono text-purple-800 block">
                                AED {formatNumber(vat)}
                              </span>
                              <span className="text-[10px] text-purple-600/90 block">
                                UAE FTA standard rate deduction
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-white rounded-xl border border-slate-200/90 space-y-2.5 shadow-2xs">
                              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-slate-900 font-bold text-[11px] uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                                Vendor &amp; Project Assignment
                              </div>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-start justify-between">
                                  <span className="text-slate-500 font-medium">
                                    Supplier:
                                  </span>
                                  <span className="font-bold text-slate-900 text-right">
                                    {item.supplierName}
                                  </span>
                                </div>
                                <div className="flex items-start justify-between">
                                  <span className="text-slate-500 font-medium">
                                    Associated Project:
                                  </span>
                                  <span className="font-bold text-emerald-800 text-right">
                                    {projectDisplay}
                                  </span>
                                </div>
                                {item.clientName && (
                                  <div className="flex items-start justify-between">
                                    <span className="text-slate-500 font-medium">
                                      Project Client:
                                    </span>
                                    <span className="font-medium text-slate-700 text-right">
                                      {item.clientName}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-start justify-between">
                                  <span className="text-slate-500 font-medium">
                                    Ref / PO Number:
                                  </span>
                                  <span className="font-mono text-slate-800 font-semibold text-right">
                                    {item.poReference || "Direct Return"}
                                  </span>
                                </div>
                                <div className="flex items-start justify-between">
                                  <span className="text-slate-500 font-medium">
                                    Return Date:
                                  </span>
                                  <span className="font-mono text-slate-700 text-right">
                                    {item.returnDate
                                      ? new Date(
                                          item.returnDate,
                                        ).toLocaleDateString("en-GB")
                                      : "—"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 bg-white rounded-xl border border-slate-200/90 space-y-2.5 shadow-2xs">
                              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-slate-900 font-bold text-[11px] uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                Accounting &amp; Ledger Audit
                              </div>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-start justify-between">
                                  <span className="text-slate-500 font-medium">
                                    Type:
                                  </span>
                                  <span className="font-bold text-slate-800 text-right">
                                    Purchase Debit Note
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500 font-medium block">
                                    Double-Entry Impact:
                                  </span>
                                  <span className="font-mono text-[11px] text-slate-700 block mt-0.5">
                                    Dr. Accounts Payable (2000) • Cr. Direct
                                    Cost (5010) • Cr. VAT Input (2200)
                                  </span>
                                </div>
                                <div className="flex items-start justify-between">
                                  <span className="text-slate-500 font-medium">
                                    Posting Status:
                                  </span>
                                  <span className="font-bold text-emerald-800 text-right">
                                    {item.status === "POSTED"
                                      ? "Automated GL Liability Reduction"
                                      : "Draft / Unposted"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/90 space-y-1">
                            <span className="text-[10.5px] font-bold uppercase tracking-wider text-amber-900 block">
                              Material Rejection Reason / Quality Note
                            </span>
                            <p className="text-xs font-medium text-slate-800 pl-3 border-l-2 border-amber-400 mt-1">
                              &ldquo;
                              {item.reason || "Material return / defect note"}
                              &rdquo;
                            </p>
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
