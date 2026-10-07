"use client";

import { useMemo, useState, useCallback, Fragment } from "react";
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
  PlusIcon,
  TrashIcon,
} from "@/components/icons";
import {
  Button,
  Modal,
  FormInput,
  FormSubmit,
  PageHeader,
  FilterBar,
  RegisterTable,
  RegisterColumn,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
} from "@/components/ui";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/context/ConfirmContext";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";
import { SupplierExpandedRow } from "./components/SupplierExpandedRow";

const COLUMNS: RegisterColumn[] = [
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
  const { confirm } = useConfirm();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "TRN" | "NON_TRN">(
    "ALL",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(
    null,
  );
  const [formError, setFormError] = useState("");

  const { data: suppliers = [], isLoading, error } = useSuppliers();
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

      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 min-w-0 max-w-full">
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
          <RegisterTable
            title="Master Suppliers & Vendors Registry"
            countLabel={`${filteredSuppliers.length} Active Partners`}
            columns={COLUMNS}
          >
            <TableBody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <TableLoading
                  colSpan={7}
                  message="Loading suppliers directory..."
                />
              ) : filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-slate-400 italic"
                  >
                    No suppliers match your search criteria. Click &quot;Add New
                    Supplier&quot; to register your vendor partners.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((s) => {
                  const isExpanded = expandedSupplierId === s.id;
                  return (
                    <Fragment key={s.id}>
                      <TableRow
                        onClick={() => toggleExpand(s.id)}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                          isExpanded ? "bg-slate-50/90 font-medium" : ""
                        }`}
                      >
                        <TableCell className="py-2 px-2.5 sm:px-3 font-mono font-bold text-teal-800 whitespace-nowrap text-xs">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <BuildingIcon
                              size={14}
                              className="text-teal-700 shrink-0"
                            />
                            <span className="hover:text-emerald-800 transition-colors">
                              {s.supplierCode}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-2.5 sm:px-3 text-slate-900 text-xs">
                          <div
                            className="font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[190px]"
                            title={s.name}
                          >
                            {s.name}
                          </div>
                          {s.address && (
                            <div
                              className="text-[10px] text-slate-400 font-normal truncate max-w-[140px] sm:max-w-[190px]"
                              title={s.address}
                            >
                              {s.address}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-2 px-2.5 sm:px-3 text-slate-800 text-xs whitespace-nowrap">
                          {s.contactPerson ? (
                            <div
                              className="font-semibold text-slate-800 truncate max-w-[120px] sm:max-w-[160px]"
                              title={s.contactPerson}
                            >
                              {s.contactPerson}
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 px-2.5 sm:px-3 font-mono text-slate-700 text-xs whitespace-nowrap">
                          {s.phone ? (
                            <span className="block font-semibold text-slate-800 text-[11px]">
                              {s.phone}
                            </span>
                          ) : null}
                          {s.email ? (
                            <div
                              className="text-[10px] text-slate-400 font-sans truncate max-w-[140px] sm:max-w-[170px]"
                              title={s.email}
                            >
                              {s.email}
                            </div>
                          ) : null}
                          {!s.phone && !s.email && (
                            <span className="text-slate-300 font-sans">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 px-2.5 text-center whitespace-nowrap">
                          {s.trn ? (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                              {s.trn}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono text-xs">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 px-2.5 text-center font-mono font-bold text-slate-800 text-xs whitespace-nowrap">
                          {s._count?.products || 0}
                        </TableCell>
                        <TableCell className="py-2 px-2 sm:pr-3 text-right print:hidden whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(s);
                              }}
                              className="h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                              title="Edit Supplier"
                            >
                              <EditIcon
                                size={18}
                                className="w-[18px] h-[18px]"
                              />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSupplier(s);
                              }}
                              className="h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                              title="Delete Supplier"
                            >
                              <TrashIcon
                                size={18}
                                className="w-[18px] h-[18px]"
                              />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(s.id);
                              }}
                              className={`h-8 w-8 p-0 flex items-center justify-center rounded-lg transition cursor-pointer ${
                                isExpanded
                                  ? "text-emerald-800 bg-emerald-100"
                                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                              }`}
                              title={
                                isExpanded
                                  ? "Collapse preview"
                                  : "Expand preview"
                              }
                            >
                              <ChevronDownIcon
                                size={18}
                                className={`w-[18px] h-[18px] transition-transform duration-200 ${
                                  isExpanded
                                    ? "rotate-180 text-emerald-800"
                                    : ""
                                }`}
                              />
                            </Button>
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
          </RegisterTable>
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
