"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "@/lib/toast";
import {
  EyeIcon,
  PlusIcon,
  ReceiptIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import {
  Button,
  Input,
  Select,
  Textarea,
  FormInput,
  FormSelect,
  FormTextarea,
  FormSubmit,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  Modal,
  Badge,
} from "@/components/ui";
import {
  useSalesOrders,
  useCreateSalesOrder,
  useConvertSalesOrderToInvoice,
  useCustomers,
  useProducts,
  SalesOrder,
} from "@/lib/hooks/api-hooks";

function parseDescriptionPoints(desc: string): string[] {
  if (!desc) return [];
  const normalized = String(desc).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const parts = normalized
    .split(/(?:\n+|(?<=\S)\s+(?=\d+[\.\)]\s+)|(?<=\S)\s+(?=[•\-*]\s+))/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [desc];
}

export default function SalesOrdersPage() {
  const { data: salesOrders = [], isLoading } = useSalesOrders();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();

  const createOrderMutation = useCreateSalesOrder();
  const convertInvoiceMutation = useConvertSalesOrderToInvoice();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  const createOrderForm = useForm({
    defaultValues: {
      orderNumber: "",
      customerId: "",
      customerName: "",
      projectScope: "",
      deliveryDate: "",
      notes: "",
      items: [
        {
          productId: "",
          description: "Fitout Scope Milestone",
          quantity: 1,
          unitPrice: 0,
          unit: "SQM",
        },
      ],
    },
    onSubmit: async ({ value }) => {
      try {
        await createOrderMutation.mutateAsync({
          orderNumber: value.orderNumber || undefined,
          customerId: value.customerId || undefined,
          customerName: value.customerName || "Valued Customer",
          projectScope: value.projectScope,
          deliveryDate: value.deliveryDate || undefined,
          notes: value.notes,
          items: value.items,
        });
        toast.success("Sales order created successfully!");
        setIsCreateOpen(false);
        createOrderForm.reset();
      } catch (err: any) {
        toast.error(`Error creating sales order: ${err.message}`);
      }
    },
  });

  const addItem = () => {
    const current = createOrderForm.getFieldValue("items");
    createOrderForm.setFieldValue("items", [
      ...current,
      {
        productId: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        unit: "SQM",
      },
    ]);
  };

  const removeItem = (idx: number) => {
    const current = createOrderForm.getFieldValue("items");
    if (current.length <= 1) return;
    createOrderForm.setFieldValue(
      "items",
      current.filter((_, i) => i !== idx),
    );
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const current = [...createOrderForm.getFieldValue("items")];
    (current[idx] as any)[field] = value;
    createOrderForm.setFieldValue("items", current);
  };

  const handleOpenCreate = () => {
    createOrderForm.reset();
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    createOrderForm.reset();
    setIsCreateOpen(false);
  };

  const handleConvertToInvoice = async (soId: string) => {
    try {
      await convertInvoiceMutation.mutateAsync(soId);
      toast.success("Sales Order converted to Sales Invoice successfully!");
    } catch (err: any) {
      toast.error(`Error converting to invoice: ${err.message}`);
    }
  };

  const filteredOrders = salesOrders.filter((so) => {
    const matchesSearch =
      so.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      so.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (so.projectScope &&
        so.projectScope.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || so.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalContractValue = filteredOrders.reduce(
    (s, o) => s + Number(o.totalAmount),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Sales Orders
            </h2>
            <Badge tone="blue" size="md">
              Sales Cycle — Step 2
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Track confirmed customer orders, delivery timelines, and convert
            commitments into sales invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="dark"
            size="sm"
            onClick={handleOpenCreate}
            icon={<PlusIcon size={14} />}
            className="text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
          >
            Create Sales Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
            Total Sales Orders Value
          </p>
          <p className="text-xl font-black text-blue-950 font-mono">
            AED{" "}
            {totalContractValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Confirmed / In Progress
          </p>
          <p className="text-xl font-black text-emerald-950 font-mono">
            {
              salesOrders.filter(
                (s) => s.status === "CONFIRMED" || s.status === "PROCESSING",
              ).length
            }{" "}
            Orders
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Completed / Invoiced
          </p>
          <p className="text-xl font-black text-slate-900 font-mono">
            {salesOrders.filter((s) => s.status === "COMPLETED").length} Orders
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-50/80 rounded-2xl border border-slate-200/70">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search order number, customer, project scope..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<SearchIcon size={14} className="text-slate-400" />}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs overflow-x-auto no-scrollbar py-0.5 max-w-full">
          {["ALL", "CONFIRMED", "PROCESSING", "COMPLETED"].map((st) => (
            <Button
              key={st}
              type="button"
              variant={statusFilter === st ? "primary" : "secondary"}
              size="sm"
              onClick={() => setStatusFilter(st)}
              className={
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-2xs font-bold"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 font-bold"
              }
            >
              {st}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs bg-white">
        <Table className="w-full text-xs text-left">
          <TableHead className="bg-slate-50/95 border-b border-slate-200">
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Order No
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Customer
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Project Scope
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Order Date
            </TableHeaderCell>
            <TableHeaderCell
              align="right"
              className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-[11px]"
            >
              Total (AED)
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Status
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[11px]">
              Actions
            </TableHeaderCell>
          </TableHead>

          <TableBody className="divide-y divide-slate-100">
            {isLoading ? (
              <TableLoading colSpan={7} rows={5} />
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-slate-400 italic"
                >
                  No sales orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((so) => (
                <TableRow
                  key={so.id}
                  className="hover:bg-slate-50/60 text-slate-700 transition"
                >
                  <TableCell className="py-3 px-4 font-mono font-bold text-blue-950">
                    {so.orderNumber}
                  </TableCell>
                  <TableCell className="py-3 px-4 font-bold text-slate-900">
                    {so.customerName}
                  </TableCell>
                  <TableCell className="py-3 px-4 max-w-xs truncate text-slate-700">
                    {so.projectScope || "—"}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-slate-600">
                    {so.orderDate
                      ? new Date(so.orderDate).toISOString().slice(0, 10)
                      : "—"}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-slate-900"
                  >
                    AED{" "}
                    {Number(so.totalAmount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        so.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800"
                          : so.status === "CONFIRMED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {so.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(so)}
                        icon={<EyeIcon size={13} />}
                        className="p-1 text-slate-400 hover:text-blue-700 rounded-md hover:bg-blue-50"
                        title="View Details"
                      />
                      {so.status !== "COMPLETED" && (
                        <Button
                          variant="dark"
                          size="sm"
                          onClick={() => handleConvertToInvoice(so.id)}
                          icon={<ReceiptIcon size={12} />}
                          className="text-[10px] font-bold bg-blue-700 text-white hover:bg-blue-800"
                        >
                          Convert to Invoice
                        </Button>
                      )}
                    </div>
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
          title="Create New Sales Order"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              createOrderForm.handleSubmit();
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <createOrderForm.Field name="customerId">
                {(field) => (
                  <FormSelect
                    field={field}
                    label="Select Customer"
                    onChange={(e) => {
                      const cust = customers.find(
                        (c) => c.id === e.target.value,
                      );
                      if (cust) {
                        createOrderForm.setFieldValue(
                          "customerName",
                          cust.name,
                        );
                      }
                    }}
                  >
                    <option value="">Select registered customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerCode})
                      </option>
                    ))}
                  </FormSelect>
                )}
              </createOrderForm.Field>

              <createOrderForm.Field name="customerName">
                {(field) => (
                  <FormInput
                    field={field}
                    label="Customer / Entity Name *"
                    placeholder="Customer Name"
                    required
                  />
                )}
              </createOrderForm.Field>
            </div>

            <div>
              <createOrderForm.Field name="projectScope">
                {(field) => (
                  <FormInput
                    field={field}
                    label="Project Scope / Description"
                    placeholder="e.g. Luxury Penthouse Fitout - Full Turnkey"
                  />
                )}
              </createOrderForm.Field>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  Order Line Items
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addItem}
                  icon={<PlusIcon size={13} />}
                  className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  Add Line
                </Button>
              </div>

              <createOrderForm.Field name="items">
                {(itemsField) => {
                  const itemsList = itemsField.state.value || [];
                  return (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {itemsList.map((item, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-2 items-start bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs"
                        >
                          <div className="col-span-6">
                            <Textarea
                              rows={2}
                              placeholder="Description / scope points (press Enter for new points)..."
                              className="resize-y min-h-[36px]"
                              value={item.description}
                              onChange={(e) =>
                                updateItem(idx, "description", e.target.value)
                              }
                              required
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              min="1"
                              placeholder="Qty"
                              className="font-mono"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "quantity",
                                  parseFloat(e.target.value) || 1,
                                )
                              }
                              required
                            />
                          </div>
                          <div className="col-span-3">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Unit Price"
                              className="font-mono font-bold"
                              value={item.unitPrice || ""}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "unitPrice",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              required
                            />
                          </div>
                          <div className="col-span-1 text-center pt-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(idx)}
                              icon={<TrashIcon size={13} />}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }}
              </createOrderForm.Field>
            </div>

            <createOrderForm.Subscribe selector={(state) => state.values.items}>
              {(itemsList) => {
                const sub = (itemsList || []).reduce(
                  (s, i) =>
                    s +
                    (parseFloat(String(i.quantity)) || 0) *
                      (parseFloat(String(i.unitPrice)) || 0),
                  0,
                );
                const vat = sub * 0.05;
                const tot = sub + vat;
                return (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-right space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal (Excl. VAT):</span>
                      <span>AED {sub.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>5% UAE VAT:</span>
                      <span>AED {vat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200 pt-1">
                      <span>Total Order Value:</span>
                      <span className="text-blue-800">
                        AED {tot.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              }}
            </createOrderForm.Subscribe>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleCloseCreate}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <FormSubmit
                form={createOrderForm}
                className="bg-blue-700 text-white hover:bg-blue-800 cursor-pointer font-bold"
              >
                Confirm & Create Sales Order
              </FormSubmit>
            </div>
          </form>
        </Modal>
      )}

      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Sales Order: ${selectedOrder.orderNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">
                  {selectedOrder.customerName}
                </p>
                <p className="text-slate-600 mt-0.5">
                  Scope: {selectedOrder.projectScope || "General Fitout"}
                </p>
              </div>
              <div className="text-right font-mono">
                <p className="font-bold text-blue-900">
                  {selectedOrder.orderNumber}
                </p>
                <p className="text-slate-500">
                  {selectedOrder.orderDate
                    ? new Date(selectedOrder.orderDate)
                        .toISOString()
                        .slice(0, 10)
                    : ""}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <Table className="w-full text-xs">
                <TableHead className="bg-slate-50">
                  <TableHeaderCell className="py-2 px-3">
                    Description
                  </TableHeaderCell>
                  <TableHeaderCell align="right" className="py-2 px-3">
                    Qty
                  </TableHeaderCell>
                  <TableHeaderCell align="right" className="py-2 px-3">
                    Rate
                  </TableHeaderCell>
                  <TableHeaderCell align="right" className="py-2 px-3">
                    Total
                  </TableHeaderCell>
                </TableHead>
                <TableBody>
                  {selectedOrder.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-2 px-3 font-medium text-left">
                        {(() => {
                          const points = parseDescriptionPoints(
                            item.description,
                          );
                          if (points.length <= 1) {
                            return (
                              <div className="leading-snug text-slate-800 whitespace-pre-line text-left">
                                {item.description}
                              </div>
                            );
                          }
                          return (
                            <div className="space-y-1 text-slate-800 text-left">
                              {points.map((pt, pIdx) => {
                                const match = pt.match(
                                  /^(\d+[\.\)]|[•\-*])\s*(.*)$/,
                                );
                                if (match) {
                                  const [, bullet, text] = match;
                                  return (
                                    <div
                                      key={pIdx}
                                      className="leading-snug flex items-start gap-1.5"
                                    >
                                      <span className="font-bold text-slate-900 shrink-0 select-none">
                                        {bullet}
                                      </span>
                                      <span className="text-slate-800">
                                        {text}
                                      </span>
                                    </div>
                                  );
                                }
                                return (
                                  <div key={pIdx} className="leading-snug">
                                    {pt}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell align="right" className="py-2 px-3 font-mono">
                        {item.quantity}
                      </TableCell>
                      <TableCell align="right" className="py-2 px-3 font-mono">
                        {Number(item.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-2 px-3 font-mono font-bold"
                      >
                        {Number(item.totalAmount).toFixed(2)}
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
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </Button>
              {selectedOrder.status !== "COMPLETED" && (
                <Button
                  variant="dark"
                  size="sm"
                  onClick={() => {
                    handleConvertToInvoice(selectedOrder.id);
                    setSelectedOrder(null);
                  }}
                  icon={<ReceiptIcon size={13} />}
                  className="bg-blue-700 text-white"
                >
                  Convert to Sales Invoice
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
