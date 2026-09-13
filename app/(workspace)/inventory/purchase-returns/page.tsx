"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  PlusIcon,
  PrintIcon,
  RotateCcwIcon,
  SearchIcon,
} from "@/components/icons";
import {
  Button,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  Input,
  Select,
  Textarea,
  TableEmpty,
} from "@/components/ui";
import { useSuppliers } from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";

type ReturnStatus =
  "DRAFT" | "SUBMITTED" | "APPROVED" | "COMPLETED" | "REJECTED";

interface PurchaseReturnItem {
  id: string;
  returnNumber: string;
  poReference: string;
  supplierName: string;
  supplierTrn: string;
  returnDate: string;
  reason: string;
  itemsCount: number;
  totalAmount: number;
  status: ReturnStatus;
}

const STATUS_BADGE_CLASSES: Record<ReturnStatus, string> = {
  COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  APPROVED: "bg-sky-50 text-sky-800 border-sky-200",
  SUBMITTED: "bg-amber-50 text-amber-800 border-amber-200",
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  REJECTED: "bg-rose-50 text-rose-800 border-rose-200",
};

const STATUS_OPTIONS: ReturnStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "COMPLETED",
  "REJECTED",
];

function generateReturnNumber(count: number): string {
  return `PR-2026-${String(count + 1).padStart(3, "0")}`;
}

