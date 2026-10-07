"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Eye,
  PackageCheck,
  Plus,
  Printer,
  Search,
  Trash2,
  Warehouse,
} from "lucide-react";
import {
  Button,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  Modal,
  FormInput,
  FormSelect,
  FormTextarea,
  FormSubmit,
  Badge,
  PageHeader,
  FilterBar,
} from "@/components/ui";
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

export default function GoodsReceivedPage() {
  const { data: grns = [], isLoading } = useGoodsReceipts();
  const { data: purchaseOrders = [] } = usePurchaseOrders();
  const { data: suppliers = [] } = useSuppliers();
  const { data: warehouses = [] } = useWarehouses();
  const { data: products = [] } = useProducts();

  const createGrnMutation = useCreateGoodsReceipt();

  const [search, setSearch] = useState("");
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
    if (current.length <= 1) return;
    form.setFieldValue(
      "items",
      current.filter((_, i) => i !== idx),
    );
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const current = [...form.getFieldValue("items")];
    (current[idx] as any)[field] = value;
    form.setFieldValue("items", current);
  };

  const handleSelectPo = (poId: string) => {
    form.setFieldValue("purchaseOrderId", poId);
    const po = purchaseOrders.find((p) => p.id === poId);
    if (po) {
      if (po.supplierId) form.setFieldValue("supplierId", po.supplierId);
      if (po.items && po.items.length > 0) {
        form.setFieldValue(
          "items",
          po.items.map((i) => {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goods Received Notes (GRN)"
        badge={
          <Badge tone="teal" size="md">
            Procurement Cycle — Step 2
          </Badge>
        }
        description="Verify warehouse shipments against purchase orders, record received items, and update inventory balances."
        actions={
          <Button
            variant="dark"
            size="sm"
            onClick={handleOpenCreate}
            icon={<Plus size={14} />}
            className="text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
          >
            Create Goods Receipt
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
            Total Receipts Processed
          </p>
          <p className="text-xl font-black text-teal-950 font-mono">
            {grns.length} GRNs
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Inventory Sync Status
          </p>
          <p className="text-xl font-black text-emerald-950 font-mono">
            Real-Time Stock Updates
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
            Active Warehouses
          </p>
          <p className="text-xl font-black text-blue-950 font-mono">
            {warehouses.length} Facilities
          </p>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search GRN number, delivery note, supplier..."
        totalCount={grns.length}
        countLabel="GRNs Listed"
      />

      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs bg-white">
        <Table className="w-full text-xs text-left">
          <TableHead className="bg-slate-50/95 border-b border-slate-200">
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              GRN No
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Supplier / Vendor
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Delivery Note
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Destination Warehouse
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Date Received
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Status
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[11px]">
              View
            </TableHeaderCell>
          </TableHead>

          <TableBody className="divide-y divide-slate-100">
            {isLoading ? (
              <TableLoading colSpan={7} rows={5} />
            ) : filteredGrns.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-slate-400 italic"
                >
                  No goods receipts found.
                </TableCell>
              </TableRow>
            ) : (
              filteredGrns.map((g) => (
                <TableRow
                  key={g.id}
                  className="hover:bg-slate-50/60 text-slate-700 transition"
                >
                  <TableCell className="py-3 px-4 font-mono font-bold text-teal-950">
                    {g.grnNumber}
                  </TableCell>
                  <TableCell className="py-3 px-4 font-bold text-slate-900">
                    {g.supplier?.name || "Vendor"}
                  </TableCell>
                  <TableCell className="py-3 px-4 font-mono text-slate-600">
                    {g.deliveryNoteNumber || "—"}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-slate-700">
                    {g.warehouse?.name || "Main Warehouse"}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-slate-600">
                    {g.receiptDate
                      ? new Date(g.receiptDate).toISOString().slice(0, 10)
                      : "—"}
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {g.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedGrn(g)}
                      className="p-1 text-slate-400 hover:text-teal-700 rounded-md hover:bg-teal-50"
                      title="View GRN"
                    >
                      <Eye size={13} />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={handleCloseCreate}
          title="Create Goods Received Note (GRN)"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4 text-xs"
          >
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {formError}
              </div>
            )}

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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    label="Supplier Delivery Note No (DN)"
                    placeholder="e.g. DN-92837"
                    className="font-mono"
                  />
                )}
              </form.Field>
            </div>

            <form.Field name="items">
              {(itemsField) => (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Received Items
                    </span>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Add Line
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {itemsField.state.value.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200/60"
                      >
                        <div className="col-span-5">
                          <select
                            className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-teal-500"
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
                        <div className="col-span-3">
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty Recv"
                            className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-teal-500 font-mono"
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
                        <div className="col-span-3">
                          <input
                            type="number"
                            min="0"
                            placeholder="Qty Accepted"
                            className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-teal-500 font-mono font-bold"
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
                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form.Field>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleCloseCreate}
              >
                Cancel
              </Button>
              <FormSubmit
                form={form}
                size="sm"
                className="bg-teal-700 text-white hover:bg-teal-800 font-bold"
              >
                Confirm Receipt &amp; Update Stock
              </FormSubmit>
            </div>
          </form>
        </Modal>
      )}

      {selectedGrn && (
        <Modal
          isOpen={!!selectedGrn}
          onClose={() => setSelectedGrn(null)}
          title={`Goods Receipt: ${selectedGrn.grnNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between font-mono">
                <span className="font-bold text-teal-950">
                  {selectedGrn.grnNumber}
                </span>
                <span className="text-slate-500">
                  {selectedGrn.receiptDate
                    ? new Date(selectedGrn.receiptDate)
                        .toISOString()
                        .slice(0, 10)
                    : ""}
                </span>
              </div>
              <p className="font-bold text-slate-900">
                Supplier: {selectedGrn.supplier?.name || "Vendor"}
              </p>
              <p className="text-slate-600">
                Warehouse: {selectedGrn.warehouse?.name || "Main Warehouse"}
              </p>
              <p className="text-slate-500 font-mono">
                Delivery Note: {selectedGrn.deliveryNoteNumber || "N/A"}
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <Table className="w-full text-xs">
                <TableHead className="bg-slate-50">
                  <TableHeaderCell className="py-2 px-3">
                    Product
                  </TableHeaderCell>
                  <TableHeaderCell align="right" className="py-2 px-3">
                    Received
                  </TableHeaderCell>
                  <TableHeaderCell align="right" className="py-2 px-3">
                    Accepted
                  </TableHeaderCell>
                  <TableHeaderCell align="right" className="py-2 px-3">
                    Damaged
                  </TableHeaderCell>
                </TableHead>
                <TableBody>
                  {selectedGrn.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-2 px-3">
                        {item.product?.name || "Product"}
                      </TableCell>
                      <TableCell align="right" className="py-2 px-3 font-mono">
                        {item.quantityReceived}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-2 px-3 font-mono font-bold text-emerald-800"
                      >
                        {item.quantityAccepted}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-2 px-3 font-mono text-rose-700"
                      >
                        {item.quantityDamaged}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedGrn(null)}
              >
                Close
              </Button>
              <Button
                variant="dark"
                size="sm"
                onClick={() => window.print()}
                icon={<Printer size={13} />}
                className="bg-slate-900 text-white"
              >
                Print GRN
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
