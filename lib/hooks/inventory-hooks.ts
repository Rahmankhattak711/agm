import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "./api-base";
import type {
  ProductCategory,
  Supplier,
  Warehouse,
  Product,
  StockMovement,
  StockMovementType,
  PurchaseOrder,
  PurchaseOrderStatus,
} from "./types";

export function useProductCategories() {
  return useQuery<ProductCategory[]>({
    queryKey: ["product-categories"],
    queryFn: () => fetchJson<ProductCategory[]>("/api/inventory/categories"),
  });
}

export function useCreateProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      parentId?: string | null;
      inventoryAccountId?: string | null;
      cogsAccountId?: string | null;
    }) =>
      fetchJson<ProductCategory>("/api/inventory/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-categories"] });
    },
  });
}

export function useUpdateProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: string;
      name?: string;
      parentId?: string | null;
      inventoryAccountId?: string | null;
      cogsAccountId?: string | null;
    }) =>
      fetchJson<ProductCategory>("/api/inventory/categories", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-categories"] });
    },
  });
}

export function useDeleteProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(`/api/inventory/categories?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-categories"] });
    },
  });
}

export function useSuppliers() {
  return useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: () => fetchJson<Supplier[]>("/api/inventory/suppliers"),
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      supplierCode: string;
      name: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      address?: string;
      trn?: string;
    }) =>
      fetchJson<Supplier>("/api/inventory/suppliers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: any }) =>
      fetchJson<Supplier>("/api/inventory/suppliers", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(`/api/inventory/suppliers?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useWarehouses() {
  return useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: () => fetchJson<Warehouse[]>("/api/inventory/warehouses"),
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string; name: string; location?: string }) =>
      fetchJson<Warehouse>("/api/inventory/warehouses", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useUpdateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: any }) =>
      fetchJson<Warehouse>("/api/inventory/warehouses", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(`/api/inventory/warehouses?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useProducts(filters?: {
  categoryId?: string;
  supplierId?: string;
  type?: string;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.categoryId) params.append("categoryId", filters.categoryId);
  if (filters?.supplierId) params.append("supplierId", filters.supplierId);
  if (filters?.type) params.append("type", filters.type);
  if (filters?.search) params.append("search", filters.search);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<Product[]>({
    queryKey: ["products", filters],
    queryFn: () => fetchJson<Product[]>(`/api/inventory/products${queryStr}`),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<Product>("/api/inventory/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; [key: string]: any }) =>
      fetchJson<Product>("/api/inventory/products", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(`/api/inventory/products?id=${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useStockMovements(filters?: {
  productId?: string;
  warehouseId?: string;
  movementType?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.productId) params.append("productId", filters.productId);
  if (filters?.warehouseId) params.append("warehouseId", filters.warehouseId);
  if (filters?.movementType)
    params.append("movementType", filters.movementType);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<StockMovement[]>({
    queryKey: ["stock-movements", filters],
    queryFn: () =>
      fetchJson<StockMovement[]>(`/api/inventory/stock-movements${queryStr}`),
  });
}

export function useCreateStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      productId: string;
      warehouseId: string;
      movementType: StockMovementType;
      quantity: number;
      unitCost?: number;
      referenceNumber?: string;
      notes?: string;
      movementDate?: string;
    }) =>
      fetchJson<StockMovement>("/api/inventory/stock-movements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function usePurchaseOrders(filters?: {
  status?: string;
  supplierId?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.supplierId) params.append("supplierId", filters.supplierId);
  const queryStr = params.toString() ? `?${params.toString()}` : "";

  return useQuery<PurchaseOrder[]>({
    queryKey: ["purchase-orders", filters],
    queryFn: () =>
      fetchJson<PurchaseOrder[]>(`/api/inventory/purchase-orders${queryStr}`),
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      poNumber: string;
      supplierId: string;
      shopName?: string;
      vendorReference?: string;
      orderDate: string;
      expectedDate?: string;
      status?: PurchaseOrderStatus;
      notes?: string;
      items: Array<{
        productId: string;
        supplierSku?: string;
        itemNotes?: string;
        quantityOrdered: number;
        unitCost: number;
        totalCost?: number;
      }>;
    }) =>
      fetchJson<PurchaseOrder>("/api/inventory/purchase-orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      id: string;
      status?: PurchaseOrderStatus;
      expectedDate?: string;
      notes?: string;
      warehouseIdToReceive?: string;
    }) =>
      fetchJson<PurchaseOrder>("/api/inventory/purchase-orders", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["warehouses"] });
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });
}

export function useDeletePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(
        `/api/inventory/purchase-orders?id=${id}`,
        {
          method: "DELETE",
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  requesterName: string;
  department?: string | null;
  requestDate: string;
  requiredDate?: string | null;
  reason?: string | null;
  notes?: string | null;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "CONVERTED";
  items: any[];
  createdAt: string;
}

export function usePurchaseRequests(params?: {
  search?: string;
  status?: string;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.append("search", params.search);
  if (params?.status) q.append("status", params.status);
  const qStr = q.toString() ? `?${q.toString()}` : "";

  return useQuery<PurchaseRequest[]>({
    queryKey: ["purchase-requests", params],
    queryFn: () =>
      fetchJson<PurchaseRequest[]>(`/api/commercial/purchase-requests${qStr}`),
  });
}

export function useCreatePurchaseRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<PurchaseRequest>("/api/commercial/purchase-requests", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-requests"] });
    },
  });
}

