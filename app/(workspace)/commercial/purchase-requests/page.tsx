"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePlus,
  Plus,
  Search,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { toast } from "@/lib/toast";
import {
  Modal,
  FormInput,
  FormSelect,
  FormSubmit,
} from "@/components/ui";
import ProcurementQuickNav from "@/components/ProcurementQuickNav";
import { useForm } from "@tanstack/react-form";
import {
  usePurchaseRequests,
  useCreatePurchaseRequest,
  useApprovePurchaseRequest,
  useConvertPurchaseRequestToPo,
  useSuppliers,
  useProducts,
  PurchaseRequest,
} from "@/lib/hooks/api-hooks";

const PAGE_SIZE = 15;

const STATUS_TABS = [
  { id: "ALL", label: "All Requests" },
  { id: "PENDING_APPROVAL", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "CONVERTED", label: "Converted" },
  { id: "REJECTED", label: "Rejected" },
];

export default function PurchaseRequestsPage() {
  const router = useRouter();
  const { data: requests = [], isLoading } = usePurchaseRequests();
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();

  const createRequestMutation = useCreatePurchaseRequest();
  const approveRequestMutation = useApprovePurchaseRequest();
  const convertPoMutation = useConvertPurchaseRequestToPo();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<PurchaseRequest | null>(null);
  const [convertModalReq, setConvertModalReq] =
    useState<PurchaseRequest | null>(null);
  const [createFormError, setCreateFormError] = useState("");
  const [convertFormError, setConvertFormError] = useState("");

  const createForm = useForm({
    defaultValues: {
      requestNumber: "",
      requesterName: "",
      department: "Operations / Site",
      requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      reason: "",
      items: [
        {
          productId: "",
          description: "Material requisition item",
          quantity: 1,
          unit: "PCS",
          estimatedCost: 0,
        },
      ],
    },
    onSubmit: async ({ value }) => {
      setCreateFormError("");
      try {
        await createRequestMutation.mutateAsync({
          requestNumber: value.requestNumber.trim() || undefined,
          requesterName: value.requesterName.trim(),
          department: value.department,
          requiredDate: value.requiredDate,
          reason: value.reason.trim(),
          items: value.items,
        });
        setIsCreateOpen(false);
        createForm.reset();
      } catch (err: any) {
        setCreateFormError(err.message || "Failed to create purchase request");
      }
    },
  });

  const convertPoForm = useForm({
    defaultValues: {
      supplierId: "",
    },
    onSubmit: async ({ value }) => {
      if (!convertModalReq) return;
      setConvertFormError("");
      try {
        await convertPoMutation.mutateAsync({
          id: convertModalReq.id,
          supplierId: value.supplierId || undefined,
        });
        setConvertModalReq(null);
        convertPoForm.reset();
      } catch (err: any) {
        setConvertFormError(err.message || "Failed to convert request to PO");
      }
    },
  });

  const handleOpenCreate = () => {
    setCreateFormError("");
    createForm.reset();
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    createForm.reset();
  };

  const handleOpenConvert = (r: PurchaseRequest) => {
    setConvertFormError("");
    setConvertModalReq(r);
    convertPoForm.reset();
  };

  const handleCloseConvert = () => {
    setConvertModalReq(null);
    convertPoForm.reset();
  };

  const handleApprove = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      await approveRequestMutation.mutateAsync({ id, action });
      toast.success(
        action === "APPROVE"
          ? "Purchase request approved"
          : "Purchase request rejected",
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update purchase request status");
    }
  };

  const addItem = () => {
    const current = createForm.getFieldValue("items");
    createForm.setFieldValue("items", [
      ...current,
      {
        productId: "",
        description: "Material requisition item",
        quantity: 1,
        unit: "PCS",
        estimatedCost: 0,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    const current = createForm.getFieldValue("items");
    if (current.length === 1) return;
    createForm.setFieldValue(
      "items",
      current.filter((_, i) => i !== idx),
    );
  };

  const updateItem = (idx: number, field: string, val: any) => {
    const current = [...createForm.getFieldValue("items")];
    current[idx] = {
      ...current[idx],
      [field]: field === "quantity" ? Number(val) : val,
    };
    createForm.setFieldValue("items", current);
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.requesterName.toLowerCase().includes(search.toLowerCase()) ||
      (r.department &&
        r.department.toLowerCase().includes(search.toLowerCase())) ||
      (r.reason && r.reason.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING_APPROVAL").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const convertedCount = requests.filter((r) => r.status === "CONVERTED").length;

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="w-full min-h-full bg-white text-slate-700 font-sans px-4 sm:px-5 py-3.5 space-y-3.5 select-none pb-16">
      {/* 1. Executive Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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
              borderColor: "#bfdbfe",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
            }}
          >
            <FilePlus className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-[17px] font-semibold text-slate-800 tracking-tight">
              Purchase Requests (Requisitions)
            </h1>
            <span
              className="px-2 py-0.5 rounded-full text-[10.5px] font-normal"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "1px solid #cbd5e1",
              }}
            >
              {requests.length} records
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-3.5 py-1.5 text-[11.5px] font-medium rounded-lg text-white hover:opacity-95 flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto shadow-2xs"
          style={{
            backgroundColor: "#1d4ed8",
            color: "#ffffff",
            border: "1px solid #1e40af",
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Purchase Request</span>
        </button>
      </div>

      {/* Procurement Cycle Horizontal Quick Navigation */}
      <ProcurementQuickNav />

      {/* 2. Four Compact Pastel KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            TOTAL REQUISITIONS
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-slate-800 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            {requests.length} Requests
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block truncate">
            All submitted requisitions
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#fefce8", border: "1px solid #fde047" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            PENDING APPROVAL
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-amber-700 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            {pendingCount} Pending
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block truncate">
            Awaiting manager sign-off
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            APPROVED REQUISITIONS
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-emerald-700 leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            {approvedCount} Approved
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block truncate">
            Ready to convert to PO
          </span>
        </div>

        <div
          className="rounded-xl px-3.5 py-2.5"
          style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            CONVERTED TO PO
          </span>
          <span className="text-sm sm:text-[15px] font-semibold text-[#1d4ed8] leading-snug block mt-0.5 font-mono tabular-nums whitespace-nowrap">
            {convertedCount} Orders
          </span>
          <span className="text-[10.5px] font-normal text-slate-500 block truncate">
            Procurement cycle step 1 complete
          </span>
        </div>
      </div>

      {/* 3. Soft Filter Bar with Status Tabs */}
      <div
        className="rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                style={
                  isActive
                    ? {
                        backgroundColor: "#1d4ed8",
                        color: "#ffffff",
                        borderColor: "#1d4ed8",
                      }
                    : {
                        backgroundColor: "#ffffff",
                        color: "#475569",
                        borderColor: "#cbd5e1",
                      }
                }
                className="px-2.5 py-1 text-xs font-normal rounded-lg border transition-all cursor-pointer"
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search request #, requester, reason..."
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
            }}
            className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs font-normal text-slate-700 placeholder-slate-400 outline-none focus:border-blue-600 transition-colors"
          />
        </div>
      </div>

      {/* 4. Table Card with Responsive Pagination */}
      <div
        className="rounded-xl overflow-hidden bg-white"
        style={{ border: "1px solid #cbd5e1" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr
                className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 select-none"
                style={{
                  backgroundColor: "#f4f7fb",
                  borderBottom: "1px solid #cbd5e1",
                }}
              >
                <th className="py-2.5 px-4 font-medium text-slate-600">Request No</th>
                <th className="py-2.5 px-4 font-medium text-slate-600">Requester / Dept</th>
                <th className="py-2.5 px-4 font-medium text-slate-600">Reason / Purpose</th>
                <th className="py-2.5 px-3 font-medium text-slate-600">Request Date</th>
                <th className="py-2.5 px-3 font-medium text-slate-600">Required By</th>
                <th className="py-2.5 px-3 font-medium text-slate-600 text-center">Status</th>
                <th className="py-2.5 px-3 font-medium text-slate-600 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Loading purchase requests...
                  </td>
                </tr>
              ) : paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No purchase requests found.
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedReq(r)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-4 font-mono text-slate-800 whitespace-nowrap">
                      <span
                        className="font-mono text-[11px] font-medium px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        {r.requestNumber}
                      </span>
                    </td>

                    <td className="py-2.5 px-4">
                      <div className="font-medium text-slate-800">{r.requesterName}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {r.department}
                      </div>
                    </td>

                    <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">
                      {r.reason}
                    </td>

                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {r.requestDate
                        ? new Date(r.requestDate).toISOString().slice(0, 10)
                        : "—"}
                    </td>

                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {r.requiredDate
                        ? new Date(r.requiredDate).toISOString().slice(0, 10)
                        : "—"}
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={
                          r.status === "APPROVED"
                            ? { backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #86efac" }
                            : r.status === "CONVERTED"
                            ? { backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }
                            : r.status === "PENDING_APPROVAL"
                            ? { backgroundColor: "#fefce8", color: "#a16207", border: "1px solid #fde047" }
                            : { backgroundColor: "#fff1f2", color: "#be123c", border: "1px solid #fda4af" }
                        }
                      >
                        {r.status}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right pr-4 whitespace-nowrap">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedReq(r)}
                          className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-[#1d4ed8] hover:bg-[#eff6ff] border border-transparent hover:border-[#bfdbfe] transition-all cursor-pointer"
                          title="View Requisition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {r.status === "PENDING_APPROVAL" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(r.id, "APPROVE")}
                              className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all cursor-pointer"
                              title="Approve"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprove(r.id, "REJECT")}
                              className="h-7 w-7 rounded-lg inline-flex items-center justify-center text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                              title="Reject"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {r.status === "APPROVED" && (
                          <button
                            type="button"
                            onClick={() => handleOpenConvert(r)}
                            className="px-2.5 py-1 text-[11px] font-medium rounded-lg text-white hover:bg-[#1e40af] flex items-center gap-1 transition-colors cursor-pointer"
                            style={{ backgroundColor: "#1d4ed8" }}
                            title="Convert to Purchase Order"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Convert to PO</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredRequests.length > 0 && (
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t select-none"
            style={{ borderColor: "#cbd5e1" }}
          >
            <div className="text-xs text-slate-500 font-normal">
              Showing{" "}
              <span className="font-medium text-slate-800">{startIndex + 1}</span> to{" "}
              <span className="font-medium text-slate-800">
                {Math.min(startIndex + PAGE_SIZE, filteredRequests.length)}
              </span>{" "}
              of <span className="font-medium text-slate-800">{filteredRequests.length}</span> requisitions
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[#cbd5e1] hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const isActive = p === currentPage;
                if (
                  p === 1 ||
                  p === totalPages ||
                  (p >= currentPage - 1 && p <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      style={
                        isActive
                          ? {
                              backgroundColor: "#1d4ed8",
                              color: "#ffffff",
                              borderColor: "#1d4ed8",
                            }
                          : { borderColor: "#cbd5e1" }
                      }
                      className={`min-w-8 h-8 px-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        isActive
                          ? ""
                          : "text-slate-700 hover:bg-slate-50 bg-white"
                      }`}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === currentPage - 2 || p === currentPage + 2) {
                  return (
                    <span key={p} className="px-1 text-slate-400 text-xs">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[#cbd5e1] hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Requisition Modal */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={handleCloseCreate}
          title="New Purchase Requisition / Request"
          maxWidth="2xl"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              createForm.handleSubmit();
            }}
            className="space-y-4 text-xs font-normal"
          >
            {createFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {createFormError}
              </div>
            )}

            {/* Section 1: Requester & Timeline */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                Requisition Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <createForm.Field
                  name="requesterName"
                  validators={{
                    onChange: ({ value }) =>
                      !value.trim() ? "Requester name is required" : undefined,
                  }}
                >
                  {(field) => (
                    <FormInput
                      field={field}
                      label="Requester Name *"
                      placeholder="e.g. Site Engineer / PM"
                      required
                    />
                  )}
                </createForm.Field>

                <createForm.Field name="department">
                  {(field) => (
                    <FormSelect
                      field={field}
                      label="Department *"
                    >
                      <option value="Operations / Site">Operations / Site</option>
                      <option value="Fitout Technical">Fitout Technical</option>
                      <option value="Joinery / Workshop">
                        Joinery / Workshop
                      </option>
                      <option value="Administration">Administration</option>
                    </FormSelect>
                  )}
                </createForm.Field>

                <createForm.Field name="requiredDate">
                  {(field) => (
                    <FormInput
                      field={field}
                      label="Required By Date *"
                      type="date"
                      required
                    />
                  )}
                </createForm.Field>
              </div>

              <createForm.Field
                name="reason"
                validators={{
                  onChange: ({ value }) =>
                    !value.trim() ? "Reason / purpose is required" : undefined,
                }}
              >
                {(field) => (
                  <FormInput
                    field={field}
                    label="Reason / Purpose of Requisition *"
                    placeholder="e.g. Materials needed for Penthouse Flooring installation"
                    required
                  />
                )}
              </createForm.Field>
            </div>

            {/* Section 2: Required Materials Table */}
            <createForm.Field name="items">
              {(itemsField) => (
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800">
                        Required Materials &amp; Line Items
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        {itemsField.state.value.length} {itemsField.state.value.length === 1 ? "Item" : "Items"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={addItem}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      style={{
                        backgroundColor: "#eff6ff",
                        color: "#1d4ed8",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Line Item</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                    {itemsField.state.value.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center bg-slate-50/70 p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                      >
                        <div className="col-span-12 sm:col-span-7">
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5 sm:hidden">
                            Material Specification
                          </label>
                          <input
                            type="text"
                            placeholder="Material specification or item description..."
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#cbd5e1] bg-white text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all placeholder:text-slate-400"
                            value={item.description}
                            onChange={(e) =>
                              updateItem(idx, "description", e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="col-span-6 sm:col-span-2">
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5 sm:hidden">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#cbd5e1] bg-white text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono text-center transition-all"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(idx, "quantity", e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="col-span-4 sm:col-span-2">
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5 sm:hidden">
                            Unit
                          </label>
                          <input
                            type="text"
                            placeholder="Unit (PCS)"
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#cbd5e1] bg-white text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-center uppercase transition-all"
                            value={item.unit}
                            onChange={(e) =>
                              updateItem(idx, "unit", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            disabled={itemsField.state.value.length === 1}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                            title="Remove line item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </createForm.Field>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCloseCreate}
                className="px-3.5 py-1.5 text-xs font-medium border border-[#cbd5e1] rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createRequestMutation.isPending}
                className="px-4 py-1.5 text-xs font-medium rounded-lg text-white hover:opacity-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                style={{
                  backgroundColor: "#1d4ed8",
                  color: "#ffffff",
                  border: "1px solid #1e40af",
                }}
              >
                {createRequestMutation.isPending ? "Submitting..." : "Submit Purchase Requisition"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Convert to PO Modal */}
      {convertModalReq && (
        <Modal
          isOpen={!!convertModalReq}
          onClose={handleCloseConvert}
          title={`Convert Requisition to PO: ${convertModalReq.requestNumber}`}
          maxWidth="lg"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              convertPoForm.handleSubmit();
            }}
            className="space-y-4 text-xs font-normal"
          >
            {convertFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {convertFormError}
              </div>
            )}

            <div
              className="p-3 rounded-xl border space-y-1"
              style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }}
            >
              <p className="font-semibold text-slate-800">
                Requisition: {convertModalReq.requestNumber} -{" "}
                {convertModalReq.reason}
              </p>
              <p className="text-slate-600">
                Items: {convertModalReq.items?.length || 0} line items will be
                converted to a formal Purchase Order.
              </p>
            </div>

            <convertPoForm.Field
              name="supplierId"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Please select a supplier" : undefined,
              }}
            >
              {(field) => (
                <FormSelect
                  field={field}
                  label="Select Vendor / Supplier *"
                  required
                >
                  <option value="">Select approved supplier...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactPerson || s.phone || "UAE"})
                    </option>
                  ))}
                </FormSelect>
              )}
            </convertPoForm.Field>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseConvert}
                className="px-3.5 py-1.5 text-xs font-medium border border-[#cbd5e1] rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={convertPoMutation.isPending}
                className="px-4 py-1.5 text-xs font-medium rounded-lg text-white hover:opacity-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                style={{
                  backgroundColor: "#1d4ed8",
                  color: "#ffffff",
                  border: "1px solid #1e40af",
                }}
              >
                {convertPoMutation.isPending ? "Converting..." : "Generate Purchase Order"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Selected Requisition Modal */}
      {selectedReq && (
        <Modal
          isOpen={!!selectedReq}
          onClose={() => setSelectedReq(null)}
          title={`Requisition Details: ${selectedReq.requestNumber}`}
        >
          <div className="space-y-4 text-xs font-normal">
            <div
              className="p-3.5 rounded-xl border space-y-1.5"
              style={{ backgroundColor: "#f4f7fb", borderColor: "#cbd5e1" }}
            >
              <p className="font-semibold text-slate-800">
                {selectedReq.requesterName} ({selectedReq.department})
              </p>
              <p className="text-slate-600">{selectedReq.reason}</p>
            </div>

            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid #cbd5e1" }}
            >
              <table className="w-full text-xs text-left">
                <thead>
                  <tr
                    className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500"
                    style={{ backgroundColor: "#f4f7fb", borderBottom: "1px solid #cbd5e1" }}
                  >
                    <th className="py-2 px-3 font-medium text-slate-600">Description</th>
                    <th className="py-2 px-3 font-medium text-slate-600 text-right">Qty</th>
                    <th className="py-2 px-3 font-medium text-slate-600">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedReq.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-800">
                        {item.description}
                      </td>
                      <td className="py-2 px-3 font-mono text-right text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="px-3 py-1.5 text-xs font-medium border border-[#cbd5e1] rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
