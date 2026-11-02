"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  ChartOfAccount,
} from "@/lib/hooks/api-hooks";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import { formatNumber, formatCurrency } from "@/lib/utils/format";
import {
  HierarchicalAccount,
  AccountsHierarchyView,
  AccountSlideOverDrawer,
  CleanAccountsHeader,
  AccountTypesManagerModal,
} from "./components";

function buildMultiLevelTree(accounts: ChartOfAccount[]): HierarchicalAccount[] {
  const map = new Map<string, HierarchicalAccount>();
  accounts.forEach((a) => {
    map.set(a.id, { ...a, subAccounts: [] });
  });

  const roots: HierarchicalAccount[] = [];
  accounts.forEach((a) => {
    const item = map.get(a.id)!;
    if (a.parentId && map.has(a.parentId)) {
      map.get(a.parentId)!.subAccounts.push(item);
    } else {
      roots.push(item);
    }
  });

  const sortRecursive = (list: HierarchicalAccount[]) => {
    list.sort((x, y) =>
      x.accountCode.localeCompare(y.accountCode, undefined, { numeric: true }),
    );
    list.forEach((item) => sortRecursive(item.subAccounts));
  };
  sortRecursive(roots);

  return roots;
}

export default function AccountsPage() {
  const { user, isSuperAdmin, hasRole } = useAuth();
  const isFinancialUser = isSuperAdmin || hasRole("ADMIN", "ACCOUNTANT");

  const { data: accounts = [], isLoading, error, refetch } = useAccounts();
  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();
  const deleteAccountMutation = useDeleteAccount();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeDepthLevel, setActiveDepthLevel] = useState<number | null>(4);

  // Account Subtypes Manager Modal state
  const [isAccountTypesModalOpen, setIsAccountTypesModalOpen] = useState(false);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"CREATE" | "EDIT">("CREATE");
  const [drawerAccount, setDrawerAccount] = useState<ChartOfAccount | null>(null);
  const [drawerParentAccount, setDrawerParentAccount] =
    useState<ChartOfAccount | null>(null);

  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const toggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  }, []);

  // Filtered accounts based on search and category
  const filteredAccounts = useMemo(() => {
    return (accounts || []).filter((acc) => {
      if (acc.isActive === false) return false;

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        acc.accountCode.toLowerCase().includes(q) ||
        acc.accountName.toLowerCase().includes(q) ||
        ((acc as any).nameAr &&
          (acc as any).nameAr.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === "ALL" || acc.type === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [accounts, search, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: accounts.length,
      ASSET: 0,
      LIABILITY: 0,
      EQUITY: 0,
      REVENUE: 0,
      EXPENSE: 0,
    };
    accounts.forEach((a) => {
      if (counts[a.type] !== undefined) {
        counts[a.type]++;
      }
    });
    return counts;
  }, [accounts]);

  const treeData = useMemo(() => {
    return buildMultiLevelTree(filteredAccounts);
  }, [filteredAccounts]);

  const handleSelectDepthLevel = useCallback(
    (lvl: number) => {
      setActiveDepthLevel(lvl);
      const newCollapsed: Record<string, boolean> = {};

      const traverse = (items: HierarchicalAccount[]) => {
        items.forEach((item) => {
          const itemLvl = item.level ?? 1;
          if (itemLvl >= lvl && item.subAccounts && item.subAccounts.length > 0) {
            newCollapsed[item.id] = true;
          } else {
            newCollapsed[item.id] = false;
          }
          if (item.subAccounts) {
            traverse(item.subAccounts);
          }
        });
      };

      traverse(treeData);
      setCollapsedNodes(newCollapsed);
    },
    [treeData],
  );

  const handleExpandAll = useCallback(() => {
    setActiveDepthLevel(4);
    setCollapsedNodes({});
  }, []);

  const handleCollapseAll = useCallback(() => {
    setActiveDepthLevel(1);
    const newCollapsed: Record<string, boolean> = {};
    const traverse = (items: HierarchicalAccount[]) => {
      items.forEach((item) => {
        if (item.subAccounts && item.subAccounts.length > 0) {
          newCollapsed[item.id] = true;
        }
        if (item.subAccounts) {
          traverse(item.subAccounts);
        }
      });
    };
    traverse(treeData);
    setCollapsedNodes(newCollapsed);
  }, [treeData]);

  useEffect(() => {
    if (activeDepthLevel !== null && treeData.length > 0) {
      handleSelectDepthLevel(activeDepthLevel);
    }
  }, [activeDepthLevel, treeData.length]);

  const handleOpenCreate = () => {
    setDrawerMode("CREATE");
    setDrawerAccount(null);
    setDrawerParentAccount(null);
    setIsDrawerOpen(true);
  };

  const handleOpenCreateChild = (parentAcc: ChartOfAccount) => {
    if (parentAcc.level === 1) {
      toast.warning("Level 1 root categories cannot have direct child accounts. Please select a Level 2 Group.");
      return;
    }
    setDrawerMode("CREATE");
    setDrawerAccount(null);
    setDrawerParentAccount(parentAcc);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (acc: ChartOfAccount) => {
    setDrawerMode("EDIT");
    setDrawerAccount(acc);
    setDrawerParentAccount(null);
    setIsDrawerOpen(true);
  };

  const handleSaveAccount = async (formData: any) => {
    if (drawerMode === "EDIT" && drawerAccount) {
      await updateAccountMutation.mutateAsync({
        id: drawerAccount.id,
        data: formData,
      });
      toast.success(`Account "${formData.accountCode}" updated successfully.`);
    } else {
      await createAccountMutation.mutateAsync(formData);
      toast.success(`Account "${formData.accountCode}" created successfully.`);
    }
    refetch();
  };

  const handleDeleteAccount = async (acc: ChartOfAccount) => {
    try {
      const res = await deleteAccountMutation.mutateAsync(acc.id);
      if ((res as any)?.message) {
        toast.success((res as any).message);
      } else {
        toast.success(`Account "${acc.accountCode}" deleted successfully.`);
      }
      refetch();
    } catch (err: any) {
      toast.error(err.message || `Failed to delete account "${acc.accountCode}"`);
      throw err;
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (!accounts.length) return;
    const headers = ["Account Code", "Account Name", "Arabic Name", "Type", "Subtype", "Cash Flow", "Level", "Balance"];
    const rows = accounts.map((a: any) => [
      a.accountCode,
      `"${a.accountName}"`,
      `"${a.nameAr || ""}"`,
      a.type,
      `"${a.accountSubtype || ""}"`,
      `"${a.cashFlowType || ""}"`,
      a.level || 1,
      Number(a.balance || 0).toFixed(2),
    ]);
    const csv = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Chart_of_Accounts_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="w-full min-h-full bg-white flex flex-col">
      {/* Sleek Modern Header & Controls Toolbar */}
      <CleanAccountsHeader
        search={search}
        setSearch={setSearch}
        activeDepthLevel={activeDepthLevel}
        onSelectDepthLevel={handleSelectDepthLevel}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        totalCount={filteredAccounts.length}
        categoryCounts={categoryCounts}
        onAddAccount={handleOpenCreate}
        onExportCsv={handleExportCsv}
        onRefresh={refetch}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        canAddAccount={isFinancialUser}
        onOpenAccountTypes={() => setIsAccountTypesModalOpen(true)}
      />

      {/* Main Full-Viewport Hierarchy Table matching Wafeq Image 1 */}
      <div className="w-full border-t border-slate-200/90 flex-1 bg-white">
        {error ? (
          <div className="p-6 text-center text-xs text-rose-600 bg-rose-50/50">
            Error loading accounts: {(error as any).message}
          </div>
        ) : (
          <AccountsHierarchyView
            rootAccounts={treeData}
            collapsedNodes={collapsedNodes}
            onToggleCollapse={toggleCollapse}
            onOpenEdit={handleOpenEdit}
            onOpenCreateChild={handleOpenCreateChild}
            onDelete={handleDeleteAccount}
            hasAccounts={accounts.length > 0}
            onOpenCreate={handleOpenCreate}
            formatNumber={formatNumber}
            formatCurrency={formatCurrency}
            activeDepthLevel={activeDepthLevel}
            onSelectDepthLevel={handleSelectDepthLevel}
            isSuperAdmin={isSuperAdmin}
            isFinancialUser={isFinancialUser}
          />
        )}
      </div>

      {/* Right Slide-Over Drawer for Adding/Editing Accounts */}
      <AccountSlideOverDrawer
        isOpen={isDrawerOpen}
        mode={drawerMode}
        account={drawerAccount}
        parentAccount={drawerParentAccount}
        allAccounts={accounts}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveAccount}
        onDelete={handleDeleteAccount}
        isSuperAdmin={isSuperAdmin}
        isFinancialUser={isFinancialUser}
        onOpenManageSubtypes={() => setIsAccountTypesModalOpen(true)}
      />

      {/* Modal to view, create, edit, and delete Account Types dynamically */}
      <AccountTypesManagerModal
        isOpen={isAccountTypesModalOpen}
        onClose={() => setIsAccountTypesModalOpen(false)}
      />
    </div>
  );
}
