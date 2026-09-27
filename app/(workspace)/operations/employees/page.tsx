"use client";

import { useMemo, useState, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import { useAuth } from "@/context/AuthContext";
import { formatAed } from "@/lib/utils/format";
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
  EditIcon,
  EmployeesIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
  FormInput,
  FormSelect,
  FormSubmit,
  DashboardCard,
  DashboardCardGrid,
} from "@/components/ui";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/context/ConfirmContext";

export default function EmployeesPage() {
  const { hasRole, isAdmin } = useAuth();
  const { confirm } = useConfirm();
  const isHR = hasRole("HR") || isAdmin;
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

  const stats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((e) => e.employmentStatus === "ACTIVE").length,
      onLeave: employees.filter((e) => e.employmentStatus === "ON_LEAVE")
        .length,
      monthlyPayroll: employees
        .filter((e) => e.employmentStatus === "ACTIVE")
        .reduce(
          (sum, e) =>
            sum +
            Number(e.basicSalary || 0) +
            Number(e.housingAllowance || 0) +
            Number(e.transportAllowance || 0) +
            Number(e.otherAllowances || 0),
          0,
        ),
    }),
    [employees],
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

  const handleOpenEditModal = useCallback(
    (emp: Employee) => {
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
    },
    [form],
  );

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusBadge = (status: EmploymentStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "ON_LEAVE":
        return "bg-sky-50 text-sky-800 border-sky-200";
      case "SUSPENDED":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "TERMINATED":
      case "RESIGNED":
        return "bg-rose-50 text-rose-800 border-rose-200";
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
          <span className="font-mono font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
            <EmployeesIcon size={12} className="text-teal-700" />
            {row.original.employeeCode}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Employee Details",
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-slate-900 text-xs">
              {row.original.firstName} {row.original.lastName}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span className="font-medium">
                {row.original.designation || "Staff"}
              </span>
              <span>&bull;</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
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
            <span className="text-slate-800 font-mono font-medium block">
              {row.original.phone || "—"}
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              {row.original.email || "—"}
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
              <span className="text-slate-300 italic text-xs">
                No Emirates ID
              </span>
            )}
            {row.original.visaExpiry && (
              <span className="text-[10px] text-amber-800 block font-mono font-semibold mt-0.5">
                Visa:{" "}
                {new Date(row.original.visaExpiry).toLocaleDateString("en-GB")}
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
              <span className="font-mono font-black text-slate-900 block text-xs">
                {formatCurrency(total)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Basic: {formatCurrency(row.original.basicSalary)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "employmentStatus",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
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
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          if (!isHR) {
            return (
              <div className="flex items-center justify-center">
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  View Only
                </span>
              </div>
            );
          }

          return (
            <div className="flex items-center justify-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenEditModal(row.original)}
                icon={<EditIcon size={13} />}
                title="Edit Employee"
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  const isConfirmed = await confirm({
                    title: "Delete Employee",
                    message: `Delete employee record for ${row.original.firstName} ${row.original.lastName}?`,
                    variant: "danger",
                    confirmText: "Delete",
                  });
                  if (isConfirmed) {
                    try {
                      await deleteEmployeeMutation.mutateAsync(row.original.id);
                      toast.success(
                        `Employee ${row.original.firstName} ${row.original.lastName} deleted`,
                      );
                    } catch (err: any) {
                      toast.error(err.message || "Failed to delete employee");
                    }
                  }
                }}
                icon={<TrashIcon size={13} />}
                title="Delete Employee"
              >
                Delete
              </Button>
            </div>
          );
        },
      },
    ],
    [confirm, deleteEmployeeMutation, isHR, handleOpenEditModal],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Employees Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employee master profiles, UAE labor contracts, visa statuses,
            and department records.
          </p>
        </div>
      </div>

      <DashboardCardGrid cols={4}>
        <DashboardCard
          title="Total Workforce"
          value={stats.total}
          subtitle="Registered personnel"
          variant="default"
        />
        <DashboardCard
          title="Active On-Duty"
          value={stats.active}
          subtitle="On-duty staff count"
          variant="success"
        />
        <DashboardCard
          title="Monthly Payroll (WPS)"
          value={`AED ${Number(stats.monthlyPayroll).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtitle="Basic + allowances"
          variant="default"
        />
        <DashboardCard
          title="UAE Compliance"
          value="100% Compliant"
          subtitle="WPS & labor card status"
          badge={
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
              MOHRE
            </span>
          }
          variant="default"
        />
      </DashboardCardGrid>

      <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              {[
                { id: "ALL", label: "All Personnel" },
                { id: "ACTIVE", label: "Active Staff" },
                { id: "ON_LEAVE", label: "On Leave" },
                { id: "SUSPENDED", label: "Suspended" },
                { id: "TERMINATED", label: "Terminated" },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant={isActive ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            <span className="text-[11px] font-bold text-slate-500 font-mono">
              {employees.length} Personnel Listed
            </span>
          </div>

          <div className="pt-1 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-2">
            <Input
              containerClassName="w-full sm:w-80"
              placeholder="Search code, name, phone, Emirates ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<SearchIcon size={16} />}
              className="py-1.5 shadow-2xs"
            />

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
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading employees: {(error as any).message}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
              <h4 className="font-black text-xs uppercase tracking-wider text-white">
                Master Workforce Directory
              </h4>
              <span className="text-[11px] font-mono text-emerald-300 font-bold">
                {employees.length} Personnel
              </span>
            </div>

            <DataTable
              columns={columns}
              data={employees}
              isLoading={isLoading}
              emptyTitle="No registered employees found"
              emptyMessage="Registered users in Administration will automatically appear here."
            />
          </div>
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
          <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold mb-4">
            {formError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4 text-xs"
        >
          <div className="font-bold text-slate-700 uppercase border-b border-slate-200 pb-1 tracking-wider text-[11px]">
            1. Role &amp; General Information
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <form.Field name="employeeCode">
              {(field) => (
                <FormInput
                  field={field}
                  label="Employee Code"
                  required
                  className="font-mono font-bold uppercase"
                />
              )}
            </form.Field>
            <form.Field name="firstName">
              {(field) => (
                <FormInput field={field} label="First Name" required />
              )}
            </form.Field>
            <form.Field name="lastName">
              {(field) => (
                <FormInput field={field} label="Last Name" required />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <form.Field name="department">
              {(field) => (
                <FormInput
                  field={field}
                  label="Department"
                  placeholder="e.g. Operations"
                />
              )}
            </form.Field>
            <form.Field name="designation">
              {(field) => (
                <FormInput
                  field={field}
                  label="Designation"
                  placeholder="e.g. Site Supervisor"
                />
              )}
            </form.Field>
            <form.Field name="joiningDate">
              {(field) => (
                <FormInput field={field} label="Joining Date" type="date" />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="email">
              {(field) => (
                <FormInput field={field} label="Email Address" type="email" />
              )}
            </form.Field>
            <form.Field name="phone">
              {(field) => (
                <FormInput
                  field={field}
                  label="Phone Number"
                  placeholder="+971 50 000 0000"
                />
              )}
            </form.Field>
          </div>

          <div className="font-bold text-slate-700 uppercase border-b border-slate-200 pb-1 pt-2 tracking-wider text-[11px]">
            2. UAE Legal &amp; Compliance Details
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="emiratesId">
              {(field) => (
                <FormInput
                  field={field}
                  label="Emirates ID"
                  placeholder="784-XXXX-XXXXXXX-X"
                  className="font-mono"
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
            <form.Field name="visaNumber">
              {(field) => (
                <FormInput
                  field={field}
                  label="UAE Visa Number"
                  className="font-mono"
                />
              )}
            </form.Field>
            <form.Field name="visaExpiry">
              {(field) => (
                <FormInput field={field} label="Visa Expiry Date" type="date" />
              )}
            </form.Field>
          </div>

          <div className="font-bold text-slate-700 uppercase border-b border-slate-200 pb-1 pt-2 tracking-wider text-[11px]">
            3. Monthly Compensation &amp; WPS
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <form.Field name="basicSalary">
              {(field) => (
                <FormInput
                  field={field}
                  label="Basic Salary (AED)"
                  type="number"
                  required
                  className="font-mono font-bold"
                />
              )}
            </form.Field>
            <form.Field name="housingAllowance">
              {(field) => (
                <FormInput
                  field={field}
                  label="Housing (AED)"
                  type="number"
                  className="font-mono"
                />
              )}
            </form.Field>
            <form.Field name="transportAllowance">
              {(field) => (
                <FormInput
                  field={field}
                  label="Transport (AED)"
                  type="number"
                  className="font-mono"
                />
              )}
            </form.Field>
            <form.Field name="otherAllowances">
              {(field) => (
                <FormInput
                  field={field}
                  label="Other Allow. (AED)"
                  type="number"
                  className="font-mono"
                />
              )}
            </form.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form.Field name="bankName">
              {(field) => (
                <FormInput
                  field={field}
                  label="WPS Bank Name"
                  placeholder="e.g. RAK Bank"
                />
              )}
            </form.Field>
            <form.Field name="iban">
              {(field) => (
                <FormInput
                  field={field}
                  label="WPS IBAN Number"
                  placeholder="AE000000000000000000000"
                  className="font-mono"
                />
              )}
            </form.Field>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <FormSubmit
              form={form}
              loading={updateEmployeeMutation.isPending}
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
            >
              Save Employee Changes
            </FormSubmit>
          </div>
        </form>
      </Modal>
    </div>
  );
}
