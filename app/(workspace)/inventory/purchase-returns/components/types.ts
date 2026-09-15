export type ReturnStatus =
  "DRAFT" | "SUBMITTED" | "APPROVED" | "COMPLETED" | "REJECTED";

export interface PurchaseReturnItem {
  id: string;
  returnNumber: string;
  poReference: string;
  supplierName: string;
  supplierTrn: string;
  returnDate: string;
  reason: string;
  itemsCount: number;
  totalAmount: number;
  status: ReturnStatus;
}

export interface ReturnFormState {
  poReference: string;
  selectedSupplier: string;
  returnReason: string;
  returnAmount: string;
}

export const STATUS_BADGE_CLASSES: Record<ReturnStatus, string> = {
  COMPLETED: "bg-emerald-50 text-emerald-800 border-emerald-200",
  APPROVED: "bg-sky-50 text-sky-800 border-sky-200",
  SUBMITTED: "bg-amber-50 text-amber-800 border-amber-200",
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  REJECTED: "bg-rose-50 text-rose-800 border-rose-200",
};

export const INITIAL_PURCHASE_RETURNS: PurchaseReturnItem[] = [
  {
    id: "pr-1",
    returnNumber: "PR-2026-001",
    poReference: "PO-2026-001",
    supplierName: "Al Futtaim Hardware LLC",
    supplierTrn: "100234567800003",
    returnDate: "2026-09-13",
    reason: "Damaged aluminum extrusion profile batch #B44",
    itemsCount: 1,
    totalAmount: 3450.0,
    status: "SUBMITTED",
  },
];

export const EMPTY_FORM: ReturnFormState = {
  poReference: "",
  selectedSupplier: "",
  returnReason: "",
  returnAmount: "",
};

export function generateReturnNumber(count: number): string {
  return `PR-2026-${String(count + 1).padStart(3, "0")}`;
}

export function formatNumber(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatAed(amount: number): string {
  return `AED ${formatNumber(amount)}`;
}
