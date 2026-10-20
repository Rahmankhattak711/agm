"use client";

import { useMemo, useState, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Employee, useDeleteEmployee } from "@/lib/hooks/api-hooks";
import {
  AttendanceIcon,
  ChevronDownIcon,
  EditIcon,
  TrashIcon,
} from "@/components/icons";
import { FilterBar, DataTable, Select } from "@/components/ui";
import { formatCurrency, getEmploymentStatusBadge } from "@/lib/utils";
import { EmployeeExpandedRow } from "./EmployeeExpandedRow";
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
  const { confirm } = useConfirm();
  const deleteEmployeeMutation = useDeleteEmployee();

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(
    null,
  );

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedEmployeeId((prev) => (prev === id ? null : id));
  }, []);

  const departments = useMemo(
    () =>
      Array.from(new Set(employees.map((e) => e.department).filter(Boolean))),
    [employees],
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
        (emp.emiratesId && emp.emiratesId.includes(q));

      const matchesDepartment =
        departmentFilter === "ALL" || emp.department === departmentFilter;

      const matchesStatus =
        statusFilter === "ALL" || emp.employmentStatus === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, search, departmentFilter, statusFilter]);

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
                <span className="font-medium">
                  {row.original.designation || "Staff"}
                </span>
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
                row.original.employmentStatus,
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
                onClick={() => handleToggleExpand(row.original.id)}
                className={`h-7 px-2.5 flex items-center gap-1 text-[11px] font-bold rounded-lg transition cursor-pointer shrink-0 border ${
                  isExpanded
                    ? "bg-agm-sidebar text-white border-agm-sidebar shadow-xs"
                    : "bg-agm-card text-agm-green border-agm-green/30 hover:bg-agm-green-soft hover:border-agm-green"
                }`}
                title={
                  isExpanded
                    ? "Collapse details"
                    : "View profile and compliance"
                }
              >
                <ChevronDownIcon
                  size={13}
                  className={`transition-transform duration-200 ${
                    isExpanded ? "rotate-180 text-white" : "text-agm-green"
                  }`}
                />
                <span>{isExpanded ? "Hide" : "Details"}</span>
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
                    onClick={() => onEdit(row.original)}
                    className="h-7 w-7 p-0 flex items-center justify-center text-agm-muted hover:text-agm-green-dark rounded-lg hover:bg-agm-green-soft transition cursor-pointer shrink-0"
                    title="Edit Employee Profile"
                  >
                    <EditIcon size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const isConfirmed = await confirm({
                        title: "Delete Employee",
                        message: `Delete employee record for ${row.original.firstName} ${row.original.lastName}?`,
                        variant: "danger",
                        confirmText: "Delete",
                      });
                      if (isConfirmed) {
                        try {
                          await deleteEmployeeMutation.mutateAsync(
                            row.original.id,
                          );
                          toast.success(
                            `Employee ${row.original.firstName} ${row.original.lastName} deleted`,
                          );
                        } catch (err: any) {
                          toast.error(
                            err.message || "Failed to delete employee",
                          );
                        }
                      }
                    }}
                    className="h-7 w-7 p-0 flex items-center justify-center text-agm-muted hover:text-rose-700 rounded-lg hover:bg-rose-50 transition cursor-pointer shrink-0"
                    title="Delete Employee"
                  >
                    <TrashIcon size={15} />
                  </button>
                </>
              ) : (
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded shrink-0">
                  View Only
                </span>
              )}
            </div>
          );
        },
      },
    ],
    [
      confirm,
      deleteEmployeeMutation,
      isHR,
      onEdit,
      onViewAttendance,
      handleToggleExpand,
      expandedEmployeeId,
    ],
  );

  return (
    <div className="p-3.5 sm:p-5 rounded-2xl bg-agm-card border border-agm-box-border shadow-xs space-y-4">
      <FilterBar
        tabs={[
          { id: "ALL", label: "All" },
          { id: "ACTIVE", label: "Active" },
          { id: "ON_LEAVE", label: "On Leave" },
          { id: "SUSPENDED", label: "Suspended" },
          { id: "TERMINATED", label: "Terminated" },
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search code, name, phone, Emirates ID..."
        totalCount={filteredEmployees.length}
        countLabel="Employees"
        rightAction={
          <div className="w-full sm:w-48">
            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="py-1.5 shadow-2xs cursor-pointer"
              options={[
                { value: "ALL", label: "All Departments" },
                ...departments.map((d: any) => ({
                  value: d,
                  label: d,
                })),
              ]}
            />
          </div>
        }
      />

      {error ? (
        <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
          Error loading employees: {(error as any).message}
        </div>
      ) : (
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
                onEdit={() => onEdit(emp)}
                onViewAttendance={() => onViewAttendance(emp.id)}
                isHR={isHR}
              />
            ) : null
          }
          emptyTitle="No registered employees found"
          emptyMessage="Registered users in Administration will automatically appear here."
        />
      )}
    </div>
  );
}
