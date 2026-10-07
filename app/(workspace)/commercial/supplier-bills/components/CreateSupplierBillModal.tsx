"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "@tanstack/react-form";
import {
  Modal,
  Button,
  Input,
  FormInput,
  FormSelect,
  FormSubmit,
  FormDatePicker,
} from "@/components/ui";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { Supplier, Product } from "@/lib/hooks/api-hooks";
import { formatNumber } from "@/lib/utils/format";

export interface CreateSupplierBillItem {
  productId?: string;
  description: string;
  quantity: number;
  unitCost: number;
  unit?: string;
}

export interface CreateSupplierBillData {
  billNumber?: string;
  supplierId?: string;
  supplierName: string;
  supplierTrn?: string;
  billDate: string;
  dueDate: string;
  items: CreateSupplierBillItem[];
  autoPost?: boolean;
}

export interface CreateSupplierBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  products: Product[];
  onCreate: (data: CreateSupplierBillData) => Promise<void>;
  isCreating?: boolean;
}

export const CreateSupplierBillModal: React.FC<
  CreateSupplierBillModalProps
> = ({
  isOpen,
  onClose,
  suppliers,
  products,
  onCreate,
  isCreating = false,
}) => {
  const [createBillError, setCreateBillError] = useState("");
  const prevOpenRef = useRef(false);

  const createBillForm = useForm({
    defaultValues: {
      billNumber: "",
      supplierId: "",
      supplierName: "",
      supplierTrn: "",
      billDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      items: [
        {
          productId: "",
          description: "Direct materials / site supply",
          quantity: 1,
          unitCost: 0,
          unit: "PCS",
        },
      ] as CreateSupplierBillItem[],
      autoPost: true,
    },
    onSubmit: async ({ value }) => {
      if (!value.supplierName.trim()) {
        setCreateBillError("Please select or enter a supplier.");
        return;
      }
      setCreateBillError("");
      try {
        await onCreate({
          billNumber: value.billNumber.trim() || undefined,
          supplierId: value.supplierId || undefined,
          supplierName: value.supplierName.trim(),
          supplierTrn: value.supplierTrn.trim() || undefined,
          billDate: value.billDate,
          dueDate: value.dueDate,
          items: value.items,
          autoPost: value.autoPost,
        });
        onClose();
        createBillForm.reset();
      } catch (err: any) {
        setCreateBillError(err.message || "Failed to create supplier bill");
      }
    },
  });

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setCreateBillError("");
      createBillForm.reset({
        billNumber: "",
        supplierId: "",
        supplierName: "",
        supplierTrn: "",
        billDate: new Date().toISOString().slice(0, 10),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        items: [
          {
            productId: "",
            description: "Direct materials / site supply",
            quantity: 1,
            unitCost: 0,
            unit: "PCS",
          },
        ],
        autoPost: true,
      });
    }
    prevOpenRef.current = isOpen;
  }, [isOpen]);

  const addItem = () => {
    const current = createBillForm.getFieldValue("items");
    createBillForm.setFieldValue("items", [
      ...current,
      {
        productId: "",
        description: "",
        quantity: 1,
        unitCost: 0,
        unit: "PCS",
      },
    ]);
  };

  const removeItem = (idx: number) => {
    const current = createBillForm.getFieldValue("items");
    createBillForm.setFieldValue(
      "items",
      current.filter((_, i) => i !== idx),
    );
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const current = [...createBillForm.getFieldValue("items")];
    current[idx] = { ...current[idx], [field]: value };
    if (field === "productId") {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        current[idx].description = prod.name;
        current[idx].unitCost = Number(prod.costPrice || 0);
        current[idx].unit = prod.unit || "PCS";
      }
    }
    createBillForm.setFieldValue("items", current);
  };

  const handleSupplierSelect = (id: string) => {
    createBillForm.setFieldValue("supplierId", id);
    const sup = suppliers.find((s) => s.id === id);
    if (sup) {
      createBillForm.setFieldValue("supplierName", sup.name);
      createBillForm.setFieldValue("supplierTrn", sup.trn || "");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Supplier Bill (Accounts Payable)"
      maxWidth="xl"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          createBillForm.handleSubmit();
        }}
        className="space-y-4 text-xs"
      >
        {createBillError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-semibold">
            {createBillError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <createBillForm.Field name="billNumber">
            {(field) => (
              <FormInput
                field={field}
                label="Bill / Invoice Number"
                placeholder="Auto-generated if empty (e.g. BILL-2026-001)"
                className="font-mono"
              />
            )}
          </createBillForm.Field>
          <createBillForm.Field name="supplierId">
            {(field) => (
              <FormSelect
                field={field}
                label="Select Existing Supplier"
                onChange={(e) => handleSupplierSelect(e.target.value)}
              >
                <option value="">-- Choose Vendor or Enter New --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.trn ? `(TRN: ${s.trn})` : ""}
                  </option>
                ))}
              </FormSelect>
            )}
          </createBillForm.Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <createBillForm.Field name="supplierName">
            {(field) => (
              <FormInput
                field={field}
                label="Supplier / Vendor Name *"
                placeholder="Vendor legal name"
                required
              />
            )}
          </createBillForm.Field>
          <createBillForm.Field name="supplierTrn">
            {(field) => (
              <FormInput
                field={field}
                label="Supplier VAT TRN"
                placeholder="100XXXXXXXXX003 (15 digits)"
                className="font-mono"
              />
            )}
          </createBillForm.Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <createBillForm.Field name="billDate">
            {(field) => (
              <FormDatePicker
                field={field}
                label="Bill Date"
                required
                format="iso"
                placeholder="Select bill date"
              />
            )}
          </createBillForm.Field>
          <createBillForm.Field name="dueDate">
            {(field) => (
              <FormDatePicker
                field={field}
                label="Due Date"
                required
                align="right"
                format="iso"
                placeholder="Select due date"
              />
            )}
          </createBillForm.Field>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">
              Itemized Procurement Scope
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              icon={<PlusIcon size={12} />}
              className="text-[11px] cursor-pointer"
            >
              Add Item
            </Button>
          </div>

          <createBillForm.Field name="items">
            {(itemsField) => {
              const itemsList = itemsField.state.value || [];
              return (
                <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                  {itemsList.map((it, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200"
                    >
                      <div className="col-span-5">
                        <Input
                          placeholder="Item description"
                          value={it.description}
                          onChange={(e) =>
                            updateItem(idx, "description", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={it.quantity}
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
                      <div className="col-span-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Unit Cost"
                          value={it.unitCost}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "unitCost",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          required
                        />
                      </div>
                      <div className="col-span-2 text-right font-mono font-bold text-slate-800">
                        AED{" "}
                        {formatNumber(
                          Number(it.quantity || 0) * Number(it.unitCost || 0),
                        )}
                      </div>
                      <div className="col-span-1 text-center">
                        {itemsList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-rose-500 hover:text-rose-700 cursor-pointer p-1"
                          >
                            <TrashIcon size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            }}
          </createBillForm.Field>

          <createBillForm.Subscribe selector={(state) => state.values.items}>
            {(itemsList) => {
              const sub = (itemsList || []).reduce(
                (acc, it) =>
                  acc + Number(it.quantity || 0) * Number(it.unitCost || 0),
                0,
              );
              const vat = sub * 0.05;
              const tot = sub + vat;
              return (
                <div className="flex justify-end pt-2 text-right font-mono space-y-1">
                  <div className="w-64 bg-slate-100 p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span>AED {formatNumber(sub)}</span>
                    </div>
                    <div className="flex justify-between text-purple-700 font-medium">
                      <span>Input VAT (5%):</span>
                      <span>AED {formatNumber(vat)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold text-sm border-t border-slate-200 pt-1">
                      <span>Total Payable:</span>
                      <span>AED {formatNumber(tot)}</span>
                    </div>
                  </div>
                </div>
              );
            }}
          </createBillForm.Subscribe>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <createBillForm.Field name="autoPost">
            {(field) => (
              <input
                type="checkbox"
                id="autoPost"
                checked={field.state.value}
                onChange={(e) => field.handleChange(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
            )}
          </createBillForm.Field>
          <label htmlFor="autoPost" className="text-slate-700 font-medium">
            Post to General Ledger automatically upon creation
          </label>
        </div>

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
            form={createBillForm}
            loading={isCreating}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
          >
            Save Bill Voucher
          </FormSubmit>
        </div>
      </form>
    </Modal>
  );
};

export default CreateSupplierBillModal;
