"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useCreateUser,
} from "@/lib/hooks/admin-hooks";
import { useDepartments } from "@/lib/hooks/hr-hooks";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import {
  ChevronLeft,
  UserPlus,
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
} from "lucide-react";
import { ALL_ROLES } from "../../types";

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

export default function CreateUserPage() {
  const router = useRouter();
  const createUserMutation = useCreateUser();
  const { data: departments = [] } = useDepartments();
  const { user: currentUser, isSuperAdmin } = useAuth();

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("USER");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dutyStation, setDutyStation] = useState("Dubai HQ · Sheikh Zayed Road");
  const [phone, setPhone] = useState("+971 50 000 0000");
  const [isActive, setIsActive] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Password Policy Checks
  const passwordChecks = useMemo(() => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    };
  }, [password]);

  const isPasswordValid =
    passwordChecks.length &&
    passwordChecks.uppercase &&
    passwordChecks.lowercase &&
    passwordChecks.number;

  // Generate compliant temporary password
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
    toast.success("Strong compliant password generated.");
  };

  // Avatar Initials
  const initials = useMemo(() => {
    if (!fullName.trim()) return "NU";
    return fullName
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [fullName]);

  const selectedRoleDetails = ROLE_DESCRIPTIONS[role] || ROLE_DESCRIPTIONS.USER;

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
    if (!password) {
      setErrorMsg("Temporary password is required.");
      return;
    }
    if (!isPasswordValid) {
      setErrorMsg("Password does not satisfy the enterprise password security policy.");
      return;
    }
    if (role === "SUPER_ADMIN" && !isSuperAdmin) {
      setErrorMsg("Only an existing Super Administrator can provision a Super Admin account.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await createUserMutation.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: role,
      });

      toast.success(`User ${fullName} provisioned successfully!`);
      router.push(`/administration/users/${(res as any)?.id || ""}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create user account.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-full p-3 sm:p-5 space-y-4 bg-[#f8fafc] font-sans text-slate-800">
      {/* =========================================================================
          COMPACT HEADER CARD (Purchase Style)
          ========================================================================= */}
      <div className="bg-white rounded-xl p-3 sm:px-4 sm:py-3 shadow-2xs border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/administration/users"
            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors shrink-0 border border-slate-200"
            title="Back to User Directory"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>

          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <UserPlus className="w-4 h-4" />
          </div>

          <div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>Administration</span>
              <span>/</span>
              <Link href="/administration/users" className="hover:underline">
                Users
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-semibold">New Account</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Create User Account
              </h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono bg-purple-50 text-purple-800 border border-purple-200">
                PROVISION
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/administration/users")}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Provisioning...</span>
              </>
            ) : (
              <>
                <UserPlus size={14} />
                <span>Create User Account</span>
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
          MAIN FORM & PREVIEW (12-Column Responsive Layout)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Form Fields (Span 8) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Section 1: User Identity */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                  <User size={13} />
                </div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Identity &amp; Corporate Contact
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">* Required fields</span>
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
                    placeholder="e.g. Tariq Mansoor"
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
                    placeholder="user@agm.ae"
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
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971 50 000 0000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-slate-400 transition-colors font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Role & Authority Assignment (Visual Cards) */}
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
              <span className="text-[11px] text-slate-500 font-medium">
                Select target governance tier
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_ROLES.map((r) => {
                const isSelected = role === r.value;
                const config = ROLE_DESCRIPTIONS[r.value] || ROLE_DESCRIPTIONS.USER;
                const isSuperAdminRole = r.value === "SUPER_ADMIN";
                const isBlocked = isSuperAdminRole && !isSuperAdmin;

                return (
                  <div
                    key={r.value}
                    onClick={() => {
                      if (!isBlocked) setRole(r.value);
                    }}
                    className={`rounded-xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 relative ${
                      isBlocked
                        ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200"
                        : isSelected
                        ? config.color.selected
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
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
                      {isBlocked && (
                        <span className="text-rose-600 font-semibold">Super Admin Only</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Authentication & Password Policy */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                  <KeyRound size={13} />
                </div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  3. Authentication Credentials
                </h2>
              </div>
              <button
                type="button"
                onClick={generatePassword}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Auto-Generate Strong Password</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Temporary Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters, uppercase, numbers..."
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

            {/* Password Policy Checklist */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Enterprise Password Security Standard:
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
          </div>

          {/* Section 4: Security Policies & State */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                <ShieldCheck size={13} />
              </div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                4. Governance &amp; Access Controls
              </h2>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Account Status: Active
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    When active, the user can authenticate into the AGM ERP workspace.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Enforce Password Change on First Sign-In
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Requires user to set a private credential immediately upon their first login.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={mustChangePassword}
                  onChange={(e) => setMustChangePassword(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Live User Preview & Privileges Summary (Span 4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Live Directory Preview */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-2xs space-y-4 sticky top-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Live Directory Preview
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                REAL-TIME
              </span>
            </div>

            {/* Render User Card Preview */}
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
                      {fullName || "New Employee"}
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
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}
                >
                  {isActive ? "Active" : "Disabled"}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/60 space-y-1 text-[11px] text-slate-600">
                <div className="flex items-center gap-2 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-mono">{email || "pending@agm.ae"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedDepartment || selectedRoleDetails.department} · Dubai HQ</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className={`px-2 py-0.5 rounded-md font-semibold border ${selectedRoleDetails.color.badge}`}>
                  {role.replace(/_/g, " ")}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {mustChangePassword ? "Must Reset Pwd" : "Password Set"}
                </span>
              </div>
            </div>

            {/* Role Modules Granted */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Privileges Granted:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {selectedRoleDetails.modules.map((m, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Enterprise Security Callout */}
            <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-purple-900 font-bold text-[11px]">
                <Sparkles size={13} />
                <span>Governance &amp; Audit Trail</span>
              </div>
              <p className="text-[11px] text-purple-800 leading-relaxed">
                Account creation generates an immutable system audit log entry recording your administrator ID, timestamp, and role grant.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
