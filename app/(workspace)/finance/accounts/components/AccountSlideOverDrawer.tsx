"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChartOfAccount } from "@/lib/hooks/api-hooks";
import {
  X,
  Save,
  Trash2,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Search,
  Check,
  Folder,
  Lock,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import {
  useAccountSubtypes,
  useCreateAccountSubtype,
  useDeleteAccountSubtype,
} from "@/lib/hooks/finance-hooks";
import { toast } from "@/lib/toast";
import Link from "next/link";

export interface AccountSlideOverDrawerProps {
  isOpen: boolean;
  mode: "CREATE" | "EDIT";
  account?: ChartOfAccount | null;
  parentAccount?: ChartOfAccount | null;
  allAccounts: ChartOfAccount[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onDelete?: (acc: ChartOfAccount) => Promise<void>;
  isSuperAdmin?: boolean;
  isFinancialUser?: boolean;
  onOpenManageSubtypes?: () => void;
}

export interface AccountSubtypeDef {
  id?: string;
  label: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  cashFlow: string;
  parentPrefixes?: string[];
  enablePayments?: boolean;
  showInExpenseClaims?: boolean;
  description?: string;
  isSystem?: boolean;
}

// Deprecated static array - dynamic database subtypes from PostgreSQL account_subtypes table are used instead
export const ACCOUNT_SUBTYPES: AccountSubtypeDef[] = [];

/**
 * Dynamically resolves valid account subtypes for the selected parent account from the dynamic database list
 */
export function getSubtypesForParent(
  parent: ChartOfAccount | null,
  availableList: AccountSubtypeDef[] = [],
): AccountSubtypeDef[] {
  if (!parent) return [];

  const code = parent.accountCode;
  const type = parent.type;

  // 1. Strictly match by root category (Asset, Liability, Equity, Revenue, Expense)
  const typeMatches = availableList.filter((sub) => sub.type === type);

  // 2. If parent prefixes are defined on a subtype, match by prefix; otherwise match all for type
  const prefixMatches = typeMatches.filter((sub) => {
    if (!sub.parentPrefixes || sub.parentPrefixes.length === 0) return true;
    return sub.parentPrefixes.some((p) => code.startsWith(p) || p.startsWith(code));
  });

  const listToUse = prefixMatches.length > 0 ? prefixMatches : typeMatches;

  // Deduplicate by lowercase label
  const seen = new Set<string>();
  const uniqueMatches: AccountSubtypeDef[] = [];
  for (const item of listToUse) {
    const key = item.label.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueMatches.push(item);
    }
  }
  return uniqueMatches;
}

export function AccountSlideOverDrawer({
  isOpen,
  mode,
  account,
  parentAccount,
  allAccounts,
  onClose,
  onSave,
  onDelete,
  isSuperAdmin = false,
  isFinancialUser = false,
  onOpenManageSubtypes,
}: AccountSlideOverDrawerProps) {
  const [parentId, setParentId] = useState<string>("");
  const [accountType, setAccountType] = useState<string>("Cash and Cash Equivalents");
  const [type, setType] = useState<"ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE">("ASSET");
  const [accountCode, setAccountCode] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [cashFlowType, setCashFlowType] = useState<string>("Operating");
  const [allowPosting, setAllowPosting] = useState<boolean>(true);
  const [enablePayments, setEnablePayments] = useState<boolean>(false);
  const [showInExpenseClaims, setShowInExpenseClaims] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Searchable Parent Combobox State
  const [isParentDropdownOpen, setIsParentDropdownOpen] = useState<boolean>(false);
  const [parentSearch, setParentSearch] = useState<string>("");
  const parentDropdownRef = useRef<HTMLDivElement>(null);

  // Searchable Subtype Combobox State
  const [isSubtypeDropdownOpen, setIsSubtypeDropdownOpen] = useState<boolean>(false);
  const [subtypeSearch, setSubtypeSearch] = useState<string>("");
  const subtypeDropdownRef = useRef<HTMLDivElement>(null);

  // Real Database Subtypes Queries & Mutations
  const { data: dbSubtypesRaw = [], isLoading: isLoadingSubtypes } = useAccountSubtypes();
  const createSubtypeMutation = useCreateAccountSubtype();
  const deleteSubtypeMutation = useDeleteAccountSubtype();

  const [isCustomCategoryInputOpen, setIsCustomCategoryInputOpen] = useState<boolean>(false);
  const [newCustomCategoryName, setNewCustomCategoryName] = useState<string>("");
  const [newCustomCashFlow, setNewCustomCashFlow] = useState<string>("Operating");

  // Dedicated "Create New Account Type" Modal State
  const [isCreateTypeModalOpen, setIsCreateTypeModalOpen] = useState<boolean>(false);
  const [modalTypeName, setModalTypeName] = useState<string>("");
  const [modalCashFlow, setModalCashFlow] = useState<string>("Operating");
  const [modalShowInClaims, setModalShowInClaims] = useState<boolean>(true);
  const [modalEnablePayments, setModalEnablePayments] = useState<boolean>(false);

  const [isHowCanBeUsedOpen, setIsHowCanBeUsedOpen] = useState<boolean>(true);
  const [isReportingOpen, setIsReportingOpen] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isTargetLevel1 = mode === "EDIT" ? account?.level === 1 : false;
  const isLockedForCurrentUser = isTargetLevel1 && !isSuperAdmin;

  // Click outside to close comboboxes
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

  // Systematically group eligible parents by Root Category (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
  // and nest Level 3 Sub-groups under their respective Level 2 Group dynamically from allAccounts
  const parentCategoryGroups = useMemo(() => {
    const CATEGORIES: Array<{
      type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
      name: string;
      badgeClass: string;
      headerBg: string;
    }> = [
      {
        type: "ASSET",
        name: "Assets",
        badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
        headerBg: "bg-purple-50/90 border-purple-100 text-purple-950 font-bold",
      },
      {
        type: "LIABILITY",
        name: "Liabilities",
        badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
        headerBg: "bg-rose-50/90 border-rose-100 text-rose-950 font-bold",
      },
      {
        type: "EQUITY",
        name: "Equity",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
        headerBg: "bg-amber-50/90 border-amber-100 text-amber-950 font-bold",
      },
      {
        type: "REVENUE",
        name: "Revenue",
        badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
        headerBg: "bg-yellow-50/90 border-yellow-100 text-yellow-950 font-bold",
      },
      {
        type: "EXPENSE",
        name: "Expenses",
        badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
        headerBg: "bg-blue-50/90 border-blue-100 text-blue-950 font-bold",
      },
    ];

    const q = parentSearch.toLowerCase().trim();

    return CATEGORIES.map((cat) => {
      // Find all eligible accounts for this category (Level 2 & Level 3)
      const catAccounts = allAccounts.filter(
        (a) =>
          a.type === cat.type &&
          (mode !== "EDIT" || a.id !== account?.id) &&
          (a.level === 2 || a.level === 3),
      );

      // Find all Level 2 groups
      const lvl2List = catAccounts
        .filter((a) => a.level === 2)
        .sort((x, y) =>
          x.accountCode.localeCompare(y.accountCode, undefined, { numeric: true }),
        );

      // Group Level 3 sub-groups under each Level 2 group
      const groups = lvl2List.map((lvl2) => {
        const lvl3List = catAccounts
          .filter((a) => a.level === 3 && a.parentId === lvl2.id)
          .sort((x, y) =>
            x.accountCode.localeCompare(y.accountCode, undefined, { numeric: true }),
          );

        const lvl2Matches =
          !q ||
          lvl2.accountCode.toLowerCase().includes(q) ||
          lvl2.accountName.toLowerCase().includes(q) ||
          ((lvl2 as any).nameAr && (lvl2 as any).nameAr.toLowerCase().includes(q));

        const matchingLvl3 = lvl3List.filter(
          (l3) =>
            !q ||
            lvl2Matches ||
            l3.accountCode.toLowerCase().includes(q) ||
            l3.accountName.toLowerCase().includes(q) ||
            ((l3 as any).nameAr && (l3 as any).nameAr.toLowerCase().includes(q)),
        );

        return {
          lvl2,
          lvl3List: matchingLvl3,
          isMatch: lvl2Matches || matchingLvl3.length > 0,
        };
      });

      // Filter to only groups that match search
      const matchingGroups = groups
        .filter((g) => g.isMatch)
        .map(({ lvl2, lvl3List }) => ({ lvl2, lvl3List }));

      return {
        ...cat,
        groups: matchingGroups,
        totalCount: matchingGroups.reduce((acc, g) => acc + 1 + g.lvl3List.length, 0),
      };
    }).filter((cat) => cat.groups.length > 0);
  }, [allAccounts, mode, account, parentSearch]);

  const selectedParent = useMemo(() => {
    return allAccounts.find((a) => a.id === parentId) || null;
  }, [allAccounts, parentId]);

  // Map PostgreSQL database account subtypes
  const dbSubtypes = useMemo<AccountSubtypeDef[]>(() => {
    return (dbSubtypesRaw || []).map((st) => ({
      id: st.id,
      label: st.name,
      type: st.type,
      cashFlow: st.cashFlowType || "Operating",
      parentPrefixes: st.parentCodePrefix ? st.parentCodePrefix.split(",").map((p) => p.trim()) : [],
      enablePayments: st.enablePayments,
      showInExpenseClaims: st.showInExpenseClaims,
      description: st.description || undefined,
      isSystem: st.isSystem,
    }));
  }, [dbSubtypesRaw]);

  // Dynamically resolve only valid subtypes for the selected parent from the database list
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

  const handleCreateAndSaveToCOA = async (
    name: string,
    cashFlowChoice?: string,
    claimsChoice?: boolean,
    paymentsChoice?: boolean,
  ) => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Please enter a valid account name.");
      return;
    }
    if (!selectedParent) {
      toast.error("Please select a parent group first.");
      return;
    }

    const siblings = allAccounts.filter((a) => a.parentId === selectedParent.id);
    const code = accountCode.trim() || `${selectedParent.accountCode}${siblings.length + 1}`;
    const cf = cashFlowChoice || newCustomCashFlow || selectedParent.cashFlowType || "Operating";
    const inClaims = claimsChoice !== undefined ? claimsChoice : (selectedParent.type === "EXPENSE");
    const enPayments = paymentsChoice !== undefined ? paymentsChoice : (cf === "Cash");
    const targetLevel = (selectedParent.level || 1) + 1;

    try {
      await onSave({
        accountCode: code,
        accountName: trimmed,
        nameAr: null,
        type: selectedParent.type,
        parentId: selectedParent.id,
        accountSubtype: trimmed,
        cashFlowType: cf,
        allowPosting: targetLevel >= 3,
        enablePayments: enPayments,
        showInExpenseClaims: inClaims,
        level: targetLevel,
        isActive: true,
      });

      setIsCreateTypeModalOpen(false);
      onClose();
      toast.success(`Account "${code} - ${trimmed}" added directly to Chart of Accounts.`);
    } catch (err: any) {
      toast.error(`Error saving account: ${err.message}`);
    }
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

    const cf = cashFlowChoice || newCustomCashFlow || selectedParent?.cashFlowType || "Operating";
    const inClaims = claimsChoice !== undefined ? claimsChoice : (selectedParent?.type === "EXPENSE");
    const enPayments = paymentsChoice !== undefined ? paymentsChoice : (cf === "Cash");

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
        description: created.description || `Custom account type under ${selectedParent.accountName}`,
        showInExpenseClaims: created.showInExpenseClaims,
        enablePayments: created.enablePayments,
        isSystem: false,
      };

      handleSelectSubtype(newSub);
      setIsCustomCategoryInputOpen(false);
      setIsCreateTypeModalOpen(false);
      setNewCustomCategoryName("");
      setModalTypeName("");
      setSubtypeSearch("");
      toast.success(`Account type "${trimmed}" created and saved to database.`);
    } catch (err: any) {
      toast.error(`Error creating account type: ${err.message}`);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    setIsParentDropdownOpen(false);
    setParentSearch("");
    setIsSubtypeDropdownOpen(false);
    setSubtypeSearch("");

    if (mode === "EDIT" && account) {
      setParentId(account.parentId || "");
      setAccountCode(account.accountCode || "");
      setAccountName(account.accountName || "");
      setType(account.type);
      setAccountType((account as any).accountSubtype || "");
      setCashFlowType((account as any).cashFlowType || "Operating");
      setAllowPosting((account as any).allowPosting ?? true);
      setEnablePayments((account as any).enablePayments ?? true);
      setShowInExpenseClaims((account as any).showInExpenseClaims ?? true);
      setIsActive(account.isActive ?? true);
    } else {
      // CREATE Mode
      // Only accept parentAccount if it is NOT Level 1
      const parent =
        parentAccount && (parentAccount.level || 1) >= 2
          ? parentAccount
          : parentId
            ? allAccounts.find((a) => a.id === parentId && (a.level || 1) >= 2)
            : null;

      if (parent) {
        setParentId(parent.id);
        setType(parent.type);
        // Suggest next code: parent.code + next sequential number
        const siblings = allAccounts.filter((a) => a.parentId === parent.id);
        const lastNum = siblings.length + 1;
        setAccountCode(`${parent.accountCode}${lastNum}`);
        setAccountType("");
        setCashFlowType(parent.cashFlowType || "Operating");
      } else {
        setParentId("");
        setType("EXPENSE");
        setAccountCode("");
        setAccountType("");
        setCashFlowType("Operating");
      }
      setAccountName("");
      setAllowPosting(true);
      setEnablePayments(true);
      setShowInExpenseClaims(true);
      setIsActive(true);
    }
  }, [isOpen, mode, account, parentAccount]);

  const handleSelectParent = (parent: ChartOfAccount) => {
    setParentId(parent.id);
    setType(parent.type);
    setIsParentDropdownOpen(false);
    setParentSearch("");
    setIsSubtypeDropdownOpen(false);
    setSubtypeSearch("");

    // Set cash flow type according to parent if specified
    if (parent.cashFlowType) {
      setCashFlowType(parent.cashFlowType);
    } else if (parent.type === "ASSET" && (parent.accountCode.startsWith("111") || parent.accountName.toLowerCase().includes("cash") || parent.accountName.toLowerCase().includes("bank"))) {
      setCashFlowType("Cash");
    } else {
      setCashFlowType("Operating");
    }

    // Account type remains optional - if user already picked a matching subtype keep it, else clear
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

  const handleAccountTypeChange = (selectedLabel: string) => {
    setAccountType(selectedLabel);
    const found = dbSubtypes.find((s) => s.label === selectedLabel);
    if (found) {
      setType(found.type as any);
      setCashFlowType(found.cashFlow);
      if (found.cashFlow === "Cash") {
        setEnablePayments(true);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedForCurrentUser) {
      toast.error("Level 1 system accounts are locked. Only Super Admin can modify them.");
      return;
    }

    if (mode === "CREATE") {
      if (!parentId) {
        toast.warning("Please select a parent Group (Level 2) or Sub-group (Level 3). Root categories cannot be created.");
        return;
      }

      const parent = allAccounts.find((a) => a.id === parentId);
      if (!parent) {
        toast.error("Please select a valid parent account.");
        return;
      }

      if (parent.level === 1) {
        toast.error("Level 1 root categories (Assets, Liabilities, etc.) cannot be used as a parent account.");
        return;
      }
    }

    if (!accountCode.trim() || !accountName.trim()) {
      toast.warning("Code and Account Name are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const parent = allAccounts.find((a) => a.id === parentId);
      const level =
        mode === "EDIT" && account
          ? (account.level || 1)
          : parent
            ? (parent.level || 1) + 1
            : 4;

      await onSave({
        accountCode: accountCode.trim(),
        accountName: accountName.trim(),
        nameAr: null,
        type,
        parentId: parent ? parent.id : (account ? account.parentId : null),
        accountSubtype: accountType.trim() || null,
        cashFlowType: cashFlowType || "Operating",
        allowPosting,
        enablePayments,
        showInExpenseClaims,
        level,
        isActive,
      });
      onClose();
    } catch (err: any) {
      toast.error(`Error saving account: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!account || !onDelete) return;
    if (account.level === 1) {
      toast.error("Level 1 root categories cannot be deleted.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete account "${account.accountCode} - ${account.accountName}"?`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(account);
      onClose();
    } catch (err: any) {
      toast.error(`Error deleting account: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
          {/* Header matching Wafeq Screenshot */}
          <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
              <div className="h-5 w-px bg-slate-200" />
              <div>
                <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                  {mode === "CREATE" ? "Create account" : "Edit account"}
                </h2>
                {account && (
                  <p className="text-[11px] text-slate-400 font-mono">
                    {account.accountCode} · Level {account.level || 1}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isLockedForCurrentUser}
              className="inline-flex items-center justify-center px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#5546FF] hover:bg-[#4837F0] active:scale-[0.98] shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? "Saving..." : "Save"}</span>
            </button>
          </div>

          {/* Form Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Security Banner if locked */}
              {isLockedForCurrentUser && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2 font-medium">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Level {account?.level || 1} system accounts are locked. Only Super Admin can modify or delete them.
                  </span>
                </div>
              )}

              {/* SECTION 1: Type of account and classification Required matching screenshot */}
              <div className="space-y-4">
                <div className="bg-[#f8f9fa] border border-slate-100/80 rounded-lg px-4 py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">
                    Type of account and classification
                  </span>
                  <span className="text-slate-500 text-xs font-normal">Required</span>
                </div>

                {/* Parent account Row in 2-column layout */}
                <div className="grid grid-cols-[130px_1fr] sm:grid-cols-[160px_1fr] items-center gap-3">
                  <label className="text-slate-700 font-medium text-xs sm:text-sm">
                    Parent account<span className="text-rose-500">*</span>
                  </label>

                  <div className="relative w-full" ref={parentDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsParentDropdownOpen((prev) => !prev)}
                      className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${
                        isParentDropdownOpen
                          ? "border-[#5546FF] ring-2 ring-[#5546FF]/20"
                          : "border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      {selectedParent ? (
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                            {selectedParent.accountCode}
                          </span>
                          <span className="text-slate-800 font-semibold truncate">
                            {selectedParent.accountName}
                          </span>
                          <span
                            className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold ml-1 ${
                              selectedParent.level === 2
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {selectedParent.level === 2 ? "Level 2 Group" : "Level 3 Sub-group"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Select</span>
                      )}
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    </button>

                    {/* Dropdown Menu with Search */}
                    {isParentDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        {/* Search Input Bar */}
                        <div className="p-2 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10 flex items-center gap-2">
                          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                          <input
                            type="text"
                            autoFocus
                            placeholder="Type code or account name to search..."
                            value={parentSearch}
                            onChange={(e) => setParentSearch(e.target.value)}
                            className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none"
                          />
                          {parentSearch && (
                            <button
                              type="button"
                              onClick={() => setParentSearch("")}
                              className="p-0.5 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Hierarchically Grouped Parent Accounts by Root Category */}
                        <div className="max-h-72 overflow-y-auto p-1 divide-y divide-slate-100/60 custom-scrollbar text-xs">
                          {parentCategoryGroups.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-xs">
                              No matching parent groups or sub-groups found
                            </div>
                          ) : (
                            parentCategoryGroups.map((cat) => (
                              <div key={cat.type} className="pb-1">
                                <div
                                  className={`px-2.5 py-1 text-[10.5px] uppercase tracking-wider flex items-center justify-between rounded-md my-1 ${cat.headerBg}`}
                                >
                                  <span>{cat.name}</span>
                                  <span className="text-[9.5px] font-semibold opacity-75">
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
                                              ? "bg-indigo-50 text-indigo-950 font-bold ring-1 ring-indigo-300"
                                              : "hover:bg-slate-50 text-slate-900 font-semibold"
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 truncate">
                                            <Folder className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                            <span className="font-mono font-bold text-slate-900 text-xs">
                                              {lvl2.accountCode}
                                            </span>
                                            <span className="truncate">{lvl2.accountName}</span>
                                          </div>

                                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                              Level 2 Group
                                            </span>
                                            {isLvl2Selected && (
                                              <Check className="w-3.5 h-3.5 text-indigo-600" />
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
                                                  ? "bg-purple-50 text-purple-950 font-bold ring-1 ring-purple-300"
                                                  : "hover:bg-slate-50 text-slate-700"
                                              }`}
                                            >
                                              <div className="flex items-center gap-1.5 truncate">
                                                <span className="text-slate-300 font-mono text-[11px] select-none shrink-0">
                                                  └─
                                                </span>
                                                <span className="font-mono font-bold text-slate-800 text-xs">
                                                  {lvl3.accountCode}
                                                </span>
                                                <span className="truncate font-medium">
                                                  {lvl3.accountName}
                                                </span>
                                              </div>

                                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                                  Level 3 Sub-group
                                                </span>
                                                {isLvl3Selected && (
                                                  <Check className="w-3.5 h-3.5 text-purple-600" />
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

                {/* Account Type (Optional) - Shown when parent is selected */}
                {selectedParent && (
                  <div className="grid grid-cols-[130px_1fr] sm:grid-cols-[160px_1fr] items-center gap-3 pt-1">
                    <div className="flex flex-col">
                      <label className="text-slate-700 font-medium text-xs sm:text-sm">
                        Account type
                      </label>
                      <span className="text-slate-400 text-[11px]">Optional</span>
                    </div>

                    <div className="relative w-full" ref={subtypeDropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsSubtypeDropdownOpen(!isSubtypeDropdownOpen);
                          setIsParentDropdownOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-xs sm:text-sm flex items-center justify-between text-left transition-all cursor-pointer ${
                          isSubtypeDropdownOpen
                            ? "border-[#5546FF] ring-2 ring-[#5546FF]/20"
                            : "border-slate-300 hover:border-slate-400 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {accountType ? (
                            <>
                              <span className="font-semibold text-slate-900 truncate">
                                {accountType}
                              </span>
                              {cashFlowType && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                  {cashFlowType}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-400 italic">None / General (Optional)</span>
                          )}
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                            isSubtypeDropdownOpen ? "rotate-180 text-[#5546FF]" : ""
                          }`}
                        />
                      </button>

                      {/* Dropdown Menu with Search & Custom Add */}
                      {isSubtypeDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          {availableSubtypes.length > 3 && (
                            <div className="p-2 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10 flex items-center gap-2">
                              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                              <input
                                type="text"
                                autoFocus
                                placeholder="Type to filter account types..."
                                value={subtypeSearch}
                                onChange={(e) => setSubtypeSearch(e.target.value)}
                                className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none"
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
                          )}

                          {/* Option to clear / keep optional */}
                          <div className="p-1 border-b border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setAccountType("");
                                setIsSubtypeDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 flex items-center justify-between text-left rounded-lg transition-colors cursor-pointer ${
                                !accountType ? "bg-slate-100 text-slate-900 font-bold" : "hover:bg-slate-50 text-slate-600"
                              }`}
                            >
                              <span className="text-xs italic text-slate-500">None / General (No specific subtype)</span>
                              {!accountType && <Check className="w-3.5 h-3.5 text-[#5546FF]" />}
                            </button>
                          </div>

                          {/* Quick Add Custom Category button */}
                          {subtypeSearch.trim() &&
                            !availableSubtypes.some(
                              (s) =>
                                s.label.toLowerCase() === subtypeSearch.trim().toLowerCase(),
                            ) && (
                              <button
                                type="button"
                                onClick={() => handleCreateCustomCategory(subtypeSearch.trim())}
                                className="w-full px-3 py-2.5 flex items-center justify-between text-left bg-indigo-50/90 hover:bg-indigo-100/90 text-indigo-900 border-b border-indigo-200 transition-colors cursor-pointer group"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <Plus className="w-4 h-4 text-indigo-600 shrink-0" />
                                  <span className="text-xs font-bold truncate">
                                    Add &ldquo;{subtypeSearch.trim()}&rdquo; as new category
                                  </span>
                                </div>
                                <span className="text-[10px] bg-[#5546FF] text-white px-2 py-0.5 rounded font-bold shrink-0 shadow-2xs">
                                  + Add &amp; Select
                                </span>
                              </button>
                            )}

                          {/* Subtypes List */}
                          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-100/60 custom-scrollbar text-xs">
                            {filteredSubtypes.length === 0 && !subtypeSearch.trim() ? (
                              <div className="p-4 text-center text-slate-400 text-xs">
                                No specific account types defined for {selectedParent.accountCode} (Optional)
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
                                        ? "bg-indigo-50 text-indigo-900 font-bold"
                                        : "hover:bg-slate-50 text-slate-700"
                                    }`}
                                  >
                                    <div className="truncate pr-2 flex-1">
                                      <div className="font-medium text-slate-900 text-xs truncate flex items-center gap-1.5">
                                        <span>{sub.label}</span>
                                        {sub.isSystem && (
                                          <span className="text-[9px] px-1 py-0.2 rounded font-medium bg-slate-100 text-slate-500">
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
                                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                        {sub.cashFlow}
                                      </span>
                                      {isSelected && (
                                        <Check className="w-3.5 h-3.5 text-[#5546FF]" />
                                      )}
                                      {isFinancialUser && !sub.isSystem && sub.id && (
                                        <button
                                          type="button"
                                          title="Delete Account Type"
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            if (confirm(`Are you sure you want to delete Account Type "${sub.label}"?`)) {
                                              try {
                                                await deleteSubtypeMutation.mutateAsync(sub.id!);
                                                if (accountType === sub.label) setAccountType("");
                                                toast.success(`Account Type "${sub.label}" deleted.`);
                                              } catch (err: any) {
                                                toast.error(err.message || "Failed to delete account type");
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

                          {/* Bottom Footer: Add Custom Category & Manage All */}
                          <div className="p-2 border-t border-slate-100 bg-slate-50/70 flex flex-col gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setModalTypeName(subtypeSearch || "");
                                setModalCashFlow(selectedParent.cashFlowType || "Operating");
                                setModalShowInClaims(selectedParent.type === "EXPENSE");
                                setModalEnablePayments(false);
                                setIsCreateTypeModalOpen(true);
                                setIsSubtypeDropdownOpen(false);
                              }}
                              className="w-full py-1.5 px-3 text-xs font-semibold text-[#5546FF] hover:bg-indigo-50 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-indigo-200"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Create New Account Type</span>
                            </button>
                            {onOpenManageSubtypes && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsSubtypeDropdownOpen(false);
                                  onOpenManageSubtypes();
                                }}
                                className="w-full py-1 px-3 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <SlidersHorizontal className="w-3 h-3" />
                                <span>Manage all account types ({dbSubtypes.length})</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: Account information Required */}
              <div className="space-y-4 pt-2">
                <div className="bg-[#f8f9fa] border border-slate-100/80 rounded-lg px-4 py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">
                    Account information
                  </span>
                  <span className="text-slate-500 text-xs font-normal">Required</span>
                </div>

                {/* Name* */}
                <div className="grid grid-cols-[130px_1fr] sm:grid-cols-[160px_1fr] items-center gap-3">
                  <label className="text-slate-700 font-medium text-xs sm:text-sm">
                    Name<span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Empty"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#5546FF] focus:ring-1 focus:ring-[#5546FF] shadow-2xs"
                    required
                  />
                </div>

                {/* Code (i) */}
                <div className="grid grid-cols-[130px_1fr] sm:grid-cols-[160px_1fr] items-center gap-3">
                  <label className="text-slate-700 font-medium text-xs sm:text-sm flex items-center gap-1.5">
                    <span>Code</span>
                    <span
                      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold cursor-help"
                      title="Unique numerical code for this account"
                    >
                      i
                    </span>
                  </label>
                  <input
                    type="text"
                    value={accountCode}
                    onChange={(e) => setAccountCode(e.target.value)}
                    placeholder="Empty"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg font-mono font-medium text-slate-800 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#5546FF] focus:ring-1 focus:ring-[#5546FF] shadow-2xs"
                  />
                </div>

                {/* Cash flow type* */}
                <div className="grid grid-cols-[130px_1fr] sm:grid-cols-[160px_1fr] items-start gap-3">
                  <label className="text-slate-700 font-medium text-xs sm:text-sm pt-2">
                    Cash flow type<span className="text-rose-500">*</span>
                  </label>
                  <div className="space-y-1.5 w-full">
                    <div className="relative">
                      <select
                        value={cashFlowType}
                        onChange={(e) => setCashFlowType(e.target.value)}
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs sm:text-sm focus:outline-none focus:border-[#5546FF] focus:ring-1 focus:ring-[#5546FF] shadow-2xs appearance-none pr-9 cursor-pointer"
                      >
                        <option value="Operating">Operating</option>
                        <option value="Investing">Investing</option>
                        <option value="Financing">Financing</option>
                        <option value="Cash">Cash</option>
                        <option value="None">None</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Determines which section this account will appear in within the{" "}
                      <span className="text-[#5546FF] hover:underline cursor-pointer">
                        Cash Flow statement
                      </span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 3: How can this account be used? Optional */}
              <div className="space-y-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHowCanBeUsedOpen((v) => !v)}
                  className="w-full bg-[#f8f9fa] border border-slate-100/80 rounded-lg px-4 py-2.5 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      How can this account be used?
                    </span>
                    <span className="text-slate-500 text-xs font-normal">Optional</span>
                  </div>
                  <ChevronUp
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      isHowCanBeUsedOpen ? "" : "rotate-180"
                    }`}
                  />
                </button>

                {isHowCanBeUsedOpen && (
                  <div className="space-y-4 pl-1">
                    {/* Allow posting to this account */}
                    <label className="flex items-start gap-3 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={allowPosting}
                        onChange={(e) => setAllowPosting(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#5546FF] focus:ring-[#5546FF] cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800 text-xs sm:text-sm">
                          Allow posting to this account
                        </div>
                        <div className="text-[11px] text-slate-500">
                          <span className="text-[#5546FF]">Users</span> in this organization will be allowed to select this account when creating transactions.
                        </div>
                      </div>
                    </label>

                    {/* Enable account selection for payments */}
                    <label className="flex items-start gap-3 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={enablePayments}
                        onChange={(e) => setEnablePayments(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#5546FF] focus:ring-[#5546FF] cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800 text-xs sm:text-sm">
                          Enable account selection for payments
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Allow this account to be selectable when recording any{" "}
                          <span className="text-[#5546FF]">payments</span>.
                        </div>
                      </div>
                    </label>

                    {/* Show account for employee expense claims */}
                    <label className="flex items-start gap-3 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={showInExpenseClaims}
                        onChange={(e) => setShowInExpenseClaims(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#5546FF] focus:ring-[#5546FF] cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800 text-xs sm:text-sm">
                          Show account for employee expense claims
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Make this account available as an option for{" "}
                          <span className="text-[#5546FF]">employees</span> when they submit{" "}
                          <span className="text-[#5546FF]">Expense claims</span> in AGM.
                        </div>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* In Edit mode: Active status toggle & Delete account */}
              {mode === "EDIT" && (
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div>
                      <div className="font-semibold text-slate-800 text-xs">Account status</div>
                      <div className="text-[11px] text-slate-500">
                        Inactive accounts cannot receive new transactions.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsActive((v) => !v)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isActive ? "bg-emerald-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {account && account.level !== 1 && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 rounded-lg transition-colors cursor-pointer border border-rose-200/80"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isDeleting ? "Deleting..." : "Delete account"}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Footer Action */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isLockedForCurrentUser}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-[#5546FF] hover:bg-[#4837F0] active:scale-[0.98] shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? "Saving..." : "Save Account"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Modal: Create New Account Type */}
      {isCreateTypeModalOpen && selectedParent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span>Create New Account Type</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Add a custom classification under {selectedParent.accountCode} - {selectedParent.accountName}
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

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Parent Category Badge */}
              <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900">
                <span className="font-semibold text-indigo-600">Parent:</span>
                <span className="font-mono font-bold">{selectedParent.accountCode}</span>
                <span className="text-slate-700 truncate">{selectedParent.accountName}</span>
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  {selectedParent.type}
                </span>
              </div>

              {/* Type Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Account Type Name *</span>
                  <span className="text-[10px] text-slate-400 font-normal">e.g. Discount, Software, Fleet</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={modalTypeName}
                  onChange={(e) => setModalTypeName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (modalTypeName.trim()) {
                        handleCreateCustomCategory(
                          modalTypeName,
                          modalCashFlow,
                          modalShowInClaims,
                          modalEnablePayments,
                        );
                      }
                    }
                  }}
                  placeholder="e.g. Discount"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all shadow-2xs"
                />
              </div>

              {/* Cash Flow Classification */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Cash Flow Classification
                </label>
                <select
                  value={modalCashFlow}
                  onChange={(e) => setModalCashFlow(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer shadow-2xs"
                >
                  <option value="Operating">Operating Activities</option>
                  <option value="Cash">Cash &amp; Cash Equivalents</option>
                  <option value="Investing">Investing Activities</option>
                  <option value="Financing">Financing Activities</option>
                  <option value="None">None</option>
                </select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={modalShowInClaims}
                    onChange={(e) => setModalShowInClaims(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Show in expense claims
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={modalEnablePayments}
                    onChange={(e) => setModalEnablePayments(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Enable payments on this account type
                  </span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsCreateTypeModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
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
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{createSubtypeMutation.isPending ? "Saving..." : "Save Account Type"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountSlideOverDrawer;
