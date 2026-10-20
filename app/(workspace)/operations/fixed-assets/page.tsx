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
import { formatAed } from "@/lib/utils/format";
import {
  Button,
  Input,
  DataTable,
  Modal,
  FormInput,
  FormSelect,
  FormSubmit,
  DashboardCard,
  DashboardCardGrid,
  PageHeader,
  FilterBar,
} from "@/components/ui";
import { BuildingIcon, PlusIcon, SearchIcon } from "@/components/icons";

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

  const totalAssetCost = useMemo(
    () => (assets || []).reduce((s, a) => s + Number(a.cost || 0), 0),
    [assets],
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
        header: "Asset Code",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-agm-green-dark bg-agm-green-soft border border-agm-green/20 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            <BuildingIcon size={12} className="text-agm-green" />
            {row.original.assetCode}
          </span>
        ),
      },
      {
        accessorKey: "assetName",
        header: "Asset Name & Description",
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-agm-text block text-xs">
              {row.original.assetName}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Asset Class",
        cell: ({ row }) => {
          const cat = ASSET_CATEGORIES.find(
            (c) => c.value === row.original.category,
          );
          return (
            <span className="text-[11px] font-semibold text-agm-muted bg-agm-box-bg px-2 py-0.5 rounded border border-agm-box-border">
              {cat?.label || row.original.category}
            </span>
          );
        },
      },
      {
        accessorKey: "purchaseDate",
        header: "Purchase Date",
        cell: ({ row }) => (
          <span className="text-agm-muted text-xs font-mono">
            {new Date(row.original.purchaseDate).toLocaleDateString("en-GB")}
          </span>
        ),
      },
      {
        accessorKey: "cost",
        header: "Acquisition Cost",
        cell: ({ row }) => (
          <span className="font-mono font-black text-xs text-agm-text">
            {formatAed(row.original.cost)}
          </span>
        ),
      },
      {
        accessorKey: "depreciationRate",
        header: () => <div className="text-center">Depr. Rate</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span className="text-agm-text text-xs font-mono font-bold bg-agm-box-bg border border-agm-box-border px-2 py-0.5 rounded">
              {Number(row.original.depreciationRate)}%/yr
            </span>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fixed Assets"
        description="Track capital equipment, machinery, company vehicles, and automated depreciation schedules."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenModal}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Register New Asset
          </Button>
        }
      />

      <DashboardCardGrid cols={4}>
        <DashboardCard
          title="Gross Fixed Assets"
          value={`AED ${Number(totalAssetCost).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle="Historical acquisition cost"
          variant="default"
        />
        <DashboardCard
          title="Total Capital Assets"
          value={assets.length}
          subtitle="Plant, tools & vehicles"
          variant="default"
        />
        <DashboardCard
          title="Asset Categories"
          value={ASSET_CATEGORIES.length}
          subtitle="Active ledger asset groups"
          variant="default"
        />
        <DashboardCard
          title="Capitalization"
          value="100% Capitalized"
          subtitle="Automated straight-line depr."
          badge={
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-agm-green-soft text-agm-green-dark border border-agm-green/20">
              Active
            </span>
          }
          variant="default"
        />
      </DashboardCardGrid>

      <div className="p-5 rounded-2xl bg-agm-card border border-agm-border shadow-xs space-y-4">
        <FilterBar
          tabs={[
            { id: "ALL", label: "All Assets" },
            ...ASSET_CATEGORIES.map((c) => ({ id: c.value, label: c.label })),
          ]}
          activeTab={selectedCategory}
          onTabChange={setSelectedCategory}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search asset code, name, category..."
          totalCount={filteredAssets.length}
          countLabel="Assets Listed"
        />

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading assets: {(error as any).message}
          </div>
        ) : (
          <DataTable
            title="Fixed Assets & Property Plant Register"
            countLabel={`${filteredAssets.length} Assets`}
            columns={columns}
            data={filteredAssets}
            isLoading={isLoading}
            emptyTitle="No fixed assets registered"
            emptyMessage="Click 'Register New Asset' to record capital machinery, vehicles, and tools."
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Fixed Asset / Equipment"
        maxWidth="xl"
      >
        {formError && (
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold mb-4">
            {formError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="assetCode">
              {(field) => (
                <FormInput
                  field={field}
                  label="Asset Code *"
                  required
                  className="font-mono font-bold uppercase"
                />
              )}
            </form.Field>

            <form.Field name="assetName">
              {(field) => (
                <FormInput
                  field={field}
                  label="Asset Name *"
                  required
                  placeholder="e.g. Toyota Hilux / Dewalt Heavy Drill"
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="category">
              {(field) => (
                <FormSelect
                  field={field}
                  label="Asset Category *"
                  required
                  options={ASSET_CATEGORIES}
                />
              )}
            </form.Field>

            <form.Field name="purchaseDate">
              {(field) => (
                <FormInput
                  field={field}
                  label="Acquisition Date *"
                  type="date"
                  required
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <form.Field name="cost">
              {(field) => (
                <FormInput
                  field={field}
                  label="Cost / Value (AED) *"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="font-mono font-bold"
                />
              )}
            </form.Field>

            <form.Field name="salvageValue">
              {(field) => (
                <FormInput
                  field={field}
                  label="Salvage Value (AED)"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="font-mono"
                />
              )}
            </form.Field>

            <form.Field name="depreciationRate">
              {(field) => (
                <FormInput
                  field={field}
                  label="Depreciation Rate (%/yr)"
                  type="number"
                  step="0.5"
                  className="font-mono font-bold"
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-agm-border">
            <form.Field name="assetAccountId">
              {(field) => (
                <FormSelect
                  field={field}
                  label="Asset Ledger Account"
                  options={(accounts || []).map((a) => ({
                    value: a.id,
                    label: `${a.accountCode} - ${a.accountName}`,
                  }))}
                />
              )}
            </form.Field>

            <form.Field name="accumulatedDeprAccountId">
              {(field) => (
                <FormSelect
                  field={field}
                  label="Accum. Depr Account"
                  options={(accounts || []).map((a) => ({
                    value: a.id,
                    label: `${a.accountCode} - ${a.accountName}`,
                  }))}
                />
              )}
            </form.Field>

            <form.Field name="deprExpenseAccountId">
              {(field) => (
                <FormSelect
                  field={field}
                  label="Depr. Expense Account"
                  options={(accounts || []).map((a) => ({
                    value: a.id,
                    label: `${a.accountCode} - ${a.accountName}`,
                  }))}
                />
              )}
            </form.Field>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-agm-border">
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
              loading={createAssetMutation.isPending}
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
            >
              Save &amp; Capitalize Asset
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
