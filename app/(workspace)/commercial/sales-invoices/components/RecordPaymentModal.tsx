"use client";

import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  Button,
  Modal,
  FormInput,
  FormSelect,
  FormSubmit,
} from "@/components/ui";
import { SalesInvoice } from "@/lib/hooks/api-hooks";

export interface RecordPaymentModalProps {
  invoice: SalesInvoice | null;
  onClose: () => void;
  onSubmitPayment: (paymentData: {
    salesInvoiceId: string;
    customerId?: string | null;
    customerName: string;
    amount: number;
    paymentMethod: any;
    referenceNumber?: string;
  }) => Promise<void>;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  invoice,
  onClose,
  onSubmitPayment,
}) => {
  const [error, setError] = useState("");

  const paymentForm = useForm({
    defaultValues: {
      amount: "",
      paymentMethod: "BANK_TRANSFER",
      referenceNumber: "",
    },
    onSubmit: async ({ value }) => {
      if (!invoice) return;
      setError("");
      const amt = parseFloat(value.amount);
      if (isNaN(amt) || amt <= 0) {
        setError("Invalid payment amount.");
        return;
      }

      try {
        await onSubmitPayment({
          salesInvoiceId: invoice.id,
          customerId: invoice.customerId || undefined,
          customerName: invoice.customerName,
          amount: amt,
          paymentMethod: value.paymentMethod as any,
          referenceNumber: value.referenceNumber || undefined,
        });
        paymentForm.reset();
        onClose();
      } catch (err: any) {
        setError(err.message || "Error recording payment");
      }
    },
  });

  if (!invoice) return null;

  return (
    <Modal
      isOpen={!!invoice}
      onClose={onClose}
      title={`Record Customer Payment: ${invoice.invoiceNumber}`}
      maxWidth="md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          paymentForm.handleSubmit();
        }}
        className="space-y-4 text-xs"
      >
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            {error}
          </div>
        )}

        <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
          <p className="font-bold text-emerald-950">
            Customer: {invoice.customerName}
          </p>
          <p className="text-slate-600">
            Total Invoice: AED {Number(invoice.totalAmount).toFixed(2)} |
            Outstanding:{" "}
            <strong className="text-rose-700">
              AED {Number(invoice.remainingBalance).toFixed(2)}
            </strong>
          </p>
        </div>

        <paymentForm.Field name="amount">
          {(field) => (
            <FormInput
              field={field}
              label="Payment Amount (AED) *"
              type="number"
              step="0.01"
              placeholder="Amount"
              className="font-mono font-bold"
              required
            />
          )}
        </paymentForm.Field>

        <paymentForm.Field name="paymentMethod">
          {(field) => (
            <FormSelect field={field} label="Receipt Account / Method *">
              <option value="BANK_TRANSFER">
                Bank Transfer (RAK Bank A/C 1020)
              </option>
              <option value="CHEQUE">Corporate Cheque</option>
              <option value="CASH">Petty Cash / Cash Receipt (A/C 1010)</option>
              <option value="CARD">Debit / Credit Card</option>
            </FormSelect>
          )}
        </paymentForm.Field>

        <paymentForm.Field name="referenceNumber">
          {(field) => (
            <FormInput
              field={field}
              label="Reference / Cheque Number"
              placeholder="e.g. TR-9283749 or CHQ-00128"
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
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
          >
            Post Payment to Ledger
          </FormSubmit>
        </div>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;
