"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { toast } from "@/lib/toast";
import {
  Plus,
  Receipt,
  RefreshCw,
  Eye,
  Printer,
  FileCheck2,
  Banknote,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  EmptyState,
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
  SupplierBillDocument,
  SupplierBillsKpis,
  SupplierBillRow,
  CreateSupplierBillModal,
  CreateSupplierBillData,
  SupplierBillDetailModal,
  DisbursePaymentModal,
  DisbursePaymentData,
} from "./components";
import ProcurementQuickNav from "@/components/ProcurementQuickNav";

const PAGE_SIZE = 15;

export default function PurchaseBillsPage() {
  const router = useRouter();
  const { data: bills = [], isLoading, isFetching, error, refetch } = useSupplierBills();
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();

  const createBillMutation = useCreateSupplierBill();
  const postBillMutation = usePostSupplierBill();
  const paymentMutation = useCreateSupplierPayment();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<SupplierBill | null>(null);
  const [paymentModalBill, setPaymentModalBill] = useState<SupplierBill | null>(
    null,
  );

  const [activeMenu, setActiveMenu] = useState<{
    id: string;
    bill: SupplierBill;
    top: number;
    right: number;
    openUpwards: boolean;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    bill: SupplierBill,
  ) => {
    e.stopPropagation();
    if (activeMenu?.id === bill.id) {
      setActiveMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 160;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < menuHeight && rect.top > menuHeight;

    setActiveMenu({
      id: bill.id,
      bill,
      top: openUpwards ? rect.top - 4 : rect.bottom + 4,
      right: Math.max(8, window.innerWidth - rect.right),
      openUpwards,
    });
  };

  useEffect(() => {
    if (!activeMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveMenu(null);
    };
    const handleScroll = () => setActiveMenu(null);

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [activeMenu]);

  const [billToPrint, setBillToPrint] = useState<SupplierBill | null>(null);
  const printDocumentRef = useRef<HTMLDivElement>(null);

  const triggerPrint = useReactToPrint({
    contentRef: printDocumentRef,
    documentTitle: billToPrint?.billNumber
      ? `Purchase-Bill-${billToPrint.billNumber}`
      : "Purchase-Bill-Voucher",
  });

  const handlePrintBill = (bill: SupplierBill) => {
    setBillToPrint(bill);
    setTimeout(() => {
      triggerPrint();
    }, 80);
  };

  const handlePostBill = async (id: string) => {
    try {
      await postBillMutation.mutateAsync(id);
      toast.success("Purchase bill posted to General Ledger successfully!");
    } catch (err: any) {
      toast.error(`Error posting bill: ${err.message}`);
    }
  };

  const handleCreateBill = async (data: CreateSupplierBillData) => {
    await createBillMutation.mutateAsync(data);
  };

  const handleDisbursePayment = async (data: DisbursePaymentData) => {
    if (!paymentModalBill) return;
    await paymentMutation.mutateAsync({
      supplierId: paymentModalBill.supplierId || undefined,
      supplierName: paymentModalBill.supplierName,
      supplierBillId: paymentModalBill.id,
      amount: data.amount,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: data.paymentMethod as any,
      referenceNumber: data.referenceNumber,
    });
  };

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesBill = b.billNumber.toLowerCase().includes(q);
        const matchesSupplier = b.supplierName.toLowerCase().includes(q);
        const matchesTrn = b.supplierTrn?.toLowerCase().includes(q);
        if (!matchesBill && !matchesSupplier && !matchesTrn) return false;
      }
      return true;
    });
  }, [bills, statusFilter, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBills.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedBills = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredBills.slice(start, start + PAGE_SIZE);
  }, [filteredBills, safePage]);

  const totalPayables = useMemo(
    () => bills.reduce((acc, b) => acc + Number(b.totalAmount || 0), 0),
    [bills],
  );

  const totalOutstanding = useMemo(
    () => bills.reduce((acc, b) => acc + Number(b.remainingBalance || 0), 0),
    [bills],
  );

  const totalSettled = totalPayables - totalOutstanding;
  const totalInputVat = useMemo(
    () => bills.reduce((acc, b) => acc + Number(b.vatAmount || 0), 0),
    [bills],
  );

  const statusTabs = [
    { id: "ALL", label: "All Bills" },
    { id: "POSTED", label: "Posted to GL" },
    { id: "PARTIALLY_PAID", label: "Partially Paid" },
    { id: "PAID", label: "Fully Paid" },
    { id: "DRAFT", label: "Drafts" },
  ];

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
            <Receipt className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-[17px] font-semibold text-slate-800 tracking-tight">
              Purchase Bills
            </h1>
            <span
              className="text-[10.5px] font-medium px-2 py-0.5 rounded-full font-mono"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "1px solid #cbd5e1",
              }}
            >
              {bills.length} Records
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            style={{ border: "1px solid #cbd5e1" }}
            title="Refresh bills"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isFetching ? "animate-spin text-[#1d4ed8]" : ""
              }`}
            />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-2xs transition-colors cursor-pointer"
            style={{ backgroundColor: "#1d4ed8" }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Purchase Bill</span>
          </button>
        </div>
      </div>

      {/* Procurement Lifecycle Quick Navigation */}
      <ProcurementQuickNav />

      {/* 4 Pastel KPI Cards */}
      <SupplierBillsKpis
        totalPayables={totalPayables}
        totalOutstanding={totalOutstanding}
        totalSettled={totalSettled}
        totalInputVat={totalInputVat}
      />

      {/* Unified Filter Bar */}
      <div
        className="rounded-xl p-2.5 sm:px-3.5 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        <div
          className="inline-flex items-center p-0.5 rounded-lg bg-white flex-wrap"
          style={{ border: "1px solid #cbd5e1" }}
        >
          {statusTabs.map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
                style={
                  active
                    ? {
                        backgroundColor: "#1d4ed8",
                        color: "#ffffff",
                      }
                    : {
                        color: "#475569",
                      }
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bill number, vendor, TRN..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
            style={{ border: "1px solid #cbd5e1" }}
          />
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
          Error loading purchase bills: {(error as any).message}
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
              Purchase Bills &amp; Accounts Payable Register
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {filteredBills.length} {filteredBills.length === 1 ? "bill" : "bills"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="text-[10.5px] font-medium uppercase tracking-wider text-slate-500"
                  style={{
                    backgroundColor: "#f8fafc",
                    borderBottom: "1px solid #cbd5e1",
                  }}
                >
                  <th className="py-2.5 px-3 whitespace-nowrap font-medium">Bill No</th>
                  <th className="py-2.5 px-3 font-medium">Supplier / Vendor</th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap font-medium">Bill Date</th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap font-medium">Due Date</th>
                  <th className="py-2.5 px-2.5 text-right whitespace-nowrap font-medium">Total (AED)</th>
                  <th className="py-2.5 px-2.5 text-right whitespace-nowrap font-medium">Balance Due</th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap font-medium">Status</th>
                  <th className="py-2.5 px-2 sm:pr-3 text-right whitespace-nowrap print:hidden font-medium">Actions</th>
                </tr>
              </thead>
              <TableBody className="divide-y divide-slate-200/80 font-normal">
                {isLoading ? (
                  <TableLoading colSpan={8} rows={5} />
                ) : paginatedBills.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8} className="p-0 border-0">
                      <EmptyState
                        icon={
                          <Receipt className="w-5 h-5 text-slate-400" />
                        }
                        title="No purchase bills found"
                        description={
                          search.trim() !== "" || statusFilter !== "ALL"
                            ? "No purchase bills matched your search criteria."
                            : "No purchase bills in database. Click 'Record Purchase Bill' to create one."
                        }
                        actionLabel={
                          search.trim() !== "" || statusFilter !== "ALL"
                            ? "Reset Filters"
                            : "Record Purchase Bill"
                        }
                        onAction={
                          search.trim() !== "" || statusFilter !== "ALL"
                            ? () => {
                                setSearch("");
                                setStatusFilter("ALL");
                              }
                            : () => setIsCreateOpen(true)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedBills.map((b) => (
                    <SupplierBillRow
                      key={b.id}
                      bill={b}
                      onView={() => router.push(`/commercial/supplier-bills/${b.id}`)}
                      onOpenMenu={(e) => handleOpenMenu(e, b)}
                      isMenuOpen={activeMenu?.id === b.id}
                    />
                  ))
                )}
              </TableBody>
            </table>
          </div>

          {/* Responsive Pagination Footer */}
          {filteredBills.length > 0 && (
            <div
              className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 print:hidden"
              style={{
                backgroundColor: "#f8fafc",
                borderTop: "1px solid #cbd5e1",
              }}
            >
              <span>
                Showing{" "}
                <span className="font-mono font-medium text-slate-800">
                  {(safePage - 1) * PAGE_SIZE + 1}
                </span>
                –
                <span className="font-mono font-medium text-slate-800">
                  {Math.min(safePage * PAGE_SIZE, filteredBills.length)}
                </span>{" "}
                of{" "}
                <span className="font-mono font-medium text-slate-800">
                  {filteredBills.length}
                </span>{" "}
                bills
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-xs font-medium"
                  style={{ border: "1px solid #cbd5e1" }}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - safePage) <= 1,
                  )
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev !== undefined && p - prev > 1;
                    const active = p === safePage;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="px-1 text-slate-400">…</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className="min-w-[28px] h-7 px-2 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer"
                          style={
                            active
                              ? {
                                  backgroundColor: "#1d4ed8",
                                  color: "#ffffff",
                                  border: "1px solid #1d4ed8",
                                }
                              : {
                                  backgroundColor: "#ffffff",
                                  color: "#334155",
                                  border: "1px solid #cbd5e1",
                                }
                          }
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed text-xs font-medium"
                  style={{ border: "1px solid #cbd5e1" }}
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <CreateSupplierBillModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        suppliers={suppliers}
        products={products}
        onCreate={handleCreateBill}
        isCreating={createBillMutation.isPending}
      />

      <SupplierBillDetailModal
        bill={selectedBill}
        onClose={() => setSelectedBill(null)}
        onPrint={(bill) => handlePrintBill(bill)}
      />

      <DisbursePaymentModal
        bill={paymentModalBill}
        onClose={() => setPaymentModalBill(null)}
        onDisburse={handleDisbursePayment}
        isDisbursing={paymentMutation.isPending}
      />

      <div
        style={{
          position: "fixed",
          left: "-99999px",
          top: "-99999px",
          width: "210mm",
        }}
      >
        <div ref={printDocumentRef}>
          {billToPrint && <SupplierBillDocument bill={billToPrint} />}
        </div>
      </div>

      {activeMenu &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: activeMenu.openUpwards ? undefined : `${activeMenu.top}px`,
              bottom: activeMenu.openUpwards
                ? `${window.innerHeight - activeMenu.top}px`
                : undefined,
              right: `${activeMenu.right}px`,
              border: "1px solid #cbd5e1",
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-[195px] rounded-xl bg-white shadow-xl shadow-slate-900/10 p-1 z-[9999] animate-in fade-in zoom-in-95 duration-100 select-none"
          >
            {/* View Bill Details */}
            <button
              type="button"
              onClick={() => {
                const bill = activeMenu.bill;
                setActiveMenu(null);
                router.push(`/commercial/supplier-bills/${bill.id}`);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#1d4ed8] hover:bg-[#eff6ff] transition-colors cursor-pointer text-left group"
            >
              <Eye className="w-3.5 h-3.5 text-[#1d4ed8] shrink-0" />
              <span className="truncate">View Bill Details</span>
            </button>

            {/* Print Voucher */}
            <button
              type="button"
              onClick={() => {
                const bill = activeMenu.bill;
                setActiveMenu(null);
                handlePrintBill(bill);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors cursor-pointer text-left group"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">Print Voucher (PDF)</span>
            </button>

            {/* Post to GL (if Draft) */}
            {activeMenu.bill.status === "DRAFT" && (
              <button
                type="button"
                onClick={() => {
                  const bill = activeMenu.bill;
                  setActiveMenu(null);
                  handlePostBill(bill.id);
                }}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors cursor-pointer text-left group"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Post to General Ledger</span>
              </button>
            )}

            {/* Record Disbursement / Payment (if not Draft and not Paid) */}
            {activeMenu.bill.status !== "DRAFT" &&
              activeMenu.bill.status !== "PAID" && (
                <button
                  type="button"
                  onClick={() => {
                    const bill = activeMenu.bill;
                    setActiveMenu(null);
                    setPaymentModalBill(bill);
                  }}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-teal-700 hover:text-teal-900 hover:bg-teal-50 transition-colors cursor-pointer text-left group"
                >
                  <Banknote className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="truncate">Record Disbursement</span>
                </button>
              )}
          </div>,
          document.body,
        )}
    </div>
  );
}
