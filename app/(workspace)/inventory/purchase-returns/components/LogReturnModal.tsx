"use client";

import React from "react";
import { Button, Input, Modal, Select } from "@/components/ui";
import { Supplier } from "@/lib/hooks/api-hooks";
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
}

const LogReturnModal: React.FC<LogReturnModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  setField,
  suppliers,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Purchase Return / Material Rejection"
      maxWidth="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        <Input
          label="Original Purchase Order Reference *"
          placeholder="e.g. PO-2026-001"
          value={form.poReference}
          onChange={(e) => setField("poReference", e.target.value)}
          required
          className="font-mono"
        />

        <Select
          label="Supplier / Vendor *"
          value={form.selectedSupplier}
          onChange={(e) => setField("selectedSupplier", e.target.value)}
          required
        >
          <option value="">-- Select Registered Vendor --</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.trn ? `(TRN: ${s.trn})` : ""}
            </option>
          ))}
        </Select>

        <Input
          label="Return Reason / Quality Defect *"
          placeholder="Describe material rejection or damage..."
          value={form.returnReason}
          onChange={(e) => setField("returnReason", e.target.value)}
          required
        />

        <Input
          label="Debit Note Return Amount (AED) *"
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
            onClick={onClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
          >
            Submit Purchase Return
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LogReturnModal;
