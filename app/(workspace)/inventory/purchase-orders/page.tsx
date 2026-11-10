"use client";

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { useAuth } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import { toast } from "@/lib/toast";
import {
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useDeletePurchaseOrder,
  useProducts,
  useSuppliers,
  useWarehouses,
  PurchaseOrder,
  PurchaseOrderStatus,
} from "@/lib/hooks/api-hooks";
import { ShoppingCartIcon, PrintIcon, EyeIcon, TrashIcon } from "@/components/icons";
import {
  Plus,
  RefreshCw,
  PackageCheck,
  FileText,
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
import { PurchaseOrderPrintModal } from "./PurchaseOrderPrintModal";
import {
  PurchaseOrdersKpis,
  PurchaseOrderRow,
  PurchaseOrderDocument,
  CreatePurchaseOrderModal,
  ReceiveGoodsModal,
  PurchaseOrderDetailModal,
  CreatePurchaseOrderData,
} from "./components";
import ProcurementQuickNav from "@/components/ProcurementQuickNav";

const PAGE_SIZE = 15;

const getStatusBadge = (status: PurchaseOrderStatus, po?: any) => {
  const isBilled = po?.supplierBills && po.supplierBills.length > 0;
  if (isBilled) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-medium"
        style={{
          backgroundColor: "#eff6ff",
          color: "#1d4ed8",
          border: "1px solid #bfdbfe",
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8]" />
        <span>Billed</span>
      </span>
    );
  }
  switch (status) {
    case "DRAFT":
      return (
        <span
          className="px-2.5 py-0.5 rounded-full text-[10.5px] font-medium"
          style={{
            backgroundColor: "#fefce8",
            color: "#92400e",
            border: "1px solid #fde047",
          }}
        >
          Draft
        </span>
      );
    case "ORDERED":
      return (
        <span
          className="px-2.5 py-0.5 rounded-full text-[10.5px] font-medium"
          style={{
            backgroundColor: "#f0f9ff",
            color: "#0369a1",
            border: "1px solid #bae6fd",
          }}
        >
          Ordered
        </span>
      );
    case "RECEIVED":
      return (
        <span
          className="px-2.5 py-0.5 rounded-full text-[10.5px] font-medium"
          style={{
            backgroundColor: "#f0fdf4",
            color: "#166534",
            border: "1px solid #86efac",
          }}
        >
          Received
        </span>
      );
    case "CANCELLED":
      return (
        <span
          className="px-2.5 py-0.5 rounded-full text-[10.5px] font-medium"
          style={{
            backgroundColor: "#fff1f2",
            color: "#9f1239",
            border: "1px solid #fda4af",
          }}
        >
          Cancelled
        </span>
      );
    default:
      return <span>{status}</span>;
  }
};

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const { canModify } = useAuth();
  const { confirm } = useConfirm();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [printModalPO, setPrintModalPO] = useState<PurchaseOrder | null>(null);
  const [activeMenu, setActiveMenu] = useState<{
    id: string;
    po: PurchaseOrder;
    top: number;
    right: number;
    openUpwards: boolean;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleOpenMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    po: PurchaseOrder,
  ) => {
    e.stopPropagation();
    if (activeMenu?.id === po.id) {
      setActiveMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 160;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < menuHeight && rect.top > menuHeight;

    setActiveMenu({
      id: po.id,
      po,
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
  const [printingPO, setPrintingPO] = useState<PurchaseOrder | null>(null);
  const [receiveModalPO, setReceiveModalPO] = useState<PurchaseOrder | null>(
    null,
  );
  const printDocumentRef = useRef<HTMLDivElement>(null);

  const reactToPrintFn = useReactToPrint({
    contentRef: printDocumentRef,
    documentTitle: printingPO ? `PO_${printingPO.poNumber}` : "Purchase_Order",
  });

  const handlePrintPO = useCallback(
    (po: PurchaseOrder) => {
      setPrintingPO(po);
      setTimeout(() => {
        reactToPrintFn();
      }, 150);
    },
    [reactToPrintFn],
  );

  const {
    data: purchaseOrders = [],
    isLoading,
    isFetching,
    refetch,
    error,
  } = usePurchaseOrders({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    supplierId: supplierFilter || undefined,
  });

  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();
  const { data: warehouses = [] } = useWarehouses();

  const createPO = useCreatePurchaseOrder();
  const updatePO = useUpdatePurchaseOrder();
  const deletePO = useDeletePurchaseOrder();

  const filteredPOs = useMemo(() => {
    if (!search.trim()) return purchaseOrders;
    const q = search.toLowerCase();
    return purchaseOrders.filter(
      (p) =>
        p.poNumber?.toLowerCase().includes(q) ||
        p.supplier?.name?.toLowerCase().includes(q) ||
        p.shopName?.toLowerCase().includes(q) ||
        p.vendorReference?.toLowerCase().includes(q) ||
        p.supplier?.trn?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q),
    );
  }, [purchaseOrders, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, supplierFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPOs.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedPOs = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredPOs.slice(start, start + PAGE_SIZE);
  }, [filteredPOs, safePage]);

  const totalPOs = purchaseOrders.length;
  const draftCount = purchaseOrders.filter((p) => p.status === "DRAFT").length;
  const orderedCount = purchaseOrders.filter(
    (p) => p.status === "ORDERED",
  ).length;
  const totalPurchasesValue = purchaseOrders
    .filter((p) => p.status !== "CANCELLED")
    .reduce((acc, p) => acc + Number(p.totalAmount || 0), 0);

  const handleDeletePO = async (po: PurchaseOrder) => {
    const isConfirmed = await confirm({
      title: "Delete Purchase Order",
      message: `Are you sure you want to delete PO ${po.poNumber}?`,
      variant: "danger",
      confirmText: "Delete",
    });
    if (isConfirmed) {
      deletePO.mutate(po.id, {
        onSuccess: () => {
          toast.success(`Purchase Order ${po.poNumber} deleted`);
          setActiveMenu(null);
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to delete PO");
        },
      });
    }
  };

  const handleCreatePO = async (data: CreatePurchaseOrderData) => {
    await createPO.mutateAsync(data);
  };

  const handleReceiveGoods = async (receiveWarehouseId: string) => {
    if (!receiveModalPO) return;
    await updatePO.mutateAsync({
      id: receiveModalPO.id,
      status: "RECEIVED",
      warehouseIdToReceive: receiveWarehouseId,
    });
  };

  const handleConvertToBill = async (po: PurchaseOrder) => {
    try {
      const res = await fetch(`/api/inventory/purchase-orders/${po.id}/convert-to-bill`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to convert PO to Bill");
      }
      if (data.alreadyConverted) {
        toast.info(`Bill ${data.bill?.billNumber || ""} is already posted.`);
      } else {
        toast.success(`Generated Bill ${data.bill?.billNumber} and posted Journal Entry!`);
      }
      if (data.bill) {
        setSelectedPO((prev) =>
          prev && prev.id === po.id
            ? { ...prev, supplierBills: [data.bill] }
            : prev,
        );
      }
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to convert PO to bill");
    }
  };

  const statusTabs = [
    { id: "ALL", label: "All POs" },
    { id: "DRAFT", label: "Draft" },
    { id: "ORDERED", label: "Ordered" },
    { id: "RECEIVED", label: "Received" },
    { id: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="w-full min-h-full p-3 sm:p-5 space-y-3.5 bg-[#f8fafc] font-sans text-slate-800">
      {/* Compact Header Card */}
      <div
        className="bg-white rounded-xl p-3 sm:px-4 sm:py-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
        style={{ border: "1px solid #cbd5e1" }}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
            }}
          >
            <ShoppingCartIcon size={15} />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-[17px] font-semibold text-slate-800 tracking-tight">
              Purchase Orders
            </h1>
            <span
              className="text-[10.5px] font-medium px-2 py-0.5 rounded-full font-mono"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "1px solid #cbd5e1",
              }}
            >
              {purchaseOrders.length} Records
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            style={{ border: "1px solid #cbd5e1" }}
            title="Refresh purchase orders"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isFetching ? "animate-spin text-[#1d4ed8]" : ""
              }`}
            />
          </button>
          <button
            type="button"
            onClick={() => router.push("/inventory/purchase-orders/new")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-2xs transition-colors cursor-pointer"
            style={{ backgroundColor: "#1d4ed8" }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Procurement Lifecycle Quick Navigation */}
      <ProcurementQuickNav />

      {/* 4 Pastel KPI Cards */}
      <PurchaseOrdersKpis
        totalPOs={totalPOs}
        draftCount={draftCount}
        orderedCount={orderedCount}
        totalPurchasesValue={totalPurchasesValue}
      />

      {/* Unified Filter Bar */}
      <div
        className="rounded-xl p-2.5 sm:px-3.5 sm:py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 shadow-2xs"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
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

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white rounded-lg outline-none cursor-pointer max-w-[200px] truncate"
            style={{ border: "1px solid #cbd5e1" }}
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PO #, supplier, shop, quote ref..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
            style={{ border: "1px solid #cbd5e1" }}
          />
        </div>
      </div>

      {/* Main Purchase Orders Table Card */}
      {error ? (
        <div
          className="py-8 text-center text-xs text-rose-700 rounded-xl"
          style={{
            backgroundColor: "#fff1f2",
            border: "1px solid #fda4af",
          }}
        >
          Error loading POs: {(error as any).message}
        </div>
      ) : (
        <div
          className="bg-white rounded-xl shadow-2xs overflow-hidden"
          style={{ border: "1px solid #cbd5e1" }}
        >
          {/* Table Card Header */}
          <div
            className="px-4 py-2.5 flex items-center justify-between gap-2"
            style={{
              backgroundColor: "#f4f7fb",
              borderBottom: "1px solid #cbd5e1",
            }}
          >
            <span className="text-xs font-semibold text-slate-700">
              Procurement &amp; Purchase Orders Register
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {filteredPOs.length} {filteredPOs.length === 1 ? "order" : "orders"}
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
                  <th className="py-2.5 px-3 whitespace-nowrap font-medium">
                    PO Number &amp; Ref
                  </th>
                  <th className="py-2.5 px-3 font-medium">
                    Vendor / Shop Name
                  </th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap font-medium">
                    Order Date
                  </th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap font-medium">
                    Expected Date
                  </th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap font-medium">
                    Items Ordered
                  </th>
                  <th className="py-2.5 px-2.5 text-right whitespace-nowrap font-medium">
                    Total (AED)
                  </th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap font-medium">
                    Status
                  </th>
                  <th className="py-2.5 px-2 sm:pr-3 text-right whitespace-nowrap print:hidden font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <TableBody className="divide-y divide-slate-200/80 font-normal">
                {isLoading ? (
                  <TableLoading colSpan={8} rows={5} />
                ) : paginatedPOs.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8} className="p-0 border-0">
                      <EmptyState
                        icon={
                          <ShoppingCartIcon
                            size={20}
                            className="text-slate-400"
                          />
                        }
                        title="No purchase orders found"
                        description={
                          search.trim() !== "" ||
                          statusFilter !== "ALL" ||
                          supplierFilter !== ""
                            ? "No purchase orders matched your search criteria."
                            : "No purchase orders in database. Click 'Create Purchase Order' to create one."
                        }
                        actionLabel={
                          search.trim() !== "" ||
                          statusFilter !== "ALL" ||
                          supplierFilter !== ""
                            ? "Reset Filters"
                            : "Create Purchase Order"
                        }
                        onAction={
                          search.trim() !== "" ||
                          statusFilter !== "ALL" ||
                          supplierFilter !== ""
                            ? () => {
                                setSearch("");
                                setStatusFilter("ALL");
                                setSupplierFilter("");
                              }
                            : () => router.push("/inventory/purchase-orders/new")
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPOs.map((po) => (
                    <PurchaseOrderRow
                      key={po.id}
                      po={po}
                      onView={(target) => setSelectedPO(target)}
                      onOpenMenu={handleOpenMenu}
                      isMenuOpen={activeMenu?.id === po.id}
                      getStatusBadge={getStatusBadge}
                    />
                  ))
                )}
              </TableBody>
            </table>
          </div>

          {/* Responsive Pagination Footer */}
          {filteredPOs.length > 0 && (
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
                  {Math.min(safePage * PAGE_SIZE, filteredPOs.length)}
                </span>{" "}
                of{" "}
                <span className="font-mono font-medium text-slate-800">
                  {filteredPOs.length}
                </span>{" "}
                purchase orders
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

      <CreatePurchaseOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        suppliers={suppliers}
        products={products}
        onCreate={handleCreatePO}
        isCreating={createPO.isPending}
      />

      <ReceiveGoodsModal
        po={receiveModalPO}
        onClose={() => setReceiveModalPO(null)}
        warehouses={warehouses}
        onReceive={handleReceiveGoods}
        isUpdating={updatePO.isPending}
      />

      <PurchaseOrderDetailModal
        po={selectedPO}
        onClose={() => setSelectedPO(null)}
        onPrint={(po) => setPrintModalPO(po)}
        getStatusBadge={getStatusBadge}
        onConvertToBill={handleConvertToBill}
      />

      <PurchaseOrderPrintModal
        isOpen={!!printModalPO}
        onClose={() => setPrintModalPO(null)}
        po={printModalPO}
      />

      <div
        style={{
          position: "fixed",
          left: -99999,
          top: -99999,
          width: "210mm",
        }}
      >
        <div ref={printDocumentRef}>
          {printingPO && <PurchaseOrderDocument po={printingPO} />}
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
            className="w-[190px] rounded-xl bg-white shadow-xl shadow-slate-900/10 p-1 z-[9999] animate-in fade-in zoom-in-95 duration-100 select-none"
          >
            {/* Print PO */}
            <button
              type="button"
              onClick={() => {
                const po = activeMenu.po;
                setActiveMenu(null);
                handlePrintPO(po);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 transition-colors cursor-pointer text-left group"
            >
              <PrintIcon size={14} className="text-slate-500 shrink-0" />
              <span className="truncate">Print PO Voucher</span>
            </button>

            {/* View Details */}
            <button
              type="button"
              onClick={() => {
                const po = activeMenu.po;
                setActiveMenu(null);
                setSelectedPO(po);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#1d4ed8] hover:bg-[#eff6ff] transition-colors cursor-pointer text-left group"
            >
              <EyeIcon size={14} className="text-[#1d4ed8] shrink-0" />
              <span className="truncate">View PO Details</span>
            </button>

            {/* Receive Goods (if ORDERED) */}
            {activeMenu.po.status === "ORDERED" && (
              <button
                type="button"
                onClick={() => {
                  const po = activeMenu.po;
                  setActiveMenu(null);
                  setReceiveModalPO(po);
                }}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/70 transition-colors cursor-pointer text-left group"
              >
                <PackageCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Receive Goods</span>
              </button>
            )}

            {/* If already Billed -> View Linked Bill */}
            {Boolean(
              activeMenu.po.supplierBills &&
                activeMenu.po.supplierBills.length > 0,
            ) && (
              <button
                type="button"
                onClick={() => {
                  const bill = activeMenu.po.supplierBills![0];
                  setActiveMenu(null);
                  router.push(`/commercial/supplier-bills/${bill.id}`);
                }}
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#1d4ed8] hover:bg-[#eff6ff] transition-colors cursor-pointer text-left group"
              >
                <FileText className="w-3.5 h-3.5 text-[#1d4ed8] shrink-0" />
                <span className="truncate">
                  View Bill ({activeMenu.po.supplierBills![0].billNumber})
                </span>
              </button>
            )}

            {/* Convert to Bill & Post JE (only if RECEIVED and NOT yet billed) */}
            {activeMenu.po.status === "RECEIVED" &&
              !(
                activeMenu.po.supplierBills &&
                activeMenu.po.supplierBills.length > 0
              ) && (
                <button
                  type="button"
                  onClick={() => {
                    const po = activeMenu.po;
                    setActiveMenu(null);
                    handleConvertToBill(po);
                  }}
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors cursor-pointer text-left group"
                >
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Convert to Bill &amp; Post</span>
                </button>
              )}

            {/* Delete PO (Draft only) */}
            {activeMenu.po.status === "DRAFT" &&
              canModify(activeMenu.po.createdBy, ["INVENTORY_MANAGER"]) && (
                <>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => {
                      const po = activeMenu.po;
                      setActiveMenu(null);
                      handleDeletePO(po);
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50/70 transition-colors cursor-pointer text-left group"
                  >
                    <TrashIcon size={14} className="text-rose-500 shrink-0" />
                    <span className="truncate">Delete PO</span>
                  </button>
                </>
              )}
          </div>,
          document.body,
        )}
    </div>
  );
}
