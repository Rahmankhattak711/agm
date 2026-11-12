"use client";

import React from "react";
import {
  X,
  FileText,
  DollarSign,
  Edit,
  Mail,
  Phone,
  Calendar,
  Building2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Modal, Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

export interface EmployeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any | null;
  onEdit: (emp: any) => void;
}

export function EmployeeDetailsModal({
  isOpen,
  onClose,
  employee,
  onEdit,
}: EmployeeDetailsModalProps) {
  if (!employee) return null;

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl" title="Employee Details">
      <div className="space-y-4 text-xs font-sans">
        {/* Profile Header Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 font-bold text-lg flex items-center justify-center border-2 border-white shadow-xs">
                {initials || "EM"}
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {employee.firstName} {employee.lastName}
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {employee.employmentStatus || "ACTIVE"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {employee.designation || "Staff"} &bull; {employee.department || "Operations"}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
                <span># {employee.employeeCode}</span>
                <span>&bull;</span>
                <span>AGM ERP Corporate Staff</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                onEdit(employee);
              }}
              className="text-xs border-slate-300 hover:bg-slate-100 text-slate-700"
            >
              <Edit className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Edit
            </Button>
          </div>
        </div>

        {/* 5 Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Tenure
            </span>
            <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
              {tenureYrs} yrs
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Status
            </span>
            <span className="text-base font-bold font-mono text-emerald-700 mt-0.5 block">
              Active
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Leave Balance
            </span>
            <span className="text-base font-bold font-mono text-indigo-700 mt-0.5 block">
              {employee.annualLeaveBalance || 30} days
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Attendance
            </span>
            <span className="text-base font-bold font-mono text-amber-700 mt-0.5 block">
              100%
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Base Salary
            </span>
            <span className="text-base font-bold font-mono text-emerald-700 mt-0.5 block">
              AED {Number(employee.basicSalary || 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* 2 Column Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Employment Info */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Employment Info
            </h4>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Department</span>
                <span className="font-semibold text-slate-800">{employee.department || "General"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Designation</span>
                <span className="font-semibold text-slate-800">{employee.designation || "Staff"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Join Date</span>
                <span className="font-semibold font-mono text-slate-800">
                  {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Employment Type</span>
                <span className="font-semibold text-slate-800">{employee.contractType || "Full-time"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Location</span>
                <span className="font-semibold text-slate-800">Dubai, United Arab Emirates</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Employee ID</span>
                <span className="font-mono font-bold text-emerald-700">{employee.employeeCode}</span>
              </div>
            </div>
          </div>

          {/* Contact & Legal Documents */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Contact & Compliance
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email:
                </span>
                <span className="font-mono text-slate-800">{employee.email || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone:
                </span>
                <span className="font-mono text-slate-800">{employee.phone || "—"}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Emirates ID:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {employee.emiratesId || "Not Registered"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Passport No:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {employee.passportNo || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Gross Monthly Salary:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatCurrency(totalSalary)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
