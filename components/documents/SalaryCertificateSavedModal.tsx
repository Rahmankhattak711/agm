"use client";

import React, { useState } from "react";
import { SalaryCertificateRecord } from "@/lib/hooks/api-hooks";
import { Search, FileText, Trash2, Calendar, User, DollarSign, X } from "lucide-react";
import { Button, Input } from "@/components/ui";

interface SalaryCertificateSavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedCertificates: SalaryCertificateRecord[];
  onLoadCertificate: (cert: SalaryCertificateRecord) => void;
  onDeleteCertificate: (id: string, e: React.MouseEvent) => void;
}

export function SalaryCertificateSavedModal({
  isOpen,
  onClose,
  savedCertificates,
  onLoadCertificate,
  onDeleteCertificate,
}: SalaryCertificateSavedModalProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filtered = savedCertificates.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.refNumber?.toLowerCase().includes(q) ||
      c.employeeName?.toLowerCase().includes(q) ||
      c.position?.toLowerCase().includes(q) ||
      c.emiratesId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-agm-green-soft flex items-center justify-center text-agm-green">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Saved Salary Certificates
              </h3>
              <p className="text-xs text-slate-500">
                Select a previously saved salary certificate to view or edit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by ref number, employee name, position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No salary certificates found matching &quot;{search}&quot;.
            </div>
          ) : (
            filtered.map((cert) => (
              <div
                key={cert.id}
                onClick={() => {
                  onLoadCertificate(cert);
                  onClose();
                }}
                className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 hover:border-agm-green/50 hover:bg-agm-green-soft/20 transition-all cursor-pointer shadow-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {cert.refNumber}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        cert.status === "COMPLETED" || cert.status === "ISSUED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : cert.status === "ACTIVE"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {cert.status || "DRAFT"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-medium text-slate-800">
                      <User size={13} className="text-slate-400" />
                      {cert.employeePrefix} {cert.employeeName}
                    </span>
                    <span className="text-slate-500">
                      {cert.position}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 font-semibold">
                      <DollarSign size={13} className="text-agm-green" />
                      AED {Number(cert.monthlySalaryNum || 0).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <Calendar size={12} />
                      {cert.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button
                    type="button"
                    onClick={(e) => onDeleteCertificate(cert.id, e)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete certificate"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
