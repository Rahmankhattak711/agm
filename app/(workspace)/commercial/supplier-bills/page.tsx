"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { toast } from "@/lib/toast";
import { Plus, Receipt, Download, RefreshCw, FileText, Eye, Printer, FileCheck2, Banknote } from "lucide-react";
import {
  Button,
  PageHeader,
  FilterBar,
  RegisterTable,
  RegisterColumn,
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

const COLUMNS: RegisterColumn[] = [
  { label: "Bill No", compact: true, className: "whitespace-nowrap" },
  { label: "Supplier / Vendor", compact: true },
  {
    label: "Bill Date",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Due Date",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Total (AED)",
    align: "right",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Balance Due",
    align: "right",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Status",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Actions",
    align: "right",
    compact: true,
    hideOnPrint: true,
    className: "whitespace-nowrap pr-3",
  },
];

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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<SupplierBill | null>(null);
  const [paymentModalBill, setPaymentModalBill] = useState<SupplierBill | null>(
    null,
  );
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

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

  return (
    <div className="w-full min-h-full flex flex-col font-sans">
      {/* Executive Header - Clean alignment, zero overlap */}
      <div className="w-full bg-white border-b border-slate-200/90 px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5046e5] shadow-2xs">
                <Receipt className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Purchase Bills
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                  {bills.length} Records
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Log vendor invoices, claim 5% input tax, track settlement disbursements, and post to General Ledger.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition-colors cursor-pointer"
              title="Refresh bills"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#5046e5]" : ""}`} />
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              icon={<Plus size={14} strokeWidth={2.5} />}
              className="bg-[#5046e5] hover:bg-[#4338ca] text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Record Purchase Bill
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 bg-slate-50/40">

      <SupplierBillsKpis
        totalPayables={totalPayables}
        totalOutstanding={totalOutstanding}
        totalSettled={totalSettled}
        totalInputVat={totalInputVat}
      />

      <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <FilterBar
          tabs={[
            { id: "ALL", label: "All Bills" },
            { id: "POSTED", label: "Posted to GL" },
            { id: "PARTIALLY_PAID", label: "Partially Paid" },
            { id: "PAID", label: "Fully Paid" },
            { id: "DRAFT", label: "Drafts" },
          ]}
          activeTab={statusFilter}
          onTabChange={(id) => setStatusFilter(id)}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search bill number, vendor, TRN..."
          totalCount={filteredBills.length}
          countLabel="Bills Found"
        />

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading purchase bills: {(error as any).message}
          </div>
        ) : (
          <RegisterTable
            title="Purchase Bills & Accounts Payable Register"
            countLabel={`${filteredBills.length} Active Records`}
            columns={COLUMNS}
          >
            <TableBody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <TableLoading colSpan={8} rows={5} />
              ) : filteredBills.length === 0 ? (
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
                filteredBills.map((b) => (
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
          </RegisterTable>
        )}
      </div>

      </div>

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
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-[195px] rounded-xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/10 p-1 z-[9999] animate-in fade-in zoom-in-95 duration-100 select-none"
          >
            {/* View Bill Details */}
            <button
              type="button"
              onClick={() => {
                const bill = activeMenu.bill;
                setActiveMenu(null);
                router.push(`/commercial/supplier-bills/${bill.id}`);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 transition-colors cursor-pointer text-left group"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
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
