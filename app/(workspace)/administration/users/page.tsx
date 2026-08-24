"use client";

import { useMemo, useState } from "react";
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
import { PlusIcon } from "@/components/icons";
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
  FormInput,
  FormSelect,
  FormSubmit,
} from "@/components/ui";
import { Trash2, Edit3 } from "lucide-react";

const ROLES = [
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
    color: "bg-purple-100 text-purple-800 border border-purple-200",
  },
  {
    value: "ADMIN",
    label: "Admin",
    color: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  {
    value: "ACCOUNTANT",
    label: "Accountant",
    color: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  {
    value: "HR",
    label: "HR Specialist",
    color: "bg-pink-100 text-pink-800 border border-pink-200",
  },
  {
    value: "INVENTORY_MANAGER",
    label: "Inventory Manager",
    color: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  {
    value: "USER",
    label: "Standard User",
    color: "bg-slate-100 text-slate-700 border border-slate-200",
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

  const users = usersData?.users || [];
  const stats = usersData?.stats;

  const filteredUsers = useMemo(() => {
    return (users || []).filter((u) => {
      const q = search.toLowerCase();
      const matchesSearch =
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

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

  const handleOpenCreateModal = () => {
    setFormError("");
    createForm.reset({
      fullName: "",
      email: "",
      password: "",
      role: "USER",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserItem) => {
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
  };

  const handleDeleteUser = async (user: UserItem) => {
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
  };

  const canManageTargetUser = (target: UserItem) => {
    if (isSuperAdmin) return true;
    if (isAdmin) {
      return (
        target.role !== "SUPER_ADMIN" &&
        target.role !== "ADMIN" &&
        target.id !== currentUser?.id
      );
    }
    return false;
  };

  const columns = useMemo<ColumnDef<UserItem>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "User",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4c8b60] to-[#25533d] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {row.original.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="font-semibold text-slate-900 block text-xs">
                {row.original.fullName}
              </span>
              {row.original.id === currentUser?.id && (
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  You
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
          <span className="font-mono text-slate-600 text-xs">
            {row.original.email}
          </span>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const roleObj = ROLES.find((r) => r.value === row.original.role);
          return (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${roleObj?.color || "bg-slate-100"}`}
            >
              {roleObj?.label || row.original.role}
            </span>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <div className="text-center">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                row.original.isActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-500 border border-slate-200"
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
        header: "Created",
        cell: ({ row }) => (
          <span className="text-slate-500 text-xs font-mono">
            {new Date(row.original.createdAt).toLocaleDateString("en-GB")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const allowed = canManageTargetUser(row.original);

          if (!allowed && row.original.id !== currentUser?.id) {
            return (
              <div className="flex items-center justify-end">
                <span className="text-[10px] font-semibold text-slate-400">
                  Protected
                </span>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-end gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="text-slate-700 hover:bg-slate-50 gap-1 text-xs"
                onClick={() => handleOpenEditModal(row.original)}
                icon={<Edit3 size={13} />}
              >
                Edit
              </Button>
              {row.original.id !== currentUser?.id && allowed && (
                <Button
                  variant="danger"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() => handleDeleteUser(row.original)}
                  icon={<Trash2 size={13} />}
                >
                  Delete
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [currentUser?.id, isSuperAdmin, isAdmin],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            User & Access Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based permissions, credentials management, account status, and
            system access control.
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            size="lg"
            onClick={handleOpenCreateModal}
            icon={<PlusIcon className="w-4 h-4" strokeWidth={2.2} />}
            className="self-start shadow-sm"
          >
            Add New User
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Users
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {stats?.total ?? users.length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered ERP user accounts
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
            Super Admins
          </p>
          <p className="text-2xl font-black text-purple-950 mt-1">
            {stats?.byRole?.SUPER_ADMIN || 0}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Full system superusers
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Accountants & HR
          </p>
          <p className="text-2xl font-black text-emerald-950 mt-1">
            {(stats?.byRole?.ACCOUNTANT || 0) + (stats?.byRole?.HR || 0)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Finance, payroll & HR managers
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            Active Status
          </p>
          <p className="text-2xl font-black text-blue-950 mt-1">
            {stats?.active ?? users.filter((u) => u.isActive).length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational active logins
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-72">
            <Input
              type="text"
              placeholder="Search user name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[{ value: "ALL", label: "All Roles" }, ...ROLES]}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredUsers}
          isLoading={isLoading}
          emptyTitle="No users found"
          emptyMessage="Add users or invite teammates using the button above."
        />
      </div>

      {/* CREATE USER MODAL */}
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
          className="space-y-4"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
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
                label="Access Role"
                options={[
                  ...(isSuperAdmin
                    ? [
                        {
                          value: "SUPER_ADMIN",
                          label: "Super Admin (Full System Access)",
                        },
                        {
                          value: "ADMIN",
                          label: "Admin (Operations & Management)",
                        },
                      ]
                    : []),
                  {
                    value: "ACCOUNTANT",
                    label: "Accountant (Finance & Ledgers)",
                  },
                  {
                    value: "HR",
                    label: "HR (Leaves, Attendance, Staff)",
                  },
                  {
                    value: "INVENTORY_MANAGER",
                    label: "Inventory Manager (Stock & POs)",
                  },
                  { value: "USER", label: "Standard User (Read/Submit)" },
                ]}
              />
            )}
          </createForm.Field>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <FormSubmit
              form={createForm}
              variant="primary"
              loading={createUserMutation.isPending}
            >
              Create User
            </FormSubmit>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
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
          className="space-y-4"
        >
          {editFormError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
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
              <FormInput
                field={field}
                label="Full Name *"
                placeholder="e.g. John Doe"
                required
              />
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
                placeholder="user@agm.ae"
                required
              />
            )}
          </editForm.Field>

          <editForm.Field name="role">
            {(field) => (
              <FormSelect
                field={field}
                label="Assign Role"
                disabled={editingUser?.id === currentUser?.id}
                options={[
                  ...(isSuperAdmin
                    ? [
                        {
                          value: "SUPER_ADMIN",
                          label: "Super Admin (Full System Access)",
                        },
                        {
                          value: "ADMIN",
                          label: "Admin (Operations & Management)",
                        },
                      ]
                    : []),
                  {
                    value: "ACCOUNTANT",
                    label: "Accountant (Finance & Ledgers)",
                  },
                  {
                    value: "HR",
                    label: "HR (Leaves, Attendance, Staff)",
                  },
                  {
                    value: "INVENTORY_MANAGER",
                    label: "Inventory Manager (Stock & POs)",
                  },
                  { value: "USER", label: "Standard User (Read/Submit)" },
                ]}
              />
            )}
          </editForm.Field>

          <editForm.Field name="isActive">
            {(field) => (
              <FormSelect
                field={field}
                label="Account Status"
                disabled={editingUser?.id === currentUser?.id}
                options={[
                  { value: "true", label: "Active (Login allowed)" },
                  { value: "false", label: "Disabled (Suspended access)" },
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
                label="Reset Password (leave blank to keep current)"
                placeholder="New password (optional)"
              />
            )}
          </editForm.Field>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingUser(null);
              }}
            >
              Cancel
            </Button>
            <FormSubmit
              form={editForm}
              variant="primary"
              loading={updateUserMutation.isPending}
            >
              Save Changes
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
