import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "./api-base";

export interface QuotationItemRecord {
  id?: string;
  quotationId?: string;
  productId?: string | null;
  product?: { id: string; name: string; sku: string; unit?: string } | null;
  section?: string;
  itemOrder?: number;
  description: string;
  quantity: number | string;
  unit?: string;
  unitRate: number | string;
  totalAmount?: number | string;
  isFree?: boolean;
}

export interface QuotationRecord {
  id: string;
  quotationNo: string;
  date: string;
  validUntil: string;
  customerId?: string | null;
  customerRel?: Customer | null;
  customer: string;
  attention?: string;
  address?: string;
  trn?: string;
  mobile?: string;
  project?: string;
  location?: string;
  reference?: string;
  preparedBy?: string;
  contact?: string;
  vatPct: number | string;
  discount: number | string;
  subtotal: number | string;
  vatAmount: number | string;
  totalAmount: number | string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  notes?: string | null;
  terms?: string | null;
  paymentTerms?: string | null;
  createdBy?: { id: string; fullName: string; email: string } | null;
  items: QuotationItemRecord[];
  createdAt: string;
  updatedAt: string;
}

export function useQuotations(params?: { search?: string; status?: string }) {
  const q = new URLSearchParams();
  if (params?.search) q.append("search", params.search);
  if (params?.status) q.append("status", params.status);
  const qStr = q.toString() ? `?${q.toString()}` : "";

  return useQuery<QuotationRecord[]>({
    queryKey: ["quotations", params],
    queryFn: () =>
      fetchJson<QuotationRecord[]>(`/api/finance/quotations${qStr}`),
  });
}

export function useQuotation(id?: string | null) {
  return useQuery<QuotationRecord>({
    queryKey: ["quotation", id],
    queryFn: () => fetchJson<QuotationRecord>(`/api/finance/quotations/${id}`),
    enabled: !!id,
  });
}

export function useSaveQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<QuotationRecord> & { items: any[] }) =>
      fetchJson<QuotationRecord>("/api/finance/quotations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
}

export function useDeleteQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ ok: boolean }>(`/api/finance/quotations/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
}

export function useConvertQuotationToSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<any>(`/api/finance/quotations/${id}/convert-order`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      qc.invalidateQueries({ queryKey: ["sales-orders"] });
    },
  });
}

export function useConvertQuotationToSalesInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<any>(`/api/finance/quotations/${id}/convert-invoice`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotations"] });
      qc.invalidateQueries({ queryKey: ["sales-invoices"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  companyName?: string | null;
  trn?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  creditLimit: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
  _count?: {
    quotations: number;
    salesOrders: number;
    salesInvoices: number;
    customerPayments: number;
  };
}

export function useCustomers(search?: string) {
  const qStr = search ? `?search=${encodeURIComponent(search)}` : "";
  return useQuery<Customer[]>({
    queryKey: ["customers", search],
    queryFn: () => fetchJson<Customer[]>(`/api/commercial/customers${qStr}`),
  });
}

export function useCustomerStatement(id?: string | null) {
  return useQuery<{
    customer: Customer;
    statement: any[];
    summary: {
      totalBilled: number;
      totalPaid: number;
      totalCredits: number;
      currentOutstanding: number;
    };
  }>({
    queryKey: ["customer-statement", id],
    queryFn: () => fetchJson<any>(`/api/commercial/customers/${id}/statement`),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Customer>) =>
      fetchJson<Customer>("/api/commercial/customers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      fetchJson<Customer>(`/api/commercial/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer-statement", variables.id] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean; message?: string }>(
        `/api/commercial/customers/${id}`,
        {
          method: "DELETE",
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  customerName: string;
  quotationId?: string | null;
  orderDate: string;
  deliveryDate?: string | null;
  projectScope?: string | null;
  status: "DRAFT" | "CONFIRMED" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  subtotal: number;
  discount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  notes?: string | null;
  terms?: string | null;
  items: any[];
  customerRel?: Customer;
  createdAt: string;
}

export function useSalesOrders(params?: { search?: string; status?: string }) {
  const q = new URLSearchParams();
  if (params?.search) q.append("search", params.search);
  if (params?.status) q.append("status", params.status);
  const qStr = q.toString() ? `?${q.toString()}` : "";

  return useQuery<SalesOrder[]>({
    queryKey: ["sales-orders", params],
    queryFn: () =>
      fetchJson<SalesOrder[]>(`/api/commercial/sales-orders${qStr}`),
  });
}

export function useCreateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<SalesOrder>("/api/commercial/sales-orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-orders"] });
      qc.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
}

