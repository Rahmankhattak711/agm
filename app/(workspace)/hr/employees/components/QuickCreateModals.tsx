"use client";

import React, { useState } from "react";
import { Modal, Input, Button } from "@/components/ui";
import { toast } from "@/lib/toast";
import { useCreateDepartment, useCreateDesignation, useDepartments } from "@/lib/hooks/hr-hooks";

interface QuickCreateModalsProps {
  isDeptModalOpen: boolean;
  onCloseDeptModal: () => void;
  onDepartmentCreated: (deptName: string) => void;

  isDesigModalOpen: boolean;
  onCloseDesigModal: () => void;
  onDesignationCreated: (desigName: string) => void;
}

export function QuickCreateModals({
  isDeptModalOpen,
  onCloseDeptModal,
  onDepartmentCreated,
  isDesigModalOpen,
  onCloseDesigModal,
  onDesignationCreated,
}: QuickCreateModalsProps) {
  const { data: departments = [] } = useDepartments();
  const createDeptMutation = useCreateDepartment();
  const createDesigMutation = useCreateDesignation();

  // Dept Form
  const [deptForm, setDeptForm] = useState({
    code: "",
    name: "",
    description: "",
  });

  // Desig Form
  const [desigForm, setDesigForm] = useState({
    code: "",
    name: "",
    departmentId: "",
    isFieldWorker: false,
  });

  const generateRoleCode = (title: string, deptId?: string) => {
    if (!title.trim()) return "";
    const cleanTitle = title.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, "");
    const words = cleanTitle.split(/\s+/).filter(Boolean);
    let titleSlug = "";
    if (words.length === 1) {
      titleSlug = words[0].slice(0, 6);
    } else {
      titleSlug = words.map(w => w.slice(0, 3)).join("_").slice(0, 10);
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

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.code.trim() || !deptForm.name.trim()) {
      toast.error("Department Code and Name are required");
      return;
    }

    try {
      await createDeptMutation.mutateAsync({
        code: deptForm.code.trim().toUpperCase(),
        name: deptForm.name.trim(),
        description: deptForm.description.trim() || undefined,
      });

      toast.success(`Department "${deptForm.name}" created!`);
      const createdName = deptForm.name.trim();
      setDeptForm({ code: "", name: "", description: "" });
      onCloseDeptModal();
      onDepartmentCreated(createdName);
    } catch {
      toast.error("Failed to create department");
    }
  };

  const handleCreateDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desigForm.code.trim() || !desigForm.name.trim()) {
      toast.error("Role Code and Title are required");
      return;
    }

    try {
      await createDesigMutation.mutateAsync({
        code: desigForm.code.trim().toUpperCase(),
        name: desigForm.name.trim(),
        departmentId: desigForm.departmentId || undefined,
        isFieldWorker: desigForm.isFieldWorker,
      });

      toast.success(`Designation "${desigForm.name}" created!`);
      const createdName = desigForm.name.trim();
      setDesigForm({ code: "", name: "", departmentId: "", isFieldWorker: false });
      onCloseDesigModal();
      onDesignationCreated(createdName);
    } catch {
      toast.error("Failed to create designation");
    }
  };

  return (
    <>
      {/* Modal: Add Department */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={onCloseDeptModal}
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
              placeholder="e.g. Logistics & Yard"
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
            <Button type="button" variant="outline" onClick={onCloseDeptModal}>
              Cancel
            </Button>
            <Button type="submit" loading={createDeptMutation.isPending} className="bg-slate-900 text-white">
              Create Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Designation */}
      <Modal
        isOpen={isDesigModalOpen}
        onClose={onCloseDesigModal}
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
              className="w-full p-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="">Select Department...</option>
              {departments.map((dept: any) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
            <input
              type="checkbox"
              id="isFieldWorkerQuickCheckbox"
              checked={desigForm.isFieldWorker}
              onChange={(e) => setDesigForm({ ...desigForm, isFieldWorker: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isFieldWorkerQuickCheckbox" className="text-xs text-slate-700 font-medium cursor-pointer">
              Operational / Site Role (Workshop, technician, or field personnel)
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onCloseDesigModal}>
              Cancel
            </Button>
            <Button type="submit" loading={createDesigMutation.isPending} className="bg-blue-600 text-white">
              Create Role
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
