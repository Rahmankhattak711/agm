"use client";

import { useState } from "react";
import { useAccounts, useCreateAccount } from "@/lib/hooks/api-hooks";

const ACCOUNT_TYPES = [
  { value: "ASSET", label: "Asset", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "LIABILITY", label: "Liability", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "EQUITY", label: "Equity", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "REVENUE", label: "Revenue", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "EXPENSE", label: "Expense", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

export default function AccountsPage() {
  const { data: accounts, isLoading, error } = useAccounts();
  const createAccountMutation = useCreateAccount();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [accountCode, setAccountCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [type, setType] = useState<"ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE">("ASSET");
  const [formError, setFormError] = useState("");

  const filteredAccounts = (accounts || []).filter((acc) => {
    const matchesSearch =
      acc.accountCode.toLowerCase().includes(search.toLowerCase()) ||
      acc.accountName.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === "ALL" || acc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const countByType = (accType: string) =>
    (accounts || []).filter((a) => a.type === accType).length;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!accountCode.trim() || !accountName.trim()) {
      setFormError("Please fill in both Account Code and Account Name.");
      return;
    }

    try {
      await createAccountMutation.mutateAsync({
        accountCode: accountCode.trim(),
        accountName: accountName.trim(),
        type,
      });
      setIsModalOpen(false);
      setAccountCode("");
      setAccountName("");
      setType("ASSET");
    } catch (err: any) {
      setFormError(err.message || "Failed to create account");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Chart of Accounts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            General ledger structure defining assets, liabilities, equity, revenues, and expenses.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer self-start"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add New Account
        </button>
      </div>

      {/* Account Type Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setSelectedType("ALL")}
          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
            selectedType === "ALL"
              ? "bg-slate-900 border-slate-900 text-white shadow-xs"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">All Accounts</p>
          <p className="text-lg font-black mt-0.5">{accounts?.length || 0}</p>
        </button>

        {ACCOUNT_TYPES.map((t) => {
          const isSelected = selectedType === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                isSelected
                  ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{t.label}</p>
              <p className="text-lg font-black mt-0.5">{countByType(t.value)}</p>
            </button>
          );
        })}
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
              placeholder="Search code or account name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <p className="text-xs text-slate-500 self-end sm:self-auto font-medium">
            Showing {filteredAccounts.length} of {accounts?.length || 0} accounts
          </p>
        </div>

        {/* Table View */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Loading Chart of Accounts...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-red-500">
            Error loading accounts: {(error as any).message}
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-600">No accounts match your criteria</p>
            <p className="text-xs mt-1">Try resetting the search or adding a new account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 px-3">Code</th>
                  <th className="pb-3 px-3">Account Name</th>
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3 text-center">Status</th>
                  <th className="pb-3 px-3 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((acc) => {
                  const typeObj = ACCOUNT_TYPES.find((t) => t.value === acc.type);
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {acc.accountCode}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900">{acc.accountName}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            typeObj?.color || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {acc.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            acc.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${acc.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {acc.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">
                        {new Date(acc.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-900">Add Chart of Account</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Code</label>
                <input
                  type="text"
                  placeholder="e.g. 1050, 4020, 5300"
                  value={accountCode}
                  onChange={(e) => setAccountCode(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. Office Stationery, Marketing Revenue"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="ASSET">Asset</option>
                  <option value="LIABILITY">Liability</option>
                  <option value="EQUITY">Equity</option>
                  <option value="REVENUE">Revenue</option>
                  <option value="EXPENSE">Expense</option>
                </select>
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
                  disabled={createAccountMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {createAccountMutation.isPending ? "Creating..." : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
