"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import {
  Modal,
  Button,
  FormInput,
  FormSelect,
  FormSubmit,
} from "@/components/ui";
import { SupplierBill } from "@/lib/hooks/api-hooks";
import { formatNumber } from "@/lib/utils/format";

export interface DisbursePaymentData {
  amount: number;
  paymentMethod: "BANK_TRANSFER" | "CHEQUE" | "CASH" | "CREDIT_CARD";
  referenceNumber?: string;
}

export interface DisbursePaymentModalProps {
  bill: SupplierBill | null;
  onClose: () => void;
  onDisburse: (data: DisbursePaymentData) => Promise<void>;
  isDisbursing?: boolean;
}

export const DisbursePaymentModal: React.FC<DisbursePaymentModalProps> = ({
  bill,
  onClose,
  onDisburse,
  isDisbursing = false,
}) => {
  const [disbursalError, setDisbursalError] = useState("");

  const paymentForm = useForm({
    defaultValues: {
      amount: String(bill?.remainingBalance || ""),
      paymentMethod: "BANK_TRANSFER",
      referenceNumber: "",
    },
    onSubmit: async ({ value }) => {
      if (!bill) return;
      setDisbursalError("");
      const amt = parseFloat(value.amount);
      if (isNaN(amt) || amt <= 0) {
        setDisbursalError("Invalid payment amount.");
        return;
      }
      try {
        await onDisburse({
          amount: amt,
          paymentMethod: value.paymentMethod as any,
          referenceNumber: value.referenceNumber.trim() || undefined,
        });
        onClose();
        paymentForm.reset();
      } catch (err: any) {
        setDisbursalError(err.message || "Failed to record payment");
      }
    },
  });

  useEffect(() => {
    if (bill) {
      setDisbursalError("");
      paymentForm.reset({
        amount: String(bill.remainingBalance || ""),
        paymentMethod: "BANK_TRANSFER",
        referenceNumber: "",
      });
    }
  }, [bill]);

  return (
    <Modal
      isOpen={!!bill}
      onClose={onClose}
      title={`Disburse Payment — ${bill?.billNumber || ""}`}
      maxWidth="md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          paymentForm.handleSubmit();
        }}
        className="space-y-3.5 text-xs"
      >
        {disbursalError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold">
            {disbursalError}
          </div>
        )}

        {bill && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-500 font-medium">Vendor / Payee</p>
            <p className="font-bold text-slate-900 text-sm">
              {bill.supplierName}
            </p>
            <p className="font-mono text-rose-700 font-bold mt-1">
              Outstanding Balance: AED {formatNumber(bill.remainingBalance)}
            </p>
          </div>
        )}

        <paymentForm.Field name="amount">
          {(field) => (
            <FormInput
              field={field}
              label="Payment Amount (AED) *"
              type="number"
              step="0.01"
              max={bill?.remainingBalance}
              min="0.01"
              required
              className="font-mono font-bold"
            />
          )}
        </paymentForm.Field>

        <paymentForm.Field name="paymentMethod">
          {(field) => (
            <FormSelect field={field} label="Disbursal Method *">
              <option value="BANK_TRANSFER">
                Corporate Bank Transfer (WPS)
              </option>
              <option value="CHEQUE">Corporate Cheque</option>
              <option value="CASH">Petty Cash</option>
              <option value="CREDIT_CARD">Corporate Card</option>
            </FormSelect>
          )}
        </paymentForm.Field>

        <paymentForm.Field name="referenceNumber">
          {(field) => (
            <FormInput
              field={field}
              label="Reference / Cheque / Txn Number"
              placeholder="Txn reference / Cheque number"
              className="font-mono"
            />
          )}
        </paymentForm.Field>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <FormSubmit
            form={paymentForm}
            loading={isDisbursing}
            className="bg-teal-800 hover:bg-teal-900 text-white font-bold cursor-pointer"
          >
            Confirm Disbursal
          </FormSubmit>
        </div>
      </form>
    </Modal>
  );
};

export default DisbursePaymentModal;
