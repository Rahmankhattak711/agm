"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
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
} from "@/components/ui";
import {
  useSalesOrders,
  useCreateSalesOrder,
  useConvertSalesOrderToInvoice,
  useCustomers,
  useProducts,
  SalesOrder,
} from "@/lib/hooks/api-hooks";

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

  // Form State
  const [orderNumber, setOrderNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [projectScope, setProjectScope] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([
    {
      productId: "",
      description: "Fitout Scope Milestone",
      quantity: 1,
      unitPrice: 0,
      unit: "SQM",
    },
  ]);

  const addItem = () => {
    setItems([
      ...items,
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
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const next = [...items];
    (next[idx] as any)[field] = value;
    setItems(next);
  };

  const formSubtotal = items.reduce(
    (s, i) => s + (parseFloat(String(i.quantity)) || 0) * (parseFloat(String(i.unitPrice)) || 0),
    0,
  );
  const formVat = formSubtotal * 0.05;
  const formTotal = formSubtotal + formVat;

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrderMutation.mutateAsync({
        orderNumber: orderNumber || undefined,
        customerId: customerId || undefined,
        customerName: customerName || "Valued Customer",
        projectScope,
        deliveryDate: deliveryDate || undefined,
        notes,
        items,
      });
      setIsCreateOpen(false);
      setCustomerName("");
      setCustomerId("");
      setProjectScope("");
      setNotes("");
      setItems([
        {
          productId: "",
          description: "Fitout Scope Milestone",
          quantity: 1,
          unitPrice: 0,
          unit: "SQM",
        },
      ]);
    } catch (err: any) {
      alert(`Error creating sales order: ${err.message}`);
    }
  };

  const handleConvertToInvoice = async (soId: string) => {
    try {
      await convertInvoiceMutation.mutateAsync(soId);
      alert("Sales Order converted to Sales Invoice successfully!");
    } catch (err: any) {
      alert(`Error converting to invoice: ${err.message}`);
    }
  };

  const filteredOrders = salesOrders.filter((so) => {
    const matchesSearch =
      so.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      so.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (so.projectScope &&
        so.projectScope.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || so.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalContractValue = filteredOrders.reduce(
    (s, o) => s + Number(o.totalAmount),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Sales Orders & Contracts
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
              Sales Cycle — Step 2
            </span>
          </div>
          <p className="text-xs text-slate-500">
            AGM FITOUT TECHNICAL SERVICES LLC — Track confirmed customer sales orders, delivery timelines, project commitments, and convert them to Sales Invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="dark"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus size={14} />}
            className="text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
          >
            Create Sales Order
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
            Total Sales Orders Value
          </p>
          <p className="text-xl font-black text-blue-950 font-mono">
            AED {totalContractValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Confirmed / In Progress
          </p>
          <p className="text-xl font-black text-emerald-950 font-mono">
            {salesOrders.filter((s) => s.status === "CONFIRMED" || s.status === "PROCESSING").length} Orders
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-50/80 rounded-2xl border border-slate-200/70">
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search order number, customer, project scope..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {["ALL", "CONFIRMED", "PROCESSING", "COMPLETED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
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
                    {so.orderDate ? new Date(so.orderDate).toISOString().slice(0, 10) : "—"}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-slate-900"
                  >
                    AED {Number(so.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(so)}
                        className="p-1 text-slate-400 hover:text-blue-700 rounded-md hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye size={13} />
                      </button>
                      {so.status !== "COMPLETED" && (
                        <Button
                          variant="dark"
                          size="sm"
                          onClick={() => handleConvertToInvoice(so.id)}
                          icon={<Receipt size={12} />}
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

      {/* Create Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create New Sales Order"
        >
          <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Customer
                </label>
                <select
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 font-semibold"
                  value={customerId}
                  onChange={(e) => {
                    setCustomerId(e.target.value);
                    const c = customers.find((cust) => cust.id === e.target.value);
                    if (c) setCustomerName(c.name);
                  }}
                >
                  <option value="">Select registered customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Customer / Entity Name
                </label>
                <input
                  type="text"
                  placeholder="Customer Name"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 font-semibold"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Project Scope / Description
              </label>
              <input
                type="text"
                placeholder="e.g. Luxury Penthouse Fitout - Full Turnkey"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500"
                value={projectScope}
                onChange={(e) => setProjectScope(e.target.value)}
              />
            </div>

            {/* Scope Items */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Order Line Items</span>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus size={13} /> Add Line
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200/60"
                  >
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="Description..."
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(idx, "description", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 font-mono"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(idx, "quantity", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Unit Price"
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-blue-500 font-mono font-bold"
                        value={item.unitPrice || ""}
                        onChange={(e) =>
                          updateItem(idx, "unitPrice", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs text-right space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Excl. VAT):</span>
                <span>AED {formSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>5% UAE VAT:</span>
                <span>AED {formVat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200 pt-1">
                <span>Total Order Value:</span>
                <span className="text-blue-800">AED {formTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="dark"
                size="sm"
                type="submit"
                className="bg-blue-700 text-white hover:bg-blue-800"
              >
                Confirm & Create Sales Order
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Details View Modal */}
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
                <p className="font-bold text-blue-900">{selectedOrder.orderNumber}</p>
                <p className="text-slate-500">
                  {selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toISOString().slice(0, 10) : ""}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <Table className="w-full text-xs">
                <TableHead className="bg-slate-50">
                  <TableHeaderCell className="py-2 px-3">Description</TableHeaderCell>
                  <TableHeaderCell align="right" className="py-2 px-3">Qty</TableHeaderCell>
                  <TableHeaderCell align="right" className="py-2 px-3">Rate</TableHeaderCell>
                  <TableHeaderCell align="right" className="py-2 px-3">Total</TableHeaderCell>
                </TableHead>
                <TableBody>
                  {selectedOrder.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-2 px-3 font-medium">
                        {item.description}
                      </TableCell>
                      <TableCell align="right" className="py-2 px-3 font-mono">
                        {item.quantity}
                      </TableCell>
                      <TableCell align="right" className="py-2 px-3 font-mono">
                        {Number(item.unitPrice).toFixed(2)}
                      </TableCell>
                      <TableCell align="right" className="py-2 px-3 font-mono font-bold">
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
                  icon={<Receipt size={13} />}
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
