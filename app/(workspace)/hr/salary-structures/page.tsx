"use client";

import React, { useState, useMemo } from "react";
import {
  DollarSign,
  Briefcase,
  Search,
  Plus,
  RefreshCw,
  Edit,
  TrendingUp,
  Building2,
  Calendar,
} from "lucide-react";
import {
  useSalaryStructures,
  useSaveSalaryStructure,
  useDepartments,
} from "@/lib/hooks/hr-hooks";
import { Button, Modal, Input } from "@/components/ui";
import { toast } from "@/lib/toast";

export default function SalaryStructuresPage() {
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    employeeId: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
    basicSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    otherAllowances: 0,
    notes: "",
  });

  const { data: structures = [], isLoading, refetch } = useSalaryStructures({
    department: selectedDept,
    search,
  });

  const { data: departments = [] } = useDepartments();
  const saveStructureMutation = useSaveSalaryStructure();

  // Metrics
  const totalBaseGross = useMemo(
    () => structures.reduce((acc, s) => acc + (s.grossSalary || 0), 0),
    [structures]
  );
  const totalBasic = useMemo(
    () => structures.reduce((acc, s) => acc + (s.basicSalary || 0), 0),
    [structures]
  );
  const totalAllowances = totalBaseGross - totalBasic;

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      employeeId: item.employeeId,
      effectiveDate: item.effectiveDate || new Date().toISOString().slice(0, 10),
      basicSalary: item.basicSalary || 0,
      housingAllowance: item.housingAllowance || 0,
      transportAllowance: item.transportAllowance || 0,
      otherAllowances: item.otherAllowances || 0,
      notes: item.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeId || form.basicSalary <= 0) {
      toast.error("Valid basic salary is required");
      return;
    }
    try {
      await saveStructureMutation.mutateAsync(form);
      toast.success(`Salary structure updated for ${editingItem?.employeeName}`);
      setIsModalOpen(false);
      refetch();
    } catch {
      toast.error("Failed to save salary structure");
    }
  };

  const computedGross = Number(form.basicSalary || 0) +
    Number(form.housingAllowance || 0) +
    Number(form.transportAllowance || 0) +
    Number(form.otherAllowances || 0);

  return (
    <div className="w-full min-h-full p-4 sm:p-6 space-y-4 bg-[#f8fafc] text-slate-800 font-sans">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Salary Structures & Compensation Grades
              </h1>
              <p className="text-xs text-slate-500">
                Effective-dated basic salary, housing, transport allowances & historical wage preservation
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
              Total Monitored
            </span>
            <Briefcase className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{structures.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active salary profiles</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Total Basic Payroll
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-1">
            AED {totalBasic.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">UAE WPS baseline</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Total Allowances
            </span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold font-mono text-blue-700 mt-1">
            AED {totalAllowances.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Housing + Transport + Other</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Gross Monthly Base
            </span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold font-mono text-indigo-700 mt-1">
            AED {totalBaseGross.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Monthly standard commitment</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee, designation, code..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Structures Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department & Role</th>
                <th className="px-4 py-3 text-right">Basic Salary</th>
                <th className="px-4 py-3 text-right">Housing</th>
                <th className="px-4 py-3 text-right">Transport</th>
                <th className="px-4 py-3 text-right">Other</th>
                <th className="px-4 py-3 text-right">Gross Total</th>
                <th className="px-4 py-3 text-center">Effective Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Loading salary structures...
                  </td>
                </tr>
              ) : structures.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No salary records found
                  </td>
                </tr>
              ) : (
                structures.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{s.employeeName}</div>
                      <div className="font-mono text-[10.5px] text-slate-500">{s.employeeCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{s.designation}</div>
                      <div className="text-[10.5px] text-slate-500">{s.department}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                      AED {s.basicSalary.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {s.housingAllowance > 0 ? `AED ${s.housingAllowance.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {s.transportAllowance > 0 ? `AED ${s.transportAllowance.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {s.otherAllowances > 0 ? `AED ${s.otherAllowances.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-800">
                      AED {s.grossSalary.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-600">
                      {s.effectiveDate}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEdit(s)}
                        className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        Revise
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Salary Structure Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Revise Salary Structure: ${editingItem?.employeeName || ""}`}
      >
        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Effective Date *</label>
            <Input
              type="date"
              value={form.effectiveDate}
              onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
              required
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Previous payroll batches will remain locked to past rates.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Basic Salary (AED) *</label>
              <Input
                type="number"
                value={form.basicSalary}
                onChange={(e) => setForm({ ...form, basicSalary: parseFloat(e.target.value) || 0 })}
                required
                className="font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Housing Allowance (AED)</label>
              <Input
                type="number"
                value={form.housingAllowance}
                onChange={(e) => setForm({ ...form, housingAllowance: parseFloat(e.target.value) || 0 })}
                className="font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Transport Allowance (AED)</label>
              <Input
                type="number"
                value={form.transportAllowance}
                onChange={(e) => setForm({ ...form, transportAllowance: parseFloat(e.target.value) || 0 })}
                className="font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Other Allowances (AED)</label>
              <Input
                type="number"
                value={form.otherAllowances}
                onChange={(e) => setForm({ ...form, otherAllowances: parseFloat(e.target.value) || 0 })}
                className="font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">Total Calculated Gross:</span>
            <span className="text-base font-mono font-bold text-emerald-800">
              AED {computedGross.toLocaleString()}
            </span>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Revision Remarks / Reason</label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Annual appraisal adjustment, probation completion"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveStructureMutation.isPending} className="bg-emerald-700 text-white">
              Save Revision
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
