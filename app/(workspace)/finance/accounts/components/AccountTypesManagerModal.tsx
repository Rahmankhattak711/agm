"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Search,
  Check,
  Tag,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  useAccountSubtypes,
  useCreateAccountSubtype,
  useUpdateAccountSubtype,
  useDeleteAccountSubtype,
  AccountSubtypeItem,
} from "@/lib/hooks/finance-hooks";
import { toast } from "@/lib/toast";

interface AccountTypesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType?: (subtype: AccountSubtypeItem) => void;
}

export function AccountTypesManagerModal({
  isOpen,
  onClose,
  onSelectType,
}: AccountTypesManagerModalProps) {
  const { data: subtypes = [], isLoading, refetch } = useAccountSubtypes();
  const createMutation = useCreateAccountSubtype();
  const updateMutation = useUpdateAccountSubtype();
  const deleteMutation = useDeleteAccountSubtype();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("ALL");

  // Create / Edit Form State
  const [editingItem, setEditingItem] = useState<AccountSubtypeItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE">("EXPENSE");
  const [formCashFlow, setFormCashFlow] = useState("Operating");
  const [formDescription, setFormDescription] = useState("");
  const [formShowInClaims, setFormShowInClaims] = useState(false);
  const [formEnablePayments, setFormEnablePayments] = useState(false);
  const [formError, setFormError] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestoreDefaults = async () => {
    setIsRestoring(true);
    try {
      const res = await fetch("/api/finance/account-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore-defaults" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore defaults");
      toast.success(data.message || "Standard default account types loaded.");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to restore default types");
    } finally {
      setIsRestoring(false);
    }
  };

  const filteredSubtypes = useMemo(() => {
    return subtypes.filter((item) => {
      const matchesTab = activeTab === "ALL" || item.type === activeTab;
      const matchesSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
      return matchesTab && matchesSearch;
    });
  }, [subtypes, activeTab, search]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormName("");
    setFormType(activeTab !== "ALL" ? (activeTab as any) : "EXPENSE");
    setFormCashFlow("Operating");
    setFormDescription("");
    setFormShowInClaims(false);
    setFormEnablePayments(false);
    setFormError("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: AccountSubtypeItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormType(item.type);
    setFormCashFlow(item.cashFlowType || "Operating");
    setFormDescription(item.description || "");
    setFormShowInClaims(Boolean(item.showInExpenseClaims));
    setFormEnablePayments(Boolean(item.enablePayments));
    setFormError("");
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Name is required");
      return;
    }

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          data: {
            name: formName.trim(),
            type: formType,
            cashFlowType: formCashFlow,
            description: formDescription.trim() || null,
            showInExpenseClaims: formShowInClaims,
            enablePayments: formEnablePayments,
          },
        });
        toast.success(`Account type "${formName}" updated.`);
      } else {
        const created = await createMutation.mutateAsync({
          name: formName.trim(),
          type: formType,
          cashFlowType: formCashFlow,
          description: formDescription.trim() || null,
          showInExpenseClaims: formShowInClaims,
          enablePayments: formEnablePayments,
        });
        toast.success(`Account type "${formName}" created.`);
        if (onSelectType) {
          onSelectType(created);
        }
      }
      setIsFormOpen(false);
      refetch();
    } catch (err: any) {
      setFormError(err.message || "Failed to save account type");
    }
  };

  const handleDelete = async (item: AccountSubtypeItem) => {
    const usage = item.usageCount || 0;
    const confirmMsg =
      usage > 0
        ? `Account type "${item.name}" is currently used by ${usage} account(s). Deleting it will clear the subtype for those accounts. Continue?`
        : `Are you sure you want to delete account type "${item.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteMutation.mutateAsync(item.id);
      toast.success(`Account type "${item.name}" deleted.`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account type");
    }
  };

  if (!isOpen) return null;

  const typeColor = (t: string) => {
    switch (t) {
      case "ASSET":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "LIABILITY":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "EQUITY":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "REVENUE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "EXPENSE":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5546FF]/10 text-[#5546FF] flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Manage Account Types</span>
                <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {subtypes.length} total
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Create, customize, edit, and delete account classification types across all financial categories.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isRestoring}
              onClick={handleRestoreDefaults}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Restore standard default types across Asset, Liability, Equity, Revenue, Expense"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRestoring ? "animate-spin" : ""}`} />
              <span>{isRestoring ? "Loading..." : "Load Defaults"}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 rounded-lg bg-[#5546FF] hover:bg-[#4837F0] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Type</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar & Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {["ALL", "ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {tab === "ALL" ? "All Categories" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-[#5546FF] transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Subtypes Table Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-xs">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading account types...</div>
          ) : filteredSubtypes.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-slate-500">
                No account types found in {activeTab === "ALL" ? "this filter" : activeTab}.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={isRestoring}
                  onClick={handleRestoreDefaults}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRestoring ? "animate-spin" : ""}`} />
                  <span>Load Standard Account Types</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="px-3.5 py-1.5 rounded-lg bg-[#5546FF] hover:bg-[#4837F0] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Custom Type</span>
                </button>
              </div>
            </div>
          ) : (
            filteredSubtypes.map((item) => (
              <div
                key={item.id}
                className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors group"
              >
                <div className="flex items-start gap-3 min-w-0 pr-4">
                  <div className="pt-0.5">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${typeColor(
                        item.type,
                      )}`}
                    >
                      {item.type}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 truncate">{item.name}</span>
                      {item.cashFlowType && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          {item.cashFlowType}
                        </span>
                      )}
                      {item.usageCount !== undefined && item.usageCount > 0 && (
                        <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                          Used in {item.usageCount} {item.usageCount === 1 ? "account" : "accounts"}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions: Edit & Delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#5546FF] hover:bg-indigo-50 transition-colors cursor-pointer"
                    title="Edit account type"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete account type"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Showing {filteredSubtypes.length} of {subtypes.length} account types
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Nested Form Modal: Create / Edit Account Type */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <form
            onSubmit={handleSaveForm}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900">
                {editingItem ? "Edit Account Type" : "Create New Account Type"}
              </h4>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Type Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Rent Expense, Marketing, Software"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 outline-none focus:border-[#5546FF] focus:ring-1 focus:ring-[#5546FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Classification Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 outline-none focus:border-[#5546FF] cursor-pointer"
                  >
                    <option value="ASSET">Asset</option>
                    <option value="LIABILITY">Liability</option>
                    <option value="EQUITY">Equity</option>
                    <option value="REVENUE">Revenue</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Cash Flow Type
                  </label>
                  <select
                    value={formCashFlow}
                    onChange={(e) => setFormCashFlow(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 outline-none focus:border-[#5546FF] cursor-pointer"
                  >
                    <option value="Operating">Operating</option>
                    <option value="Cash">Cash &amp; Cash Eq.</option>
                    <option value="Investing">Investing</option>
                    <option value="Financing">Financing</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Short description of this account type..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-900 outline-none focus:border-[#5546FF]"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formShowInClaims}
                    onChange={(e) => setFormShowInClaims(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#5546FF] focus:ring-[#5546FF] border-slate-300 cursor-pointer"
                  />
                  <span className="text-slate-700 font-medium">
                    Show in expense claims
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formEnablePayments}
                    onChange={(e) => setFormEnablePayments(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#5546FF] focus:ring-[#5546FF] border-slate-300 cursor-pointer"
                  />
                  <span className="text-slate-700 font-medium">
                    Enable payments on this type
                  </span>
                </label>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#5546FF] hover:bg-[#4837F0] rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingItem
                    ? "Update Type"
                    : "Create Type"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AccountTypesManagerModal;
