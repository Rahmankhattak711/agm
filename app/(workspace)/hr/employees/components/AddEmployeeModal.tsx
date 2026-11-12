"use client";

import { useState } from "react";
import { Modal, Button, Input } from "@/components/ui";
import { useCreateEmployee } from "@/lib/hooks/hr-hooks";
import { useDepartments, useDesignations } from "@/lib/hooks/hr-hooks";
import { SearchableSelectWithAdd } from "./SearchableSelectWithAdd";
import { QuickCreateModals } from "./QuickCreateModals";
import { toast } from "@/lib/toast";

export interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddEmployeeModal({ isOpen, onClose }: AddEmployeeModalProps) {
  const createEmployeeMutation = useCreateEmployee();
  const { data: departments = [] } = useDepartments();
  const { data: designations = [] } = useDesignations();

  // Quick Add Modals State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isDesigModalOpen, setIsDesigModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    employeeCode: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    joiningDate: new Date().toISOString().slice(0, 10),
    basicSalary: 6000,
    housingAllowance: 0,
    transportAllowance: 0,
    otherAllowances: 0,
    emiratesId: "",
    passportNo: "",
    visaNumber: "",
    employmentStatus: "ACTIVE",
    contractType: "FULL_TIME",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("First Name and Last Name are required");
      return;
    }

    const code = formData.employeeCode.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await createEmployeeMutation.mutateAsync({
        ...formData,
        employeeCode: code,
        basicSalary: Number(formData.basicSalary) || 0,
        housingAllowance: Number(formData.housingAllowance) || 0,
        transportAllowance: Number(formData.transportAllowance) || 0,
        otherAllowances: Number(formData.otherAllowances) || 0,
      });

      toast.success(`Employee ${formData.firstName} ${formData.lastName} (${code}) created successfully!`);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create employee");
    }
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Employee" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Employee Code</label>
            <Input
              value={formData.employeeCode}
              onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })}
              placeholder="e.g. EMP-1042 (Auto if blank)"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">First Name *</label>
            <Input
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="First Name"
              required
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Last Name *</label>
            <Input
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Last Name"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@company.ae"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+971 50 123 4567"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <SearchableSelectWithAdd
              label="Department"
              placeholder="Select Department..."
              options={departments.map((d: any) => ({
                id: d.id || d.name,
                name: d.name,
                code: d.code,
              }))}
              value={formData.department}
              onChange={(val) => setFormData({ ...formData, department: val })}
              onAddNew={() => setIsDeptModalOpen(true)}
              addNewLabel="Add New Department"
            />
          </div>
          <div>
            <SearchableSelectWithAdd
              label="Designation"
              placeholder="Select Role..."
              options={designations.map((desig: any) => ({
                id: desig.id || desig.name,
                name: desig.name,
                code: desig.code,
              }))}
              value={formData.designation}
              onChange={(val) => setFormData({ ...formData, designation: val })}
              onAddNew={() => setIsDesigModalOpen(true)}
              addNewLabel="Add New Role"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Joining Date</label>
            <Input
              type="date"
              value={formData.joiningDate}
              onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
            />
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <p className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">Salary Structure (AED)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Basic Salary</label>
              <Input
                type="number"
                value={formData.basicSalary}
                onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Housing</label>
              <Input
                type="number"
                value={formData.housingAllowance}
                onChange={(e) => setFormData({ ...formData, housingAllowance: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Transport</label>
              <Input
                type="number"
                value={formData.transportAllowance}
                onChange={(e) => setFormData({ ...formData, transportAllowance: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Other</label>
              <Input
                type="number"
                value={formData.otherAllowances}
                onChange={(e) => setFormData({ ...formData, otherAllowances: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <p className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">Legal Documents</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 mb-1">Emirates ID</label>
              <Input
                value={formData.emiratesId}
                onChange={(e) => setFormData({ ...formData, emiratesId: e.target.value })}
                placeholder="784-XXXX-XXXXXXX-X"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Passport Number</label>
              <Input
                value={formData.passportNo}
                onChange={(e) => setFormData({ ...formData, passportNo: e.target.value })}
                placeholder="Passport No"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Visa Number</label>
              <Input
                value={formData.visaNumber}
                onChange={(e) => setFormData({ ...formData, visaNumber: e.target.value })}
                placeholder="Visa No"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createEmployeeMutation.isPending}
            className="bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            Create Employee
          </Button>
        </div>
      </form>
    </Modal>

    {/* Quick Add Modals */}
    <QuickCreateModals
      isDeptModalOpen={isDeptModalOpen}
      onCloseDeptModal={() => setIsDeptModalOpen(false)}
      onDepartmentCreated={(deptName) => setFormData({ ...formData, department: deptName })}
      isDesigModalOpen={isDesigModalOpen}
      onCloseDesigModal={() => setIsDesigModalOpen(false)}
      onDesignationCreated={(desigName) => setFormData({ ...formData, designation: desigName })}
    />
    </>
  );
}
