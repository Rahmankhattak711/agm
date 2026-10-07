"use client";

import { useMemo, useState, useCallback } from "react";
import { useForm } from "@tanstack/react-form";
import {
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUsers,
  UserItem,
} from "@/lib/hooks/api-hooks";
import { toast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import {
  Button,
  RegisterTable,
  RegisterColumn,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  EmptyState,
  Modal,
  FormInput,
  FormSelect,
  FormSubmit,
  DashboardCard,
  DashboardCardGrid,
  PageHeader,
  FilterBar,
} from "@/components/ui";
import {
  EditIcon,
  PlusIcon,
  ProtectedIcon,
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

const COLUMNS: RegisterColumn[] = [
  { label: "User Name", compact: true },
  { label: "Email Address", compact: true },
  {
    label: "Role / Access Level",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Account Status",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Registered Date",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Actions",
    align: "right",
    compact: true,
    hideOnPrint: true,
    className: "whitespace-nowrap pr-3 sm:pr-4",
  },
];

export default function UsersPage() {
  const { data: usersData, isLoading, error } = useUsers();
  const { user: currentUser, isSuperAdmin, isAdmin } = useAuth();
  const { confirm } = useConfirm();
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
        toast.warning("You cannot delete your own account.");
        return;
      }

      const isConfirmed = await confirm({
        title: "Delete User Account",
        message: `Are you sure you want to delete user account "${user.fullName}" (${user.email})?`,
        variant: "danger",
        confirmText: "Delete",
      });
      if (isConfirmed) {
        try {
          const res = await deleteUserMutation.mutateAsync(user.id);
          toast.success(
            res?.message ||
              `User account "${user.fullName}" deleted successfully`,
          );
        } catch (err: any) {
          toast.error(err.message || "Failed to delete user");
        }
      }
    },
    [confirm, currentUser?.id, deleteUserMutation],
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

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Users & Access Management"
        description="Manage system user accounts, role-based access permissions, and security credentials."
        actions={
          isAdmin ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              icon={<PlusIcon size={14} strokeWidth={2.5} />}
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              Add New User
            </Button>
          ) : undefined
        }
      />

      <DashboardCardGrid cols={4}>
        <DashboardCard
          title="Total System Users"
          value={stats?.total ?? users.length}
          subtitle="Registered ERP accounts"
          variant="default"
        />
        <DashboardCard
          title="Active Accounts"
          value={activeCount}
          subtitle="Operational logins"
          variant="success"
        />
        <DashboardCard
          title="System Admins"
          value={superAdminCount}
          subtitle="Privileged security roles"
          variant="default"
        />
        <DashboardCard
          title="Specialist Roles"
          value={staffCount}
          subtitle="Accountant, HR & Inventory"
          badge={
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
              RBAC
            </span>
          }
          variant="default"
        />
      </DashboardCardGrid>

      <FilterBar
        tabs={[
          { id: "ALL", label: "All Users" },
          ...ROLES.map((r) => ({ id: r.value, label: r.label })),
        ]}
        activeTab={roleFilter}
        onTabChange={(val) => setRoleFilter(val)}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search user name or email..."
        totalCount={filteredUsers.length}
        countLabel="Accounts Listed"
      />

      {error ? (
        <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
          Error loading user accounts: {(error as any).message}
        </div>
      ) : (
        <RegisterTable
          title="Master Users & Permissions Register"
          countLabel={`${filteredUsers.length} Accounts`}
          columns={COLUMNS}
        >
          <TableBody className="divide-y divide-slate-100 font-medium">
            {isLoading ? (
              <TableLoading colSpan={6} rows={5} />
            ) : filteredUsers.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0 border-0">
                  <EmptyState
                    icon={
                      <ProtectedIcon size={20} className="text-slate-400" />
                    }
                    title="No users found"
                    description={
                      search || roleFilter !== "ALL"
                        ? "No user accounts matched your search criteria."
                        : "No users in database. Click 'Add New User' to create one."
                    }
                    actionLabel={
                      isAdmin && !search ? "Add New User" : undefined
                    }
                    onAction={
                      isAdmin && !search ? handleOpenCreateModal : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const roleObj = ROLES.find((r) => r.value === user.role);
                const allowed = canManageTargetUser(user);
                return (
                  <TableRow
                    key={user.id}
                    onClick={() => handleOpenEditModal(user)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <TableCell className="py-2.5 px-2.5 sm:px-3 text-xs">
                      <div className="flex flex-col items-start justify-center min-w-0">
                        <span className="font-bold text-slate-900 block text-xs truncate max-w-[200px] sm:max-w-[260px]">
                          {user.fullName}
                        </span>
                        {user.id === currentUser?.id && (
                          <span className="mt-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap inline-flex items-center leading-none">
                            Current Session
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5 px-2.5 sm:px-3 text-xs">
                      <span className="font-medium text-slate-600">
                        {user.email}
                      </span>
                    </TableCell>

                    <TableCell
                      align="center"
                      className="py-2.5 px-2.5 sm:px-3 text-center text-xs whitespace-nowrap"
                    >
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border whitespace-nowrap ${roleObj?.color || "bg-slate-100 text-slate-700 border-slate-200"}`}
                      >
                        {roleObj?.label || user.role}
                      </span>
                    </TableCell>

                    <TableCell
                      align="center"
                      className="py-2.5 px-2.5 sm:px-3 text-center text-xs whitespace-nowrap"
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border whitespace-nowrap ${
                          user.isActive
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-slate-400"}`}
                        />
                        {user.isActive ? "Active" : "Disabled"}
                      </span>
                    </TableCell>

                    <TableCell
                      align="center"
                      className="py-2.5 px-2.5 sm:px-3 text-center text-slate-500 text-xs font-mono font-medium whitespace-nowrap"
                    >
                      {new Date(user.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>

                    <TableCell className="py-2.5 px-2.5 sm:px-3 text-right print:hidden whitespace-nowrap">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {allowed || user.id === currentUser?.id ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(user)}
                            className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-teal-800 rounded-lg hover:bg-teal-50 transition cursor-pointer"
                            title="Edit User"
                          >
                            <EditIcon size={18} className="w-[18px] h-[18px]" />
                          </Button>
                        ) : (
                          <span
                            className="h-7 px-2 flex items-center justify-center text-[10px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-lg"
                            title="Protected Account"
                          >
                            <ProtectedIcon size={11} className="mr-1" />
                            Protected
                          </span>
                        )}
                        {user.id !== currentUser?.id && allowed && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                            title="Delete User"
                          >
                            <TrashIcon
                              size={18}
                              className="w-[18px] h-[18px]"
                            />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </RegisterTable>
      )}

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
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
            >
              Create Account
            </FormSubmit>
          </div>
        </form>
      </Modal>

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
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
            >
              Save User Changes
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
