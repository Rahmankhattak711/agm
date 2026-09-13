"use client";

import React, { useMemo, useState, useCallback, useRef, Fragment } from "react";
import { useReactToPrint } from "react-to-print";
import { useForm } from "@tanstack/react-form";
import { useAuth } from "@/context/AuthContext";
import {
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useDeletePurchaseOrder,
  useProducts,
  useCreateProduct,
  useSuppliers,
  useWarehouses,
  PurchaseOrder,
  PurchaseOrderStatus,
  ProductType,
} from "@/lib/hooks/api-hooks";
import {
  PlusIcon,
  SearchIcon,
  PrintIcon,
  ShoppingCartIcon,
  EyeIcon,
  TrashIcon,
  CloseIcon,
  ChevronDownIcon,
} from "@/components/icons";
import { PurchaseOrderPrintModal } from "./PurchaseOrderPrintModal";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";
import {
  Button,
  Input,
  Select,
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
} from "@/components/ui";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";

// ----------------------------------------------------------------------
// Official Quotation-Style A4 Print Voucher for Purchase Order
// ----------------------------------------------------------------------
interface PurchaseOrderDocumentProps {
  po: PurchaseOrder;
}

const PurchaseOrderDocument: React.FC<PurchaseOrderDocumentProps> = ({ po }) => {
  const calculatedSubtotal = (po.items || []).reduce(
    (acc, it) =>
      acc + Number(it.quantityOrdered || 0) * Number(it.unitCost || 0),
    0,
  );
  const vatAmount = calculatedSubtotal * 0.05;
  const grandTotal = calculatedSubtotal + vatAmount;
  const formattedOrderDate = po.orderDate
    ? new Date(po.orderDate).toLocaleDateString("en-GB")
    : "-";
  const formattedExpectedDate = po.expectedDate
    ? new Date(po.expectedDate).toLocaleDateString("en-GB")
    : "-";

  return (
    <div
      id="printable-purchase-order"
      className="mx-auto bg-white max-w-4xl min-w-[700px] md:min-w-0 rounded-xl print:rounded-none overflow-visible print:overflow-visible print:w-full print:shadow-none font-sans"
    >
      <table className="print-page-table w-full border-collapse">
        <thead className="print-page-header-group">
          <tr>
            <th className="p-0 font-normal text-left border-none">
              <QuotationHeader />
            </th>
          </tr>
        </thead>

        <tfoot className="print-page-footer-group">
          <tr>
            <td className="p-0 border-none align-bottom">
              <div
                className="w-full opacity-0 pointer-events-none select-none"
                style={{ minHeight: "175px" }}
                aria-hidden="true"
              >
                <QuotationFooter />
                <div style={{ height: "45px", minHeight: "45px" }} />
              </div>
            </td>
          </tr>
        </tfoot>

        <tbody className="print-page-body-group">
          {/* Document Title Bar */}
          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 py-3.5 print:px-8 print:py-2.5 w-full border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between gap-8">
                  <div>
                    <h1 className="text-2xl print:text-2xl font-black text-slate-900 tracking-tight">
                      PURCHASE ORDER
                    </h1>
                    <p className="text-[11px] print:text-[11px] font-semibold text-emerald-700 mt-0.5 print:mt-0">
                      Official Commercial Procurement &amp; Supply Requisition (UAE Standard 5% VAT)
                    </p>
                  </div>

                  <div className="w-[320px] print:w-[320px] space-y-1 text-[12px] print:text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        PO Number:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {po.poNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Order Date:
                      </span>
                      <span className="font-bold text-slate-900">
                        {formattedOrderDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Expected Delivery:
                      </span>
                      <span className="font-bold text-slate-900">
                        {formattedExpectedDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Status:
                      </span>
                      <span className="font-bold text-emerald-800">
                        {po.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          {/* Supplier & Delivery Cards */}
          <tr>
            <td className="p-0 border-none align-top">
              <div className="grid grid-cols-2 gap-4 print:gap-3 px-10 py-3.5 print:px-8 print:py-2 text-[12px] print:text-[12px] print-avoid-break">
                {/* Left Card: Supplier Details */}
                <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2.5 rounded-xl shadow-2xs">
                  <div className="font-bold mb-2 print:mb-1.5 text-slate-900 uppercase text-[11px] print:text-[11px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                    SUPPLIER / VENDOR DETAILS
                  </div>
                  <div className="space-y-1.5 print:space-y-1">
                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Vendor Name:
                      </span>
                      <span className="font-bold text-slate-900">
                        {po.supplier?.name || po.shopName || "External Supplier"}
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        UAE VAT TRN:
                      </span>
                      <span className="font-mono text-slate-800 font-bold">
                        {po.supplier?.trn || "N/A"}
                      </span>
                    </div>

                    {po.shopName && (
                      <div className="flex items-start gap-1">
                        <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                          Shop / Branch:
                        </span>
                        <span className="text-slate-800 font-medium">
                          {po.shopName}
                        </span>
                      </div>
                    )}

                    {po.vendorReference && (
                      <div className="flex items-start gap-1">
                        <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                          Vendor Ref:
                        </span>
                        <span className="font-mono text-slate-800 font-bold">
                          {po.vendorReference}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Card: Logistics */}
                <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2.5 rounded-xl shadow-2xs">
                  <div className="font-bold mb-2 print:mb-1.5 text-slate-900 uppercase text-[11px] print:text-[11px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                    LOGISTICS &amp; SPECIFICATIONS
                  </div>
                  <div className="space-y-1.5 print:space-y-1">
                    <div className="flex items-start gap-1">
                      <span className="w-28 print:w-28 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Delivery Destination:
                      </span>
                      <span className="font-bold text-slate-900">
                        Central Warehouse / Site Direct
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-28 print:w-28 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Raised By:
                      </span>
                      <span className="text-slate-800 font-semibold">
                        {po.creator?.fullName || "Procurement Officer"}
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-28 print:w-28 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Currency:
                      </span>
                      <span className="font-bold text-emerald-800">
                        AED - United Arab Emirates Dirham
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          {/* Line Items Table */}
          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 py-2 print:px-8 print:py-1">
                <table className="w-full text-[11px] print:text-[11px] border border-slate-200 print:border-slate-300">
                  <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 text-left w-8">#</th>
                      <th className="py-2 px-3 text-left">Item Description / SKU</th>
                      <th className="py-2 px-3 text-left">Supplier SKU</th>
                      <th className="py-2 px-3 text-center w-16">Unit</th>
                      <th className="py-2 px-3 text-right w-20">Qty</th>
                      <th className="py-2 px-3 text-right w-24">Unit Rate</th>
                      <th className="py-2 px-3 text-right w-28">Amount (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {po.items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="py-2 px-3 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900">{it.product?.name || "Material Item"}</div>
                          <div className="text-[10px] text-slate-500 font-mono">SKU: {it.product?.sku || "-"}</div>
                          {it.itemNotes && (
                            <div className="text-[10px] text-slate-400 italic">{it.itemNotes}</div>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600 text-[10.5px]">
                          {it.supplierSku || it.product?.supplierSku || "-"}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-600">{it.product?.unit || "PCS"}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {Number(it.quantityOrdered).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">
                          {Number(it.unitCost).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {Number(it.totalCost).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>

          {/* Totals & Notes Section */}
          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 py-3 print:px-8 print:py-2 print-avoid-break">
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1 text-[11px] text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                      Terms &amp; Delivery Instructions:
                    </div>
                    {po.notes ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{po.notes}</p>
                    ) : (
                      <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
                        <li>All goods must match specified SKU codes and quality standards.</li>
                        <li>Original Tax Invoice referencing this Purchase Order must accompany shipment.</li>
                        <li>Damaged or non-compliant materials will be rejected at supplier cost.</li>
                      </ol>
                    )}
                  </div>

                  <div className="w-72 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <div className="flex justify-between px-3.5 py-2 border-b border-slate-200">
                      <span className="text-slate-600 font-semibold">Subtotal</span>
                      <span className="font-mono font-bold text-slate-900">AED {calculatedSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between px-3.5 py-2 border-b border-slate-200">
                      <span className="text-slate-600 font-semibold">UAE VAT (5%)</span>
                      <span className="font-mono font-bold text-slate-900">AED {vatAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between px-3.5 py-2.5 bg-emerald-900 text-white font-bold text-sm">
                      <span>Grand Total (AED)</span>
                      <span className="font-mono">AED {grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Fixed bottom footer for print */}
      <div className="print-footer-bottom fixed-print-footer hidden print:block">
        <QuotationFooter />
      </div>

      {/* Screen view footer */}
      <div className="px-10 pb-6 print:hidden">
        <QuotationFooter className="mt-6" />
      </div>
    </div>
  );
};

interface ItemRow {
  productId: string;
  supplierSku?: string;
  itemNotes?: string;
  quantityOrdered: string;
  unitCost: string;
}

export default function PurchaseOrdersPage() {
  const { canModify } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [printModalPO, setPrintModalPO] = useState<PurchaseOrder | null>(null);
  const [expandedPOId, setExpandedPOId] = useState<string | null>(null);
  const [printingPO, setPrintingPO] = useState<PurchaseOrder | null>(null);
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

  const [receiveModalPO, setReceiveModalPO] = useState<PurchaseOrder | null>(
    null,
  );
  const [formError, setFormError] = useState("");

  const [isQuickProductOpen, setIsQuickProductOpen] = useState(false);
  const [quickProductTargetIdx, setQuickProductTargetIdx] = useState<
    number | null
  >(null);
  const [quickProductError, setQuickProductError] = useState("");

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
  const createProduct = useCreateProduct();

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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

  const poForm = useForm({
    defaultValues: {
      poNumber: `PO-${Date.now().toString().slice(-4)}`,
      supplierId: "",
      shopName: "",
      vendorReference: "",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDate: "",
      notes: "",
      items: [
        {
          productId: "",
          supplierSku: "",
          itemNotes: "",
          quantityOrdered: "1",
          unitCost: "0",
        },
      ] as ItemRow[],
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      if (
        !value.poNumber.trim() ||
        !value.supplierId ||
        value.items.length === 0
      ) {
        setFormError("PO number, supplier, and items are required.");
        return;
      }

      for (const it of value.items) {
        if (!it.productId) {
          setFormError("Please select or add a product for all item rows.");
          return;
        }
      }

      try {
        await createPO.mutateAsync({
          poNumber: value.poNumber.trim().toUpperCase(),
          supplierId: value.supplierId,
          shopName: value.shopName.trim() || undefined,
          vendorReference: value.vendorReference.trim() || undefined,
          orderDate: value.orderDate,
          expectedDate: value.expectedDate || undefined,
          status: "DRAFT",
          notes: value.notes.trim() || undefined,
          items: value.items.map((it) => ({
            productId: it.productId,
            supplierSku: it.supplierSku?.trim() || undefined,
            itemNotes: it.itemNotes?.trim() || undefined,
            quantityOrdered: Number(it.quantityOrdered),
            unitCost: Number(it.unitCost),
          })),
        });

        setIsCreateOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to create PO");
      }
    },
  });

  const quickProductForm = useForm({
    defaultValues: {
      name: "",
      brand: "",
      supplierSku: "",
      originCompany: "",
      shopLocation: "",
      type: "RAW_MATERIAL" as ProductType,
      unit: "PCS",
      costPrice: "0",
      sellingPrice: "0",
      supplierId: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      setQuickProductError("");
      if (!value.name.trim()) {
        setQuickProductError("Product Name is required.");
        return;
      }

      try {
        const autoSku = `EXT-${Date.now().toString().slice(-6)}`;
        const newProd = await createProduct.mutateAsync({
          name: value.name.trim(),
          sku: autoSku,
          brand: value.brand.trim() || null,
          supplierSku: value.supplierSku.trim() || null,
          originCompany: value.originCompany.trim() || null,
          shopLocation: value.shopLocation.trim() || null,
          productOrigin: "PURCHASED_EXTERNAL",
          type: value.type || "RAW_MATERIAL",
          unit: value.unit?.trim() || "PCS",
          costPrice: Number(value.costPrice || 0),
          sellingPrice: Number(value.sellingPrice || 0),
          supplierId:
            value.supplierId || poForm.getFieldValue("supplierId") || null,
          description: value.description.trim() || null,
        });

        const currentItems = poForm.getFieldValue("items") || [];
        if (
          quickProductTargetIdx !== null &&
          currentItems[quickProductTargetIdx]
        ) {
          const next = [...currentItems];
          next[quickProductTargetIdx] = {
            ...next[quickProductTargetIdx],
            productId: newProd.id,
            supplierSku: newProd.supplierSku || "",
            unitCost: newProd.costPrice?.toString() || "0",
          };
          poForm.setFieldValue("items", next);
        } else {
          poForm.setFieldValue("items", [
            ...currentItems,
            {
              productId: newProd.id,
              supplierSku: newProd.supplierSku || "",
              itemNotes: "",
              quantityOrdered: "1",
              unitCost: newProd.costPrice?.toString() || "0",
            },
          ]);
        }

        setIsQuickProductOpen(false);
      } catch (err: any) {
        setQuickProductError(
          err.message || "Failed to create external product",
        );
      }
    },
  });

  const receiveForm = useForm({
    defaultValues: {
      receiveWarehouseId: "",
    },
    onSubmit: async ({ value }) => {
      if (!receiveModalPO || !value.receiveWarehouseId) return;

      await updatePO.mutateAsync({
        id: receiveModalPO.id,
        status: "RECEIVED",
        warehouseIdToReceive: value.receiveWarehouseId,
      });

      setReceiveModalPO(null);
    },
  });

  const handleOpenCreate = () => {
    setFormError("");
    poForm.reset({
      poNumber: `PO-${Date.now().toString().slice(-4)}`,
      supplierId: suppliers.length > 0 ? suppliers[0].id : "",
      shopName: "",
      vendorReference: "",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDate: "",
      notes: "",
      items: [
        {
          productId: "",
          supplierSku: "",
          itemNotes: "",
          quantityOrdered: "1",
          unitCost: "0",
        },
      ],
    });
    setIsCreateOpen(true);
  };

  const handleOpenQuickProduct = (idx: number | null) => {
    setQuickProductError("");
    setQuickProductTargetIdx(idx);
    const currentSupplierId = poForm.getFieldValue("supplierId");
    const currentSupplier = suppliers.find((s) => s.id === currentSupplierId);

    quickProductForm.reset({
      name: "",
      brand: "",
      supplierSku: "",
      originCompany:
        currentSupplier?.name || poForm.getFieldValue("shopName") || "",
      shopLocation: currentSupplier?.address || "",
      type: "RAW_MATERIAL",
      unit: "PCS",
      costPrice: "0",
      sellingPrice: "0",
      supplierId: currentSupplierId || "",
      description: "",
    });
    setIsQuickProductOpen(true);
  };

  const handleOpenReceive = useCallback(
    (po: PurchaseOrder) => {
      setReceiveModalPO(po);
      receiveForm.reset({
        receiveWarehouseId: warehouses[0]?.id || "",
      });
    },
    [receiveForm, warehouses],
  );

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



  return (
    <div className="space-y-6">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Purchase Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create supplier purchase orders, track delivery milestones, and manage material procurement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Create Purchase Order
          </Button>
        </div>
      </div>

      {/* 4 Elevated Summary KPI Cards */}
      <ReportKpiGrid cols={3}>
        <ReportKpiCard
          title="1. Total Purchase Orders"
          subtitle="All procurement records"
          value={totalPOs}
          currency={false}
          accentColor="sky"
          footerText="Orders"
        />
        <ReportKpiCard
          title="2. Draft Orders"
          subtitle="Awaiting supplier issuance"
          value={draftCount}
          currency={false}
          accentColor="amber"
          valueColor="text-amber-700"
          footerText="Drafts"
        />
        <ReportKpiCard
          title="3. Pending Deliveries"
          subtitle="Awaiting warehouse receipt"
          value={orderedCount}
          currency={false}
          accentColor="blue"
          valueColor="text-blue-800"
          footerText="Ordered"
        />
        <ReportKpiCard
          title="4. Procurement Spend"
          subtitle="Cumulative purchase volume"
          badge={
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Active
            </span>
          }
          value={formatNumber(totalPurchasesValue)}
          currency="AED"
          accentColor="emerald"
          valueColor="text-emerald-800"
        />
      </ReportKpiGrid>

      {/* Print-Only Compact Summary Strip */}
      <div className="hidden print:grid print:grid-cols-4 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
            Total Orders
          </span>
          <span className="font-mono font-bold text-slate-900">
            {totalPOs}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-amber-600 font-bold block">
            Drafts
          </span>
          <span className="font-mono font-bold text-amber-700">
            {draftCount}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-blue-600 font-bold block">
            Pending Delivery
          </span>
          <span className="font-mono font-bold text-blue-800">
            {orderedCount}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold block">
            Procurement Spend
          </span>
          <span className="font-mono font-bold text-emerald-800">
            AED {formatNumber(totalPurchasesValue)}
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
                { id: "ALL", label: "All POs" },
                { id: "DRAFT", label: "Draft" },
                { id: "ORDERED", label: "Ordered" },
                { id: "RECEIVED", label: "Received" },
                { id: "CANCELLED", label: "Cancelled" },
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
              {filteredPOs.length} Orders Listed
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between pt-1 border-t border-slate-200/60">
            <Input
              leftIcon={<SearchIcon size={14} className="text-slate-400" />}
              placeholder="Search PO #, supplier, shop, quote ref..."
              containerClassName="w-full sm:w-80"
              className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select
                containerClassName="w-full sm:w-56"
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
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading POs: {(error as any).message}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between print:bg-none print:!bg-slate-100 print:!text-slate-900">
              <h4 className="font-black text-xs uppercase tracking-wider text-white print:!text-slate-900">
                Procurement &amp; Purchase Orders Register
              </h4>
              <span className="text-[11px] font-mono text-emerald-300 font-bold print:!text-slate-700">
                {filteredPOs.length} Records
              </span>
            </div>

            <Table className="w-full text-xs text-left">
              <TableHead className="bg-slate-50 border-b border-slate-200">
                <TableRow>
                  <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    PO Number &amp; Ref
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    Vendor / Shop Name
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    Order Date
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    Expected Date
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    Items Ordered
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-3 px-3 text-right font-bold text-slate-600 uppercase text-[10.5px] tracking-wider"
                  >
                    Total (AED)
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    Status
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider print:hidden">
                    Actions
                  </TableHeaderCell>
                </TableRow>
              </TableHead>

              <TableBody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <TableLoading colSpan={8} rows={5} />
                ) : filteredPOs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-slate-400 italic"
                    >
                      No purchase orders match your search criteria.
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
                    const calculatedSubtotal = (po.items || []).reduce(
                      (acc, it) =>
                        acc +
                        Number(it.quantityOrdered || 0) *
                          Number(it.unitCost || 0),
                      0,
                    );
                    const vatAmount = calculatedSubtotal * 0.05;

                    return (
                      <Fragment key={po.id}>
                        <TableRow
                          onClick={() =>
                            setExpandedPOId(isExpanded ? null : po.id)
                          }
                          className={`hover:bg-emerald-50/40 cursor-pointer transition-colors ${
                            isExpanded
                              ? "bg-emerald-50/50 font-semibold"
                              : "text-slate-700"
                          }`}
                        >
                          <TableCell className="py-3 px-4 font-mono font-bold text-teal-800">
                            <div className="flex items-center gap-2">
                              <ChevronDownIcon
                                size={15}
                                className={`shrink-0 transition-transform duration-200 ${
                                  isExpanded
                                    ? "rotate-180 text-emerald-800"
                                    : "text-slate-400"
                                }`}
                              />
                              <ShoppingCartIcon
                                size={13}
                                className="text-teal-700 shrink-0"
                              />
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 hover:text-emerald-800 transition-colors">
                                  {po.poNumber}
                                </span>
                                {po.vendorReference && (
                                  <span className="text-[10px] text-teal-800 font-mono font-semibold bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200 inline-block mt-0.5 max-w-fit">
                                    Ref: {po.vendorReference}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-3 px-4 font-bold text-slate-900">
                            <div>
                              {po.supplier?.name ||
                                po.shopName ||
                                "External Supplier"}
                            </div>
                            {po.supplier?.trn && (
                              <div className="text-[10px] text-slate-400 font-mono font-normal">
                                TRN: {po.supplier.trn}
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="py-3 px-3 text-slate-600 font-mono">
                            {po.orderDate
                              ? new Date(po.orderDate).toLocaleDateString(
                                  "en-GB",
                                )
                              : "-"}
                          </TableCell>

                          <TableCell className="py-3 px-3 text-slate-600 font-mono">
                            {po.expectedDate
                              ? new Date(po.expectedDate).toLocaleDateString(
                                  "en-GB",
                                )
                              : "-"}
                          </TableCell>

                          <TableCell className="py-3 px-3 text-slate-700">
                            <span className="font-bold text-slate-800">
                              {po.items?.length || 0} Products
                            </span>
                          </TableCell>

                          <TableCell
                            align="right"
                            className="py-3 px-3 text-right font-mono font-bold text-slate-900"
                          >
                            {formatNumber(po.totalAmount)}
                          </TableCell>

                          <TableCell className="py-3 px-3 text-center">
                            {getStatusBadge(po.status)}
                          </TableCell>

                          <TableCell
                            className="py-3 px-3 text-center print:hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintPO(po)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                title="Direct Print PO (A4 Voucher)"
                              >
                                <PrintIcon size={13} />
                              </Button>

                              {isDraft && canEdit && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  loading={updatePO.isPending}
                                  onClick={() =>
                                    updatePO.mutate({
                                      id: po.id,
                                      status: "ORDERED",
                                    })
                                  }
                                  className="text-xs font-bold cursor-pointer"
                                >
                                  Send
                                </Button>
                              )}

                              {isOrdered && canEdit && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleOpenReceive(po)}
                                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                                >
                                  Receive
                                </Button>
                              )}

                              {isDraft && canEdit && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Are you sure you want to delete PO ${po.poNumber}?`,
                                      )
                                    ) {
                                      deletePO.mutate(po.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                                  title="Delete PO"
                                >
                                  <TrashIcon size={13} />
                                </Button>
                              )}

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setExpandedPOId(isExpanded ? null : po.id)
                                }
                                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                                title={
                                  isExpanded
                                    ? "Collapse Details"
                                    : "Expand Details"
                                }
                              >
                                <ChevronDownIcon
                                  size={14}
                                  className={`transition-transform duration-200 ${
                                    isExpanded
                                      ? "rotate-180 text-emerald-800"
                                      : ""
                                  }`}
                                />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* QA-style Accordion Drawer */}
                        {isExpanded && (
                          <TableRow className="bg-slate-50/70 border-b border-emerald-100/60">
                            <TableCell colSpan={8} className="p-0">
                              <div className="overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Top Banner Ribbon */}
                                <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white px-5 py-2.5 flex items-center justify-between text-xs font-semibold">
                                  <span className="flex items-center gap-2">
                                    <ShoppingCartIcon
                                      size={14}
                                      className="text-emerald-400"
                                    />
                                    PURCHASE ORDER PROCUREMENT BREAKDOWN &mdash;
                                    #{po.poNumber}
                                  </span>
                                  <span className="text-emerald-300 font-mono text-[11px]">
                                    Status: {po.status}
                                  </span>
                                </div>

                                {/* 4 Elevated Summary KPI Cards */}
                                <div className="p-4 sm:p-5 space-y-4">
                                  <ReportKpiGrid cols={4}>
                                    <ReportKpiCard
                                      title="1. Total PO Value"
                                      subtitle="Gross procurement liability"
                                      value={formatNumber(po.totalAmount)}
                                      currency="AED"
                                      accentColor="emerald"
                                      valueColor="text-emerald-800"
                                    />
                                    <ReportKpiCard
                                      title="2. Net Subtotal"
                                      subtitle="Excl. 5% UAE VAT"
                                      value={formatNumber(calculatedSubtotal)}
                                      currency="AED"
                                      accentColor="sky"
                                      valueColor="text-sky-800"
                                    />
                                    <ReportKpiCard
                                      title="3. UAE Input VAT (5%)"
                                      subtitle="Claimable tax credit"
                                      value={formatNumber(vatAmount)}
                                      currency="AED"
                                      accentColor="amber"
                                      valueColor="text-amber-700"
                                    />
                                    <ReportKpiCard
                                      title="4. Delivery Timeline"
                                      subtitle={
                                        po.expectedDate
                                          ? `Due: ${new Date(po.expectedDate).toLocaleDateString("en-GB")}`
                                          : "Standard dispatch"
                                      }
                                      value={
                                        po.orderDate
                                          ? new Date(
                                              po.orderDate,
                                            ).toLocaleDateString("en-GB")
                                          : "-"
                                      }
                                      currency={false}
                                      accentColor="purple"
                                      valueColor="text-purple-800"
                                      footerText="Order Date"
                                    />
                                  </ReportKpiGrid>

                                  {/* 2 Detail Sections: Left Vendor Info & Right Line Items */}
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    {/* Vendor Profile & Logistics Card */}
                                    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
                                      <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        Vendor &amp; Requisition Profile
                                      </h5>

                                      <div className="space-y-2 text-xs">
                                        <div>
                                          <span className="text-[11px] text-slate-400 block font-semibold">
                                            Supplier / Vendor:
                                          </span>
                                          <span className="font-bold text-slate-900 text-sm">
                                            {po.supplier?.name ||
                                              po.shopName ||
                                              "External Supplier"}
                                          </span>
                                        </div>

                                        {po.supplier?.trn && (
                                          <div>
                                            <span className="text-[11px] text-slate-400 block font-semibold">
                                              UAE Tax Registration Number (TRN):
                                            </span>
                                            <span className="font-mono text-slate-700 font-bold">
                                              {po.supplier.trn}
                                            </span>
                                          </div>
                                        )}

                                        {po.shopName && (
                                          <div>
                                            <span className="text-[11px] text-slate-400 block font-semibold">
                                              Store / Shop Branch:
                                            </span>
                                            <span className="text-slate-800 font-medium">
                                              {po.shopName}
                                            </span>
                                          </div>
                                        )}

                                        {po.vendorReference && (
                                          <div>
                                            <span className="text-[11px] text-slate-400 block font-semibold">
                                              Vendor Reference / Quote #:
                                            </span>
                                            <span className="font-mono text-teal-800 font-bold">
                                              {po.vendorReference}
                                            </span>
                                          </div>
                                        )}

                                        {po.creator?.fullName && (
                                          <div>
                                            <span className="text-[11px] text-slate-400 block font-semibold">
                                              Procurement Officer:
                                            </span>
                                            <span className="text-slate-800 font-semibold">
                                              {po.creator.fullName}
                                            </span>
                                          </div>
                                        )}

                                        {po.notes && (
                                          <div className="pt-2 border-t border-slate-100">
                                            <span className="text-[11px] text-slate-400 block font-semibold">
                                              Order Instructions / Terms:
                                            </span>
                                            <p className="text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1 leading-relaxed">
                                              {po.notes}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Itemized Materials Table Card */}
                                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
                                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <h5 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-2">
                                          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                                          Itemized Procurement Materials (
                                          {po.items?.length || 0})
                                        </h5>
                                        <span className="text-[11px] font-mono text-slate-500">
                                          Subtotal: AED{" "}
                                          {formatNumber(calculatedSubtotal)}
                                        </span>
                                      </div>

                                      <div className="overflow-x-auto rounded-lg border border-slate-200/80">
                                        <table className="w-full text-left text-xs">
                                          <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                                            <tr>
                                              <th className="py-2 px-3">#</th>
                                              <th className="py-2 px-3">
                                                Product / SKU
                                              </th>
                                              <th className="py-2 px-3">
                                                Supplier SKU
                                              </th>
                                              <th className="py-2 px-2 text-center">
                                                Ordered
                                              </th>
                                              <th className="py-2 px-2 text-center">
                                                Received
                                              </th>
                                              <th className="py-2 px-3 text-right">
                                                Unit Rate
                                              </th>
                                              <th className="py-2 px-3 text-right">
                                                Total (AED)
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 font-medium">
                                            {(po.items || []).map((it, idx) => (
                                              <tr
                                                key={it.id || idx}
                                                className="hover:bg-slate-50/60"
                                              >
                                                <td className="py-2 px-3 text-slate-400 font-mono">
                                                  {idx + 1}
                                                </td>
                                                <td className="py-2 px-3">
                                                  <div className="font-bold text-slate-900">
                                                    {it.product?.name ||
                                                      "Product Item"}
                                                  </div>
                                                  <div className="text-[10px] text-slate-500 font-mono">
                                                    SKU:{" "}
                                                    {it.product?.sku || "-"}
                                                  </div>
                                                  {it.itemNotes && (
                                                    <div className="text-[10px] text-slate-400 italic">
                                                      {it.itemNotes}
                                                    </div>
                                                  )}
                                                </td>
                                                <td className="py-2 px-3 font-mono text-slate-600 text-[10.5px]">
                                                  {it.supplierSku ||
                                                    it.product?.supplierSku ||
                                                    "-"}
                                                </td>
                                                <td className="py-2 px-2 text-center font-mono font-bold text-slate-900">
                                                  {Number(
                                                    it.quantityOrdered,
                                                  ).toLocaleString()}{" "}
                                                  <span className="text-[10px] font-normal text-slate-400">
                                                    {it.product?.unit || "PCS"}
                                                  </span>
                                                </td>
                                                <td className="py-2 px-2 text-center font-mono text-slate-600">
                                                  {Number(
                                                    it.quantityReceived || 0,
                                                  ).toLocaleString()}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono text-slate-700">
                                                  {formatNumber(it.unitCost)}
                                                </td>
                                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                                  {formatNumber(it.totalCost)}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>

                                      {/* Quick Totals Strip & Action Footer */}
                                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                                        <div className="flex items-center gap-4 text-xs font-mono">
                                          <span className="text-slate-500">
                                            VAT (5%):{" "}
                                            <strong className="text-slate-800">
                                              AED {formatNumber(vatAmount)}
                                            </strong>
                                          </span>
                                          <span className="text-slate-900 font-bold text-sm">
                                            Grand Total:{" "}
                                            <strong className="text-emerald-800">
                                              AED {formatNumber(po.totalAmount)}
                                            </strong>
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <Button
                                            type="button"
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handlePrintPO(po)}
                                            icon={<PrintIcon size={14} />}
                                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                                          >
                                            Print PO Voucher
                                          </Button>

                                          {isDraft && canEdit && (
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              loading={updatePO.isPending}
                                              onClick={() =>
                                                updatePO.mutate({
                                                  id: po.id,
                                                  status: "ORDERED",
                                                })
                                              }
                                              className="text-xs font-bold cursor-pointer"
                                            >
                                              Send to Supplier
                                            </Button>
                                          )}

                                          {isOrdered && canEdit && (
                                            <Button
                                              variant="primary"
                                              size="sm"
                                              onClick={() =>
                                                handleOpenReceive(po)
                                              }
                                              className="bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold cursor-pointer"
                                            >
                                              Receive Goods
                                            </Button>
                                          )}

                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setExpandedPOId(null)
                                            }
                                            className="text-xs text-slate-600 cursor-pointer"
                                          >
                                            Collapse
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modal for Creating Purchase Order */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Purchase Order"
        maxWidth="3xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            poForm.handleSubmit();
          }}
          className="space-y-4 text-xs"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <poForm.Field
              name="poNumber"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "PO number is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="PO Number *"
                  required
                  className="font-mono font-bold uppercase"
                />
              )}
            </poForm.Field>

            <poForm.Field
              name="supplierId"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Supplier / Vendor is required" : undefined,
              }}
            >
              {(field) => (
                <FormSelect
                  field={field}
                  label="Supplier / Vendor Company *"
                  required
                >
                  <option value="">-- Select Vendor --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.supplierCode})
                    </option>
                  ))}
                </FormSelect>
              )}
            </poForm.Field>

            <poForm.Field
              name="orderDate"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Order date is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Order Date *"
                  type="date"
                  required
                />
              )}
            </poForm.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <poForm.Field name="vendorReference">
              {(field) => (
                <FormInput
                  field={field}
                  label="Shop / Vendor Quote Ref #"
                  placeholder="e.g., Shop Quote #4819 / Inv #21"
                />
              )}
            </poForm.Field>

            <poForm.Field name="shopName">
              {(field) => (
                <FormInput
                  field={field}
                  label="Shop / Branch Name"
                  placeholder="e.g., Deira Hardware Store / Al Quoz Branch"
                />
              )}
            </poForm.Field>

            <poForm.Field name="expectedDate">
              {(field) => (
                <FormInput
                  field={field}
                  label="Expected Delivery Date"
                  type="date"
                />
              )}
            </poForm.Field>
          </div>

          <poForm.Field name="items">
            {(itemsField) => {
              const currentItems = itemsField.state.value;

              const addItem = () => {
                itemsField.handleChange([
                  ...currentItems,
                  {
                    productId: "",
                    supplierSku: "",
                    itemNotes: "",
                    quantityOrdered: "1",
                    unitCost: "0",
                  },
                ]);
              };

              const removeItem = (index: number) => {
                if (currentItems.length > 1) {
                  itemsField.handleChange(
                    currentItems.filter((_, i) => i !== index),
                  );
                }
              };

              const updateItem = (
                index: number,
                key: keyof ItemRow,
                val: string,
              ) => {
                const next = [...currentItems];
                next[index] = { ...next[index], [key]: val };
                if (key === "productId") {
                  const prod = products.find((p) => p.id === val);
                  if (prod) {
                    next[index].unitCost = prod.costPrice?.toString() || "0";
                    if (prod.supplierSku) {
                      next[index].supplierSku = prod.supplierSku;
                    }
                  }
                }
                itemsField.handleChange(next);
              };

              const totalAmount = currentItems.reduce((acc, it) => {
                return (
                  acc +
                  Number(it.quantityOrdered || 0) * Number(it.unitCost || 0)
                );
              }, 0);

              return (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Procurement Line Items
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Select catalog products or click quick add to register
                        items bought from other shops.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenQuickProduct(null)}
                        className="text-xs text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
                        icon={<PlusIcon className="w-3.5 h-3.5" />}
                      >
                        + New Shop Product
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={addItem}
                        className="text-xs font-bold cursor-pointer"
                      >
                        + Add Row
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {currentItems.map((row, idx) => {
                      return (
                        <div
                          key={idx}
                          className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-2"
                        >
                          <div className="flex flex-col sm:flex-row items-center gap-2">
                            <div className="w-full sm:flex-1">
                              <Select
                                required
                                value={row.productId}
                                onChange={(e) =>
                                  updateItem(idx, "productId", e.target.value)
                                }
                                className="w-full py-1.5 text-xs font-medium"
                              >
                                <option value="">-- Select Product --</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} {p.brand ? `[${p.brand}]` : ""} (
                                    {p.sku}){" "}
                                    {p.supplierSku
                                      ? `• Ref: ${p.supplierSku}`
                                      : ""}
                                  </option>
                                ))}
                              </Select>
                            </div>

                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpenQuickProduct(idx)}
                              title="Create and select a new shop product for this row"
                              className="text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer"
                            >
                              + New Product
                            </Button>

                            <Input
                              type="number"
                              min="0.01"
                              step="any"
                              placeholder="Qty"
                              required
                              value={row.quantityOrdered}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "quantityOrdered",
                                  e.target.value,
                                )
                              }
                              className="w-full sm:w-20 py-1.5 text-xs"
                            />

                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Cost (AED)"
                              required
                              value={row.unitCost}
                              onChange={(e) =>
                                updateItem(idx, "unitCost", e.target.value)
                              }
                              className="w-full sm:w-28 py-1.5 text-xs font-mono"
                            />

                            <div className="w-24 text-right font-mono font-bold text-xs text-slate-900">
                              AED{" "}
                              {(
                                Number(row.quantityOrdered || 0) *
                                Number(row.unitCost || 0)
                              ).toFixed(2)}
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(idx)}
                              disabled={currentItems.length === 1}
                              className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer p-1"
                            >
                              <CloseIcon size={12} />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                            <Input
                              placeholder="Shop / Vendor Item Code / Reference (Optional)"
                              value={row.supplierSku || ""}
                              onChange={(e) =>
                                updateItem(idx, "supplierSku", e.target.value)
                              }
                              className="py-1 text-[11px] bg-slate-50/50"
                            />
                            <Input
                              placeholder="Item notes / specifications (e.g., Color 9010, 5L Can, Stainless 304)"
                              value={row.itemNotes || ""}
                              onChange={(e) =>
                                updateItem(idx, "itemNotes", e.target.value)
                              }
                              className="py-1 text-[11px] bg-slate-50/50"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-slate-800 pt-2 border-t border-slate-200">
                    <span className="text-slate-500">
                      {currentItems.length} line item(s) configured
                    </span>
                    <span className="font-mono text-sm text-emerald-900 font-black">
                      Total Order Amount: AED {totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            }}
          </poForm.Field>

          <poForm.Field name="notes">
            {(field) => (
              <FormTextarea
                field={field}
                label="Notes / Delivery Instructions"
                rows={2}
                placeholder="Payment terms, delivery contact, location instructions..."
              />
            )}
          </poForm.Field>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
            >
              Cancel
            </Button>
            <FormSubmit
              form={poForm}
              loading={createPO.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
            >
              Save Purchase Order
            </FormSubmit>
          </div>
        </form>
      </Modal>

      {/* Quick Add Product Modal */}
      <Modal
        isOpen={isQuickProductOpen}
        onClose={() => setIsQuickProductOpen(false)}
        title="Quick Add External / Shop Product"
        maxWidth="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            quickProductForm.handleSubmit();
          }}
          className="space-y-3.5 text-xs"
        >
          {quickProductError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              {quickProductError}
            </div>
          )}

          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 text-xs">
            <span className="font-bold block">💡 External Shop Product</span>
            Register a material or item purchased from an external shop, vendor,
            or marketplace to inventory.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <quickProductForm.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "Product Name is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Product / Material Name *"
                  placeholder="e.g., Dulux Eggshell White 5L"
                  required
                />
              )}
            </quickProductForm.Field>

            <quickProductForm.Field name="brand">
              {(field) => (
                <FormInput
                  field={field}
                  label="Brand / Manufacturer"
                  placeholder="e.g., Dulux, Jotun, Bosch, Saint-Gobain"
                />
              )}
            </quickProductForm.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <quickProductForm.Field name="supplierSku">
              {(field) => (
                <FormInput
                  field={field}
                  label="Shop Reference / Vendor Part #"
                  placeholder="e.g., DLX-EGG-5L or Barcode"
                />
              )}
            </quickProductForm.Field>

            <quickProductForm.Field name="originCompany">
              {(field) => (
                <FormInput
                  field={field}
                  label="Shop / Vendor Company Name"
                  placeholder="e.g., Al Gurg Building Materials LLC"
                />
              )}
            </quickProductForm.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <quickProductForm.Field name="unit">
              {(field) => (
                <FormSelect field={field} label="Unit of Measure *">
                  <option value="PCS">PCS (Pieces)</option>
                  <option value="SQM">SQM (Square Meters)</option>
                  <option value="LM">LM (Linear Meters)</option>
                  <option value="BOX">BOX</option>
                  <option value="SET">SET</option>
                  <option value="KG">KG</option>
                  <option value="ROLL">ROLL</option>
                  <option value="PACK">PACK</option>
                  <option value="LTR">LTR (Liters)</option>
                  <option value="CAN">CAN</option>
                  <option value="SHEET">SHEET</option>
                </FormSelect>
              )}
            </quickProductForm.Field>

            <quickProductForm.Field name="costPrice">
              {(field) => (
                <FormInput
                  field={field}
                  label="Cost Price (AED) *"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
              )}
            </quickProductForm.Field>

            <quickProductForm.Field name="type">
              {(field) => (
                <FormSelect field={field} label="Product Type">
                  <option value="RAW_MATERIAL">Raw Material</option>
                  <option value="CONSUMABLE">Consumable</option>
                  <option value="TOOL_EQUIPMENT">Tool / Equipment</option>
                  <option value="FINISHED_GOOD">Finished Good</option>
                </FormSelect>
              )}
            </quickProductForm.Field>
          </div>

          <quickProductForm.Field name="description">
            {(field) => (
              <FormTextarea
                field={field}
                label="Product Details / Specifications"
                rows={2}
                placeholder="Grade, dimensions, color code, shop warranty..."
              />
            )}
          </quickProductForm.Field>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsQuickProductOpen(false)}
            >
              Cancel
            </Button>
            <FormSubmit
              form={quickProductForm}
              loading={createProduct.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
            >
              Create &amp; Add to PO
            </FormSubmit>
          </div>
        </form>
      </Modal>

      {/* Receive Shipment Modal */}
      <Modal
        isOpen={!!receiveModalPO}
        onClose={() => setReceiveModalPO(null)}
        title={`Receive Goods: ${receiveModalPO?.poNumber || ""}`}
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            receiveForm.handleSubmit();
          }}
          className="space-y-3.5 text-xs"
        >
          <receiveForm.Field
            name="receiveWarehouseId"
            validators={{
              onChange: ({ value }) =>
                !value ? "Destination warehouse is required" : undefined,
            }}
          >
            {(field) => (
              <FormSelect
                field={field}
                label="Destination Warehouse *"
                required
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </FormSelect>
            )}
          </receiveForm.Field>

          {receiveModalPO && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-700 block">
                Items in this shipment:
              </span>
              {receiveModalPO.items.map((it) => (
                <div
                  key={it.id}
                  className="flex justify-between text-slate-600"
                >
                  <span>
                    {it.product?.name}{" "}
                    {it.product?.brand ? `[${it.product.brand}]` : ""}
                  </span>
                  <span className="font-mono font-semibold">
                    {it.quantityOrdered} {it.product?.unit}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReceiveModalPO(null)}
            >
              Cancel
            </Button>
            <FormSubmit
              form={receiveForm}
              loading={updatePO.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
            >
              Confirm &amp; Update Stock
            </FormSubmit>
          </div>
        </form>
      </Modal>

      {/* PO View Details Modal */}
      <Modal
        isOpen={!!selectedPO}
        onClose={() => setSelectedPO(null)}
        title={
          selectedPO ? `Purchase Order Details - ${selectedPO.poNumber}` : ""
        }
        maxWidth="2xl"
      >
        {selectedPO && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {selectedPO.poNumber}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Order Date:{" "}
                  {new Date(selectedPO.orderDate).toLocaleDateString("en-GB")}
                </p>
              </div>
              <div>{getStatusBadge(selectedPO.status)}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Vendor / Shop
                </span>
                <span className="font-bold text-slate-800 block">
                  {selectedPO.supplier?.name ||
                    selectedPO.shopName ||
                    "External Vendor"}
                </span>
                {selectedPO.shopName && (
                  <span className="text-slate-500 block">
                    Store: {selectedPO.shopName}
                  </span>
                )}
                <span className="text-slate-400 block">
                  TRN: {selectedPO.supplier?.trn || "N/A"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Vendor Reference &amp; Delivery
                </span>
                {selectedPO.vendorReference && (
                  <span className="font-mono font-bold text-emerald-800 block">
                    Ref: {selectedPO.vendorReference}
                  </span>
                )}
                <span className="font-medium text-slate-700 block">
                  Due:{" "}
                  {selectedPO.expectedDate
                    ? new Date(selectedPO.expectedDate).toLocaleDateString(
                        "en-GB",
                      )
                    : "Not specified"}
                </span>
              </div>
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Product / Item</TableHeaderCell>
                  <TableHeaderCell>Shop Reference</TableHeaderCell>
                  <TableHeaderCell align="center">Ordered</TableHeaderCell>
                  <TableHeaderCell align="center">Received</TableHeaderCell>
                  <TableHeaderCell align="right">Unit Cost</TableHeaderCell>
                  <TableHeaderCell align="right">Total</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedPO.items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">
                        {it.product?.name}
                      </div>
                      {it.product?.brand && (
                        <div className="text-[10px] text-slate-500">
                          Brand:{" "}
                          <span className="font-medium text-slate-700">
                            {it.product.brand}
                          </span>
                        </div>
                      )}
                      {it.itemNotes && (
                        <div className="text-[10px] text-slate-400 italic">
                          {it.itemNotes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-slate-600">
                        {it.supplierSku || it.product?.supplierSku || "-"}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <span className="font-mono font-bold">
                        {it.quantityOrdered}
                      </span>{" "}
                      <span className="text-[10px] text-slate-400">
                        {it.product?.unit}
                      </span>
                    </TableCell>
                    <TableCell align="center">
                      <span className="font-mono">{it.quantityReceived}</span>
                    </TableCell>
                    <TableCell align="right" className="font-mono">
                      {Number(it.unitCost).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" className="font-mono font-bold">
                      {Number(it.totalCost).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                {selectedPO.notes || ""}
              </span>
              <span className="text-sm font-black text-slate-900 font-mono">
                Total: AED {Number(selectedPO.totalAmount).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="md"
                onClick={() => setSelectedPO(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={<PrintIcon className="w-4 h-4" strokeWidth={2} />}
                onClick={() => {
                  setPrintModalPO(selectedPO);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
              >
                Print / Save PDF
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <PurchaseOrderPrintModal
        isOpen={!!printModalPO}
        onClose={() => setPrintModalPO(null)}
        po={printModalPO}
      />

      {/* Off-screen Print Container */}
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
