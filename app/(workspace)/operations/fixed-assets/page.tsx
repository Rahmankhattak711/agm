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
  Select,
  DataTable,
  Modal,
  FormInput,
  FormSelect,
  FormSubmit,
} from "@/components/ui";
import {
  Truck,
  Wrench,
  Laptop,
  Building2,
  Printer,
  Plus,
  Search,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Layers,
  FileSpreadsheet,
} from "lucide-react";

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
          <span className="font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            <Building2 size={11} className="text-teal-700" />
            {row.original.assetCode}
          </span>
        ),
      },
      {
        accessorKey: "assetName",
        header: "Asset Name & Description",
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-slate-900 block text-xs">
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
            <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {cat?.label || row.original.category}
            </span>
          );
        },
      },
      {
        accessorKey: "purchaseDate",
        header: "Purchase Date",
        cell: ({ row }) => (
          <span className="text-slate-600 text-xs font-mono">
            {new Date(row.original.purchaseDate).toLocaleDateString("en-GB")}
          </span>
        ),
      },
      {
        accessorKey: "cost",
        header: "Acquisition Cost",
        cell: ({ row }) => (
          <span className="font-mono font-black text-xs text-slate-900">
            {formatAed(row.original.cost)}
          </span>
        ),
      },
      {
        accessorKey: "depreciationRate",
        header: () => <div className="text-center">Depr. Rate</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span className="text-slate-700 text-xs font-mono font-bold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
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
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Fixed Assets &amp; Capital Equipment
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AGM FITOUT TECHNICAL SERVICES LLC — Register and manage capital equipment, tools, <br /> company vehicles, and automated depreciation schedules.
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
            onClick={handleOpenModal}
            icon={<Plus size={14} strokeWidth={2.5} />}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Register New Asset
          </Button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* 1. Gross Asset Value */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Gross Fixed Assets
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Historical acquisition cost
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-emerald-600 font-sans mr-1">
              AED
            </span>
            <span className="text-xl font-black text-emerald-800 font-mono">
              {Number(totalAssetCost).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {/* 2. Total Assets */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              2. Total Capital Assets
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Plant, tools &amp; vehicles
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {assets.length}
            </span>
            <span className="text-xs font-bold text-slate-500 font-sans ml-1.5">
              Assets
            </span>
          </div>
        </div>

        {/* 3. Asset Classes */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-purple-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              3. Asset Categories
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Active ledger asset groups
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-purple-800 font-mono">
              {ASSET_CATEGORIES.length}
            </span>
            <span className="text-xs font-bold text-purple-700 font-sans ml-1.5">
              Classes
            </span>
          </div>
        </div>

        {/* 4. Capitalization Status */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-teal-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                4. Capitalization
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Active
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Automated straight-line depr.
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xl font-black text-teal-900 font-sans">
              100% Capitalized
            </span>
          </div>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        {/* Search & Filter Strip */}
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Category Quick Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { value: "ALL", label: "All Assets" },
                ...ASSET_CATEGORIES,
              ].map((tab) => {
                const isActive = selectedCategory === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setSelectedCategory(tab.value)}
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
              {filteredAssets.length} Assets Listed
            </span>
          </div>

          <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
            <div className="w-full sm:w-80 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search asset code, name, category..."
                className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading assets: {(error as any).message}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
              <h4 className="font-black text-xs uppercase tracking-wider text-white">
                Fixed Assets &amp; Property Plant Register
              </h4>
              <span className="text-[11px] font-mono text-emerald-300 font-bold">
                {filteredAssets.length} Assets
              </span>
            </div>

            <DataTable
              columns={columns}
              data={filteredAssets}
              isLoading={isLoading}
              emptyTitle="No fixed assets registered"
              emptyMessage="Click 'Register New Asset' to record capital machinery, vehicles, and tools."
            />
          </div>
        )}
      </div>

      {/* Modal for Creating Asset */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Fixed Asset / Equipment"
        maxWidth="lg"
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
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
              loading={createAssetMutation.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
            >
              Save &amp; Capitalize Asset
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
