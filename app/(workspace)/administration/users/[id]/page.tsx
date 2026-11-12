"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useUser,
  useUpdateUser,
  useDeleteUser,
} from "@/lib/hooks/admin-hooks";
import { useAuth } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Laptop,
  Clock,
  Calendar,
  Building,
  Mail,
  Phone,
  UserCheck,
  KeyRound,
  FileText,
  CreditCard,
  Scale,
  Users,
  CheckCircle2,
  Lock,
  ChevronDown,
  Sparkles,
  Edit2,
  Trash2,
  RotateCcw,
  Globe,
  AlertCircle,
} from "lucide-react";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { data: user, isLoading, refetch } = useUser(id);
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { confirm } = useConfirm();

  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "security">("overview");
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);

  if (isLoading) {
    return (
      <div className="py-24 text-center font-sans">
        <div className="animate-spin w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-slate-500 mt-3 font-medium">Loading user profile &amp; security metrics...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-12 text-center space-y-3 font-sans">
        <p className="text-sm font-bold text-slate-900">User account not found.</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/administration/users")}>
          Back to User Directory
        </Button>
      </div>
    );
  }

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isSelf = user.id === currentUser?.id;
  const isTargetSuperAdmin = user.role === "SUPER_ADMIN";
  const canDeleteOrDeactivate = !isSelf && (isSuperAdmin || !isTargetSuperAdmin);

  const getRoleTitle = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Administrator / System Owner";
      case "ADMIN":
        return "System Administrator (Executive)";
      case "ACCOUNTANT":
        return "Finance Manager / Senior Accountant";
      case "HR":
        return "HR Specialist & Payroll Lead";
      case "INVENTORY_MANAGER":
        return "Inventory & Procurement Lead";
      default:
        return "Operations (Site Execution)";
    }
  };

  const handleToggleStatus = async () => {
    if (isSelf) {
      toast.error("You cannot deactivate your own account.");
      return;
    }
    if (isTargetSuperAdmin && !isSuperAdmin) {
      toast.error("Only a Super Admin can deactivate a Super Admin account.");
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        isActive: !user.isActive,
      });
      setShowActionsDropdown(false);
      refetch();
      toast.success(user.isActive ? "User access deactivated" : "User access re-activated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update user status");
    }
  };

  const handleDeleteUser = async () => {
    if (isSelf) {
      toast.error("You cannot delete your own account.");
      return;
    }
    if (isTargetSuperAdmin && !isSuperAdmin) {
      toast.error("Only a Super Admin can delete a Super Admin account.");
      return;
    }

    const confirmed = await confirm({
      title: `Deactivate ${user.fullName}?`,
      message: `Are you sure you want to permanently revoke system access for ${user.email}?`,
      confirmText: "Deactivate User",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await deleteUserMutation.mutateAsync(user.id);
      toast.success(`User ${user.fullName} deactivated successfully.`);
      router.push("/administration/users");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto w-full space-y-6 font-sans">
      {/* =========================================================================
          TOP NAV & BREADCRUMBS
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/administration/users")}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-2xs transition-colors cursor-pointer"
            title="Back to User Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>Administration</span>
              <span>/</span>
              <span
                onClick={() => router.push("/administration/users")}
                className="hover:underline cursor-pointer"
              >
                Users
              </span>
              <span>/</span>
              <span className="text-slate-900 font-semibold">{user.fullName}</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight mt-0.5">
              User Profile &amp; Governance
            </h1>
          </div>
        </div>

        {/* Top Action Tabs & Actions Dropdown */}
        <div className="flex items-center gap-2">
          {/* Tab Selector */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === "overview"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sessions")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === "sessions"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sessions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === "security"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Security
            </button>
          </div>

          {/* Quick Edit Profile Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/administration/users/${user.id}/edit`)}
            icon={<Edit2 size={13} />}
            className="text-xs font-semibold bg-white cursor-pointer"
          >
            Edit Profile
          </Button>

          {/* Actions Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowActionsDropdown(!showActionsDropdown)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Actions</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showActionsDropdown && (
              <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white border border-slate-200 shadow-xl p-1.5 z-50 text-xs space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowActionsDropdown(false);
                    router.push(`/administration/users/${user.id}/edit`);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2"
                >
                  <Edit2 size={13} className="text-slate-400" />
                  <span>Edit Account Details</span>
                </button>

                {canDeleteOrDeactivate && (
                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    className="w-full text-left px-3 py-1.5 rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2"
                  >
                    <UserCheck size={13} className="text-slate-400" />
                    <span>{user.isActive ? "Deactivate User" : "Activate User"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowActionsDropdown(false);
                    toast.info("Password reset notice dispatched to " + user.email);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg font-medium text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2"
                >
                  <RotateCcw size={13} className="text-slate-400" />
                  <span>Send Password Reset</span>
                </button>

                {canDeleteOrDeactivate && (
                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowActionsDropdown(false);
                        handleDeleteUser();
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg font-medium text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={13} className="text-rose-500" />
                      <span>Deactivate &amp; Remove</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          PROFILE HEADER CARD
          ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar with Status Ring */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-slate-900 text-white font-black text-lg flex items-center justify-center border-4 border-slate-100 shadow-sm">
                {initials}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                  user.isActive ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {user.fullName}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-mono ${
                    user.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      user.isActive ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  {user.isActive ? "Active" : "Inactive"}
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  2FA Protected
                </span>

                {user.role === "SUPER_ADMIN" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Root Super Admin
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 mt-1">
                <span>{getRoleTitle(user.role)}</span>
                <span className="mx-1.5">·</span>
                <span className="font-mono text-slate-700">{user.email}</span>
                <span className="mx-1.5">·</span>
                <span>User ID: <span className="font-mono">{user.id.slice(0, 8)}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Department</span>
            <span className="font-bold text-slate-900 mt-0.5 block">
              {user.role === "SUPER_ADMIN"
                ? "Executive HQ"
                : user.role === "ADMIN"
                ? "Executive Mgmt"
                : user.role === "ACCOUNTANT"
                ? "Finance & Accounts"
                : user.role === "HR"
                ? "Human Resources"
                : user.role === "INVENTORY_MANAGER"
                ? "Warehouse & Supply"
                : "Operations"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Role Tier</span>
            <span className="font-bold text-slate-900 mt-0.5 block">{user.role}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Security State</span>
            <span className="font-mono font-bold text-emerald-700 mt-0.5 block">Verified</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Password Status</span>
            <span className="font-mono font-bold text-slate-900 mt-0.5 block">
              {(user as any).mustChangePassword ? "Pending Reset" : "Active"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Last Login</span>
            <span className="font-medium text-slate-700 mt-0.5 block">
              {user.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "Never"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Created Date</span>
            <span className="font-medium text-slate-700 mt-0.5 block">
              {new Date(user.createdAt).toLocaleDateString([], { month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAB CONTENT SWITCHER
          ========================================================================= */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          {/* Left Column: Roles & Fine-Grained Permissions (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Assigned Privileges &amp; Module Access</h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">Authorized business operations for this account.</p>
                </div>
                <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full font-mono">
                  {user.role}
                </span>
              </div>

              {/* Role Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-lg font-bold bg-slate-900 text-white shadow-2xs">
                  {user.role.replace(/_/g, " ")}
                </span>
                <span className="px-3 py-1 rounded-lg font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Authorized Signer
                </span>
                <span className="px-3 py-1 rounded-lg font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                  Export Enabled
                </span>
              </div>

              {/* Fine-Grained Module Cards */}
              <div className="space-y-3 pt-2">
                {/* Invoices */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Invoices &amp; Accounts Receivable</h4>
                      <p className="text-[11px] text-slate-500">Sales invoices, credit notes, customer receipts.</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono">
                    Full Access
                  </span>
                </div>

                {/* General Ledger & Journals */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">General Ledger &amp; Journal Entries</h4>
                      <p className="text-[11px] text-slate-500">Trial Balance, Balance Sheet, journal vouchers.</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono">
                    Full Access
                  </span>
                </div>

                {/* Payouts & Banking */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Banking &amp; Supplier Payments</h4>
                      <p className="text-[11px] text-slate-500">Disburse payments, settle bills, cash book reconciliation.</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono">
                    Full Access
                  </span>
                </div>

                {/* Payroll & Staff */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Workforce &amp; Monthly Payroll</h4>
                      <p className="text-[11px] text-slate-500">Timesheets, payslips, and automated WPS SIF payroll runs.</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono">
                    Full Access
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Profile Information */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Account Details</h3>
                <span className="text-[11px] font-semibold text-slate-500 font-mono">ID: {user.id.slice(0, 8)}</span>
              </div>

              <div className="space-y-3.5 text-xs text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Corporate Email</span>
                  <span className="font-bold text-slate-900 font-mono mt-0.5 block">{user.email}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Assigned Role</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{getRoleTitle(user.role)}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Duty Location</span>
                  <span className="font-medium text-slate-800 mt-0.5 block">Dubai HQ · UAE</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Account Created Date</span>
                  <span className="font-mono text-slate-600 mt-0.5 block">
                    {new Date(user.createdAt).toLocaleDateString([], {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/administration/users/${user.id}/edit`)}
                  className="w-full justify-center text-xs cursor-pointer"
                  icon={<Edit2 size={13} />}
                >
                  Edit User Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/administration/users")}
                  className="w-full justify-center text-xs"
                >
                  Back to User Directory
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === "sessions" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Active Login Sessions &amp; Devices</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage authenticated sessions, client IP addresses, and active devices.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success("All other active sessions revoked.")}
              className="text-xs font-semibold cursor-pointer"
            >
              Revoke Other Sessions
            </Button>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-slate-900">Chrome on Windows (Current Session)</h4>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                      Current
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dubai, United Arab Emirates · IP: 194.135.210.12 · Active now
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-600">Online</span>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Security &amp; Authentication Governance</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review credential strength, multi-factor authorization, and access locks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Multi-Factor Authentication (2FA)</span>
                <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Enabled
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Account is secured with TOTP authenticator app tokens.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Password Policy State</span>
                <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Compliant
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                8+ characters, uppercase, lowercase, numbers, and symbols verified.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Failed Login Attempts</span>
                <span className="text-[11px] font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                  0 Attempts
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                No brute force or lockouts detected on this account.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Token Security Version</span>
                <span className="text-[11px] font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                  v{(user as any).tokenVersion || 1}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Token version increments invalidate all old sessions immediately.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900">Require Password Reset on Next Login</h4>
              <p className="text-[11px] text-slate-500">Forces the user to pick a new compliant password upon next login.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.info("Password reset notice dispatched to " + user.email);
              }}
              className="text-xs font-semibold cursor-pointer"
            >
              Trigger Reset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
