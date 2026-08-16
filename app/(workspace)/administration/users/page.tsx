"use client";

import { useState } from "react";
import { useCreateUser, useUsers } from "@/lib/hooks/api-hooks";
import { useAuth } from "@/context/AuthContext";

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

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ACCOUNTANT");
  const [formError, setFormError] = useState("");

  const users = usersData?.users || [];
  const stats = usersData?.stats;

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenModal = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("ACCOUNTANT");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fullName.trim() || !email.trim() || !password) {
      setFormError("Full name, email, and temporary password are required.");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
      });

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to create user");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">User & Access Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based permissions, credentials management, and ERP access control.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer self-start"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add New User
          </button>
        )}
      </div>

      {/* Role Stats Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Users</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total || users.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">{stats?.active || 0} active accounts</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Administrators</p>
          <p className="text-2xl font-black text-purple-950 mt-1">
            {(stats?.byRole?.SUPER_ADMIN || 0) + (stats?.byRole?.ADMIN || 0)}
          </p>
          <p className="text-xs text-purple-700 mt-0.5">Full system management</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Accountants</p>
          <p className="text-2xl font-black text-emerald-950 mt-1">{stats?.byRole?.ACCOUNTANT || 0}</p>
          <p className="text-xs text-emerald-700 mt-0.5">Finance & journal posting</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Standard Users</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats?.byRole?.USER || 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">Read-only & submissions</p>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none text-slate-700 font-medium"
            >
              <option value="ALL">All Roles</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table View */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">Loading users...</div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-red-500">
            {error instanceof Error && error.message.includes("403")
              ? "Access Restricted: You must be an Administrator to view and manage users."
              : `Error loading users: ${(error as any).message}`}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-600">No users found</p>
            <p className="text-xs mt-1">Add users or invite teammates using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 px-3">User</th>
                  <th className="pb-3 px-3">Email Address</th>
                  <th className="pb-3 px-3">Role</th>
                  <th className="pb-3 px-3 text-center">Status</th>
                  <th className="pb-3 px-3 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const roleObj = ROLES.find((r) => r.value === u.role);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4c8b60] to-[#25533d] text-white flex items-center justify-center font-bold text-[10px]">
                          {u.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        {u.fullName}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${roleObj?.color || "bg-slate-100"}`}>
                          {roleObj?.label || u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {u.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-900">Add New System User</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3.5">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="user@agm.ae"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Temporary Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Access Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="SUPER_ADMIN">Super Admin (All permissions)</option>
                  <option value="ADMIN">Admin (Manage operations & finance)</option>
                  <option value="ACCOUNTANT">Accountant (General Ledger & Reports)</option>
                  <option value="USER">User (Standard submitter)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
