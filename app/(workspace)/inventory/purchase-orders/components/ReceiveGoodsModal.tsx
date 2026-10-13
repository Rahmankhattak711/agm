"use client";

import React, { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { Modal, Button, FormSelect, FormSubmit } from "@/components/ui";
import { PurchaseOrder, Warehouse } from "@/lib/hooks/api-hooks";

export interface ReceiveGoodsModalProps {
  po: PurchaseOrder | null;
  onClose: () => void;
  warehouses: Warehouse[];
  onReceive: (warehouseId: string) => Promise<void>;
  isUpdating?: boolean;
}

export const ReceiveGoodsModal: React.FC<ReceiveGoodsModalProps> = ({
  po,
  onClose,
  warehouses,
  onReceive,
  isUpdating = false,
}) => {
  const receiveForm = useForm({
    defaultValues: {
      receiveWarehouseId: warehouses[0]?.id || "",
    },
    onSubmit: async ({ value }) => {
      if (!po || !value.receiveWarehouseId) return;
      await onReceive(value.receiveWarehouseId);
      onClose();
    },
  });

  useEffect(() => {
    if (po && warehouses.length > 0) {
      receiveForm.reset({
        receiveWarehouseId: warehouses[0]?.id || "",
      });
    }
  }, [po, warehouses, receiveForm]);

  return (
    <Modal
      isOpen={!!po}
      onClose={onClose}
      title={`Receive Goods: ${po?.poNumber || ""}`}
      maxWidth="md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          receiveForm.handleSubmit();
        }}
        className="space-y-3.5 text-xs"
      >
        <receiveForm.Field
          name="receiveWarehouseId"
          validators={{
            onChange: ({ value }) =>
              !value ? "Destination warehouse is required" : undefined,
          }}
        >
          {(field) => (
            <FormSelect field={field} label="Destination Warehouse *" required>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </FormSelect>
          )}
        </receiveForm.Field>

        {po && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-700 block">
              Items in this shipment:
            </span>
            {po.items.map((it) => (
              <div key={it.id} className="flex justify-between text-slate-600">
                <span>
                  {it.product?.name}{" "}
                  {it.product?.brand ? `[${it.product.brand}]` : ""}
                </span>
                <span className="font-mono font-semibold">
                  {it.quantityOrdered} {it.product?.unit}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <FormSubmit
            form={receiveForm}
            loading={isUpdating}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
          >
            Confirm &amp; Update Stock
          </FormSubmit>
        </div>
      </form>
    </Modal>
  );
};

export default ReceiveGoodsModal;