export function useApprovePurchaseRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "APPROVE" | "REJECT";
    }) =>
      fetchJson<any>(`/api/commercial/purchase-requests/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-requests"] });
    },
  });
}

export function useConvertPurchaseRequestToPo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, supplierId }: { id: string; supplierId?: string }) =>
      fetchJson<any>(`/api/commercial/purchase-requests/${id}/convert-po`, {
        method: "POST",
        body: JSON.stringify({ supplierId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-requests"] });
      qc.invalidateQueries({ queryKey: ["purchaseOrders"] });
    },
  });
}

export interface GoodsReceipt {
  id: string;
  grnNumber: string;
  purchaseOrderId?: string | null;
  supplierId?: string | null;
  warehouseId?: string | null;
  receiptDate: string;
  deliveryNoteNumber?: string | null;
  status: "DRAFT" | "COMPLETED" | "CANCELLED";
  notes?: string | null;
  items: any[];
  supplier?: any;
  warehouse?: any;
  purchaseOrder?: any;
  createdAt: string;
}

export function useGoodsReceipts(search?: string) {
  const qStr = search ? `?search=${encodeURIComponent(search)}` : "";
  return useQuery<GoodsReceipt[]>({
    queryKey: ["goods-receipts", search],
    queryFn: () =>
      fetchJson<GoodsReceipt[]>(`/api/commercial/goods-received${qStr}`),
  });
}

export function useCreateGoodsReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<GoodsReceipt>("/api/commercial/goods-received", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goods-receipts"] });
      qc.invalidateQueries({ queryKey: ["purchaseOrders"] });
      qc.invalidateQueries({ queryKey: ["stockLevels"] });
    },
  });
}

export interface SupplierBill {
  id: string;
  billNumber: string;
  supplierId?: string | null;
  supplierName: string;
  supplierTrn?: string | null;
  purchaseOrderId?: string | null;
  goodsReceiptId?: string | null;
  billDate: string;
  dueDate?: string | null;
  status: "DRAFT" | "POSTED" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
  subtotal: number;
  discount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  items: any[];
  supplier?: any;
  createdAt: string;
}

export function useSupplierBills(params?: {
  search?: string;
  status?: string;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.append("search", params.search);
  if (params?.status) q.append("status", params.status);
  const qStr = q.toString() ? `?${q.toString()}` : "";

  return useQuery<SupplierBill[]>({
    queryKey: ["supplier-bills", params],
    queryFn: () =>
      fetchJson<SupplierBill[]>(`/api/commercial/supplier-bills${qStr}`),
  });
}

export function useCreateSupplierBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<SupplierBill>("/api/commercial/supplier-bills", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-bills"] });
    },
  });
}

export function usePostSupplierBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<any>(`/api/commercial/supplier-bills/${id}/post`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-bills"] });
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
    },
  });
}

export interface SupplierPayment {
  id: string;
  paymentNumber: string;
  supplierId?: string | null;
  supplierName: string;
  supplierBillId?: string | null;
  paymentDate: string;
  amount: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CHEQUE";
  referenceNumber?: string | null;
  notes?: string | null;
  supplierBill?: SupplierBill;
  supplier?: any;
  createdAt: string;
}

export function useSupplierPayments(search?: string) {
  const qStr = search ? `?search=${encodeURIComponent(search)}` : "";
  return useQuery<SupplierPayment[]>({
    queryKey: ["supplier-payments", search],
    queryFn: () =>
      fetchJson<SupplierPayment[]>(`/api/commercial/supplier-payments${qStr}`),
  });
}

export function useCreateSupplierPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<SupplierPayment>("/api/commercial/supplier-payments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-payments"] });
      qc.invalidateQueries({ queryKey: ["supplier-bills"] });
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
    },
  });
}

export interface DebitNote {
  id: string;
  debitNoteNumber: string;
  supplierId?: string | null;
  supplierName: string;
  supplierBillId?: string | null;
  purchaseOrderId?: string | null;
  returnDate: string;
  reason?: string | null;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  status: "DRAFT" | "POSTED" | "CANCELLED";
  items: any[];
  supplier?: any;
  supplierBill?: SupplierBill;
  createdAt: string;
}

export function useDebitNotes(search?: string) {
  const qStr = search ? `?search=${encodeURIComponent(search)}` : "";
  return useQuery<DebitNote[]>({
    queryKey: ["debit-notes", search],
    queryFn: () => fetchJson<DebitNote[]>(`/api/commercial/debit-notes${qStr}`),
  });
}

export function useCreateDebitNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<DebitNote>("/api/commercial/debit-notes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debit-notes"] });
      qc.invalidateQueries({ queryKey: ["supplier-bills"] });
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
    },
  });
}
