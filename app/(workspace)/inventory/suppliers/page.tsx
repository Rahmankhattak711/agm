"use client";

import { cleanUaePhone } from "@/lib/utils/phone";
import React, { useMemo, useState, useCallback, Fragment, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  Supplier,
} from "@/lib/hooks/api-hooks";
import {
  BuildingIcon,
  ChevronDownIcon,
  EditIcon,
  TrashIcon,
} from "@/components/icons";
import {
  Button,
  Modal,
  FormInput,
  FormUaePhoneInput,
  FormSubmit,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
} from "@/components/ui";
import { RefreshCw, Users, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/context/ConfirmContext";
import { SupplierExpandedRow } from "./components/SupplierExpandedRow";
import ProcurementQuickNav from "@/components/ProcurementQuickNav";

const PAGE_SIZE = 15;

const COLUMNS = [
  { label: "Supplier Code", compact: true, className: "whitespace-nowrap" },
  { label: "Company & Address", compact: true },
  { label: "Contact Person", compact: true, className: "whitespace-nowrap" },
  { label: "Phone & Email", compact: true, className: "whitespace-nowrap" },
  {
    label: "UAE TRN",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Catalog SKUs",
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

export default function SuppliersPage() {
  const router = useRouter();
  const { confirm } = useConfirm();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "TRN" | "NON_TRN">(
    "ALL",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(
    null,
  );
  const [formError, setFormError] = useState("");

  const { data: suppliers = [], isLoading, isFetching, refetch, error } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const toggleExpand = useCallback((id: string) => {
    setExpandedSupplierId((prev) => (prev === id ? null : id));
  }, []);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.supplierCode.toLowerCase().includes(q) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
        (s.trn && s.trn.includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q));

      let matchesStatus = true;
      if (statusFilter === "TRN") matchesStatus = Boolean(s.trn);
      if (statusFilter === "NON_TRN") matchesStatus = !s.trn;

      return matchesSearch && matchesStatus;
    });
  }, [suppliers, search, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedSuppliers = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredSuppliers.slice(start, start + PAGE_SIZE);
  }, [filteredSuppliers, safePage]);

  const totalCatalogSkus = useMemo(
    () => suppliers.reduce((acc, s) => acc + (s._count?.products || 0), 0),
    [suppliers],
  );

  const trnCount = useMemo(
    () => suppliers.filter((s) => s.trn).length,
    [suppliers],
  );
  const nonTrnCount = suppliers.length - trnCount;

  const form = useForm({
    defaultValues: {
      supplierCode: `SUP-${Date.now().toString().slice(-4)}`,
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      trn: "",
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        if (editingSupplier) {
          await updateSupplier.mutateAsync({
            id: editingSupplier.id,
            supplierCode: value.supplierCode.trim(),
            name: value.name.trim(),
            contactPerson: value.contactPerson.trim() || null,
            phone: cleanUaePhone(value.phone) || null,
            email: value.email.trim() || null,
            address: value.address.trim() || null,
            trn: value.trn.trim() || null,
          });
        } else {
          await createSupplier.mutateAsync({
            supplierCode: value.supplierCode.trim(),
            name: value.name.trim(),
            contactPerson: value.contactPerson.trim() || undefined,
            phone: cleanUaePhone(value.phone) || undefined,
            email: value.email.trim() || undefined,
            address: value.address.trim() || undefined,
            trn: value.trn.trim() || undefined,
          });
        }

        setIsModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to save supplier");
      }
    },
  });

  const handleOpenCreate = useCallback(() => {
    setEditingSupplier(null);
    setFormError("");
    form.reset({
      supplierCode: `SUP-${Date.now().toString().slice(-4)}`,
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      trn: "",
    });
    setIsModalOpen(true);
  }, [form]);

  const handleOpenEdit = useCallback(
    (s: Supplier) => {
      setEditingSupplier(s);
      setFormError("");
      form.reset({
        supplierCode: s.supplierCode,
        name: s.name,
        contactPerson: s.contactPerson || "",
        phone: s.phone || "",
        email: s.email || "",
        address: s.address || "",
        trn: s.trn || "",
      });
      setIsModalOpen(true);
    },
    [form],
  );

  const handleDeleteSupplier = useCallback(
    async (s: Supplier) => {
      const isConfirmed = await confirm({
        title: "Delete Supplier",
        message: `Delete supplier "${s.name}" (${s.supplierCode})?`,
        variant: "danger",
        confirmText: "Delete",
      });
      if (isConfirmed) {
        try {
          await deleteSupplier.mutateAsync(s.id);
          toast.success(`Supplier "${s.name}" deleted`);
          if (expandedSupplierId === s.id) {
            setExpandedSupplierId(null);
          }
        } catch (err: any) {
          toast.error(err.message || "Failed to delete supplier");
        }
      }
    },
    [confirm, deleteSupplier, expandedSupplierId],
  );

  const statusTabs = [
    { id: "ALL", label: "All Vendors" },
    { id: "TRN", label: "Tax Registered (TRN)" },
    { id: "NON_TRN", label: "General Vendors" },
  ];

  return (
    <div className="w-full min-h-full p-3 sm:p-5 space-y-3.5 bg-[#f8fafc] font-sans text-slate-800">
      {/* Compact Header Card */}
      <div
        className="bg-white rounded-xl p-3 sm:px-4 sm:py-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
        style={{ border: "1px solid #cbd5e1" }}
      >
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
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
            }}
          >
            <Users className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-[17px] font-semibold text-slate-800 tracking-tight">
              Vendors Directory
            </h1>
            <span
              className="text-[10.5px] font-medium px-2 py-0.5 rounded-full font-mono"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#475569",
                border: "1px solid #cbd5e1",
              }}
            >
              {suppliers.length} Vendors
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            style={{ border: "1px solid #cbd5e1" }}
            title="Refresh vendors list"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isFetching ? "animate-spin text-[#1d4ed8]" : ""
              }`}
            />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-2xs transition-colors cursor-pointer"
            style={{ backgroundColor: "#1d4ed8" }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Vendor</span>
          </button>
        </div>
      </div>

      {/* Procurement Lifecycle Quick Navigation */}
      <ProcurementQuickNav />

      {/* 4 Compact Pastel KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#f1f5f9",
            border: "1px solid #cbd5e1",
          }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-slate-500 block">
            Total Approved Vendors
          </span>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-slate-800 mt-0.5 block">
            {suppliers.length}
          </span>
          <span className="text-[10.5px] text-slate-500 block mt-0.5">
            Active trade vendor network
          </span>
        </div>

        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9.5px] font-medium uppercase tracking-wider text-emerald-800/80 block">
              VAT Registered (TRN)
            </span>
            <span
              className="text-[9.5px] font-medium px-1.5 py-0.5 rounded font-mono"
              style={{
                backgroundColor: "#dcfce7",
                color: "#166534",
                border: "1px solid #86efac",
              }}
            >
              15-Digit TRN
            </span>
          </div>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-emerald-900 mt-0.5 block">
            {trnCount}
          </span>
          <span className="text-[10.5px] text-emerald-700/80 block mt-0.5">
            FTA tax compliant vendors
          </span>
        </div>

        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#fefce8",
            border: "1px solid #fde047",
          }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-amber-800/80 block">
            General Vendors
          </span>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-amber-900 mt-0.5 block">
            {nonTrnCount}
          </span>
          <span className="text-[10.5px] text-amber-700/80 block mt-0.5">
            Non-registered local suppliers
          </span>
        </div>

        <div
          className="px-3.5 py-2.5 rounded-xl shadow-2xs"
          style={{
            backgroundColor: "#fff1f2",
            border: "1px solid #fda4af",
          }}
        >
          <span className="text-[9.5px] font-medium uppercase tracking-wider text-rose-800/80 block">
            Linked Catalog SKUs
          </span>
          <span className="text-sm sm:text-[15px] font-semibold font-mono text-rose-900 mt-0.5 block">
            {totalCatalogSkus}
          </span>
          <span className="text-[10.5px] text-rose-700/80 block mt-0.5">
            Supplied materials &amp; items
          </span>
        </div>
      </div>

      {/* Unified Filter Bar */}
      <div
        className="rounded-xl p-2.5 sm:px-3.5 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs"
        style={{
          backgroundColor: "#f4f7fb",
          border: "1px solid #cbd5e1",
        }}
      >
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
                onClick={() => setStatusFilter(tab.id as any)}
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

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, company name, TRN, contact..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-lg text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
            style={{ border: "1px solid #cbd5e1" }}
          />
        </div>
      </div>

      {/* Main Table Card */}
      {error ? (
        <div
          className="py-8 text-center text-xs text-rose-700 rounded-xl"
          style={{
            backgroundColor: "#fff1f2",
            border: "1px solid #fda4af",
          }}
        >
          Error loading suppliers: {(error as any).message}
        </div>
      ) : (
        <div
          className="bg-white rounded-xl shadow-2xs overflow-hidden"
          style={{ border: "1px solid #cbd5e1" }}
        >
          <div
            className="px-4 py-2.5 flex items-center justify-between gap-2"
            style={{
              backgroundColor: "#f4f7fb",
              borderBottom: "1px solid #cbd5e1",
            }}
          >
            <span className="text-xs font-semibold text-slate-700">
              Master Suppliers &amp; Vendors Registry
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {filteredSuppliers.length} {filteredSuppliers.length === 1 ? "vendor" : "vendors"}
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
                  <th className="py-2.5 px-3 whitespace-nowrap font-medium">Supplier Code</th>
                  <th className="py-2.5 px-3 font-medium">Company &amp; Address</th>
                  <th className="py-2.5 px-2.5 whitespace-nowrap font-medium">Contact Person</th>
                  <th className="py-2.5 px-2.5 whitespace-nowrap font-medium">Phone &amp; Email</th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap font-medium">UAE TRN</th>
                  <th className="py-2.5 px-2.5 text-center whitespace-nowrap font-medium">Catalog SKUs</th>
                  <th className="py-2.5 px-2 sm:pr-3 text-right whitespace-nowrap print:hidden font-medium">Actions</th>
                </tr>
              </thead>
              <TableBody className="divide-y divide-slate-200/80 font-normal">
                {isLoading ? (
                  <TableLoading colSpan={7} message="Loading suppliers directory..." />
                ) : paginatedSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-slate-400 italic">
                      No suppliers match your search criteria. Click &quot;Add New Vendor&quot; to register your vendor partners.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSuppliers.map((s) => {
                    const isExpanded = expandedSupplierId === s.id;
                    return (
                      <Fragment key={s.id}>
                        <TableRow
                          onClick={() => toggleExpand(s.id)}
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                            isExpanded ? "bg-slate-50/90" : ""
                          }`}
                        >
                          <TableCell className="py-2.5 px-3 font-mono whitespace-nowrap text-xs">
                            <span
                              className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium px-2 py-0.5 rounded-md max-w-fit"
                              style={{
                                backgroundColor: "#eff6ff",
                                color: "#1d4ed8",
                                border: "1px solid #bfdbfe",
                              }}
                            >
                              <BuildingIcon size={12} className="shrink-0" />
                              <span>{s.supplierCode}</span>
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-slate-800 text-xs">
                            <div className="font-medium text-slate-800 truncate max-w-[140px] sm:max-w-[200px]" title={s.name}>
                              {s.name}
                            </div>
                            {s.address && (
                              <div className="text-[10.5px] text-slate-400 font-normal truncate max-w-[140px] sm:max-w-[200px]" title={s.address}>
                                {s.address}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 px-2.5 text-slate-800 text-xs whitespace-nowrap font-normal">
                            {s.contactPerson ? (
                              <span className="font-normal text-slate-700">{s.contactPerson}</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 px-2.5 font-mono text-slate-600 text-xs whitespace-nowrap">
                            {s.phone ? (
                              <span className="block font-medium text-slate-700 text-[11px]">{s.phone}</span>
                            ) : null}
                            {s.email ? (
                              <span className="text-[10.5px] text-slate-400 font-sans block truncate max-w-[150px]">
                                {s.email}
                              </span>
                            ) : null}
                            {!s.phone && !s.email && <span className="text-slate-300 font-sans">—</span>}
                          </TableCell>
                          <TableCell className="py-2.5 px-2.5 text-center whitespace-nowrap">
                            {s.trn ? (
                              <span
                                className="px-2 py-0.5 rounded text-[10.5px] font-mono font-medium"
                                style={{
                                  backgroundColor: "#f0fdf4",
                                  color: "#166534",
                                  border: "1px solid #86efac",
                                }}
                              >
                                {s.trn}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2.5 px-2.5 text-center font-mono font-medium text-slate-700 text-xs whitespace-nowrap">
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium"
                              style={{
                                backgroundColor: "#f8fafc",
                                color: "#334155",
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              {s._count?.products || 0}
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5 px-2 sm:pr-3 text-right print:hidden whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(s)}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#1d4ed8] hover:bg-[#eff6ff] border border-transparent hover:border-[#bfdbfe] transition-all cursor-pointer"
                                title="Edit Supplier"
                              >
                                <EditIcon size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSupplier(s)}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                                title="Delete Supplier"
                              >
                                <TrashIcon size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleExpand(s.id)}
                                className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                  isExpanded
                                    ? "bg-[#1d4ed8] text-white shadow-2xs"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                                }`}
                                title={isExpanded ? "Collapse preview" : "Expand preview"}
                              >
                                <ChevronDownIcon
                                  size={14}
                                  className={`transition-transform duration-200 ${
                                    isExpanded ? "rotate-180 text-white" : ""
                                  }`}
                                />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <SupplierExpandedRow
                            supplier={s}
                            onEdit={() => handleOpenEdit(s)}
                            onDelete={() => handleDeleteSupplier(s)}
                            onClose={() => toggleExpand(s.id)}
                          />
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </table>
          </div>

          {/* Responsive Pagination Footer */}
          {filteredSuppliers.length > 0 && (
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
                  {Math.min(safePage * PAGE_SIZE, filteredSuppliers.length)}
                </span>{" "}
                of{" "}
                <span className="font-mono font-medium text-slate-800">
                  {filteredSuppliers.length}
                </span>{" "}
                vendors
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

      {/* Modal for Add / Edit Vendor */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? "Edit Vendor Profile" : "Register New Trade Vendor"}
        maxWidth="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-3.5 text-xs"
        >
          {formError && (
            <div
              className="p-3 rounded-xl text-rose-800 text-xs font-medium"
              style={{
                backgroundColor: "#fff1f2",
                border: "1px solid #fda4af",
              }}
            >
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field
              name="supplierCode"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "Supplier code is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Supplier Code *"
                  required
                  className="uppercase font-mono font-semibold"
                />
              )}
            </form.Field>

            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "Company name is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Company Name *"
                  required
                  placeholder="e.g. Al Futtaim Hardware LLC"
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="contactPerson">
              {(field) => (
                <FormInput
                  field={field}
                  label="Contact Person"
                  placeholder="Sales Rep Name"
                />
              )}
            </form.Field>

            <form.Field name="phone">
              {(field) => (
                <FormUaePhoneInput
                  field={field}
                  label="Phone Number"
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="email">
              {(field) => (
                <FormInput
                  field={field}
                  label="Email"
                  type="email"
                  placeholder="sales@vendor.com"
                />
              )}
            </form.Field>

            <form.Field name="trn">
              {(field) => (
                <FormInput
                  field={field}
                  label="Tax TRN"
                  placeholder="100XXXXXXXXX003"
                  className="font-mono"
                />
              )}
            </form.Field>
          </div>

          <form.Field name="address">
            {(field) => (
              <FormInput
                field={field}
                label="Address / Location"
                placeholder="Al Quoz Ind. 3, Dubai, UAE"
              />
            )}
          </form.Field>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <FormSubmit
              form={form}
              loading={createSupplier.isPending || updateSupplier.isPending}
              className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-medium cursor-pointer"
            >
              Save Supplier
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
