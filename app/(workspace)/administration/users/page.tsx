"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import { useCreateUser, useUsers, UserItem } from "@/lib/hooks/api-hooks";
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

const ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin", color: "bg-purple-100 text-purple-800" },
  { value: "ADMIN", label: "Admin", color: "bg-blue-100 text-blue-800" },
  { value: "ACCOUNTANT", label: "Accountant", color: "bg-emerald-100 text-emerald-800" },
  { value: "USER", label: "Standard User", color: "bg-slate-100 text-slate-700" },
];

export default function UsersPage() {
  const { data: usersData, isLoading, error } = useUsers();
  const { isAdmin } = useAuth();
  const createUserMutation = useCreateUser();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");

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

  const form = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "ACCOUNTANT",
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

  const handleOpenModal = () => {
    setFormError("");
    form.reset({
      fullName: "",
      email: "",
      password: "",
      role: "ACCOUNTANT",
    });
    setIsModalOpen(true);
  };

  const columns = useMemo<ColumnDef<UserItem>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "User",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4c8b60] to-[#25533d] text-white flex items-center justify-center font-bold text-[10px]">
              {row.original.fullName.slice(0, 2).toUpperCase()}
            </div>
            <span className="font-semibold text-slate-900">{row.original.fullName}</span>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email Address",
        cell: ({ row }) => (
          <span className="font-mono text-slate-600 text-xs">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const roleObj = ROLES.find((r) => r.value === row.original.role);
          return (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${roleObj?.color || "bg-slate-100"}`}>
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
                row.original.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${row.original.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
              {row.original.isActive ? "Active" : "Disabled"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-slate-500 text-xs">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">User & Access Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based permissions, credentials management, and ERP access control.
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            size="lg"
            onClick={handleOpenModal}
            icon={<PlusIcon className="w-4 h-4" strokeWidth={2.2} />}
            className="self-start shadow-sm"
          >
            Add New User
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Users</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total ?? users.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Registered ERP user accounts</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Super Admins</p>
          <p className="text-2xl font-black text-purple-950 mt-1">{stats?.byRole?.SUPER_ADMIN || 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">Full system superusers</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Accountants</p>
          <p className="text-2xl font-black text-emerald-950 mt-1">{stats?.byRole?.ACCOUNTANT || 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">Ledger & reporting access</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Active Status</p>
          <p className="text-2xl font-black text-blue-950 mt-1">{stats?.active ?? users.filter((u) => u.isActive).length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Operational active logins</p>
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
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {formError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <form.Field
            name="fullName"
            validators={{
              onChange: ({ value }) => (!value.trim() ? "Full name is required" : undefined),
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
          </form.Field>

          <form.Field
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
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                !value ? "Temporary password is required" : value.length < 6 ? "Password must be at least 6 characters" : undefined,
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
          </form.Field>

          <form.Field name="role">
            {(field) => (
              <FormSelect
                field={field}
                label="Access Role"
                options={[
                  { value: "SUPER_ADMIN", label: "Super Admin (All permissions)" },
                  { value: "ADMIN", label: "Admin (Manage operations & finance)" },
                  { value: "ACCOUNTANT", label: "Accountant (General Ledger & Reports)" },
                  { value: "USER", label: "User (Standard submitter)" },
                ]}
              />
            )}
          </form.Field>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <FormSubmit
              form={form}
              variant="primary"
              loading={createUserMutation.isPending}
            >
              Create User
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
