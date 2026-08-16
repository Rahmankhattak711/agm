"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useDeletePurchaseOrder,
  useProducts,
  useSuppliers,
  useWarehouses,
  PurchaseOrder,
  PurchaseOrderStatus,
} from "@/lib/hooks/api-hooks";
import {
  Button,
  Input,
  Select,
  Textarea,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  DataTable,
  Modal,
} from "@/components/ui";

interface ItemRow {
  productId: string;
  quantityOrdered: string;
  unitCost: string;
}

export default function PurchaseOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [receiveModalPO, setReceiveModalPO] = useState<PurchaseOrder | null>(null);
  const [receiveWarehouseId, setReceiveWarehouseId] = useState("");

  // Create form
  const [poNumber, setPoNumber] = useState(`PO-${Date.now().toString().slice(-4)}`);
  const [supplierId, setSupplierId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([{ productId: "", quantityOrdered: "1", unitCost: "0" }]);
  const [formError, setFormError] = useState("");

  const { data: purchaseOrders = [], isLoading, error } = usePurchaseOrders({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    supplierId: supplierFilter || undefined,
  });

  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();

  const createPO = useCreatePurchaseOrder();
  const updatePO = useUpdatePurchaseOrder();
  const deletePO = useDeletePurchaseOrder();

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Metrics
  const totalPOs = purchaseOrders.length;
  const draftCount = purchaseOrders.filter((p) => p.status === "DRAFT").length;
  const orderedCount = purchaseOrders.filter((p) => p.status === "ORDERED").length;
  const receivedCount = purchaseOrders.filter((p) => p.status === "RECEIVED").length;
  const totalPurchasesValue = purchaseOrders
    .filter((p) => p.status !== "CANCELLED")
    .reduce((acc, p) => acc + Number(p.totalAmount || 0), 0);

  const addItemRow = () => {
    setItems([...items, { productId: "", quantityOrdered: "1", unitCost: "0" }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItemRow = (index: number, field: keyof ItemRow, value: string) => {
    const next = [...items];
    next[index][field] = value;

    if (field === "productId") {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        next[index].unitCost = prod.costPrice.toString();
      }
    }

    setItems(next);
  };

  const calculateTotal = () => {
    return items.reduce((acc, it) => {
      const q = Number(it.quantityOrdered || 0);
      const c = Number(it.unitCost || 0);
      return acc + q * c;
    }, 0);
  };

  const handleOpenCreate = () => {
    setPoNumber(`PO-${Date.now().toString().slice(-4)}`);
    setSupplierId(suppliers.length > 0 ? suppliers[0].id : "");
    setOrderDate(new Date().toISOString().split("T")[0]);
    setExpectedDate("");
    setNotes("");
    setItems([{ productId: "", quantityOrdered: "1", unitCost: "0" }]);
    setFormError("");
    setIsCreateOpen(true);
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!poNumber.trim() || !supplierId || items.length === 0) {
      setFormError("PO number, supplier, and items are required.");
      return;
    }

    for (const it of items) {
      if (!it.productId) {
        setFormError("Please select a product for all item rows.");
        return;
      }
    }

    try {
      await createPO.mutateAsync({
        poNumber: poNumber.trim().toUpperCase(),
        supplierId,
        orderDate,
        expectedDate: expectedDate || undefined,
        status: "DRAFT",
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          quantityOrdered: Number(it.quantityOrdered),
          unitCost: Number(it.unitCost),
        })),
      });

      setIsCreateOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to create PO");
    }
  };

  const handleReceiveGoods = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveModalPO || !receiveWarehouseId) return;

    await updatePO.mutateAsync({
      id: receiveModalPO.id,
      status: "RECEIVED",
      warehouseIdToReceive: receiveWarehouseId,
    });

    setReceiveModalPO(null);
  };

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            Draft
          </span>
        );
      case "ORDERED":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Ordered
          </span>
        );
      case "RECEIVED":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Received
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<PurchaseOrder>[]>(
    () => [
      {
        accessorKey: "poNumber",
        header: "PO Number",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-800">
            {row.original.poNumber}
          </span>
        ),
      },
      {
        accessorKey: "supplier",
        header: "Supplier",
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-slate-900 block">
              {row.original.supplier?.name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              TRN: {row.original.supplier?.trn || "N/A"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "orderDate",
        header: "Order Date",
        cell: ({ row }) => (
          <span className="text-slate-600">
            {new Date(row.original.orderDate).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        accessorKey: "expectedDate",
        header: "Expected Date",
        cell: ({ row }) => (
          <span className="text-slate-600">
            {row.original.expectedDate
              ? new Date(row.original.expectedDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "-"}
          </span>
        ),
      },
      {
        accessorKey: "items",
        header: "Items",
        cell: ({ row }) => (
          <div className="text-center">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
              {row.original.items.length} items
            </span>
          </div>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Total Amount",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-900 block text-right">
            {formatCurrency(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="text-center">{getStatusBadge(row.original.status)}</div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            {row.original.status === "DRAFT" && (
              <Button
                variant="secondary"
                size="sm"
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                onClick={() =>
                  updatePO.mutateAsync({ id: row.original.id, status: "ORDERED" })
                }
              >
                Mark Ordered
              </Button>
            )}

            {row.original.status === "ORDERED" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setReceiveModalPO(row.original);
                  if (warehouses.length > 0) setReceiveWarehouseId(warehouses[0].id);
                }}
              >
                Receive Stock
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPO(row.original)}
            >
              View
            </Button>

            {(row.original.status === "DRAFT" || row.original.status === "CANCELLED") && (
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  if (confirm(`Delete Purchase Order "${row.original.poNumber}"?`)) {
                    await deletePO.mutateAsync(row.original.id);
                  }
                }}
              >
                Delete
              </Button>
            )}
          </div>
        ),
      },
    ],
    [deletePO, updatePO, warehouses]
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Purchase Orders & Goods Receiving</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Issue vendor purchase orders, track shipment fulfillment, and receive items directly into warehouses.
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
          Create Purchase Order
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Orders</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalPOs}</p>
          <p className="text-xs text-slate-500 mt-0.5">All vendor purchase orders</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending / In Transit</p>
          <p className="text-2xl font-black text-blue-700 mt-1">{orderedCount + draftCount}</p>
          <p className="text-xs text-blue-600 mt-0.5">{orderedCount} active with vendor</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Received Stock</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">{receivedCount}</p>
          <p className="text-xs text-slate-500 mt-0.5">Inventory fulfilled</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total PO Volume</p>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{formatCurrency(totalPurchasesValue)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Gross procurement</p>
        </div>
      </div>

      {/* Filter and TanStack Table Container */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ORDERED">Ordered</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>

          <Select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="w-52"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.supplierCode})
              </option>
            ))}
          </Select>
        </div>

        {/* TanStack Table Render */}
        {error ? (
          <div className="py-8 text-center text-xs text-red-500">Error loading POs: {(error as any).message}</div>
        ) : (
          <DataTable
            columns={columns}
            data={purchaseOrders}
            isLoading={isLoading}
            emptyTitle="No purchase orders found"
            emptyMessage='Click "Create Purchase Order" to begin vendor procurement.'
          />
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Purchase Order"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreatePO} className="space-y-3.5">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="PO Number *"
              required
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="font-mono font-bold uppercase"
            />

            <Select
              label="Supplier *"
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.supplierCode})
                </option>
              ))}
            </Select>

            <Input
              label="Order Date *"
              type="date"
              required
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
            />
          </div>

          {/* Line Items Container */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase">PO Line Items</span>
              <button
                type="button"
                onClick={addItemRow}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                + Add Item
              </button>
            </div>

            {items.map((row, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                <Select
                  required
                  value={row.productId}
                  onChange={(e) => updateItemRow(idx, "productId", e.target.value)}
                  className="w-full sm:flex-1 py-1.5"
                >
                  <option value="">-- Select Product --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </Select>

                <Input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  required
                  value={row.quantityOrdered}
                  onChange={(e) => updateItemRow(idx, "quantityOrdered", e.target.value)}
                  className="w-full sm:w-20 py-1.5"
                />

                <Input
                  type="number"
                  step="0.01"
                  placeholder="Cost"
                  required
                  value={row.unitCost}
                  onChange={(e) => updateItemRow(idx, "unitCost", e.target.value)}
                  className="w-full sm:w-24 py-1.5"
                />

                <div className="w-20 text-right font-mono font-bold text-xs text-slate-800">
                  AED {(Number(row.quantityOrdered || 0) * Number(row.unitCost || 0)).toFixed(2)}
                </div>

                <button
                  type="button"
                  onClick={() => removeItemRow(idx)}
                  disabled={items.length === 1}
                  className="text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer px-1"
                >
                  ✕
                </button>
              </div>
            ))}

            <div className="text-right text-xs font-black text-slate-900 pt-1">
              Total Amount: AED {calculateTotal().toFixed(2)}
            </div>
          </div>

          <Textarea
            label="Notes / Instructions"
            rows={2}
            placeholder="Terms, delivery instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPO.isPending}>
              {createPO.isPending ? "Creating..." : "Save Purchase Order"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Receive Modal */}
      <Modal
        isOpen={!!receiveModalPO}
        onClose={() => setReceiveModalPO(null)}
        title={`Receive Goods: ${receiveModalPO?.poNumber || ""}`}
        maxWidth="md"
      >
        <form onSubmit={handleReceiveGoods} className="space-y-3.5">
          <Select
            label="Destination Warehouse *"
            required
            value={receiveWarehouseId}
            onChange={(e) => setReceiveWarehouseId(e.target.value)}
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </Select>

          {receiveModalPO && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-700 block">Items in this shipment:</span>
              {receiveModalPO.items.map((it) => (
                <div key={it.id} className="flex justify-between text-slate-600">
                  <span>{it.product?.name}</span>
                  <span className="font-mono font-semibold">{it.quantityOrdered} {it.product?.unit}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setReceiveModalPO(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updatePO.isPending}>
              {updatePO.isPending ? "Receiving..." : "Confirm & Update Stock"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* PO View Modal */}
      <Modal
        isOpen={!!selectedPO}
        onClose={() => setSelectedPO(null)}
        title={selectedPO ? `Purchase Order Details - ${selectedPO.poNumber}` : ""}
        maxWidth="xl"
      >
        {selectedPO && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">{selectedPO.poNumber}</h3>
                <p className="text-[11px] text-slate-400">Order Date: {new Date(selectedPO.orderDate).toLocaleDateString()}</p>
              </div>
              <div>{getStatusBadge(selectedPO.status)}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Supplier</span>
                <span className="font-bold text-slate-800">{selectedPO.supplier?.name}</span>
                <span className="text-slate-400 block">TRN: {selectedPO.supplier?.trn || "N/A"}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Expected Date</span>
                <span className="font-medium text-slate-700">
                  {selectedPO.expectedDate ? new Date(selectedPO.expectedDate).toLocaleDateString() : "Not specified"}
                </span>
              </div>
            </div>

            <Table>
              <TableHead>
                <TableHeaderCell>Item</TableHeaderCell>
                <TableHeaderCell align="center">Ordered</TableHeaderCell>
                <TableHeaderCell align="center">Received</TableHeaderCell>
                <TableHeaderCell align="right">Unit Cost</TableHeaderCell>
                <TableHeaderCell align="right">Total</TableHeaderCell>
              </TableHead>
              <TableBody>
                {selectedPO.items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-medium text-slate-800">{it.product?.name}</TableCell>
                    <TableCell align="center">{it.quantityOrdered}</TableCell>
                    <TableCell align="center">{it.quantityReceived}</TableCell>
                    <TableCell align="right" className="font-mono">{Number(it.unitCost).toFixed(2)}</TableCell>
                    <TableCell align="right" className="font-mono font-bold">{Number(it.totalCost).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">{selectedPO.notes || ""}</span>
              <span className="text-sm font-black text-slate-900 font-mono">
                Total: AED {Number(selectedPO.totalAmount).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="dark" size="md" onClick={() => setSelectedPO(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
