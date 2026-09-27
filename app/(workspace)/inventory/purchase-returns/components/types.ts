export type ReturnStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "POSTED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export interface PurchaseReturnItem {
  id: string;
  returnNumber: string;
  poReference: string;
  supplierId?: string | null;
  supplierName: string;
  supplierTrn?: string;
  projectId?: string | null;
  projectCode?: string;
  projectName?: string;
  clientName?: string;
  returnDate: string;
  reason: string;
  itemsCount: number;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  status: ReturnStatus;
  items?: any[];
  supplier?: any;
  supplierBill?: any;
  purchaseOrder?: any;
}

export interface ReturnFormState {
  purchaseOrderId?: string;
  supplierBillId?: string;
  poReference: string;
  selectedSupplier: string;
  selectedProject: string;
  returnReason: string;
  returnAmount: string;
  returnDate: string;
}

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  POSTED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  APPROVED: "bg-sky-50 text-sky-800 border-sky-200",
  SUBMITTED: "bg-amber-50 text-amber-800 border-amber-200",
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELLED: "bg-rose-50 text-rose-800 border-rose-200",
  REJECTED: "bg-rose-50 text-rose-800 border-rose-200",
};

export const EMPTY_FORM: ReturnFormState = {
  purchaseOrderId: "",
  supplierBillId: "",
  poReference: "",
  selectedSupplier: "",
  selectedProject: "",
  returnReason: "",
  returnAmount: "",
  returnDate: new Date().toISOString().slice(0, 10),
};

export function generateReturnNumber(count: number): string {
  return `DN-2026-${String(count + 1).padStart(4, "0")}`;
}

export function formatNumber(amount: number | string | undefined): string {
  const num = Number(amount || 0);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatAed(amount: number | string | undefined): string {
  return `AED ${formatNumber(amount)}`;
}
