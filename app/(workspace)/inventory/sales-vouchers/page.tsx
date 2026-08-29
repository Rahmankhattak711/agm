"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Plus,
  Printer,
  Search,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import {
  Button,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Modal,
} from "@/components/ui";
import { useProducts } from "@/lib/hooks/api-hooks";

interface SalesVoucherLine {
  id: string;
  description: string;
  quantity: number;
  unitRate: number;
  total: number;
}

interface SalesVoucher {
  id: string;
  voucherNumber: string;
  customerName: string;
  customerTrn: string;
  projectScope: string;
  date: string;
  dueDate: string;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  status: "DRAFT" | "POSTED" | "PAID" | "OVERDUE" | "CANCELLED";
  lines: SalesVoucherLine[];
}

const INITIAL_SALES_VOUCHERS: SalesVoucher[] = [
  {
    id: "sv-1",
    voucherNumber: "SV-2026-001",
    customerName: "Brian Berthelsen",
    customerTrn: "100294857200003",
    projectScope: "Townhouse Fitout - Phase 1 Milestones",
    date: "2026-08-15",
    dueDate: "2026-08-30",
    subtotal: 55000.0,
    vatAmount: 2750.0,
    totalAmount: 57750.0,
    status: "PAID",
    lines: [
      {
        id: "l1",
        description: "Preliminary Mobilization and Site Protection",
        quantity: 1,
        unitRate: 15000.0,
        total: 15000.0,
      },
      {
        id: "l2",
        description: "Guest Bathroom Demolition & Sanitary Installation",
        quantity: 1,
        unitRate: 40000.0,
        total: 40000.0,
      },
    ],
  },
  {
    id: "sv-2",
    voucherNumber: "SV-2026-002",
    customerName: "Horizon Luxury Villas",
    customerTrn: "100849204800003",
    projectScope: "Villa Majlis Carpentry & Glass Works",
    date: "2026-08-22",
    dueDate: "2026-09-06",
    subtotal: 72000.0,
    vatAmount: 3600.0,
    totalAmount: 75600.0,
    status: "POSTED",
    lines: [
      {
        id: "l3",
        description: "Custom Wood Wall Paneling & Decorative Molding",
        quantity: 1,
        unitRate: 45000.0,
        total: 45000.0,
      },
      {
        id: "l4",
        description: "12mm Tempered Frosted Glass Partitions",
        quantity: 1,
        unitRate: 27000.0,
        total: 27000.0,
      },
    ],
  },
];

