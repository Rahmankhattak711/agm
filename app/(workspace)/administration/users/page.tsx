"use client";

import { useMemo, useState, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import {
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUsers,
  UserItem,
} from "@/lib/hooks/api-hooks";
import { useAuth } from "@/context/AuthContext";
import {
  Button,
  Input,
  DataTable,
  Modal,
  FormInput,
  FormSelect,
  FormSubmit,
} from "@/components/ui";
import {
  EditIcon,
  PlusIcon,
  ProtectedIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";

const ROLES = [
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
    color: "bg-purple-50 text-purple-800 border-purple-200",
  },
  {
    value: "ADMIN",
    label: "Admin",
    color: "bg-sky-50 text-sky-800 border-sky-200",
  },
  {
    value: "ACCOUNTANT",
    label: "Accountant",
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    value: "HR",
    label: "HR Specialist",
    color: "bg-teal-50 text-teal-800 border-teal-200",
  },
  {
    value: "INVENTORY_MANAGER",
    label: "Inventory Manager",
    color: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    value: "USER",
    label: "Standard User",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
];

export default function UsersPage() {
  const { data: usersData, isLoading, error } = useUsers();
  const { user: currentUser, isSuperAdmin, isAdmin } = useAuth();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formError, setFormError] = useState("");
  const [editFormError, setEditFormError] = useState("");

  const users = useMemo(() => usersData?.users || [], [usersData?.users]);
  const stats = usersData?.stats;

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

  const superAdminCount = useMemo(
    () =>
      users.filter((u) => u.role === "SUPER_ADMIN" || u.role === "ADMIN")
        .length,
    [users],
  );

  const activeCount = useMemo(
    () => users.filter((u) => u.isActive).length,
    [users],
  );

  const staffCount = useMemo(
    () =>
      users.filter(
        (u) =>
          u.role === "ACCOUNTANT" ||
          u.role === "HR" ||
          u.role === "INVENTORY_MANAGER",
      ).length,
    [users],
  );

  const createForm = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "USER",
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        await createUserMutation.mutateAsync({
          fullName: value.fullName.trim(),
          email: value.email.trim(),
          password: value.password,
          role: value.role,
        });

        setIsModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to create user");
      }
    },
  });

  const editForm = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      role: "USER",
      isActive: "true",
      password: "",
    },
    onSubmit: async ({ value }) => {
      if (!editingUser) return;
      setEditFormError("");
      try {
        await updateUserMutation.mutateAsync({
          id: editingUser.id,
          fullName: value.fullName.trim(),
          email: value.email.trim(),
          role: value.role,
          isActive: value.isActive === "true",
          password: value.password.trim() ? value.password.trim() : undefined,
        });

        setIsEditModalOpen(false);
        setEditingUser(null);
      } catch (err: any) {
        setEditFormError(err.message || "Failed to update user");
      }
    },
  });

  const handleOpenCreateModal = useCallback(() => {
    setFormError("");
    createForm.reset({
      fullName: "",
      email: "",
      password: "",
      role: "USER",
    });
    setIsModalOpen(true);
  }, [createForm]);

  const handleOpenEditModal = useCallback(
    (user: UserItem) => {
      setEditingUser(user);
      setEditFormError("");
      editForm.reset({
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive ? "true" : "false",
        password: "",
      });
      setIsEditModalOpen(true);
    },
    [editForm],
  );

  const handleDeleteUser = useCallback(
    async (user: UserItem) => {
      if (user.id === currentUser?.id) {
        alert("You cannot delete your own account.");
        return;
      }

      if (
        confirm(
          `Are you sure you want to delete user account "${user.fullName}" (${user.email})?`,
        )
      ) {
        try {
          const res = await deleteUserMutation.mutateAsync(user.id);
          if (res?.message) {
            alert(res.message);
          }
        } catch (err: any) {
          alert(err.message || "Failed to delete user");
        }
      }
    },
    [currentUser?.id, deleteUserMutation],
  );

  const canManageTargetUser = useCallback(
    (target: UserItem) => {
      if (isSuperAdmin) return true;
      if (isAdmin) {
        return (
          target.role !== "SUPER_ADMIN" &&
          target.role !== "ADMIN" &&
          target.id !== currentUser?.id
        );
      }
      return false;
    },
    [isSuperAdmin, isAdmin, currentUser?.id],
  );

  const columns = useMemo<ColumnDef<UserItem>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "User Details",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {row.original.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                {row.original.fullName}
              </span>
              {row.original.id === currentUser?.id && (
                <span className="text-[9px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                  Current Session
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email Address",
        cell: ({ row }) => (
          <span className="font-mono text-slate-700 text-xs">
            {row.original.email}
          </span>
        ),
      },
      {
        accessorKey: "role",
        header: () => <div className="text-center">Role / Access Level</div>,
        cell: ({ row }) => {
          const roleObj = ROLES.find((r) => r.value === row.original.role);
          return (
            <div className="text-center">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${roleObj?.color || "bg-slate-100"}`}
              >
                {roleObj?.label || row.original.role}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: () => <div className="text-center">Account Status</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                row.original.isActive
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${row.original.isActive ? "bg-emerald-500" : "bg-slate-400"}`}
              />
              {row.original.isActive ? "Active" : "Disabled"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Registered Date",
        cell: ({ row }) => (
          <span className="text-slate-600 text-xs font-mono">
            {new Date(row.original.createdAt).toLocaleDateString("en-GB")}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          const allowed = canManageTargetUser(row.original);

          if (!allowed && row.original.id !== currentUser?.id) {
            return (
              <div className="flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenEditModal(row.original)}
                  icon={<ProtectedIcon size={13} />}
                  title="Protected"
                >
                  Protected
                </Button>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenEditModal(row.original)}
                icon={<EditIcon size={13} />}
                title="Edit User"
              >
                Edit User
              </Button>
              {row.original.id !== currentUser?.id && allowed && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteUser(row.original)}
                  icon={<TrashIcon size={13} />}
                  title="Delete User"
                >
                  Delete
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [
      currentUser?.id,
      canManageTargetUser,
      handleOpenEditModal,
      handleDeleteUser,
    ],
  );

  return (
    <div className="space-y-6">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            User &amp; Access Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AGM FITOUT TECHNICAL SERVICES LLC — Role-based permissions,
            credentials management, <br /> account status, and system access
            control.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              icon={<PlusIcon size={14} strokeWidth={2.5} />}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Add New User
            </Button>
          </div>
        )}
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* 1. Total Users */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Total System Users
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Registered ERP accounts
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {stats?.total ?? users.length}
            </span>
            <span className="text-xs font-bold text-slate-500 font-sans ml-1.5">
              Users
            </span>
          </div>
        </div>

        {/* 2. Active Accounts */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              2. Active Accounts
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Operational logins
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-emerald-800 font-mono">
              {activeCount}
            </span>
            <span className="text-xs font-bold text-emerald-700 font-sans ml-1.5">
              Active
            </span>
          </div>
        </div>

        {/* 3. Super Admins & Admins */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-purple-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              3. System Admins
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Privileged security roles
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-purple-800 font-mono">
              {superAdminCount}
            </span>
            <span className="text-xs font-bold text-purple-700 font-sans ml-1.5">
              Admins
            </span>
          </div>
        </div>

        {/* 4. Operations & Finance Managers */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-teal-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                4. Specialist Roles
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200">
                RBAC
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Accountant, HR &amp; Inventory
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-teal-900 font-mono">
              {staffCount}
            </span>
            <span className="text-xs font-bold text-teal-700 font-sans ml-1.5">
              Managers
            </span>
          </div>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        {/* Search & Filter Strip */}
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Status Quick Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {[{ value: "ALL", label: "All Users" }, ...ROLES].map((tab) => {
                const isActive = roleFilter === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setRoleFilter(tab.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 text-emerald-800"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <span className="text-[11px] font-bold text-slate-500 font-mono">
              {filteredUsers.length} Accounts Listed
            </span>
          </div>

          <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
            <Input
              containerClassName="w-full sm:w-80"
              placeholder="Search user name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<SearchIcon size={16} />}
              className="py-1.5 shadow-2xs"
            />
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading user accounts: {(error as any).message}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
              <h4 className="font-black text-xs uppercase tracking-wider text-white">
                Master Users &amp; Permissions Register
              </h4>
              <span className="text-[11px] font-mono text-emerald-300 font-bold">
                {filteredUsers.length} Accounts
              </span>
            </div>

            <DataTable
              columns={columns}
              data={filteredUsers}
              isLoading={isLoading}
              emptyTitle="No users found"
              emptyMessage="Add users or invite teammates using the button above."
            />
          </div>
        )}
      </div>

      {/* Modal for Creating User */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New System User"
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            createForm.handleSubmit();
          }}
          className="space-y-4 text-xs"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              {formError}
            </div>
          )}

          <createForm.Field
            name="fullName"
            validators={{
              onChange: ({ value }) =>
                !value.trim() ? "Full name is required" : undefined,
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                label="Full Name *"
                placeholder="e.g. John Doe"
                required
              />
            )}
          </createForm.Field>

          <createForm.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                !value.trim()
                  ? "Email is required"
                  : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                    ? "Invalid email format"
                    : undefined,
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                type="email"
                label="Email Address *"
                placeholder="user@agm.ae"
                required
              />
            )}
          </createForm.Field>

          <createForm.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                !value
                  ? "Temporary password is required"
                  : value.length < 6
                    ? "Password must be at least 6 characters"
                    : undefined,
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                type="password"
                label="Temporary Password *"
                placeholder="••••••••"
                required
              />
            )}
          </createForm.Field>

          <createForm.Field name="role">
            {(field) => (
              <FormSelect
                field={field}
                label="Assigned System Role *"
                required
                options={ROLES.map((r) => ({
                  value: r.value,
                  label: r.label,
                }))}
              />
            )}
          </createForm.Field>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <FormSubmit
              form={createForm}
              loading={createUserMutation.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
            >
              Create Account
            </FormSubmit>
          </div>
        </form>
      </Modal>

      {/* Modal for Editing User */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        title={`Edit User: ${editingUser?.fullName || ""}`}
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            editForm.handleSubmit();
          }}
          className="space-y-4 text-xs"
        >
          {editFormError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
              {editFormError}
            </div>
          )}

          <editForm.Field
            name="fullName"
            validators={{
              onChange: ({ value }) =>
                !value.trim() ? "Full name is required" : undefined,
            }}
          >
            {(field) => (
              <FormInput field={field} label="Full Name *" required />
            )}
          </editForm.Field>

          <editForm.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                !value.trim()
                  ? "Email is required"
                  : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                    ? "Invalid email format"
                    : undefined,
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                type="email"
                label="Email Address *"
                required
              />
            )}
          </editForm.Field>

          {isSuperAdmin && (
            <editForm.Field name="role">
              {(field) => (
                <FormSelect
                  field={field}
                  label="Role *"
                  required
                  options={ROLES.map((r) => ({
                    value: r.value,
                    label: r.label,
                  }))}
                />
              )}
            </editForm.Field>
          )}

          <editForm.Field name="isActive">
            {(field) => (
              <FormSelect
                field={field}
                label="Account Status"
                options={[
                  { value: "true", label: "Active (Can Log In)" },
                  { value: "false", label: "Disabled (Blocked)" },
                ]}
              />
            )}
          </editForm.Field>

          <editForm.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                value && value.length < 6
                  ? "Password must be at least 6 characters"
                  : undefined,
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                type="password"
                label="Reset Password (Leave blank to keep current)"
                placeholder="New password..."
              />
            )}
          </editForm.Field>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingUser(null);
              }}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <FormSubmit
              form={editForm}
              loading={updateUserMutation.isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
            >
              Save User Changes
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
