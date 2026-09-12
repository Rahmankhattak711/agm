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
  TableEmpty,
  Modal,
  Input,
  Select,
  Textarea,
} from "@/components/ui";

type ReturnStatus =
  "DRAFT" | "SUBMITTED" | "APPROVED" | "COMPLETED" | "REJECTED";

interface SalesReturnItem {
  id: string;
  returnNumber: string;
  invoiceReference: string;
  customerName: string;
  projectScope: string;
  returnDate: string;
  reason: string;
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

const STATUS_FILTERS = [
  { id: "ALL", label: "All Returns" },
  { id: "SUBMITTED", label: "Submitted" },
  { id: "APPROVED", label: "Approved" },
  { id: "COMPLETED", label: "Completed" },
  { id: "DRAFT", label: "Drafts" },
] as const;

function generateReturnNumber(count: number): string {
  return `SR-2026-${String(count + 1).padStart(3, "0")}`;
}

function formatNumber(val: number | string | undefined): string {
  const num = Number(val || 0);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatAed(amount: number): string {
  return `AED ${formatNumber(amount)}`;
}

interface ReturnFormState {
  invoiceReference: string;
  customerName: string;
  projectScope: string;
  returnReason: string;
  returnAmount: string;
}

const EMPTY_FORM: ReturnFormState = {
  invoiceReference: "",
  customerName: "",
  projectScope: "",
  returnReason: "",
  returnAmount: "",
};

export default function SalesReturnsPage() {
  const [returnsList, setReturnsList] = useState<SalesReturnItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SalesReturnItem | null>(
    null,
  );
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
        item.invoiceReference.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.projectScope.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [returnsList, search, statusFilter]);

  const totalReturnAmount = useMemo(
    () => filteredReturns.reduce((s, i) => s + i.totalAmount, 0),
    [filteredReturns],
  );

  const approvedCount = useMemo(
    () =>
      returnsList.filter(
        (r) => r.status === "APPROVED" || r.status === "COMPLETED",
      ).length,
    [returnsList],
  );

  const pendingCount = useMemo(
    () =>
      returnsList.filter(
        (r) => r.status === "SUBMITTED" || r.status === "DRAFT",
      ).length,
    [returnsList],
  );

  const setField = useCallback(
    <K extends keyof ReturnFormState>(key: K, value: ReturnFormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const handleCloseCreate = useCallback(() => {
    setIsCreateOpen(false);
    setForm(EMPTY_FORM);
  }, []);

  const handleCreateReturn = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.invoiceReference || !form.customerName || !form.returnAmount)
        return;

      const newReturn: SalesReturnItem = {
        id: `sr-${Date.now()}`,
        returnNumber: currentReturnNumber,
        invoiceReference: form.invoiceReference,
        customerName: form.customerName,
        projectScope: form.projectScope || "Commercial Fitout Adjustment",
        returnDate: new Date().toISOString().slice(0, 10),
        reason: form.returnReason || "Client scope alteration / Credit Note",
        totalAmount: parseFloat(form.returnAmount) || 0,
        status: "SUBMITTED",
      };

      setReturnsList((prev) => [newReturn, ...prev]);
      handleCloseCreate();
    },
    [form, currentReturnNumber, handleCloseCreate],
  );

