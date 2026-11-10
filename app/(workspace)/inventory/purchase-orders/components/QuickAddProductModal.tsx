"use client";

import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  Modal,
  Button,
  FormInput,
  FormSelect,
  FormTextarea,
  FormSubmit,
} from "@/components/ui";
import { useCreateProduct, Product, ProductType } from "@/lib/hooks/api-hooks";

export interface QuickAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSupplierId?: string;
  initialName?: string;
  onSuccess: (newProd: Product) => void;
}

export const QuickAddProductModal: React.FC<QuickAddProductModalProps> = ({
  isOpen,
  onClose,
  defaultSupplierId,
  initialName,
  onSuccess,
}) => {
  const createProduct = useCreateProduct();
  const [quickProductError, setQuickProductError] = useState("");

  const quickProductForm = useForm({
    defaultValues: {
      name: initialName || "",
      brand: "",
      supplierSku: "",
      originCompany: "",
      shopLocation: "",
      type: "RAW_MATERIAL" as ProductType,
      unit: "PCS",
      costPrice: "0",
      sellingPrice: "0",
      supplierId: defaultSupplierId || "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      setQuickProductError("");
      if (!value.name.trim()) {
        setQuickProductError("Product Name is required.");
        return;
      }

      try {
        const autoSku = `EXT-${Date.now().toString().slice(-6)}`;
        const newProd = await createProduct.mutateAsync({
          name: value.name.trim(),
          sku: autoSku,
          brand: value.brand.trim() || null,
          supplierSku: value.supplierSku.trim() || null,
          originCompany: value.originCompany.trim() || null,
          shopLocation: value.shopLocation.trim() || null,
          productOrigin: "PURCHASED_EXTERNAL",
          type: value.type || "RAW_MATERIAL",
          unit: value.unit?.trim() || "PCS",
          costPrice: Number(value.costPrice || 0),
          sellingPrice: Number(value.sellingPrice || 0),
          supplierId: value.supplierId || defaultSupplierId || null,
          description: value.description.trim() || null,
        });

        onSuccess(newProd);
        quickProductForm.reset();
        onClose();
      } catch (err: any) {
        setQuickProductError(
          err.message || "Failed to create external product",
        );
      }
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (initialName) {
        quickProductForm.setFieldValue("name", initialName);
      }
      if (defaultSupplierId) {
        quickProductForm.setFieldValue("supplierId", defaultSupplierId);
      }
    }
  }, [isOpen, initialName, defaultSupplierId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Add External / Shop Product"
      maxWidth="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          quickProductForm.handleSubmit();
        }}
        className="space-y-3.5 text-xs"
      >
        {quickProductError && (
          <div
            className="p-3 rounded-xl text-rose-800 text-xs font-medium"
            style={{
              backgroundColor: "#fff1f2",
              border: "1px solid #fda4af",
            }}
          >
            {quickProductError}
          </div>
        )}

        <div
          className="p-2.5 rounded-xl text-slate-700 text-xs"
          style={{
            backgroundColor: "#f4f7fb",
            border: "1px solid #cbd5e1",
          }}
        >
          <span className="font-medium text-slate-800 block">
            External Shop Product
          </span>
          Register a material or item purchased from an external shop, vendor,
          or marketplace to inventory.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <quickProductForm.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                !value.trim() ? "Product Name is required" : undefined,
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                label="Product / Material Name *"
                placeholder="e.g., Dulux Eggshell White 5L"
                required
              />
            )}
          </quickProductForm.Field>

          <quickProductForm.Field name="brand">
            {(field) => (
              <FormInput
                field={field}
                label="Brand / Manufacturer"
                placeholder="e.g., Dulux, Jotun, Bosch, Saint-Gobain"
              />
            )}
          </quickProductForm.Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <quickProductForm.Field name="supplierSku">
            {(field) => (
              <FormInput
                field={field}
                label="Shop Reference / Vendor Part #"
                placeholder="e.g., DLX-EGG-5L or Barcode"
              />
            )}
          </quickProductForm.Field>

          <quickProductForm.Field name="originCompany">
            {(field) => (
              <FormInput
                field={field}
                label="Shop / Vendor Company Name"
                placeholder="e.g., Al Gurg Building Materials LLC"
              />
            )}
          </quickProductForm.Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <quickProductForm.Field name="unit">
            {(field) => (
              <FormSelect field={field} label="Unit of Measure *">
                <option value="PCS">PCS (Pieces)</option>
                <option value="SQM">SQM (Square Meters)</option>
                <option value="LM">LM (Linear Meters)</option>
                <option value="BOX">BOX</option>
                <option value="SET">SET</option>
                <option value="KG">KG</option>
                <option value="ROLL">ROLL</option>
                <option value="PACK">PACK</option>
                <option value="LTR">LTR (Liters)</option>
                <option value="CAN">CAN</option>
                <option value="SHEET">SHEET</option>
              </FormSelect>
            )}
          </quickProductForm.Field>

          <quickProductForm.Field name="costPrice">
            {(field) => (
              <FormInput
                field={field}
                label="Cost Price (AED) *"
                type="number"
                step="0.01"
                placeholder="0.00"
              />
            )}
          </quickProductForm.Field>

          <quickProductForm.Field name="type">
            {(field) => (
              <FormSelect field={field} label="Product Type">
                <option value="RAW_MATERIAL">Raw Material</option>
                <option value="CONSUMABLE">Consumable</option>
                <option value="TOOL_EQUIPMENT">Tool / Equipment</option>
                <option value="FINISHED_GOOD">Finished Good</option>
              </FormSelect>
            )}
          </quickProductForm.Field>
        </div>

        <quickProductForm.Field name="description">
          {(field) => (
            <FormTextarea
              field={field}
              label="Product Details / Specifications"
              rows={2}
              placeholder="Grade, dimensions, color code, shop warranty..."
            />
          )}
        </quickProductForm.Field>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <FormSubmit
            form={quickProductForm}
            loading={createProduct.isPending}
            className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-medium cursor-pointer"
          >
            Create &amp; Add to PO
          </FormSubmit>
        </div>
      </form>
    </Modal>
  );
};

export default QuickAddProductModal;
