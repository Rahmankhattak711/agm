"use client";

import { useState } from "react";
import { useCreateEmployee, useDeleteEmployee, useEmployees, useUpdateEmployee } from "@/lib/hooks/api-hooks";

export default function EmployeesPage() {
  const { data: employees, isLoading, error } = useEmployees();
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [employeeCode, setEmployeeCode] = useState(`EMP-${Date.now().toString().slice(-4)}`);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Operations");
  const [designation, setDesignation] = useState("");
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split("T")[0]);
  const [basicSalary, setBasicSalary] = useState("");
  const [formError, setFormError] = useState("");

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalMonthlyPayroll = (employees || [])
    .filter((e) => e.isActive)
    .reduce((sum, e) => sum + Number(e.basicSalary || 0), 0);

  const departments = Array.from(
    new Set((employees || []).map((e) => e.department).filter(Boolean)),
  );

  const filteredEmployees = (employees || []).filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch =
      fullName.includes(q) ||
      emp.employeeCode.toLowerCase().includes(q) ||
      (emp.email && emp.email.toLowerCase().includes(q)) ||
      (emp.designation && emp.designation.toLowerCase().includes(q));

    const matchesDept = departmentFilter === "ALL" || emp.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const handleOpenAddModal = () => {
    setEditingId(null);
    setEmployeeCode(`EMP-${Date.now().toString().slice(-4)}`);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setDepartment("Operations");
    setDesignation("");
    setJoiningDate(new Date().toISOString().split("T")[0]);
    setBasicSalary("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: any) => {
    setEditingId(emp.id);
    setEmployeeCode(emp.employeeCode);
    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setEmail(emp.email || "");
    setPhone(emp.phone || "");
    setDepartment(emp.department || "Operations");
    setDesignation(emp.designation || "");
    setJoiningDate(
      emp.joiningDate
        ? new Date(emp.joiningDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    );
    setBasicSalary(emp.basicSalary ? emp.basicSalary.toString() : "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove employee "${name}"?`)) {
      try {
        await deleteEmployeeMutation.mutateAsync(id);
      } catch (err: any) {
        alert(err.message || "Failed to delete employee");
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!employeeCode.trim() || !firstName.trim() || !lastName.trim() || !basicSalary) {
      setFormError("Code, first name, last name, and basic salary are required.");
      return;
    }

    try {
      if (editingId) {
        await updateEmployeeMutation.mutateAsync({
          id: editingId,
          employeeCode: employeeCode.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          department: department.trim() || null,
          designation: designation.trim() || null,
          joiningDate,
          basicSalary: Number(basicSalary),
        });
      } else {
        await createEmployeeMutation.mutateAsync({
          employeeCode: employeeCode.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          department: department.trim() || undefined,
          designation: designation.trim() || undefined,
          joiningDate,
          basicSalary: Number(basicSalary),
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to save employee");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Employees & Payroll Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Staff master registry, UAE labor records, designations, and WPS salary tracking.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer self-start"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add New Employee
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Workforce</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{employees?.length || 0}</p>
          <p className="text-xs text-slate-500 mt-0.5">Active registered staff members</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Monthly Basic Payroll</p>
          <p className="text-2xl font-black text-emerald-800 font-mono mt-1">
            {formatCurrency(totalMonthlyPayroll)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Total monthly salary obligations</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Payroll Method</p>
          <p className="text-lg font-black text-slate-800 mt-1">UAE WPS Transfer</p>
          <p className="text-xs text-slate-500 mt-0.5">CBUAE compliant payroll file format</p>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search code, name, designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none text-slate-700 font-medium"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d: any) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table View */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">Loading employee records...</div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-red-500">Error loading employees: {(error as any).message}</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-600">No employees found</p>
            <p className="text-xs mt-1">Add your first employee to start managing salaries.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="pb-3 px-3">Code</th>
                  <th className="pb-3 px-3">Employee Name</th>
                  <th className="pb-3 px-3">Designation</th>
                  <th className="pb-3 px-3">Department</th>
                  <th className="pb-3 px-3 text-right">Basic Salary</th>
                  <th className="pb-3 px-3">Joined</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">{emp.employeeCode}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {emp.firstName} {emp.lastName}
                      {emp.email && <span className="block text-[11px] text-slate-400 font-normal">{emp.email}</span>}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">{emp.designation || "Staff Member"}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {emp.department || "General"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(emp.basicSalary)}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(emp.joiningDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(emp)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id, `${emp.firstName} ${emp.lastName}`)}
                          className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add/Edit Employee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-900">
                {editingId ? "Edit Employee Record" : "Add New Employee"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="emp@agm.ae"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+971 50 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Operations, Finance, Fitout"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Project Engineer, Accountant"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Basic Salary (AED)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="5000.00"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                >
                  {createEmployeeMutation.isPending || updateEmployeeMutation.isPending
                    ? "Saving..."
                    : editingId
                    ? "Update Record"
                    : "Save Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
