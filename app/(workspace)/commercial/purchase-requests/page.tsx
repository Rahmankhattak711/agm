"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
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
  Button,
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
  FormSubmit,
  Badge,
} from "@/components/ui";
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

export default function PurchaseRequestsPage() {
  const { data: requests = [], isLoading } = usePurchaseRequests();
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();

  const createRequestMutation = useCreatePurchaseRequest();
  const approveRequestMutation = useApprovePurchaseRequest();
  const convertPoMutation = useConvertPurchaseRequestToPo();

  const [search, setSearch] = useState("");
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

  const handleOpenConvert = (req: PurchaseRequest) => {
    setConvertFormError("");
    convertPoForm.reset({ supplierId: "" });
    setConvertModalReq(req);
  };

  const handleCloseConvert = () => {
    setConvertModalReq(null);
    convertPoForm.reset();
  };

  const addItem = () => {
    const current = createForm.getFieldValue("items");
    createForm.setFieldValue("items", [
      ...current,
      {
        productId: "",
        description: "",
        quantity: 1,
        unit: "PCS",
        estimatedCost: 0,
      },
    ]);
  };

  const removeItem = (idx: number) => {
    const current = createForm.getFieldValue("items");
    if (current.length <= 1) return;
    createForm.setFieldValue(
      "items",
      current.filter((_, i) => i !== idx),
    );
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const current = [...createForm.getFieldValue("items")];
    (current[idx] as any)[field] = value;
    createForm.setFieldValue("items", current);
  };

  const handleApprove = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      await approveRequestMutation.mutateAsync({ id, action });
      toast.success(
        action === "APPROVE"
          ? "Purchase request approved successfully!"
          : "Purchase request rejected",
      );
    } catch (err: any) {
      toast.error(`Error updating request: ${err.message}`);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Purchase Requests
            </h2>
            <Badge tone="purple" size="md">
              Procurement Cycle — Step 1
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Manage site material requisitions, track approvals, and convert
            requisitions to purchase orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="dark"
            size="sm"
            onClick={handleOpenCreate}
            icon={<Plus size={14} />}
            className="text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
          >
            Create Purchase Request
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
            Total Requisitions
          </p>
          <p className="text-xl font-black text-purple-950 font-mono">
            {requests.length} Requests
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
            Pending Approval
          </p>
          <p className="text-xl font-black text-amber-950 font-mono">
            {requests.filter((r) => r.status === "PENDING_APPROVAL").length}{" "}
            Pending
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Approved / Converted to PO
          </p>
          <p className="text-xl font-black text-emerald-950 font-mono">
            {
              requests.filter(
                (r) => r.status === "APPROVED" || r.status === "CONVERTED",
              ).length
            }{" "}
            Approved
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-50/80 rounded-2xl border border-slate-200/70">
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search request number, requester, department, reason..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-purple-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {["ALL", "PENDING_APPROVAL", "APPROVED", "CONVERTED", "REJECTED"].map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {st}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs bg-white">
        <Table className="w-full text-xs text-left">
          <TableHead className="bg-slate-50/95 border-b border-slate-200">
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Request No
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Requester / Dept
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Reason / Project
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Date
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Required By
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[11px]">
              Status
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[11px]">
              Actions
            </TableHeaderCell>
          </TableHead>

          <TableBody className="divide-y divide-slate-100">
            {isLoading ? (
              <TableLoading colSpan={7} rows={5} />
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-slate-400 italic"
                >
                  No purchase requests found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((r) => (
                <TableRow
                  key={r.id}
                  className="hover:bg-slate-50/60 text-slate-700 transition"
                >
                  <TableCell className="py-3 px-4 font-mono font-bold text-purple-950">
                    {r.requestNumber}
                  </TableCell>
                  <TableCell className="py-3 px-4 font-bold text-slate-900">
                    <div>{r.requesterName}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {r.department}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    {r.reason}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-slate-600">
                    {r.requestDate
                      ? new Date(r.requestDate).toISOString().slice(0, 10)
                      : "—"}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-slate-600">
                    {r.requiredDate
                      ? new Date(r.requiredDate).toISOString().slice(0, 10)
                      : "—"}
                  </TableCell>
                  <TableCell className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.status === "CONVERTED"
                            ? "bg-blue-100 text-blue-800"
                            : r.status === "PENDING_APPROVAL"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {r.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedReq(r)}
                        className="p-1 text-slate-400 hover:text-purple-700 rounded-md hover:bg-purple-50"
                        title="View Requisition"
                      >
                        <Eye size={13} />
                      </button>
                      {r.status === "PENDING_APPROVAL" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(r.id, "APPROVE")}
                            className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-md"
                            title="Approve"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(r.id, "REJECT")}
                            className="p-1 text-rose-700 hover:bg-rose-100 rounded-md"
                            title="Reject"
                          >
                            <X size={13} />
                          </button>
                        </>
                      )}
                      {r.status === "APPROVED" && (
                        <Button
                          variant="dark"
                          size="sm"
                          onClick={() => handleOpenConvert(r)}
                          icon={<Truck size={12} />}
                          className="text-[10px] font-bold bg-indigo-700 text-white hover:bg-indigo-800"
                        >
                          Convert to PO
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={handleCloseCreate}
          title="New Purchase Requisition / Request"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              createForm.handleSubmit();
            }}
            className="space-y-4 text-xs"
          >
            {createFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {createFormError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    placeholder="e.g. Site Engineer / Project Manager"
                    className="font-bold"
                    required
                  />
                )}
              </createForm.Field>

              <createForm.Field name="department">
                {(field) => (
                  <FormSelect
                    field={field}
                    label="Department"
                    className="font-semibold"
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

            <createForm.Field name="items">
              {(itemsField) => (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Required Materials
                    </span>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} /> Add Line
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {itemsField.state.value.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200/60"
                      >
                        <div className="col-span-7">
                          <input
                            type="text"
                            placeholder="Material specification..."
                            className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-purple-500"
                            value={item.description}
                            onChange={(e) =>
                              updateItem(idx, "description", e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-purple-500 font-mono"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(idx, "quantity", e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Unit (PCS)"
                            className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 outline-none focus:border-purple-500"
                            value={item.unit}
                            onChange={(e) =>
                              updateItem(idx, "unit", e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </createForm.Field>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleCloseCreate}
              >
                Cancel
              </Button>
              <FormSubmit
                form={createForm}
                size="sm"
                className="bg-purple-700 text-white hover:bg-purple-800 font-bold"
              >
                Submit Purchase Requisition
              </FormSubmit>
            </div>
          </form>
        </Modal>
      )}

      {convertModalReq && (
        <Modal
          isOpen={!!convertModalReq}
          onClose={handleCloseConvert}
          title={`Convert Requisition to PO: ${convertModalReq.requestNumber}`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              convertPoForm.handleSubmit();
            }}
            className="space-y-4 text-xs"
          >
            {convertFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {convertFormError}
              </div>
            )}

            <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 space-y-1">
              <p className="font-bold text-indigo-950">
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
                  className="font-semibold"
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
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleCloseConvert}
              >
                Cancel
              </Button>
              <FormSubmit
                form={convertPoForm}
                size="sm"
                className="bg-indigo-700 text-white hover:bg-indigo-800 font-bold"
              >
                Generate Purchase Order
              </FormSubmit>
            </div>
          </form>
        </Modal>
      )}

      {selectedReq && (
        <Modal
          isOpen={!!selectedReq}
          onClose={() => setSelectedReq(null)}
          title={`Requisition Details: ${selectedReq.requestNumber}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="font-bold text-slate-900">
                {selectedReq.requesterName} ({selectedReq.department})
              </p>
              <p className="text-slate-600">{selectedReq.reason}</p>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <Table className="w-full text-xs">
                <TableHead className="bg-slate-50">
                  <TableHeaderCell className="py-2 px-3">
                    Description
                  </TableHeaderCell>
                  <TableHeaderCell align="right" className="py-2 px-3">
                    Qty
                  </TableHeaderCell>
                  <TableHeaderCell className="py-2 px-3">Unit</TableHeaderCell>
                </TableHead>
                <TableBody>
                  {selectedReq.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="py-2 px-3">
                        {item.description}
                      </TableCell>
                      <TableCell align="right" className="py-2 px-3 font-mono">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="py-2 px-3">{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedReq(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
