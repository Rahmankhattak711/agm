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
import { PlusIcon, ShoppingCartIcon, PrintIcon, EyeIcon, TrashIcon } from "@/components/icons";
import { Plus, RefreshCw, PackageCheck, FileText } from "lucide-react";
import {
  Button,
  Select,
  RegisterTable,
  RegisterColumn,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  EmptyState,
  PageHeader,
  FilterBar,
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

const COLUMNS: RegisterColumn[] = [
  { label: "PO Number & Ref", compact: true, className: "whitespace-nowrap" },
  { label: "Vendor / Shop Name", compact: true },
  {
    label: "Order Date",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Expected Date",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Items Ordered",
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

const getStatusBadge = (status: PurchaseOrderStatus, po?: any) => {
  const isBilled = po?.supplierBills && po.supplierBills.length > 0;
  if (isBilled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        <span>Billed</span>
      </span>
    );
  }
  switch (status) {
    case "DRAFT":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          Draft
        </span>
      );
    case "ORDERED":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
          Ordered
        </span>
      );
    case "RECEIVED":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          Received
        </span>
      );
    case "CANCELLED":
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
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

  const totalPOs = purchaseOrders.length;
  const draftCount = purchaseOrders.filter((p) => p.status === "DRAFT").length;
  const orderedCount = purchaseOrders.filter(
    (p) => p.status === "ORDERED",
  ).length;
  const receivedCount = purchaseOrders.filter(
    (p) => p.status === "RECEIVED",
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

  return (
    <div className="w-full min-h-full flex flex-col font-sans">
      {/* Executive Header - Clean alignment, zero overlap */}
      <div className="w-full bg-white border-b border-slate-200/90 px-6 py-4 shrink-0 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#5046e5] shadow-2xs">
                <ShoppingCartIcon size={16} />
              </div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Purchase Orders
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                  {purchaseOrders.length} Records
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Create supplier purchase orders, track delivery milestones, and manage material procurement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition-colors cursor-pointer"
              title="Refresh purchase orders"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#5046e5]" : ""}`} />
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push("/inventory/purchase-orders/new")}
              icon={<Plus size={14} strokeWidth={2.5} />}
              className="bg-[#5046e5] hover:bg-[#4338ca] text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Create Purchase Order
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 bg-slate-50/40">

      <PurchaseOrdersKpis
        totalPOs={totalPOs}
        draftCount={draftCount}
        orderedCount={orderedCount}
        totalPurchasesValue={totalPurchasesValue}
      />

      <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <FilterBar
          tabs={[
            { id: "ALL", label: "All POs" },
            { id: "DRAFT", label: "Draft" },
            { id: "ORDERED", label: "Ordered" },
            { id: "RECEIVED", label: "Received" },
            { id: "CANCELLED", label: "Cancelled" },
          ]}
          activeTab={statusFilter}
          onTabChange={(id) => setStatusFilter(id)}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search PO #, supplier, shop, quote ref..."
          totalCount={filteredPOs.length}
          countLabel="Orders Listed"
          rightAction={
            <div className="w-full sm:w-56">
              <Select
                containerClassName="w-full"
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none shadow-2xs cursor-pointer truncate"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <option value="">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          }
        />

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading POs: {(error as any).message}
          </div>
        ) : (
          <RegisterTable
            title="Procurement & Purchase Orders Register"
            countLabel={`${filteredPOs.length} Records`}
            columns={COLUMNS}
          >
            <TableBody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <TableLoading colSpan={8} rows={5} />
              ) : filteredPOs.length === 0 ? (
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
                filteredPOs.map((po) => (
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
          </RegisterTable>
        )}
      </div>

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

      </div>

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
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-[185px] rounded-xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/10 p-1 z-[9999] animate-in fade-in zoom-in-95 duration-100 select-none"
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
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 transition-colors cursor-pointer text-left group"
            >
              <EyeIcon size={14} className="text-indigo-600 shrink-0" />
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
                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 transition-colors cursor-pointer text-left group"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
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
                  className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors cursor-pointer text-left group"
                >
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">Convert to Bill & Post</span>
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
