"use client";

import React, { useState, useMemo } from "react";
import { useAccounts } from "@/lib/hooks/finance-hooks";
import { useForm } from "@tanstack/react-form";
import {
  Button,
  Modal,
  Input,
  Textarea,
  FormInput,
  FormSelect,
  FormTextarea,
  FormSubmit,
} from "@/components/ui";
import { PlusIcon, TrashIcon } from "@/components/icons";

import { Customer } from "@/lib/hooks/api-hooks";

export interface CreateSalesInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  products: any[];
  onSubmitInvoice: (invoiceData: any) => Promise<void>;
}

export const CreateSalesInvoiceModal: React.FC<
  CreateSalesInvoiceModalProps
> = ({ isOpen, onClose, customers, onSubmitInvoice }) => {
  const [error, setError] = useState("");
  const { data: allAccounts = [] } = useAccounts();
  const discountAccounts = useMemo(() => {
    return (allAccounts || []).filter(
      (acc: any) =>
        acc.isActive !== false &&
        (acc.type === "REVENUE" || acc.type === "EXPENSE") &&
        (acc.accountName?.toLowerCase().includes("discount") ||
         acc.accountName?.toLowerCase().includes("allowance") ||
         acc.accountCode === "4112" ||
         acc.accountCode === "54" ||
         acc.accountCode === "5215")
    );
  }, [allAccounts]);

  const createInvoiceForm = useForm({
    defaultValues: {
      invoiceNumber: "",
      customerId: "",
      customerName: "",
      customerTrn: "",
      projectScope: "",
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      items: [
        {
          productId: "",
          description: "Scope item / billing milestone",
          quantity: 1,
          unitPrice: 0,
          unit: "SQM",
        },
      ],
      notes: "",
      terms: "",
      autoPost: true,
    },
    onSubmit: async ({ value }) => {
      setError("");
      try {
        await onSubmitInvoice({
          invoiceNumber: value.invoiceNumber || undefined,
          customerId: value.customerId || undefined,
          customerName: value.customerName || "Valued Customer",
          customerTrn: value.customerTrn || undefined,
          projectScope: value.projectScope,
          invoiceDate: value.invoiceDate,
          dueDate: value.dueDate,
          items: value.items,
          notes: value.notes || undefined,
          terms: value.terms || undefined,
          autoPost: value.autoPost,
        });
        createInvoiceForm.reset();
        onClose();
      } catch (err: any) {
        setError(err.message || "Error creating invoice");
      }
    },
  });

  const addItem = () => {
    const current = createInvoiceForm.getFieldValue("items");
    createInvoiceForm.setFieldValue("items", [
      ...current,
      {
        productId: "",
        description: "Additional work / scope line",
        quantity: 1,
        unitPrice: 0,
        unit: "SQM",
      },
    ]);
  };

  const removeItem = (idx: number) => {
    const current = createInvoiceForm.getFieldValue("items");
    if (current.length <= 1) return;
    createInvoiceForm.setFieldValue(
      "items",
      current.filter((_, i) => i !== idx),
    );
  };

  const updateItem = (idx: number, field: string, val: any) => {
    const current = [...createInvoiceForm.getFieldValue("items")];
    current[idx] = { ...current[idx], [field]: val };
    createInvoiceForm.setFieldValue("items", current);
  };

  const handleClose = () => {
    createInvoiceForm.reset();
    setError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Commercial Sales Invoice"
      maxWidth="xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          createInvoiceForm.handleSubmit();
        }}
        className="space-y-4 text-xs"
      >
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <createInvoiceForm.Field name="customerId">
            {(field) => (
              <FormSelect
                field={field}
                label="Select Customer *"
                onChange={(e) => {
                  const c = customers.find(
                    (cust) => cust.id === e.target.value,
                  );
                  if (c) {
                    createInvoiceForm.setFieldValue("customerName", c.name);
                  }
                }}
              >
                <option value="">Select registered customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customerCode || "Client"})
                  </option>
                ))}
              </FormSelect>
            )}
          </createInvoiceForm.Field>

          <createInvoiceForm.Field name="customerName">
            {(field) => (
              <FormInput
                field={field}
                label="Customer / Entity Name (Override) *"
                placeholder="Customer Name"
                required
              />
            )}
          </createInvoiceForm.Field>

          <createInvoiceForm.Field name="customerTrn">
            {(field) => (
              <FormInput
                field={field}
                label="Customer TRN (UAE VAT)"
                placeholder="100XXXXXXXXX003"
                className="font-mono"
              />
            )}
          </createInvoiceForm.Field>

          <createInvoiceForm.Field name="invoiceNumber">
            {(field) => (
              <FormInput
                field={field}
                label="Invoice Number (Optional)"
                placeholder="Auto-generated if blank (e.g. INV-1001)"
                className="font-mono"
              />
            )}
          </createInvoiceForm.Field>
        </div>

        <div>
          <createInvoiceForm.Field name="projectScope">
            {(field) => (
              <FormInput
                field={field}
                label="Project Scope / Milestones"
                placeholder="e.g. Commercial Fitout - Phase 1 Completion"
              />
            )}
          </createInvoiceForm.Field>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Invoice Line Items
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addItem}
              icon={<PlusIcon size={13} />}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              Add Line
            </Button>
          </div>

          <createInvoiceForm.Field name="items">
            {(itemsField) => {
              const itemsList = itemsField.state.value || [];
              return (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {itemsList.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-start bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs"
                    >
                      <div className="col-span-6">
                        <Textarea
                          rows={2}
                          placeholder="Description / scope points (press Enter for new points)..."
                          className="resize-y min-h-[36px]"
                          value={item.description}
                          onChange={(e) =>
                            updateItem(idx, "description", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          className="font-mono"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "quantity",
                              parseFloat(e.target.value) || 1,
                            )
                          }
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Unit Price"
                          className="font-mono font-bold"
                          value={item.unitPrice || ""}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "unitPrice",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          required
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <TrashIcon size={13} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }}
          </createInvoiceForm.Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <createInvoiceForm.Field name="terms">
            {(field) => (
              <FormTextarea
                field={field}
                label="Terms & Conditions (Optional)"
                rows={2}
                placeholder="Standard Sales Invoice clauses (6 terms & 100% advance) apply if left blank, or enter custom terms..."
                className="resize-none"
              />
            )}
          </createInvoiceForm.Field>

          <createInvoiceForm.Field name="notes">
            {(field) => (
              <FormTextarea
                field={field}
                label="Notes & Special Remarks (Optional)"
                rows={2}
                placeholder="Additional notes for the client..."
                className="resize-none"
              />
            )}
          </createInvoiceForm.Field>
        </div>

        <createInvoiceForm.Subscribe selector={(state) => state.values.items}>
          {(itemsList) => {
            const sub = (itemsList || []).reduce(
              (s, i) =>
                s +
                (parseFloat(String(i.quantity)) || 0) *
                  (parseFloat(String(i.unitPrice)) || 0),
              0,
            );
            const vat = sub * 0.05;
            const tot = sub + vat;
            return (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono text-xs text-right space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal (Excl. VAT):</span>
                  <span>AED {sub.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>5% Output VAT:</span>
                  <span>AED {vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200 pt-1">
                  <span>Total Invoice Due:</span>
                  <span className="text-emerald-900">AED {tot.toFixed(2)}</span>
                </div>
              </div>
            );
          }}
        </createInvoiceForm.Subscribe>

        <createInvoiceForm.Field name="autoPost">
          {(field) => (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="autoPost"
                checked={field.state.value}
                onChange={(e) => field.handleChange(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label
                htmlFor="autoPost"
                className="font-semibold text-slate-700 cursor-pointer"
              >
                Auto-post to General Ledger &amp; update Accounts Receivable
              </label>
            </div>
          )}
        </createInvoiceForm.Field>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            type="button"
            onClick={handleClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <FormSubmit
            form={createInvoiceForm}
            className="text-white font-semibold cursor-pointer shadow-2xs"
            style={{ backgroundColor: "#1d4ed8" }}
          >
            Save &amp; Issue Sales Invoice
          </FormSubmit>
        </div>
      </form>
    </Modal>
  );
};

export default CreateSalesInvoiceModal;
