"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  Briefcase,
  Users,
  Plus,
  Search,
  HardHat,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  FolderTree,
  Edit2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useDesignations,
  useCreateDesignation,
  useUpdateDesignation,
  useDeleteDesignation,
} from "@/lib/hooks/hr-hooks";
import { Button, Modal, Input } from "@/components/ui";
import { useConfirm } from "@/context/ConfirmContext";
import { toast } from "@/lib/toast";

export function OrganizationStructureSection() {
  const { data: departments = [], isLoading: isLoadingDepts, refetch: refetchDepts } = useDepartments();
  const { data: designations = [], isLoading: isLoadingDesigs, refetch: refetchDesigs } = useDesignations();
  const { confirm } = useConfirm();

  const createDeptMutation = useCreateDepartment();
  const updateDeptMutation = useUpdateDepartment();
  const deleteDeptMutation = useDeleteDepartment();

  const createDesigMutation = useCreateDesignation();
  const updateDesigMutation = useUpdateDesignation();
  const deleteDesigMutation = useDeleteDesignation();

  const [activeTab, setActiveTab] = useState<"departments" | "designations">("departments");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isEditDeptModalOpen, setIsEditDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any | null>(null);

  const [isDesigModalOpen, setIsDesigModalOpen] = useState(false);
  const [isEditDesigModalOpen, setIsEditDesigModalOpen] = useState(false);
  const [editingDesig, setEditingDesig] = useState<any | null>(null);

  // Form states
  const [deptForm, setDeptForm] = useState({ code: "", name: "", description: "" });
  const [editDeptForm, setEditDeptForm] = useState({ id: "", code: "", name: "", description: "", isActive: true });

  const [desigForm, setDesigForm] = useState({
    code: "",
    name: "",
    departmentId: "",
    isFieldWorker: false,
    description: "",
  });
  const [editDesigForm, setEditDesigForm] = useState({
    id: "",
    code: "",
    name: "",
    departmentId: "",
    isFieldWorker: false,
    description: "",
    isActive: true,
  });

  const generateRoleCode = (title: string, deptId?: string) => {
    if (!title.trim()) return "";
    const cleanTitle = title.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, "");
    const words = cleanTitle.split(/\s+/).filter(Boolean);
    let titleSlug = "";
    if (words.length === 1) {
      titleSlug = words[0].slice(0, 6);
    } else {
      titleSlug = words.map((w) => w.slice(0, 3)).join("_").slice(0, 10);
    }

    let deptPrefix = "";
    if (deptId) {
      const selectedDept = departments.find((d: any) => d.id === deptId);
      if (selectedDept?.code) {
        deptPrefix = `${selectedDept.code.trim().toUpperCase()}_`;
      }
    }
    return `${deptPrefix}${titleSlug}`.slice(0, 15);
  };

  const handleTitleChange = (newTitle: string) => {
    const autoCode = generateRoleCode(newTitle, desigForm.departmentId);
    setDesigForm({
      ...desigForm,
      name: newTitle,
      code: autoCode,
    });
  };

  const handleDepartmentChange = (deptId: string) => {
    const autoCode = generateRoleCode(desigForm.name, deptId);
    setDesigForm({
      ...desigForm,
      departmentId: deptId,
      code: autoCode || desigForm.code,
    });
  };

  // Filtered lists
  const filteredDepartments = useMemo(() => {
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [departments, searchTerm]);

  const filteredDesignations = useMemo(() => {
    return designations.filter(
      (d) =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.departmentName && d.departmentName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [designations, searchTerm]);

  // Key metrics
  const totalEmployees = useMemo(
    () => departments.reduce((acc, d) => acc + (d.employeeCount || 0), 0),
    [departments]
  );
  const fieldWorkerRolesCount = useMemo(
    () => designations.filter((d) => d.isFieldWorker).length,
    [designations]
  );

  // Department Handlers
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.code.trim() || !deptForm.name.trim()) {
      toast.error("Department Code and Name are required");
      return;
    }
    try {
      await createDeptMutation.mutateAsync(deptForm);
      toast.success(`Department ${deptForm.name} created successfully!`);
      setIsDeptModalOpen(false);
      setDeptForm({ code: "", name: "", description: "" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to create department");
    }
  };

  const handleOpenEditDept = (dept: any) => {
    setEditingDept(dept);
    setEditDeptForm({
      id: dept.id,
      code: dept.code,
      name: dept.name,
      description: dept.description || "",
      isActive: dept.isActive ?? true,
    });
    setIsEditDeptModalOpen(true);
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDeptForm.code.trim() || !editDeptForm.name.trim()) {
      toast.error("Department Code and Name are required");
      return;
    }
    try {
      await updateDeptMutation.mutateAsync(editDeptForm);
      toast.success(`Department ${editDeptForm.name} updated successfully!`);
      setIsEditDeptModalOpen(false);
      setEditingDept(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update department");
    }
  };

  const handleDeleteDepartment = async (dept: any) => {
    const confirmed = await confirm({
      title: `Delete Department: ${dept.name}?`,
      message: `Are you sure you want to delete ${dept.name} (${dept.code})? This action cannot be undone.`,
      confirmText: "Delete Department",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await deleteDeptMutation.mutateAsync(dept.id);
      toast.success(`Department ${dept.name} deleted successfully.`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete department");
    }
  };

  // Designation Handlers
  const handleCreateDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desigForm.code.trim() || !desigForm.name.trim()) {
      toast.error("Designation Code and Title are required");
      return;
    }
    try {
      await createDesigMutation.mutateAsync(desigForm);
      toast.success(`Designation ${desigForm.name} added successfully!`);
      setIsDesigModalOpen(false);
      setDesigForm({ code: "", name: "", departmentId: "", isFieldWorker: false, description: "" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to add designation");
    }
  };

  const handleOpenEditDesig = (desig: any) => {
    setEditingDesig(desig);
    setEditDesigForm({
      id: desig.id,
      code: desig.code,
      name: desig.name,
      departmentId: desig.departmentId || "",
      isFieldWorker: Boolean(desig.isFieldWorker),
      description: desig.description || "",
      isActive: desig.isActive ?? true,
    });
    setIsEditDesigModalOpen(true);
  };

  const handleUpdateDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDesigForm.code.trim() || !editDesigForm.name.trim()) {
      toast.error("Designation Code and Title are required");
      return;
    }
    try {
      await updateDesigMutation.mutateAsync(editDesigForm);
      toast.success(`Designation ${editDesigForm.name} updated successfully!`);
      setIsEditDesigModalOpen(false);
      setEditingDesig(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update designation");
    }
  };

  const handleDeleteDesignation = async (desig: any) => {
    const confirmed = await confirm({
      title: `Delete Designation: ${desig.name}?`,
      message: `Are you sure you want to delete ${desig.name} (${desig.code})? This action cannot be undone.`,
      confirmText: "Delete Designation",
      variant: "danger",
    });

    if (!confirmed) return;

    try {
      await deleteDesigMutation.mutateAsync(desig.id);
      toast.success(`Designation ${desig.name} deleted successfully.`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete designation");
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Top Action Bar */}
      <div className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-700 shadow-2xs">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Organization Structure
              </h2>
              <p className="text-xs text-slate-500">
                Dynamic departments, job designations &amp; operational workforce classification
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              refetchDepts();
              refetchDesigs();
            }}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            title="Refresh from Database"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <Button
            onClick={() => setIsDeptModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Department
          </Button>
          <Button
            onClick={() => setIsDesigModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Designation
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Departments
            </span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{departments.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Live database divisions</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Job Designations
            </span>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{designations.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Configured positions</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Field &amp; Site Roles
            </span>
            <HardHat className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-1">
            {fieldWorkerRolesCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Operational roles</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Staff Headcount
            </span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{totalEmployees}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Assigned employees</p>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("departments")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "departments"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Departments ({departments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("designations")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "designations"
                ? "bg-white text-slate-900 shadow-2xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Designations ({designations.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === "departments" ? "Search departments..." : "Search job roles..."}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {activeTab === "departments" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Department Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-center">Designations</th>
                  <th className="px-4 py-3 text-center">Active Staff</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingDepts ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Loading departments from database...
                    </td>
                  </tr>
                ) : filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No departments found
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((dept) => (
                    <tr key={dept.id || dept.code} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{dept.code}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>{dept.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                        {dept.description || "—"}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px]">
                          {dept.designationsCount || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px]">
                          {dept.employeeCount || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          dept.isActive
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-slate-600 bg-slate-100 border-slate-200"
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {dept.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDept(dept)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            title="Edit Department"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDepartment(dept)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 transition-colors cursor-pointer"
                            title="Delete Department"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Job Title / Designation</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-center">Role Scope</th>
                  <th className="px-4 py-3 text-center">Active Staff</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingDesigs ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Loading designations from database...
                    </td>
                  </tr>
                ) : filteredDesignations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No designations found
                    </td>
                  </tr>
                ) : (
                  filteredDesignations.map((d) => (
                    <tr key={d.id || d.code} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{d.code}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{d.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {d.departmentName || "General"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {d.isFieldWorker ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <HardHat className="w-3 h-3 text-emerald-600" />
                            Field / Site
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                            Office / Admin
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px]">
                          {d.employeeCount || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          d.isActive
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-slate-600 bg-slate-100 border-slate-200"
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {d.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDesig(d)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                            title="Edit Designation"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDesignation(d)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-400 transition-colors cursor-pointer"
                            title="Delete Designation"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Department */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="Add Company Department"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Department Code *</label>
            <Input
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g. LOG, QAC, SAF"
              maxLength={10}
              required
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Department Name *</label>
            <Input
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              placeholder="e.g. Logistics &amp; Yard"
              required
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Description</label>
            <textarea
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              rows={3}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Brief overview of department functions..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createDeptMutation.isPending} className="bg-slate-900 text-white font-semibold">
              Create Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Department */}
      <Modal
        isOpen={isEditDeptModalOpen}
        onClose={() => {
          setIsEditDeptModalOpen(false);
          setEditingDept(null);
        }}
        title="Edit Department"
      >
        <form onSubmit={handleUpdateDepartment} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Department Code *</label>
            <Input
              value={editDeptForm.code}
              onChange={(e) => setEditDeptForm({ ...editDeptForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g. FIN, OPS"
              maxLength={10}
              required
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Department Name *</label>
            <Input
              value={editDeptForm.name}
              onChange={(e) => setEditDeptForm({ ...editDeptForm, name: e.target.value })}
              placeholder="Department Name"
              required
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Description</label>
            <textarea
              value={editDeptForm.description}
              onChange={(e) => setEditDeptForm({ ...editDeptForm, description: e.target.value })}
              rows={3}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Brief overview of department functions..."
            />
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <input
              type="checkbox"
              id="editDeptActiveCheckbox"
              checked={editDeptForm.isActive}
              onChange={(e) => setEditDeptForm({ ...editDeptForm, isActive: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="editDeptActiveCheckbox" className="text-xs text-slate-700 font-medium cursor-pointer">
              Active Department (Enabled for employee and user allocation)
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditDeptModalOpen(false);
                setEditingDept(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={updateDeptMutation.isPending} className="bg-slate-900 text-white font-semibold">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Designation */}
      <Modal
        isOpen={isDesigModalOpen}
        onClose={() => setIsDesigModalOpen(false)}
        title="Add Job Designation / Role"
      >
        <form onSubmit={handleCreateDesignation} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Job Title *</label>
            <Input
              value={desigForm.name}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Operations Coordinator, Billing Accountant, Supervisor"
              required
              autoFocus
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 font-medium">Role Code *</label>
              <span className="text-[10px] text-blue-600 font-medium">Auto-generated</span>
            </div>
            <Input
              value={desigForm.code}
              onChange={(e) => setDesigForm({ ...desigForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g. OPS_SUPV, SITE_ENG"
              maxLength={15}
              required
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Parent Department</label>
            <select
              value={desigForm.departmentId}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 bg-white cursor-pointer"
            >
              <option value="">Select Department...</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <input
              type="checkbox"
              id="isFieldWorkerCheckbox"
              checked={desigForm.isFieldWorker}
              onChange={(e) => setDesigForm({ ...desigForm, isFieldWorker: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="isFieldWorkerCheckbox" className="text-xs text-slate-700 font-medium cursor-pointer">
              Operational / Site Role (Workshop, technician, or field personnel)
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsDesigModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createDesigMutation.isPending} className="bg-blue-600 text-white font-semibold">
              Create Role
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Designation */}
      <Modal
        isOpen={isEditDesigModalOpen}
        onClose={() => {
          setIsEditDesigModalOpen(false);
          setEditingDesig(null);
        }}
        title="Edit Job Designation / Role"
      >
        <form onSubmit={handleUpdateDesignation} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Job Title *</label>
            <Input
              value={editDesigForm.name}
              onChange={(e) => setEditDesigForm({ ...editDesigForm, name: e.target.value })}
              placeholder="Job Title"
              required
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Role Code *</label>
            <Input
              value={editDesigForm.code}
              onChange={(e) => setEditDesigForm({ ...editDesigForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g. ACC_MGR"
              maxLength={15}
              required
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Parent Department</label>
            <select
              value={editDesigForm.departmentId}
              onChange={(e) => setEditDesigForm({ ...editDesigForm, departmentId: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 bg-white cursor-pointer"
            >
              <option value="">Select Department...</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <input
              type="checkbox"
              id="editIsFieldWorkerCheckbox"
              checked={editDesigForm.isFieldWorker}
              onChange={(e) => setEditDesigForm({ ...editDesigForm, isFieldWorker: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="editIsFieldWorkerCheckbox" className="text-xs text-slate-700 font-medium cursor-pointer">
              Operational / Site Role (Workshop, technician, or field personnel)
            </label>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <input
              type="checkbox"
              id="editDesigActiveCheckbox"
              checked={editDesigForm.isActive}
              onChange={(e) => setEditDesigForm({ ...editDesigForm, isActive: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="editDesigActiveCheckbox" className="text-xs text-slate-700 font-medium cursor-pointer">
              Active Designation
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditDesigModalOpen(false);
                setEditingDesig(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={updateDesigMutation.isPending} className="bg-blue-600 text-white font-semibold">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
