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
  useCreateProduct,
  useSuppliers,
  useWarehouses,
  PurchaseOrder,
  PurchaseOrderStatus,
  ProductType,
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
  supplierSku?: string;
  itemNotes?: string;
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

  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);
  const [quickProductTargetIdx, setQuickProductTargetIdx] = useState<
    number | null
  >(null);
  const [quickProductError, setQuickProductError] = useState("");

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
  const createProduct = useCreateProduct();

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
        p.shopName?.toLowerCase().includes(q) ||
        p.vendorReference?.toLowerCase().includes(q) ||
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
        await createPO.mutateAsync({
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

        setIsCreateOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to create PO");
      }
    },
  });

  const quickProductForm = useForm({
    defaultValues: {
      name: "",
      brand: "",
      supplierSku: "",
      originCompany: "",
      shopLocation: "",
      type: "RAW_MATERIAL" as ProductType,
      unit: "PCS",
      costPrice: "0",
      sellingPrice: "0",
      supplierId: "",
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
          supplierId:
            value.supplierId || poForm.getFieldValue("supplierId") || null,
          description: value.description.trim() || null,
        });

        // Insert new product into target line item
        const currentItems = poForm.getFieldValue("items") || [];
        if (
          quickProductTargetIdx !== null &&
          currentItems[quickProductTargetIdx]
        ) {
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

        setIsQuickProductOpen(false);
      } catch (err: any) {
        setQuickProductError(
          err.message || "Failed to create external product",
        );
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
    setIsCreateOpen(true);
  };

  const handleOpenQuickProduct = (idx: number | null) => {
    setQuickProductError("");
    setQuickProductTargetIdx(idx);
    const currentSupplierId = poForm.getFieldValue("supplierId");
    const currentSupplier = suppliers.find((s) => s.id === currentSupplierId);

    quickProductForm.reset({
      name: "",
      brand: "",
      supplierSku: "",
      originCompany:
        currentSupplier?.name || poForm.getFieldValue("shopName") || "",
      shopLocation: currentSupplier?.address || "",
      type: "RAW_MATERIAL",
      unit: "PCS",
      costPrice: "0",
      sellingPrice: "0",
      supplierId: currentSupplierId || "",
      description: "",
    });
    setIsQuickProductOpen(true);
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
            {row.original.vendorReference && (
              <span className="text-[10px] text-emerald-700 font-mono font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
                Ref: {row.original.vendorReference}
              </span>
            )}
            {row.original.creator?.fullName && (
              <span className="text-[10px] text-slate-400 font-medium block">
                By {row.original.creator.fullName}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "supplier",
        header: "Vendor / Shop",
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-slate-900 block">
              {row.original.supplier?.name ||
                row.original.shopName ||
                "External Shop"}
            </span>
            {row.original.shopName &&
              row.original.supplier?.name !== row.original.shopName && (
                <span className="text-[11px] text-slate-500 font-medium block">
                  Store: {row.original.shopName}
                </span>
              )}
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
          <div>
            <span className="text-slate-700 text-xs font-semibold block">
              {row.original.items?.length || 0} Products
            </span>
            <span className="text-[10px] text-slate-400">
              {row.original.items?.some(
                (it) => it.product?.brand || it.supplierSku,
              )
                ? "Includes External Items"
                : "Standard Items"}
            </span>
          </div>
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
          const isReceived = row.original.status === "RECEIVED";
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
                icon={<PrintIcon className="w-3.5 h-3.5" />}
                onClick={() => setPrintModalPO(row.original)}
              >
                PDF
              </Button>

              {isDraft && canEdit && (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={updatePO.isPending}
                  onClick={() =>
                    updatePO.mutate({
                      id: row.original.id,
                      status: "ORDERED",
                    })
                  }
                >
                  Send Order
                </Button>
              )}

              {isOrdered && canEdit && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenReceive(row.original)}
                >
                  Receive Stock
                </Button>
              )}

              {isDraft && canEdit && (
                <Button
                  variant="danger"
                  size="sm"
                  loading={deletePO.isPending}
                  onClick={() => {
                    if (
                      confirm(
                        `Are you sure you want to delete PO ${row.original.poNumber}?`,
                      )
                    ) {
                      deletePO.mutate(row.original.id);
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
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Purchase Orders & Procurement
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Procure products from external companies, hardware shops, and
            material suppliers with vendor references.
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
              placeholder="Search PO #, supplier, shop, quote ref..."
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
        maxWidth="3xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            poForm.handleSubmit();
          }}
          className="space-y-4"
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
                <FormInput
                  field={field}
                  label="Order Date *"
                  type="date"
                  required
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
                <FormInput
                  field={field}
                  label="Expected Delivery Date"
                  type="date"
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
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Procurement Line Items
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Select catalog products or click quick add to register
                        items bought from other shops.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenQuickProduct(null)}
                        className="text-xs text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                        icon={<PlusIcon className="w-3.5 h-3.5" />}
                      >
                        + New Shop Product
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={addItem}
                        className="text-xs"
                      >
                        + Add Row
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {currentItems.map((row, idx) => {
                      const selectedProduct = products.find(
                        (p) => p.id === row.productId,
                      );
                      return (
                        <div
                          key={idx}
                          className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            <div className="w-full sm:flex-1">
                              <Select
                                required
                                value={row.productId}
                                onChange={(e) =>
                                  updateItem(idx, "productId", e.target.value)
                                }
                                className="w-full py-1.5 text-xs font-medium"
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

                            <button
                              type="button"
                              onClick={() => handleOpenQuickProduct(idx)}
                              title="Create and select a new shop product for this row"
                              className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer"
                            >
                              + New Product
                            </button>

                            <Input
                              type="number"
                              min="0.01"
                              step="any"
                              placeholder="Qty"
                              required
                              value={row.quantityOrdered}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "quantityOrdered",
                                  e.target.value,
                                )
                              }
                              className="w-full sm:w-20 py-1.5 text-xs"
                            />

                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Cost (AED)"
                              required
                              value={row.unitCost}
                              onChange={(e) =>
                                updateItem(idx, "unitCost", e.target.value)
                              }
                              className="w-full sm:w-28 py-1.5 text-xs font-mono"
                            />

                            <div className="w-24 text-right font-mono font-bold text-xs text-slate-900">
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
                              className="text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer px-1.5 py-1"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                            <Input
                              placeholder="Shop / Vendor Item Code / Reference (Optional)"
                              value={row.supplierSku || ""}
                              onChange={(e) =>
                                updateItem(idx, "supplierSku", e.target.value)
                              }
                              className="py-1 text-[11px] bg-slate-50/50"
                            />
                            <Input
                              placeholder="Item notes / specifications (e.g., Color 9010, 5L Can, Stainless 304)"
                              value={row.itemNotes || ""}
                              onChange={(e) =>
                                updateItem(idx, "itemNotes", e.target.value)
                              }
                              className="py-1 text-[11px] bg-slate-50/50"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-slate-800 pt-2 border-t border-slate-200">
                    <span className="text-slate-500">
                      {currentItems.length} line item(s) configured
                    </span>
                    <span className="font-mono text-sm text-emerald-900 font-black">
                      Total Order Amount: AED {totalAmount.toFixed(2)}
                    </span>
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
        isOpen={isQuickProductOpen}
        onClose={() => setIsQuickProductOpen(false)}
        title="Quick Add External / Shop Product"
        maxWidth="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            quickProductForm.handleSubmit();
          }}
          className="space-y-3.5"
        >
          {quickProductError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {quickProductError}
            </div>
          )}

          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 text-xs">
            <span className="font-bold block">💡 External Shop Product</span>
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

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsQuickProductOpen(false)}
            >
              Cancel
            </Button>
            <FormSubmit
              form={quickProductForm}
              loading={createProduct.isPending}
            >
              Create & Add to PO
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
        maxWidth="2xl"
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
                  Vendor / Shop
                </span>
                <span className="font-bold text-slate-800 block">
                  {selectedPO.supplier?.name ||
                    selectedPO.shopName ||
                    "External Vendor"}
                </span>
                {selectedPO.shopName && (
                  <span className="text-slate-500 block">
                    Store: {selectedPO.shopName}
                  </span>
                )}
                <span className="text-slate-400 block">
                  TRN: {selectedPO.supplier?.trn || "N/A"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Vendor Reference & Delivery
                </span>
                {selectedPO.vendorReference && (
                  <span className="font-mono font-bold text-emerald-800 block">
                    Ref: {selectedPO.vendorReference}
                  </span>
                )}
                <span className="font-medium text-slate-700 block">
                  Due:{" "}
                  {selectedPO.expectedDate
                    ? new Date(selectedPO.expectedDate).toLocaleDateString()
                    : "Not specified"}
                </span>
              </div>
            </div>

            <Table>
              <TableHead>
                <TableHeaderCell>Product / Item</TableHeaderCell>
                <TableHeaderCell>Shop Reference</TableHeaderCell>
                <TableHeaderCell align="center">Ordered</TableHeaderCell>
                <TableHeaderCell align="center">Received</TableHeaderCell>
                <TableHeaderCell align="right">Unit Cost</TableHeaderCell>
                <TableHeaderCell align="right">Total</TableHeaderCell>
              </TableHead>
              <TableBody>
                {selectedPO.items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">
                        {it.product?.name}
                      </div>
                      {it.product?.brand && (
                        <div className="text-[10px] text-slate-500">
                          Brand:{" "}
                          <span className="font-medium text-slate-700">
                            {it.product.brand}
                          </span>
                        </div>
                      )}
                      {it.itemNotes && (
                        <div className="text-[10px] text-slate-400 italic">
                          {it.itemNotes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-slate-600">
                        {it.supplierSku || it.product?.supplierSku || "-"}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <span className="font-mono font-bold">
                        {it.quantityOrdered}
                      </span>{" "}
                      <span className="text-[10px] text-slate-400">
                        {it.product?.unit}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <span className="font-mono">{it.quantityReceived}</span>
                    </TableCell>
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
