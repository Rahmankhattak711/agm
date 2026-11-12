"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Employee, useDeleteEmployee } from "@/lib/hooks/api-hooks";
import {
  AttendanceIcon,
  ChevronDownIcon,
  EditIcon,
  TrashIcon,
} from "@/components/icons";
import {
  Users,
  CheckCircle2,
  Plane,
  Building2,
  Briefcase,
  Download,
  Plus,
  LayoutGrid,
  List,
  Search,
} from "lucide-react";
import { DataTable, Select, Button } from "@/components/ui";
import { formatCurrency, getEmploymentStatusBadge } from "@/lib/utils";
import { EmployeeExpandedRow } from "./EmployeeExpandedRow";
import { EmployeeCardGrid } from "./EmployeeCardGrid";
import { AddEmployeeModal } from "./AddEmployeeModal";
import { EmployeeDetailsModal } from "./EmployeeDetailsModal";
import { useDepartments } from "@/lib/hooks/hr-hooks";
import { useConfirm } from "@/context/ConfirmContext";
import { toast } from "@/lib/toast";

export interface EmployeeDirectoryTableProps {
  employees: Employee[];
  isLoading: boolean;
  error: any;
  isHR: boolean;
  onEdit: (emp: Employee) => void;
  onViewAttendance: (employeeId: string) => void;
}

