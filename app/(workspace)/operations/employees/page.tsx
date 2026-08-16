"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  useEmployees,
  useUpdateEmployee,
  useDeleteEmployee,
  Employee,
  Gender,
  ContractType,
  EmploymentStatus,
  PaymentMethod,
} from "@/lib/hooks/api-hooks";
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
} from "@/components/ui";

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State
  const [employeeCode, setEmployeeCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Operations");
  const [designation, setDesignation] = useState("");
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split("T")[0]);

  // Extended Personal & UAE Details
  const [gender, setGender] = useState<Gender>("MALE");
  const [nationality, setNationality] = useState("UAE");
  const [emiratesId, setEmiratesId] = useState("");
  const [emiratesIdExpiry, setEmiratesIdExpiry] = useState("");
  const [passportNo, setPassportNo] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [laborCardNo, setLaborCardNo] = useState("");
  const [laborCardExpiry, setLaborCardExpiry] = useState("");
  const [visaNumber, setVisaNumber] = useState("");
  const [visaExpiry, setVisaExpiry] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  // Employment & Compensation
  const [contractType, setContractType] = useState<ContractType>("FULL_TIME");
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>("ACTIVE");
  const [basicSalary, setBasicSalary] = useState("5000");
  const [housingAllowance, setHousingAllowance] = useState("0");
  const [transportAllowance, setTransportAllowance] = useState("0");
  const [otherAllowances, setOtherAllowances] = useState("0");
  const [annualLeaveBalance, setAnnualLeaveBalance] = useState("30");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("WPS_BANK_TRANSFER");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [formError, setFormError] = useState("");

  const { data: employees = [], isLoading, error } = useEmployees({
    department: departmentFilter !== "ALL" ? departmentFilter : undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    search: search || undefined,
  });

  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();

  const totalWorkforce = employees.length;
  const activeStaff = employees.filter((e) => e.employmentStatus === "ACTIVE").length;
  const totalMonthlyPayroll = employees
    .filter((e) => e.employmentStatus === "ACTIVE")
    .reduce(
      (sum, e) =>
        sum +
        Number(e.basicSalary || 0) +
        Number(e.housingAllowance || 0) +
        Number(e.transportAllowance || 0) +
        Number(e.otherAllowances || 0),
      0
    );

  const departments = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean))
  );

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmployeeCode(emp.employeeCode);
    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setEmail(emp.email || "");
    setPhone(emp.phone || "");
    setDepartment(emp.department || "Operations");
    setDesignation(emp.designation || "");
    setJoiningDate(new Date(emp.joiningDate).toISOString().split("T")[0]);
    setGender(emp.gender || "MALE");
    setNationality(emp.nationality || "UAE");
    setEmiratesId(emp.emiratesId || "");
    setEmiratesIdExpiry(emp.emiratesIdExpiry ? new Date(emp.emiratesIdExpiry).toISOString().split("T")[0] : "");
    setPassportNo(emp.passportNo || "");
    setPassportExpiry(emp.passportExpiry ? new Date(emp.passportExpiry).toISOString().split("T")[0] : "");
    setLaborCardNo(emp.laborCardNo || "");
    setLaborCardExpiry(emp.laborCardExpiry ? new Date(emp.laborCardExpiry).toISOString().split("T")[0] : "");
    setVisaNumber(emp.visaNumber || "");
    setVisaExpiry(emp.visaExpiry ? new Date(emp.visaExpiry).toISOString().split("T")[0] : "");
    setEmergencyContactName(emp.emergencyContactName || "");
    setEmergencyContactPhone(emp.emergencyContactPhone || "");
    setContractType(emp.contractType || "FULL_TIME");
    setEmploymentStatus(emp.employmentStatus || "ACTIVE");
    setBasicSalary(emp.basicSalary.toString());
    setHousingAllowance(emp.housingAllowance?.toString() || "0");
    setTransportAllowance(emp.transportAllowance?.toString() || "0");
    setOtherAllowances(emp.otherAllowances?.toString() || "0");
    setAnnualLeaveBalance(emp.annualLeaveBalance?.toString() || "30");
    setPaymentMethod(emp.paymentMethod || "WPS_BANK_TRANSFER");
    setBankName(emp.bankName || "");
    setIban(emp.iban || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!firstName.trim() || !lastName.trim() || !basicSalary) {
      setFormError("First name, last name, and basic salary are required.");
      return;
    }

    if (!editingEmployee) return;

    try {
      const payload = {
        id: editingEmployee.id,
        employeeCode: employeeCode.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        department: department.trim() || undefined,
        designation: designation.trim() || undefined,
        joiningDate,
        gender,
        nationality: nationality.trim() || undefined,
        emiratesId: emiratesId.trim() || undefined,
        emiratesIdExpiry: emiratesIdExpiry || undefined,
        passportNo: passportNo.trim() || undefined,
        passportExpiry: passportExpiry || undefined,
        laborCardNo: laborCardNo.trim() || undefined,
        laborCardExpiry: laborCardExpiry || undefined,
        visaNumber: visaNumber.trim() || undefined,
        visaExpiry: visaExpiry || undefined,
        emergencyContactName: emergencyContactName.trim() || undefined,
        emergencyContactPhone: emergencyContactPhone.trim() || undefined,
        contractType,
        employmentStatus,
        basicSalary: Number(basicSalary),
        housingAllowance: Number(housingAllowance),
        transportAllowance: Number(transportAllowance),
        otherAllowances: Number(otherAllowances),
        annualLeaveBalance: Number(annualLeaveBalance),
        paymentMethod,
        bankName: bankName.trim() || undefined,
        iban: iban.trim() || undefined,
      };

      await updateEmployeeMutation.mutateAsync(payload);
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to save employee");
    }
  };

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: "employee",
        header: "Registered User / Employee",
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-slate-900 block">
              {row.original.firstName} {row.original.lastName}
            </span>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold">
                {row.original.employeeCode}
              </span>
              {row.original.email && <span>• {row.original.email}</span>}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role & Department",
        cell: ({ row }) => (
          <div>
            <span className="font-semibold text-slate-800 block">
              {row.original.designation || "Staff"}
            </span>
            <span className="text-[10px] text-slate-400">
              {row.original.department || "Operations"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "uaeCompliance",
        header: "UAE Compliance",
        cell: ({ row }) => (
          <div className="text-xs text-slate-600">
            {row.original.emiratesId ? (
              <span className="font-mono font-semibold text-slate-800 block text-[11px]">
                EID: {row.original.emiratesId}
              </span>
            ) : (
              <span className="text-slate-400 text-[10px] block">No Emirates ID</span>
            )}
            {row.original.visaExpiry && (
              <span className="text-[10px] text-slate-400 block">
                Visa: {new Date(row.original.visaExpiry).toLocaleDateString()}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "grossSalary",
        header: "Gross Salary",
        cell: ({ row }) => {
          const gross =
            Number(row.original.basicSalary || 0) +
            Number(row.original.housingAllowance || 0) +
            Number(row.original.transportAllowance || 0) +
            Number(row.original.otherAllowances || 0);

          return (
            <div className="text-right font-mono">
              <span className="font-bold text-slate-900 block text-xs">
                AED {gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400">
                Basic: AED {Number(row.original.basicSalary).toLocaleString()}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "leaveBalance",
        header: "Leave Balance",
        cell: ({ row }) => (
          <div className="text-center font-bold text-slate-800">
            {row.original.annualLeaveBalance ?? 30} <span className="text-[10px] font-normal text-slate-400">days</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.employmentStatus === "ACTIVE" ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Staff
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                {row.original.employmentStatus}
              </span>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenEditModal(row.original)}
            >
              Edit Details
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={async () => {
                if (confirm(`Remove employee ${row.original.firstName} ${row.original.lastName}?`)) {
                  await deleteEmployeeMutation.mutateAsync(row.original.id);
                }
              }}
            >
              Remove
            </Button>
          </div>
        ),
      },
    ],
    [deleteEmployeeMutation]
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Employee Master Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized registered users, UAE labor compliance, WPS payroll allowances, and personnel files.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Workforce</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalWorkforce}</p>
          <p className="text-xs text-emerald-700 font-medium mt-0.5">{activeStaff} active registered personnel</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Monthly Payroll Obligation</p>
          <p className="text-2xl font-black text-emerald-800 font-mono mt-1">
            AED {totalMonthlyPayroll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Basic + UAE Allowances</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">WPS SIF Ready</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {employees.filter((e) => e.iban).length} / {totalWorkforce}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">IBAN configured staff</p>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search code, name, designation, Emirates ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full sm:w-44"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d: any) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-36"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On Leave</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="TERMINATED">Terminated</option>
            </Select>
          </div>
        </div>

        {/* TanStack Table Render */}
        {error ? (
          <div className="py-8 text-center text-xs text-red-500">Error loading employees: {(error as any).message}</div>
        ) : (
          <DataTable
            columns={columns}
            data={employees}
            isLoading={isLoading}
            emptyTitle="No registered employees found"
            emptyMessage="Registered users in Administration will automatically appear here."
          />
        )}
      </div>

      {/* Edit Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? `Edit ${editingEmployee.firstName} ${editingEmployee.lastName}` : "Edit Employee"}
        maxWidth="2xl"
      >
        {formError && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold mb-4">
            {formError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="text-xs font-bold text-slate-700 uppercase border-b border-slate-200 pb-1">
            1. Role & General Information
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Employee Code"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              className="uppercase font-mono"
            />
            <Input
              label="First Name *"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              label="Last Name *"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
            <Input
              label="Designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
            <Input
              label="Joining Date"
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
            />
          </div>

          <div className="text-xs font-bold text-slate-700 uppercase border-b border-slate-200 pb-1 pt-2">
            2. UAE Identification & Visa Compliance
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Emirates ID"
              placeholder="784-XXXX-XXXXXXX-X"
              value={emiratesId}
              onChange={(e) => setEmiratesId(e.target.value)}
            />
            <Input
              label="Emirates ID Expiry"
              type="date"
              value={emiratesIdExpiry}
              onChange={(e) => setEmiratesIdExpiry(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Passport Number"
              value={passportNo}
              onChange={(e) => setPassportNo(e.target.value)}
            />
            <Input
              label="Visa Expiry Date"
              type="date"
              value={visaExpiry}
              onChange={(e) => setVisaExpiry(e.target.value)}
            />
          </div>

          <div className="text-xs font-bold text-slate-700 uppercase border-b border-slate-200 pb-1 pt-2">
            3. Compensation & Allowances (AED)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="Basic Salary *"
              type="number"
              required
              value={basicSalary}
              onChange={(e) => setBasicSalary(e.target.value)}
            />
            <Input
              label="Housing"
              type="number"
              value={housingAllowance}
              onChange={(e) => setHousingAllowance(e.target.value)}
            />
            <Input
              label="Transport"
              type="number"
              value={transportAllowance}
              onChange={(e) => setTransportAllowance(e.target.value)}
            />
            <Input
              label="Other Allowances"
              type="number"
              value={otherAllowances}
              onChange={(e) => setOtherAllowances(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value="WPS_BANK_TRANSFER">WPS Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </Select>
            <Input
              label="Bank Name"
              placeholder="e.g. Emirates NBD"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
            <Input
              label="IBAN Number"
              placeholder="AE000000000000000000000"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateEmployeeMutation.isPending}
            >
              {updateEmployeeMutation.isPending ? "Saving..." : "Save Details"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
