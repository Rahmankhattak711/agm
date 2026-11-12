"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  RefreshCw,
  ShieldAlert,
  Calendar,
  XCircle,
  Building2,
} from "lucide-react";
import { useVaultDocuments, useRegisterDocument } from "@/lib/hooks/hr-hooks";
import { useEmployees } from "@/lib/hooks/api-hooks";
import { Button, Modal, Input } from "@/components/ui";
import { toast } from "@/lib/toast";

export default function DocumentVaultPage() {
  const [docTypeFilter, setDocTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Form state
  const [docForm, setDocForm] = useState({
    employeeId: "",
    documentType: "EMIRATES_ID",
    documentNumber: "",
    issueDate: "",
    expiryDate: "",
    notes: "",
  });

  const { data, isLoading, refetch } = useVaultDocuments({
    documentType: docTypeFilter,
    status: statusFilter,
    search,
  });

  const { data: employees = [] } = useEmployees();
  const registerDocMutation = useRegisterDocument();

  const documents = data?.documents || [];
  const summary = data?.summary || {
    totalDocuments: 0,
    validCount: 0,
    criticalCount: 0,
    expiringSoonCount: 0,
    expiredCount: 0,
  };

  const handleRegisterDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.employeeId || !docForm.documentNumber || !docForm.expiryDate) {
      toast.error("Please fill in Employee, Document Number, and Expiry Date");
      return;
    }
    try {
      await registerDocMutation.mutateAsync(docForm);
      toast.success("Document credential registered successfully!");
      setIsRegisterModalOpen(false);
      setDocForm({
        employeeId: "",
        documentType: "EMIRATES_ID",
        documentNumber: "",
        issueDate: "",
        expiryDate: "",
        notes: "",
      });
      refetch();
    } catch {
      toast.error("Failed to register document");
    }
  };

  return (
    <div className="w-full min-h-full p-4 sm:p-6 space-y-4 bg-[#f8fafc] text-slate-800 font-sans">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Document Vault & Compliance Center
              </h1>
              <p className="text-xs text-slate-500">
                UAE Emirates ID, Residence Visa, Passport & labor contracts expiry monitoring
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <Button
            onClick={() => setIsRegisterModalOpen(true)}
            className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Register Document
          </Button>
        </div>
      </div>

      {/* Critical Alert Banner if documents are expiring */}
      {summary.criticalCount > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Compliance Attention Required:</strong> {summary.criticalCount} documents are expiring within 30 days! Please initiate renewal to avoid labor law penalties.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("CRITICAL")}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold text-[11px] cursor-pointer"
          >
            View Urgent
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Total Monitored
            </span>
            <FileText className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{summary.totalDocuments}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active compliance records</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Valid (&gt; 60 Days)
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-1">{summary.validCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Fully compliant credentials</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Expiring Soon (31-60d)
            </span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold font-mono text-indigo-700 mt-1">{summary.expiringSoonCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Prepare renewal paperwork</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Urgent / Expired (&le; 30d)
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-bold font-mono text-rose-700 mt-1">
            {summary.criticalCount + summary.expiredCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Immediate renewal needed</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto flex-wrap">
          {[
            { id: "ALL", label: "All Docs" },
            { id: "EMIRATES_ID", label: "Emirates ID" },
            { id: "RESIDENCE_VISA", label: "Residence Visa" },
            { id: "PASSPORT", label: "Passport" },
            { id: "CONTRACT", label: "Labor Contracts" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDocTypeFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                docTypeFilter === tab.id
                  ? "bg-white text-slate-900 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee, ID, or passport #..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Employee Name</th>
                <th className="px-4 py-3">Department & Role</th>
                <th className="px-4 py-3">Document Type</th>
                <th className="px-4 py-3">Credential Number</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3 text-center">Remaining Days</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Loading vault documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No documents matching criteria
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  let badgeClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
                  let label = `${doc.daysRemaining} days left`;

                  if (doc.status === "EXPIRED") {
                    badgeClass = "bg-rose-100 text-rose-800 border-rose-300 font-bold";
                    label = `Expired (${Math.abs(doc.daysRemaining || 0)}d ago)`;
                  } else if (doc.status === "CRITICAL") {
                    badgeClass = "bg-rose-50 text-rose-700 border-rose-200 font-bold";
                    label = `Urgent (${doc.daysRemaining}d left)`;
                  } else if (doc.status === "EXPIRING_SOON") {
                    badgeClass = "bg-amber-50 text-amber-800 border-amber-200 font-medium";
                    label = `${doc.daysRemaining} days left`;
                  }

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{doc.employeeName}</div>
                        <div className="font-mono text-[11px] text-slate-500">{doc.employeeCode}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-medium">{doc.designation}</div>
                        <div className="text-[11px] text-slate-500">{doc.department}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {doc.documentType.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                        {doc.documentNumber || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {doc.expiryDate || "Not recorded"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {doc.daysRemaining !== null ? (
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] border ${badgeClass}`}
                          >
                            {label}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No expiry</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {doc.status === "VALID" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Valid
                          </span>
                        ) : doc.status === "EXPIRED" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Renewal Due
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Document Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register Compliance Document"
      >
        <form onSubmit={handleRegisterDocument} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Select Employee / Worker *</label>
            <select
              value={docForm.employeeId}
              onChange={(e) => setDocForm({ ...docForm, employeeId: e.target.value })}
              required
              className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
            >
              <option value="">Select Employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode}) — {emp.designation || "Staff"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Document Category *</label>
            <select
              value={docForm.documentType}
              onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
            >
              <option value="EMIRATES_ID">Emirates ID (Federal Identity Card)</option>
              <option value="RESIDENCE_VISA">Residence Visa (UAE Employment Visa)</option>
              <option value="PASSPORT">Passport (National Document)</option>
              <option value="DRIVING_LICENSE">Driving License (RTA Commercial / Light)</option>
              <option value="CONTRACT">Employment Contract (MOHRE Labor Card)</option>
              <option value="SAFETY_CERTIFICATE">Safety Certificate / Training Card</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Document / Card Number *</label>
            <Input
              value={docForm.documentNumber}
              onChange={(e) => setDocForm({ ...docForm, documentNumber: e.target.value })}
              placeholder="e.g. 784-1990-1234567-1, N12345678"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Issue Date</label>
              <Input
                type="date"
                value={docForm.issueDate}
                onChange={(e) => setDocForm({ ...docForm, issueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Expiry Date *</label>
              <Input
                type="date"
                value={docForm.expiryDate}
                onChange={(e) => setDocForm({ ...docForm, expiryDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Remarks / Authority Notes</label>
            <Input
              value={docForm.notes}
              onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
              placeholder="e.g. Issued in Dubai, category 3 heavy truck license"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={registerDocMutation.isPending} className="bg-indigo-700 text-white">
              Save Credential
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
