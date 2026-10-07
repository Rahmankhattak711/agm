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
import {
  BuildingIcon,
  EditIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import {
  Button,
  Input,
  DataTable,
  Modal,
  FormInput,
  FormSubmit,
  PageHeader,
  FilterBar,
} from "@/components/ui";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/context/ConfirmContext";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";

export default function SuppliersPage() {
  const { confirm } = useConfirm();
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

  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: "supplierCode",
        header: "Supplier Code",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            <BuildingIcon size={11} className="text-teal-700" />
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Edit Supplier"
            >
              <EditIcon size={13} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={async () => {
                const isConfirmed = await confirm({
                  title: "Delete Supplier",
                  message: `Delete supplier "${row.original.name}"?`,
                  variant: "danger",
                  confirmText: "Delete",
                });
                if (isConfirmed) {
                  try {
                    await deleteSupplier.mutateAsync(row.original.id);
                    toast.success(`Supplier "${row.original.name}" deleted`);
                  } catch (err: any) {
                    toast.error(err.message || "Failed to delete supplier");
                  }
                }
              }}
              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
              title="Delete Supplier"
            >
              <TrashIcon size={13} />
            </Button>
          </div>
        ),
      },
    ],
    [deleteSupplier, handleOpenEdit],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage vendor profiles, tax registration numbers (TRN), payment terms, and procurement records."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Add New Supplier
          </Button>
        }
      />

      <ReportKpiGrid cols={4}>
        <ReportKpiCard
          title="1. Total Approved Suppliers"
          subtitle="Active vendor network"
          value={suppliers.length}
          currency={false}
          accentColor="sky"
          footerText="Vendors"
        />
        <ReportKpiCard
          title="2. VAT Registered (TRN)"
          subtitle="VAT compliant invoices"
          value={trnCount}
          currency={false}
          accentColor="emerald"
          valueColor="text-emerald-800"
          footerText="Tax Compliant"
        />
        <ReportKpiCard
          title="3. Sourced Catalog SKUs"
          subtitle="Supplied materials catalog"
          value={totalCatalogSkus}
          currency={false}
          accentColor="purple"
          valueColor="text-purple-800"
          footerText="Products"
        />
        <ReportKpiCard
          title="4. Partner Status"
          subtitle="Direct supplier relations"
          badge={
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200">
              Verified
            </span>
          }
          value="100% Direct"
          currency={false}
          accentColor="teal"
          valueColor="text-teal-900"
        />
      </ReportKpiGrid>

      <div className="hidden print:grid print:grid-cols-4 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block">
            Total Suppliers
          </span>
          <span className="font-mono font-bold text-slate-900">
            {suppliers.length}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold block">
            TRN Registered
          </span>
          <span className="font-mono font-bold text-emerald-800">
            {trnCount}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-purple-600 font-bold block">
            Catalog SKUs
          </span>
          <span className="font-mono font-bold text-purple-800">
            {totalCatalogSkus}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-teal-600 font-bold block">
            Relations
          </span>
          <span className="font-mono font-bold text-teal-900">100% Direct</span>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <FilterBar
          tabs={[
            { id: "ALL", label: "All Suppliers" },
            { id: "TRN", label: "Tax Registered (TRN)" },
            { id: "NON_TRN", label: "General Vendors" },
          ]}
          activeTab={statusFilter}
          onTabChange={(id) => setStatusFilter(id as any)}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search code, company name, TRN, contact..."
          totalCount={filteredSuppliers.length}
          countLabel="Vendors Listed"
        />

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
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
            >
              Save Supplier
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
