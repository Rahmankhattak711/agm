"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  useWarehouses,
  useCreateWarehouse,
  useUpdateWarehouse,
  useDeleteWarehouse,
  Warehouse,
} from "@/lib/hooks/api-hooks";
import { PlusIcon } from "@/components/icons";
import { Button, Modal, FormInput, FormSubmit } from "@/components/ui";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/context/ConfirmContext";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";

export default function WarehousesPage() {
  const { confirm } = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );
  const [formError, setFormError] = useState("");

  const { data: warehouses = [], isLoading, error } = useWarehouses();
  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const deleteWarehouse = useDeleteWarehouse();

  const form = useForm({
    defaultValues: {
      code: `WH-${Date.now().toString().slice(-4)}`,
      name: "",
      location: "",
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        if (editingWarehouse) {
          await updateWarehouse.mutateAsync({
            id: editingWarehouse.id,
            code: value.code.trim(),
            name: value.name.trim(),
            location: value.location.trim() || null,
          });
        } else {
          await createWarehouse.mutateAsync({
            code: value.code.trim(),
            name: value.name.trim(),
            location: value.location.trim() || undefined,
          });
        }
        setIsModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to save warehouse");
      }
    },
  });

  const handleOpenCreate = () => {
    setEditingWarehouse(null);
    setFormError("");
    form.reset({
      code: `WH-${Date.now().toString().slice(-4)}`,
      name: "",
      location: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w: Warehouse) => {
    setEditingWarehouse(w);
    setFormError("");
    form.reset({
      code: w.code,
      name: w.name,
      location: w.location || "",
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Warehouses
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage storage facilities, bin locations, warehouse managers, and
            stock allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<PlusIcon className="w-4 h-4" strokeWidth={2.2} />}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Add Warehouse
          </Button>
        </div>
      </div>

      <ReportKpiGrid cols={3}>
        <ReportKpiCard
          title="1. Total Facilities"
          subtitle="Active depots & sites"
          value={warehouses.length}
          currency={false}
          accentColor="sky"
          footerText="Depots"
        />
        <ReportKpiCard
          title="2. Tracked SKU Positions"
          subtitle="Total inventory storage points"
          value={warehouses.reduce(
            (acc, w) => acc + (w.stockLevels?.length || 0),
            0,
          )}
          currency={false}
          accentColor="emerald"
          valueColor="text-emerald-800"
          footerText="Positions"
        />
        <ReportKpiCard
          title="3. Total Logged Transfers"
          subtitle="Movements recorded"
          value={warehouses.reduce(
            (acc, w) => acc + (w._count?.stockMovements || 0),
            0,
          )}
          currency={false}
          accentColor="slate"
          footerText="Transfers"
        />
      </ReportKpiGrid>

      <div className="hidden print:grid print:grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
            Facilities
          </span>
          <span className="font-mono font-bold text-slate-900">
            {warehouses.length}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold block">
            SKU Positions
          </span>
          <span className="font-mono font-bold text-emerald-800">
            {warehouses.reduce(
              (acc, w) => acc + (w.stockLevels?.length || 0),
              0,
            )}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
            Logged Transfers
          </span>
          <span className="font-mono font-bold text-slate-900">
            {warehouses.reduce(
              (acc, w) => acc + (w._count?.stockMovements || 0),
              0,
            )}
          </span>
        </div>
      </div>

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
            <p className="text-sm font-semibold text-slate-600">
              No warehouses registered
            </p>
            <p className="text-xs mt-1">
              Click &quot;Add Warehouse&quot; to configure your first depot.
            </p>
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
                    <h3 className="font-bold text-slate-900 text-base mt-1.5">
                      {w.name}
                    </h3>
                    {w.location && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {w.location}
                      </p>
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
                        const isConfirmed = await confirm({
                          title: "Delete Warehouse",
                          message: `Are you sure you want to delete warehouse "${w.name}"?`,
                          variant: "danger",
                          confirmText: "Delete",
                        });
                        if (isConfirmed) {
                          try {
                            await deleteWarehouse.mutateAsync(w.id);
                            toast.success(`Warehouse "${w.name}" deleted`);
                          } catch (err: any) {
                            toast.error(
                              err.message || "Failed to delete warehouse",
                            );
                          }
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Stocked SKUs ({w.stockLevels?.length || 0})
                  </div>
                  {w.stockLevels && w.stockLevels.length > 0 ? (
                    <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-xs">
                      {w.stockLevels.map((sl) => (
                        <div
                          key={sl.id}
                          className="flex justify-between text-slate-700"
                        >
                          <span className="truncate max-w-[170px] text-slate-800">
                            {sl.product.name}
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {sl.quantityOnHand} {sl.product.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic block">
                      No items currently stored
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>{w._count?.stockMovements || 0} logged transfers</span>
                <span className="text-emerald-700 font-semibold">
                  Active Depot
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWarehouse ? "Edit Facility" : "Add New Warehouse"}
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-3.5 w-96"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <form.Field
            name="code"
            validators={{
              onChange: ({ value }) =>
                !value.trim() ? "Facility code is required" : undefined,
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                label="Facility Code *"
                required
                placeholder="e.g. WH-DXB-01"
                className="uppercase"
              />
            )}
          </form.Field>

          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                !value.trim() ? "Facility name is required" : undefined,
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                label="Facility Name *"
                required
                placeholder="e.g. Main Workshop & Central Depot"
              />
            )}
          </form.Field>

          <form.Field name="location">
            {(field) => (
              <FormInput
                field={field}
                label="Location / Address"
                placeholder="e.g. Ras Al Khor Industrial 2, Dubai"
              />
            )}
          </form.Field>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <FormSubmit
              form={form}
              loading={createWarehouse.isPending || updateWarehouse.isPending}
            >
              Save Facility
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