export function EmployeeDirectoryTable({
  employees,
  isLoading,
  error,
  isHR,
  onEdit,
  onViewAttendance,
}: EmployeeDirectoryTableProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const deleteEmployeeMutation = useDeleteEmployee();

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailsEmployee, setDetailsEmployee] = useState<Employee | null>(null);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedEmployeeId((prev) => (prev === id ? null : id));
  }, []);

  const { data: dbDepartments = [] } = useDepartments();

  const departments = useMemo(() => {
    const list = new Set<string>();
    dbDepartments.forEach((d: any) => {
      if (d.name) list.add(d.name);
    });
    employees.forEach((e) => {
      if (e.department) list.add(e.department);
    });
    return Array.from(list);
  }, [dbDepartments, employees]);

  const totalDepartmentsCount = useMemo(() => {
    return Math.max(dbDepartments.length, departments.length, 1);
  }, [dbDepartments.length, departments.length]);

  // Metrics
  const activeCount = useMemo(
    () => employees.filter((e) => e.employmentStatus === "ACTIVE").length,
    [employees]
  );
  const onLeaveCount = useMemo(
    () => employees.filter((e) => e.employmentStatus === "ON_LEAVE").length,
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        emp.employeeCode.toLowerCase().includes(q) ||
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
        (emp.email && emp.email.toLowerCase().includes(q)) ||
        (emp.phone && emp.phone.includes(q)) ||
        (emp.emiratesId && emp.emiratesId.includes(q)) ||
        (emp.designation && emp.designation.toLowerCase().includes(q));

      const matchesDepartment =
        departmentFilter === "ALL" || emp.department === departmentFilter;

      const matchesStatus =
        statusFilter === "ALL" || emp.employmentStatus === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, search, departmentFilter, statusFilter]);

  // CSV Export
  const handleExportCSV = () => {
    if (filteredEmployees.length === 0) {
      toast.error("No employees to export");
      return;
    }
    const headers = [
      "Employee Code",
      "First Name",
      "Last Name",
      "Department",
      "Designation",
      "Email",
      "Phone",
      "Status",
      "Basic Salary",
      "Total Salary",
    ];
    const rows = filteredEmployees.map((e) => {
      const totalSalary =
        Number(e.basicSalary || 0) +
        Number(e.housingAllowance || 0) +
        Number(e.transportAllowance || 0) +
        Number(e.otherAllowances || 0);

      return [
        e.employeeCode,
        `"${e.firstName}"`,
        `"${e.lastName}"`,
        `"${e.department || ""}"`,
        `"${e.designation || ""}"`,
        `"${e.email || ""}"`,
        `"${e.phone || ""}"`,
        e.employmentStatus,
        e.basicSalary || 0,
        totalSalary,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `employees_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (emp: Employee) => {
    const isConfirmed = await confirm({
      title: "Delete Employee",
      message: `Are you sure you want to delete employee record for ${emp.firstName} ${emp.lastName}?`,
      variant: "danger",
      confirmText: "Delete",
    });
    if (isConfirmed) {
      try {
        await deleteEmployeeMutation.mutateAsync(emp.id);
        toast.success(`Employee ${emp.firstName} ${emp.lastName} deleted`);
      } catch (err: any) {
        toast.error(err.message || "Failed to delete employee");
      }
    }
  };

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Employee",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <span className="font-mono font-bold text-agm-green-dark bg-agm-green-soft border border-agm-green/30 px-2 py-0.5 rounded text-xs whitespace-nowrap shrink-0">
              {row.original.employeeCode}
            </span>
            <div className="min-w-0">
              <div className="font-bold text-agm-text text-xs whitespace-nowrap">
                {row.original.firstName} {row.original.lastName}
              </div>
              <div className="text-[11px] text-agm-muted flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                <span className="font-medium">{row.original.designation || "Staff"}</span>
                <span>&bull;</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-agm-box-bg text-agm-muted border border-agm-box-border">
                  {row.original.department || "Operations"}
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "contact",
        header: "Contact",
        cell: ({ row }) => (
          <div className="text-xs whitespace-nowrap">
            <span className="text-agm-text font-mono font-medium block">
              {row.original.phone || "—"}
            </span>
            <span className="text-agm-muted font-mono text-[10px] block truncate max-w-[160px]">
              {row.original.email || "—"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "monthlySalary",
        header: "Salary",
        cell: ({ row }) => {
          const total =
            Number(row.original.basicSalary || 0) +
            Number(row.original.housingAllowance || 0) +
            Number(row.original.transportAllowance || 0) +
            Number(row.original.otherAllowances || 0);
          return (
            <div className="whitespace-nowrap">
              <span className="font-mono font-bold text-agm-text text-xs">
                {formatCurrency(total)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "employmentStatus",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => (
          <div className="text-center whitespace-nowrap">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getEmploymentStatusBadge(
                row.original.employmentStatus
              )}`}
            >
              {row.original.employmentStatus.replace("_", " ")}
            </span>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const isExpanded = expandedEmployeeId === row.original.id;
          return (
            <div className="flex items-center justify-end gap-1 whitespace-nowrap">
              <button
                type="button"
                onClick={() => router.push(`/hr/employees/${row.original.id}`)}
                className="h-7 px-2.5 flex items-center gap-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer shrink-0"
                title="View full employee details"
              >
                <span>View</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleExpand(row.original.id)}
                className={`h-7 px-2 flex items-center gap-1 text-[11px] font-bold rounded-lg transition cursor-pointer shrink-0 border ${
                  isExpanded
                    ? "bg-agm-sidebar text-white border-agm-sidebar shadow-xs"
                    : "bg-agm-card text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
                title={isExpanded ? "Collapse details" : "Expand quick row"}
              >
                <ChevronDownIcon
                  size={13}
                  className={`transition-transform duration-200 ${
                    isExpanded ? "rotate-180 text-white" : "text-slate-500"
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={() => onViewAttendance(row.original.id)}
                className="h-7 w-7 p-0 flex items-center justify-center text-agm-muted hover:text-agm-green rounded-lg hover:bg-agm-green-soft transition cursor-pointer shrink-0"
                title="View Attendance & Timesheets"
              >
                <AttendanceIcon size={15} />
              </button>

              {isHR ? (
                <>
                  <button
                    type="button"
                    onClick={() => router.push(`/hr/employees/${row.original.id}/edit`)}
                    className="h-7 w-7 p-0 flex items-center justify-center text-agm-muted hover:text-agm-green-dark rounded-lg hover:bg-agm-green-soft transition cursor-pointer shrink-0"
                    title="Edit Employee Profile"
                  >
                    <EditIcon size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(row.original)}
                    className="h-7 w-7 p-0 flex items-center justify-center text-agm-muted hover:text-rose-700 rounded-lg hover:bg-rose-50 transition cursor-pointer shrink-0"
                    title="Delete Employee"
                  >
                    <TrashIcon size={15} />
                  </button>
                </>
              ) : null}
            </div>
          );
        },
      },
    ],
    [isHR, onEdit, onViewAttendance, handleToggleExpand, expandedEmployeeId]
  );

  return (
    <div className="space-y-4">
      {/* 4 Top KPI Cards (DreamERP Style - Image 1) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Total Employees
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{employees.length}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Active
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-1">{activeCount}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              On Leave
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Plane className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-amber-700 mt-1">{onLeaveCount}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Departments
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{totalDepartmentsCount}</p>
        </div>
      </div>

      {/* Subheader: Export & Add Employee + Filter Bar */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {filteredEmployees.length} employees across {totalDepartmentsCount} departments
            </h3>
            <p className="text-[11px] text-slate-400">Master corporate staff directory & records</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  viewMode === "grid" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-400 hover:text-slate-700"
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  viewMode === "table" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-400 hover:text-slate-700"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleExportCSV}
              className="text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Export
            </Button>

            <Link href="/hr/departments">
              <Button
                type="button"
                variant="outline"
                className="text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
              >
                <Building2 className="w-3.5 h-3.5 mr-1 text-blue-600" />
                Departments
              </Button>
            </Link>

            <Link href="/hr/departments">
              <Button
                type="button"
                variant="outline"
                className="text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
              >
                <Briefcase className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                Roles
              </Button>
            </Link>

            {isHR && (
              <Button
                type="button"
                onClick={() => router.push("/hr/employees/new")}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Employee
              </Button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code, name, phone, Emirates ID, designation..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full sm:w-40 p-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d: any) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-32 p-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content: Cards Grid or Table */}
      {error ? (
        <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
          Error loading employees: {(error as any).message}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
          No employees found matching the selected filters.
        </div>
      ) : viewMode === "grid" ? (
        <EmployeeCardGrid
          employees={filteredEmployees}
          isHR={isHR}
          onView={(emp) => router.push(`/hr/employees/${emp.id}`)}
          onEdit={(emp) => router.push(`/hr/employees/${emp.id}/edit`)}
          onDelete={(emp) => handleDelete(emp)}
          onViewDocuments={(emp) => router.push(`/hr/employees/${emp.id}/documents`)}
          onViewSalary={(emp) => router.push(`/hr/salary-structures?employeeId=${emp.id}`)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredEmployees}
            isLoading={isLoading}
            renderExpandedRow={(emp) =>
              expandedEmployeeId === emp.id ? (
                <EmployeeExpandedRow
                  employee={emp}
                  colSpan={columns.length}
                  onClose={() => setExpandedEmployeeId(null)}
                  onEdit={() => router.push(`/hr/employees/${emp.id}/edit`)}
                  onViewAttendance={() => onViewAttendance(emp.id)}
                  isHR={isHR}
                />
              ) : null
            }
            emptyTitle="No registered employees found"
            emptyMessage="Registered users in Administration will automatically appear here."
          />
        </div>
      )}
    </div>
  );
}
