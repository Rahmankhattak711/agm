"use client";

import React, { use, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useUser,
  useUpdateUser,
} from "@/lib/hooks/admin-hooks";
import { useDepartments } from "@/lib/hooks/hr-hooks";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import {
  ChevronLeft,
  UserCheck,
  Shield,
  ShieldCheck,
  Mail,
  User,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Building,
  Phone,
  RefreshCw,
  FileText,
  Scale,
  CreditCard,
  Boxes,
  Users as UsersIcon,
  Check,
  KeyRound,
  ShieldAlert,
  ArrowUpRight,
  Save,
} from "lucide-react";
import { ALL_ROLES } from "../../../types";

const ROLE_DESCRIPTIONS: Record<
  string,
  {
    title: string;
    department: string;
    description: string;
    color: {
      bg: string;
      border: string;
      badge: string;
      selected: string;
      dot: string;
    };
    modules: string[];
  }
> = {
  SUPER_ADMIN: {
    title: "Super Administrator",
    department: "Executive Management",
    description: "Full root authority, system security policies, and user provisioning.",
    color: {
      bg: "bg-purple-50/40",
      border: "border-purple-200",
      badge: "bg-purple-100 text-purple-900 border-purple-200",
      selected: "ring-2 ring-purple-600 border-purple-600 bg-purple-50/70",
      dot: "bg-purple-600",
    },
    modules: ["Root Authorization", "Security & Users", "All Ledgers & Approvals", "Audit Inspection"],
  },
  ADMIN: {
    title: "System Administrator",
    department: "Executive Management",
    description: "Executive oversight, commercial contract approvals, and user accounts.",
    color: {
      bg: "bg-emerald-50/40",
      border: "border-emerald-200",
      badge: "bg-emerald-100 text-emerald-900 border-emerald-200",
      selected: "ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50/70",
      dot: "bg-emerald-600",
    },
    modules: ["User Administration", "Contract Approvals", "Sales & Purchases", "Company Export"],
  },
  ACCOUNTANT: {
    title: "Finance (Accounting & GL)",
    department: "Finance & Accounts",
    description: "General Ledger, Invoices, Supplier Bills, Payouts, and Balance Sheet.",
    color: {
      bg: "bg-blue-50/40",
      border: "border-blue-200",
      badge: "bg-blue-100 text-blue-900 border-blue-200",
      selected: "ring-2 ring-blue-600 border-blue-600 bg-blue-50/70",
      dot: "bg-blue-600",
    },
    modules: ["General Ledger & Journals", "Sales Invoices & Billing", "Bank & Cash Books", "Financial Reports"],
  },
  USER: {
    title: "Operations (Sites & Projects)",
    department: "Site Operations",
    description: "Project execution, site progress, purchase requests, and daily tracking.",
    color: {
      bg: "bg-amber-50/40",
      border: "border-amber-200",
      badge: "bg-amber-100 text-amber-900 border-amber-200",
      selected: "ring-2 ring-amber-600 border-amber-600 bg-amber-50/70",
      dot: "bg-amber-600",
    },
    modules: ["Project View & Tracking", "Purchase Requests", "Site Attendance", "Company Documents"],
  },
  HR: {
    title: "HR Specialist",
    department: "Human Resources",
    description: "Master employee directory, attendance, leaves, and WPS monthly payroll runs.",
    color: {
      bg: "bg-rose-50/40",
      border: "border-rose-200",
      badge: "bg-rose-100 text-rose-900 border-rose-200",
      selected: "ring-2 ring-rose-600 border-rose-600 bg-rose-50/70",
      dot: "bg-rose-600",
    },
    modules: ["Employee Directory", "Monthly Payroll & SIF", "Attendance & Leaves", "Staff Onboarding"],
  },
  INVENTORY_MANAGER: {
    title: "Inventory Lead",
    department: "Warehouse & Supply",
    description: "Material stock registers, goods receipt vouchers, and warehouse movements.",
    color: {
      bg: "bg-indigo-50/40",
      border: "border-indigo-200",
      badge: "bg-indigo-100 text-indigo-900 border-indigo-200",
      selected: "ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/70",
      dot: "bg-indigo-600",
    },
    modules: ["Warehouse Inventory", "Goods Receipt Vouchers", "Stock Valuations", "Material Purchases"],
  },
};

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { data: user, isLoading } = useUser(id);
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { data: departments = [] } = useDepartments();
  const updateUserMutation = useUpdateUser();

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("USER");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [dutyStation, setDutyStation] = useState("Dubai HQ · Sheikh Zayed Road");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setRole(user.role || "USER");
      setIsActive(user.isActive ?? true);
      setPassword("");
    }
  }, [user]);

  const isSelf = user?.id === currentUser?.id;
  const isTargetSuperAdmin = user?.role === "SUPER_ADMIN";
  const canEditRole = !isSelf && (isSuperAdmin || !isTargetSuperAdmin);
  const canEditStatus = !isSelf && (isSuperAdmin || !isTargetSuperAdmin);

  // Password Policy Checks (if a new password is typed)
  const passwordChecks = useMemo(() => {
    if (!password) return null;
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    };
  }, [password]);

  const isPasswordValid =
    !password ||
    (passwordChecks &&
      passwordChecks.length &&
      passwordChecks.uppercase &&
      passwordChecks.lowercase &&
      passwordChecks.number);

  const generatePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz";
    const caps = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const nums = "23456789";
    const syms = "!@#$%&*";

    let res = "";
    for (let i = 0; i < 4; i++) res += caps[Math.floor(Math.random() * caps.length)];
    for (let i = 0; i < 4; i++) res += chars[Math.floor(Math.random() * chars.length)];
    for (let i = 0; i < 3; i++) res += nums[Math.floor(Math.random() * nums.length)];
    res += syms[Math.floor(Math.random() * syms.length)];

    setPassword(res);
    setShowPassword(true);
    toast.success("Compliant reset password generated.");
  };

  const initials = useMemo(() => {
    if (!fullName.trim()) return "U";
    return fullName
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [fullName]);

  const selectedRoleDetails = ROLE_DESCRIPTIONS[role] || ROLE_DESCRIPTIONS.USER;

  if (isLoading) {
    return (
      <div className="py-24 text-center font-sans">
        <div className="animate-spin w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full mx-auto" />
        <p className="text-xs text-slate-500 mt-3 font-medium">Loading user profile for edit...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-12 text-center space-y-3 font-sans">
        <p className="text-sm font-bold text-slate-900">User account not found.</p>
        <Link
          href="/administration/users"
          className="inline-flex px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          Return to User Directory
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName.trim()) {
      setErrorMsg("Full Name is required.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg("A valid corporate email address is required.");
      return;
    }
    if (password && !isPasswordValid) {
      setErrorMsg("Password does not meet the enterprise policy (min 8 chars, upper, lower, number).");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateUserMutation.mutateAsync({
        id: user.id,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: canEditRole ? role : undefined,
        isActive: canEditStatus ? isActive : undefined,
        password: password.trim() ? password.trim() : undefined,
      });

      toast.success(`User ${fullName} updated successfully!`);
      router.push(`/administration/users/${user.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update user profile.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-full p-3 sm:p-5 space-y-4 bg-[#f8fafc] font-sans text-slate-800">
      {/* =========================================================================
          COMPACT HEADER CARD (Purchase Order Style)
          ========================================================================= */}
      <div className="bg-white rounded-xl p-3 sm:px-4 sm:py-3 shadow-2xs border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/administration/users/${user.id}`}
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors shrink-0 border border-slate-200"
            title="Back to User Profile"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>

          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <UserCheck className="w-4 h-4" />
          </div>

          <div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>Administration</span>
              <span>/</span>
              <Link href="/administration/users" className="hover:underline">
                Users
              </Link>
              <span>/</span>
              <Link href={`/administration/users/${user.id}`} className="hover:underline">
                {user.fullName}
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-semibold">Edit</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Edit User Account
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono bg-blue-50 text-blue-800 border border-blue-200">
                EDIT MODE
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/administration/users/${user.id}`}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error banner if any */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* =========================================================================
          MAIN EDIT FORM (12-Column Layout)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Form Fields (Span 8) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Section 1: Account Identity */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                  <User size={13} />
                </div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Account Identity &amp; System ID
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                System UID: {user.id.slice(0, 12)}...
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Corporate Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Allocated Department
                </label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 transition-colors cursor-pointer"
                  >
                    <option value="">Auto-derived from Role or Select...</option>
                    {departments.map((dept: any) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Duty Station / Branch Office
                </label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={dutyStation}
                    onChange={(e) => setDutyStation(e.target.value)}
                    placeholder="Dubai HQ · Sheikh Zayed Road"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Official Phone Contact
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Role Assignment */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Shield size={13} />
                </div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  2. Role &amp; Operational Authority
                </h2>
              </div>
              {!canEditRole && (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  {isSelf ? "Self-Role Protected" : "Protected Account"}
                </span>
              )}
            </div>

            {isSelf && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                <AlertCircle size={15} className="text-amber-700 shrink-0" />
                <span>
                  You cannot modify your own administrative role to prevent accidental system lockouts.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_ROLES.map((r) => {
                const isSelected = role === r.value;
                const config = ROLE_DESCRIPTIONS[r.value] || ROLE_DESCRIPTIONS.USER;
                const isSuperAdminRole = r.value === "SUPER_ADMIN";
                const isBlocked = !canEditRole || (isSuperAdminRole && !isSuperAdmin);

                return (
                  <div
                    key={r.value}
                    onClick={() => {
                      if (!isBlocked) setRole(r.value);
                    }}
                    className={`rounded-xl p-3.5 border transition-all flex flex-col justify-between space-y-2.5 relative ${
                      isBlocked
                        ? isSelected
                          ? `${config.color.selected} opacity-90 cursor-not-allowed`
                          : "opacity-40 cursor-not-allowed bg-slate-50 border-slate-200"
                        : isSelected
                        ? `${config.color.selected} cursor-pointer`
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${config.color.dot}`} />
                          <h3 className="text-xs font-bold text-slate-900">
                            {config.title}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          {config.department}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                          <Check size={12} />
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {config.description}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className={`px-2 py-0.5 rounded-full font-semibold border ${config.color.badge}`}>
                        {r.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Reset Password (Optional) */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                  <KeyRound size={13} />
                </div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  3. Reset Password (Optional)
                </h2>
              </div>
              <button
                type="button"
                onClick={generatePassword}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Auto-Generate New Password</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                New Password (leave empty to keep current password)
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to preserve current password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {password && passwordChecks && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Password Security Policy:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${passwordChecks.length ? "text-emerald-700 font-semibold" : "text-slate-400"}`}>
                    <CheckCircle2 size={13} className={passwordChecks.length ? "text-emerald-600" : "text-slate-300"} />
                    <span>8+ Characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordChecks.uppercase ? "text-emerald-700 font-semibold" : "text-slate-400"}`}>
                    <CheckCircle2 size={13} className={passwordChecks.uppercase ? "text-emerald-600" : "text-slate-300"} />
                    <span>Uppercase (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordChecks.lowercase ? "text-emerald-700 font-semibold" : "text-slate-400"}`}>
                    <CheckCircle2 size={13} className={passwordChecks.lowercase ? "text-emerald-600" : "text-slate-300"} />
                    <span>Lowercase (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordChecks.number ? "text-emerald-700 font-semibold" : "text-slate-400"}`}>
                    <CheckCircle2 size={13} className={passwordChecks.number ? "text-emerald-600" : "text-slate-300"} />
                    <span>Number (0-9)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Security Status & Deactivation */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                  <ShieldCheck size={13} />
                </div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  4. Security Governance &amp; Status
                </h2>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600"
              }`}>
                {isActive ? "Active Account" : "Deactivated"}
              </span>
            </div>

            <div className="space-y-3">
              <label
                className={`flex items-center justify-between p-3 rounded-xl border border-slate-200 ${
                  !canEditStatus ? "opacity-60 cursor-not-allowed bg-slate-50" : "cursor-pointer hover:bg-slate-50 bg-slate-50/50"
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Account Status: Active
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Disabling this account immediately invalidates all refresh tokens and active user sessions.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  disabled={!canEditStatus}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer disabled:cursor-not-allowed"
                />
              </label>

              {!isActive && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <ShieldAlert size={15} className="text-rose-600 shrink-0" />
                  <span>
                    Warning: This account is set to Disabled. The user will be barred from logging in.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live User Preview & Metadata (Span 4) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4 sticky top-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Preview
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                UPDATED
              </span>
            </div>

            {/* User Card Preview */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-black text-sm flex items-center justify-center border-2 border-white shadow-xs">
                      {initials}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        isActive ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {fullName || user.fullName}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {selectedRoleDetails.title}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {isActive ? "Active" : "Disabled"}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/60 space-y-1 text-[11px] text-slate-600">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-mono">{email || user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedRoleDetails.department} · Dubai HQ</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className={`px-2 py-0.5 rounded-md font-semibold border ${selectedRoleDetails.color.badge}`}>
                  {role.replace(/_/g, " ")}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {password ? "Reset Queued" : "Password Active"}
                </span>
              </div>
            </div>

            {/* Quick Metadata */}
            <div className="pt-2 space-y-2 text-xs border-t border-slate-100">
              <div className="flex justify-between items-center text-slate-500">
                <span>Account Created:</span>
                <span className="font-mono text-slate-700">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Last Login:</span>
                <span className="font-mono text-slate-700">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleTimeString() : "Never"}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Token Version:</span>
                <span className="font-mono text-slate-700">v{(user as any).tokenVersion || 1}</span>
              </div>
            </div>

            {/* Link to Full Profile */}
            <div className="pt-2">
              <Link
                href={`/administration/users/${user.id}`}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                <span>View Full Profile &amp; Sessions</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
