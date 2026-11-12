"use client";

import React, { useState, useMemo } from "react";
import {
  Wrench,
  Users,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Phone,
  HardHat,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { useWorkers } from "@/lib/hooks/hr-hooks";
import { toast } from "@/lib/toast";

export default function WorkersManagementPage() {
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useWorkers({
    category: categoryFilter,
    search,
  });

  const workers = data?.workers || [];

  // Metrics
  const mechanicsCount = useMemo(
    () => workers.filter((w) => w.jobCategory === "MECHANIC" || w.jobCategory === "TECHNICIAN").length,
    [workers]
  );
  const siteWorkersCount = useMemo(
    () => workers.filter((w) => w.jobCategory === "SITE_LABOUR").length,
    [workers]
  );
  const compliantCount = useMemo(
    () =>
      workers.filter(
        (w) =>
          !w.documents?.emiratesId?.isExpired &&
          !w.documents?.passport?.isExpired &&
          !w.documents?.visa?.isExpired
      ).length,
    [workers]
  );

  return (
    <div className="w-full min-h-full p-4 sm:p-6 space-y-4 bg-[#f8fafc] text-slate-800 font-sans">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Operational Workers
              </h1>
              <p className="text-xs text-slate-500">
                Workshop mechanics, technicians, site labourers & field operational personnel
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
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Total Field Crew
            </span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{workers.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active operational workers</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Workshop & Tech
            </span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{mechanicsCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Mechanics & technicians</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Site Labour
            </span>
            <HardHat className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-1">{siteWorkersCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Site helpers & labourers</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Compliant Documents
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold font-mono text-blue-700 mt-1">{compliantCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Emirates ID & Visa active</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto flex-wrap">
          {[
            { id: "ALL", label: "All Crew" },
            { id: "MECHANIC", label: "Mechanics" },
            { id: "TECHNICIAN", label: "Technicians" },
            { id: "SITE_LABOUR", label: "Site Workers" },
            { id: "OPERATIONS", label: "Operations" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                categoryFilter === tab.id
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
            placeholder="Search worker name, code, designation..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Worker ID & Name</th>
                <th className="px-4 py-3">Role & Category</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-right">Basic Salary</th>
                <th className="px-4 py-3 text-center">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Loading workers...
                  </td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No operational workers found
                  </td>
                </tr>
              ) : (
                workers.map((worker) => {
                  const isEidExpiring =
                    worker.documents?.emiratesId?.daysLeft !== null &&
                    worker.documents.emiratesId.daysLeft <= 30;

                  return (
                    <tr key={worker.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{worker.fullName}</div>
                        <div className="font-mono text-[11px] text-slate-500">{worker.workerCode}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{worker.designation}</div>
                        <div className="text-[11px] text-slate-500">{worker.department}</div>
                      </td>
                      <td className="px-4 py-3">
                        {worker.phone ? (
                          <div className="flex items-center gap-1 text-slate-700 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{worker.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                        AED {Number(worker.basicSalary || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEidExpiring ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            EID Expiring ({worker.documents.emiratesId.daysLeft}d)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Valid
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
    </div>
  );
}
