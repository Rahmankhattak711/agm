"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useCreatePurchaseOrder,
  useSuppliers,
  useProducts,
  Supplier,
  Product,
} from "@/lib/hooks/api-hooks";
import { QuickAddVendorModal } from "@/components/common/QuickAddVendorModal";
import { QuickAddProductModal } from "../components/QuickAddProductModal";
import { SearchableProductSelect } from "../components/SearchableProductSelect";
import { ItemRow } from "../components/types";
import { toast } from "@/lib/toast";
import { formatAed, formatNumber } from "@/lib/utils/format";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ShoppingCart,
  Calendar,
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
    `PO-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [supplierId, setSupplierId] = useState<string>("");
  const [orderDate, setOrderDate] = useState<string>(
    new Date().toISOString().split("T")[0]
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
  const [quickProductTargetIdx, setQuickProductTargetIdx] = useState<number | null>(null);
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

  const handleItemChange = (index: number, field: keyof ItemRow, val: string) => {
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
        setErrorMsg(`Item #${i + 1} must have a valid quantity greater than zero.`);
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
    <div className="w-full min-h-full flex flex-col font-sans bg-slate-50/50">
      {/* 2-Tier Header - Clean, zero negative margins, no overlap */}
      <div className="w-full bg-white border-b border-slate-200/90 px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => router.push("/inventory/purchase-orders")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Purchase Orders</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5046e5] shadow-2xs">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Create Purchase Order
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                  DRAFT
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Draft supplier procurement order, assign vendor, set delivery milestones, and configure itemized materials.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => router.push("/inventory/purchase-orders")}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#5046e5] hover:bg-[#4338ca] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
      </div>

      {/* Main Page Grid */}
      <div className="p-6 flex-1">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
          {errorMsg && (
            <div className="lg:col-span-12 p-3.5 rounded-2xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200 flex items-center gap-2.5 shadow-2xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Left Column: Form Details (Col 8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Order & Vendor Information */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#5046e5]" />
                  <h2 className="text-sm font-bold text-slate-900">Order &amp; Vendor Specification</h2>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">Step 1 of 2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    PO Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold tracking-wider uppercase rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#5046e5] outline-none shadow-2xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Supplier / Vendor <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsQuickVendorOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5046e5] hover:text-[#4338ca] hover:underline cursor-pointer"
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
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:border-[#5046e5] outline-none shadow-2xs cursor-pointer"
                  >
                    <option value="">-- Choose Vendor or Enter New --</option>
                    <option value="__NEW__" className="font-bold text-[#5046e5]">
                      + Add New Vendor to Directory...
                    </option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.supplierCode}) {s.trn ? `• TRN: ${s.trn}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Order Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:border-[#5046e5] outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:border-[#5046e5] outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Shop / Branch Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Deira Hardware Store / Al Quoz Branch"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:border-[#5046e5] outline-none shadow-2xs placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Shop / Vendor Quote Ref #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shop Quote #4819 / Inv #21"
                    value={vendorReference}
                    onChange={(e) => setVendorReference(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:border-[#5046e5] outline-none shadow-2xs placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Procurement Line Items */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-[#5046e5]" />
                    <h2 className="text-sm font-bold text-slate-900">Procurement Line Items</h2>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                      {items.length} {items.length === 1 ? "Item" : "Items"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select catalog products or register items bought directly from local trade vendors.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="/inventory/products"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#5046e5] border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-xl shadow-2xs transition-colors cursor-pointer"
                    title="Open dedicated Products & Materials catalog in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    <span>Products Catalog ↗</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleOpenQuickProduct(null)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#5046e5] border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 px-2.5 py-1.5 rounded-xl cursor-pointer shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Quick Add Product</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {items.map((row, idx) => {
                  const qty = parseFloat(row.quantityOrdered) || 0;
                  const cost = parseFloat(row.unitCost) || 0;
                  const rowSubtotal = qty * cost;

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-slate-50/70 transition-colors space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <span className="px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-bold text-[11px] shadow-2xs font-mono">
                          Item #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length === 1}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-20"
                          title="Remove item row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        <div className="md:col-span-6 space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700">
                              Product / Item <span className="text-rose-500">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenQuickProduct(idx)}
                                className="text-[10.5px] font-bold text-[#5046e5] hover:text-[#4338ca] hover:underline cursor-pointer"
                              >
                                + New Shop Product
                              </button>
                              <span className="text-slate-300 text-[10px]">|</span>
                              <a
                                href="/inventory/products"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10.5px] font-medium text-slate-500 hover:text-slate-800 hover:underline cursor-pointer inline-flex items-center gap-0.5"
                              >
                                <span>Catalog</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                          <SearchableProductSelect
                            required
                            value={row.productId}
                            onChange={(prodId) => handleItemChange(idx, "productId", prodId)}
                            products={products}
                            onAddNewProduct={(typedName) => handleOpenQuickProduct(idx, typedName)}
                            placeholder="Type product name, brand, SKU..."
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            Qty <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            required
                            value={row.quantityOrdered}
                            onChange={(e) => handleItemChange(idx, "quantityOrdered", e.target.value)}
                            className="w-full px-3 py-2 text-xs font-bold text-center rounded-xl border border-slate-200 bg-white focus:border-[#5046e5] outline-none shadow-2xs font-mono"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            Unit Cost (AED) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            value={row.unitCost}
                            onChange={(e) => handleItemChange(idx, "unitCost", e.target.value)}
                            className="w-full px-3 py-2 text-xs font-bold text-right rounded-xl border border-slate-200 bg-white focus:border-[#5046e5] outline-none shadow-2xs font-mono"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 block text-right">
                            Subtotal (AED)
                          </label>
                          <div className="px-3 py-2 text-xs font-black text-right rounded-xl border border-slate-200 bg-slate-100/70 text-slate-900 font-mono">
                            {formatNumber(rowSubtotal)}
                          </div>
                        </div>
                      </div>

                      {/* Optional References & Specifications per line item */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <input
                          type="text"
                          placeholder="Shop / Vendor Item Code / SKU (Optional)"
                          value={row.supplierSku || ""}
                          onChange={(e) => handleItemChange(idx, "supplierSku", e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 outline-none focus:border-[#5046e5]"
                        />
                        <input
                          type="text"
                          placeholder="Item notes / specifications (e.g., Color 9010, 5L Can, Stainless 304)"
                          value={row.itemNotes || ""}
                          onChange={(e) => handleItemChange(idx, "itemNotes", e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 outline-none focus:border-[#5046e5]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/40 text-slate-600 hover:text-[#5046e5] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Procurement Item Row</span>
                </button>
              </div>
            </div>

            {/* Card 3: Additional Notes */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Procurement Terms &amp; Notes
              </label>
              <textarea
                rows={3}
                placeholder="Include delivery instructions, site contact details, payment terms, or quotation agreements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 bg-white focus:border-[#5046e5] outline-none shadow-2xs placeholder:text-slate-400 resize-y"
              />
            </div>
          </div>

          {/* Right Column: Order Summary & Vendor Card (Col 4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Sticky Financial Summary Card */}
            <div className="sticky top-6 space-y-6">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <span>Order Cost Summary</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono">
                    AED Currency
                  </span>
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Configured Items:</span>
                    <span className="font-bold font-mono text-slate-900">{items.length} line(s)</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Total Ordered Units:</span>
                    <span className="font-bold font-mono text-slate-900">{calculations.totalUnits} pcs</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-100">
                    <span>Gross Subtotal:</span>
                    <span className="font-bold font-mono text-slate-900">{formatAed(calculations.subtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1">
                      <span>Standard VAT (5%):</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-bold font-mono">
                        Box 9
                      </span>
                    </span>
                    <span className="font-bold font-mono text-purple-700">{formatAed(calculations.vat)}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-1 mt-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Total Estimated Payable
                    </span>
                    <span className="text-2xl font-black font-mono tracking-tight block text-emerald-400">
                      {formatAed(calculations.grandTotal)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-[#5046e5] hover:bg-[#4338ca] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating Purchase Order...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Create &amp; Save Purchase Order</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/inventory/purchase-orders")}
                    className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer text-center"
                  >
                    Discard &amp; Exit
                  </button>
                </div>
              </div>

              {/* Vendor Profile Card */}
              {selectedSupplier ? (
                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
                    <Building2 className="w-4 h-4 text-[#5046e5]" />
                    <span>Selected Vendor Profile</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-slate-900 text-sm">{selectedSupplier.name}</div>
                    <div className="font-mono text-slate-500 text-[11px] font-semibold">
                      Code: {selectedSupplier.supplierCode}
                    </div>
                    {selectedSupplier.trn && (
                      <div className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded mt-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>TRN: {selectedSupplier.trn}</span>
                      </div>
                    )}
                    {selectedSupplier.contactPerson && (
                      <div className="text-slate-600 pt-1 text-[11px]">
                        Contact: <span className="font-semibold text-slate-800">{selectedSupplier.contactPerson}</span>
                      </div>
                    )}
                    {selectedSupplier.phone && (
                      <div className="text-slate-600 text-[11px]">
                        Phone: <span className="font-mono font-semibold text-slate-800">{selectedSupplier.phone}</span>
                      </div>
                    )}
                    {selectedSupplier.address && (
                      <div className="text-slate-400 text-[10.5px] pt-0.5">{selectedSupplier.address}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-amber-900 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-amber-700" />
                    <span>Vendor Selection Pending</span>
                  </div>
                  <p className="text-[11px] text-amber-700/90">
                    Select an approved trade vendor above, or click <strong>+ New Vendor</strong> to register a new supplier on the fly.
                  </p>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

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
        onSuccess={handleQuickProductSuccess}
      />
    </div>
  );
}
