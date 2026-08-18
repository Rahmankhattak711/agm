"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useAccounts, useAssets, useCreateAsset, FixedAsset } from "@/lib/hooks/api-hooks";
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
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

  // Form State
  const [assetCode, setAssetCode] = useState(`AST-${Date.now().toString().slice(-4)}`);
  const [assetName, setAssetName] = useState("");
  const [category, setCategory] = useState("OFFICE_EQUIPMENT");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [cost, setCost] = useState("");
  const [salvageValue, setSalvageValue] = useState("0");
  const [depreciationRate, setDepreciationRate] = useState("20");
  const [assetAccountId, setAssetAccountId] = useState("");
  const [accumulatedDeprAccountId, setAccumulatedDeprAccountId] = useState("");
  const [deprExpenseAccountId, setDeprExpenseAccountId] = useState("");
  const [formError, setFormError] = useState("");

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalAssetCost = (assets || []).reduce((s, a) => s + Number(a.cost || 0), 0);

  const filteredAssets = useMemo(() => {
    return (assets || []).filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch =
        a.assetCode.toLowerCase().includes(q) ||
        a.assetName.toLowerCase().includes(q);
      const matchesCat = selectedCategory === "ALL" || a.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [assets, search, selectedCategory]);

  const handleOpenModal = () => {
    setAssetCode(`AST-${Date.now().toString().slice(-4)}`);
    setAssetName("");
    setCategory("OFFICE_EQUIPMENT");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setCost("");
    setSalvageValue("0");
    setDepreciationRate("20");

    // Auto-select sensible accounts if available
    const assetAcct = accounts?.find((a) => a.accountCode.startsWith("15") || a.type === "ASSET");
    const accumAcct = accounts?.find((a) => a.accountName.toLowerCase().includes("accumulated") || a.type === "ASSET");
    const expAcct = accounts?.find((a) => a.accountName.toLowerCase().includes("depreciation") || a.type === "EXPENSE");

    setAssetAccountId(assetAcct?.id || accounts?.[0]?.id || "");
    setAccumulatedDeprAccountId(accumAcct?.id || accounts?.[0]?.id || "");
    setDeprExpenseAccountId(expAcct?.id || accounts?.[0]?.id || "");

    setFormError("");
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (
      !assetCode.trim() ||
      !assetName.trim() ||
      !cost ||
      !assetAccountId ||
      !accumulatedDeprAccountId ||
      !deprExpenseAccountId
    ) {
      setFormError("Please fill in all required fields including accounts.");
      return;
    }

    try {
      await createAssetMutation.mutateAsync({
        assetCode: assetCode.trim(),
        assetName: assetName.trim(),
        category,
        purchaseDate,
        cost: Number(cost),
        salvageValue: Number(salvageValue) || 0,
        depreciationRate: Number(depreciationRate) || 20,
        assetAccountId,
        accumulatedDeprAccountId,
        deprExpenseAccountId,
      });

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to register asset");
    }
  };

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<FixedAsset>[]>(
    () => [
      {
        accessorKey: "assetCode",
        header: "Asset Code",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
            {row.original.assetCode}
          </span>
        ),
      },
      {
        accessorKey: "assetName",
        header: "Asset Description",
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-slate-900 block">{row.original.assetName}</span>
            <span className="text-[10px] text-slate-400">
              Acquired: {new Date(row.original.purchaseDate).toLocaleDateString()}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {row.original.category.replace(/_/g, " ")}
          </span>
        ),
      },
      {
        accessorKey: "cost",
        header: "Cost (AED)",
        cell: ({ row }) => (
          <div className="text-right font-mono">
            <span className="font-bold text-slate-900 block text-xs">
              {formatCurrency(row.original.cost)}
            </span>
            <span className="text-[10px] text-slate-400">
              Salvage: {formatCurrency(row.original.salvageValue || 0)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "depreciationRate",
        header: "Depr. Rate",
        cell: ({ row }) => (
          <div className="text-center">
            <span className="font-mono font-bold text-slate-700 text-xs">
              {Number(row.original.depreciationRate)}% / yr
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: () => (
          <div className="text-center">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              In Service
            </span>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Fixed Assets & Equipment Register</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track capital machinery, vehicles, office assets, and straight-line depreciation schedules.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={handleOpenModal}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
          }
          className="self-start shadow-sm"
        >
          Register Asset
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Registered Assets</p>
          <p className="text-2xl font-black text-slate-900">{assets.length}</p>
          <p className="text-[11px] text-emerald-600 font-medium">100% active capital inventory</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gross Capitalized Cost</p>
          <p className="text-2xl font-black text-slate-900 font-mono">{formatCurrency(totalAssetCost)}</p>
          <p className="text-[11px] text-slate-500">Historical acquisition book value</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Depreciation Standard</p>
          <p className="text-2xl font-black text-slate-900">Straight-Line</p>
          <p className="text-[11px] text-slate-500">Automated GL schedule calculation</p>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-72">
            <Input
              type="text"
              placeholder="Search asset code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[{ value: "ALL", label: "All Categories" }, ...ASSET_CATEGORIES]}
            />
          </div>
        </div>

        {/* TanStack DataTable View */}
        <DataTable
          columns={columns}
          data={filteredAssets}
          isLoading={isLoading}
          emptyTitle="No fixed assets found"
          emptyMessage="Register company machinery, tools, or vehicles to start tracking."
        />
      </div>

      {/* Modal: Register Asset */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Fixed Asset"
        maxWidth="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Asset Code"
              value={assetCode}
              onChange={(e) => setAssetCode(e.target.value)}
              placeholder="AST-001"
              required
            />
            <Input
              label="Asset Name / Model"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="e.g. Toyota Hilux / Dewalt Laser"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={ASSET_CATEGORIES}
            />
            <Input
              type="date"
              label="Purchase Date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              type="number"
              label="Acquisition Cost (AED)"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
              required
            />
            <Input
              type="number"
              label="Salvage Value (AED)"
              value={salvageValue}
              onChange={(e) => setSalvageValue(e.target.value)}
              placeholder="0.00"
            />
            <Input
              type="number"
              label="Depr. Rate (% / yr)"
              value={depreciationRate}
              onChange={(e) => setDepreciationRate(e.target.value)}
              placeholder="20"
              required
            />
          </div>

          {/* GL Account Mapping */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              General Ledger Account Mapping
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Asset Account (Debit)"
                value={assetAccountId}
                onChange={(e) => setAssetAccountId(e.target.value)}
                options={
                  accounts?.map((a) => ({
                    value: a.id,
                    label: `${a.accountCode} - ${a.accountName}`,
                  })) || []
                }
              />

              <Select
                label="Accum. Depr (Asset)"
                value={accumulatedDeprAccountId}
                onChange={(e) => setAccumulatedDeprAccountId(e.target.value)}
                options={
                  accounts?.map((a) => ({
                    value: a.id,
                    label: `${a.accountCode} - ${a.accountName}`,
                  })) || []
                }
              />

              <Select
                label="Depr. Expense (Expense)"
                value={deprExpenseAccountId}
                onChange={(e) => setDeprExpenseAccountId(e.target.value)}
                options={
                  accounts?.map((a) => ({
                    value: a.id,
                    label: `${a.accountCode} - ${a.accountName}`,
                  })) || []
                }
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createAssetMutation.isPending}
            >
              {createAssetMutation.isPending ? "Registering..." : "Save Asset"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
