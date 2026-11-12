"use client";

import React, { useState } from "react";
import {
  MoreVertical,
  Eye,
  Edit2,
  FileText,
  CreditCard,
  Trash2,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Employee } from "@/lib/hooks/api-hooks";
import { formatCurrency, getEmploymentStatusBadge } from "@/lib/utils";

export interface EmployeeCardGridProps {
  employees: Employee[];
  isHR: boolean;
  onView: (emp: Employee) => void;
  onEdit: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
  onViewDocuments: (emp: Employee) => void;
  onViewSalary: (emp: Employee) => void;
}

export function EmployeeCardGrid({
  employees,
  isHR,
  onView,
  onEdit,
  onDelete,
  onViewDocuments,
  onViewSalary,
}: EmployeeCardGridProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {employees.map((emp) => {
        const initials = `${emp.firstName?.[0] || ""}${emp.lastName?.[0] || ""}`.toUpperCase();
        const isMenuOpen = openMenuId === emp.id;
        const totalSalary =
          Number(emp.basicSalary || 0) +
          Number(emp.housingAllowance || 0) +
          Number(emp.transportAllowance || 0) +
          Number(emp.otherAllowances || 0);

        const joinDate = emp.joiningDate ? new Date(emp.joiningDate) : null;
        const now = new Date();
        const diffMonths = joinDate
          ? (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth())
          : 0;
        const tenureYrs = (Math.max(0, diffMonths) / 12).toFixed(1);

        return (
          <div
            key={emp.id}
            onClick={() => onView(emp)}
            className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all p-4 flex flex-col justify-between cursor-pointer"
          >
            {/* Top Bar: Checkbox & 3-Dots Menu */}
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10.5px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {emp.employeeCode}
              </span>

              {/* 3-Dots Action Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => toggleMenu(emp.id, e)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                      }}
                    />
                    <div
                      className="absolute right-0 top-7 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onView(emp);
                        }}
                        className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>View</span>
                      </button>

                      {isHR && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onEdit(emp);
                          }}
                          className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Edit</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onViewDocuments(emp);
                        }}
                        className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Documents</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onViewSalary(emp);
                        }}
                        className="w-full px-3 py-1.5 text-left text-emerald-800 bg-emerald-50/50 hover:bg-emerald-50 flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Salary</span>
                      </button>

                      {isHR && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onDelete(emp);
                          }}
                          className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 pt-1 border-t border-slate-100 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Profile Avatar & Info */}
            <div className="flex flex-col items-center text-center my-1">
              <div className="relative mb-2.5">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center border-2 border-white shadow-xs group-hover:scale-105 transition-transform">
                  {initials || "EM"}
                </div>
                <span
                  className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    emp.employmentStatus === "ACTIVE"
                      ? "bg-emerald-500"
                      : emp.employmentStatus === "ON_LEAVE"
                      ? "bg-amber-500"
                      : "bg-slate-400"
                  }`}
                />
              </div>

              <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                {emp.firstName} {emp.lastName}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                {emp.designation || "Staff"}
              </p>

              {/* Badges: Department & Status */}
              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap justify-center">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                  <Building2 className="w-2.5 h-2.5 text-slate-500" />
                  {emp.department || "Operations"}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getEmploymentStatusBadge(
                    emp.employmentStatus
                  )}`}
                >
                  {emp.employmentStatus.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-slate-600 text-[11px]">
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{emp.email || "No email"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono">{emp.phone || "—"}</span>
              </div>
            </div>

            {/* Footer with Salary & Tenure */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-mono">
                {tenureYrs} yrs tenure
              </span>
              <span className="font-mono font-bold text-emerald-800">
                {formatCurrency(totalSalary)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
