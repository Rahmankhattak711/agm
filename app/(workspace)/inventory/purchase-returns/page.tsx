"use client";

import React, { useCallback, useMemo, useState } from "react";
import { Plus, Printer, RotateCcw, Search } from "lucide-react";
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_BADGE_CLASSES: Record<ReturnStatus, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  APPROVED: "bg-blue-100   text-blue-800   border-blue-200",
  SUBMITTED: "bg-amber-100  text-amber-800  border-amber-200",
  DRAFT: "bg-slate-100  text-slate-700  border-slate-200",
  REJECTED: "bg-rose-100   text-rose-800   border-rose-200",
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

function formatAed(amount: number): string {
  return `AED ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  colorClass?: string; // wrapper background + border
  valueClass?: string; // value text colour
}

function KpiCard({
  label,
  value,
  colorClass = "bg-white border-slate-200/80",
  valueClass = "text-slate-900",
}: KpiCardProps) {
  return (
    <div
      className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 ${colorClass}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-inherit opacity-70">
        {label}
      </p>
      <p className={`text-xl font-black font-mono ${valueClass}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ReturnStatus }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_BADGE_CLASSES[status]}`}
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PurchaseReturnsPage() {
  const { data: suppliers = [] } = useSuppliers();

  const [returnsList, setReturnsList] = useState<PurchaseReturnItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] =
    useState<PurchaseReturnItem | null>(null);
  const [form, setForm] = useState<ReturnFormState>(EMPTY_FORM);

  // Derived state -----------------------------------------------------------

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

  // Handlers ----------------------------------------------------------------

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

  // Render ------------------------------------------------------------------

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 print:p-0 print:m-0">
      {/* Official Print Header */}
      <div className="hidden print:block mb-6">
        <QuotationHeader />
        <div className="px-10 pt-4 pb-2 border-b border-slate-200 flex justify-between items-end">
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase">
              Purchase Returns &amp; Debit Note Advices
            </h1>
            <p className="text-xs text-slate-500">
              AGM FITOUT TECHNICAL SERVICES LLC — Supplier Material Rejections
              &amp; Reverse Logistics
            </p>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Printed: {new Date().toLocaleDateString("en-GB")}
          </p>
        </div>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Purchase Returns (Debit Notes)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Inventory &amp; Vendor Reversals
            </span>
          </div>
          <p className="text-xs text-slate-500">
            AGM FITOUT TECHNICAL SERVICES LLC — Track rejected supplier
            deliveries, return to vendor <br /> (RTV), and debit note reconciliation.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleOpenCreate}
          icon={<Plus size={14} />}
        >
          Create Purchase Return
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
        <KpiCard
          label="Total Return Value"
          value={formatAed(totalReturnVal)}
          colorClass="bg-amber-50/60 border-amber-200/80"
          valueClass="text-amber-950"
        />
        <KpiCard
          label="Total Return Notes"
          value={`${returnsList.length} Records`}
          colorClass="bg-white border-slate-200/80"
          valueClass="text-slate-900"
        />
        <KpiCard
          label="Completed Reversals"
          value={`${completedCount} Settled`}
          colorClass="bg-emerald-50/60 border-emerald-200/80"
          valueClass="text-emerald-950"
        />
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div className="w-full sm:w-96">
          <Input
            leftIcon={<Search size={15} />}
            placeholder="Search return number, PO ref, supplier, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-none bg-slate-50 focus:bg-white"
          />
        </div>

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-44"
        >
          <option value="ALL">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm bg-white">
        <Table>
          <TableHead className="bg-slate-50/95 border-b border-slate-200">
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Return No &amp; PO
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Supplier / Vendor
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Return Reason
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Return Date
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[11px]">
              Status
            </TableHeaderCell>
            <TableHeaderCell
              align="right"
              className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-[11px]"
            >
              Amount (AED)
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[11px] print:hidden">
              Action
            </TableHeaderCell>
          </TableHead>

          <TableBody className="divide-y divide-slate-100">
            {filteredReturns.length === 0 ? (
              <TableEmpty
                colSpan={7}
                title="No purchase returns found"
                message="Try adjusting your filters or record a new supplier return."
              />
            ) : (
              filteredReturns.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-slate-50/60 text-slate-700 transition"
                >
                  <TableCell className="py-3 px-4 font-mono font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <RotateCcw
                        size={14}
                        className="text-amber-600 shrink-0"
                      />
                      <span>{item.returnNumber}</span>
                    </div>
                    <p className="text-[10px] text-blue-700 font-sans font-medium">
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
                    {item.returnDate}
                  </TableCell>

                  <TableCell className="py-3 px-3 text-center">
                    <StatusBadge status={item.status} />
                  </TableCell>

                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-rose-800 text-sm"
                  >
                    {formatAed(item.totalAmount)}
                  </TableCell>

                  <TableCell className="py-3 px-3 text-center print:hidden">
                    <button
                      type="button"
                      onClick={() => setSelectedReturn(item)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    >
                      Audit View
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Modal */}
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
            />
            <Input
              label="PO Reference *"
              placeholder="e.g. PO-2026-0150"
              value={form.poReference}
              onChange={(e) => setField("poReference", e.target.value)}
              required
            />
          </div>

          <Select
            label="Supplier / Vendor *"
            value={form.selectedSupplier}
            onChange={(e) => setField("selectedSupplier", e.target.value)}
            required
          >
            <option value="">Select Supplier...</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.trn ? `TRN: ${s.trn}` : "Vendor"})
              </option>
            ))}
          </Select>

          <Textarea
            label="Reason for Return"
            rows={2}
            placeholder="Defect details, specifications mismatch, damaged lot..."
            value={form.returnReason}
            onChange={(e) => setField("returnReason", e.target.value)}
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
            <Button
              variant="primary"
              size="lg"
              type="submit"
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Submit Purchase Return
            </Button>
          </div>
        </form>
      </Modal>

      {/* Audit View Modal */}
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
              <p className="text-[11px] text-slate-500 mt-0.5">
                PO Ref: {selectedReturn.poReference}
              </p>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-1">
              <p className="text-[10px] font-bold uppercase text-amber-800">
                Return Reason
              </p>
              <p className="text-slate-800 font-medium">
                {selectedReturn.reason}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-600">Status</span>
              <StatusBadge status={selectedReturn.status} />
            </div>

            <div className="flex justify-between text-sm font-bold bg-slate-100 p-3 rounded-xl text-slate-900">
              <span>Total Debit Note Amount:</span>
              <span className="font-mono text-rose-800">
                {formatAed(selectedReturn.totalAmount)}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs flex items-center gap-1.5"
                icon={<Printer size={13} />}
              >
                Print Voucher
              </Button>
              <Button
                variant="dark"
                size="sm"
                onClick={() => setSelectedReturn(null)}
                className="text-xs bg-slate-800 hover:bg-slate-900 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Official Print Footer */}
      <div className="hidden print:block">
        <QuotationFooter />
      </div>
    </div>
  );
}
