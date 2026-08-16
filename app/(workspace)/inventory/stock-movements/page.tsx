"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  useStockMovements,
  useProducts,
  useWarehouses,
  useCreateStockMovement,
  StockMovementType,
  StockMovement,
} from "@/lib/hooks/api-hooks";
import {
  Button,
  Input,
  Select,
  Textarea,
  DataTable,
  Modal,
} from "@/components/ui";

export default function StockMovementsPage() {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [movementType, setMovementType] = useState<StockMovementType>("PURCHASE_IN");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const { data: movements = [], isLoading, error } = useStockMovements({
    productId: selectedProduct || undefined,
    warehouseId: selectedWarehouse || undefined,
    movementType: selectedType !== "ALL" ? selectedType : undefined,
  });

  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();
  const createMovement = useCreateStockMovement();

  // Metrics
  const totalMovements = movements.length;
  const inMovements = movements.filter((m) =>
    ["PURCHASE_IN", "ADJUSTMENT_IN", "TRANSFER_IN", "RETURN_IN"].includes(m.movementType)
  ).length;
  const outMovements = movements.filter((m) =>
    ["SALE_OUT", "ADJUSTMENT_OUT", "TRANSFER_OUT", "RETURN_OUT", "PROJECT_CONSUMPTION"].includes(
      m.movementType
    )
  ).length;

  const handleOpenModal = () => {
    if (products.length > 0) setProductId(products[0].id);
    if (warehouses.length > 0) setWarehouseId(warehouses[0].id);
    setMovementType("PURCHASE_IN");
    setQuantity("1");
    setUnitCost("");
    setReferenceNumber("");
    setNotes("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!productId || !warehouseId || !quantity) {
      setFormError("Product, warehouse, and quantity are required.");
      return;
    }

    try {
      await createMovement.mutateAsync({
        productId,
        warehouseId,
        movementType,
        quantity: Number(quantity),
        unitCost: unitCost ? Number(unitCost) : undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to record stock movement");
    }
  };

  const getBadge = (type: StockMovementType) => {
    switch (type) {
      case "PURCHASE_IN":
      case "ADJUSTMENT_IN":
      case "RETURN_IN":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {type.replace("_", " ")}
          </span>
        );
      case "SALE_OUT":
      case "ADJUSTMENT_OUT":
      case "PROJECT_CONSUMPTION":
      case "RETURN_OUT":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            {type.replace("_", " ")}
          </span>
        );
      case "TRANSFER_IN":
      case "TRANSFER_OUT":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {type.replace("_", " ")}
          </span>
        );
    }
  };

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<StockMovement>[]>(
    () => [
      {
        accessorKey: "movementDate",
        header: "Date / Time",
        cell: ({ row }) => (
          <div className="whitespace-nowrap text-slate-600">
            <span className="font-semibold text-slate-800 block">
              {new Date(row.original.movementDate).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
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
        header: "Product Name",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-slate-900">
              {row.original.product?.name}
            </div>
            <span className="font-mono text-[10px] text-slate-400">
              {row.original.product?.sku}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "warehouse",
        header: "Warehouse",
        cell: ({ row }) => (
          <span className="text-slate-700 font-medium">
            {row.original.warehouse?.name}
          </span>
        ),
      },
      {
        accessorKey: "movementType",
        header: "Movement Type",
        cell: ({ row }) => getBadge(row.original.movementType),
      },
      {
        accessorKey: "quantity",
        header: "Quantity",
        cell: ({ row }) => (
          <div className="text-center font-mono font-bold text-slate-900">
            {[
              "PURCHASE_IN",
              "ADJUSTMENT_IN",
              "TRANSFER_IN",
              "RETURN_IN",
            ].includes(row.original.movementType)
              ? "+"
              : "-"}
            {row.original.quantity}{" "}
            <span className="text-[10px] text-slate-400 font-normal">
              {row.original.product?.unit}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "referenceNumber",
        header: "Reference / Project",
        cell: ({ row }) =>
          row.original.referenceNumber ? (
            <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-semibold">
              {row.original.referenceNumber}
            </span>
          ) : (
            <span className="text-slate-300">-</span>
          ),
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => (
          <span className="text-slate-600 max-w-xs truncate block">
            {row.original.notes || <span className="text-slate-300">-</span>}
          </span>
        ),
      },
      {
        accessorKey: "creator",
        header: "Logged By",
        cell: ({ row }) => (
          <span className="text-slate-500 text-[11px] block text-right">
            {row.original.creator?.fullName || "System"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Stock Movements & Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete transaction ledger for material receipts, project site consumption, and inventory transfers.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenModal}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
          }
        >
          Record Stock Movement
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Movements</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalMovements}</p>
          <p className="text-xs text-slate-500 mt-0.5">Logged inventory transactions</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Inbound Receipts (+)</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{inMovements}</p>
          <p className="text-xs text-slate-500 mt-0.5">Purchases, audits & returns</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Outbound Consumed (-)</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{outMovements}</p>
          <p className="text-xs text-slate-500 mt-0.5">Project sites & sales</p>
        </div>
      </div>

      {/* Filter and TanStack Table Container */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-48"
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
            className="w-44"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </Select>

          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-48"
          >
            <option value="ALL">All Movement Types</option>
            <option value="PURCHASE_IN">Purchase In (+)</option>
            <option value="PROJECT_CONSUMPTION">Project Site Consumption (-)</option>
            <option value="SALE_OUT">Sale Out (-)</option>
            <option value="ADJUSTMENT_IN">Adjustment In (+)</option>
            <option value="ADJUSTMENT_OUT">Adjustment Out (-)</option>
            <option value="TRANSFER_IN">Transfer In (+)</option>
            <option value="TRANSFER_OUT">Transfer Out (-)</option>
          </Select>
        </div>

        {/* TanStack Table Render */}
        {error ? (
          <div className="py-8 text-center text-xs text-red-500">Error loading movements: {(error as any).message}</div>
        ) : (
          <DataTable
            columns={columns}
            data={movements}
            isLoading={isLoading}
            emptyTitle="No movement records found"
            emptyMessage='Click "Record Stock Movement" to log your first inventory event.'
          />
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Stock Movement" maxWidth="lg">
        <form onSubmit={handleRecord} className="space-y-3.5">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <Select
            label="Product *"
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku}) - {p.totalOnHand ?? 0} {p.unit} in stock
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Warehouse *"
              required
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </Select>

            <Select
              label="Movement Type *"
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as StockMovementType)}
            >
              <option value="PURCHASE_IN">Purchase In (+)</option>
              <option value="PROJECT_CONSUMPTION">Project Site Consumption (-)</option>
              <option value="SALE_OUT">Sale Out (-)</option>
              <option value="ADJUSTMENT_IN">Adjustment In (+)</option>
              <option value="ADJUSTMENT_OUT">Adjustment Out (-)</option>
              <option value="TRANSFER_IN">Transfer In (+)</option>
              <option value="TRANSFER_OUT">Transfer Out (-)</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity *"
              type="number"
              min="0.01"
              step="any"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <Input
              label="Unit Cost (AED)"
              type="number"
              step="0.01"
              placeholder="Optional"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
            />
          </div>

          <Input
            label="Reference # (PO / Project #)"
            type="text"
            placeholder="e.g. PO-0042 or Site Villa 88"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />

          <Textarea
            label="Notes / Description"
            rows={2}
            placeholder="Reason for movement..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMovement.isPending}>
              {createMovement.isPending ? "Logging..." : "Confirm Movement"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
