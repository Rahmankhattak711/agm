"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useCreatePurchaseOrder,
  useSuppliers,
  useProducts,
  Product,
} from "@/lib/hooks/api-hooks";
import { QuickAddVendorModal } from "@/components/common/QuickAddVendorModal";
import { QuickAddProductModal } from "../components/QuickAddProductModal";
import { SearchableProductSelect } from "../components/SearchableProductSelect";
import { ItemRow } from "../components/types";
import { toast } from "@/lib/toast";
import { formatAed, formatNumber } from "@/lib/utils/format";
import {
  ChevronLeft,
  Plus,
  Trash2,
  ShoppingCart,
  Store,
  FileText,
  ExternalLink,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
} from "lucide-react";

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  const { data: suppliers = [], refetch: refetchSuppliers } = useSuppliers();
  const { data: products = [] } = useProducts();
  const createPO = useCreatePurchaseOrder();

  // General Order Fields
  const [poNumber, setPoNumber] = useState<string>(
    `PO-${Math.floor(1000 + Math.random() * 9000)}`,
  );
  const [supplierId, setSupplierId] = useState<string>("");
  const [orderDate, setOrderDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [expectedDate, setExpectedDate] = useState<string>("");
  const [shopName, setShopName] = useState<string>("");
  const [vendorReference, setVendorReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Line Items
  const [items, setItems] = useState<ItemRow[]>([
    {
      productId: "",
      supplierSku: "",
      itemNotes: "",
      quantityOrdered: "1",
      unitCost: "0",
    },
  ]);

  // Modals & UI States
  const [isQuickVendorOpen, setIsQuickVendorOpen] = useState(false);
  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);
  const [quickProductTargetIdx, setQuickProductTargetIdx] = useState<
    number | null
  >(null);
  const [quickProductName, setQuickProductName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Supplier Details
  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === supplierId) || null;
  }, [suppliers, supplierId]);

  // Calculations
  const calculations = useMemo(() => {
    let totalUnits = 0;
    let subtotal = 0;

    items.forEach((it) => {
      const q = parseFloat(it.quantityOrdered) || 0;
      const c = parseFloat(it.unitCost) || 0;
      totalUnits += q;
      subtotal += q * c;
    });

    const vat = subtotal * 0.05;
    const grandTotal = subtotal + vat;

    return {
      totalUnits,
      subtotal,
      vat,
      grandTotal,
    };
  }, [items]);

  // Line Item Handlers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: "",
        supplierSku: "",
        itemNotes: "",
        quantityOrdered: "1",
        unitCost: "0",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof ItemRow,
    val: string,
  ) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };

      if (field === "productId") {
        const prod = products.find((p) => p.id === val);
        if (prod) {
          next[index].unitCost = prod.costPrice?.toString() || "0";
          if (prod.supplierSku) {
            next[index].supplierSku = prod.supplierSku;
          }
        }
      }
      return next;
    });
  };

  const handleOpenQuickProduct = (idx: number | null, name: string = "") => {
    setQuickProductTargetIdx(idx);
    setQuickProductName(name);
    setIsQuickProductOpen(true);
  };

  const handleQuickProductSuccess = (newProd: Product) => {
    if (quickProductTargetIdx !== null && items[quickProductTargetIdx]) {
      setItems((prev) => {
        const next = [...prev];
        next[quickProductTargetIdx] = {
          ...next[quickProductTargetIdx],
          productId: newProd.id,
          supplierSku: newProd.supplierSku || "",
          unitCost: newProd.costPrice?.toString() || "0",
        };
        return next;
      });
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: newProd.id,
          supplierSku: newProd.supplierSku || "",
          itemNotes: "",
          quantityOrdered: "1",
          unitCost: newProd.costPrice?.toString() || "0",
        },
      ]);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!poNumber.trim()) {
      setErrorMsg("Purchase Order number is required.");
      return;
    }
    if (!supplierId) {
      setErrorMsg("Please select or add a Supplier / Vendor.");
      return;
    }
    if (items.length === 0) {
      setErrorMsg("Please add at least one line item.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].productId) {
        setErrorMsg(`Item #${i + 1} does not have a product selected.`);
        return;
      }
      const qty = parseFloat(items[i].quantityOrdered);
      if (isNaN(qty) || qty <= 0) {
        setErrorMsg(
          `Item #${i + 1} must have a valid quantity greater than zero.`,
        );
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await createPO.mutateAsync({
        poNumber: poNumber.trim().toUpperCase(),
        supplierId,
        shopName: shopName.trim() || undefined,
        vendorReference: vendorReference.trim() || undefined,
        orderDate,
        expectedDate: expectedDate || undefined,
        status: "DRAFT",
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          supplierSku: it.supplierSku?.trim() || undefined,
          itemNotes: it.itemNotes?.trim() || undefined,
          quantityOrdered: Number(it.quantityOrdered),
          unitCost: Number(it.unitCost),
          totalCost: Number(it.quantityOrdered) * Number(it.unitCost),
        })),
      });

      toast.success(`Purchase Order ${poNumber} created successfully!`);
      router.push("/inventory/purchase-orders");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create Purchase Order.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-full p-3 sm:p-5 space-y-3.5 bg-[#f8fafc] font-sans text-slate-800">
      {/* Compact Header Card with Back Arrow */}
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
            <ShoppingCart className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-[17px] font-semibold text-slate-800 tracking-tight">
              Create Purchase Order
            </h1>
            <span
              className="text-[10.5px] font-medium px-2 py-0.5 rounded-full font-mono"
              style={{
                backgroundColor: "#fefce8",
                color: "#92400e",
                border: "1px solid #fde047",
              }}
            >
              DRAFT
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => router.push("/inventory/purchase-orders")}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
            style={{ border: "1px solid #cbd5e1" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: "#1d4ed8" }}
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Order...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Create Purchase Order</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Form Grid */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start"
      >
        {errorMsg && (
          <div
            className="lg:col-span-12 p-3 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2 shadow-2xs"
            style={{
              backgroundColor: "#fff1f2",
              border: "1px solid #fda4af",
            }}
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Left Column: Form Details (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Card 1: Order & Vendor Specification */}
          <div
            className="bg-white rounded-xl overflow-hidden shadow-2xs"
            style={{ border: "1px solid #cbd5e1" }}
          >
            <div
              className="px-4 py-2.5 flex items-center justify-between gap-2"
              style={{
                backgroundColor: "#f4f7fb",
                borderBottom: "1px solid #cbd5e1",
              }}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#1d4ed8]" />
                <h2 className="text-xs font-semibold text-slate-800">
                  Order &amp; Vendor Specification
                </h2>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                Step 1 of 2
              </span>
            </div>

            <div className="p-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    PO Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 text-xs font-mono font-semibold tracking-wider uppercase rounded-lg bg-[#f8fafc] focus:bg-white text-slate-800 outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
                    style={{ border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Supplier / Vendor <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsQuickVendorOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1d4ed8] hover:underline cursor-pointer"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>+ New Vendor</span>
                    </button>
                  </div>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => {
                      if (e.target.value === "__NEW__") {
                        setIsQuickVendorOpen(true);
                      } else {
                        setSupplierId(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-1.5 text-xs font-normal rounded-lg bg-white text-slate-800 outline-none focus:ring-2 focus:ring-[#1d4ed8]/15 cursor-pointer"
                    style={{ border: "1px solid #cbd5e1" }}
                  >
                    <option value="">-- Choose Vendor or Enter New --</option>
                    <option
                      value="__NEW__"
                      className="font-medium text-[#1d4ed8]"
                    >
                      + Add New Vendor to Directory...
                    </option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.supplierCode}){" "}
                        {s.trn ? `• TRN: ${s.trn}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Order Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-white text-slate-800 outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
                    style={{ border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg bg-white text-slate-800 outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
                    style={{ border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Shop / Branch Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Deira Hardware Store / Al Quoz Branch"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-normal rounded-lg bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
                    style={{ border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Shop / Vendor Quote Ref #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shop Quote #4819 / Inv #21"
                    value={vendorReference}
                    onChange={(e) => setVendorReference(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-normal rounded-lg bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
                    style={{ border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Procurement Line Items */}
          <div
            className="bg-white rounded-xl overflow-hidden shadow-2xs"
            style={{ border: "1px solid #cbd5e1" }}
          >
            <div
              className="px-4 py-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
              style={{
                backgroundColor: "#f4f7fb",
                borderBottom: "1px solid #cbd5e1",
              }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <ShoppingCart className="w-3.5 h-3.5 text-[#1d4ed8]" />
                <h2 className="text-xs font-semibold text-slate-800">
                  Procurement Line Items
                </h2>
                <span
                  className="text-[10.5px] font-medium px-2 py-0.5 rounded-full font-mono"
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  {items.length} {items.length === 1 ? "Item" : "Items"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <a
                  href="/inventory/products"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-[#1d4ed8] bg-white hover:bg-slate-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  style={{ border: "1px solid #cbd5e1" }}
                  title="Open dedicated Products & Materials catalog in new tab"
                >
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                  <span>Products Catalog</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleOpenQuickProduct(null)}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                  style={{
                    backgroundColor: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Quick Add Product</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1 text-xs font-medium text-white px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
                  style={{ backgroundColor: "#1d4ed8" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {items.map((row, idx) => {
                const qty = parseFloat(row.quantityOrdered) || 0;
                const cost = parseFloat(row.unitCost) || 0;
                const rowSubtotal = qty * cost;

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl space-y-3 transition-colors"
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <div
                      className="flex items-center justify-between pb-2"
                      style={{ borderBottom: "1px solid #e2e8f0" }}
                    >
                      <span
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium font-mono"
                        style={{
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        Item #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length === 1}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-30"
                        title="Remove item row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-6 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-medium text-slate-700">
                            Product / Item <span className="text-rose-500">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenQuickProduct(idx)}
                              className="text-[10.5px] font-medium text-[#1d4ed8] hover:underline cursor-pointer"
                            >
                              + New Shop Product
                            </button>
                            <span className="text-slate-300 text-[10px]">|</span>
                            <a
                              href="/inventory/products"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10.5px] font-normal text-slate-500 hover:text-slate-800 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                            >
                              <span>Catalog</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                        <SearchableProductSelect
                          required
                          value={row.productId}
                          onChange={(prodId) =>
                            handleItemChange(idx, "productId", prodId)
                          }
                          products={products}
                          onAddNewProduct={(typedName) =>
                            handleOpenQuickProduct(idx, typedName)
                          }
                          placeholder="Type product name, brand, SKU..."
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[11px] font-medium text-slate-700 block">
                          Qty <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          required
                          value={row.quantityOrdered}
                          onChange={(e) =>
                            handleItemChange(idx, "quantityOrdered", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-medium text-center rounded-lg bg-white text-slate-800 outline-none focus:ring-2 focus:ring-[#1d4ed8]/15 font-mono"
                          style={{ border: "1px solid #cbd5e1" }}
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[11px] font-medium text-slate-700 block">
                          Unit Cost (AED) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={row.unitCost}
                          onChange={(e) =>
                            handleItemChange(idx, "unitCost", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-medium text-right rounded-lg bg-white text-slate-800 outline-none focus:ring-2 focus:ring-[#1d4ed8]/15 font-mono"
                          style={{ border: "1px solid #cbd5e1" }}
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[11px] font-medium text-slate-500 block text-right">
                          Subtotal (AED)
                        </label>
                        <div
                          className="px-2.5 py-1.5 text-xs font-semibold text-right rounded-lg text-slate-800 font-mono"
                          style={{
                            backgroundColor: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                          }}
                        >
                          {formatNumber(rowSubtotal)}
                        </div>
                      </div>
                    </div>

                    {/* Optional References & Specifications per line item */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-0.5">
                      <input
                        type="text"
                        placeholder="Shop / Vendor Item Code / SKU (Optional)"
                        value={row.supplierSku || ""}
                        onChange={(e) =>
                          handleItemChange(idx, "supplierSku", e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
                        style={{ border: "1px solid #cbd5e1" }}
                      />
                      <input
                        type="text"
                        placeholder="Item notes / specifications (e.g., Color 9010, 5L Can, Stainless 304)"
                        value={row.itemNotes || ""}
                        onChange={(e) =>
                          handleItemChange(idx, "itemNotes", e.target.value)
                        }
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
                        style={{ border: "1px solid #cbd5e1" }}
                      />
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-2 rounded-xl border border-dashed bg-white hover:bg-[#eff6ff]/50 text-slate-600 hover:text-[#1d4ed8] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                style={{ borderColor: "#94a3b8" }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Procurement Item Row</span>
              </button>
            </div>
          </div>

          {/* Card 3: Additional Notes */}
          <div
            className="bg-white rounded-xl overflow-hidden shadow-2xs"
            style={{ border: "1px solid #cbd5e1" }}
          >
            <div
              className="px-4 py-2.5 flex items-center justify-between"
              style={{
                backgroundColor: "#f4f7fb",
                borderBottom: "1px solid #cbd5e1",
              }}
            >
              <span className="text-xs font-semibold text-slate-800">
                Procurement Terms &amp; Notes
              </span>
              <span className="text-[10.5px] text-slate-500">Optional</span>
            </div>
            <div className="p-4">
              <textarea
                rows={3}
                placeholder="Include delivery instructions, site contact details, payment terms, or quotation agreements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 text-xs rounded-lg bg-white text-slate-800 outline-none focus:ring-2 focus:ring-[#1d4ed8]/15 placeholder:text-slate-400 resize-y"
                style={{ border: "1px solid #cbd5e1" }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Order Summary & Vendor Card (Col 4) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-5">
          <div
            className="bg-white rounded-xl overflow-hidden shadow-2xs"
            style={{ border: "1px solid #cbd5e1" }}
          >
            <div
              className="px-4 py-2.5 flex items-center justify-between gap-2"
              style={{
                backgroundColor: "#f4f7fb",
                borderBottom: "1px solid #cbd5e1",
              }}
            >
              <h3 className="text-xs font-semibold text-slate-800">
                Order Cost Summary
              </h3>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded font-mono"
                style={{
                  backgroundColor: "#f0fdf4",
                  color: "#166534",
                  border: "1px solid #86efac",
                }}
              >
                AED Currency
              </span>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Configured Items:</span>
                  <span className="font-medium font-mono text-slate-800">
                    {items.length} line(s)
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Total Ordered Units:</span>
                  <span className="font-medium font-mono text-slate-800">
                    {calculations.totalUnits} pcs
                  </span>
                </div>

                <div
                  className="flex justify-between items-center text-slate-600 pt-2"
                  style={{ borderTop: "1px solid #e2e8f0" }}
                >
                  <span>Gross Subtotal:</span>
                  <span className="font-semibold font-mono text-slate-800">
                    {formatAed(calculations.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span>Standard VAT (5%):</span>
                    <span
                      className="text-[9.5px] px-1.5 py-0.5 rounded font-medium font-mono"
                      style={{
                        backgroundColor: "#fefce8",
                        color: "#92400e",
                        border: "1px solid #fde047",
                      }}
                    >
                      Box 9
                    </span>
                  </span>
                  <span className="font-medium font-mono text-amber-800">
                    {formatAed(calculations.vat)}
                  </span>
                </div>
              </div>

              {/* Pastel Total Box */}
              <div
                className="p-3 rounded-xl space-y-0.5"
                style={{
                  backgroundColor: "#eff6ff",
                  border: "1px solid #bfdbfe",
                }}
              >
                <span className="text-[9.5px] uppercase font-medium tracking-wider text-blue-700/80 block">
                  Total Estimated Payable
                </span>
                <span className="text-lg font-semibold font-mono tracking-tight block text-[#1d4ed8]">
                  {formatAed(calculations.grandTotal)}
                </span>
              </div>

              <div className="pt-1 space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-lg text-white text-xs font-medium flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: "#1d4ed8" }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Purchase Order...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Create &amp; Save Purchase Order</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/inventory/purchase-orders")}
                  className="w-full py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors cursor-pointer text-center"
                  style={{ border: "1px solid #cbd5e1" }}
                >
                  Discard &amp; Exit
                </button>
              </div>
            </div>
          </div>

          {/* Vendor Profile Card */}
          {selectedSupplier ? (
            <div
              className="bg-white rounded-xl overflow-hidden shadow-2xs"
              style={{ border: "1px solid #cbd5e1" }}
            >
              <div
                className="px-4 py-2.5 flex items-center gap-2 text-xs font-semibold text-slate-800"
                style={{
                  backgroundColor: "#f4f7fb",
                  borderBottom: "1px solid #cbd5e1",
                }}
              >
                <Building2 className="w-3.5 h-3.5 text-[#1d4ed8]" />
                <span>Selected Vendor Profile</span>
              </div>
              <div className="p-4 space-y-1 text-xs">
                <div className="font-semibold text-slate-800 text-xs">
                  {selectedSupplier.name}
                </div>
                <div className="font-mono text-slate-500 text-[11px]">
                  Code: {selectedSupplier.supplierCode}
                </div>
                {selectedSupplier.trn && (
                  <div
                    className="inline-flex items-center gap-1 text-[10.5px] font-mono font-medium px-2 py-0.5 rounded mt-1"
                    style={{
                      backgroundColor: "#f0fdf4",
                      color: "#166534",
                      border: "1px solid #86efac",
                    }}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>TRN: {selectedSupplier.trn}</span>
                  </div>
                )}
                {selectedSupplier.contactPerson && (
                  <div className="text-slate-600 pt-1 text-[11px]">
                    Contact:{" "}
                    <span className="font-medium text-slate-800">
                      {selectedSupplier.contactPerson}
                    </span>
                  </div>
                )}
                {selectedSupplier.phone && (
                  <div className="text-slate-600 text-[11px]">
                    Phone:{" "}
                    <span className="font-mono font-medium text-slate-800">
                      {selectedSupplier.phone}
                    </span>
                  </div>
                )}
                {selectedSupplier.address && (
                  <div className="text-slate-400 text-[10.5px] pt-0.5">
                    {selectedSupplier.address}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className="p-3.5 rounded-xl text-amber-900 text-xs space-y-1 shadow-2xs"
              style={{
                backgroundColor: "#fefce8",
                border: "1px solid #fde047",
              }}
            >
              <div className="font-medium flex items-center gap-1.5 text-amber-900">
                <Store className="w-3.5 h-3.5 text-amber-700" />
                <span>Vendor Selection Pending</span>
              </div>
              <p className="text-[11px] text-amber-800/90 leading-relaxed">
                Select an approved trade vendor above, or click{" "}
                <span className="font-medium">+ New Vendor</span> to register a
                new supplier on the fly.
              </p>
            </div>
          )}
        </div>
      </form>

      {/* Reusable Quick Add Modals */}
      <QuickAddVendorModal
        isOpen={isQuickVendorOpen}
        onClose={() => setIsQuickVendorOpen(false)}
        onSuccess={(newSup) => {
          setSupplierId(newSup.id);
          refetchSuppliers();
        }}
      />

      <QuickAddProductModal
        isOpen={isQuickProductOpen}
        onClose={() => setIsQuickProductOpen(false)}
        defaultSupplierId={supplierId}
        initialName={quickProductName}
        onSuccess={handleQuickProductSuccess}
      />
    </div>
  );
}
