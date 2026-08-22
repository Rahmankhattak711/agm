"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import {
  useAccounts,
  useAssets,
  useCreateAsset,
  FixedAsset,
} from "@/lib/hooks/api-hooks";
import { PlusIcon } from "@/components/icons";
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
  FormInput,
  FormSelect,
  FormSubmit,
} from "@/components/ui";

const ASSET_CATEGORIES = [
  { value: "COMPANY_VEHICLE", label: "Company Vehicle" },
  { value: "MACHINERY_EQUIPMENT", label: "Machinery & Equipment" },
  { value: "OFFICE_EQUIPMENT", label: "Office Equipment" },
  { value: "FURNITURE_FIXTURES", label: "Furniture & Fixtures" },
  { value: "COMPUTER_HARDWARE", label: "Computer Hardware" },
  { value: "LEASEHOLD_IMPROVEMENT", label: "Leasehold Improvement" },
];

export default function FixedAssetsPage() {
  const { data: assets = [], isLoading, error } = useAssets();
  const { data: accounts } = useAccounts();
  const createAssetMutation = useCreateAsset();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalAssetCost = (assets || []).reduce(
    (s, a) => s + Number(a.cost || 0),
    0,
  );

  const filteredAssets = useMemo(() => {
    return (assets || []).filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch =
        a.assetCode.toLowerCase().includes(q) ||
        a.assetName.toLowerCase().includes(q);
      const matchesCat =
        selectedCategory === "ALL" || a.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [assets, search, selectedCategory]);

  const form = useForm({
    defaultValues: {
      assetCode: `AST-${Date.now().toString().slice(-4)}`,
      assetName: "",
      category: "OFFICE_EQUIPMENT",
      purchaseDate: new Date().toISOString().split("T")[0],
      cost: "",
      salvageValue: "0",
      depreciationRate: "20",
      assetAccountId: "",
      accumulatedDeprAccountId: "",
      deprExpenseAccountId: "",
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        await createAssetMutation.mutateAsync({
          assetCode: value.assetCode.trim(),
          assetName: value.assetName.trim(),
          category: value.category as any,
          purchaseDate: value.purchaseDate,
          cost: Number(value.cost),
          salvageValue: Number(value.salvageValue) || 0,
          depreciationRate: Number(value.depreciationRate) || 20,
          assetAccountId: value.assetAccountId,
          accumulatedDeprAccountId: value.accumulatedDeprAccountId,
          deprExpenseAccountId: value.deprExpenseAccountId,
        });

        setIsModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to register fixed asset");
      }
    },
  });

  const handleOpenModal = () => {
    const assetAcct = accounts?.find(
      (a) => a.accountCode.startsWith("15") || a.type === "ASSET",
    );
    const accumAcct = accounts?.find(
      (a) =>
        a.accountName.toLowerCase().includes("accumulated") ||
        a.type === "ASSET",
    );
    const expAcct = accounts?.find(
      (a) =>
        a.accountName.toLowerCase().includes("depreciation") ||
        a.type === "EXPENSE",
    );

    setFormError("");
    form.reset({
      assetCode: `AST-${Date.now().toString().slice(-4)}`,
      assetName: "",
      category: "OFFICE_EQUIPMENT",
      purchaseDate: new Date().toISOString().split("T")[0],
      cost: "",
      salvageValue: "0",
      depreciationRate: "20",
      assetAccountId: assetAcct?.id || accounts?.[0]?.id || "",
      accumulatedDeprAccountId: accumAcct?.id || accounts?.[0]?.id || "",
      deprExpenseAccountId: expAcct?.id || accounts?.[0]?.id || "",
    });
    setIsModalOpen(true);
  };

  const columns = useMemo<ColumnDef<FixedAsset>[]>(
    () => [
      {
        accessorKey: "assetCode",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
            {row.original.assetCode}
          </span>
        ),
      },
      {
        accessorKey: "assetName",
        header: "Asset Name",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900">
            {row.original.assetName}
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          const cat = ASSET_CATEGORIES.find(
            (c) => c.value === row.original.category,
          );
          return (
            <span className="text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              {cat?.label || row.original.category}
            </span>
          );
        },
      },
      {
        accessorKey: "purchaseDate",
        header: "Purchase Date",
        cell: ({ row }) => (
          <span className="text-slate-600 text-xs">
            {new Date(row.original.purchaseDate).toLocaleDateString()}
          </span>
        ),
      },
      {
        accessorKey: "cost",
        header: "Cost (AED)",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-xs text-slate-900">
            {formatCurrency(row.original.cost)}
          </span>
        ),
      },
      {
        accessorKey: "depreciationRate",
        header: "Depr. Rate",
        cell: ({ row }) => (
          <span className="text-slate-600 text-xs font-mono">
            {Number(row.original.depreciationRate)}%/yr
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Fixed Assets & Vehicles
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register and manage capital equipment, tools, company vehicles, and
            automated depreciation schedules.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenModal}
          icon={<PlusIcon className="w-4 h-4" strokeWidth={2.2} />}
        >
          Register Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Fixed Assets
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {assets.length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered property & plant items
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Gross Asset Value
          </p>
          <p className="text-2xl font-black text-emerald-800 mt-1">
            {formatCurrency(totalAssetCost)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical acquisition cost
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Asset Categories
          </p>
          <p className="text-2xl font-black text-blue-700 mt-1">
            {ASSET_CATEGORIES.length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Classes configured</p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search code or asset name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { value: "ALL", label: "All Categories" },
                ...ASSET_CATEGORIES,
              ]}
            />
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-red-500">
            Error loading assets: {(error as any).message}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredAssets}
            isLoading={isLoading}
            emptyTitle="No fixed assets registered"
            emptyMessage="Click 'Register Asset' to record equipment or vehicles."
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Fixed Asset / Equipment"
        maxWidth="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field
              name="assetCode"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "Asset code is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Asset Code *"
                  placeholder="e.g. AST-0012"
                  required
                />
              )}
            </form.Field>

            <form.Field
              name="assetName"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "Asset name is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Asset Name *"
                  placeholder="e.g. CNC Wood Router Machine"
                  required
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="category">
              {(field) => (
                <FormSelect
                  field={field}
                  label="Category"
                  options={ASSET_CATEGORIES}
                />
              )}
            </form.Field>

            <form.Field
              name="purchaseDate"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Purchase date is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  type="date"
                  label="Purchase Date *"
                  required
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <form.Field
              name="cost"
              validators={{
                onChange: ({ value }) =>
                  !value || Number(value) <= 0
                    ? "Valid cost is required"
                    : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  type="number"
                  label="Acquisition Cost (AED) *"
                  placeholder="0.00"
                  required
                />
              )}
            </form.Field>

            <form.Field name="salvageValue">
              {(field) => (
                <FormInput
                  field={field}
                  type="number"
                  label="Salvage Value (AED)"
                  placeholder="0.00"
                />
              )}
            </form.Field>

            <form.Field
              name="depreciationRate"
              validators={{
                onChange: ({ value }) =>
                  !value || Number(value) < 0
                    ? "Valid rate is required"
                    : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  type="number"
                  label="Depr. Rate (% / yr) *"
                  placeholder="20"
                  required
                />
              )}
            </form.Field>
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-3">
            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              General Ledger Account Mapping
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <form.Field name="assetAccountId">
                {(field) => (
                  <FormSelect
                    field={field}
                    label="Asset Account (Debit)"
                    options={
                      accounts?.map((a) => ({
                        value: a.id,
                        label: `${a.accountCode} - ${a.accountName}`,
                      })) || []
                    }
                  />
                )}
              </form.Field>

              <form.Field name="accumulatedDeprAccountId">
                {(field) => (
                  <FormSelect
                    field={field}
                    label="Accum. Depr (Asset)"
                    options={
                      accounts?.map((a) => ({
                        value: a.id,
                        label: `${a.accountCode} - ${a.accountName}`,
                      })) || []
                    }
                  />
                )}
              </form.Field>

              <form.Field name="deprExpenseAccountId">
                {(field) => (
                  <FormSelect
                    field={field}
                    label="Depr. Expense (Expense)"
                    options={
                      accounts?.map((a) => ({
                        value: a.id,
                        label: `${a.accountCode} - ${a.accountName}`,
                      })) || []
                    }
                  />
                )}
              </form.Field>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <FormSubmit
              form={form}
              variant="primary"
              loading={createAssetMutation.isPending}
            >
              Save Asset
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
