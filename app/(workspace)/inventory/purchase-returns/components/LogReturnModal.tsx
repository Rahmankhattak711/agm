"use client";

import React from "react";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { Supplier } from "@/lib/hooks/api-hooks";
import { Project } from "@/lib/hooks/types";
import { SupplierBill } from "@/lib/hooks/inventory-hooks";
import { ReturnFormState } from "./types";

interface LogReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: ReturnFormState;
  setField: <K extends keyof ReturnFormState>(
    key: K,
    value: ReturnFormState[K],
  ) => void;
  suppliers: Supplier[];
  projects: Project[];
  supplierBills: SupplierBill[];
  isSubmitting?: boolean;
}

const LogReturnModal: React.FC<LogReturnModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  setField,
  suppliers,
  projects,
  supplierBills,
  isSubmitting = false,
}) => {
  const handleBillSelect = (billId: string) => {
    setField("supplierBillId", billId);
    if (billId) {
      const b = supplierBills.find((bill) => bill.id === billId);
      if (b) {
        if (b.supplierId) setField("selectedSupplier", b.supplierId);
        setField("poReference", b.billNumber);
        if (!form.returnAmount)
          setField("returnAmount", String(b.totalAmount || ""));
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Purchase Return (Debit Note)"
      maxWidth="2xl"
    >
      <form onSubmit={onSubmit} className="space-y-4 text-xs font-normal">
        {/* Section 1: Reference & Timing */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            Reference &amp; Invoice Link
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Return Date *"
              type="date"
              value={form.returnDate}
              onChange={(e) => setField("returnDate", e.target.value)}
              required
              className="font-mono"
            />
            <Input
              label="Purchase Order / Bill Reference *"
              placeholder="e.g. PO-2026-001 or Bill #1029"
              value={form.poReference}
              onChange={(e) => setField("poReference", e.target.value)}
              required
              className="font-mono font-semibold"
            />
          </div>

          {supplierBills.length > 0 && (
            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-xs">
                Link Purchase Invoice (Optional)
              </label>
              <select
                value={form.supplierBillId}
                onChange={(e) => handleBillSelect(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#cbd5e1] bg-white text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all cursor-pointer"
              >
                <option value="">
                  — Select a Purchase Bill or enter PO above —
                </option>
                {supplierBills.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.billNumber} — {b.supplierName || b.supplier?.name} (AED{" "}
                    {Number(b.totalAmount || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Section 2: Vendor & Project Allocation */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
            Vendor &amp; Project Allocation
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-xs">
                Supplier / Vendor *
              </label>
              <select
                value={form.selectedSupplier}
                onChange={(e) => setField("selectedSupplier", e.target.value)}
                required
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#cbd5e1] bg-white text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all cursor-pointer"
              >
                <option value="">-- Select Registered Vendor --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.trn ? `(TRN: ${s.trn})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-xs">
                Associated Project
              </label>
              <select
                value={form.selectedProject}
                onChange={(e) => setField("selectedProject", e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#cbd5e1] bg-white text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all cursor-pointer"
              >
                <option value="">— General Stock / Unassigned Project —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectCode} — {p.name} (
                    {p.customer?.name ||
                      p.customer?.companyName ||
                      "Private Client"}
                    )
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Reason & Financial Impact */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <Textarea
            label="Return Reason / Quality Defect *"
            rows={2}
            placeholder="Describe damaged goods, defective batch, or project material rejection..."
            value={form.returnReason}
            onChange={(e) => setField("returnReason", e.target.value)}
            required
          />

          <Input
            label="Debit Note Amount (AED Incl. VAT) *"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={form.returnAmount}
            onChange={(e) => setField("returnAmount", e.target.value)}
            required
            className="font-mono font-bold text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 text-xs font-medium border border-[#cbd5e1] rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-1.5 text-xs font-medium rounded-lg text-white hover:opacity-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            style={{
              backgroundColor: "#1d4ed8",
              color: "#ffffff",
              border: "1px solid #1e40af",
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit Purchase Return"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LogReturnModal;
