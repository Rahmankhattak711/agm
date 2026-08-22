"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
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
import { SearchIcon } from "@/components/icons";
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
  FormInput,
  FormSelect,
  FormSubmit,
} from "@/components/ui";

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formError, setFormError] = useState("");

  const {
    data: employees = [],
    isLoading,
    error,
  } = useEmployees({
    department: departmentFilter !== "ALL" ? departmentFilter : undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    search: search || undefined,
  });

  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();

  const totalWorkforce = employees.length;
  const activeStaff = employees.filter(
    (e) => e.employmentStatus === "ACTIVE",
  ).length;
  const totalMonthlyPayroll = employees
    .filter((e) => e.employmentStatus === "ACTIVE")
    .reduce(
      (sum, e) =>
        sum +
        Number(e.basicSalary || 0) +
        Number(e.housingAllowance || 0) +
        Number(e.transportAllowance || 0) +
        Number(e.otherAllowances || 0),
      0,
    );

  const departments = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean)),
  );

  const form = useForm({
    defaultValues: {
      employeeCode: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "Operations",
      designation: "",
      joiningDate: new Date().toISOString().split("T")[0],
      gender: "MALE" as Gender,
      nationality: "UAE",
      emiratesId: "",
      emiratesIdExpiry: "",
      passportNo: "",
      passportExpiry: "",
      laborCardNo: "",
      laborCardExpiry: "",
      visaNumber: "",
      visaExpiry: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      contractType: "FULL_TIME" as ContractType,
      employmentStatus: "ACTIVE" as EmploymentStatus,
      basicSalary: "5000",
      housingAllowance: "0",
      transportAllowance: "0",
      otherAllowances: "0",
      annualLeaveBalance: "30",
      paymentMethod: "WPS_BANK_TRANSFER" as PaymentMethod,
      bankName: "",
      iban: "",
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      if (!editingEmployee) return;

      try {
        await updateEmployeeMutation.mutateAsync({
          id: editingEmployee.id,
          employeeCode: value.employeeCode.trim(),
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          email: value.email.trim() || undefined,
          phone: value.phone.trim() || undefined,
          department: value.department.trim() || undefined,
          designation: value.designation.trim() || undefined,
          joiningDate: value.joiningDate,
          gender: value.gender,
          nationality: value.nationality.trim() || undefined,
          emiratesId: value.emiratesId.trim() || undefined,
          emiratesIdExpiry: value.emiratesIdExpiry || undefined,
          passportNo: value.passportNo.trim() || undefined,
          passportExpiry: value.passportExpiry || undefined,
          laborCardNo: value.laborCardNo.trim() || undefined,
          laborCardExpiry: value.laborCardExpiry || undefined,
          visaNumber: value.visaNumber.trim() || undefined,
          visaExpiry: value.visaExpiry || undefined,
          emergencyContactName: value.emergencyContactName.trim() || undefined,
          emergencyContactPhone:
            value.emergencyContactPhone.trim() || undefined,
          contractType: value.contractType,
          employmentStatus: value.employmentStatus,
          basicSalary: Number(value.basicSalary),
          housingAllowance: Number(value.housingAllowance),
          transportAllowance: Number(value.transportAllowance),
          otherAllowances: Number(value.otherAllowances),
          annualLeaveBalance: Number(value.annualLeaveBalance),
          paymentMethod: value.paymentMethod,
          bankName: value.bankName.trim() || undefined,
          iban: value.iban.trim() || undefined,
        });

        setIsModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to save employee");
      }
    },
  });

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormError("");
    form.reset({
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email || "",
      phone: emp.phone || "",
      department: emp.department || "Operations",
      designation: emp.designation || "",
      joiningDate: new Date(emp.joiningDate).toISOString().split("T")[0],
      gender: emp.gender || "MALE",
      nationality: emp.nationality || "UAE",
      emiratesId: emp.emiratesId || "",
      emiratesIdExpiry: emp.emiratesIdExpiry
        ? new Date(emp.emiratesIdExpiry).toISOString().split("T")[0]
        : "",
      passportNo: emp.passportNo || "",
      passportExpiry: emp.passportExpiry
        ? new Date(emp.passportExpiry).toISOString().split("T")[0]
        : "",
      laborCardNo: emp.laborCardNo || "",
      laborCardExpiry: emp.laborCardExpiry
        ? new Date(emp.laborCardExpiry).toISOString().split("T")[0]
        : "",
      visaNumber: emp.visaNumber || "",
      visaExpiry: emp.visaExpiry
        ? new Date(emp.visaExpiry).toISOString().split("T")[0]
        : "",
      emergencyContactName: emp.emergencyContactName || "",
      emergencyContactPhone: emp.emergencyContactPhone || "",
      contractType: emp.contractType || "FULL_TIME",
      employmentStatus: emp.employmentStatus || "ACTIVE",
      basicSalary: emp.basicSalary.toString(),
      housingAllowance: emp.housingAllowance?.toString() || "0",
      transportAllowance: emp.transportAllowance?.toString() || "0",
      otherAllowances: emp.otherAllowances?.toString() || "0",
      annualLeaveBalance: emp.annualLeaveBalance?.toString() || "30",
      paymentMethod: emp.paymentMethod || "WPS_BANK_TRANSFER",
      bankName: emp.bankName || "",
      iban: emp.iban || "",
    });
    setIsModalOpen(true);
  };

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: EmploymentStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "ON_LEAVE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SUSPENDED":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "TERMINATED":
      case "RESIGNED":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: "employeeCode",
        header: "Emp ID",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-800">
            {row.original.employeeCode}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Employee Details",
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-slate-900">
              {row.original.firstName} {row.original.lastName}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>{row.original.designation || "Staff"}</span>
              <span>&bull;</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                {row.original.department || "Operations"}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "contact",
        header: "Contact Details",
        cell: ({ row }) => (
          <div className="text-xs">
            <span className="text-slate-700 block">
              {row.original.phone || "-"}
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              {row.original.email || "-"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "emiratesId",
        header: "UAE Compliance",
        cell: ({ row }) => (
          <div className="text-xs">
            {row.original.emiratesId ? (
              <span className="font-mono font-bold text-slate-800 block text-[11px]">
                {row.original.emiratesId}
              </span>
            ) : (
              <span className="text-slate-300 italic">No Emirates ID</span>
            )}
            {row.original.visaExpiry && (
              <span className="text-[10px] text-amber-700 block font-medium">
                Visa: {new Date(row.original.visaExpiry).toLocaleDateString()}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "monthlySalary",
        header: "Monthly Payroll",
        cell: ({ row }) => {
          const total =
            Number(row.original.basicSalary || 0) +
            Number(row.original.housingAllowance || 0) +
            Number(row.original.transportAllowance || 0) +
            Number(row.original.otherAllowances || 0);
          return (
            <div>
              <span className="font-mono font-bold text-slate-900 block text-xs">
                {formatCurrency(total)}
              </span>
              <span className="text-[10px] text-slate-400">
                Basic: {formatCurrency(row.original.basicSalary)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "employmentStatus",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(
              row.original.employmentStatus,
            )}`}
          >
            {row.original.employmentStatus.replace("_", " ")}
          </span>
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
                if (
                  confirm(
                    `Delete employee record for ${row.original.firstName} ${row.original.lastName}?`,
                  )
                ) {
                  await deleteEmployeeMutation.mutateAsync(row.original.id);
                }
              }}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [deleteEmployeeMutation],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Workforce & Human Capital Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employee master data, UAE visa dates, labor cards, salary
            packages, and WPS details.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Workforce
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {totalWorkforce}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Registered personnel</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Staff
          </p>
          <p className="text-2xl font-black text-emerald-800 mt-1">
            {activeStaff}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">On-duty workforce</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Monthly Payroll Commitment
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(totalMonthlyPayroll)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Basic + allowances (WPS)
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search code, name, phone, Emirates ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<SearchIcon className="w-4 h-4" strokeWidth={2} />}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="w-full sm:w-44">
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                options={[
                  { value: "ALL", label: "All Departments" },
                  ...departments.map((d: any) => ({ value: d, label: d })),
                ]}
              />
            </div>

            <div className="w-full sm:w-40">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "ALL", label: "All Statuses" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "ON_LEAVE", label: "On Leave" },
                  { value: "SUSPENDED", label: "Suspended" },
                  { value: "TERMINATED", label: "Terminated" },
                ]}
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-red-500">
            Error loading employees: {(error as any).message}
          </div>
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingEmployee
            ? `Edit ${editingEmployee.firstName} ${editingEmployee.lastName}`
            : "Edit Employee"
        }
        maxWidth="2xl"
      >
        {formError && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold mb-4">
            {formError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="text-xs font-bold text-slate-700 uppercase border-b border-slate-200 pb-1">
            1. Role & General Information
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <form.Field name="employeeCode">
              {(field) => (
                <FormInput
                  field={field}
                  label="Employee Code"
                  className="uppercase font-mono"
                />
              )}
            </form.Field>

            <form.Field
              name="firstName"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "First name is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput field={field} label="First Name *" required />
              )}
            </form.Field>

            <form.Field
              name="lastName"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "Last name is required" : undefined,
              }}
            >
              {(field) => (
                <FormInput field={field} label="Last Name *" required />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <form.Field name="department">
              {(field) => <FormInput field={field} label="Department" />}
            </form.Field>

            <form.Field name="designation">
              {(field) => <FormInput field={field} label="Designation" />}
            </form.Field>

            <form.Field name="joiningDate">
              {(field) => (
                <FormInput field={field} label="Joining Date" type="date" />
              )}
            </form.Field>
          </div>

          <div className="text-xs font-bold text-slate-700 uppercase border-b border-slate-200 pb-1 pt-2">
            2. UAE Identification & Visa Compliance
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="emiratesId">
              {(field) => (
                <FormInput
                  field={field}
                  label="Emirates ID"
                  placeholder="784-XXXX-XXXXXXX-X"
                />
              )}
            </form.Field>

            <form.Field name="emiratesIdExpiry">
              {(field) => (
                <FormInput
                  field={field}
                  label="Emirates ID Expiry"
                  type="date"
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="passportNo">
              {(field) => <FormInput field={field} label="Passport Number" />}
            </form.Field>

            <form.Field name="visaExpiry">
              {(field) => (
                <FormInput field={field} label="Visa Expiry Date" type="date" />
              )}
            </form.Field>
          </div>

          <div className="text-xs font-bold text-slate-700 uppercase border-b border-slate-200 pb-1 pt-2">
            3. Compensation & Allowances (AED)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <form.Field
              name="basicSalary"
              validators={{
                onChange: ({ value }) =>
                  !value || Number(value) <= 0
                    ? "Valid basic salary is required"
                    : undefined,
              }}
            >
              {(field) => (
                <FormInput
                  field={field}
                  label="Basic Salary *"
                  type="number"
                  required
                />
              )}
            </form.Field>

            <form.Field name="housingAllowance">
              {(field) => (
                <FormInput field={field} label="Housing" type="number" />
              )}
            </form.Field>

            <form.Field name="transportAllowance">
              {(field) => (
                <FormInput field={field} label="Transport" type="number" />
              )}
            </form.Field>

            <form.Field name="otherAllowances">
              {(field) => (
                <FormInput
                  field={field}
                  label="Other Allowances"
                  type="number"
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <form.Field name="paymentMethod">
              {(field) => (
                <FormSelect field={field} label="Payment Method">
                  <option value="WPS_BANK_TRANSFER">WPS Bank Transfer</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                </FormSelect>
              )}
            </form.Field>

            <form.Field name="bankName">
              {(field) => (
                <FormInput
                  field={field}
                  label="Bank Name"
                  placeholder="e.g. Emirates NBD"
                />
              )}
            </form.Field>

            <form.Field name="iban">
              {(field) => (
                <FormInput
                  field={field}
                  label="IBAN Number"
                  placeholder="AE000000000000000000000"
                />
              )}
            </form.Field>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <FormSubmit form={form} loading={updateEmployeeMutation.isPending}>
              Save Details
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
