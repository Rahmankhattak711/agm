"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useProductCategories,
  useSuppliers,
  useWarehouses,
  useCreateStockMovement,
  Product,
  ProductType,
} from "@/lib/hooks/api-hooks";
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
} from "@/components/ui";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustStockProduct, setAdjustStockProduct] = useState<Product | null>(null);

  // Form states
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ProductType>("RAW_MATERIAL");
  const [unit, setUnit] = useState("PCS");
  const [barcode, setBarcode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [costPrice, setCostPrice] = useState("0");
  const [sellingPrice, setSellingPrice] = useState("0");
  const [reorderLevel, setReorderLevel] = useState("10");
  const [reorderQty, setReorderQty] = useState("50");
  const [initialWarehouseId, setInitialWarehouseId] = useState("");
  const [initialQuantity, setInitialQuantity] = useState("0");
  const [formError, setFormError] = useState("");

  // Stock Adjustment Form states
  const [adjustWarehouseId, setAdjustWarehouseId] = useState("");
  const [adjustMovementType, setAdjustMovementType] = useState<"ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "PROJECT_CONSUMPTION">("ADJUSTMENT_IN");
  const [adjustQty, setAdjustQty] = useState("1");
  const [adjustNotes, setAdjustNotes] = useState("");

  const { data: products = [], isLoading, error } = useProducts({
    categoryId: selectedCategory !== "ALL" ? selectedCategory : undefined,
    type: selectedType !== "ALL" ? selectedType : undefined,
    search: search || undefined,
  });

  const { data: categories = [] } = useProductCategories();
  const { data: suppliers = [] } = useSuppliers();
  const { data: warehouses = [] } = useWarehouses();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createMovement = useCreateStockMovement();

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Metrics
  const totalProducts = products.length;
  const totalStockItems = products.reduce((acc, p) => acc + (p.totalOnHand || 0), 0);
  const lowStockCount = products.filter((p) => p.isLowStock).length;
  const totalInventoryValue = products.reduce(
    (acc, p) => acc + (p.totalOnHand || 0) * Number(p.costPrice || 0),
    0
  );

  const resetForm = () => {
    setSku("");
    setName("");
    setDescription("");
    setType("RAW_MATERIAL");
    setUnit("PCS");
    setBarcode("");
    setCategoryId("");
    setSupplierId("");
    setCostPrice("0");
    setSellingPrice("0");
    setReorderLevel("10");
    setReorderQty("50");
    setInitialWarehouseId("");
    setInitialQuantity("0");
    setEditingProduct(null);
    setFormError("");
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setSku(p.sku);
    setName(p.name);
    setDescription(p.description || "");
    setType(p.type);
    setUnit(p.unit);
    setBarcode(p.barcode || "");
    setCategoryId(p.categoryId || "");
    setSupplierId(p.supplierId || "");
    setCostPrice(p.costPrice.toString());
    setSellingPrice(p.sellingPrice.toString());
    setReorderLevel(p.reorderLevel.toString());
    setReorderQty(p.reorderQty.toString());
    setFormError("");
    setIsCreateOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!sku.trim() || !name.trim()) {
      setFormError("SKU and Name are required.");
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          sku: sku.trim(),
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          unit: unit.trim() || "PCS",
          barcode: barcode.trim() || undefined,
          categoryId: categoryId || null,
          supplierId: supplierId || null,
          costPrice: Number(costPrice),
          sellingPrice: Number(sellingPrice),
          reorderLevel: Number(reorderLevel),
          reorderQty: Number(reorderQty),
        });
      } else {
        await createProduct.mutateAsync({
          sku: sku.trim(),
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          unit: unit.trim() || "PCS",
          barcode: barcode.trim() || undefined,
          categoryId: categoryId || null,
          supplierId: supplierId || null,
          costPrice: Number(costPrice),
          sellingPrice: Number(sellingPrice),
          reorderLevel: Number(reorderLevel),
          reorderQty: Number(reorderQty),
          initialWarehouseId: initialWarehouseId || null,
          initialQuantity: Number(initialQuantity) || 0,
        });
      }

      setIsCreateOpen(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || "Failed to save product");
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustStockProduct || !adjustWarehouseId || !adjustQty) return;

    await createMovement.mutateAsync({
      productId: adjustStockProduct.id,
      warehouseId: adjustWarehouseId,
      movementType: adjustMovementType,
      quantity: Number(adjustQty),
      unitCost: Number(adjustStockProduct.costPrice),
      notes: adjustNotes.trim() || "Stock adjustment",
    });

    setAdjustStockProduct(null);
  };

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "sku",
        header: "SKU / Code",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-800">
            {row.original.sku}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Product Name",
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-slate-900">{row.original.name}</div>
            {row.original.barcode && (
              <span className="text-[10px] text-slate-400 font-mono">
                [{row.original.barcode}]
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Category & Type",
        cell: ({ row }) => (
          <div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
              {row.original.type.replace("_", " ")}
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              {row.original.category?.name || "General"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "costPrice",
        header: "Cost Price",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-700 block text-right">
            {formatCurrency(row.original.costPrice)}
          </span>
        ),
      },
      {
        accessorKey: "sellingPrice",
        header: "Selling Price",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-emerald-800 block text-right">
            {formatCurrency(row.original.sellingPrice)}
          </span>
        ),
      },
      {
        accessorKey: "totalOnHand",
        header: "Stock on Hand",
        cell: ({ row }) => (
          <div className="text-center">
            <span className="font-bold text-slate-900 font-mono text-sm">
              {row.original.totalOnHand ?? 0}
            </span>{" "}
            <span className="text-[10px] text-slate-400">{row.original.unit}</span>
          </div>
        ),
      },
      {
        accessorKey: "isLowStock",
        header: "Status",
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.isLowStock ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Low Stock
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                In Stock
              </span>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAdjustStockProduct(row.original);
                if (warehouses.length > 0) setAdjustWarehouseId(warehouses[0].id);
              }}
            >
              Move
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEdit(row.original)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                if (confirm(`Delete product "${row.original.name}"?`)) {
                  await deleteProduct.mutateAsync(row.original.id);
                }
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [deleteProduct, warehouses]
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Products & Inventory Catalog</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track materials, finished items, warehouse distribution, and automatic low-stock alerts.
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
          Add New Product
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total SKUs</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalProducts}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active catalog items</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stock on Hand</p>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{totalStockItems.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-0.5">Physical items stored</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Low Stock Alerts</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{lowStockCount}</p>
          <p className="text-xs text-amber-700 font-medium mt-0.5">Below reorder trigger</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Valuation at Cost</p>
          <p className="text-2xl font-black text-emerald-800 font-mono mt-1">{formatCurrency(totalInventoryValue)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total holding inventory value</p>
        </div>
      </div>

      {/* Filter and TanStack Table Container */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search SKU, product name, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-40"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-44"
            >
              <option value="ALL">All Types</option>
              <option value="RAW_MATERIAL">Raw Material</option>
              <option value="FINISHED_GOOD">Finished Good</option>
              <option value="CONSUMABLE">Consumable</option>
              <option value="TOOL_EQUIPMENT">Tool & Equipment</option>
            </Select>
          </div>
        </div>

        {/* TanStack Table Render */}
        {error ? (
          <div className="py-8 text-center text-xs text-red-500">Error loading products: {(error as any).message}</div>
        ) : (
          <DataTable
            columns={columns}
            data={products}
            isLoading={isLoading}
            emptyTitle="No products found"
            emptyMessage="Add your first product to start tracking inventory."
          />
        )}
      </div>

      {/* Product Create/Edit Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={editingProduct ? "Edit Product" : "Add New Product"}
        maxWidth="xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-3.5">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="SKU / Code *"
              required
              placeholder="e.g. MAT-WOOD-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="uppercase"
            />
            <Input
              label="Product Name *"
              required
              placeholder="e.g. 18mm MDF Board"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as ProductType)}
            >
              <option value="RAW_MATERIAL">Raw Material</option>
              <option value="FINISHED_GOOD">Finished Good</option>
              <option value="CONSUMABLE">Consumable</option>
              <option value="TOOL_EQUIPMENT">Tool & Equipment</option>
            </Select>

            <Input
              label="Unit of Measure"
              placeholder="PCS, SQM, KG, LTR, BOX"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">-- None --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              label="Supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">-- None --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.supplierCode})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Cost Price (AED)"
              type="number"
              step="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
            <Input
              label="Selling Price (AED)"
              type="number"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Reorder Trigger Level"
              type="number"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
            />
            <Input
              label="Barcode (Optional)"
              placeholder="e.g. 629110000000"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
          </div>

          {!editingProduct && warehouses.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase block">Opening Stock (Optional)</span>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={initialWarehouseId}
                  onChange={(e) => setInitialWarehouseId(e.target.value)}
                >
                  <option value="">-- Select Warehouse --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  placeholder="Opening Qty"
                  value={initialQuantity}
                  onChange={(e) => setInitialQuantity(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
              {createProduct.isPending || updateProduct.isPending ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={!!adjustStockProduct}
        onClose={() => setAdjustStockProduct(null)}
        title={`Stock Movement: ${adjustStockProduct?.name || ""}`}
        maxWidth="md"
      >
        <form onSubmit={handleStockAdjustment} className="space-y-3.5">
          <Select
            label="Warehouse *"
            required
            value={adjustWarehouseId}
            onChange={(e) => setAdjustWarehouseId(e.target.value)}
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </Select>

          <Select
            label="Movement Type"
            value={adjustMovementType}
            onChange={(e) => setAdjustMovementType(e.target.value as any)}
          >
            <option value="ADJUSTMENT_IN">Stock In / Audit (+)</option>
            <option value="ADJUSTMENT_OUT">Stock Out / Damage (-)</option>
            <option value="PROJECT_CONSUMPTION">Project Site Consumption (-)</option>
          </Select>

          <Input
            label={`Quantity (${adjustStockProduct?.unit || "PCS"}) *`}
            type="number"
            min="0.1"
            step="any"
            required
            value={adjustQty}
            onChange={(e) => setAdjustQty(e.target.value)}
          />

          <Input
            label="Notes / Project Reference"
            placeholder="e.g. Project #42 Site installation"
            value={adjustNotes}
            onChange={(e) => setAdjustNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setAdjustStockProduct(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMovement.isPending}>
              {createMovement.isPending ? "Recording..." : "Confirm Movement"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
