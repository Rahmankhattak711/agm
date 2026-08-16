"use client";

import { useState } from "react";
import {
  useWarehouses,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
  Warehouse,
} from "@/lib/hooks/api-hooks";
import { Button, Input, Modal } from "@/components/ui";

export default function WarehousesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  // Form
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [formError, setFormError] = useState("");

  const { data: warehouses = [], isLoading, error } = useWarehouses();
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const deleteWarehouse = useDeleteWarehouse();

  const resetForm = () => {
    setCode(`WH-${Date.now().toString().slice(-4)}`);
    setName("");
    setLocation("");
    setEditingWarehouse(null);
    setFormError("");
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w: Warehouse) => {
    setEditingWarehouse(w);
    setCode(w.code);
    setName(w.name);
    setLocation(w.location || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!code.trim() || !name.trim()) {
      setFormError("Warehouse code and name are required.");
      return;
    }

    try {
      if (editingWarehouse) {
        await updateWarehouse.mutateAsync({
          id: editingWarehouse.id,
          code: code.trim(),
          name: name.trim(),
          location: location.trim() || null,
        });
      } else {
        await createWarehouse.mutateAsync({
          code: code.trim(),
          name: name.trim(),
          location: location.trim() || undefined,
        });
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || "Failed to save warehouse");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Warehouses & Storage Facilities</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage central material depots, site storage containers, and physical stock distributions.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
          }
        >
          Add Warehouse
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Facilities</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{warehouses.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active depots & sites</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tracked SKU Positions</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">
            {warehouses.reduce((acc, w) => acc + (w.stockLevels?.length || 0), 0)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Total inventory storage points</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Logged Transfers</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {warehouses.reduce((acc, w) => acc + (w._count?.stockMovements || 0), 0)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Movements recorded</p>
        </div>
      </div>

      {/* Warehouse Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400 animate-pulse">
            Loading warehouses...
          </div>
        ) : error ? (
          <div className="col-span-full py-8 text-center text-xs text-red-500">
            Error loading facilities: {(error as any).message}
          </div>
        ) : warehouses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-600">No warehouses registered</p>
            <p className="text-xs mt-1">Click "Add Warehouse" to configure your first depot.</p>
          </div>
        ) : (
          warehouses.map((w) => (
            <div
              key={w.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {w.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1.5">{w.name}</h3>
                    {w.location && (
                      <p className="text-xs text-slate-500 mt-0.5">{w.location}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(w)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={async () => {
                        if (confirm(`Delete warehouse "${w.name}"?`)) {
                          await deleteWarehouse.mutateAsync(w.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Stock on hand list */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Stocked SKUs ({w.stockLevels?.length || 0})
                  </div>
                  {w.stockLevels && w.stockLevels.length > 0 ? (
                    <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-xs">
                      {w.stockLevels.map((sl) => (
                        <div key={sl.id} className="flex justify-between text-slate-700">
                          <span className="truncate max-w-[170px] text-slate-800">{sl.product.name}</span>
                          <span className="font-mono font-bold text-slate-900">
                            {sl.quantityOnHand} {sl.product.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic block">No items currently stored</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>{w._count?.stockMovements || 0} logged transfers</span>
                <span className="text-emerald-700 font-semibold">Active Depot</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWarehouse ? "Edit Facility" : "Add New Warehouse"}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <Input
            label="Facility Code *"
            required
            placeholder="e.g. WH-DXB-01"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="uppercase"
          />

          <Input
            label="Facility Name *"
            required
            placeholder="e.g. Main Workshop & Central Depot"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Location / Address"
            placeholder="e.g. Ras Al Khor Industrial 2, Dubai"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createWarehouse.isPending || updateWarehouse.isPending}>
              {createWarehouse.isPending || updateWarehouse.isPending ? "Saving..." : "Save Facility"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