function formatNumber(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatAed(amount: number): string {
  return `AED ${formatNumber(amount)}`;
}

interface ReturnFormState {
  poReference: string;
  selectedSupplier: string;
  returnReason: string;
  returnAmount: string;
}

const EMPTY_FORM: ReturnFormState = {
  poReference: "",
  selectedSupplier: "",
  returnReason: "",
  returnAmount: "",
};

export default function PurchaseReturnsPage() {
  const { data: suppliers = [] } = useSuppliers();

  const [returnsList, setReturnsList] = useState<PurchaseReturnItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] =
    useState<PurchaseReturnItem | null>(null);
  const [form, setForm] = useState<ReturnFormState>(EMPTY_FORM);

  const currentReturnNumber = useMemo(
    () => generateReturnNumber(returnsList.length),
    [returnsList.length],
  );

  const filteredReturns = useMemo(() => {
    const q = search.toLowerCase();
    return returnsList.filter((item) => {
      const matchesSearch =
        item.returnNumber.toLowerCase().includes(q) ||
        item.poReference.toLowerCase().includes(q) ||
        item.supplierName.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [returnsList, search, statusFilter]);

  const totalReturnVal = useMemo(
    () => filteredReturns.reduce((s, r) => s + r.totalAmount, 0),
    [filteredReturns],
  );

  const completedCount = useMemo(
    () => returnsList.filter((r) => r.status === "COMPLETED").length,
    [returnsList],
  );

  const activeReviewCount = useMemo(
    () =>
      returnsList.filter(
        (r) => r.status === "SUBMITTED" || r.status === "APPROVED",
      ).length,
    [returnsList],
  );

  const resetForm = useCallback(() => setForm(EMPTY_FORM), []);

  const handleOpenCreate = useCallback(() => {
    resetForm();
    setIsCreateOpen(true);
  }, [resetForm]);

  const handleCloseCreate = useCallback(() => {
    setIsCreateOpen(false);
    resetForm();
  }, [resetForm]);

  const handleCreateReturn = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const sup = suppliers.find((s) => s.id === form.selectedSupplier);
      const newReturn: PurchaseReturnItem = {
        id: `pr-${Date.now()}`,
        returnNumber: currentReturnNumber,
        poReference: form.poReference,
        supplierName: sup?.name ?? "Registered Supplier",
        supplierTrn: sup?.trn ?? "104094432200003",
        returnDate: new Date().toISOString().slice(0, 10),
        reason: form.returnReason,
        itemsCount: 1,
        totalAmount: parseFloat(form.returnAmount) || 0,
        status: "SUBMITTED",
      };

      setReturnsList((prev) => [newReturn, ...prev]);
      handleCloseCreate();
    },
    [suppliers, form, currentReturnNumber, handleCloseCreate],
  );

  const setField = useCallback(
    <K extends keyof ReturnFormState>(key: K, value: ReturnFormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  return (
    <div className="space-y-6">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Purchase Returns
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage return-to-vendor records, track rejected materials, and issue debit notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Create Purchase Return
          </Button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <ReportKpiGrid cols={3}>
        <ReportKpiCard
          title="1. Total Debit Notes Value"
          subtitle="Cumulative supplier returns"
          value={formatNumber(totalReturnVal)}
          currency="AED"
          accentColor="rose"
          valueColor="text-rose-700"
        />
        <ReportKpiCard
          title="2. Total Return Vouchers"
          subtitle="All logged RTV orders"
          value={returnsList.length}
          currency={false}
          accentColor="sky"
          footerText="Records"
        />
        <ReportKpiCard
          title="3. Settled Reversals"
          subtitle="Credited by vendor"
          value={completedCount}
          currency={false}
          accentColor="emerald"
          valueColor="text-emerald-800"
          footerText="Settled"
        />
        <ReportKpiCard
          title="4. In-Review Reversals"
          subtitle="Pending supplier credit note"
          value={activeReviewCount}
          currency={false}
          accentColor="amber"
          valueColor="text-amber-700"
          footerText="Pending"
        />
      </ReportKpiGrid>

      {/* Print-Only Compact Summary Strip */}
      <div className="hidden print:grid print:grid-cols-4 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-rose-600 font-bold block">
            Total Debit Notes
          </span>
          <span className="font-mono font-bold text-rose-700">
            AED {formatNumber(totalReturnVal)}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
            Total Returns
          </span>
          <span className="font-mono font-bold text-slate-900">
            {returnsList.length}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold block">
            Settled
          </span>
          <span className="font-mono font-bold text-emerald-800">
            {completedCount}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-amber-600 font-bold block">
            In-Review
          </span>
          <span className="font-mono font-bold text-amber-700">
            {activeReviewCount}
          </span>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        {/* Search & Filter Strip */}
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Status Quick Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: "ALL", label: "All Returns" },
                { id: "DRAFT", label: "Draft" },
                { id: "SUBMITTED", label: "Submitted" },
                { id: "APPROVED", label: "Approved" },
                { id: "COMPLETED", label: "Completed" },
                { id: "REJECTED", label: "Rejected" },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            <span className="text-[11px] font-bold text-slate-500 font-mono">
              {filteredReturns.length} Vouchers Listed
            </span>
          </div>

          <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
            <Input
              leftIcon={<SearchIcon size={14} className="text-slate-400" />}
              placeholder="Search return number, PO ref, supplier, or reason..."
              containerClassName="w-full sm:w-96"
              className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Purchase Returns Table */}
        <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between print:bg-none print:!bg-slate-100 print:!text-slate-900">
            <h4 className="font-black text-xs uppercase tracking-wider text-white print:!text-slate-900">
              Purchase Returns &amp; Debit Note Register
            </h4>
            <span className="text-[11px] font-mono text-emerald-300 font-bold print:!text-slate-700">
              {filteredReturns.length} Vouchers
            </span>
          </div>

          <Table className="w-full text-xs text-left">
            <TableHead className="bg-slate-50 border-b border-slate-200">
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
            </TableHead>

            <TableBody className="divide-y divide-slate-100 font-medium">
              {filteredReturns.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-slate-400 italic"
                  >
                    No purchase returns found. Click &quot;Create Purchase
                    Return&quot; to log a vendor material rejection.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReturns.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-slate-50/60 text-slate-700 transition"
                  >
                    <TableCell className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <RotateCcwIcon
                          size={13}
                          className="text-amber-600 shrink-0"
                        />
                        <span>{item.returnNumber}</span>
                      </div>
                      <p className="text-[10px] text-teal-800 font-mono font-semibold mt-0.5">
                        Ref: {item.poReference}
                      </p>
                    </TableCell>

                    <TableCell className="py-3 px-4">
                      <p className="font-bold text-slate-900">
                        {item.supplierName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        TRN: {item.supplierTrn}
                      </p>
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
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedReturn(item)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 transition cursor-pointer"
                      >
                        Audit View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal for Creating Purchase Return */}
      <Modal
        isOpen={isCreateOpen}
        onClose={handleCloseCreate}
        title="Create Purchase Return / Debit Note"
        maxWidth="md"
      >
        <form onSubmit={handleCreateReturn} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Return Number"
              value={currentReturnNumber}
              readOnly
              disabled
              className="font-mono font-bold"
            />
            <Input
              label="PO Reference *"
              placeholder="e.g. PO-2026-0150"
              value={form.poReference}
              onChange={(e) => setField("poReference", e.target.value)}
              required
              className="font-mono font-bold"
            />
          </div>

          <Select
            label="Supplier / Vendor *"
            value={form.selectedSupplier}
            onChange={(e) => setField("selectedSupplier", e.target.value)}
            required
            className="cursor-pointer"
          >
            <option value="">Select Supplier...</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.trn ? `TRN: ${s.trn}` : "Vendor"})
              </option>
            ))}
          </Select>

          <Textarea
            label="Reason for Return *"
            rows={2}
            placeholder="Defect details, specifications mismatch, damaged lot..."
            value={form.returnReason}
            onChange={(e) => setField("returnReason", e.target.value)}
            required
          />

          <Input
            label="Return Amount (AED) *"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.returnAmount}
            onChange={(e) => setField("returnAmount", e.target.value)}
            required
            className="font-mono font-bold"
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              type="button"
              onClick={handleCloseCreate}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
            >
              Submit Purchase Return
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Return / Debit Note Modal */}
      <Modal
        isOpen={!!selectedReturn}
        onClose={() => setSelectedReturn(null)}
        title={
          selectedReturn
            ? `Purchase Return — ${selectedReturn.returnNumber}`
            : ""
        }
        maxWidth="md"
      >
        {selectedReturn && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Supplier
              </p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {selectedReturn.supplierName}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                PO Ref: {selectedReturn.poReference}
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
              <p className="text-[10px] font-bold uppercase text-amber-800">
                Return Reason
              </p>
              <p className="text-slate-800 font-medium">
                {selectedReturn.reason}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-600">Status</span>
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE_CLASSES[selectedReturn.status]}`}
              >
                {selectedReturn.status}
              </span>
            </div>

            <div className="flex justify-between text-sm font-bold bg-slate-100 p-3 rounded-xl text-slate-900">
              <span>Total Debit Note Amount:</span>
              <span className="font-mono text-rose-700 font-black">
                {formatAed(selectedReturn.totalAmount)}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs flex items-center gap-1.5 cursor-pointer"
                icon={<PrintIcon size={13} />}
              >
                Print Voucher
              </Button>
              <Button
                variant="dark"
                size="sm"
                onClick={() => setSelectedReturn(null)}
                className="text-xs bg-slate-800 hover:bg-slate-900 text-white cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
