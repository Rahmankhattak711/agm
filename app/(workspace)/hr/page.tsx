"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  HardHat,
  FileText,
  DollarSign,
  Clock,
  Calendar,
  CreditCard,
  Building2,
  FolderTree,
  ArrowRight,
  Gift,
} from "lucide-react";
import {
  useDepartments,
  useWorkers,
  useVaultDocuments,
  usePayrollBatch,
} from "@/lib/hooks/hr-hooks";

export default function HrOverviewPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: departments = [] } = useDepartments();
  const { data: workersData } = useWorkers();
  const { data: docsData } = useVaultDocuments();
  const { data: payrollBatch } = usePayrollBatch(currentMonth, currentYear);

  const totalEmployees = departments.reduce((acc, d: any) => acc + (d.employeeCount || 0), 0);
  const totalWorkers = workersData?.totalWorkers || 0;
  const urgentDocsCount = (docsData?.summary?.criticalCount || 0) + (docsData?.summary?.expiredCount || 0);

  const modules = [
    {
      title: "Employees Directory",
      subtitle: "Master staff profiles, Emirates ID, WPS bank accounts & contracts",
      href: "/hr/employees",
      icon: <Users className="w-5 h-5 text-blue-600" />,
      badge: `${totalEmployees || totalWorkers} Total`,
      badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    },
    {
      title: "Timesheet & Attendance",
      subtitle: "Daily/weekly/monthly sheets, overtime 1.25x & corporate print",
      href: "/hr/attendance",
      icon: <Clock className="w-5 h-5 text-amber-600" />,
      badge: "Accounting Synced",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    },
    {
      title: "Leave Management",
      subtitle: "Leave requests with automated unpaid payroll deduction rules",
      href: "/hr/leaves",
      icon: <Calendar className="w-5 h-5 text-purple-600" />,
      badge: "MOHRE Aligned",
      badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    },
    {
      title: "Bonuses & Incentives",
      subtitle: "Discretionary bonuses, performance rewards & project incentives",
      href: "/hr/bonuses",
      icon: <Gift className="w-5 h-5 text-rose-600" />,
      badge: "Payroll Additions",
      badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    },
    {
      title: "Monthly Payroll & GL Engine",
      subtitle: "Controlled batch approvals with double-entry General Ledger posting",
      href: "/hr/payroll",
      icon: <CreditCard className="w-5 h-5 text-indigo-600" />,
      badge: payrollBatch?.status ? `Status: ${payrollBatch.status}` : "Batch Active",
      badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
    },
    {
      title: "Salary Slips & History",
      subtitle: "Printable immutable payslips with AGM logo, TRN & breakdown",
      href: "/hr/salary-slips",
      icon: <FileText className="w-5 h-5 text-teal-600" />,
      badge: "PDF Slips",
      badgeColor: "bg-teal-50 text-teal-800 border-teal-200",
    },
    {
      title: "Salary Structures & Grades",
      subtitle: "Effective-dated basic, housing, transport & allowance rules",
      href: "/hr/salary-structures",
      icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
      badge: "Grade Control",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      title: "Document Vault & Compliance",
      subtitle: "UAE Emirates ID, Visa & Passport expiry alerts",
      href: "/hr/documents",
      icon: <FileText className="w-5 h-5 text-indigo-600" />,
      badge: urgentDocsCount > 0 ? `${urgentDocsCount} Expiring Urgent` : "Compliant",
      badgeColor: urgentDocsCount > 0 ? "bg-rose-50 text-rose-800 border-rose-200" : "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      title: "Operational Field Crew",
      subtitle: "Workshop mechanics, technicians, site helpers & operational crew",
      href: "/hr/workers",
      icon: <HardHat className="w-5 h-5 text-emerald-600" />,
      badge: `${totalWorkers} Field Crew`,
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      title: "Organization Structure",
      subtitle: "Dynamic departments & job role classifications",
      href: "/hr/departments",
      icon: <FolderTree className="w-5 h-5 text-blue-600" />,
      badge: `${departments.length} Depts`,
      badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    },
  ];

  return (
    <div className="w-full min-h-full p-4 sm:p-6 space-y-5 bg-[#f8fafc] text-slate-800 font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
              <Building2 className="w-3.5 h-3.5" />
              <span>Human Resources &bull; Workforce Hub</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Human Resources & Payroll Control Center
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Unified workforce management, UAE labor law compliance, automated attendance, and double-entry General Ledger payroll integration.
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
              Current Payroll Cycle
            </span>
            <span className="text-xl font-mono font-bold text-white block">
              {payrollBatch?.monthName || "November"} {currentYear}
            </span>
            <span className="text-xs text-emerald-400 font-medium">
              Net Payable: AED {payrollBatch?.totalNetPayroll?.toLocaleString() || "0"}
            </span>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Workforce
          </span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{totalEmployees || totalWorkers}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Staff & field personnel</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Operational Crew
          </span>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">{totalWorkers}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Workshop & site personnel</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Gross Payroll Base
          </span>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
            AED {payrollBatch?.totalGrossPayroll?.toLocaleString() || "0"}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Approved structures base</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Compliance Alerts
          </span>
          <p className={`text-2xl font-bold font-mono mt-1 ${urgentDocsCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
            {urgentDocsCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Visas & IDs needing renewal</p>
        </div>
      </div>

      {/* Unified HR Modules Grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
          HR Management Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {modules.map((m, idx) => (
            <Link
              key={idx}
              href={m.href}
              className="group bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {m.icon}
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${m.badgeColor}`}>
                    {m.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {m.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {m.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                <span>Access Module</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
