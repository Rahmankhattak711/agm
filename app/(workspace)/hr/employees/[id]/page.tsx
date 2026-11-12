"use client";

import React, { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  FileText,
  DollarSign,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Briefcase,
  AlertTriangle,
  UploadCloud,
  FileDown,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/hooks/api-base";
import { Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

export default function EmployeeDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: employee, isLoading, error } = useQuery<any>({
    queryKey: ["employee-details", id],
    queryFn: () => fetchJson(`/api/employees/${id}`),
  });

  const { data: docsData } = useQuery<{ documents: any[]; summary: any }>({
    queryKey: ["employee-documents", id],
    queryFn: () => fetchJson(`/api/hr/documents?employeeId=${id}`),
  });

  const documents = useMemo(() => docsData?.documents || [], [docsData?.documents]);

  // Critical documents for the top alert banner
  const criticalDocuments = useMemo(() => {
    return documents.filter((d: any) => d.status === "CRITICAL" || d.status === "EXPIRED");
  }, [documents]);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen p-8 flex items-center justify-center text-xs text-slate-400">
        <div className="animate-spin w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full mr-3" />
        Loading employee dossier...
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="w-full min-h-screen p-8 text-center space-y-4">
        <p className="text-rose-600 text-sm font-semibold">Employee not found or error loading profile.</p>
        <Link href="/hr/employees" className="text-xs text-emerald-700 underline font-medium">
          Return to Employees Directory
        </Link>
      </div>
    );
  }

  // Calculate Tenure
  const joinDate = employee.joiningDate ? new Date(employee.joiningDate) : new Date();
  const now = new Date();
  const diffMonths = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
  const tenureYrs = (Math.max(0, diffMonths) / 12).toFixed(1);

  const totalSalary =
    Number(employee.basicSalary || 0) +
    Number(employee.housingAllowance || 0) +
    Number(employee.transportAllowance || 0) +
    Number(employee.otherAllowances || 0);

  const initials = `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`.toUpperCase();

  // Attendance metrics
  const attendances = employee.attendances || employee.dailyAttendance || [];
  const presentDays = attendances.filter((a: any) => a.status === "PRESENT" || a.status === "LATE").length;
  const attPercent = attendances.length > 0 ? Math.round((presentDays / attendances.length) * 100) : 100;

  return (
    <div className="w-full min-h-full p-4 sm:p-6 space-y-5 bg-[#f8fafc] text-slate-800 font-sans">
      {/* =========================================================================
          TOP BREADCRUMB & HEADER ACTIONS
          ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/hr/employees"
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            title="Back to Employees Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Link href="/hr/employees" className="hover:text-slate-600">
                Employees
              </Link>
              <span>/</span>
              <span>Dossier</span>
              <span>/</span>
              <span className="font-semibold text-slate-700">{employee.employeeCode}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {employee.firstName} {employee.lastName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/hr/employees/${id}/documents`}>
            <Button variant="outline" className="text-xs text-slate-700 border-slate-200 hover:bg-slate-50">
              <FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Documents Vault
            </Button>
          </Link>

          <Link href={`/hr/salary-structures?employeeId=${id}`}>
            <Button variant="outline" className="text-xs text-slate-700 border-slate-200 hover:bg-slate-50">
              <DollarSign className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Salary &amp; Slips
            </Button>
          </Link>

          <Link href={`/hr/employees/${id}/edit`}>
            <Button className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold">
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          PROMINENT EXPIRY ALERT BANNER (If any document requires urgent action)
          ========================================================================= */}
      {criticalDocuments.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent border-l-4 border-rose-500 bg-white p-4 rounded-xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wide">
                  Urgent Compliance Expiry Alert
                </h4>
                <p className="text-xs text-rose-800 font-medium mt-0.5">
                  {criticalDocuments.length === 1
                    ? `${criticalDocuments[0].documentType.replace(/_/g, " ")} (${criticalDocuments[0].documentNumber || "N/A"}) is due for renewal.`
                    : `${criticalDocuments.length} compliance documents are expired or expiring within 30 days.`}
                </p>
              </div>
            </div>

            <Link href={`/hr/employees/${id}/documents`}>
              <Button
                size="sm"
                className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shadow-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Manage &amp; Renew Documents
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {criticalDocuments.map((cd: any) => (
              <span
                key={cd.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-white border border-rose-200 text-rose-900 shadow-3xs"
              >
                <Clock className="w-3 h-3 text-rose-600" />
                <span>{cd.documentType.replace(/_/g, " ")}:</span>
                <span className="font-bold text-rose-700">
                  {cd.daysRemaining !== null
                    ? cd.daysRemaining <= 0
                      ? `Expired (${Math.abs(cd.daysRemaining)}d ago)`
                      : `${cd.daysRemaining} days left`
                    : "Action Required"}
                </span>
                <span className="text-[10px] text-slate-400">({cd.expiryDate})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN PROFILE SUMMARY CARD (Header Card - Image 3)
          ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 font-bold text-lg flex items-center justify-center border-2 border-white shadow-xs">
              {initials || "EM"}
            </div>
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {employee.firstName} {employee.lastName}
              </h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {employee.employmentStatus || "ACTIVE"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {employee.designation || "Staff"} &bull; <span className="font-semibold text-slate-700">{employee.department || "Operations"}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              # {employee.employeeCode} &bull; {employee.address || "Dubai, United Arab Emirates"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/hr/employees/${id}/documents`}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{documents.length} Compliance Docs</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </span>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          KEY METRICS ROW (Image 3 KPIs)
          ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">TENURE</span>
          <p className="text-lg font-bold text-slate-900 mt-1 font-mono">{tenureYrs} yrs</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">STATUS</span>
          <p className="text-lg font-bold text-emerald-600 mt-1">{employee.employmentStatus || "ACTIVE"}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">LEAVE BALANCE</span>
          <p className="text-lg font-bold text-indigo-600 mt-1 font-mono">{employee.annualLeaveBalance ?? 30} days</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">ATTENDANCE</span>
          <p className="text-lg font-bold text-amber-600 mt-1 font-mono">{attPercent}%</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs text-center col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">BASE SALARY</span>
          <p className="text-lg font-bold text-emerald-700 mt-1 font-mono">
            AED {Number(employee.basicSalary || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* =========================================================================
          DETAILS GRID: EMPLOYMENT, CONTACT & COMPLIANCE DOCUMENTS
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Employment Info & Monthly Compensation Breakdown */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-4 h-4 text-emerald-700" />
              Employment Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Department</span>
                <span className="font-semibold text-slate-900 text-sm mt-0.5 block">{employee.department || "Operations"}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Job Title / Designation</span>
                <span className="font-semibold text-slate-900 text-sm mt-0.5 block">{employee.designation || "Staff"}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Join Date</span>
                <span className="font-semibold text-slate-900 mt-0.5 block font-mono">
                  {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "—"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Employment Type</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{employee.contractType || "FULL_TIME"}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Work Location / Duty Station</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{employee.address || "Dubai, United Arab Emirates"}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Employee System ID</span>
                <span className="font-semibold text-emerald-700 mt-0.5 block font-mono">{employee.employeeCode}</span>
              </div>
            </div>

            {/* Compensation Breakdown */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                Monthly Compensation Breakdown
              </h4>

              <div className="flex justify-between text-slate-600">
                <span>Basic Salary:</span>
                <span className="font-mono font-semibold text-slate-900">
                  AED {Number(employee.basicSalary || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Housing Allowance:</span>
                <span className="font-mono text-slate-900">
                  AED {Number(employee.housingAllowance || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Transport Allowance:</span>
                <span className="font-mono text-slate-900">
                  AED {Number(employee.transportAllowance || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Other Allowances:</span>
                <span className="font-mono text-slate-900">
                  AED {Number(employee.otherAllowances || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold pt-2 border-t border-slate-200">
                <span>Total Monthly Gross:</span>
                <span className="font-mono text-sm">{formatCurrency(totalSalary)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contact Information & Compliance Documents Vault Card */}
        <div className="space-y-5">
          {/* Contact Info Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Mail className="w-4 h-4 text-emerald-700" />
              Contact Information
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
                </span>
                <span className="font-mono font-semibold text-slate-800">{employee.email || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone:
                </span>
                <span className="font-mono font-semibold text-slate-800">{employee.phone || "—"}</span>
              </div>
            </div>
          </div>

          {/* Compliance Documents Vault Card (Image 3 upgraded with live countdown & renewal action) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Compliance Documents
              </h3>
              <Link
                href={`/hr/employees/${id}/documents`}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Manage &amp; Upload
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* If no documents recorded */}
              {documents.length === 0 ? (
                <div className="p-3 text-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400">
                  <p>No legal documents registered.</p>
                  <Link href={`/hr/employees/${id}/documents`}>
                    <Button size="sm" variant="outline" className="text-xs mt-2">
                      Upload Passport / ID
                    </Button>
                  </Link>
                </div>
              ) : (
                documents.map((doc: any) => {
                  const isExpired = doc.status === "EXPIRED";
                  const isCritical = doc.status === "CRITICAL";

                  return (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-bold text-[11px]">
                          {doc.documentType.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.2 rounded-full border ${
                            isExpired
                              ? "bg-rose-50 text-rose-800 border-rose-200"
                              : isCritical
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          {doc.daysRemaining !== null
                            ? isExpired
                              ? "EXPIRED"
                              : `${doc.daysRemaining}d left`
                            : "VALID"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {doc.documentNumber || "Not Registered"}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {doc.expiryDate ? `Exp: ${doc.expiryDate}` : "No Expiry"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Dossier PDF Export Button */}
            {documents.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <Link href={`/hr/employees/${id}/documents`}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-center text-xs text-slate-700 hover:bg-slate-50 border-slate-200"
                  >
                    <FileDown className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                    Open Vault &amp; Export Dossier PDF
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
