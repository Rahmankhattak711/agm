"use client";

import { useMemo, useState } from "react";
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

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formError, setFormError] = useState("");

  const { data: suppliers = [], isLoading, error } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.supplierCode.toLowerCase().includes(search.toLowerCase()) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
      (s.trn && s.trn.includes(search))
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

  const handleOpenCreate = () => {
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
  };

  const handleOpenEdit = (s: Supplier) => {
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
  };

  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: "supplierCode",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-800">
            {row.original.supplierCode}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Company Name",
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-slate-900 block">
              {row.original.name}
            </span>
            {row.original.address && (
              <span className="text-[10px] text-slate-400">
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
          <span className="text-slate-700">
            {row.original.contactPerson || <span className="text-slate-300">-</span>}
          </span>
        ),
      },
      {
        accessorKey: "contact",
        header: "Phone & Email",
        cell: ({ row }) => (
          <div className="text-slate-600">
            {row.original.phone && (
              <span className="block text-slate-800 font-medium">
                {row.original.phone}
              </span>
            )}
            {row.original.email && (
              <span className="block text-[10px] text-slate-400">
                {row.original.email}
              </span>
            )}
            {!row.original.phone && !row.original.email && (
              <span className="text-slate-300">-</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "trn",
        header: "UAE TRN",
        cell: ({ row }) =>
          row.original.trn ? (
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-semibold text-[11px] font-mono">
              {row.original.trn}
            </span>
          ) : (
            <span className="text-slate-300">-</span>
          ),
      },
      {
        accessorKey: "catalogCount",
        header: "Catalog SKUs",
        cell: ({ row }) => (
          <div className="text-center font-bold text-slate-800">
            {row.original._count?.products || 0}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEdit(row.original)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                if (confirm(`Delete supplier "${row.original.name}"?`)) {
                  await deleteSupplier.mutateAsync(row.original.id);
                }
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [deleteSupplier]
  );

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Suppliers & Vendor Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Vendor master registry, Tax Registration Numbers (TRN), and procurement contacts.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenCreate}
          icon={<PlusIcon className="w-4 h-4" strokeWidth={2.2} />}
        >
          Add New Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Suppliers</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{suppliers.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Approved vendor network</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tax Registered (TRN)</p>
          <p className="text-2xl font-black text-emerald-800 mt-1">
            {suppliers.filter((s) => s.trn).length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">VAT compliant invoices</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Supply Lines</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {suppliers.reduce((acc, s) => acc + (s._count?.products || 0), 0)} SKUs
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Supplied materials catalog</p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search code, company name, TRN, contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<SearchIcon className="w-4 h-4" strokeWidth={2} />}
            />
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-red-500">Error loading suppliers: {(error as any).message}</div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredSuppliers}
            isLoading={isLoading}
            emptyTitle="No suppliers found"
            emptyMessage='Click "Add New Supplier" to register your vendor partners.'
          />
        )}
      </div>

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
          className="space-y-3.5"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field
              name="supplierCode"
              validators={{
                onChange: ({ value }) => (!value.trim() ? "Supplier code is required" : undefined),
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Supplier Code *"
                  required
                  className="uppercase"
                />
              )}
            </form.Field>

            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) => (!value.trim() ? "Company name is required" : undefined),
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Company Name *"
                  required
                  placeholder="e.g. Al Futtaim Hardware"
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
                />
              )}
            </form.Field>
          </div>

          <form.Field name="address">
            {(field) => (
              <FormInput
                field={field}
                label="Address / Location"
                placeholder="Al Quoz Ind. 3, Dubai"
              />
            )}
          </form.Field>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <FormSubmit
              form={form}
              loading={createSupplier.isPending || updateSupplier.isPending}
            >
              Save Supplier
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
