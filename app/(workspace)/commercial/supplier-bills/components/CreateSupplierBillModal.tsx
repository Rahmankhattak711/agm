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
import { Supplier, Product, useCreateSupplier } from "@/lib/hooks/api-hooks";
import { formatNumber } from "@/lib/utils/format";
import { QuickAddVendorModal } from "@/components/common/QuickAddVendorModal";
import { Plus, UserPlus } from "lucide-react";

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
  const [isQuickVendorOpen, setIsQuickVendorOpen] = useState(false);
  const prevOpenRef = useRef(false);

  const createSupplierMutation = useCreateSupplier();

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
      saveVendorToDirectory: true,
    },
    onSubmit: async ({ value }) => {
      if (!value.supplierName.trim()) {
        setCreateBillError("Please select or enter a supplier.");
        return;
      }
      setCreateBillError("");
      try {
        let finalSupplierId = value.supplierId;

        // If no existing vendor was selected, but user typed a vendor name and checked save
        if (!finalSupplierId && value.supplierName.trim() && value.saveVendorToDirectory) {
          try {
            const newSup = await createSupplierMutation.mutateAsync({
              supplierCode: "",
              name: value.supplierName.trim(),
              trn: value.supplierTrn.trim() || undefined,
            });
            finalSupplierId = newSup.id;
          } catch (supErr) {
            console.warn("Could not auto-save supplier to directory:", supErr);
          }
        }

        await onCreate({
          billNumber: value.billNumber.trim() || undefined,
          supplierId: finalSupplierId || undefined,
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
        saveVendorToDirectory: true,
      });
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, createBillForm]);

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
    if (id === "__NEW__") {
      setIsQuickVendorOpen(true);
      return;
    }
    createBillForm.setFieldValue("supplierId", id);
    const sup = suppliers.find((s) => s.id === id);
    if (sup) {
      createBillForm.setFieldValue("supplierName", sup.name);
      createBillForm.setFieldValue("supplierTrn", sup.trn || "");
    }
  };

  const handleVendorCreated = (newSup: Supplier) => {
    createBillForm.setFieldValue("supplierId", newSup.id);
    createBillForm.setFieldValue("supplierName", newSup.name);
    createBillForm.setFieldValue("supplierTrn", newSup.trn || "");
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Record Purchase Bill (Accounts Payable)"
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
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
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

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-bold text-slate-700 text-xs">
                  Select Existing Supplier
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickVendorOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5046e5] hover:text-[#4338ca] hover:underline cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ New Vendor</span>
                </button>
              </div>
              <createBillForm.Field name="supplierId">
                {(field) => (
                  <FormSelect
                    field={field}
                    label=""
                    onChange={(e) => handleSupplierSelect(e.target.value)}
                  >
                    <option value="">-- Choose Vendor or Enter New --</option>
                    <option value="__NEW__" className="font-bold text-[#5046e5]">
                      + Add New Vendor to Directory...
                    </option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.trn ? `(TRN: ${s.trn})` : ""}
                      </option>
                    ))}
                  </FormSelect>
                )}
              </createBillForm.Field>
            </div>
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
              <span className="font-bold text-slate-800 text-xs">
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
                  <div className="space-y-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                    {itemsList.map((it, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200"
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
                    <div className="w-64 bg-slate-100/80 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
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

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <createBillForm.Field name="autoPost">
                {(field) => (
                  <input
                    type="checkbox"
                    id="autoPost"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                )}
              </createBillForm.Field>
              <label htmlFor="autoPost" className="text-slate-700 font-medium cursor-pointer">
                Post to General Ledger automatically upon creation (Dr 5010 Material, Dr 2120 VAT, Cr 2000 AP)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <createBillForm.Field name="saveVendorToDirectory">
                {(field) => (
                  <input
                    type="checkbox"
                    id="saveVendorToDirectory"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                )}
              </createBillForm.Field>
              <label htmlFor="saveVendorToDirectory" className="text-slate-600 text-[11px] cursor-pointer">
                Save vendor legal details to Suppliers Directory for future bills
              </label>
            </div>
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
              loading={isCreating || createSupplierMutation.isPending}
              className="bg-[#5046e5] hover:bg-[#4338ca] text-white font-bold cursor-pointer"
            >
              Save Purchase Bill
            </FormSubmit>
          </div>
        </form>
      </Modal>

      <QuickAddVendorModal
        isOpen={isQuickVendorOpen}
        onClose={() => setIsQuickVendorOpen(false)}
        onSuccess={handleVendorCreated}
        initialName={createBillForm.getFieldValue("supplierName") || ""}
      />
    </>
  );
};

export default CreateSupplierBillModal;
