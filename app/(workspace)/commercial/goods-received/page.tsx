"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  PackageCheck,
  Plus,
  Printer,
  Search,
  Trash2,
  Warehouse,
} from "lucide-react";
import {
  Modal,
  FormInput,
  FormSelect,
  FormSubmit,
} from "@/components/ui";
import ProcurementQuickNav from "@/components/ProcurementQuickNav";
import { useForm } from "@tanstack/react-form";
import {
  useGoodsReceipts,
  useCreateGoodsReceipt,
  usePurchaseOrders,
  useSuppliers,
  useWarehouses,
  useProducts,
  GoodsReceipt,
} from "@/lib/hooks/api-hooks";

const PAGE_SIZE = 15;

export default function GoodsReceivedPage() {
  const router = useRouter();
  const { data: grns = [], isLoading } = useGoodsReceipts();
  const { data: purchaseOrders = [] } = usePurchaseOrders();
  const { data: suppliers = [] } = useSuppliers();
  const { data: warehouses = [] } = useWarehouses();
  const { data: products = [] } = useProducts();

  const createGrnMutation = useCreateGoodsReceipt();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGrn, setSelectedGrn] = useState<GoodsReceipt | null>(null);
  const [formError, setFormError] = useState("");

  const form = useForm({
    defaultValues: {
      grnNumber: "",
      purchaseOrderId: "",
      supplierId: "",
      warehouseId: "",
      deliveryNoteNumber: "",
      receiptDate: new Date().toISOString().slice(0, 10),
      notes: "",
      items: [
        {
          productId: "",
          quantityReceived: 1,
          quantityAccepted: 1,
          quantityDamaged: 0,
          notes: "",
        },
      ],
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        await createGrnMutation.mutateAsync({
          grnNumber: value.grnNumber.trim() || undefined,
          purchaseOrderId: value.purchaseOrderId || undefined,
          supplierId: value.supplierId || undefined,
          warehouseId: value.warehouseId || warehouses[0]?.id,
          deliveryNoteNumber: value.deliveryNoteNumber.trim() || undefined,
          receiptDate: value.receiptDate,
          notes: value.notes.trim() || undefined,
          items: value.items,
        });
        setIsCreateOpen(false);
        form.reset();
      } catch (err: any) {
        setFormError(err.message || "Failed to create goods receipt");
      }
    },
  });

  const handleOpenCreate = () => {
    setFormError("");
    form.reset();
    if (warehouses[0]?.id) {
      form.setFieldValue("warehouseId", warehouses[0].id);
    }
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    form.reset();
  };

  const addItem = () => {
    const current = form.getFieldValue("items");
    form.setFieldValue("items", [
      ...current,
      {
        productId: "",
        quantityReceived: 1,
        quantityAccepted: 1,
        quantityDamaged: 0,
        notes: "",
      },
    ]);
  };

  const removeItem = (idx: number) => {
    const current = form.getFieldValue("items");
    if (current.length === 1) return;
    form.setFieldValue(
      "items",
      current.filter((_, i) => i !== idx),
    );
  };

  const updateItem = (idx: number, field: string, val: any) => {
    const current = [...form.getFieldValue("items")];
    current[idx] = {
      ...current[idx],
      [field]: field.includes("quantity") ? Number(val) : val,
    };
    form.setFieldValue("items", current);
  };

  const handleSelectPo = (poId: string) => {
    form.setFieldValue("purchaseOrderId", poId);
    if (!poId) return;

    const po = purchaseOrders.find((p) => p.id === poId);
    if (po) {
      if (po.supplierId) {
        form.setFieldValue("supplierId", po.supplierId);
      }
      if (po.items && po.items.length > 0) {
        form.setFieldValue(
          "items",
          po.items.map((i: any) => {
            const rem = Math.max(
              0,
              Number(i.quantityOrdered) - Number(i.quantityReceived),
            );
            return {
              productId: i.productId,
              quantityReceived: rem > 0 ? rem : Number(i.quantityOrdered),
              quantityAccepted: rem > 0 ? rem : Number(i.quantityOrdered),
              quantityDamaged: 0,
              notes: "",
            };
          }),
        );
      }
    }
  };

  const filteredGrns = grns.filter((g) => {
    const matchesSearch =
      g.grnNumber.toLowerCase().includes(search.toLowerCase()) ||
      (g.deliveryNoteNumber &&
        g.deliveryNoteNumber.toLowerCase().includes(search.toLowerCase())) ||
      (g.supplier?.name &&
        g.supplier.name.toLowerCase().includes(search.toLowerCase()));

    return matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredGrns.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedGrns = filteredGrns.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="w-full min-h-full bg-white text-slate-700 font-sans px-4 sm:px-5 py-3.5 space-y-3.5 select-none pb-16">
      {/* 1. Executive Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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
              borderColor: "#bfdbfe",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
            }}
          >
            <PackageCheck className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-[17px] font-semibold text-slate-800 tracking-tight">
              Goods Received Notes (GRN)
            </h1>
            <span
              className="px-2 py-0.5 rounded-full text-[10.5px] font-normal"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "1px solid #cbd5e1",
              }}
            >
              {grns.length} records
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-3.5 py-1.5 text-[11.5px] font-medium rounded-lg text-white hover:opacity-95 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto shadow-2xs"
          style={{
            backgroundColor: "#1d4ed8",
            color: "#ffffff",
            border: "1px solid #1e40af",
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Goods Receipt</span>
        </button>
      </div>

      {/* Procurement Cycle Horizontal Quick Navigation */}
      <ProcurementQuickNav />

      {/* 2. Four Compact Pastel KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            TOTAL RECEIPTS PROCESSED
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            {grns.length} GRNs
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block truncate">
            Cumulative received shipments
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            INVENTORY SYNC STATUS
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-emerald-700 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            Real-Time Stock
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block truncate">
            Direct stock balance updates
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#fefce8", border: "1px solid #fde047" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            ACTIVE WAREHOUSES
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-amber-800 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            {warehouses.length} Facilities
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block truncate">
            Receiving storage locations
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            LINKED PURCHASE ORDERS
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-[#1d4ed8] leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            {purchaseOrders.length} Orders
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block truncate">
            Procurement cycle step 2
          </span>
        </div>
      </div>

      {/* 3. Soft Filter Bar */}
      <div
        className="rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search GRN number, delivery note, supplier..."
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
            }}
            className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs font-normal text-slate-700 placeholder-slate-400 outline-none focus:border-blue-600 transition-colors"
          />
        </div>

        <div className="text-xs text-slate-500 font-normal">
          Total: <span className="font-medium text-slate-800">{filteredGrns.length} GRNs</span>
        </div>
      </div>

      {/* 4. Table Card with Responsive Pagination */}
      <div
        className="rounded-xl overflow-hidden bg-white"
        style={{ border: "1px solid #cbd5e1" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr
                className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 select-none"
                style={{
                  backgroundColor: "#f4f7fb",
                  borderBottom: "1px solid #cbd5e1",
                }}
              >
                <th className="py-2.5 px-4 font-medium text-slate-600">GRN No</th>
                <th className="py-2.5 px-4 font-medium text-slate-600">Supplier / Vendor</th>
                <th className="py-2.5 px-4 font-medium text-slate-600">Delivery Note</th>
                <th className="py-2.5 px-4 font-medium text-slate-600">Destination Warehouse</th>
                <th className="py-2.5 px-3 font-medium text-slate-600">Receipt Date</th>
                <th className="py-2.5 px-3 font-medium text-slate-600 text-center">Status</th>
                <th className="py-2.5 px-3 font-medium text-slate-600 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Loading goods receipts...
                  </td>
                </tr>
              ) : paginatedGrns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No goods receipts found.
                  </td>
                </tr>
              ) : (
                paginatedGrns.map((g) => (
                  <tr
                    key={g.id}
                    onClick={() => setSelectedGrn(g)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-4 font-mono text-slate-800 whitespace-nowrap">
                      <span
                        className="font-mono text-[11px] font-medium px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        {g.grnNumber}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      {g.supplier?.name || "Vendor"}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">
                      {g.deliveryNoteNumber || "—"}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {g.warehouse?.name || "Main Warehouse"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {g.receiptDate
                        ? new Date(g.receiptDate).toISOString().slice(0, 10)
                        : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: "#f0fdf4",
                          color: "#15803d",
                          border: "1px solid #86efac",
                        }}
                      >
                        {g.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right pr-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGrn(g);
                        }}
                        className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-[#1d4ed8] hover:bg-[#eff6ff] border border-transparent hover:border-[#bfdbfe] transition-all cursor-pointer"
                        title="View GRN"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredGrns.length > 0 && (
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t select-none"
            style={{ borderColor: "#cbd5e1" }}
          >
            <div className="text-xs text-slate-500 font-normal">
              Showing{" "}
              <span className="font-medium text-slate-800">{startIndex + 1}</span> to{" "}
              <span className="font-medium text-slate-800">
                {Math.min(startIndex + PAGE_SIZE, filteredGrns.length)}
              </span>{" "}
              of <span className="font-medium text-slate-800">{filteredGrns.length}</span> receipts
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[#cbd5e1] hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const isActive = p === currentPage;
                if (
                  p === 1 ||
                  p === totalPages ||
                  (p >= currentPage - 1 && p <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      style={
                        isActive
                          ? {
                              backgroundColor: "#1d4ed8",
                              color: "#ffffff",
                              borderColor: "#1d4ed8",
                            }
                          : { borderColor: "#cbd5e1" }
                      }
                      className={`min-w-8 h-8 px-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        isActive
                          ? ""
                          : "text-slate-700 hover:bg-slate-50 bg-white"
                      }`}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === currentPage - 2 || p === currentPage + 2) {
                  return (
                    <span key={p} className="px-1 text-slate-400 text-xs">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[#cbd5e1] hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create GRN Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={handleCloseCreate}
          title="Create Goods Received Note (GRN)"
          maxWidth="2xl"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4 text-xs font-normal"
          >
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {formError}
              </div>
            )}

            {/* Section 1: Receiving Logistics */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Logistics &amp; Source Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <form.Field name="purchaseOrderId">
                  {(field) => (
                    <FormSelect
                      field={field}
                      label="Link Purchase Order (Optional)"
                      className="font-mono"
                      onChange={(e) => handleSelectPo(e.target.value)}
                    >
                      <option value="">Direct Receiving (No PO)</option>
                      {purchaseOrders
                        .filter(
                          (p) =>
                            p.status !== "RECEIVED" && p.status !== "CANCELLED",
                        )
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.poNumber} - {p.supplier?.name} (AED{" "}
                            {Number(p.totalAmount).toFixed(2)})
                          </option>
                        ))}
                    </FormSelect>
                  )}
                </form.Field>

                <form.Field name="warehouseId">
                  {(field) => (
                    <FormSelect
                      field={field}
                      label="Destination Warehouse *"
                      required
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.location || "Warehouse"})
                        </option>
                      ))}
                    </FormSelect>
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <form.Field name="supplierId">
                  {(field) => (
                    <FormSelect field={field} label="Supplier / Vendor">
                      <option value="">Select supplier...</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </FormSelect>
                  )}
                </form.Field>

                <form.Field name="deliveryNoteNumber">
                  {(field) => (
                    <FormInput
                      field={field}
                      label="Delivery Note No (DN)"
                      placeholder="e.g. DN-92837"
                      className="font-mono"
                    />
                  )}
                </form.Field>

                <form.Field name="receiptDate">
                  {(field) => (
                    <FormInput
                      field={field}
                      label="Receipt Date *"
                      type="date"
                      required
                    />
                  )}
                </form.Field>
              </div>
            </div>

            {/* Section 2: Received Items Table */}
            <form.Field name="items">
              {(itemsField) => (
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">
                        Received Items &amp; Stock Verification
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        {itemsField.state.value.length} {itemsField.state.value.length === 1 ? "Item" : "Items"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={addItem}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      style={{
                        backgroundColor: "#eff6ff",
                        color: "#1d4ed8",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product Line</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                    {itemsField.state.value.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center bg-slate-50/70 p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <div className="col-span-12 sm:col-span-6">
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5 sm:hidden">
                            Product
                          </label>
                          <select
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#cbd5e1] bg-white text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                            value={item.productId}
                            onChange={(e) =>
                              updateItem(idx, "productId", e.target.value)
                            }
                            required
                          >
                            <option value="">Select Product...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-5 sm:col-span-3">
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5 sm:hidden">
                            Qty Received
                          </label>
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty Recv"
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#cbd5e1] bg-white text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono text-center transition-all"
                            value={item.quantityReceived}
                            onChange={(e) =>
                              updateItem(
                                idx,
                                "quantityReceived",
                                e.target.value,
                              )
                            }
                            required
                          />
                        </div>
                        <div className="col-span-5 sm:col-span-2">
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5 sm:hidden">
                            Qty Accepted
                          </label>
                          <input
                            type="number"
                            min="0"
                            placeholder="Accepted"
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#cbd5e1] bg-white text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono text-center font-medium transition-all"
                            value={item.quantityAccepted}
                            onChange={(e) =>
                              updateItem(
                                idx,
                                "quantityAccepted",
                                e.target.value,
                              )
                            }
                            required
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            disabled={itemsField.state.value.length === 1}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                            title="Remove line item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form.Field>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCloseCreate}
                className="px-3.5 py-1.5 text-xs font-medium border border-[#cbd5e1] rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createGrnMutation.isPending}
                className="px-4 py-1.5 text-xs font-medium rounded-lg text-white hover:opacity-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                style={{
                  backgroundColor: "#1d4ed8",
                  color: "#ffffff",
                  border: "1px solid #1e40af",
                }}
              >
                {createGrnMutation.isPending ? "Confirming..." : "Confirm Receipt & Update Stock"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Selected GRN Inspection Modal */}
      {selectedGrn && (
        <Modal
          isOpen={!!selectedGrn}
          onClose={() => setSelectedGrn(null)}
          title={`Goods Receipt: ${selectedGrn.grnNumber}`}
        >
          <div className="space-y-4 text-xs font-normal">
            <div
              className="p-3.5 rounded-xl border space-y-1.5"
              style={{ backgroundColor: "#f4f7fb", borderColor: "#cbd5e1" }}
            >
              <div className="flex justify-between items-center font-mono">
                <span
                  className="font-medium text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  {selectedGrn.grnNumber}
                </span>
                <span className="text-slate-500 text-xs">
                  {selectedGrn.receiptDate
                    ? new Date(selectedGrn.receiptDate)
                        .toISOString()
                        .slice(0, 10)
                    : ""}
                </span>
              </div>
              <p className="font-medium text-slate-800">
                Supplier: {selectedGrn.supplier?.name || "Vendor"}
              </p>
              <p className="text-slate-600">
                Warehouse: {selectedGrn.warehouse?.name || "Main Warehouse"}
              </p>
              <p className="text-slate-500 font-mono text-[11px]">
                Delivery Note: {selectedGrn.deliveryNoteNumber || "N/A"}
              </p>
            </div>

            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid #cbd5e1" }}
            >
              <table className="w-full text-xs text-left">
                <thead>
                  <tr
                    className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500"
                    style={{ backgroundColor: "#f4f7fb", borderBottom: "1px solid #cbd5e1" }}
                  >
                    <th className="py-2 px-3 font-medium text-slate-600">Product</th>
                    <th className="py-2 px-3 font-medium text-slate-600 text-right">Received</th>
                    <th className="py-2 px-3 font-medium text-slate-600 text-right">Accepted</th>
                    <th className="py-2 px-3 font-medium text-slate-600 text-right">Damaged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedGrn.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-800">
                        {item.product?.name || "Product"}
                      </td>
                      <td className="py-2 px-3 font-mono text-right text-slate-700">
                        {item.quantityReceived}
                      </td>
                      <td className="py-2 px-3 font-mono text-right font-medium text-emerald-700">
                        {item.quantityAccepted}
                      </td>
                      <td className="py-2 px-3 font-mono text-right text-rose-700">
                        {item.quantityDamaged}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedGrn(null)}
                className="px-3 py-1.5 text-xs font-medium border border-[#cbd5e1] rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-white hover:bg-[#1e40af] flex items-center gap-1.5 transition-colors cursor-pointer"
                style={{
                  backgroundColor: "#1d4ed8",
                  color: "#ffffff",
                  border: "1px solid #1e40af",
                }}
              >
                <Printer size={13} />
                <span>Print GRN</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
