"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { Modal, Button, FormSelect, FormSubmit } from "@/components/ui";
import { PurchaseOrder, Warehouse } from "@/lib/hooks/api-hooks";
import { useCreateWarehouse } from "@/lib/hooks/inventory-hooks";
import { PlusIcon } from "@/components/icons";
import { toast } from "@/lib/toast";

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
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [newWhName, setNewWhName] = useState("");
  const [newWhCode, setNewWhCode] = useState("");
  const [newWhLocation, setNewWhLocation] = useState("");
  const [isCreatingWh, setIsCreatingWh] = useState(false);

  const createWarehouse = useCreateWarehouse();

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
      const currentVal = receiveForm.getFieldValue("receiveWarehouseId");
      if (!currentVal || !warehouses.some((w) => w.id === currentVal)) {
        receiveForm.setFieldValue("receiveWarehouseId", warehouses[0].id);
      }
    }
  }, [po, warehouses, receiveForm]);

  const handleCreateWarehouse = async () => {
    if (!newWhName.trim()) {
      toast.error("Please enter warehouse name");
      return;
    }
    setIsCreatingWh(true);
    try {
      const autoCode = newWhCode.trim()
        ? newWhCode.trim().toUpperCase()
        : `WH-${Date.now().toString().slice(-4)}`;
      const created = await createWarehouse.mutateAsync({
        name: newWhName.trim(),
        code: autoCode,
        location: newWhLocation.trim() || undefined,
      });
      toast.success(`Warehouse "${created.name}" created`);
      receiveForm.setFieldValue("receiveWarehouseId", created.id);
      setShowAddWarehouse(false);
      setNewWhName("");
      setNewWhCode("");
      setNewWhLocation("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create warehouse");
    } finally {
      setIsCreatingWh(false);
    }
  };

  const handleAutoProvisionDefault = async () => {
    setIsCreatingWh(true);
    try {
      const created = await createWarehouse.mutateAsync({
        code: "WH-DXB-01",
        name: "Main Central Warehouse",
        location: "Al Quoz Industrial Area 3, Dubai",
      });
      toast.success("Main Central Warehouse created");
      receiveForm.setFieldValue("receiveWarehouseId", created.id);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create warehouse");
    } finally {
      setIsCreatingWh(false);
    }
  };

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
        className="space-y-4 text-xs"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              Destination Warehouse <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowAddWarehouse(!showAddWarehouse)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
            >
              <PlusIcon size={12} />
              {showAddWarehouse ? "Close Form" : "New Warehouse"}
            </button>
          </div>

          {showAddWarehouse && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="font-semibold text-slate-800 text-xs block">
                Register New Warehouse / Site Store
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Facility Name (e.g. Al Quoz Main)"
                  value={newWhName}
                  onChange={(e) => setNewWhName(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Code (e.g. WH-DXB-02)"
                  value={newWhCode}
                  onChange={(e) => setNewWhCode(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 uppercase"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Location / Address (Optional)"
                  value={newWhLocation}
                  onChange={(e) => setNewWhLocation(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  disabled={isCreatingWh || !newWhName.trim()}
                  onClick={handleCreateWarehouse}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingWh ? "Saving..." : "Save Warehouse"}
                </button>
              </div>
            </div>
          )}

          {warehouses.length === 0 ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-amber-800 text-xs font-medium">
                No active warehouses found.
              </span>
              <button
                type="button"
                onClick={handleAutoProvisionDefault}
                disabled={isCreatingWh}
                className="text-xs font-semibold px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer"
              >
                {isCreatingWh ? "Creating..." : "+ Auto-Create Main Warehouse"}
              </button>
            </div>
          ) : (
            <receiveForm.Field
              name="receiveWarehouseId"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Destination warehouse is required" : undefined,
              }}
            >
              {(field) => (
                <FormSelect field={field} required>
                  <option value="" disabled>
                    -- Select Destination Warehouse --
                  </option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                      {w.location ? ` — ${w.location}` : ""}
                    </option>
                  ))}
                </FormSelect>
              )}
            </receiveForm.Field>
          )}
        </div>

        {po && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <span className="font-bold text-slate-700 block">
              Items in this shipment:
            </span>
            {po.items.map((it) => (
              <div
                key={it.id}
                className="flex justify-between items-center text-slate-600 py-0.5 border-b border-slate-100 last:border-b-0"
              >
                <span>
                  {it.product?.name}{" "}
                  {it.product?.brand ? `[${it.product.brand}]` : ""}
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {it.quantityOrdered} {it.product?.unit || "units"}
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