  return (
    <div className="space-y-6">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Sales Returns (Credit Notes)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AGM FITOUT TECHNICAL SERVICES LLC — Manage client credit notes,
            scope reductions, <br /> and invoice credit adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
            icon={<PrintIcon size={14} />}
          >
            Print Register
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Log Sales Return
          </Button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* 1. Total Sales Credit Notes */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-rose-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Total Sales Credit Notes
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Cumulative client credits
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-rose-500 font-sans mr-1">
              AED
            </span>
            <span className="text-xl font-black text-rose-700 font-mono">
              {formatNumber(totalReturnAmount)}
            </span>
          </div>
        </div>

        {/* 2. Total Vouchers */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              2. Total Credit Vouchers
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Registered credit memos
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {returnsList.length}
            </span>
            <span className="text-xs font-bold text-slate-500 font-sans ml-1.5">
              Vouchers
            </span>
          </div>
        </div>

        {/* 3. Approved Reversals */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              3. Approved Reversals
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Settled customer credits
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-emerald-800 font-mono">
              {approvedCount}
            </span>
            <span className="text-xs font-bold text-emerald-700 font-sans ml-1.5">
              Approved
            </span>
          </div>
        </div>

        {/* 4. In-Review Requests */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-amber-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              4. In-Review Requests
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Pending management approval
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-amber-700 font-mono">
              {pendingCount}
            </span>
            <span className="text-xs font-bold text-amber-700 font-sans ml-1.5">
              Pending
            </span>
          </div>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        {/* Search & Filter Strip */}
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Status Quick Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {STATUS_FILTERS.map((tab) => {
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
              placeholder="Search return number, invoice ref, client..."
              containerClassName="w-full sm:w-96"
              className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Sales Returns Table */}
        <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
            <h4 className="font-black text-xs uppercase tracking-wider text-white">
              Sales Returns &amp; Client Credit Notes Register
            </h4>
            <span className="text-[11px] font-mono text-emerald-300 font-bold">
              {filteredReturns.length} Active Records
            </span>
          </div>

          <Table className="w-full text-xs text-left">
            <TableHead className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Credit Note Voucher
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Invoice Ref
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Customer / Entity
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Date
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Return Reason
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
                    colSpan={8}
                    className="py-12 text-center text-slate-400 italic"
                  >
                    No sales returns found. Log a customer credit note or
                    rejected scope item.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReturns.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-slate-50/60 text-slate-700 transition"
                  >
                    <TableCell className="py-3 px-4 font-mono font-bold text-teal-800">
                      <div className="flex items-center gap-1.5">
                        <RotateCcwIcon
                          size={13}
                          className="text-teal-700 shrink-0"
                        />
                        <span>{item.returnNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {item.invoiceReference}
                    </TableCell>
                    <TableCell className="py-3 px-4 font-bold text-slate-900">
                      <div>{item.customerName}</div>
                      {item.projectScope && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {item.projectScope}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-3 text-slate-600 font-mono text-xs">
                      {new Date(item.returnDate).toLocaleDateString("en-GB")}
                    </TableCell>
                    <TableCell className="py-3 px-4 max-w-xs truncate text-slate-600">
                      {item.reason}
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

      {/* Modal for Creating Sales Return */}
      <Modal
        isOpen={isCreateOpen}
        onClose={handleCloseCreate}
        title="Create Sales Return (Credit Note)"
        maxWidth="md"
      >
        <form onSubmit={handleCreateReturn} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Credit Note No"
              value={currentReturnNumber}
              readOnly
              disabled
              className="font-mono font-bold"
            />
            <Input
              label="Invoice / QTN Ref *"
              placeholder="e.g. AGM-QTN-2026-01217"
              value={form.invoiceReference}
              onChange={(e) => setField("invoiceReference", e.target.value)}
              required
              className="font-mono"
            />
          </div>

          <Input
            label="Client / Customer Name *"
            placeholder="Client or Company Name"
            value={form.customerName}
            onChange={(e) => setField("customerName", e.target.value)}
            required
          />

          <Input
            label="Project Scope / Description"
            placeholder="Project Scope Name"
            value={form.projectScope}
            onChange={(e) => setField("projectScope", e.target.value)}
          />

          <Textarea
            label="Reason for Credit Note / Return *"
            rows={2}
            placeholder="Reason for scope reduction or return..."
            value={form.returnReason}
            onChange={(e) => setField("returnReason", e.target.value)}
            required
          />

          <Input
            label="Credit Amount (AED) *"
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
              Submit Sales Return
            </Button>
          </div>
        </form>
      </Modal>

      {/* Audit View Modal */}
      {selectedReturn && (
        <Modal
          isOpen={!!selectedReturn}
          onClose={() => setSelectedReturn(null)}
          title={`Sales Credit Note — ${selectedReturn.returnNumber}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <p className="text-[10px] font-bold uppercase text-slate-400">
                Client / Project
              </p>
              <p className="font-bold text-slate-900 text-sm">
                {selectedReturn.customerName}
              </p>
              <p className="text-slate-600 font-medium">
                Scope: {selectedReturn.projectScope}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Invoice Ref: {selectedReturn.invoiceReference}
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
              <p className="text-[10px] font-bold uppercase text-amber-800">
                Credit Adjustment Reason
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
              <span>Total Credit Note Amount:</span>
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
        </Modal>
      )}
    </div>
  );
}
