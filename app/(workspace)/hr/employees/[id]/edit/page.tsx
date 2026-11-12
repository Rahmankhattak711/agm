"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Building2, DollarSign, ShieldCheck, Save } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/hooks/api-base";
import { Button, Input } from "@/components/ui";
import { useUpdateEmployee, useDepartments, useDesignations } from "@/lib/hooks/hr-hooks";
import { toast } from "@/lib/toast";

export default function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: employee, isLoading } = useQuery<any>({
    queryKey: ["employee-details", id],
    queryFn: () => fetchJson(`/api/employees/${id}`),
  });

  const updateEmployeeMutation = useUpdateEmployee();
  const { data: departments = [] } = useDepartments();
  const { data: designations = [] } = useDesignations();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "MALE",
    dateOfBirth: "",
    nationality: "",
    address: "",
    department: "",
    designation: "",
    joiningDate: "",
    employmentStatus: "ACTIVE",
    contractType: "FULL_TIME",
    basicSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    otherAllowances: 0,
    annualLeaveBalance: 30,
    bankName: "",
    iban: "",
    emiratesId: "",
    emiratesIdExpiry: "",
    passportNo: "",
    passportExpiry: "",
    visaNumber: "",
    visaExpiry: "",
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        email: employee.email || "",
        phone: employee.phone || "",
        gender: employee.gender || "MALE",
        dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.slice(0, 10) : "",
        nationality: employee.nationality || "United Arab Emirates",
        address: employee.address || "",
        department: employee.department || "Operations",
        designation: employee.designation || "Staff",
        joiningDate: employee.joiningDate ? employee.joiningDate.slice(0, 10) : "",
        employmentStatus: employee.employmentStatus || "ACTIVE",
        contractType: employee.contractType || "FULL_TIME",
        basicSalary: Number(employee.basicSalary || 0),
        housingAllowance: Number(employee.housingAllowance || 0),
        transportAllowance: Number(employee.transportAllowance || 0),
        otherAllowances: Number(employee.otherAllowances || 0),
        annualLeaveBalance: Number(employee.annualLeaveBalance || 30),
        bankName: employee.bankName || "",
        iban: employee.iban || "",
        emiratesId: employee.emiratesId || "",
        emiratesIdExpiry: employee.emiratesIdExpiry ? employee.emiratesIdExpiry.slice(0, 10) : "",
        passportNo: employee.passportNo || "",
        passportExpiry: employee.passportExpiry ? employee.passportExpiry.slice(0, 10) : "",
        visaNumber: employee.visaNumber || "",
        visaExpiry: employee.visaExpiry ? employee.visaExpiry.slice(0, 10) : "",
      });
    }
  }, [employee]);

  const grossSalary =
    Number(formData.basicSalary || 0) +
    Number(formData.housingAllowance || 0) +
    Number(formData.transportAllowance || 0) +
    Number(formData.otherAllowances || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateEmployeeMutation.mutateAsync({
        id,
        ...formData,
      });
      toast.success("Employee profile updated successfully!");
      router.push(`/hr/employees/${id}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update employee");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen p-8 flex items-center justify-center text-xs text-slate-400">
        Loading employee form...
      </div>
    );
  }

  return (
    <div className="w-full min-h-full p-4 sm:p-6 space-y-5 bg-[#f8fafc] text-slate-800 font-sans">
      {/* Header with Back Button */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/hr/employees/${id}`}
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
              <Link href={`/hr/employees/${id}`} className="hover:text-slate-600">
                {employee?.firstName} {employee?.lastName}
              </Link>
              <span>/</span>
              <span>Edit</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Edit Employee Profile: {employee?.employeeCode}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/hr/employees/${id}`)}
            className="text-xs text-slate-600"
          >
            Cancel
          </Button>
          <Button
            type="button"
            loading={updateEmployeeMutation.isPending}
            onClick={handleSubmit}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save Changes
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Personal Details */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-emerald-600" />
            Personal & Contact Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">First Name *</label>
              <Input
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Last Name *</label>
              <Input
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Email Address</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Phone Number</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Nationality</label>
              <Input
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Employment & Roles */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-blue-600" />
            Department & Classification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Select Department...</option>
                {formData.department && !departments.some((d: any) => d.name === formData.department) && (
                  <option value={formData.department}>{formData.department}</option>
                )}
                {departments.map((d: any) => (
                  <option key={d.id || d.name} value={d.name}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Job Designation</label>
              <select
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Select Designation...</option>
                {formData.designation && !designations.some((desig: any) => desig.name === formData.designation) && (
                  <option value={formData.designation}>{formData.designation}</option>
                )}
                {designations.map((desig: any) => (
                  <option key={desig.id || desig.name} value={desig.name}>
                    {desig.name} ({desig.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Joining Date</label>
              <Input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Status</label>
              <select
                value={formData.employmentStatus}
                onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="ACTIVE">Active</option>
                <option value="PROBATION">Probation</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Salary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Salary & Compensation (AED)
            </h3>
            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
              Total Gross: AED {grossSalary.toLocaleString()} / mo
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Basic Salary</label>
              <Input
                type="number"
                value={formData.basicSalary}
                onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
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
        </div>

        {/* Legal Documents */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Legal Identifiers & Expiries
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Emirates ID</label>
              <Input
                value={formData.emiratesId}
                onChange={(e) => setFormData({ ...formData, emiratesId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Passport No</label>
              <Input
                value={formData.passportNo}
                onChange={(e) => setFormData({ ...formData, passportNo: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Visa Number</label>
              <Input
                value={formData.visaNumber}
                onChange={(e) => setFormData({ ...formData, visaNumber: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/hr/employees/${id}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={updateEmployeeMutation.isPending}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 font-semibold"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
