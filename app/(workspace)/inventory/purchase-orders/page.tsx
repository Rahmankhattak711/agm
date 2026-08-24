"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import { useAuth } from "@/context/AuthContext";
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
import { PlusIcon, SearchIcon, PrintIcon } from "@/components/icons";
import { PurchaseOrderPrintModal } from "./PurchaseOrderPrintModal";
import {
  Button,
  Input,
  Select,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  DataTable,
  Modal,
  FormInput,
  FormSelect,
  FormTextarea,
  FormSubmit,
} from "@/components/ui";

interface ItemRow {
  productId: string;
  quantityOrdered: string;
  unitCost: string;
}

export default function PurchaseOrdersPage() {
  const { canModify } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [printModalPO, setPrintModalPO] = useState<PurchaseOrder | null>(null);
  const [receiveModalPO, setReceiveModalPO] = useState<PurchaseOrder | null>(
    null,
  );
  const [formError, setFormError] = useState("");

  const {
    data: purchaseOrders = [],
    isLoading,
    error,
  } = usePurchaseOrders({
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

  const filteredPOs = useMemo(() => {
    if (!search.trim()) return purchaseOrders;
    const q = search.toLowerCase();
    return purchaseOrders.filter(
      (p) =>
        p.poNumber?.toLowerCase().includes(q) ||
        p.supplier?.name?.toLowerCase().includes(q) ||
        p.supplier?.trn?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q),
    );
  }, [purchaseOrders, search]);

  const totalPOs = purchaseOrders.length;
  const draftCount = purchaseOrders.filter((p) => p.status === "DRAFT").length;
  const orderedCount = purchaseOrders.filter(
    (p) => p.status === "ORDERED",
  ).length;
  const receivedCount = purchaseOrders.filter(
    (p) => p.status === "RECEIVED",
  ).length;
  const totalPurchasesValue = purchaseOrders
    .filter((p) => p.status !== "CANCELLED")
    .reduce((acc, p) => acc + Number(p.totalAmount || 0), 0);

  const poForm = useForm({
    defaultValues: {
      poNumber: `PO-${Date.now().toString().slice(-4)}`,
      supplierId: "",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDate: "",
      notes: "",
      items: [
        { productId: "", quantityOrdered: "1", unitCost: "0" },
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
          setFormError("Please select a product for all item rows.");
          return;
        }
      }

      try {
        await createPO.mutateAsync({
          poNumber: value.poNumber.trim().toUpperCase(),
          supplierId: value.supplierId,
          orderDate: value.orderDate,
          expectedDate: value.expectedDate || undefined,
          status: "DRAFT",
          notes: value.notes.trim() || undefined,
          items: value.items.map((it) => ({
            productId: it.productId,
            quantityOrdered: Number(it.quantityOrdered),
            unitCost: Number(it.unitCost),
          })),
        });

        setIsCreateOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to create PO");
      }
    },
  });

  const receiveForm = useForm({
    defaultValues: {
      receiveWarehouseId: "",
    },
    onSubmit: async ({ value }) => {
      if (!receiveModalPO || !value.receiveWarehouseId) return;

      await updatePO.mutateAsync({
        id: receiveModalPO.id,
        status: "RECEIVED",
        warehouseIdToReceive: value.receiveWarehouseId,
      });

      setReceiveModalPO(null);
    },
  });

  const handleOpenCreate = () => {
    setFormError("");
    poForm.reset({
      poNumber: `PO-${Date.now().toString().slice(-4)}`,
      supplierId: suppliers.length > 0 ? suppliers[0].id : "",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDate: "",
      notes: "",
      items: [{ productId: "", quantityOrdered: "1", unitCost: "0" }],
    });
    setIsCreateOpen(true);
  };

  const handleOpenReceive = (po: PurchaseOrder) => {
    setReceiveModalPO(po);
    receiveForm.reset({
      receiveWarehouseId: warehouses[0]?.id || "",
    });
  };

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
      case "ORDERED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Ordered
          </span>
        );
      case "RECEIVED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Received
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const columns = useMemo<ColumnDef<PurchaseOrder>[]>(
    () => [
      {
        accessorKey: "poNumber",
        header: "PO Number",
        cell: ({ row }) => (
          <div>
            <span className="font-mono font-bold text-slate-900 block">
              {row.original.poNumber}
            </span>
            {row.original.creator?.fullName && (
              <span className="text-[10px] text-slate-400 font-medium">
                By {row.original.creator.fullName}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "supplier",
        header: "Vendor / Supplier",
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-slate-900 block">
              {row.original.supplier?.name}
            </span>
            <span className="font-mono text-[10px] text-slate-500 font-medium">
              TRN: {row.original.supplier?.trn || "N/A"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "orderDate",
        header: "Order Date",
        cell: ({ row }) => (
          <span className="text-slate-600 text-xs font-mono font-medium">
            {new Date(row.original.orderDate).toLocaleDateString("en-GB")}
          </span>
        ),
      },
      {
        accessorKey: "itemsCount",
        header: "Line Items",
        cell: ({ row }) => (
          <span className="text-slate-700 text-xs font-semibold">
            {row.original.items?.length || 0} Products
          </span>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "Total Amount",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-900 text-xs">
            {formatCurrency(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const isDraft = row.original.status === "DRAFT";
          const isOrdered = row.original.status === "ORDERED";
          const canEdit = canModify(row.original.createdBy, [
            "INVENTORY_MANAGER",
          ]);

          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPO(row.original)}
              >
                View
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="text-slate-700 hover:bg-slate-50"
                icon={<PrintIcon className="w-3.5 h-3.5" strokeWidth={2} />}
                onClick={() => setPrintModalPO(row.original)}
              >
                Print
              </Button>

              {!canEdit && (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  View Only
                </span>
              )}

              {canEdit && isDraft && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-700 hover:bg-blue-50"
                  onClick={async () => {
                    await updatePO.mutateAsync({
                      id: row.original.id,
                      status: "ORDERED",
                    });
                  }}
                >
                  Send PO
                </Button>
              )}

              {canEdit && isOrdered && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-emerald-700 hover:bg-emerald-50"
                  onClick={() => handleOpenReceive(row.original)}
                >
                  Receive
                </Button>
              )}

              {canEdit && isDraft && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={async () => {
                    if (
                      confirm(
                        `Cancel and delete PO "${row.original.poNumber}"?`,
                      )
                    ) {
                      await deletePO.mutateAsync(row.original.id);
                    }
                  }}
                >
                  Delete
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [canModify, deletePO, updatePO],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Purchase Orders & Procurement
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage vendor purchase requisitions, approval pipelines, and
            shipment receiving audits.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          icon={<PlusIcon className="w-4 h-4" strokeWidth={2.2} />}
        >
          Create Purchase Order
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Purchase Orders
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalPOs}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            All created procurement orders
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Draft POs
          </p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {draftCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Awaiting supplier issuance
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pending Deliveries
          </p>
          <p className="text-2xl font-black text-blue-700 mt-1">
            {orderedCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Awaiting warehouse receipt
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Procurement Commitments
          </p>
          <p className="text-2xl font-black text-emerald-800 mt-1">
            {formatCurrency(totalPurchasesValue)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Cumulative purchase volume
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="w-full lg:w-80">
            <Input
              placeholder="Search PO number, supplier, TRN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={
                <SearchIcon
                  className="w-4 h-4 text-slate-400"
                  strokeWidth={2}
                />
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              containerClassName="w-full sm:w-44"
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
              containerClassName="w-full sm:w-56"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-red-500">
            Error loading POs: {(error as any).message}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredPOs}
            isLoading={isLoading}
            emptyTitle="No purchase orders found"
            emptyMessage='Click "Create Purchase Order" to register your vendor orders.'
          />
        )}
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Purchase Order"
        maxWidth="2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            poForm.handleSubmit();
          }}
          className="space-y-3.5"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

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
                  className="font-mono font-bold uppercase"
                />
              )}
            </poForm.Field>

            <poForm.Field
              name="supplierId"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Supplier is required" : undefined,
              }}
            >
              {(field) => (
                <FormSelect field={field} label="Supplier *" required>
                  <option value="">-- Select Supplier --</option>
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
                <FormInput
                  field={field}
                  label="Order Date *"
                  type="date"
                  required
                />
              )}
            </poForm.Field>
          </div>

          <poForm.Field name="items">
            {(itemsField) => {
              const currentItems = itemsField.state.value;

              const addItem = () => {
                itemsField.handleChange([
                  ...currentItems,
                  { productId: "", quantityOrdered: "1", unitCost: "0" },
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
                    next[index].unitCost = prod.costPrice.toString();
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
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase">
                      PO Line Items
                    </span>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                    >
                      + Add Item
                    </button>
                  </div>

                  {currentItems.map((row, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded-lg border border-slate-200"
                    >
                      <Select
                        required
                        value={row.productId}
                        onChange={(e) =>
                          updateItem(idx, "productId", e.target.value)
                        }
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
                        onChange={(e) =>
                          updateItem(idx, "quantityOrdered", e.target.value)
                        }
                        className="w-full sm:w-20 py-1.5"
                      />

                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Cost"
                        required
                        value={row.unitCost}
                        onChange={(e) =>
                          updateItem(idx, "unitCost", e.target.value)
                        }
                        className="w-full sm:w-24 py-1.5"
                      />

                      <div className="w-20 text-right font-mono font-bold text-xs text-slate-800">
                        AED{" "}
                        {(
                          Number(row.quantityOrdered || 0) *
                          Number(row.unitCost || 0)
                        ).toFixed(2)}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={currentItems.length === 1}
                        className="text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <div className="text-right text-xs font-black text-slate-900 pt-1">
                    Total Amount: AED {totalAmount.toFixed(2)}
                  </div>
                </div>
              );
            }}
          </poForm.Field>

          <poForm.Field name="notes">
            {(field) => (
              <FormTextarea
                field={field}
                label="Notes / Instructions"
                rows={2}
                placeholder="Terms, delivery instructions..."
              />
            )}
          </poForm.Field>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <FormSubmit form={poForm} loading={createPO.isPending}>
              Save Purchase Order
            </FormSubmit>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!receiveModalPO}
        onClose={() => setReceiveModalPO(null)}
        title={`Receive Goods: ${receiveModalPO?.poNumber || ""}`}
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            receiveForm.handleSubmit();
          }}
          className="space-y-3.5"
        >
          <receiveForm.Field
            name="receiveWarehouseId"
            validators={{
              onChange: ({ value }) =>
                !value ? "Destination warehouse is required" : undefined,
            }}
          >
            {(field) => (
              <FormSelect
                field={field}
                label="Destination Warehouse *"
                required
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </FormSelect>
            )}
          </receiveForm.Field>

          {receiveModalPO && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-700 block">
                Items in this shipment:
              </span>
              {receiveModalPO.items.map((it) => (
                <div
                  key={it.id}
                  className="flex justify-between text-slate-600"
                >
                  <span>{it.product?.name}</span>
                  <span className="font-mono font-semibold">
                    {it.quantityOrdered} {it.product?.unit}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReceiveModalPO(null)}
            >
              Cancel
            </Button>
            <FormSubmit form={receiveForm} loading={updatePO.isPending}>
              Confirm & Update Stock
            </FormSubmit>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!selectedPO}
        onClose={() => setSelectedPO(null)}
        title={
          selectedPO ? `Purchase Order Details - ${selectedPO.poNumber}` : ""
        }
        maxWidth="xl"
      >
        {selectedPO && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {selectedPO.poNumber}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Order Date:{" "}
                  {new Date(selectedPO.orderDate).toLocaleDateString()}
                </p>
              </div>
              <div>{getStatusBadge(selectedPO.status)}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Supplier
                </span>
                <span className="font-bold text-slate-800">
                  {selectedPO.supplier?.name}
                </span>
                <span className="text-slate-400 block">
                  TRN: {selectedPO.supplier?.trn || "N/A"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Expected Date
                </span>
                <span className="font-medium text-slate-700">
                  {selectedPO.expectedDate
                    ? new Date(selectedPO.expectedDate).toLocaleDateString()
                    : "Not specified"}
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
                    <TableCell className="font-medium text-slate-800">
                      {it.product?.name}
                    </TableCell>
                    <TableCell align="center">{it.quantityOrdered}</TableCell>
                    <TableCell align="center">{it.quantityReceived}</TableCell>
                    <TableCell align="right" className="font-mono">
                      {Number(it.unitCost).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" className="font-mono font-bold">
                      {Number(it.totalCost).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                {selectedPO.notes || ""}
              </span>
              <span className="text-sm font-black text-slate-900 font-mono">
                Total: AED {Number(selectedPO.totalAmount).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedPO(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={<PrintIcon className="w-4 h-4" strokeWidth={2} />}
                onClick={() => {
                  setPrintModalPO(selectedPO);
                }}
              >
                Print / Save PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <PurchaseOrderPrintModal
        isOpen={!!printModalPO}
        onClose={() => setPrintModalPO(null)}
        po={printModalPO}
      />
    </div>
  );
}
