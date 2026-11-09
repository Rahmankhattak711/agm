"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/Button";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Mail,
  Building,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  Edit2,
  Trash2,
  Lock,
  UserCheck,
  UserX,
} from "lucide-react";
import { ALL_ROLES } from "../types";
import { UserRegisterTable } from "../components/UserRegisterTable";
import { CreateUserModal } from "../components/CreateUserModal";
import { EditUserModal } from "../components/EditUserModal";

export default function UserDirectoryPage() {
  const router = useRouter();
  const { data: usersData, isLoading, error, refetch, isFetching } = useUsers();
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { confirm } = useConfirm();

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

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
      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : statusFilter === "ACTIVE"
            ? u.isActive
            : !u.isActive;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

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
      setIsCreateOpen(false);
      toast.success(`User ${values.fullName} created successfully.`);
    },
    [createUserMutation],
  );

  const handleEditUser = useCallback(
    async (values: {
      id: string;
      fullName: string;
      email: string;
      role?: string;
      isActive?: boolean;
      password?: string;
    }) => {
      await updateUserMutation.mutateAsync({
        id: values.id,
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        isActive: values.isActive,
        password: values.password || undefined,
      });
      setIsEditOpen(false);
      setEditingUser(null);
      toast.success("User updated successfully.");
    },
    [updateUserMutation],
  );

  const handleDeleteUser = useCallback(
    async (targetUser: UserItem) => {
      if (targetUser.id === currentUser?.id) {
        toast.error("You cannot delete your own account.");
        return;
      }
      if (targetUser.role === "SUPER_ADMIN" && !isSuperAdmin) {
        toast.error("Only a Super Administrator can delete Super Admin accounts.");
        return;
      }

      const confirmed = await confirm({
        title: `Deactivate ${targetUser.fullName}?`,
        message: `Are you sure you want to remove user access for ${targetUser.email}?`,
        confirmText: "Deactivate User",
        variant: "danger",
      });

      if (!confirmed) return;

      try {
        await deleteUserMutation.mutateAsync(targetUser.id);
        toast.success(`User ${targetUser.fullName} deactivated.`);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete user.");
      }
    },
    [currentUser?.id, isSuperAdmin, confirm, deleteUserMutation],
  );

  // Helper for role title & badges
  const getRoleDetails = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return {
          title: "Super Administrator / Owner",
          department: "Executive Management",
          badgeClass: "bg-slate-900 text-white border-slate-900",
          permissionsSummary: "Full Root System Access",
        };
      case "ADMIN":
        return {
          title: "System Administrator",
          department: "IT & Operations",
          badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
          permissionsSummary: "User Mgmt & Approvals",
        };
      case "ACCOUNTANT":
        return {
          title: "Senior Accountant",
          department: "Finance & Accounts",
          badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
          permissionsSummary: "GL, Invoices & Banking",
        };
      case "HR":
        return {
          title: "HR Specialist",
          department: "Human Resources",
          badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
          permissionsSummary: "Payroll, Leaves & Staff",
        };
      case "INVENTORY_MANAGER":
        return {
          title: "Inventory Lead",
          department: "Warehouse & Supply",
          badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
          permissionsSummary: "Stock & Purchase Orders",
        };
      default:
        return {
          title: "Standard Operational User",
          department: "Site Operations",
          badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
          permissionsSummary: "Operational View Access",
        };
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* =========================================================================
          DIRECTORY HEADER & CONTROLS
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              User Directory
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              {users.length} configured users
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authentication credentials, assigned roles, security status, and module privileges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Grid vs Table View Switch */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              title="Register Table View"
            >
              <List size={15} />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus size={14} />}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Invite User
          </Button>
        </div>
      </div>

      {/* =========================================================================
          TOOLBAR: SEARCH & FILTERS
          ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            {ALL_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400 cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Users</option>
            <option value="INACTIVE">Deactivated Users</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-slate-400 transition-colors"
          />
        </div>
      </div>

      {/* =========================================================================
          MAIN USER VIEW (GRID CARDS VS REGISTER TABLE)
          ========================================================================= */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full mx-auto" />
          <p className="text-xs text-slate-500 mt-3 font-medium">Loading user accounts...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs space-y-3">
          <UserX className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No users found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search.trim() || roleFilter !== "ALL" || statusFilter !== "ALL"
              ? "No user accounts matched your search or filter criteria."
              : "No user accounts exist in the directory yet. Click 'Invite User' to add one."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID CARDS VIEW (Matching Screenshot 2) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u) => {
            const roleInfo = getRoleDetails(u.role);
            const initials = u.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={u.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Card Top: Avatar, Name & Status */}
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-11 h-11 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-xs">
                          {initials}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            u.isActive ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-slate-950">
                          {u.fullName}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {roleInfo.title}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                        u.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          u.isActive ? "bg-emerald-500" : "bg-slate-400"
                        }`}
                      />
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Metadata: Email, Location, Last Active */}
                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{roleInfo.department} · Dubai HQ</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {u.lastLoginAt
                          ? `Last active: ${new Date(u.lastLoginAt).toLocaleDateString()}`
                          : "Never logged in"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Middle: Badges Row */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded-md font-semibold border ${roleInfo.badgeClass}`}
                  >
                    {u.role.replace(/_/g, " ")}
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    2FA On
                  </span>

                  <span className="px-2 py-0.5 rounded-md font-medium bg-slate-50 text-slate-600 border border-slate-200 text-[10px]">
                    {roleInfo.permissionsSummary}
                  </span>
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(u);
                      setIsEditOpen(true);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit User</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push(`/administration/users/${u.id}`)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-900 hover:text-white text-slate-600 transition-colors cursor-pointer shadow-2xs"
                    title="View Full Profile & Permissions"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>

                  {u.id !== currentUser?.id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 transition-colors cursor-pointer"
                      title="Deactivate Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW OPTION */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <UserRegisterTable
            users={filteredUsers}
            isLoading={isLoading}
            search={search}
            currentUserId={currentUser?.id}
            onAddUser={() => setIsCreateOpen(true)}
            onEdit={(user) => {
              setEditingUser(user);
              setIsEditOpen(true);
            }}
            onDelete={handleDeleteUser}
          />
        </div>
      )}

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateUser}
        isPending={createUserMutation.isPending}
      />

      {editingUser && (
        <EditUserModal
          isOpen={isEditOpen}
          user={editingUser}
          onClose={() => {
            setIsEditOpen(false);
            setEditingUser(null);
          }}
          onSubmit={handleEditUser}
          isPending={updateUserMutation.isPending}
        />
      )}
    </div>
  );
}
