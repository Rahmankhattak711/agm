"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Search,
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

  const getTypeStyle = (t: string): React.CSSProperties => {
    switch (t) {
      case "ASSET":
        return { backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #93c5fd" };
      case "LIABILITY":
        return { backgroundColor: "#fff1f2", color: "#be123c", border: "1px solid #fda4af" };
      case "EQUITY":
        return { backgroundColor: "#fefce8", color: "#a16207", border: "1px solid #fde047" };
      case "REVENUE":
        return { backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #86efac" };
      case "EXPENSE":
        return { backgroundColor: "#fff7ed", color: "#c2410c", border: "1px solid #fdba74" };
      default:
        return { backgroundColor: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1" };
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        style={{ border: "1px solid #cbd5e1" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (Soft Light-Blue matching Fixed Assets) */}
        <div
          className="px-5 py-3.5 flex items-center justify-between shrink-0"
          style={{
            backgroundColor: "#f4f7fb",
            borderBottom: "1px solid #cbd5e1",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "#dbeafe",
                color: "#1d4ed8",
                border: "1px solid #93c5fd",
              }}
            >
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <span>Manage Account Types</span>
                <span
                  style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                  className="text-[10.5px] font-normal text-slate-500 px-2 py-0.5 rounded-full"
                >
                  {subtypes.length} total
                </span>
              </h3>
              <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                Create, customize, edit, and delete account classification types across all financial categories.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isRestoring}
              onClick={handleRestoreDefaults}
              style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 text-[11.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Restore standard default types across Asset, Liability, Equity, Revenue, Expense"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRestoring ? "animate-spin" : ""}`} />
              <span>{isRestoring ? "Loading..." : "Load Defaults"}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              style={{
                backgroundColor: "#1d4ed8",
                color: "#ffffff",
                border: "1px solid #1e40af",
              }}
              className="px-3.5 py-1.5 rounded-lg text-[11.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Type</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar & Tabs */}
        <div
          className="px-5 py-2.5 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0"
          style={{ borderBottom: "1px solid #e2e8f0" }}
        >
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {["ALL", "ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map((tab) => {
              const isSelected = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={
                    isSelected
                      ? { backgroundColor: "#1d4ed8", color: "#ffffff" }
                      : { backgroundColor: "transparent", color: "#475569" }
                  }
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap hover:bg-slate-100"
                >
                  {tab === "ALL" ? "All Categories" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
              className="w-full pl-8 pr-7 py-1 text-xs font-normal text-slate-700 rounded-lg outline-none focus:border-blue-600 transition-all"
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
            <div className="p-8 text-center text-slate-400 font-normal">Loading account types...</div>
          ) : filteredSubtypes.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-slate-500 font-normal">
                No account types found in {activeTab === "ALL" ? "this filter" : activeTab}.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={isRestoring}
                  onClick={handleRestoreDefaults}
                  style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                  className="px-3.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRestoring ? "animate-spin" : ""}`} />
                  <span>Load Standard Account Types</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  style={{
                    backgroundColor: "#1d4ed8",
                    color: "#ffffff",
                    border: "1px solid #1e40af",
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
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
                className="px-5 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0 pr-4">
                  <div className="pt-0.5">
                    <span
                      style={getTypeStyle(item.type)}
                      className="inline-block text-[9.5px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider"
                    >
                      {item.type}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 truncate">{item.name}</span>
                      {item.cashFlowType && (
                        <span
                          style={{
                            backgroundColor: "#f8fafc",
                            color: "#475569",
                            border: "1px solid #cbd5e1",
                          }}
                          className="text-[9.5px] font-normal px-2 py-0.5 rounded-full"
                        >
                          {item.cashFlowType}
                        </span>
                      )}
                      {item.usageCount !== undefined && item.usageCount > 0 && (
                        <span
                          style={{
                            backgroundColor: "#eff6ff",
                            color: "#1d4ed8",
                            border: "1px solid #93c5fd",
                          }}
                          className="text-[9.5px] font-normal px-2 py-0.5 rounded-full"
                        >
                          Used in {item.usageCount} {item.usageCount === 1 ? "account" : "accounts"}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] font-normal text-slate-500 truncate mt-0.5">
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
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Edit account type"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
        <div
          className="px-5 py-2.5 flex items-center justify-between text-xs text-slate-500 font-normal shrink-0"
          style={{
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #cbd5e1",
          }}
        >
          <span>
            Showing {filteredSubtypes.length} of {subtypes.length} account types
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
            className="px-3.5 py-1.5 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Nested Form Modal: Create / Edit Account Type */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-100">
          <form
            onSubmit={handleSaveForm}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-100"
            style={{ border: "1px solid #cbd5e1" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-5 py-3.5 flex items-center justify-between"
              style={{
                backgroundColor: "#f4f7fb",
                borderBottom: "1px solid #cbd5e1",
              }}
            >
              <h4 className="text-sm font-semibold text-slate-800">
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
                <label className="block text-slate-600 font-medium mb-1">
                  Type Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="e.g. Rent Expense, Marketing, Software"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                  className="w-full px-3 py-2 rounded-lg font-normal text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Classification Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                    className="w-full px-3 py-2 rounded-lg font-normal text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="ASSET">Asset</option>
                    <option value="LIABILITY">Liability</option>
                    <option value="EQUITY">Equity</option>
                    <option value="REVENUE">Revenue</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Cash Flow Type
                  </label>
                  <select
                    value={formCashFlow}
                    onChange={(e) => setFormCashFlow(e.target.value)}
                    style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                    className="w-full px-3 py-2 rounded-lg font-normal text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
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
                <label className="block text-slate-600 font-medium mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Short description of this account type..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                  className="w-full px-3 py-2 rounded-lg font-normal text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formShowInClaims}
                    onChange={(e) => setFormShowInClaims(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-600 border-slate-300 cursor-pointer"
                  />
                  <span className="text-slate-700 font-normal">
                    Show in expense claims
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formEnablePayments}
                    onChange={(e) => setFormEnablePayments(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-600 border-slate-300 cursor-pointer"
                  />
                  <span className="text-slate-700 font-normal">
                    Enable payments on this type
                  </span>
                </label>
              </div>
            </div>

            <div
              className="px-5 py-3 flex items-center justify-end gap-2"
              style={{
                backgroundColor: "#f8fafc",
                borderTop: "1px solid #cbd5e1",
              }}
            >
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                style={{
                  backgroundColor: "#1d4ed8",
                  color: "#ffffff",
                  border: "1px solid #1e40af",
                }}
                className="px-4 py-1.5 text-xs font-medium rounded-lg cursor-pointer disabled:opacity-50"
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
