"use client";

import { useMemo, useState } from "react";
import {
  BanknoteIcon,
  EyeIcon,
  FileCheck2Icon,
  PlusIcon,
  PrintIcon,
  ReceiptIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
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
  Input,
  Select,
} from "@/components/ui";
import {
  useSupplierBills,
  useCreateSupplierBill,
  usePostSupplierBill,
  useCreateSupplierPayment,
  useSuppliers,
  useProducts,
  SupplierBill,
} from "@/lib/hooks/api-hooks";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";

export default function SupplierBillsPage() {
  const { data: bills = [], isLoading, error } = useSupplierBills();
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();

  const createBillMutation = useCreateSupplierBill();
  const postBillMutation = usePostSupplierBill();
  const paymentMutation = useCreateSupplierPayment();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<SupplierBill | null>(null);
  const [paymentModalBill, setPaymentModalBill] = useState<SupplierBill | null>(
    null,
  );

  const [billNumber, setBillNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierTrn, setSupplierTrn] = useState("");
  const [billDate, setBillDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  );
  const [items, setItems] = useState([
    {
      productId: "",
      description: "Direct materials / site supply",
      quantity: 1,
      unitCost: 0,
      unit: "PCS",
    },
  ]);
  const [autoPost, setAutoPost] = useState(true);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paymentRef, setPaymentRef] = useState("");

  const formatNumber = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        description: "",
        quantity: 1,
        unitCost: 0,
        unit: "PCS",
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
    (s, i) =>
      s +
      (parseFloat(String(i.quantity)) || 0) *
        (parseFloat(String(i.unitCost)) || 0),
    0,
  );
  const formVat = formSubtotal * 0.05;
  const formTotal = formSubtotal + formVat;

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBillMutation.mutateAsync({
        billNumber: billNumber || undefined,
        supplierId: supplierId || undefined,
        supplierName: supplierName || "Vendor",
        supplierTrn: supplierTrn || undefined,
        billDate,
        dueDate,
        items,
        autoPost,
      });
      setIsCreateOpen(false);
      setSupplierName("");
      setSupplierId("");
      setSupplierTrn("");
      setItems([
        {
          productId: "",
          description: "Direct materials / site supply",
          quantity: 1,
          unitCost: 0,
          unit: "PCS",
        },
      ]);
    } catch (err: any) {
      alert(`Error creating supplier bill: ${err.message}`);
    }
  };

  const handlePostBill = async (id: string) => {
    try {
      await postBillMutation.mutateAsync(id);
      alert("Supplier bill posted to General Ledger!");
    } catch (err: any) {
      alert(`Error posting bill: ${err.message}`);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalBill) return;

    try {
      await paymentMutation.mutateAsync({
        supplierBillId: paymentModalBill.id,
        supplierId: paymentModalBill.supplierId,
        supplierName: paymentModalBill.supplierName,
        amount: parseFloat(paymentAmount),
        paymentMethod,
        referenceNumber: paymentRef,
      });
      setPaymentModalBill(null);
      setPaymentAmount("");
      setPaymentRef("");
      alert("Supplier payment disbursed and posted to General Ledger!");
    } catch (err: any) {
      alert(`Error recording payment: ${err.message}`);
    }
  };

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const matchesSearch =
        b.billNumber.toLowerCase().includes(search.toLowerCase()) ||
        b.supplierName.toLowerCase().includes(search.toLowerCase()) ||
        (b.supplierTrn &&
          b.supplierTrn.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bills, search, statusFilter]);

  const totalPayables = filteredBills.reduce(
    (s, b) => s + Number(b.totalAmount),
    0,
  );
  const totalOutstanding = filteredBills.reduce(
    (s, b) => s + Number(b.remainingBalance),
    0,
  );
  const totalSettled = totalPayables - totalOutstanding;
  const totalInputVat = filteredBills.reduce(
    (s, b) => s + Number(b.vatAmount),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Purchase Invoices
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record vendor tax invoices, track 5% input VAT, and manage accounts payable liabilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Enter Supplier Bill
          </Button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <ReportKpiGrid cols={3}>
        <ReportKpiCard
          title="1. Total Invoiced Spend"
          subtitle="All vendor billings"
          value={formatNumber(totalPayables)}
          currency="AED"
          accentColor="sky"
        />
        <ReportKpiCard
          title="2. Outstanding Accounts Payable"
          subtitle="Open liability balance"
          value={formatNumber(totalOutstanding)}
          currency="AED"
          accentColor="rose"
          valueColor="text-rose-700"
        />
        <ReportKpiCard
          title="3. Settled Disbursals"
          subtitle="Cleared vendor payments"
          value={formatNumber(totalSettled)}
          currency="AED"
          accentColor="emerald"
          valueColor="text-emerald-800"
        />
        <ReportKpiCard
          title="4. Recoverable Input VAT (5%)"
          subtitle="FTA Form 201 Tax Credit"
          badge={
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
              Box 9
            </span>
          }
          value={formatNumber(totalInputVat)}
          currency="AED"
          accentColor="purple"
          valueColor="text-purple-800"
        />
      </ReportKpiGrid>

      {/* Print-Only Compact Summary Strip */}
      <div className="hidden print:grid print:grid-cols-4 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
            Total Spend
          </span>
          <span className="font-mono font-bold text-slate-900">
            AED {formatNumber(totalPayables)}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-rose-600 font-bold block">
            Outstanding A/P
          </span>
          <span className="font-mono font-bold text-rose-700">
            AED {formatNumber(totalOutstanding)}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold block">
            Settled Disbursals
          </span>
          <span className="font-mono font-bold text-emerald-800">
            AED {formatNumber(totalSettled)}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-purple-600 font-bold block">
            Recoverable VAT (5%)
          </span>
          <span className="font-mono font-bold text-purple-800">
            AED {formatNumber(totalInputVat)}
          </span>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        {/* Search & Filter Strip */}
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Status Quick Pills */}
            <div className="flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              {[
                { id: "ALL", label: "All Bills" },
                { id: "POSTED", label: "Posted to GL" },
                { id: "PARTIALLY_PAID", label: "Partially Paid" },
                { id: "PAID", label: "Fully Paid" },
                { id: "DRAFT", label: "Drafts" },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            <span className="text-[11px] font-bold text-slate-500 font-mono">
              {filteredBills.length} Invoices Found
            </span>
          </div>

          <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
            <Input
              leftIcon={<SearchIcon size={14} className="text-slate-400" />}
              placeholder="Search bill number, vendor, TRN..."
              containerClassName="w-full sm:w-80"
              className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading supplier bills: {(error as any).message}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between print:bg-none print:!bg-slate-100 print:!text-slate-900">
              <h4 className="font-black text-xs uppercase tracking-wider text-white print:!text-slate-900">
                Accounts Payable &amp; Vendor Invoices Register
              </h4>
              <span className="text-[11px] font-mono text-emerald-300 font-bold print:!text-slate-700">
                {filteredBills.length} Active Records
              </span>
            </div>

            <Table className="w-full text-xs text-left">
              <TableHead className="bg-slate-50 border-b border-slate-200">
                <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Bill No
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Supplier / Vendor
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Bill Date
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Due Date
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-3 px-3 text-right font-bold text-slate-600 uppercase text-[10.5px] tracking-wider"
                >
                  Total (AED)
                </TableHeaderCell>
                <TableHeaderCell
                  align="right"
                  className="py-3 px-3 text-right font-bold text-slate-600 uppercase text-[10.5px] tracking-wider"
                >
                  Balance Due
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                  Status
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider print:hidden">
                  Actions
                </TableHeaderCell>
              </TableHead>

              <TableBody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <TableLoading colSpan={8} rows={5} />
                ) : filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-slate-400 italic"
                    >
                      No supplier bills match your search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.map((b) => (
                    <TableRow
                      key={b.id}
                      className="hover:bg-slate-50/60 text-slate-700 transition"
                    >
                      <TableCell className="py-3 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <ReceiptIcon
                            size={13}
                            className="text-teal-700 shrink-0"
                          />
                          <span>{b.billNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 font-bold text-slate-900">
                        <div>{b.supplierName}</div>
                        {b.supplierTrn && (
                          <div className="text-[10px] text-slate-400 font-mono font-normal">
                            TRN: {b.supplierTrn}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-3 text-slate-600 font-mono">
                        {b.billDate
                          ? new Date(b.billDate).toLocaleDateString("en-GB")
                          : "-"}
                      </TableCell>
                      <TableCell className="py-3 px-3 text-slate-600 font-mono">
                        {b.dueDate
                          ? new Date(b.dueDate).toLocaleDateString("en-GB")
                          : "-"}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-3 px-3 text-right font-mono font-bold text-slate-900"
                      >
                        {formatNumber(b.totalAmount)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-3 px-3 text-right font-mono font-bold"
                      >
                        <span
                          className={
                            Number(b.remainingBalance) > 0
                              ? "text-rose-700"
                              : "text-slate-400"
                          }
                        >
                          {formatNumber(b.remainingBalance)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            b.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : b.status === "POSTED"
                                ? "bg-sky-50 text-sky-700 border border-sky-200"
                                : b.status === "PARTIALLY_PAID"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {b.status === "PAID"
                            ? "Paid"
                            : b.status === "POSTED"
                              ? "Posted"
                              : b.status === "PARTIALLY_PAID"
                                ? "Partial"
                                : "Draft"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedBill(b)}
                            className="p-1.5 text-slate-600 hover:text-teal-800 rounded-lg hover:bg-teal-50 transition cursor-pointer"
                            title="View Bill Details"
                          >
                            <EyeIcon size={13} />
                          </Button>
                          {b.status === "DRAFT" && (
                            <Button
                              variant="dark"
                              size="sm"
                              onClick={() => handlePostBill(b.id)}
                              icon={<FileCheck2Icon size={12} />}
                              className="text-[10px] font-bold bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                            >
                              Post to GL
                            </Button>
                          )}
                          {b.status !== "DRAFT" && b.status !== "PAID" && (
                            <Button
                              variant="dark"
                              size="sm"
                              onClick={() => {
                                setPaymentModalBill(b);
                                setPaymentAmount(String(b.remainingBalance));
                              }}
                              icon={<BanknoteIcon size={12} />}
                              className="text-[10px] font-bold bg-teal-800 text-white hover:bg-teal-900 cursor-pointer"
                            >
                              Disburse
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
        )}
      </div>

      {/* Modal for Creating Supplier Bill */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create Supplier Bill (Accounts Payable)"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateBill} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Supplier / Vendor *
                </label>
                <Select
                  containerClassName="w-full"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-semibold cursor-pointer shadow-2xs"
                  value={supplierId}
                  onChange={(e) => {
                    setSupplierId(e.target.value);
                    const s = suppliers.find(
                      (sup) => sup.id === e.target.value,
                    );
                    if (s) {
                      setSupplierName(s.name);
                      setSupplierTrn(s.trn || "");
                    }
                  }}
                >
                  <option value="">Select registered supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Supplier Name (Manual Override)
                </label>
                <Input
                  type="text"
                  placeholder="Supplier Name"
                  containerClassName="w-full"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-semibold shadow-2xs"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Supplier TRN (Tax Registration #)
                </label>
                <Input
                  type="text"
                  placeholder="100XXXXXXXXX003"
                  containerClassName="w-full"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono shadow-2xs"
                  value={supplierTrn}
                  onChange={(e) => setSupplierTrn(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Vendor Bill / Invoice #
                </label>
                <Input
                  type="text"
                  placeholder="e.g. INV-94812"
                  containerClassName="w-full"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono shadow-2xs"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bill Date *
                </label>
                <Input
                  type="date"
                  containerClassName="w-full"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 shadow-2xs"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Due Date *
                </label>
                <Input
                  type="date"
                  containerClassName="w-full"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 shadow-2xs"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Bill Line Items
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addItem}
                  icon={<PlusIcon size={13} />}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  Add Line
                </Button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs"
                  >
                    <div className="col-span-6">
                      <Input
                        type="text"
                        placeholder="Description..."
                        containerClassName="w-full"
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500"
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
                        containerClassName="w-full"
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(idx, "quantity", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Unit Cost"
                        containerClassName="w-full"
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono font-bold"
                        value={item.unitCost || ""}
                        onChange={(e) =>
                          updateItem(idx, "unitCost", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <TrashIcon size={13} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono text-xs text-right space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Excl. VAT):</span>
                <span>AED {formSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>5% Recoverable Input VAT:</span>
                <span>AED {formVat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200 pt-1">
                <span>Total Bill Amount:</span>
                <span className="text-emerald-900">
                  AED {formTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="autoPostBill"
                checked={autoPost}
                onChange={(e) => setAutoPost(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label
                htmlFor="autoPostBill"
                className="font-semibold text-slate-700 cursor-pointer"
              >
                Auto-post to General Ledger &amp; update Accounts Payable
              </label>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
              >
                Save Supplier Bill
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment Disbursement Modal */}
      {paymentModalBill && (
        <Modal
          isOpen={!!paymentModalBill}
          onClose={() => setPaymentModalBill(null)}
          title={`Disburse Supplier Payment: ${paymentModalBill.billNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
              <p className="font-bold text-emerald-950">
                Vendor: {paymentModalBill.supplierName}
              </p>
              <p className="text-slate-600">
                Bill Total: AED{" "}
                {Number(paymentModalBill.totalAmount).toFixed(2)} | Outstanding:{" "}
                <strong className="text-rose-700">
                  AED {Number(paymentModalBill.remainingBalance).toFixed(2)}
                </strong>
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Payment Amount (AED) *
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="Amount"
                containerClassName="w-full"
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono font-bold shadow-2xs"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Disbursement Account / Method *
              </label>
              <Select
                containerClassName="w-full"
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-semibold shadow-2xs cursor-pointer"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="BANK_TRANSFER">
                  RAK Bank Transfer (A/C 1020)
                </option>
                <option value="CHEQUE">Corporate Cheque</option>
                <option value="CASH">Petty Cash Float (A/C 1010)</option>
              </Select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Cheque / Transaction Reference #
              </label>
              <Input
                type="text"
                placeholder="e.g. TR-28492 or CHQ-00481"
                containerClassName="w-full"
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-emerald-500 font-mono shadow-2xs"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                type="button"
                onClick={() => setPaymentModalBill(null)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
              >
                Disburse &amp; Post to GL
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bill Details Modal */}
      {selectedBill && (
        <Modal
          isOpen={!!selectedBill}
          onClose={() => setSelectedBill(null)}
          title={`Supplier Bill: ${selectedBill.billNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between font-mono">
                <span className="font-bold text-slate-900">
                  {selectedBill.billNumber}
                </span>
                <span className="text-slate-500">
                  {selectedBill.billDate
                    ? new Date(selectedBill.billDate).toLocaleDateString(
                        "en-GB",
                      )
                    : ""}
                </span>
              </div>
              <p className="font-bold text-slate-900">
                Supplier: {selectedBill.supplierName}
              </p>
              <p className="text-slate-500 font-mono">
                TRN: {selectedBill.supplierTrn || "N/A"}
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <Table className="w-full text-xs">
                <TableHead className="bg-slate-50 border-b border-slate-200">
                  <TableHeaderCell className="py-2 px-3 font-bold text-slate-600">
                    Description
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-2 px-3 font-bold text-slate-600"
                  >
                    Qty
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-2 px-3 font-bold text-slate-600"
                  >
                    Unit Cost (AED)
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-2 px-3 font-bold text-slate-600"
                  >
                    Total (AED)
                  </TableHeaderCell>
                </TableHead>
                <TableBody className="divide-y divide-slate-100">
                  {selectedBill.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-2 px-3">
                        {item.description}
                      </TableCell>
                      <TableCell align="right" className="py-2 px-3 font-mono">
                        {item.quantity}
                      </TableCell>
                      <TableCell align="right" className="py-2 px-3 font-mono">
                        {Number(item.unitCost).toFixed(2)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-2 px-3 font-mono font-bold text-slate-900"
                      >
                        {Number(item.totalAmount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono space-y-1 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (AED):</span>
                <span>{Number(selectedBill.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>5% Input VAT (AED):</span>
                <span>{Number(selectedBill.vatAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200 pt-1">
                <span>Total Bill Amount:</span>
                <span className="text-emerald-900">
                  AED {Number(selectedBill.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setSelectedBill(null)}
                className="cursor-pointer"
              >
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => window.print()}
                icon={<PrintIcon size={13} />}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
              >
                Print Bill
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
