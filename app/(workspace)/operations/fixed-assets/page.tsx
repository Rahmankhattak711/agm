"use client";

import { useState } from "react";
import { useAccounts, useAssets, useCreateAsset } from "@/lib/hooks/api-hooks";

const ASSET_CATEGORIES = [
  { value: "COMPANY_VEHICLE", label: "Company Vehicle" },
  { value: "MACHINERY_EQUIPMENT", label: "Machinery & Equipment" },
  { value: "OFFICE_EQUIPMENT", label: "Office Equipment" },
  { value: "FURNITURE_FIXTURES", label: "Furniture & Fixtures" },
  { value: "COMPUTER_HARDWARE", label: "Computer Hardware" },
  { value: "LEASEHOLD_IMPROVEMENT", label: "Leasehold Improvement" },
];

export default function FixedAssetsPage() {
  const { data: assets, isLoading, error } = useAssets();
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

  const filteredAssets = (assets || []).filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      a.assetCode.toLowerCase().includes(q) ||
      a.assetName.toLowerCase().includes(q);
    const matchesCat = selectedCategory === "ALL" || a.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

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

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Fixed Assets & Depreciation</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Register company property, vehicles, IT hardware, and calculate straight-line depreciation schedules.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer self-start"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Register Fixed Asset
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Asset Book Valuation</p>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{formatCurrency(totalAssetCost)}</p>
          <p className="text-xs text-slate-500 mt-0.5">Historical capital acquisition cost</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Fixed Assets</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{assets?.length || 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active equipment & vehicles registered</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Depreciation Method</p>
          <p className="text-lg font-black text-slate-800 mt-1">Straight Line (SLM)</p>
          <p className="text-xs text-slate-500 mt-0.5">20% standard annual rate with salvage basis</p>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search code or asset name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none text-slate-700 font-medium"
            >
              <option value="ALL">All Categories</option>
              {ASSET_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table View */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">Loading fixed assets...</div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-red-500">Error loading assets: {(error as any).message}</div>
        ) : filteredAssets.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-600">No fixed assets found</p>
            <p className="text-xs mt-1">Register company assets using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 px-3">Asset Code</th>
                  <th className="pb-3 px-3">Asset Description</th>
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3 text-right">Cost (AED)</th>
                  <th className="pb-3 px-3 text-right">Depr. Rate</th>
                  <th className="pb-3 px-3">Acquired</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{asset.assetCode}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{asset.assetName}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {asset.category.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(asset.cost)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 font-semibold">
                      {Number(asset.depreciationRate)}%
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(asset.purchaseDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Register Asset */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-900">Register Fixed Asset</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3.5">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Asset Code</label>
                  <input
                    type="text"
                    value={assetCode}
                    onChange={(e) => setAssetCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Acquisition Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Asset Name / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Toyota Hilux 2024, High-End Workstation"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    {ASSET_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cost (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Depr. Rate %</label>
                  <input
                    type="number"
                    step="1"
                    value={depreciationRate}
                    onChange={(e) => setDepreciationRate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Linked Accounts */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800">Linked Chart of Accounts</p>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Fixed Asset Account (Balance Sheet)</label>
                  <select
                    value={assetAccountId}
                    onChange={(e) => setAssetAccountId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Select Account...</option>
                    {accounts?.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountCode} - {acc.accountName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Accumulated Depreciation Account</label>
                  <select
                    value={accumulatedDeprAccountId}
                    onChange={(e) => setAccumulatedDeprAccountId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Select Account...</option>
                    {accounts?.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountCode} - {acc.accountName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Depreciation Expense Account (P&L)</label>
                  <select
                    value={deprExpenseAccountId}
                    onChange={(e) => setDeprExpenseAccountId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">Select Account...</option>
                    {accounts?.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountCode} - {acc.accountName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAssetMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {createAssetMutation.isPending ? "Registering..." : "Save Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