export default function SalesVouchersPage() {
  const { data: products = [] } = useProducts();

  const [vouchers, setVouchers] = useState<SalesVoucher[]>(
    INITIAL_SALES_VOUCHERS,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<SalesVoucher | null>(
    null,
  );

  const [customerName, setCustomerName] = useState("");
  const [customerTrn, setCustomerTrn] = useState("");
  const [projectScope, setProjectScope] = useState("");
  const [voucherDate, setVoucherDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [lines, setLines] = useState<SalesVoucherLine[]>([
    {
      id: "1",
      description: "Fitout Installation & Material Supply",
      quantity: 1,
      unitRate: 0,
      total: 0,
    },
  ]);

  const addLine = () => {
    setLines([
      ...lines,
      {
        id: String(Date.now()),
        description: "",
        quantity: 1,
        unitRate: 0,
        total: 0,
      },
    ]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (
    idx: number,
    field: "description" | "quantity" | "unitRate",
    value: any,
  ) => {
    const next = [...lines];
    if (field === "description") {
      next[idx].description = value;
    } else if (field === "quantity") {
      const q = parseFloat(value) || 0;
      next[idx].quantity = q;
      next[idx].total = q * next[idx].unitRate;
    } else if (field === "unitRate") {
      const r = parseFloat(value) || 0;
      next[idx].unitRate = r;
      next[idx].total = next[idx].quantity * r;
    }
    setLines(next);
  };

  const formSubtotal = lines.reduce((s, l) => s + l.total, 0);
  const formVat = formSubtotal * 0.05;
  const formTotal = formSubtotal + formVat;

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || lines.length === 0 || formSubtotal <= 0) return;

    const newVoucher: SalesVoucher = {
      id: `sv-${Date.now()}`,
      voucherNumber: `SV-2026-${(vouchers.length + 1).toString().padStart(3, "0")}`,
      customerName,
      customerTrn: customerTrn || "—",
      projectScope: projectScope || "General Fitout Contract",
      date: voucherDate,
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      subtotal: formSubtotal,
      vatAmount: formVat,
      totalAmount: formTotal,
      status: "POSTED",
      lines,
    };

    setVouchers([newVoucher, ...vouchers]);
    setIsCreateOpen(false);
    setCustomerName("");
    setCustomerTrn("");
    setProjectScope("");
    setLines([
      {
        id: "1",
        description: "Fitout Installation & Material Supply",
        quantity: 1,
        unitRate: 0,
        total: 0,
      },
    ]);
  };

  const filteredVouchers = vouchers.filter((item) => {
    const matchesSearch =
      item.voucherNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      item.projectScope.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalSalesRevenue = filteredVouchers.reduce(
    (s, v) => s + v.totalAmount,
    0,
  );
  const totalVatCollected = filteredVouchers.reduce(
    (s, v) => s + v.vatAmount,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Commercial Sales Vouchers
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Tax Invoices & Billing
            </span>
          </div>
          <p className="text-xs text-slate-500">
            AGM FITOUT TECHNICAL SERVICES LLC — Commercial sales vouchers,
            client billing schedules, and FTA 5% Output VAT tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus size={14} />}
          >
            Create Sales Voucher
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Total Sales Billed (Incl. VAT)
          </p>
          <p className="text-xl font-black text-emerald-950 font-mono">
            AED{" "}
            {totalSalesRevenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
            Output VAT 5% Collected
          </p>
          <p className="text-xl font-black text-blue-950 font-mono">
            AED{" "}
            {totalVatCollected.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Active Vouchers
          </p>
          <p className="text-xl font-black text-slate-900 font-mono">
            {vouchers.length} Vouchers
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-50/80 rounded-2xl border border-slate-200/70">
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search voucher number, client, project..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {["ALL", "POSTED", "PAID", "DRAFT"].map((st) => (
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

      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs bg-white">
        <Table className="w-full text-xs text-left">
          <TableHead className="bg-slate-50/95 border-b border-slate-200">
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Voucher No
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Client / Customer
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Project Scope
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Date
            </TableHeaderCell>
            <TableHeaderCell
              align="right"
              className="py-3 px-3 text-right font-bold text-slate-600 uppercase text-[11px]"
            >
              Subtotal (AED)
            </TableHeaderCell>
            <TableHeaderCell
              align="right"
              className="py-3 px-3 text-right font-bold text-slate-600 uppercase text-[11px]"
            >
              VAT 5% (AED)
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
            <TableHeaderCell className="py-3 px-3 text-center w-16">
              View
            </TableHeaderCell>
          </TableHead>

          <TableBody className="divide-y divide-slate-100">
            {filteredVouchers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="py-8 text-center text-slate-400 italic"
                >
                  No sales vouchers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredVouchers.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-slate-50/60 text-slate-700 transition"
                >
                  <TableCell className="py-3 px-4 font-mono font-bold text-emerald-900">
                    {item.voucherNumber}
                  </TableCell>
                  <TableCell className="py-3 px-4 font-bold text-slate-900">
                    <div>{item.customerName}</div>
                    {item.customerTrn && item.customerTrn !== "—" && (
                      <div className="text-[10px] text-slate-500 font-mono">
                        TRN: {item.customerTrn}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4 max-w-xs truncate text-slate-700 font-medium">
                    {item.projectScope}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-slate-600">
                    {item.date}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-3 text-right font-mono text-slate-700"
                  >
                    {item.subtotal.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-3 text-right font-mono text-slate-600 font-semibold"
                  >
                    {item.vatAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell
                    align="right"
                    className="py-3 px-4 text-right font-mono font-black text-slate-900"
                  >
                    {item.totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === "PAID"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.status === "POSTED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedVoucher(item)}
                      className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="View Voucher"
                    >
                      <Eye size={14} />
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
          onClose={() => setIsCreateOpen(false)}
          title="Create Commercial Sales Voucher"
        >
          <form onSubmit={handleCreateVoucher} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Client / Customer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Al Futtaim Group"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-semibold"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Client TRN (Tax No)
                </label>
                <input
                  type="text"
                  placeholder="100XXXXXXXXX003"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono"
                  value={customerTrn}
                  onChange={(e) => setCustomerTrn(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Voucher Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500"
                  value={voucherDate}
                  onChange={(e) => setVoucherDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Project / Site Scope
              </label>
              <input
                type="text"
                placeholder="e.g. Commercial Office Fitout - Level 12"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500"
                value={projectScope}
                onChange={(e) => setProjectScope(e.target.value)}
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  Billing Items & Scope Lines
                </span>
                <button
                  type="button"
                  onClick={addLine}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <Plus size={13} /> Add Item
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {lines.map((line, idx) => (
                  <div
                    key={line.id}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200/60"
                  >
                    <div className="col-span-6">
                      <input
                        type="text"
                        placeholder="Item / scope description..."
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500"
                        value={line.description}
                        onChange={(e) =>
                          updateLine(idx, "description", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono"
                        value={line.quantity}
                        onChange={(e) =>
                          updateLine(idx, "quantity", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Unit Rate"
                        className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono"
                        value={line.unitRate || ""}
                        onChange={(e) =>
                          updateLine(idx, "unitRate", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 font-mono text-xs text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Excl. VAT):</span>
                <span>
                  AED{" "}
                  {formSubtotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Output VAT (5%):</span>
                <span>
                  AED{" "}
                  {formVat.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200 pt-1">
                <span>Total Amount Due:</span>
                <span className="text-emerald-800">
                  AED{" "}
                  {formTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
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
                className="bg-emerald-700 text-white hover:bg-emerald-800"
              >
                Save & Post Sales Voucher
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {selectedVoucher && (
        <Modal
          isOpen={!!selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
          title={`Sales Voucher: ${selectedVoucher.voucherNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">
                  {selectedVoucher.customerName}
                </p>
                <p className="text-slate-500">
                  TRN: {selectedVoucher.customerTrn}
                </p>
                <p className="text-slate-700 mt-1">
                  Scope: {selectedVoucher.projectScope}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-emerald-900">
                  {selectedVoucher.voucherNumber}
                </p>
                <p className="text-slate-500">Date: {selectedVoucher.date}</p>
                <p className="text-slate-500">Due: {selectedVoucher.dueDate}</p>
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
                    Amount
                  </TableHeaderCell>
                </TableHead>
                <TableBody>
                  {selectedVoucher.lines.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="py-2 px-3 font-medium">
                        {l.description}
                      </TableCell>
                      <TableCell align="right" className="py-2 px-3 font-mono">
                        {l.quantity}
                      </TableCell>
                      <TableCell align="right" className="py-2 px-3 font-mono">
                        {l.unitRate.toFixed(2)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-2 px-3 font-mono font-bold"
                      >
                        {l.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono space-y-1 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>AED {selectedVoucher.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>VAT 5%:</span>
                <span>AED {selectedVoucher.vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200 pt-1">
                <span>Total:</span>
                <span className="text-emerald-800">
                  AED {selectedVoucher.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVoucher(null)}
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
                Print Voucher
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
