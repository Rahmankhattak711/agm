"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "@tanstack/react-form";
import {
  Modal,
  Button,
  Input,
  Select,
  FormInput,
  FormSelect,
  FormTextarea,
  FormSubmit,
  FormDatePicker,
} from "@/components/ui";
import { PlusIcon, CloseIcon } from "@/components/icons";
import { Supplier, Product } from "@/lib/hooks/api-hooks";
import { ItemRow } from "./types";
import { QuickAddProductModal } from "./QuickAddProductModal";

export interface CreatePurchaseOrderData {
  poNumber: string;
  supplierId: string;
  shopName?: string;
  vendorReference?: string;
  orderDate: string;
  expectedDate?: string;
  status: "DRAFT";
  notes?: string;
  items: {
    productId: string;
    supplierSku?: string;
    itemNotes?: string;
    quantityOrdered: number;
    unitCost: number;
  }[];
}

export interface CreatePurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  products: Product[];
  onCreate: (data: CreatePurchaseOrderData) => Promise<void>;
  isCreating?: boolean;
}

export const CreatePurchaseOrderModal: React.FC<
  CreatePurchaseOrderModalProps
> = ({
  isOpen,
  onClose,
  suppliers,
  products,
  onCreate,
  isCreating = false,
}) => {
  const [formError, setFormError] = useState("");
  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);
  const [quickProductTargetIdx, setQuickProductTargetIdx] = useState<
    number | null
  >(null);
  const prevOpenRef = useRef(false);

  const poForm = useForm({
    defaultValues: {
      poNumber: `PO-${Date.now().toString().slice(-4)}`,
      supplierId: "",
      shopName: "",
      vendorReference: "",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDate: "",
      notes: "",
      items: [
        {
          productId: "",
          supplierSku: "",
          itemNotes: "",
          quantityOrdered: "1",
          unitCost: "0",
        },
      ] as ItemRow[],
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      if (
        !value.poNumber.trim() ||
        !value.supplierId ||
        value.items.length === 0
      ) {
        setFormError("PO number, supplier, and items are required.");
        return;
      }

      for (const it of value.items) {
        if (!it.productId) {
          setFormError("Please select or add a product for all item rows.");
          return;
        }
      }

      try {
        await onCreate({
          poNumber: value.poNumber.trim().toUpperCase(),
          supplierId: value.supplierId,
          shopName: value.shopName.trim() || undefined,
          vendorReference: value.vendorReference.trim() || undefined,
          orderDate: value.orderDate,
          expectedDate: value.expectedDate || undefined,
          status: "DRAFT",
          notes: value.notes.trim() || undefined,
          items: value.items.map((it) => ({
            productId: it.productId,
            supplierSku: it.supplierSku?.trim() || undefined,
            itemNotes: it.itemNotes?.trim() || undefined,
            quantityOrdered: Number(it.quantityOrdered),
            unitCost: Number(it.unitCost),
          })),
        });

        onClose();
      } catch (err: any) {
        setFormError(err.message || "Failed to create PO");
      }
    },
  });

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setFormError("");
      poForm.reset({
        poNumber: `PO-${Date.now().toString().slice(-4)}`,
        supplierId: suppliers.length > 0 ? suppliers[0].id : "",
        shopName: "",
        vendorReference: "",
        orderDate: new Date().toISOString().split("T")[0],
        expectedDate: "",
        notes: "",
        items: [
          {
            productId: "",
            supplierSku: "",
            itemNotes: "",
            quantityOrdered: "1",
            unitCost: "0",
          },
        ],
      });
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, suppliers, poForm]);

  const handleOpenQuickProduct = (idx: number | null) => {
    setQuickProductTargetIdx(idx);
    setIsQuickProductOpen(true);
  };

  const handleQuickProductSuccess = (newProd: Product) => {
    const currentItems = poForm.getFieldValue("items") || [];
    if (quickProductTargetIdx !== null && currentItems[quickProductTargetIdx]) {
      const next = [...currentItems];
      next[quickProductTargetIdx] = {
        ...next[quickProductTargetIdx],
        productId: newProd.id,
        supplierSku: newProd.supplierSku || "",
        unitCost: newProd.costPrice?.toString() || "0",
      };
      poForm.setFieldValue("items", next);
    } else {
      poForm.setFieldValue("items", [
        ...currentItems,
        {
          productId: newProd.id,
          supplierSku: newProd.supplierSku || "",
          itemNotes: "",
          quantityOrdered: "1",
          unitCost: newProd.costPrice?.toString() || "0",
        },
      ]);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Create Purchase Order"
        maxWidth="3xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            poForm.handleSubmit();
          }}
          className="space-y-4 text-xs"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              {formError}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <poForm.Field
                name="poNumber"
                validators={{
                  onChange: ({ value }) =>
                    !value.trim() ? "PO number is required" : undefined,
                }}
              >
                {(field) => (
                  <FormInput
                    field={field}
                    label="PO Number *"
                    required
                    className="font-mono font-bold uppercase tracking-wider"
                  />
                )}
              </poForm.Field>

              <poForm.Field
                name="supplierId"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Supplier / Vendor is required" : undefined,
                }}
              >
                {(field) => (
                  <FormSelect
                    field={field}
                    label="Supplier / Vendor Company *"
                    required
                  >
                    <option value="">-- Select Vendor --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.supplierCode})
                      </option>
                    ))}
                  </FormSelect>
                )}
              </poForm.Field>

              <poForm.Field
                name="orderDate"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Order date is required" : undefined,
                }}
              >
                {(field) => (
                  <FormDatePicker
                    field={field}
                    label="Order Date"
                    required
                    align="right"
                    format="iso"
                    placeholder="Select order date"
                  />
                )}
              </poForm.Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <poForm.Field name="vendorReference">
                {(field) => (
                  <FormInput
                    field={field}
                    label="Shop / Vendor Quote Ref #"
                    placeholder="e.g., Shop Quote #4819 / Inv #21"
                  />
                )}
              </poForm.Field>

              <poForm.Field name="shopName">
                {(field) => (
                  <FormInput
                    field={field}
                    label="Shop / Branch Name"
                    placeholder="e.g., Deira Hardware Store / Al Quoz Branch"
                  />
                )}
              </poForm.Field>

              <poForm.Field name="expectedDate">
                {(field) => (
                  <FormDatePicker
                    field={field}
                    label="Expected Delivery Date"
                    align="right"
                    format="iso"
                    placeholder="Optional delivery date"
                  />
                )}
              </poForm.Field>
            </div>
          </div>

          <poForm.Field name="items">
            {(itemsField) => {
              const currentItems = itemsField.state.value;

              const addItem = () => {
                itemsField.handleChange([
                  ...currentItems,
                  {
                    productId: "",
                    supplierSku: "",
                    itemNotes: "",
                    quantityOrdered: "1",
                    unitCost: "0",
                  },
                ]);
              };

              const removeItem = (index: number) => {
                if (currentItems.length > 1) {
                  itemsField.handleChange(
                    currentItems.filter((_, i) => i !== index),
                  );
                }
              };

              const updateItem = (
                index: number,
                key: keyof ItemRow,
                val: string,
              ) => {
                const next = [...currentItems];
                next[index] = { ...next[index], [key]: val };
                if (key === "productId") {
                  const prod = products.find((p) => p.id === val);
                  if (prod) {
                    next[index].unitCost = prod.costPrice?.toString() || "0";
                    if (prod.supplierSku) {
                      next[index].supplierSku = prod.supplierSku;
                    }
                  }
                }
                itemsField.handleChange(next);
              };

              const totalAmount = currentItems.reduce((acc, it) => {
                return (
                  acc +
                  Number(it.quantityOrdered || 0) * Number(it.unitCost || 0)
                );
              }, 0);

              return (
                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Procurement Line Items
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
                          {currentItems.length}{" "}
                          {currentItems.length === 1 ? "Item" : "Items"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Select catalog products or register items bought
                        directly from local vendors.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenQuickProduct(null)}
                        className="text-xs font-semibold text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 cursor-pointer shadow-2xs"
                        icon={<PlusIcon className="w-3.5 h-3.5" />}
                      >
                        + New Product
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={addItem}
                        className="text-xs font-bold cursor-pointer shadow-2xs"
                      >
                        + Add Row
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {currentItems.map((row, idx) => {
                      return (
                        <div
                          key={idx}
                          className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10.5px]">
                              Item #{idx + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(idx)}
                              disabled={currentItems.length === 1}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer disabled:opacity-20"
                              title="Remove item"
                            >
                              <CloseIcon size={12} />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                            <div className="md:col-span-6 space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-700">
                                  Product / Item{" "}
                                  <span className="text-rose-500">*</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleOpenQuickProduct(idx)}
                                  className="text-[10.5px] font-bold text-agm-green hover:underline cursor-pointer"
                                >
                                  + New Shop Product
                                </button>
                              </div>
                              <Select
                                required
                                value={row.productId}
                                onChange={(e) =>
                                  updateItem(idx, "productId", e.target.value)
                                }
                                className="w-full py-2 text-xs font-medium rounded-xl border-slate-200"
                              >
                                <option value="">-- Select Product --</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} {p.brand ? `[${p.brand}]` : ""} (
                                    {p.sku}){" "}
                                    {p.supplierSku
                                      ? `• Ref: ${p.supplierSku}`
                                      : ""}
                                  </option>
                                ))}
                              </Select>
                            </div>

                            <div className="md:col-span-2 space-y-1">
                              <label className="text-[11px] font-bold text-slate-700 block">
                                Qty <span className="text-rose-500">*</span>
                              </label>
                              <Input
                                type="number"
                                min="0.01"
                                step="any"
                                placeholder="1"
                                required
                                value={row.quantityOrdered}
                                onChange={(e) =>
                                  updateItem(
                                    idx,
                                    "quantityOrdered",
                                    e.target.value,
                                  )
                                }
                                className="w-full py-2 text-xs font-mono font-medium"
                              />
                            </div>

                            <div className="md:col-span-2 space-y-1">
                              <label className="text-[11px] font-bold text-slate-700 block">
                                Unit Cost (AED){" "}
                                <span className="text-rose-500">*</span>
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                required
                                value={row.unitCost}
                                onChange={(e) =>
                                  updateItem(idx, "unitCost", e.target.value)
                                }
                                className="w-full py-2 text-xs font-mono font-medium"
                              />
                            </div>

                            <div className="md:col-span-2 flex flex-col justify-end space-y-1">
                              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                                Subtotal
                              </span>
                              <div className="h-[38px] px-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-end font-mono font-bold text-xs text-slate-900">
                                AED{" "}
                                {(
                                  Number(row.quantityOrdered || 0) *
                                  Number(row.unitCost || 0)
                                ).toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                            <Input
                              placeholder="Shop / Vendor Item Code / Reference (Optional)"
                              value={row.supplierSku || ""}
                              onChange={(e) =>
                                updateItem(idx, "supplierSku", e.target.value)
                              }
                              className="py-1.5 text-[11px] bg-slate-50/50 rounded-lg"
                            />
                            <Input
                              placeholder="Item notes / specifications (e.g., Color 9010, 5L Can, Stainless 304)"
                              value={row.itemNotes || ""}
                              onChange={(e) =>
                                updateItem(idx, "itemNotes", e.target.value)
                              }
                              className="py-1.5 text-[11px] bg-slate-50/50 rounded-lg"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2.5 border-t border-slate-200/80">
                    <span className="text-xs font-medium text-slate-500">
                      Total Items:{" "}
                      <strong className="text-slate-800">
                        {currentItems.length} configured
                      </strong>
                    </span>
                    <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        Total Order Amount:
                      </span>
                      <span className="font-mono text-base font-black text-emerald-950">
                        AED {totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }}
          </poForm.Field>

          <poForm.Field name="notes">
            {(field) => (
              <FormTextarea
                field={field}
                label="Notes / Delivery Instructions"
                rows={2}
                placeholder="Payment terms, delivery contact, location instructions..."
                className="rounded-xl border-slate-200 text-xs"
              />
            )}
          </poForm.Field>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <FormSubmit
              form={poForm}
              loading={isCreating}
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer shadow-xs px-5"
            >
              Save Purchase Order
            </FormSubmit>
          </div>
        </form>
      </Modal>

      <QuickAddProductModal
        isOpen={isQuickProductOpen}
        onClose={() => setIsQuickProductOpen(false)}
        defaultSupplierId={poForm.getFieldValue("supplierId")}
        onSuccess={handleQuickProductSuccess}
      />
    </>
  );
};

export default CreatePurchaseOrderModal;
