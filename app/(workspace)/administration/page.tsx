"use client";

import { useMemo, useState, useCallback } from "react";
import {
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUsers,
} from "@/lib/hooks/admin-hooks";
import type { UserItem } from "@/lib/hooks/types";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import { Button, PageHeader, Input, Select } from "@/components/ui";
import { PlusIcon, ProtectedIcon, SearchIcon } from "@/components/icons";
import { ALL_ROLES } from "./types";
import { PermissionsMatrix } from "./components/PermissionsMatrix";
import { UserRegisterTable } from "./components/UserRegisterTable";
import { CreateUserModal } from "./components/CreateUserModal";
import { EditUserModal } from "./components/EditUserModal";

export default function AdministrationPage() {
  const { data: usersData, isLoading, error } = useUsers();
  const { user: currentUser, isSuperAdmin, loading: authLoading } = useAuth();
  const { confirm } = useConfirm();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const [activeTab, setActiveTab] = useState<"users" | "permissions">("users");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const users = useMemo(() => usersData?.users || [], [usersData?.users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const handleCreateUser = useCallback(
    async (values: {
      fullName: string;
      email: string;
      temporaryPassword: string;
      role: string;
    }) => {
      await createUserMutation.mutateAsync({
        fullName: values.fullName,
        email: values.email,
        password: values.temporaryPassword,
        role: values.role,
      });
      toast.success(`User created: ${values.email}`);
      setIsCreateOpen(false);
    },
    [createUserMutation],
  );

  const handleUpdateUser = useCallback(
    async (values: {
      id: string;
      fullName: string;
      email: string;
      role?: string;
      isActive?: boolean;
      password?: string;
    }) => {
      await updateUserMutation.mutateAsync(values);
      toast.success("User updated successfully");
      setIsEditOpen(false);
      setEditingUser(null);
    },
    [updateUserMutation],
  );

  const handleOpenEdit = useCallback((user: UserItem) => {
    setEditingUser(user);
    setIsEditOpen(true);
  }, []);

  const handleDeleteUser = useCallback(
    async (user: UserItem) => {
      if (user.id === currentUser?.id) {
        toast.warning("You cannot deactivate your own account.");
        return;
      }

      if (user.role === "SUPER_ADMIN") {
        toast.error("Cannot delete a Super Admin account.");
        return;
      }

      const isConfirmed = await confirm({
        title: "Delete User",
        message: `Deactivate and remove user "${user.fullName}" (${user.email})?`,
        variant: "danger",
        confirmText: "Deactivate",
      });

      if (isConfirmed) {
        try {
          const res = await deleteUserMutation.mutateAsync(user.id);
          toast.success(res?.message || "User account deactivated.");
        } catch (err: any) {
          toast.error(err.message || "Failed to delete user");
        }
      }
    },
    [confirm, currentUser?.id, deleteUserMutation],
  );

  if (authLoading) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-agm-green border-t-transparent" />
        <span className="text-xs text-agm-muted font-medium">Loading...</span>
      </div>
    );
  }

  const isEffectiveSuperAdmin =
    isSuperAdmin || currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "ADMIN";

  if (!isEffectiveSuperAdmin) {
    return (
      <div className="w-full py-20 text-center space-y-3">
        <ProtectedIcon size={36} className="mx-auto text-agm-navy" />
        <h2 className="text-sm font-bold text-agm-text">Access Restricted</h2>
        <p className="text-xs text-agm-muted max-w-sm mx-auto">
          User provisioning is restricted to Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title="Users & Permissions"
        description="Manage user accounts, roles, and view system permissions."
        actions={
          <div className="flex items-center gap-2">
            <div className="inline-flex p-0.5 rounded-lg bg-agm-box-bg border border-agm-box-border text-xs">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("users")}
                className={`px-3 py-1.5 font-bold rounded-md transition cursor-pointer ${
                  activeTab === "users"
                    ? "bg-agm-card text-agm-text shadow-xs"
                    : "text-agm-muted hover:text-agm-text"
                }`}
              >
                Users ({users.length})
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("permissions")}
                className={`px-3 py-1.5 font-bold rounded-md transition cursor-pointer ${
                  activeTab === "permissions"
                    ? "bg-agm-card text-agm-text shadow-xs"
                    : "text-agm-muted hover:text-agm-text"
                }`}
              >
                Permissions
              </Button>
            </div>

            {activeTab === "users" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                icon={<PlusIcon size={14} strokeWidth={2.5} />}
                className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Add User
              </Button>
            )}
          </div>
        }
      />

      {activeTab === "permissions" ? (
        <PermissionsMatrix />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="w-full sm:max-w-xs">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email..."
                leftIcon={<SearchIcon size={14} />}
                rightElement={
                  search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="text-xs text-agm-subtle hover:text-agm-text cursor-pointer"
                    >
                      ✕
                    </button>
                  ) : null
                }
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { value: "ALL", label: "All Roles" },
                  ...ALL_ROLES.map((r) => ({
                    value: r.value,
                    label: r.label,
                  })),
                ]}
              />
            </div>

            <span className="text-[11px] text-agm-subtle ml-auto font-medium">
              {filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"}
            </span>
          </div>

          {error ? (
            <div className="py-6 text-center text-xs text-agm-navy bg-agm-box-bg rounded-lg border border-agm-box-border">
              {(error as any).message || "Failed to load users"}
            </div>
          ) : (
            <UserRegisterTable
              users={filteredUsers}
              isLoading={isLoading}
              currentUserId={currentUser?.id}
              search={search}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteUser}
              onAddUser={() => setIsCreateOpen(true)}
            />
          )}
        </div>
      )}

      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateUser}
        isPending={createUserMutation.isPending}
      />

      <EditUserModal
        isOpen={isEditOpen}
        user={editingUser}
        currentUserId={currentUser?.id}
        onClose={() => {
          setIsEditOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleUpdateUser}
        isPending={updateUserMutation.isPending}
      />
    </div>
  );
}
