"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Building2,
  DollarSign,
  ShieldCheck,
  Save,
  CheckCircle2,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useCreateEmployee, useDepartments, useDesignations } from "@/lib/hooks/hr-hooks";
import { SearchableSelectWithAdd } from "../components/SearchableSelectWithAdd";
import { QuickCreateModals } from "../components/QuickCreateModals";
import { toast } from "@/lib/toast";

export default function AddEmployeePage() {
  const router = useRouter();
  const createEmployeeMutation = useCreateEmployee();
  const { data: departments = [] } = useDepartments();
  const { data: designations = [] } = useDesignations();

  // Quick Add Modals State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isDesigModalOpen, setIsDesigModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    employeeCode: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "MALE",
    dateOfBirth: "",
    nationality: "United Arab Emirates",
    address: "Dubai, United Arab Emirates",
    department: "",
    designation: "",
    joiningDate: new Date().toISOString().slice(0, 10),
    employmentStatus: "ACTIVE",
    contractType: "FULL_TIME",
    basicSalary: 6000,
    housingAllowance: 0,
    transportAllowance: 0,
    otherAllowances: 0,
    bankName: "Emirates NBD",
    iban: "",
    emiratesId: "",
    emiratesIdExpiry: "",
    passportNo: "",
    passportExpiry: "",
    visaNumber: "",
    visaExpiry: "",
  });

  const grossSalary =
    Number(formData.basicSalary || 0) +
    Number(formData.housingAllowance || 0) +
    Number(formData.transportAllowance || 0) +
    Number(formData.otherAllowances || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("First Name and Last Name are required");
      return;
    }

    try {
      const res = await createEmployeeMutation.mutateAsync({
        ...formData,
        basicSalary: Number(formData.basicSalary) || 0,
        housingAllowance: Number(formData.housingAllowance) || 0,
        transportAllowance: Number(formData.transportAllowance) || 0,
        otherAllowances: Number(formData.otherAllowances) || 0,
      });

      toast.success(`Employee ${formData.firstName} ${formData.lastName} created successfully!`);
      router.push(`/hr/employees/${(res as any).id || ""}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create employee");
    }
  };

  return (
    <div className="w-full min-h-full p-4 sm:p-6 space-y-5 bg-[#f8fafc] text-slate-800 font-sans">
      {/* Header with Back Button */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/hr/employees"
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Link href="/hr/employees" className="hover:text-slate-600">
                Employees
              </Link>
              <span>/</span>
              <span>New Registration</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Add New Employee
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/hr/employees")}
            className="text-xs text-slate-600"
          >
            Cancel
          </Button>
          <Button
            type="button"
            loading={createEmployeeMutation.isPending}
            onClick={handleSubmit}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save Employee
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Personal & Contact Information */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-emerald-600" />
            Personal & Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Employee ID / Code *</label>
              <Input
                value={formData.employeeCode}
                onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">First Name *</label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="e.g. Ahmed"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Last Name *</label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="e.g. Al-Mansoor"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Email Address</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ahmed@company.ae"
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
            <div>
              <label className="block text-slate-700 font-medium mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Nationality</label>
              <Input
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                placeholder="e.g. UAE / India / Pakistan"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-medium mb-1">Residential Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street, Community, City, UAE"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Department & Employment Role */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            Department & Employment Classification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
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
                required
              />
            </div>

            <div>
              <SearchableSelectWithAdd
                label="Job Designation"
                placeholder="Select Designation..."
                options={designations.map((desig: any) => ({
                  id: desig.id || desig.name,
                  name: desig.name,
                  code: desig.code,
                }))}
                value={formData.designation}
                onChange={(val) => setFormData({ ...formData, designation: val })}
                onAddNew={() => setIsDesigModalOpen(true)}
                addNewLabel="Add New Designation / Role"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Joining Date *</label>
              <Input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Employment Status</label>
              <select
                value={formData.employmentStatus}
                onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="ACTIVE">Active</option>
                <option value="PROBATION">Probation</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Salary Structure & Payroll */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Salary Structure & WPS Payroll (AED)
            </h3>
            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
              Total Gross: AED {grossSalary.toLocaleString()} / mo
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Basic Salary *</label>
              <Input
                type="number"
                value={formData.basicSalary}
                onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Housing Allowance</label>
              <Input
                type="number"
                value={formData.housingAllowance}
                onChange={(e) => setFormData({ ...formData, housingAllowance: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Transport Allowance</label>
              <Input
                type="number"
                value={formData.transportAllowance}
                onChange={(e) => setFormData({ ...formData, transportAllowance: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Other Allowances</label>
              <Input
                type="number"
                value={formData.otherAllowances}
                onChange={(e) => setFormData({ ...formData, otherAllowances: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Bank Name</label>
              <Input
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="e.g. Emirates NBD, ADCB"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">IBAN / WPS Card Number</label>
              <Input
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                placeholder="AE000000000000000000000"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Legal Documents */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            UAE Legal Documents & Expiry
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-bold text-slate-800 block text-xs">Emirates ID</span>
              <div>
                <label className="block text-slate-600 mb-1">ID Number</label>
                <Input
                  value={formData.emiratesId}
                  onChange={(e) => setFormData({ ...formData, emiratesId: e.target.value })}
                  placeholder="784-XXXX-XXXXXXX-X"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Expiry Date</label>
                <Input
                  type="date"
                  value={formData.emiratesIdExpiry}
                  onChange={(e) => setFormData({ ...formData, emiratesIdExpiry: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-bold text-slate-800 block text-xs">Passport</span>
              <div>
                <label className="block text-slate-600 mb-1">Passport Number</label>
                <Input
                  value={formData.passportNo}
                  onChange={(e) => setFormData({ ...formData, passportNo: e.target.value })}
                  placeholder="Passport Number"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Expiry Date</label>
                <Input
                  type="date"
                  value={formData.passportExpiry}
                  onChange={(e) => setFormData({ ...formData, passportExpiry: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="font-bold text-slate-800 block text-xs">Residence Visa</span>
              <div>
                <label className="block text-slate-600 mb-1">Visa Number</label>
                <Input
                  value={formData.visaNumber}
                  onChange={(e) => setFormData({ ...formData, visaNumber: e.target.value })}
                  placeholder="Visa File Number"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Expiry Date</label>
                <Input
                  type="date"
                  value={formData.visaExpiry}
                  onChange={(e) => setFormData({ ...formData, visaExpiry: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/hr/employees")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={createEmployeeMutation.isPending}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Complete Registration
          </Button>
        </div>
      </form>

      {/* Quick Add Modals */}
      <QuickCreateModals
        isDeptModalOpen={isDeptModalOpen}
        onCloseDeptModal={() => setIsDeptModalOpen(false)}
        onDepartmentCreated={(deptName) => setFormData({ ...formData, department: deptName })}
        isDesigModalOpen={isDesigModalOpen}
        onCloseDesigModal={() => setIsDesigModalOpen(false)}
        onDesignationCreated={(desigName) => setFormData({ ...formData, designation: desigName })}
      />
    </div>
  );
}
