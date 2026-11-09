"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Scale,
  Folder,
  Search,
  Check,
  ChevronDown,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  SlidersHorizontal,
  ShieldCheck,
  FileText,
  Layers,
  Lock,
  Tag,
} from "lucide-react";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  ChartOfAccount,
} from "@/lib/hooks/api-hooks";
import {
  useAccountSubtypes,
  useCreateAccountSubtype,
  useDeleteAccountSubtype,
} from "@/lib/hooks/finance-hooks";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import {
  AccountSubtypeDef,
  getSubtypesForParent,
} from "../components/AccountSlideOverDrawer";
import { AccountTypesManagerModal } from "../components/AccountTypesManagerModal";

const INPUT_STYLE: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  backgroundColor: "#ffffff",
};

function CreateOrEditAccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentIdParam = searchParams.get("parentId");
  const editIdParam = searchParams.get("editId");

  const { isSuperAdmin, hasRole } = useAuth();
  const isFinancialUser = isSuperAdmin || hasRole("ADMIN", "ACCOUNTANT");

  const { data: allAccounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();
  const deleteAccountMutation = useDeleteAccount();

  const { data: dbSubtypesRaw = [] } = useAccountSubtypes();
  const createSubtypeMutation = useCreateAccountSubtype();
  const deleteSubtypeMutation = useDeleteAccountSubtype();

  const editingAccount = useMemo(() => {
    if (!editIdParam) return null;
    return allAccounts.find((a) => a.id === editIdParam) || null;
  }, [allAccounts, editIdParam]);

  const mode: "CREATE" | "EDIT" = editIdParam ? "EDIT" : "CREATE";

  // Core Form State
  const [parentId, setParentId] = useState<string>("");
  const [accountType, setAccountType] = useState<string>("");
  const [type, setType] = useState<
    "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"
  >("ASSET");
  const [accountCode, setAccountCode] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [cashFlowType, setCashFlowType] = useState<string>("Operating");
  const [allowPosting, setAllowPosting] = useState<boolean>(true);
  const [enablePayments, setEnablePayments] = useState<boolean>(false);
  const [showInExpenseClaims, setShowInExpenseClaims] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Dropdown UI State
  const [isParentDropdownOpen, setIsParentDropdownOpen] = useState<boolean>(false);
  const [parentSearch, setParentSearch] = useState<string>("");
  const parentDropdownRef = useRef<HTMLDivElement>(null);

  const [isSubtypeDropdownOpen, setIsSubtypeDropdownOpen] = useState<boolean>(false);
  const [subtypeSearch, setSubtypeSearch] = useState<string>("");
  const subtypeDropdownRef = useRef<HTMLDivElement>(null);

  // Modals State
  const [isAccountTypesModalOpen, setIsAccountTypesModalOpen] = useState<boolean>(false);
  const [isCreateTypeModalOpen, setIsCreateTypeModalOpen] = useState<boolean>(false);
  const [modalTypeName, setModalTypeName] = useState<string>("");
  const [modalCashFlow, setModalCashFlow] = useState<string>("Operating");
  const [modalShowInClaims, setModalShowInClaims] = useState<boolean>(true);
  const [modalEnablePayments, setModalEnablePayments] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>("");
  const [initialized, setInitialized] = useState<boolean>(false);

  const isTargetLevel1 = mode === "EDIT" ? editingAccount?.level === 1 : false;
  const isLockedForCurrentUser = isTargetLevel1 && !isSuperAdmin;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        parentDropdownRef.current &&
        !parentDropdownRef.current.contains(e.target as Node)
      ) {
        setIsParentDropdownOpen(false);
      }
      if (
        subtypeDropdownRef.current &&
        !subtypeDropdownRef.current.contains(e.target as Node)
      ) {
        setIsSubtypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize form from query params once accounts are loaded
  useEffect(() => {
    if (initialized || allAccounts.length === 0) return;

    if (mode === "EDIT" && editingAccount) {
      setParentId(editingAccount.parentId || "");
      setAccountCode(editingAccount.accountCode || "");
      setAccountName(editingAccount.accountName || "");
      setType(editingAccount.type);
      setAccountType((editingAccount as any).accountSubtype || "");
      setCashFlowType((editingAccount as any).cashFlowType || "Operating");
      setAllowPosting((editingAccount as any).allowPosting ?? true);
      setEnablePayments((editingAccount as any).enablePayments ?? false);
      setShowInExpenseClaims((editingAccount as any).showInExpenseClaims ?? false);
      setIsActive(editingAccount.isActive ?? true);
      setInitialized(true);
    } else if (mode === "CREATE") {
      if (parentIdParam) {
        const parent = allAccounts.find(
          (a) => a.id === parentIdParam && (a.level || 1) >= 2,
        );
        if (parent) {
          setParentId(parent.id);
          setType(parent.type);
          const siblings = allAccounts.filter((a) => a.parentId === parent.id);
          setAccountCode(`${parent.accountCode}${siblings.length + 1}`);
          setCashFlowType(parent.cashFlowType || "Operating");
        }
      }
      setInitialized(true);
    }
  }, [allAccounts, initialized, mode, editingAccount, parentIdParam]);

  // Group eligible parents (Level 2 & Level 3) by Root Category
  const parentCategoryGroups = useMemo(() => {
    const CATEGORIES: Array<{
      type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
      name: string;
      headerStyle: React.CSSProperties;
    }> = [
      {
        type: "ASSET",
        name: "Assets",
        headerStyle: {
          backgroundColor: "#eff6ff",
          color: "#1e40af",
          border: "1px solid #bfdbfe",
        },
      },
      {
        type: "LIABILITY",
        name: "Liabilities",
        headerStyle: {
          backgroundColor: "#fff1f2",
          color: "#9f1239",
          border: "1px solid #fecdd3",
        },
      },
      {
        type: "EQUITY",
        name: "Equity",
        headerStyle: {
          backgroundColor: "#fefce8",
          color: "#854d0e",
          border: "1px solid #fef08a",
        },
      },
      {
        type: "REVENUE",
        name: "Revenue / Income",
        headerStyle: {
          backgroundColor: "#f0fdf4",
          color: "#166534",
          border: "1px solid #bbf7d0",
        },
      },
      {
        type: "EXPENSE",
        name: "Expenses",
        headerStyle: {
          backgroundColor: "#fff7ed",
          color: "#9a3412",
          border: "1px solid #fed7aa",
        },
      },
    ];

    const q = parentSearch.toLowerCase().trim();

    return CATEGORIES.map((cat) => {
      const catAccounts = allAccounts.filter(
        (a) =>
          a.type === cat.type &&
          (mode !== "EDIT" || a.id !== editingAccount?.id) &&
          (a.level === 2 || a.level === 3),
      );

      const lvl2List = catAccounts
        .filter((a) => a.level === 2)
        .sort((x, y) =>
          x.accountCode.localeCompare(y.accountCode, undefined, { numeric: true }),
        );

      const groups = lvl2List.map((lvl2) => {
        const lvl3List = catAccounts
          .filter((a) => a.level === 3 && a.parentId === lvl2.id)
          .sort((x, y) =>
            x.accountCode.localeCompare(y.accountCode, undefined, { numeric: true }),
          );

        const lvl2Matches =
          !q ||
          lvl2.accountCode.toLowerCase().includes(q) ||
          lvl2.accountName.toLowerCase().includes(q);

        const matchingLvl3 = lvl3List.filter(
          (l3) =>
            !q ||
            lvl2Matches ||
            l3.accountCode.toLowerCase().includes(q) ||
            l3.accountName.toLowerCase().includes(q),
        );

        return {
          lvl2,
          lvl3List: matchingLvl3,
          isMatch: lvl2Matches || matchingLvl3.length > 0,
        };
      });

      const matchingGroups = groups
        .filter((g) => g.isMatch)
        .map(({ lvl2, lvl3List }) => ({ lvl2, lvl3List }));

      return {
        ...cat,
        groups: matchingGroups,
        totalCount: matchingGroups.reduce(
          (acc, g) => acc + 1 + g.lvl3List.length,
          0,
        ),
      };
    }).filter((cat) => cat.groups.length > 0);
  }, [allAccounts, mode, editingAccount, parentSearch]);

  const selectedParent = useMemo(() => {
    return allAccounts.find((a) => a.id === parentId) || null;
  }, [allAccounts, parentId]);

  const dbSubtypes = useMemo<AccountSubtypeDef[]>(() => {
    return (dbSubtypesRaw || []).map((st) => ({
      id: st.id,
      label: st.name,
      type: st.type,
      cashFlow: st.cashFlowType || "Operating",
      parentPrefixes: st.parentCodePrefix
        ? st.parentCodePrefix.split(",").map((p) => p.trim())
        : [],
      enablePayments: st.enablePayments,
      showInExpenseClaims: st.showInExpenseClaims,
      description: st.description || undefined,
      isSystem: st.isSystem,
    }));
  }, [dbSubtypesRaw]);

  const availableSubtypes = useMemo(() => {
    return getSubtypesForParent(selectedParent, dbSubtypes);
  }, [selectedParent, dbSubtypes]);

  const filteredSubtypes = useMemo(() => {
    const q = subtypeSearch.toLowerCase().trim();
    if (!q) return availableSubtypes;
    return availableSubtypes.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)),
    );
  }, [availableSubtypes, subtypeSearch]);

  const handleSelectParent = (parent: ChartOfAccount) => {
    setParentId(parent.id);
    setType(parent.type);
    setIsParentDropdownOpen(false);
    setParentSearch("");
    setIsSubtypeDropdownOpen(false);
    setSubtypeSearch("");

    if (parent.cashFlowType) {
      setCashFlowType(parent.cashFlowType);
    } else if (
      parent.type === "ASSET" &&
      (parent.accountCode.startsWith("111") ||
        parent.accountName.toLowerCase().includes("cash") ||
        parent.accountName.toLowerCase().includes("bank"))
    ) {
      setCashFlowType("Cash");
    } else {
      setCashFlowType("Operating");
    }

    const newSubtypes = getSubtypesForParent(parent, dbSubtypes);
    const match = newSubtypes.find((s) => s.label === accountType);
    if (!match) {
      setAccountType("");
    }

    if (mode === "CREATE") {
      const siblings = allAccounts.filter((a) => a.parentId === parent.id);
      const lastNum = siblings.length + 1;
      setAccountCode(`${parent.accountCode}${lastNum}`);
    }
  };

  const handleSelectSubtype = (sub: AccountSubtypeDef) => {
    setAccountType(sub.label);
    setType(sub.type);
    setCashFlowType(sub.cashFlow);
    if (sub.enablePayments !== undefined) {
      setEnablePayments(sub.enablePayments);
    }
    if (sub.showInExpenseClaims !== undefined) {
      setShowInExpenseClaims(sub.showInExpenseClaims);
    }
    if (!accountName.trim() || accountName === accountType) {
      setAccountName(sub.label);
    }
    setIsSubtypeDropdownOpen(false);
    setSubtypeSearch("");
  };

  const handleCreateCustomCategory = async (
    name: string,
    cashFlowChoice?: string,
    claimsChoice?: boolean,
    paymentsChoice?: boolean,
  ) => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Please enter a valid account type name.");
      return;
    }
    if (!selectedParent) {
      toast.error("Please select a parent account first.");
      return;
    }

    const cf = cashFlowChoice || selectedParent.cashFlowType || "Operating";
    const inClaims =
      claimsChoice !== undefined ? claimsChoice : selectedParent.type === "EXPENSE";
    const enPayments =
      paymentsChoice !== undefined ? paymentsChoice : cf === "Cash";

    try {
      const created = await createSubtypeMutation.mutateAsync({
        name: trimmed,
        type: selectedParent.type,
        cashFlowType: cf,
        showInExpenseClaims: inClaims,
        enablePayments: enPayments,
        parentCodePrefix: selectedParent.accountCode,
      });

      const newSub: AccountSubtypeDef = {
        id: created.id,
        label: created.name,
        type: created.type,
        cashFlow: created.cashFlowType || cf,
        parentPrefixes: [selectedParent.accountCode],
        description:
          created.description ||
          `Custom account type under ${selectedParent.accountName}`,
        showInExpenseClaims: created.showInExpenseClaims,
        enablePayments: created.enablePayments,
        isSystem: false,
      };

      handleSelectSubtype(newSub);
      setIsCreateTypeModalOpen(false);
      setModalTypeName("");
      setSubtypeSearch("");
      toast.success(`Account type "${trimmed}" created and selected.`);
    } catch (err: any) {
      toast.error(`Error creating account type: ${err.message}`);
    }
  };

  const targetLevel =
    mode === "EDIT" && editingAccount
      ? editingAccount.level || 1
      : selectedParent
        ? (selectedParent.level || 1) + 1
        : 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (isLockedForCurrentUser) {
      setFormError(
        "Level 1 system accounts are locked. Only Super Admin can modify them.",
      );
      return;
    }

    if (mode === "CREATE") {
      if (!parentId || !selectedParent) {
        setFormError(
          "Please select a Parent Account (Level 2 Group or Level 3 Sub-group).",
        );
        return;
      }
      if (selectedParent.level === 1) {
        setFormError(
          "Level 1 root categories cannot be used directly as a parent account.",
        );
        return;
      }
    }

    if (!accountName.trim()) {
      setFormError("Please enter an Account Name.");
      return;
    }

    if (!accountCode.trim()) {
      setFormError("Please enter an Account Code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        accountCode: accountCode.trim(),
        accountName: accountName.trim(),
        nameAr: null,
        type: selectedParent ? selectedParent.type : type,
        parentId: selectedParent
          ? selectedParent.id
          : editingAccount
            ? editingAccount.parentId
            : null,
        accountSubtype: accountType.trim() || null,
        cashFlowType: cashFlowType || "Operating",
        allowPosting,
        enablePayments,
        showInExpenseClaims,
        level: targetLevel,
        isActive,
      };

      if (mode === "EDIT" && editingAccount) {
        await updateAccountMutation.mutateAsync({
          id: editingAccount.id,
          data: payload,
        });
        toast.success(`Account "${payload.accountCode} - ${payload.accountName}" updated!`);
      } else {
        await createAccountMutation.mutateAsync(payload as any);
        toast.success(`Account "${payload.accountCode} - ${payload.accountName}" created!`);
      }

      router.push("/finance/accounts");
    } catch (err: any) {
      setFormError(err.message || "Failed to save account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingAccount) return;
    if (editingAccount.level === 1) {
      toast.error("Level 1 root categories cannot be deleted.");
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to delete account "${editingAccount.accountCode} - ${editingAccount.accountName}"?`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccountMutation.mutateAsync(editingAccount.id);
      toast.success(`Account "${editingAccount.accountCode}" deleted.`);
      router.push("/finance/accounts");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="w-full min-h-full font-sans text-slate-700 px-3 sm:px-6 py-4"
      style={{ backgroundColor: "#eef2f6" }}
    >
      <div className="max-w-5xl mx-auto space-y-4">
        {/* =========================================================================
            TOP HEADER CARD (RESPONSIVE, MATCHING FIXED ASSETS NEW PAGE)
            ========================================================================= */}
        <div
          className="bg-white rounded-2xl px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            border: "1px solid #cbd5e1",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => router.push("/finance/accounts")}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              style={{ border: "1px solid #cbd5e1" }}
              title="Back to Chart of Accounts"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "#dbeafe",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
              }}
            >
              <Scale className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-[15px] font-semibold text-slate-900 truncate">
                {mode === "EDIT" ? "Edit Account" : "Create Account"}
              </h1>
              <p className="text-[11px] font-normal text-slate-500 truncate">
                Parent hierarchy, account classification, cash flow mapping, and ledger permissions in one clean flow.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsAccountTypesModalOpen(true)}
              style={{ border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
              className="px-3 py-1 rounded-lg hover:bg-slate-50 text-slate-600 text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Tag className="w-3 h-3 text-slate-500" />
              <span>Account Types</span>
            </button>

            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium"
              style={{
                backgroundColor: "#ecfdf5",
                color: "#047857",
                border: "1px solid #6ee7b7",
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
              <span>Secure ledger record</span>
            </span>
          </div>
        </div>

        {/* Error / Lock Banners */}
        {isLockedForCurrentUser && (
          <div
            className="px-4 py-3 rounded-xl text-xs font-normal flex items-center gap-2"
            style={{
              backgroundColor: "#fefce8",
              color: "#854d0e",
              border: "1px solid #fde047",
            }}
          >
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Level 1 root category accounts are protected. Only Super Admin can modify them.
            </span>
          </div>
        )}

        {formError && (
          <div
            className="px-4 py-3 rounded-xl text-xs font-medium"
            style={{
              backgroundColor: "#fff1f2",
              color: "#be123c",
              border: "1px solid #fda4af",
            }}
          >
            {formError}
          </div>
        )}

        {/* =========================================================================
            TWO-COLUMN RESPONSIVE FORM + STICKY SUMMARY SIDEBAR
            ========================================================================= */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4"
          style={{ position: "relative" }}
        >
          {/* LEFT COLUMN: FORM SECTIONS */}
          <div className="lg:col-span-8 space-y-4">
            {/* SECTION 1: Type of Account & Classification (Soft Blue Header) */}
            <div
              className="bg-white rounded-2xl overflow-visible"
              style={{
                border: "1px solid #cbd5e1",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              }}
            >
              <div
                className="px-5 py-3 flex items-center justify-between rounded-t-2xl"
                style={{
                  backgroundColor: "#f0f7ff",
                  borderBottom: "1px solid #dbeafe",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: "#dbeafe",
                      color: "#1d4ed8",
                    }}
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-xs font-semibold text-slate-800">
                    Type of Account &amp; Classification
                  </h2>
                </div>
                <span className="text-[11px] font-normal text-slate-500">Required</span>
              </div>

              <div className="p-4 sm:p-5 space-y-4">
                {/* Parent Account Combobox */}
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1.5">
                    Parent Account <span className="text-rose-500">*</span>
                  </label>

                  <div className="relative w-full" ref={parentDropdownRef}>
                    <button
                      type="button"
                      disabled={isLoadingAccounts || isTargetLevel1}
                      onClick={() => {
                        setIsParentDropdownOpen((prev) => !prev);
                        setIsSubtypeDropdownOpen(false);
                      }}
                      style={INPUT_STYLE}
                      className="w-full px-3.5 py-2.5 rounded-lg text-xs flex items-center justify-between text-left transition-all cursor-pointer hover:border-blue-600 disabled:opacity-60"
                    >
                      {selectedParent ? (
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <span
                            style={{
                              backgroundColor: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #93c5fd",
                            }}
                            className="font-mono font-medium px-2 py-0.5 rounded text-[11px] shrink-0"
                          >
                            {selectedParent.accountCode}
                          </span>
                          <span className="text-slate-800 font-medium truncate">
                            {selectedParent.accountName}
                          </span>
                          <span
                            style={{
                              backgroundColor: "#f8fafc",
                              color: "#475569",
                              border: "1px solid #cbd5e1",
                            }}
                            className="text-[9.5px] px-2 py-0.5 rounded-full font-normal shrink-0"
                          >
                            {selectedParent.level === 2
                              ? "Level 2 Group"
                              : "Level 3 Sub-group"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">
                          {isLoadingAccounts
                            ? "Loading parent groups..."
                            : "Select parent group or sub-group..."}
                        </span>
                      )}
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    </button>

                    {/* Parent Dropdown Menu */}
                    {isParentDropdownOpen && (
                      <div
                        className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                        style={{ border: "1px solid #cbd5e1" }}
                      >
                        <div
                          className="p-2.5 flex items-center gap-2"
                          style={{
                            backgroundColor: "#f4f7fb",
                            borderBottom: "1px solid #cbd5e1",
                          }}
                        >
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                          <input
                            type="text"
                            autoFocus
                            placeholder="Search parent group by code or name..."
                            value={parentSearch}
                            onChange={(e) => setParentSearch(e.target.value)}
                            className="w-full bg-transparent text-xs font-normal text-slate-800 placeholder:text-slate-400 outline-none"
                          />
                          {parentSearch && (
                            <button
                              type="button"
                              onClick={() => setParentSearch("")}
                              className="p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="max-h-72 overflow-y-auto p-1.5 divide-y divide-slate-100 custom-scrollbar text-xs">
                          {parentCategoryGroups.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 font-normal">
                              No matching parent groups found
                            </div>
                          ) : (
                            parentCategoryGroups.map((cat) => (
                              <div key={cat.type} className="pb-1.5">
                                <div
                                  style={cat.headerStyle}
                                  className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider flex items-center justify-between rounded-md my-1"
                                >
                                  <span>{cat.name}</span>
                                  <span className="text-[9.5px] font-normal">
                                    {cat.totalCount} {cat.totalCount === 1 ? "group" : "groups"}
                                  </span>
                                </div>

                                <div className="space-y-0.5">
                                  {cat.groups.map(({ lvl2, lvl3List }) => {
                                    const isLvl2Selected = lvl2.id === parentId;
                                    return (
                                      <div key={lvl2.id} className="space-y-0.5">
                                        <button
                                          type="button"
                                          onClick={() => handleSelectParent(lvl2)}
                                          className={`w-full px-2.5 py-1.5 flex items-center justify-between text-left rounded-lg transition-colors cursor-pointer ${
                                            isLvl2Selected
                                              ? "bg-blue-50 text-blue-900 font-medium ring-1 ring-blue-300"
                                              : "hover:bg-slate-50 text-slate-800 font-medium"
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 truncate">
                                            <Folder className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                            <span className="font-mono font-medium text-slate-800 text-xs">
                                              {lvl2.accountCode}
                                            </span>
                                            <span className="truncate">{lvl2.accountName}</span>
                                          </div>

                                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                            <span className="text-[9px] px-1.5 py-0.5 rounded font-normal bg-blue-50 text-blue-700 border border-blue-200">
                                              Level 2 Group
                                            </span>
                                            {isLvl2Selected && (
                                              <Check className="w-3.5 h-3.5 text-blue-600" />
                                            )}
                                          </div>
                                        </button>

                                        {lvl3List.map((lvl3) => {
                                          const isLvl3Selected = lvl3.id === parentId;
                                          return (
                                            <button
                                              key={lvl3.id}
                                              type="button"
                                              onClick={() => handleSelectParent(lvl3)}
                                              className={`w-full pl-6 pr-2.5 py-1.5 flex items-center justify-between text-left rounded-lg transition-colors cursor-pointer ${
                                                isLvl3Selected
                                                  ? "bg-blue-50 text-blue-900 font-medium ring-1 ring-blue-300"
                                                  : "hover:bg-slate-50 text-slate-700 font-normal"
                                              }`}
                                            >
                                              <div className="flex items-center gap-1.5 truncate">
                                                <span className="text-slate-300 font-mono text-[11px] select-none shrink-0">
                                                  └─
                                                </span>
                                                <span className="font-mono font-medium text-slate-700 text-xs">
                                                  {lvl3.accountCode}
                                                </span>
                                                <span className="truncate font-normal">
                                                  {lvl3.accountName}
                                                </span>
                                              </div>

                                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                <span className="text-[9px] px-1.5 py-0.5 rounded font-normal bg-slate-100 text-slate-600 border border-slate-200">
                                                  Level 3 Sub-group
                                                </span>
                                                {isLvl3Selected && (
                                                  <Check className="w-3.5 h-3.5 text-blue-600" />
                                                )}
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Type / Classification Combobox */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-medium text-slate-600">
                      Account Type / Classification{" "}
                      <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    {selectedParent && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalTypeName("");
                          setModalCashFlow(selectedParent.cashFlowType || "Operating");
                          setModalShowInClaims(selectedParent.type === "EXPENSE");
                          setModalEnablePayments(false);
                          setIsCreateTypeModalOpen(true);
                        }}
                        style={{ color: "#1d4ed8" }}
                        className="text-[11px] font-medium hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>New Account Type</span>
                      </button>
                    )}
                  </div>

                  <div className="relative w-full" ref={subtypeDropdownRef}>
                    <button
                      type="button"
                      disabled={!selectedParent}
                      onClick={() => {
                        setIsSubtypeDropdownOpen((prev) => !prev);
                        setIsParentDropdownOpen(false);
                      }}
                      style={INPUT_STYLE}
                      className="w-full px-3.5 py-2.5 rounded-lg text-xs flex items-center justify-between text-left transition-all cursor-pointer hover:border-blue-600 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {accountType ? (
                          <>
                            <span className="font-medium text-slate-800 truncate">
                              {accountType}
                            </span>
                            {cashFlowType && (
                              <span
                                style={{
                                  backgroundColor: "#f8fafc",
                                  color: "#475569",
                                  border: "1px solid #cbd5e1",
                                }}
                                className="text-[9.5px] font-normal px-2 py-0.5 rounded-full shrink-0"
                              >
                                {cashFlowType}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 font-normal">
                            {selectedParent
                              ? "None / General (Click to choose classification)"
                              : "Select a parent account first"}
                          </span>
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    </button>

                    {isSubtypeDropdownOpen && selectedParent && (
                      <div
                        className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                        style={{ border: "1px solid #cbd5e1" }}
                      >
                        <div
                          className="p-2 flex items-center gap-2"
                          style={{
                            backgroundColor: "#f4f7fb",
                            borderBottom: "1px solid #cbd5e1",
                          }}
                        >
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                          <input
                            type="text"
                            autoFocus
                            placeholder="Filter or type a new classification..."
                            value={subtypeSearch}
                            onChange={(e) => setSubtypeSearch(e.target.value)}
                            className="w-full bg-transparent text-xs font-normal text-slate-800 placeholder:text-slate-400 outline-none"
                          />
                          {subtypeSearch && (
                            <button
                              type="button"
                              onClick={() => setSubtypeSearch("")}
                              className="p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div className="p-1 border-b border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setAccountType("");
                              setIsSubtypeDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-1.5 flex items-center justify-between text-left rounded-lg transition-colors cursor-pointer ${
                              !accountType
                                ? "bg-slate-100 text-slate-800 font-medium"
                                : "hover:bg-slate-50 text-slate-600 font-normal"
                            }`}
                          >
                            <span className="text-xs text-slate-500">
                              None / General (No specific subtype)
                            </span>
                            {!accountType && (
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </button>
                        </div>

                        {subtypeSearch.trim() &&
                          !availableSubtypes.some(
                            (s) =>
                              s.label.toLowerCase() ===
                              subtypeSearch.trim().toLowerCase(),
                          ) && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCreateCustomCategory(subtypeSearch.trim())
                              }
                              className="w-full px-3 py-2 flex items-center justify-between text-left bg-blue-50/80 hover:bg-blue-100/80 text-blue-900 border-b border-blue-200 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span className="text-xs font-medium truncate">
                                  Add &ldquo;{subtypeSearch.trim()}&rdquo; as new
                                  classification
                                </span>
                              </div>
                              <span
                                style={{
                                  backgroundColor: "#1d4ed8",
                                  color: "#ffffff",
                                }}
                                className="text-[10px] px-2 py-0.5 rounded font-medium shrink-0"
                              >
                                + Add &amp; Select
                              </span>
                            </button>
                          )}

                        <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-100/60 custom-scrollbar text-xs">
                          {filteredSubtypes.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 font-normal">
                              No specific account types found for{" "}
                              {selectedParent.accountCode}
                            </div>
                          ) : (
                            filteredSubtypes.map((sub) => {
                              const isSelected = sub.label === accountType;
                              return (
                                <div
                                  key={sub.id || sub.label}
                                  onClick={() => handleSelectSubtype(sub)}
                                  className={`w-full px-3 py-2 flex items-center justify-between text-left rounded-lg transition-colors cursor-pointer group/item ${
                                    isSelected
                                      ? "bg-blue-50 text-blue-900 font-medium"
                                      : "hover:bg-slate-50 text-slate-700 font-normal"
                                  }`}
                                >
                                  <div className="truncate pr-2 flex-1">
                                    <div className="font-medium text-slate-800 text-xs truncate flex items-center gap-1.5">
                                      <span>{sub.label}</span>
                                      {sub.isSystem && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded font-normal bg-slate-100 text-slate-500">
                                          System
                                        </span>
                                      )}
                                    </div>
                                    {sub.description && (
                                      <div className="text-[10px] text-slate-400 truncate font-normal">
                                        {sub.description}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-normal bg-slate-100 text-slate-600 border border-slate-200">
                                      {sub.cashFlow}
                                    </span>
                                    {isSelected && (
                                      <Check className="w-3.5 h-3.5 text-blue-600" />
                                    )}
                                    {isFinancialUser && !sub.isSystem && sub.id && (
                                      <button
                                        type="button"
                                        title="Delete Account Type"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          if (
                                            window.confirm(
                                              `Delete Account Type "${sub.label}"?`,
                                            )
                                          ) {
                                            try {
                                              await deleteSubtypeMutation.mutateAsync(
                                                sub.id!,
                                              );
                                              if (accountType === sub.label)
                                                setAccountType("");
                                              toast.success(
                                                `Account Type "${sub.label}" deleted.`,
                                              );
                                            } catch (err: any) {
                                              toast.error(
                                                err.message ||
                                                  "Failed to delete account type",
                                              );
                                            }
                                          }
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded opacity-0 group-hover/item:opacity-100 transition-opacity"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        <div
                          className="p-2 flex flex-col sm:flex-row items-center justify-between gap-2"
                          style={{
                            backgroundColor: "#f8fafc",
                            borderTop: "1px solid #cbd5e1",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setModalTypeName(subtypeSearch || "");
                              setModalCashFlow(
                                selectedParent.cashFlowType || "Operating",
                              );
                              setModalShowInClaims(
                                selectedParent.type === "EXPENSE",
                              );
                              setModalEnablePayments(false);
                              setIsCreateTypeModalOpen(true);
                              setIsSubtypeDropdownOpen(false);
                            }}
                            style={{
                              backgroundColor: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #93c5fd",
                            }}
                            className="w-full sm:w-auto flex-1 py-1.5 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Create New Account Type</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsSubtypeDropdownOpen(false);
                              setIsAccountTypesModalOpen(true);
                            }}
                            style={{
                              border: "1px solid #cbd5e1",
                              backgroundColor: "#ffffff",
                            }}
                            className="w-full sm:w-auto py-1.5 px-3 text-[11px] font-normal text-slate-600 hover:bg-slate-50 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                            <span>Manage All ({dbSubtypes.length})</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Account Information (Soft Amber/Warm Header) */}
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{
                border: "1px solid #cbd5e1",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              }}
            >
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{
                  backgroundColor: "#fffbeb",
                  borderBottom: "1px solid #fef08a",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: "#fef3c7",
                      color: "#b45309",
                    }}
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-xs font-semibold text-slate-800">
                    Account Information
                  </h2>
                </div>
                <span className="text-[11px] font-normal text-slate-500">Required</span>
              </div>

              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Account Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g. Petty Cash - Operations Office"
                    required
                    style={INPUT_STYLE}
                    className="w-full rounded-lg px-3 py-2 text-xs font-normal text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Account Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountCode}
                    onChange={(e) => setAccountCode(e.target.value)}
                    placeholder="e.g. 1111"
                    required
                    style={INPUT_STYLE}
                    className="w-full rounded-lg px-3 py-2 text-xs font-mono font-normal text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Cash Flow Classification <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={cashFlowType}
                    onChange={(e) => setCashFlowType(e.target.value)}
                    style={INPUT_STYLE}
                    className="w-full rounded-lg px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
                  >
                    <option value="Operating">Operating Activities</option>
                    <option value="Cash">Cash &amp; Cash Equivalents</option>
                    <option value="Investing">Investing Activities</option>
                    <option value="Financing">Financing Activities</option>
                    <option value="None">None</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-[11px] font-normal text-slate-500">
                    Determines which section this account will appear in within the{" "}
                    <span style={{ color: "#1d4ed8" }} className="font-medium">
                      Cash Flow Statement
                    </span>{" "}
                    and financial rollups.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 3: How Can This Account Be Used? (Soft Mint/Green Header) */}
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{
                border: "1px solid #cbd5e1",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              }}
            >
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{
                  backgroundColor: "#f0fdf4",
                  borderBottom: "1px solid #bbf7d0",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: "#dcfce7",
                      color: "#15803d",
                    }}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-xs font-semibold text-slate-800">
                    How Can This Account Be Used?
                  </h2>
                </div>
                <span className="text-[11px] font-normal text-slate-500">
                  Ledger Controls
                </span>
              </div>

              <div className="p-4 sm:p-5 space-y-3">
                {/* Control 1: Allow posting */}
                <label
                  className="flex items-start gap-3 p-3 rounded-xl cursor-pointer select-none transition-colors"
                  style={{
                    backgroundColor: allowPosting ? "#f8faff" : "#f8fafc",
                    border: allowPosting
                      ? "1px solid #93c5fd"
                      : "1px solid #e2e8f0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allowPosting}
                    onChange={(e) => setAllowPosting(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <div className="font-medium text-slate-800 text-xs">
                      Allow posting to this account
                    </div>
                    <div className="text-[11px] font-normal text-slate-500">
                      Users in this organization will be allowed to select this account when creating journal entries, bills, or invoices.
                    </div>
                  </div>
                </label>

                {/* Control 2: Enable payments */}
                <label
                  className="flex items-start gap-3 p-3 rounded-xl cursor-pointer select-none transition-colors"
                  style={{
                    backgroundColor: enablePayments ? "#f8faff" : "#f8fafc",
                    border: enablePayments
                      ? "1px solid #93c5fd"
                      : "1px solid #e2e8f0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={enablePayments}
                    onChange={(e) => setEnablePayments(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <div className="font-medium text-slate-800 text-xs">
                      Enable account selection for payments
                    </div>
                    <div className="text-[11px] font-normal text-slate-500">
                      Allow this account to be selectable as a payment source/destination when recording customer or supplier payments.
                    </div>
                  </div>
                </label>

                {/* Control 3: Show in expense claims */}
                <label
                  className="flex items-start gap-3 p-3 rounded-xl cursor-pointer select-none transition-colors"
                  style={{
                    backgroundColor: showInExpenseClaims ? "#f8faff" : "#f8fafc",
                    border: showInExpenseClaims
                      ? "1px solid #93c5fd"
                      : "1px solid #e2e8f0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showInExpenseClaims}
                    onChange={(e) => setShowInExpenseClaims(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <div className="font-medium text-slate-800 text-xs">
                      Show account for employee expense claims
                    </div>
                    <div className="text-[11px] font-normal text-slate-500">
                      Make this account available as an option when employees or drivers submit expense claims and receipts.
                    </div>
                  </div>
                </label>

                {/* Edit Mode Status Toggle */}
                {mode === "EDIT" && (
                  <div
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <div>
                      <div className="font-medium text-slate-800 text-xs">
                        Account Status ({isActive ? "Active" : "Inactive"})
                      </div>
                      <div className="text-[11px] font-normal text-slate-500">
                        Inactive accounts cannot receive new transactions.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsActive((v) => !v)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isActive ? "bg-emerald-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY ACCOUNT SUMMARY SIDEBAR */}
          <div className="lg:col-span-4">
            <div
              className="space-y-3.5"
              style={{ position: "sticky", top: "16px", zIndex: 10 }}
            >
              {/* Summary Box */}
              <div
                className="bg-white rounded-2xl p-4 space-y-3"
                style={{
                  border: "1px solid #cbd5e1",
                  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                    ACCOUNT SUMMARY
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
                    {accountName.trim() || "New Ledger Account"}
                  </h3>
                </div>

                <div className="space-y-1.5">
                  <div
                    className="rounded-lg px-3 py-2 flex items-center justify-between text-xs"
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span className="font-normal text-slate-500">Account Code</span>
                    <span className="font-mono font-medium text-slate-800">
                      {accountCode.trim() || "Auto"}
                    </span>
                  </div>

                  <div
                    className="rounded-lg px-3 py-2 flex items-center justify-between text-xs gap-2"
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span className="font-normal text-slate-500 shrink-0">Pillar</span>
                    <span className="font-medium text-slate-800 truncate">
                      {selectedParent ? selectedParent.type : type}
                    </span>
                  </div>

                  <div
                    className="rounded-lg px-3 py-2 flex items-center justify-between text-xs gap-2"
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span className="font-normal text-slate-500 shrink-0">Parent</span>
                    <span className="font-normal text-slate-800 truncate">
                      {selectedParent
                        ? `${selectedParent.accountCode} - ${selectedParent.accountName}`
                        : "Not selected"}
                    </span>
                  </div>

                  <div
                    className="rounded-lg px-3 py-2 flex items-center justify-between text-xs gap-2"
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span className="font-normal text-slate-500 shrink-0">Cash Flow</span>
                    <span className="font-medium text-slate-800 truncate">
                      {cashFlowType}
                    </span>
                  </div>

                  <div
                    className="rounded-lg px-3 py-2 flex items-center justify-between text-xs"
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span className="font-normal text-slate-500">Hierarchy Level</span>
                    <span className="font-medium text-slate-800 text-[11px] uppercase">
                      LEVEL {targetLevel} {targetLevel >= 4 ? "(LEDGER)" : "(GROUP)"}
                    </span>
                  </div>
                </div>

                <div
                  className="rounded-xl p-3"
                  style={{
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <span
                    className="text-[9.5px] font-medium uppercase tracking-wider block"
                    style={{ color: "#1d4ed8" }}
                  >
                    CLASSIFICATION &amp; POSTING
                  </span>
                  <span className="text-sm font-semibold text-slate-900 block mt-0.5 truncate">
                    {accountType || "General Ledger Account"}
                  </span>
                  <span className="text-[10.5px] font-normal text-slate-500 block mt-0.5">
                    {allowPosting ? "Direct transaction posting enabled" : "Group summary only"}
                  </span>
                </div>
              </div>

              {/* Readiness Status Box */}
              <div
                className="rounded-2xl p-3.5"
                style={{
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #6ee7b7",
                }}
              >
                <div
                  className="flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: "#047857" }}
                >
                  <CheckCircle2
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: "#10b981" }}
                  />
                  <span>Ready to save account</span>
                </div>
                <p
                  className="text-[11px] font-normal mt-1 leading-relaxed"
                  style={{ color: "#065f46" }}
                >
                  Select a parent group, verify the auto-suggested account code, and click Save Account.
                </p>
              </div>

              {/* Submit, Cancel & Delete Box */}
              <div
                className="bg-white rounded-2xl p-3.5 space-y-2"
                style={{
                  border: "1px solid #cbd5e1",
                  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                }}
              >
                <button
                  type="submit"
                  disabled={isSubmitting || isLockedForCurrentUser}
                  className="w-full py-2.5 rounded-xl text-white text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  style={{
                    backgroundColor: "#1d4ed8",
                    color: "#ffffff",
                    border: "1px solid #1e40af",
                  }}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>
                    {isSubmitting
                      ? "Saving Account..."
                      : mode === "EDIT"
                        ? "Update Account"
                        : "Save Account"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/finance/accounts")}
                  className="w-full py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-xs font-normal transition-all cursor-pointer"
                  style={{ border: "1px solid #cbd5e1" }}
                >
                  Cancel
                </button>

                {mode === "EDIT" && editingAccount && editingAccount.level !== 1 && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    style={{
                      backgroundColor: "#fff1f2",
                      color: "#be123c",
                      border: "1px solid #fda4af",
                    }}
                    className="w-full py-2 rounded-xl text-xs font-medium hover:bg-rose-100/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? "Deleting..." : "Delete Account"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Modal: Create New Account Type */}
      {isCreateTypeModalOpen && selectedParent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
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
              <div>
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>Create New Account Type</span>
                </h3>
                <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                  Add a custom classification under {selectedParent.accountCode} -{" "}
                  {selectedParent.accountName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateTypeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-blue-900"
                style={{
                  backgroundColor: "#eff6ff",
                  border: "1px solid #93c5fd",
                }}
              >
                <span className="font-medium text-blue-700">Parent:</span>
                <span className="font-mono font-medium">
                  {selectedParent.accountCode}
                </span>
                <span className="text-slate-700 truncate">
                  {selectedParent.accountName}
                </span>
                <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-white text-blue-700 border border-blue-200">
                  {selectedParent.type}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 flex items-center justify-between">
                  <span>Account Type Name *</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    e.g. Discount, Software, Fleet
                  </span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={modalTypeName}
                  onChange={(e) => setModalTypeName(e.target.value)}
                  placeholder="e.g. Discount"
                  style={INPUT_STYLE}
                  className="w-full px-3 py-2 text-xs rounded-lg font-normal text-slate-800 focus:outline-none focus:border-blue-600 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">
                  Cash Flow Classification
                </label>
                <select
                  value={modalCashFlow}
                  onChange={(e) => setModalCashFlow(e.target.value)}
                  style={INPUT_STYLE}
                  className="w-full px-3 py-2 text-xs rounded-lg font-normal text-slate-800 focus:outline-none focus:border-blue-600 transition-all cursor-pointer"
                >
                  <option value="Operating">Operating Activities</option>
                  <option value="Cash">Cash &amp; Cash Equivalents</option>
                  <option value="Investing">Investing Activities</option>
                  <option value="Financing">Financing Activities</option>
                  <option value="None">None</option>
                </select>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={modalShowInClaims}
                    onChange={(e) => setModalShowInClaims(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-normal text-slate-700">
                    Show in expense claims
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={modalEnablePayments}
                    onChange={(e) => setModalEnablePayments(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-normal text-slate-700">
                    Enable payments on this account type
                  </span>
                </label>
              </div>
            </div>

            <div
              className="px-5 py-3 flex items-center justify-between gap-2"
              style={{
                backgroundColor: "#f8fafc",
                borderTop: "1px solid #cbd5e1",
              }}
            >
              <button
                type="button"
                onClick={() => setIsCreateTypeModalOpen(false)}
                style={INPUT_STYLE}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!modalTypeName.trim() || createSubtypeMutation.isPending}
                onClick={() => {
                  if (modalTypeName.trim()) {
                    handleCreateCustomCategory(
                      modalTypeName,
                      modalCashFlow,
                      modalShowInClaims,
                      modalEnablePayments,
                    );
                  }
                }}
                style={{
                  backgroundColor: "#1d4ed8",
                  color: "#ffffff",
                  border: "1px solid #1e40af",
                }}
                className="px-4 py-1.5 text-xs font-medium disabled:opacity-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {createSubtypeMutation.isPending ? "Saving..." : "Save Account Type"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage All Account Types Modal */}
      <AccountTypesManagerModal
        isOpen={isAccountTypesModalOpen}
        onClose={() => setIsAccountTypesModalOpen(false)}
      />
    </div>
  );
}

export default function CreateAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-full p-8 text-center text-xs text-slate-400">
          Loading account form...
        </div>
      }
    >
      <CreateOrEditAccountContent />
    </Suspense>
  );
}

