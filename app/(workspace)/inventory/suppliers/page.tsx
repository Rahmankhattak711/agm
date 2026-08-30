"use client";

import { useMemo, useState, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  Supplier,
} from "@/lib/hooks/api-hooks";
import { PlusIcon, SearchIcon } from "@/components/icons";
import {
  Button,
  Input,
  DataTable,
  Modal,
  FormInput,
  FormSubmit,
} from "@/components/ui";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  Printer,
  Plus,
  Search,
  CheckCircle2,
  ShieldCheck,
  Package,
  Edit2,
  Trash2,
  Layers,
} from "lucide-react";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "TRN" | "NON_TRN">(
    "ALL",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formError, setFormError] = useState("");

  const { data: suppliers = [], isLoading, error } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

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

  const totalCatalogSkus = useMemo(
    () => suppliers.reduce((acc, s) => acc + (s._count?.products || 0), 0),
    [suppliers],
  );

  const trnCount = useMemo(
    () => suppliers.filter((s) => s.trn).length,
    [suppliers],
  );

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
            phone: value.phone.trim() || null,
            email: value.email.trim() || null,
            address: value.address.trim() || null,
            trn: value.trn.trim() || null,
          });
        } else {
          await createSupplier.mutateAsync({
            supplierCode: value.supplierCode.trim(),
            name: value.name.trim(),
            contactPerson: value.contactPerson.trim() || undefined,
            phone: value.phone.trim() || undefined,
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

  const handleOpenEdit = useCallback((s: Supplier) => {
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
  }, [form]);

  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: "supplierCode",
        header: "Supplier Code",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            <Building2 size={11} className="text-teal-700" />
            {row.original.supplierCode}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Company Name & Location",
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-slate-900 block text-xs">
              {row.original.name}
            </span>
            {row.original.address && (
              <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-xs">
                {row.original.address}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "contactPerson",
        header: "Contact Person",
        cell: ({ row }) => (
          <span className="text-slate-800 text-xs font-semibold">
            {row.original.contactPerson || (
              <span className="text-slate-300">—</span>
            )}
          </span>
        ),
      },
      {
        accessorKey: "contact",
        header: "Phone & Email",
        cell: ({ row }) => (
          <div className="text-xs">
            {row.original.phone && (
              <span className="block text-slate-800 font-mono font-medium">
                {row.original.phone}
              </span>
            )}
            {row.original.email && (
              <span className="block text-[10px] text-slate-400">
                {row.original.email}
              </span>
            )}
            {!row.original.phone && !row.original.email && (
              <span className="text-slate-300">—</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "trn",
        header: "UAE TRN",
        cell: ({ row }) =>
          row.original.trn ? (
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
              {row.original.trn}
            </span>
          ) : (
            <span className="text-slate-300 font-mono text-xs">—</span>
          ),
      },
      {
        accessorKey: "catalogCount",
        header: () => <div className="text-center">Catalog SKUs</div>,
        cell: ({ row }) => (
          <span className="text-center font-mono font-bold text-slate-800 text-xs block">
            {row.original._count?.products || 0}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Edit Supplier"
            >
              <Edit2 size={13} />
            </button>
            <button
              type="button"
              onClick={async () => {
                if (confirm(`Delete supplier "${row.original.name}"?`)) {
                  await deleteSupplier.mutateAsync(row.original.id);
                }
              }}
              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
              title="Delete Supplier"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ),
      },
    ],
    [deleteSupplier, handleOpenEdit],
  );

  return (
    <div className="space-y-6">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Suppliers &amp; Vendor Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AGM FITOUT TECHNICAL SERVICES LLC — Vendor master registry, Tax Registration Numbers (TRN), <br /> and procurement contacts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
            icon={<Printer size={14} />}
          >
            Print Register
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<Plus size={14} strokeWidth={2.5} />}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Add New Supplier
          </Button>
        </div>
      </div>

      {/* 4 Elevated Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* 1. Total Suppliers */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Total Approved Suppliers
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Active vendor network
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {suppliers.length}
            </span>
            <span className="text-xs font-bold text-slate-500 font-sans ml-1.5">
              Vendors
            </span>
          </div>
        </div>

        {/* 2. Tax Registered (TRN) */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              2. VAT Registered (TRN)
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              VAT compliant invoices
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-emerald-800 font-mono">
              {trnCount}
            </span>
            <span className="text-xs font-bold text-emerald-700 font-sans ml-1.5">
              Tax Compliant
            </span>
          </div>
        </div>

        {/* 3. Active Supply Lines */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-purple-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              3. Sourced Catalog SKUs
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Supplied materials catalog
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-purple-800 font-mono">
              {totalCatalogSkus}
            </span>
            <span className="text-xs font-bold text-purple-700 font-sans ml-1.5">
              Products
            </span>
          </div>
        </div>

        {/* 4. Verification Network */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-teal-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                4. Partner Status
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Verified
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Direct supplier relations
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xl font-black text-teal-900 font-sans">
              100% Direct
            </span>
          </div>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        {/* Search & Filter Strip */}
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Status Quick Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: "ALL", label: "All Suppliers" },
                { id: "TRN", label: "Tax Registered (TRN)" },
                { id: "NON_TRN", label: "General Vendors" },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 text-emerald-800"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] font-bold text-slate-500 font-mono">
              {filteredSuppliers.length} Vendors Listed
            </span>
          </div>

          <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
            <div className="w-full sm:w-80 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search code, company name, TRN, contact..."
                className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading suppliers: {(error as any).message}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
              <h4 className="font-black text-xs uppercase tracking-wider text-white">
                Master Suppliers &amp; Vendors Registry
              </h4>
              <span className="text-[11px] font-mono text-emerald-300 font-bold">
                {filteredSuppliers.length} Active Partners
              </span>
            </div>

            <DataTable
              columns={columns}
              data={filteredSuppliers}
              isLoading={isLoading}
              emptyTitle="No suppliers found"
              emptyMessage='Click "Add New Supplier" to register your vendor partners.'
            />
          </div>
        )}
      </div>

      {/* Modal for Creating / Editing Supplier */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? "Edit Supplier" : "Add New Supplier"}
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
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
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
                  className="uppercase font-mono font-bold"
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
                <FormInput
                  field={field}
                  label="Phone Number"
                  placeholder="+971 50 000 0000"
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

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
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
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
            >
              Save Supplier
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