export function useConvertSalesOrderToInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<any>(`/api/commercial/sales-orders/${id}/convert-invoice`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-orders"] });
      qc.invalidateQueries({ queryKey: ["sales-invoices"] });
    },
  });
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  customerId?: string | null;
  customerName: string;
  customerTrn?: string | null;
  quotationRef?: string | null;
  salesOrderId?: string | null;
  invoiceDate: string;
  dueDate?: string | null;
  projectScope?: string | null;
  status:
    "DRAFT" | "POSTED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
  subtotal: number;
  discount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  notes?: string | null;
  terms?: string | null;
  items: any[];
  customerRel?: Customer;
  journalEntryId?: string | null;
  createdAt: string;
}

export function useSalesInvoices(params?: {
  search?: string;
  status?: string;
}) {
  const q = new URLSearchParams();
  if (params?.search) q.append("search", params.search);
  if (params?.status) q.append("status", params.status);
  const qStr = q.toString() ? `?${q.toString()}` : "";

  return useQuery<SalesInvoice[]>({
    queryKey: ["sales-invoices", params],
    queryFn: () =>
      fetchJson<SalesInvoice[]>(`/api/commercial/sales-invoices${qStr}`),
  });
}

export function useCreateSalesInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<SalesInvoice>("/api/commercial/sales-invoices", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-invoices"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateSalesInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SalesInvoice> }) =>
      fetchJson<SalesInvoice>(`/api/commercial/sales-invoices/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-invoices"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function usePostSalesInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<any>(`/api/commercial/sales-invoices/${id}/post`, {
        method: "POST",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-invoices"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
      qc.invalidateQueries({ queryKey: ["profit-loss"] });
    },
  });
}

export function useDeleteSalesInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ success: boolean }>(`/api/commercial/sales-invoices/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-invoices"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
      qc.invalidateQueries({ queryKey: ["profit-loss"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export interface CustomerPayment {
  id: string;
  receiptNumber: string;
  customerId?: string | null;
  customerName: string;
  salesInvoiceId?: string | null;
  paymentDate: string;
  amount: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CHEQUE" | "CARD";
  referenceNumber?: string | null;
  notes?: string | null;
  salesInvoice?: SalesInvoice;
  customerRel?: Customer;
  createdAt: string;
}

export function useCustomerPayments(search?: string) {
  const qStr = search ? `?search=${encodeURIComponent(search)}` : "";
  return useQuery<CustomerPayment[]>({
    queryKey: ["customer-payments", search],
    queryFn: () =>
      fetchJson<CustomerPayment[]>(`/api/commercial/customer-payments${qStr}`),
  });
}

export function useCreateCustomerPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<CustomerPayment>("/api/commercial/customer-payments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customer-payments"] });
      qc.invalidateQueries({ queryKey: ["sales-invoices"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
    },
  });
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  customerId?: string | null;
  customerName: string;
  salesInvoiceId?: string | null;
  returnDate: string;
  reason?: string | null;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  status: "DRAFT" | "POSTED" | "CANCELLED";
  items: any[];
  salesInvoice?: SalesInvoice;
  customerRel?: Customer;
  createdAt: string;
}

export function useCreditNotes(search?: string) {
  const qStr = search ? `?search=${encodeURIComponent(search)}` : "";
  return useQuery<CreditNote[]>({
    queryKey: ["credit-notes", search],
    queryFn: () =>
      fetchJson<CreditNote[]>(`/api/commercial/credit-notes${qStr}`),
  });
}

export function useCreateCreditNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      fetchJson<CreditNote>("/api/commercial/credit-notes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credit-notes"] });
      qc.invalidateQueries({ queryKey: ["sales-invoices"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["journal-entries"] });
    },
  });
}
