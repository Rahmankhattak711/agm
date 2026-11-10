"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import { useAuth } from "@/context/AuthContext";
import ProcurementQuickNav from "@/components/ProcurementQuickNav";
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
import { PlusIcon, SearchIcon } from "@/components/icons";
import { Search } from "lucide-react";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/context/ConfirmContext";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";
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
  PageHeader,
  FilterBar,
  DashboardCard,
  DashboardCardGrid,
} from "@/components/ui";
import { RefreshCw, Package, Plus, ChevronLeft } from "lucide-react";

export default function ProductsPage() {
  const router = useRouter();
  const { hasRole, isAdmin } = useAuth();
  const { confirm } = useConfirm();
  const canManageInventory = hasRole("INVENTORY_MANAGER") || isAdmin || hasRole("ACCOUNTANT");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedOrigin, setSelectedOrigin] = useState<string>("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustStockProduct, setAdjustStockProduct] = useState<Product | null>(
    null,
  );
  const [formError, setFormError] = useState("");

  const {
    data: products = [],
    isLoading,
    isFetching,
    refetch,
    error,
  } = useProducts({
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

  const filteredProducts = useMemo(() => {
    if (selectedOrigin === "ALL") return products;
    return products.filter(
      (p) => (p.productOrigin || "PURCHASED_EXTERNAL") === selectedOrigin,
    );
  }, [products, selectedOrigin]);

  const totalProducts = products.length;
  const totalStockItems = products.reduce(
    (acc, p) => acc + (p.totalOnHand || 0),
    0,
  );
  const lowStockCount = products.filter((p) => p.isLowStock).length;
  const totalInventoryValue = products.reduce(
    (acc, p) => acc + (p.totalOnHand || 0) * Number(p.costPrice || 0),
    0,
  );

  const productForm = useForm({
    defaultValues: {
      sku: "",
      name: "",
      description: "",
      brand: "",
      supplierSku: "",
      originCompany: "",
      shopLocation: "",
      productOrigin: "PURCHASED_EXTERNAL",
      type: "RAW_MATERIAL" as ProductType,
      unit: "PCS",
      barcode: "",
      categoryId: "",
      supplierId: "",
      costPrice: "0",
      sellingPrice: "0",
      reorderLevel: "10",
      reorderQty: "50",
      initialWarehouseId: "",
      initialQuantity: "0",
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        if (editingProduct) {
          await updateProduct.mutateAsync({
            id: editingProduct.id,
            sku: value.sku.trim(),
            name: value.name.trim(),
            description: value.description.trim() || undefined,
            brand: value.brand.trim() || null,
            supplierSku: value.supplierSku.trim() || null,
            originCompany: value.originCompany.trim() || null,
            shopLocation: value.shopLocation.trim() || null,
            productOrigin: value.productOrigin,
            type: value.type,
            unit: value.unit.trim() || "PCS",
            barcode: value.barcode.trim() || undefined,
            categoryId: value.categoryId || null,
            supplierId: value.supplierId || null,
            costPrice: Number(value.costPrice),
            sellingPrice: Number(value.sellingPrice),
            reorderLevel: Number(value.reorderLevel),
            reorderQty: Number(value.reorderQty),
          });
        } else {
          await createProduct.mutateAsync({
            sku: value.sku.trim(),
            name: value.name.trim(),
            description: value.description.trim() || undefined,
            brand: value.brand.trim() || null,
            supplierSku: value.supplierSku.trim() || null,
            originCompany: value.originCompany.trim() || null,
            shopLocation: value.shopLocation.trim() || null,
            productOrigin: value.productOrigin,
            type: value.type,
            unit: value.unit.trim() || "PCS",
            barcode: value.barcode.trim() || undefined,
            categoryId: value.categoryId || null,
            supplierId: value.supplierId || null,
            costPrice: Number(value.costPrice),
            sellingPrice: Number(value.sellingPrice),
            reorderLevel: Number(value.reorderLevel),
            reorderQty: Number(value.reorderQty),
            initialWarehouseId: value.initialWarehouseId || null,
            initialQuantity: Number(value.initialQuantity) || 0,
          });
        }

        setIsCreateOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to save product");
      }
    },
  });

  const adjustForm = useForm({
    defaultValues: {
      warehouseId: "",
      movementType: "ADJUSTMENT_IN" as
        "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "PROJECT_CONSUMPTION",
      quantity: "1",
      notes: "",
    },
    onSubmit: async ({ value }) => {
      if (!adjustStockProduct || !value.warehouseId || !value.quantity) return;

      try {
        await createMovement.mutateAsync({
          productId: adjustStockProduct.id,
          warehouseId: value.warehouseId,
          movementType: value.movementType,
          quantity: Number(value.quantity),
          notes: value.notes.trim() || undefined,
        });

        toast.success("Stock movement recorded successfully!");
        setAdjustStockProduct(null);
      } catch (err: any) {
        toast.error(err.message || "Failed to record stock movement");
      }
    },
  });

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormError("");
    productForm.reset({
      sku: `PRD-${Date.now().toString().slice(-4)}`,
      name: "",
      description: "",
      brand: "",
      supplierSku: "",
      originCompany: "",
      shopLocation: "",
      productOrigin: "PURCHASED_EXTERNAL",
      type: "RAW_MATERIAL",
      unit: "PCS",
      barcode: "",
      categoryId: "",
      supplierId: "",
      costPrice: "0",
      sellingPrice: "0",
      reorderLevel: "10",
      reorderQty: "50",
      initialWarehouseId: "",
      initialQuantity: "0",
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = useCallback(
    (p: Product) => {
      setEditingProduct(p);
      setFormError("");
      productForm.reset({
        sku: p.sku,
        name: p.name,
        description: p.description || "",
        brand: p.brand || "",
        supplierSku: p.supplierSku || "",
        originCompany: p.originCompany || "",
        shopLocation: p.shopLocation || "",
        productOrigin: p.productOrigin || "PURCHASED_EXTERNAL",
        type: p.type,
        unit: p.unit,
        barcode: p.barcode || "",
        categoryId: p.categoryId || "",
        supplierId: p.supplierId || "",
        costPrice: p.costPrice.toString(),
        sellingPrice: p.sellingPrice.toString(),
        reorderLevel: p.reorderLevel.toString(),
        reorderQty: p.reorderQty.toString(),
        initialWarehouseId: "",
        initialQuantity: "0",
      });
      setIsCreateOpen(true);
    },
    [productForm],
  );

  const handleOpenAdjust = useCallback(
    (p: Product) => {
      setAdjustStockProduct(p);
      adjustForm.reset({
        warehouseId: warehouses[0]?.id || "",
        movementType: "ADJUSTMENT_IN",
        quantity: "1",
        notes: "",
      });
    },
    [adjustForm, warehouses],
  );

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "sku",
        header: "SKU & Shop Ref",
        cell: ({ row }) => (
          <div>
            <span
              className="inline-flex items-center gap-1 font-mono text-[11px] font-medium px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
              }}
            >
              {row.original.sku}
            </span>
            {row.original.supplierSku && (
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                Ref: {row.original.supplierSku}
              </span>
            )}
            {row.original.barcode && (
              <span className="text-[10px] text-slate-400 font-mono block">
                [{row.original.barcode}]
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: "Product / Material Name",
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-slate-800">
              {row.original.name}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
              {row.original.brand && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {row.original.brand}
                </span>
              )}
              {row.original.originCompany && (
                <span className="text-[10px] text-slate-400 font-normal">
                  • {row.original.originCompany}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type & Category",
        cell: ({ row }) => (
          <div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
              {row.original.type.replace("_", " ")}
            </span>
            <span className="block text-[10.5px] text-slate-400 mt-0.5">
              {row.original.category?.name || "General"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "costPrice",
        header: "Cost Price",
        cell: ({ row }) => (
          <span className="font-mono font-medium text-slate-700 block text-right">
            {formatCurrency(row.original.costPrice)}
          </span>
        ),
      },
      {
        accessorKey: "sellingPrice",
        header: "Selling Price",
        cell: ({ row }) => (
          <span className="font-mono font-medium text-slate-800 block text-right">
            {formatCurrency(row.original.sellingPrice)}
          </span>
        ),
      },
      {
        accessorKey: "totalOnHand",
        header: "Stock on Hand",
        cell: ({ row }) => (
          <div className="text-center">
            <span className="font-medium text-slate-800 font-mono text-xs">
              {row.original.totalOnHand ?? 0}
            </span>{" "}
            <span className="text-[10px] text-slate-400 font-normal">
              {row.original.unit}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const isLow = row.original.isLowStock;
          return (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-tight ${
                isLow
                  ? "bg-[#fefce8] text-[#92400e] border border-[#fde047]"
                  : "bg-[#f0fdf4] text-[#166534] border border-[#86efac]"
              }`}
            >
              {isLow ? "Low Stock" : "Optimal"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          if (!canManageInventory) {
            return (
              <div className="flex items-center justify-end">
                <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                  View Only
                </span>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenAdjust(row.original)}
                className="h-7 text-xs font-medium cursor-pointer"
              >
                Stock Move
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenEdit(row.original)}
                className="h-7 text-xs font-medium cursor-pointer"
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleteProduct.isPending}
                className="h-7 text-xs font-medium cursor-pointer"
                onClick={async () => {
                  const isConfirmed = await confirm({
                    title: "Delete Product SKU",
                    message: `Are you sure you want to delete SKU ${row.original.sku}?`,
                    variant: "danger",
                    confirmText: "Delete",
                  });
                  if (isConfirmed) {
                    deleteProduct.mutate(row.original.id, {
                      onSuccess: () => {
                        toast.success(
                          `Product SKU ${row.original.sku} deleted`,
                        );
                      },
                      onError: (err: any) => {
                        toast.error(err.message || "Failed to delete product");
                      },
                    });
                  }
                }}
              >
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [
      canManageInventory,
      confirm,
      deleteProduct,
      handleOpenEdit,
      handleOpenAdjust,
    ],
  );

  return (
    <div className="w-full min-h-full p-3 sm:p-5 space-y-3.5 bg-[#f8fafc] font-sans text-slate-800">
      {/* Compact Header Card */}
      <div
        className="bg-white rounded-xl p-3 sm:px-4 sm:py-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
        style={{ border: "1px solid #cbd5e1" }}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => router.push("/inventory/purchase-orders")}
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shrink-0"
            style={{ border: "1px solid #cbd5e1" }}
            title="Back to Purchase Orders"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
            }}
          >
            <Package className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-[17px] font-semibold text-slate-800 tracking-tight">
              Shop Products &amp; Materials
            </h1>
            <span
              className="text-[10.5px] font-medium px-2 py-0.5 rounded-full font-mono"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "1px solid #cbd5e1",
              }}
            >
              {totalProducts} Items
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            style={{ border: "1px solid #cbd5e1" }}
            title="Refresh products list"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isFetching ? "animate-spin text-[#1d4ed8]" : ""
              }`}
            />
          </button>
          {canManageInventory && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-2xs transition-colors cursor-pointer"
              style={{ backgroundColor: "#1d4ed8" }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product / SKU</span>
            </button>
          )}
        </div>
      </div>

      {/* Procurement Cycle Horizontal Quick Navigation */}
      <ProcurementQuickNav />

      {/* 4 Compact Pastel KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#f1f5f9",
            border: "1px solid #cbd5e1",
          }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            Total Catalog SKUs
          </span>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-slate-800 mt-0.5 block">
            {totalProducts}
          </span>
          <span className="text-[10.5px] text-slate-500 block mt-0.5">
            Active stock keeping units
          </span>
        </div>

        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
          }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-emerald-800/80 block">
            Units on Hand
          </span>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-emerald-900 mt-0.5 block">
            {totalStockItems}
          </span>
          <span className="text-[10.5px] text-emerald-700/80 block mt-0.5">
            Across warehouse facilities
          </span>
        </div>

        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#fff1f2",
            border: "1px solid #fda4af",
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-rose-800/80 block">
              Low Stock Alerts
            </span>
            {lowStockCount > 0 && (
              <span
                className="text-[9.5px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: "#ffe4e6",
                  color: "#9f1239",
                  border: "1px solid #fda4af",
                }}
              >
                Alert
              </span>
            )}
          </div>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-rose-900 mt-0.5 block">
            {lowStockCount}
          </span>
          <span className="text-[10.5px] text-rose-700/80 block mt-0.5">
            Items below reorder trigger
          </span>
        </div>

        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#fefce8",
            border: "1px solid #fde047",
          }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-amber-800/80 block">
            Total Valuation
          </span>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-amber-900 mt-0.5 block">
            {formatCurrency(totalInventoryValue)}
          </span>
          <span className="text-[10.5px] text-amber-700/80 block mt-0.5">
            Based on material unit cost
          </span>
        </div>
      </div>

      {/* Unified Filter Bar */}
      <div
        className="rounded-xl p-2.5 sm:px-3.5 sm:py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 shadow-2xs"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, brand, shop code, SKU..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
            style={{ border: "1px solid #cbd5e1" }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white rounded-lg outline-none cursor-pointer max-w-[160px] truncate"
            style={{ border: "1px solid #cbd5e1" }}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white rounded-lg outline-none cursor-pointer max-w-[150px] truncate"
            style={{ border: "1px solid #cbd5e1" }}
          >
            <option value="ALL">All Types</option>
            <option value="RAW_MATERIAL">Raw Material</option>
            <option value="FINISHED_GOOD">Finished Good</option>
            <option value="CONSUMABLE">Consumable</option>
            <option value="TOOL_EQUIPMENT">Tool &amp; Equipment</option>
          </select>

          <select
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white rounded-lg outline-none cursor-pointer max-w-[160px] truncate"
            style={{ border: "1px solid #cbd5e1" }}
          >
            <option value="ALL">All Origins</option>
            <option value="PURCHASED_EXTERNAL">Purchased External</option>
            <option value="INTERNAL">Internal Product</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      {error ? (
        <div
          className="py-8 text-center text-xs text-rose-700 rounded-xl"
          style={{
            backgroundColor: "#fff1f2",
            border: "1px solid #fda4af",
          }}
        >
          Error loading catalog: {(error as any).message}
        </div>
      ) : (
        <div
          className="bg-white rounded-xl shadow-2xs overflow-hidden"
          style={{ border: "1px solid #cbd5e1" }}
        >
          <div
            className="px-4 py-2.5 flex items-center justify-between gap-2"
            style={{
              backgroundColor: "#f4f7fb",
              borderBottom: "1px solid #cbd5e1",
            }}
          >
            <span className="text-xs font-semibold text-slate-700">
              Procured Materials &amp; Products Catalog
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
            </span>
          </div>

          <DataTable
            columns={columns}
            data={filteredProducts}
            isLoading={isLoading}
            emptyTitle="No products found"
            emptyMessage='Click "Add Product / SKU" to create your first stock item.'
          />
        </div>
      )}

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={
          editingProduct ? "Edit Product Details" : "Add New SKU to Inventory"
        }
        maxWidth="2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            productForm.handleSubmit();
          }}
          className="space-y-3.5"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <productForm.Field
              name="sku"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "SKU is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="SKU Code *"
                  required
                  placeholder="e.g. MAT-WOD-001"
                  className="uppercase font-mono font-bold"
                />
              )}
            </productForm.Field>

            <productForm.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "Product name is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Product / Material Name *"
                  required
                  placeholder="e.g. 18mm MDF Board / Dulux Paint"
                />
              )}
            </productForm.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <productForm.Field name="brand">
              {(field) => (
                <FormInput
                  field={field}
                  label="Brand / Manufacturer"
                  placeholder="e.g. Dulux, Jotun, Bosch, Saint-Gobain"
                />
              )}
            </productForm.Field>

            <productForm.Field name="supplierSku">
              {(field) => (
                <FormInput
                  field={field}
                  label="Shop Reference / Vendor Part #"
                  placeholder="e.g. Shop Item Code, Catalog Ref #"
                />
              )}
            </productForm.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <productForm.Field name="originCompany">
              {(field) => (
                <FormInput
                  field={field}
                  label="Origin Company / Shop Name"
                  placeholder="e.g. Deira Hardware Store, Al Gurg LLC"
                />
              )}
            </productForm.Field>

            <productForm.Field name="productOrigin">
              {(field) => (
                <FormSelect field={field} label="Product Source">
                  <option value="PURCHASED_EXTERNAL">
                    Purchased from External Shop / Vendor
                  </option>
                  <option value="INTERNAL">
                    Internal / Self-Produced Product
                  </option>
                </FormSelect>
              )}
            </productForm.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <productForm.Field name="type">
              {(field) => (
                <FormSelect field={field} label="Type">
                  <option value="RAW_MATERIAL">Raw Material</option>
                  <option value="FINISHED_GOOD">Finished Good</option>
                  <option value="CONSUMABLE">Consumable</option>
                  <option value="TOOL_EQUIPMENT">Tool & Equipment</option>
                </FormSelect>
              )}
            </productForm.Field>

            <productForm.Field name="unit">
              {(field) => (
                <FormInput
                  field={field}
                  label="Unit of Measure"
                  placeholder="PCS, SQM, LM, KG, LTR, BOX"
                />
              )}
            </productForm.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <productForm.Field name="categoryId">
              {(field) => (
                <FormSelect field={field} label="Category">
                  <option value="">-- None --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </FormSelect>
              )}
            </productForm.Field>

            <productForm.Field name="supplierId">
              {(field) => (
                <FormSelect field={field} label="Supplier / Vendor Master">
                  <option value="">-- None --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.supplierCode})
                    </option>
                  ))}
                </FormSelect>
              )}
            </productForm.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <productForm.Field name="costPrice">
              {(field) => (
                <FormInput
                  field={field}
                  label="Cost Price (AED)"
                  type="number"
                  step="0.01"
                />
              )}
            </productForm.Field>

            <productForm.Field name="sellingPrice">
              {(field) => (
                <FormInput
                  field={field}
                  label="Selling Price (AED)"
                  type="number"
                  step="0.01"
                />
              )}
            </productForm.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <productForm.Field name="reorderLevel">
              {(field) => (
                <FormInput
                  field={field}
                  label="Reorder Trigger Level"
                  type="number"
                />
              )}
            </productForm.Field>

            <productForm.Field name="barcode">
              {(field) => (
                <FormInput
                  field={field}
                  label="Barcode (Optional)"
                  placeholder="e.g. 629110000000"
                />
              )}
            </productForm.Field>
          </div>

          <productForm.Field name="description">
            {(field) => (
              <FormTextarea
                field={field}
                label="Product Details / Specifications"
                rows={2}
                placeholder="Dimensions, grade, vendor warranty, technical specs..."
              />
            )}
          </productForm.Field>

          {!editingProduct && warehouses.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase block">
                Opening Stock (Optional)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <productForm.Field name="initialWarehouseId">
                  {(field) => (
                    <FormSelect field={field}>
                      <option value="">-- Select Warehouse --</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </FormSelect>
                  )}
                </productForm.Field>

                <productForm.Field name="initialQuantity">
                  {(field) => (
                    <FormInput
                      field={field}
                      type="number"
                      placeholder="Opening Qty"
                    />
                  )}
                </productForm.Field>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <FormSubmit
              form={productForm}
              loading={createProduct.isPending || updateProduct.isPending}
            >
              Save Product
            </FormSubmit>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!adjustStockProduct}
        onClose={() => setAdjustStockProduct(null)}
        title={`Stock Movement: ${adjustStockProduct?.name || ""}`}
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            adjustForm.handleSubmit();
          }}
          className="space-y-3.5"
        >
          <adjustForm.Field
            name="warehouseId"
            validators={{
              onChange: ({ value }) =>
                !value ? "Warehouse is required" : undefined,
            }}
          >
            {(field) => (
              <FormSelect field={field} label="Warehouse *" required>
                <option value="">-- Select Warehouse --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </FormSelect>
            )}
          </adjustForm.Field>

          <adjustForm.Field name="movementType">
            {(field) => (
              <FormSelect field={field} label="Movement Type">
                <option value="ADJUSTMENT_IN">Stock In / Audit (+)</option>
                <option value="ADJUSTMENT_OUT">Stock Out / Damage (-)</option>
                <option value="PROJECT_CONSUMPTION">
                  Project Site Consumption (-)
                </option>
              </FormSelect>
            )}
          </adjustForm.Field>

          <adjustForm.Field
            name="quantity"
            validators={{
              onChange: ({ value }) =>
                !value || Number(value) <= 0
                  ? "Quantity must be greater than 0"
                  : undefined,
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                label={`Quantity (${adjustStockProduct?.unit || "PCS"}) *`}
                type="number"
                min="0.1"
                step="any"
                required
              />
            )}
          </adjustForm.Field>

          <adjustForm.Field name="notes">
            {(field) => (
              <FormInput
                field={field}
                label="Notes / Project Reference"
                placeholder="e.g. Project #42 Site installation"
              />
            )}
          </adjustForm.Field>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAdjustStockProduct(null)}
            >
              Cancel
            </Button>
            <FormSubmit form={adjustForm} loading={createMovement.isPending}>
              Confirm Movement
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
