"use client";

import React, { useMemo, useState, useCallback, useRef } from "react";
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
import { PlusIcon, ShoppingCartIcon } from "@/components/icons";
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

const getStatusBadge = (status: PurchaseOrderStatus) => {
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
  const { canModify } = useAuth();
  const { confirm } = useConfirm();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [printModalPO, setPrintModalPO] = useState<PurchaseOrder | null>(null);
  const [expandedPOId, setExpandedPOId] = useState<string | null>(null);
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
          if (expandedPOId === po.id) {
            setExpandedPOId(null);
          }
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Create supplier purchase orders, track delivery milestones, and manage material procurement."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Create Purchase Order
          </Button>
        }
      />

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
                          : () => setIsCreateOpen(true)
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredPOs.map((po) => {
                  const isExpanded = expandedPOId === po.id;
                  const isDraft = po.status === "DRAFT";
                  const isOrdered = po.status === "ORDERED";
                  const canEdit = canModify(po.createdBy, [
                    "INVENTORY_MANAGER",
                  ]);

                  return (
                    <PurchaseOrderRow
                      key={po.id}
                      po={po}
                      isExpanded={isExpanded}
                      canEdit={canEdit}
                      onToggleExpand={() =>
                        setExpandedPOId(isExpanded ? null : po.id)
                      }
                      onPrint={() => handlePrintPO(po)}
                      onDelete={() => handleDeletePO(po)}
                      onSend={
                        isDraft && canEdit
                          ? () =>
                            updatePO.mutate({
                              id: po.id,
                              status: "ORDERED",
                            })
                          : undefined
                      }
                      onReceive={
                        isOrdered && canEdit
                          ? () => setReceiveModalPO(po)
                          : undefined
                      }
                      isUpdating={updatePO.isPending}
                      onCloseExpand={() => setExpandedPOId(null)}
                      getStatusBadge={getStatusBadge}
                    />
                  );
                })
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
    </div>
  );
}
