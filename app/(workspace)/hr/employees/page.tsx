"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEmployees, Employee } from "@/lib/hooks/api-hooks";
import { PageHeader } from "@/components/ui";
import { EmployeesIcon, AttendanceIcon } from "@/components/icons";
import { Building2 } from "lucide-react";
import {
  EmployeeDirectoryTable,
  EmployeeAttendanceSection,
  EditEmployeeModal,
  OrganizationStructureSection,
} from "./components";

function EmployeesPageContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "directory" | "departments" | "attendance") || "directory";

  const { hasRole, isAdmin } = useAuth();
  const isHR = hasRole("HR") || isAdmin;

  const [mainTab, setMainTab] = useState<"directory" | "departments" | "attendance">(
    initialTab === "departments" || initialTab === "attendance" ? initialTab : "directory"
  );
  const [selectedAttendanceEmployeeId, setSelectedAttendanceEmployeeId] =
    useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: employees = [], isLoading, error } = useEmployees();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "departments" || tabParam === "attendance" || tabParam === "directory") {
      setMainTab(tabParam);
    }
  }, [searchParams]);

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsEditModalOpen(true);
  };

  const handleViewAttendance = (employeeId: string) => {
    setSelectedAttendanceEmployeeId(employeeId);
    setMainTab("attendance");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees & Organization"
        description="Manage master employee records, dynamic departments, job designations, and attendance."
      />

      <div className="flex items-center gap-1.5 p-1 bg-agm-card border border-agm-box-border rounded-xl shadow-2xs w-fit">
        <button
          type="button"
          onClick={() => setMainTab("directory")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            mainTab === "directory"
              ? "bg-agm-sidebar text-white shadow-xs"
              : "text-agm-muted hover:text-agm-text hover:bg-agm-box-bg"
          }`}
        >
          <EmployeesIcon size={14} />
          <span>Employees Directory</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              mainTab === "directory"
                ? "bg-white/20 text-white font-bold"
                : "bg-agm-box-bg text-agm-muted border border-agm-box-border"
            }`}
          >
            {employees.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("departments")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            mainTab === "departments"
              ? "bg-agm-sidebar text-white shadow-xs"
              : "text-agm-muted hover:text-agm-text hover:bg-agm-box-bg"
          }`}
        >
          <Building2 size={14} />
          <span>Departments & Roles</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab("attendance")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            mainTab === "attendance"
              ? "bg-agm-sidebar text-white shadow-xs"
              : "text-agm-muted hover:text-agm-text hover:bg-agm-box-bg"
          }`}
        >
          <AttendanceIcon size={14} />
          <span>Attendance</span>
        </button>
      </div>

      {mainTab === "directory" ? (
        <EmployeeDirectoryTable
          employees={employees}
          isLoading={isLoading}
          error={error}
          isHR={isHR}
          onEdit={handleEdit}
          onViewAttendance={handleViewAttendance}
        />
      ) : mainTab === "departments" ? (
        <OrganizationStructureSection />
      ) : (
        <EmployeeAttendanceSection
          employees={employees}
          selectedEmployeeId={selectedAttendanceEmployeeId}
          onSelectEmployee={setSelectedAttendanceEmployeeId}
          isHR={isHR}
        />
      )}

      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEmployee(null);
        }}
        employee={editingEmployee}
      />
    </div>
  );
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Employees & Organization...</div>}>
      <EmployeesPageContent />
    </Suspense>
  );
}
