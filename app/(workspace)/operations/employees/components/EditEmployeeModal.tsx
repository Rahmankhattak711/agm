"use client";

import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  Employee,
  Gender,
  ContractType,
  EmploymentStatus,
  PaymentMethod,
  useUpdateEmployee,
} from "@/lib/hooks/api-hooks";
import { Modal, Button } from "@/components/ui";
import { FormInput, FormSubmit } from "@/components/ui/form";
import { toast } from "@/lib/toast";

export interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export function EditEmployeeModal({
  isOpen,
  onClose,
  employee,
}: EditEmployeeModalProps) {
  const [formError, setFormError] = useState("");
  const updateEmployeeMutation = useUpdateEmployee();

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
      if (!employee) return;

      try {
        await updateEmployeeMutation.mutateAsync({
          id: employee.id,
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

        toast.success(
          `Employee ${value.firstName} ${value.lastName} updated successfully`,
        );
        onClose();
      } catch (err: any) {
        setFormError(err.message || "Failed to save employee");
      }
    },
  });

  useEffect(() => {
    if (employee && isOpen) {
      setFormError("");
      form.reset({
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email || "",
        phone: employee.phone || "",
        department: employee.department || "Operations",
        designation: employee.designation || "",
        joiningDate: new Date(employee.joiningDate).toISOString().split("T")[0],
        gender: employee.gender || "MALE",
        nationality: employee.nationality || "UAE",
        emiratesId: employee.emiratesId || "",
        emiratesIdExpiry: employee.emiratesIdExpiry
          ? new Date(employee.emiratesIdExpiry).toISOString().split("T")[0]
          : "",
        passportNo: employee.passportNo || "",
        passportExpiry: employee.passportExpiry
          ? new Date(employee.passportExpiry).toISOString().split("T")[0]
          : "",
        laborCardNo: employee.laborCardNo || "",
        laborCardExpiry: employee.laborCardExpiry
          ? new Date(employee.laborCardExpiry).toISOString().split("T")[0]
          : "",
        visaNumber: employee.visaNumber || "",
        visaExpiry: employee.visaExpiry
          ? new Date(employee.visaExpiry).toISOString().split("T")[0]
          : "",
        emergencyContactName: employee.emergencyContactName || "",
        emergencyContactPhone: employee.emergencyContactPhone || "",
        contractType: employee.contractType || "FULL_TIME",
        employmentStatus: employee.employmentStatus || "ACTIVE",
        basicSalary: employee.basicSalary.toString(),
        housingAllowance: employee.housingAllowance?.toString() || "0",
        transportAllowance: employee.transportAllowance?.toString() || "0",
        otherAllowances: employee.otherAllowances?.toString() || "0",
        annualLeaveBalance: employee.annualLeaveBalance?.toString() || "30",
        paymentMethod: employee.paymentMethod || "WPS_BANK_TRANSFER",
        bankName: employee.bankName || "",
        iban: employee.iban || "",
      });
    }
  }, [employee, isOpen, form]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        employee
          ? `Edit ${employee.firstName} ${employee.lastName}`
          : "Edit Employee"
      }
      maxWidth="xl"
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
        <div className="font-bold text-agm-text uppercase border-b border-agm-box-border pb-1 tracking-wider text-[11px]">
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
            {(field) => <FormInput field={field} label="First Name" required />}
          </form.Field>
          <form.Field name="lastName">
            {(field) => <FormInput field={field} label="Last Name" required />}
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

        <div className="font-bold text-agm-text uppercase border-b border-agm-box-border pb-1 pt-2 tracking-wider text-[11px]">
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
              <FormInput field={field} label="Emirates ID Expiry" type="date" />
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

        <div className="font-bold text-agm-text uppercase border-b border-agm-box-border pb-1 pt-2 tracking-wider text-[11px]">
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

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-agm-box-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
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
  );
}
