"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  Shield,
  KeyRound,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const ADMIN_TABS = [
  {
    name: "Users",
    href: "/administration/users",
    icon: Users,
    description: "Manage accounts & user access",
  },
  {
    name: "Roles",
    href: "/administration/roles",
    icon: Shield,
    description: "Role builder & custom policies",
  },
  {
    name: "Permissions",
    href: "/administration/permissions",
    icon: KeyRound,
    description: "Fine-grained module access matrix",
  },
];

export default function AdministrationLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSuperAdmin, loading } = useAuth();

  const isAdmin = isSuperAdmin || user?.role === "ADMIN";

  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The Administration and Access Control sub-system is strictly restricted to Super Administrators and System Administrators.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard")}
            icon={<ArrowLeft size={14} />}
            className="w-full justify-center"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col font-sans bg-slate-50/50">
      {/* =========================================================================
          ADMINISTRATION SUB-HEADER & NAVIGATION TABS
          ========================================================================= */}
      <div className="w-full bg-white border-b border-slate-200/90 px-6 pt-4 shrink-0 shadow-2xs">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3">
          <div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <span>Security &amp; Governance</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-900 font-semibold">Users &amp; Access Control</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Access &amp; Role Management
            </h1>
          </div>
        </div>

        {/* Navigation Tabs (Users | Roles | Permissions) */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-slate-100">
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              pathname === tab.href ||
              (tab.href === "/administration/users" &&
                (pathname === "/administration" ||
                  pathname.startsWith("/administration/users/")));

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-slate-900 text-slate-900 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-slate-900" : "text-slate-400"
                  }`}
                />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full">{children}</div>
    </div>
  );
}
