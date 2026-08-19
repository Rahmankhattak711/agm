"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import {
  useStockMovements,
  useProducts,
  useWarehouses,
  useCreateStockMovement,
  StockMovementType,
  StockMovement,
} from "@/lib/hooks/api-hooks";
import { PlusIcon } from "@/components/icons";
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
  FormInput,
  FormSelect,
  FormTextarea,
  FormSubmit,
} from "@/components/ui";

export default function StockMovementsPage() {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const { data: movements = [], isLoading, error } = useStockMovements({
    productId: selectedProduct || undefined,
    warehouseId: selectedWarehouse || undefined,
    movementType: selectedType !== "ALL" ? selectedType : undefined,
  });

  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();
  const createMovement = useCreateStockMovement();

  const totalMovements = movements.length;
  const inMovements = movements.filter((m) =>
    ["PURCHASE_IN", "ADJUSTMENT_IN", "TRANSFER_IN", "RETURN_IN"].includes(m.movementType)
  ).length;
  const outMovements = movements.filter((m) =>
    ["SALE_OUT", "ADJUSTMENT_OUT", "TRANSFER_OUT", "RETURN_OUT", "PROJECT_CONSUMPTION"].includes(
      m.movementType
    )
  ).length;

  const form = useForm({
    defaultValues: {
      productId: "",
      warehouseId: "",
      movementType: "PURCHASE_IN" as StockMovementType,
      quantity: "1",
      unitCost: "",
      referenceNumber: "",
      notes: "",
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        await createMovement.mutateAsync({
          productId: value.productId,
          warehouseId: value.warehouseId,
          movementType: value.movementType,
          quantity: Number(value.quantity),
          unitCost: value.unitCost ? Number(value.unitCost) : undefined,
          referenceNumber: value.referenceNumber.trim() || undefined,
          notes: value.notes.trim() || undefined,
        });

        setIsModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to record stock movement");
      }
    },
  });

  const handleOpenModal = () => {
    setFormError("");
    form.reset({
      productId: products[0]?.id || "",
      warehouseId: warehouses[0]?.id || "",
      movementType: "PURCHASE_IN",
      quantity: "1",
      unitCost: "",
      referenceNumber: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const getBadge = (type: StockMovementType) => {
    switch (type) {
      case "PURCHASE_IN":
      case "ADJUSTMENT_IN":
      case "RETURN_IN":
      case "TRANSFER_IN":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "SALE_OUT":
      case "PROJECT_CONSUMPTION":
      case "ADJUSTMENT_OUT":
      case "RETURN_OUT":
      case "TRANSFER_OUT":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const columns = useMemo<ColumnDef<StockMovement>[]>(
    () => [
      {
        accessorKey: "movementDate",
        header: "Timestamp",
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-xs font-semibold text-slate-800 block">
              {new Date(row.original.movementDate).toLocaleDateString()}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {new Date(row.original.movementDate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "product",
        header: "Product / Material",
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-slate-900 block">
              {row.original.product?.name || "Product"}
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              SKU: {row.original.product?.sku || "N/A"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "warehouse",
        header: "Storage Depot",
        cell: ({ row }) => (
          <span className="font-medium text-slate-700">
            {row.original.warehouse?.name || "Main Depot"}
          </span>
        ),
      },
      {
        accessorKey: "movementType",
        header: "Movement Category",
        cell: ({ row }) => (
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getBadge(
              row.original.movementType
            )}`}
          >
            {row.original.movementType.replace("_", " ")}
          </span>
        ),
      },
      {
        accessorKey: "quantity",
        header: "Quantity Delta",
        cell: ({ row }) => {
          const isIn = [
            "PURCHASE_IN",
            "ADJUSTMENT_IN",
            "TRANSFER_IN",
            "RETURN_IN",
          ].includes(row.original.movementType);
          return (
            <span
              className={`font-mono font-black text-xs ${
                isIn ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {isIn ? "+" : "-"} {Number(row.original.quantity).toLocaleString()}{" "}
              <span className="text-[10px] text-slate-400 font-normal">
                {row.original.product?.unit || "PCS"}
              </span>
            </span>
          );
        },
      },
      {
        accessorKey: "referenceNumber",
        header: "Reference / Project",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-600">
            {row.original.referenceNumber || <span className="text-slate-300">-</span>}
          </span>
        ),
      },
      {
        accessorKey: "creator",
        header: "Logged By",
        cell: ({ row }) => (
          <span className="text-xs text-slate-500">
            {row.original.creator?.fullName || "System"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Stock Movements & Audit Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable physical inventory log for warehouse adjustments, site deliveries, and material receipts.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenModal}
          icon={<PlusIcon className="w-4 h-4" strokeWidth={2.2} />}
        >
          Record Stock Movement
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Transactions</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalMovements}</p>
          <p className="text-xs text-slate-500 mt-0.5">Logged inventory transfers</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Inbound Inflow (+)</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{inMovements}</p>
          <p className="text-xs text-slate-500 mt-0.5">Purchases, audits, returns in</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Outbound Consumption (-)</p>
          <p className="text-2xl font-black text-rose-800 mt-1">{outMovements}</p>
          <p className="text-xs text-slate-500 mt-0.5">Site usage, sales, write-offs</p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2.5 w-full">
            <Select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full sm:w-56"
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </Select>

            <Select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>

            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="ALL">All Types</option>
              <option value="PURCHASE_IN">Purchase In (+)</option>
              <option value="PROJECT_CONSUMPTION">Project Consumption (-)</option>
              <option value="SALE_OUT">Sale Out (-)</option>
              <option value="ADJUSTMENT_IN">Adjustment In (+)</option>
              <option value="ADJUSTMENT_OUT">Adjustment Out (-)</option>
              <option value="TRANSFER_IN">Transfer In (+)</option>
              <option value="TRANSFER_OUT">Transfer Out (-)</option>
            </Select>
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-red-500">
            Error loading audit trail: {(error as any).message}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={movements}
            isLoading={isLoading}
            emptyTitle="No stock movements logged"
            emptyMessage='Click "Record Stock Movement" to log adjustments or purchases.'
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Stock Movement / Adjustment"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-3.5"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <form.Field
            name="productId"
            validators={{
              onChange: ({ value }) => (!value ? "Product selection is required" : undefined),
            }}
          >
            {(field) => (
              <FormSelect field={field} label="Product *" required>
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) - {p.totalOnHand ?? 0} {p.unit} in stock
                  </option>
                ))}
              </FormSelect>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-3">
            <form.Field
              name="warehouseId"
              validators={{
                onChange: ({ value }) => (!value ? "Warehouse selection is required" : undefined),
              }}
            >
              {(field) => (
                <FormSelect field={field} label="Warehouse *" required>
                  <option value="">-- Select Warehouse --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </FormSelect>
              )}
            </form.Field>

            <form.Field name="movementType">
              {(field) => (
                <FormSelect field={field} label="Movement Type *">
                  <option value="PURCHASE_IN">Purchase In (+)</option>
                  <option value="PROJECT_CONSUMPTION">Project Site Consumption (-)</option>
                  <option value="SALE_OUT">Sale Out (-)</option>
                  <option value="ADJUSTMENT_IN">Adjustment In (+)</option>
                  <option value="ADJUSTMENT_OUT">Adjustment Out (-)</option>
                  <option value="TRANSFER_IN">Transfer In (+)</option>
                  <option value="TRANSFER_OUT">Transfer Out (-)</option>
                </FormSelect>
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <form.Field
              name="quantity"
              validators={{
                onChange: ({ value }) =>
                  !value || Number(value) <= 0 ? "Quantity must be greater than 0" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Quantity *"
                  type="number"
                  min="0.01"
                  step="any"
                  required
                />
              )}
            </form.Field>

            <form.Field name="unitCost">
              {(field) => (
                <FormInput
                  field={field}
                  label="Unit Cost (AED)"
                  type="number"
                  step="0.01"
                  placeholder="Optional"
                />
              )}
            </form.Field>
          </div>

          <form.Field name="referenceNumber">
            {(field) => (
              <FormInput
                field={field}
                label="Reference # (PO / Project #)"
                type="text"
                placeholder="e.g. PO-0042 or Site Villa 88"
              />
            )}
          </form.Field>

          <form.Field name="notes">
            {(field) => (
              <FormTextarea
                field={field}
                label="Notes / Description"
                rows={2}
                placeholder="Reason for movement..."
              />
            )}
          </form.Field>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <FormSubmit
              form={form}
              loading={createMovement.isPending}
            >
              Confirm Movement
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
