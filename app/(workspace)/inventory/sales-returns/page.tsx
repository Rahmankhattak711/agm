"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
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
import { formatAed } from "@/lib/utils/format";

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
  COMPLETED: "bg-emerald-100 text-emerald-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  SUBMITTED: "bg-amber-100  text-amber-800",
  DRAFT: "bg-slate-100  text-slate-700",
  REJECTED: "bg-rose-100   text-rose-800",
};

const STATUS_FILTERS = ["ALL", "SUBMITTED", "APPROVED", "COMPLETED"] as const;

function generateReturnNumber(count: number): string {
  return `SR-2026-${String(count + 1).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  colorClass = "bg-white border-slate-200",
  valueClass = "text-slate-900",
}: {
  label: string;
  value: React.ReactNode;
  colorClass?: string;
  valueClass?: string;
}) {
  return (
    <div
      className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 ${colorClass}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">
        {label}
      </p>
      <p className={`text-xl font-black font-mono ${valueClass}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ReturnStatus }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE_CLASSES[status]}`}
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SalesReturnsPage() {
  const [returnsList, setReturnsList] = useState<SalesReturnItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<ReturnFormState>(EMPTY_FORM);

  // Derived -----------------------------------------------------------------

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
        item.projectScope.toLowerCase().includes(q);
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

  // Handlers ----------------------------------------------------------------

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

  // Render ------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Sales Returns (Credit Notes)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Customer Credit Vouchers
            </span>
          </div>
          <p className="text-xs text-slate-500">
            AGM FITOUT TECHNICAL SERVICES LLC — Manage client credit notes,
            scope reductions, and invoice credit adjustments.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setForm(EMPTY_FORM);
            setIsCreateOpen(true);
          }}
          icon={<Plus size={14} />}
        >
          Create Sales Return
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Total Sales Credit Notes"
          value={formatAed(totalReturnAmount)}
          colorClass="bg-rose-50/60 border-rose-100"
          valueClass="text-rose-950"
        />
        <KpiCard
          label="Approved Credit Notes"
          value={`${approvedCount} Vouchers`}
          colorClass="bg-emerald-50/60 border-emerald-100"
          valueClass="text-emerald-950"
        />
        <KpiCard
          label="Pending Approval"
          value={`${pendingCount} Vouchers`}
          colorClass="bg-slate-50 border-slate-200"
          valueClass="text-slate-900"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="w-full sm:w-96">
          <Input
            leftIcon={<Search size={15} />}
            placeholder="Search return number, invoice ref, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none bg-slate-50 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm bg-white">
        <Table className="w-full text-xs text-left">
          <TableHead className="bg-slate-50/95 border-b border-slate-200">
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Credit Note Voucher
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Invoice / QTN Ref
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Client Name
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Date
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Scope / Reason
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Status
            </TableHeaderCell>
            <TableHeaderCell
              align="right"
              className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-[11px]"
            >
              Credit Amount (AED)
            </TableHeaderCell>
          </TableHead>

          <TableBody className="divide-y divide-slate-100">
            {filteredReturns.length === 0 ? (
              <TableEmpty
                colSpan={7}
                title="No sales return credit notes found."
                message="Create a new sales return to get started."
              />
            ) : (
              filteredReturns.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-slate-50/60 text-slate-700 transition"
                >
                  <TableCell className="py-3 px-4 font-mono font-bold text-rose-900">
                    {item.returnNumber}
                  </TableCell>
                  <TableCell className="py-3 px-4 font-mono font-semibold text-slate-800">
                    {item.invoiceReference}
                  </TableCell>
                  <TableCell className="py-3 px-4 font-bold text-slate-900">
                    {item.customerName}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-slate-600">
                    {item.returnDate}
                  </TableCell>
                  <TableCell className="py-3 px-4 max-w-xs truncate text-slate-600">
                    {item.reason}
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-rose-950"
                  >
                    {formatAed(item.totalAmount)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={handleCloseCreate}
        title="Create Sales Return (Credit Note)"
      >
        <form onSubmit={handleCreateReturn} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Credit Note No"
              value={currentReturnNumber}
              readOnly
              disabled
            />
            <Input
              label="Invoice / QTN Ref *"
              placeholder="e.g. AGM-QTN-2026-01217"
              value={form.invoiceReference}
              onChange={(e) => setField("invoiceReference", e.target.value)}
              required
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
            label="Reason for Credit Note / Return"
            rows={2}
            placeholder="Reason for scope reduction or return..."
            value={form.returnReason}
            onChange={(e) => setField("returnReason", e.target.value)}
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
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="lg"
              type="button"
              onClick={handleCloseCreate}
            >
              Cancel
            </Button>
            <Button variant="primary" size="lg" type="submit">
              Submit Sales Return
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
