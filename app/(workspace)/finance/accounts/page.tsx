"use client";

import { useMemo, useState, useCallback } from "react";
import {
  useAccounts,
  useDeleteAccount,
  ChartOfAccount,
} from "@/lib/hooks/api-hooks";
import { toast } from "@/lib/toast";
import { PlusIcon } from "@/components/icons";
import { Button, PageHeader } from "@/components/ui";
import {
  ACCOUNT_TYPES,
  HierarchicalAccount,
  AccountTypeConfig,
  AccountsSummaryCards,
  CreateAccountModal,
  EditAccountModal,
  DeleteAccountModal,
  AccountsFilterToolbar,
  AccountsHierarchyView,
} from "./components";
import { formatNumber, formatCurrency } from "@/lib/utils/format";

export default function AccountsPage() {
  const { data: accounts = [], isLoading, error } = useAccounts();
  const deleteAccountMutation = useDeleteAccount();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createDefaultType, setCreateDefaultType] = useState<
    "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"
  >("ASSET");
  const [createDefaultParentId, setCreateDefaultParentId] =
    useState<string>("");

  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(
    null,
  );
  const [deletingAccount, setDeletingAccount] = useState<ChartOfAccount | null>(
    null,
  );

  const [collapsedCategories, setCollapsedCategories] = useState<
    Record<string, boolean>
  >({});
  const [collapsedParents, setCollapsedParents] = useState<
    Record<string, boolean>
  >({});
  const [expandedLedgerAccounts, setExpandedLedgerAccounts] = useState<
    Record<string, boolean>
  >({});

  const toggleCategory = useCallback((catVal: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catVal]: !prev[catVal],
    }));
  }, []);

  const toggleParent = useCallback((parentId: string) => {
    setCollapsedParents((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  }, []);

  const toggleLedgerAccount = useCallback((accId: string) => {
    setExpandedLedgerAccounts((prev) => ({
      ...prev,
      [accId]: !prev[accId],
    }));
  }, []);

  const filteredAccounts = useMemo(() => {
    return (accounts || []).filter((acc) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        acc.accountCode.toLowerCase().includes(q) ||
        acc.accountName.toLowerCase().includes(q) ||
        (acc.parent?.accountName &&
          acc.parent.accountName.toLowerCase().includes(q));

      const matchesType = selectedType === "ALL" || acc.type === selectedType;

      let matchesStatus = true;
      if (statusFilter === "ACTIVE") matchesStatus = acc.isActive === true;
      if (statusFilter === "INACTIVE") matchesStatus = acc.isActive === false;
      if (statusFilter === "SYSTEM") matchesStatus = Boolean(acc.isSystem);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [accounts, search, selectedType, statusFilter]);

  const classSummary = useMemo(() => {
    const map: Record<string, { count: number; totalBalance: number }> = {
      ASSET: { count: 0, totalBalance: 0 },
      LIABILITY: { count: 0, totalBalance: 0 },
      EQUITY: { count: 0, totalBalance: 0 },
      REVENUE: { count: 0, totalBalance: 0 },
      EXPENSE: { count: 0, totalBalance: 0 },
    };

    (accounts || []).forEach((a) => {
      if (!map[a.type]) {
        map[a.type] = { count: 0, totalBalance: 0 };
      }
      map[a.type].count += 1;
      map[a.type].totalBalance += Number(a.balance || 0);
    });

    return map;
  }, [accounts]);

  const categorizedAccounts = useMemo(() => {
    const map: Record<
      string,
      {
        typeInfo: AccountTypeConfig;
        roots: HierarchicalAccount[];
        totalBalance: number;
        totalCount: number;
      }
    > = {};

    ACCOUNT_TYPES.forEach((t) => {
      const accountsInType = filteredAccounts.filter((a) => a.type === t.value);
      const accMap = new Map<string, HierarchicalAccount>();
      accountsInType.forEach((acc) => {
        accMap.set(acc.id, { ...acc, subAccounts: [] });
      });

      const roots: HierarchicalAccount[] = [];
      accountsInType.forEach((acc) => {
        const item = accMap.get(acc.id)!;
        if (acc.parentId && accMap.has(acc.parentId)) {
          accMap.get(acc.parentId)!.subAccounts.push(item);
        } else {
          roots.push(item);
        }
      });

      roots.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
      roots.forEach((r) => {
        r.subAccounts.sort((a, b) =>
          a.accountCode.localeCompare(b.accountCode),
        );
      });

      const totalBalance = accountsInType.reduce(
        (sum, a) => sum + Number(a.balance || 0),
        0,
      );

      map[t.value] = {
        typeInfo: t,
        roots,
        totalBalance,
        totalCount: accountsInType.length,
      };
    });

    return map;
  }, [filteredAccounts]);

  const handleOpenCreate = () => {
    setCreateDefaultType("ASSET");
    setCreateDefaultParentId("");
    setIsCreateModalOpen(true);
  };

  const handleOpenCreateForType = (
    type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE",
    defaultParentId?: string,
  ) => {
    setCreateDefaultType(type);
    setCreateDefaultParentId(defaultParentId || "");
    setIsCreateModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAccount) return;
    try {
      await deleteAccountMutation.mutateAsync(deletingAccount.id);
      toast.success(
        `Account "${deletingAccount.accountName}" deleted successfully`,
      );
      setDeletingAccount(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chart of Accounts"
        description="Manage your master chart of accounts, view real-time balances, and organize account structures."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Add Account
          </Button>
        }
      />

      <AccountsSummaryCards
        selectedType={selectedType}
        onSelectType={setSelectedType}
        classSummary={classSummary}
        formatNumber={formatNumber}
      />

      <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <AccountsFilterToolbar
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          search={search}
          setSearch={setSearch}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          totalDisplayed={filteredAccounts.length}
        />

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading accounts: {(error as any).message}
          </div>
        ) : (
          <AccountsHierarchyView
            categorizedAccounts={categorizedAccounts}
            selectedType={selectedType}
            collapsedCategories={collapsedCategories}
            toggleCategory={toggleCategory}
            collapsedParents={collapsedParents}
            toggleParent={toggleParent}
            expandedLedgerAccounts={expandedLedgerAccounts}
            toggleLedgerAccount={toggleLedgerAccount}
            onOpenCreateForType={handleOpenCreateForType}
            onOpenCreate={handleOpenCreate}
            onOpenEdit={(acc) => setEditingAccount(acc)}
            onDelete={(acc) => setDeletingAccount(acc)}
            hasAccounts={filteredAccounts.length > 0}
            searchQuery={search}
            formatNumber={formatNumber}
            formatCurrency={formatCurrency}
          />
        )}
      </div>

      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        accounts={accounts}
        initialType={createDefaultType}
        initialParentId={createDefaultParentId}
      />

      <EditAccountModal
        account={editingAccount}
        onClose={() => setEditingAccount(null)}
        accounts={accounts}
      />

      <DeleteAccountModal
        account={deletingAccount}
        onClose={() => setDeletingAccount(null)}
        onConfirm={handleDeleteConfirm}
        isPending={deleteAccountMutation.isPending}
      />
    </div>
  );
}
