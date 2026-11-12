"use client";

import React from "react";
import { Employee } from "@/lib/hooks/api-hooks";
import {
  AttendanceIcon,
  EditIcon,
  EmployeesIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { CustomRowExpand } from "@/components/ui";
import { formatCurrency, getEmploymentStatusBadge } from "@/lib/utils";

export interface EmployeeExpandedRowProps {
  employee: Employee;
  colSpan?: number;
  onClose: () => void;
  onEdit?: () => void;
  onViewAttendance?: () => void;
  isHR?: boolean;
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="p-3 bg-agm-card border border-agm-box-border text-agm-text rounded-xl shadow-2xs space-y-1">
      <div className="flex items-center justify-between border-b border-agm-box-border/60 pb-1.5 mb-1">
        <span className="font-bold text-[11px] uppercase tracking-wider text-agm-text flex items-center gap-1.5">
          {icon}
          {title}
        </span>
      </div>
      <div className="divide-y divide-agm-box-border/30">{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  badge,
  mono = false,
  highlight = false,
}: {
  label: string;
  value?: React.ReactNode;
  badge?: React.ReactNode;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-xs">
      <span className="text-[10px] uppercase font-bold text-agm-muted tracking-wide shrink-0">
        {label}
      </span>
      <div className="flex items-center gap-1.5 overflow-hidden text-right">
        {value !== undefined && (
          <span
            className={`text-xs ${
              highlight
                ? "font-bold text-agm-text"
                : "font-semibold text-agm-text"
            } ${mono ? "font-mono" : ""} truncate`}
          >
            {value}
          </span>
        )}
        {badge}
      </div>
    </div>
  );
}

export function EmployeeExpandedRow({
  employee,
  colSpan = 5,
  onClose,
  onEdit,
  onViewAttendance,
  isHR = false,
}: EmployeeExpandedRowProps) {
  const totalMonthlyGross =
    Number(employee.basicSalary || 0) +
    Number(employee.housingAllowance || 0) +
    Number(employee.transportAllowance || 0) +
    Number(employee.otherAllowances || 0);

  const getExpiryBadge = (expiryDate?: string | Date | null) => {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.ceil(
      (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-800 border border-rose-200 whitespace-nowrap">
          Expired ({exp.toLocaleDateString("en-GB")})
        </span>
      );
    }
    if (diffDays <= 30) {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
          Expiring ({exp.toLocaleDateString("en-GB")})
        </span>
      );
    }
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-agm-green-soft text-agm-green-dark border border-agm-green/30 whitespace-nowrap">
        Valid ({exp.toLocaleDateString("en-GB")})
      </span>
    );
  };

  const complianceItems = [
    {
      label: "Emirates ID",
      value: employee.emiratesId || "—",
      expiry: employee.emiratesIdExpiry,
    },
    {
      label: "Passport Number",
      value: employee.passportNo || "—",
      expiry: employee.passportExpiry,
    },
    {
      label: "Labor Card (MOHRE)",
      value: employee.laborCardNo || "—",
      expiry: employee.laborCardExpiry,
    },
    {
      label: "Residency Visa",
      value: employee.visaNumber || "—",
      expiry: employee.visaExpiry,
    },
  ];

  const contractItems = [
    {
      label: "Contract Type",
      value: employee.contractType
        ? employee.contractType.replace("_", " ")
        : "Full Time",
    },
    {
      label: "Date of Joining",
      value: new Date(employee.joiningDate).toLocaleDateString("en-GB"),
      mono: true,
    },
    {
      label: "Nationality & Gender",
      value: `${employee.nationality || "UAE"} • ${employee.gender || "MALE"}`,
    },
    {
      label: "Emergency Contact",
      value: employee.emergencyContactName
        ? `${employee.emergencyContactName}${employee.emergencyContactPhone ? ` (${employee.emergencyContactPhone})` : ""}`
        : "—",
    },
    {
      label: "Leave Balance",
      value: `${employee.annualLeaveBalance ?? 30} Days`,
      mono: true,
    },
  ];

  const salaryItems = [
    {
      label: "Basic Salary",
      value: formatCurrency(employee.basicSalary),
      mono: true,
    },
    {
      label: "Housing",
      value: formatCurrency(employee.housingAllowance || 0),
      mono: true,
    },
    {
      label: "Transport",
      value: formatCurrency(employee.transportAllowance || 0),
      mono: true,
    },
    {
      label: "Other Allowances",
      value: formatCurrency(employee.otherAllowances || 0),
      mono: true,
    },
  ];

  return (
    <CustomRowExpand
      colSpan={colSpan}
      onClose={onClose}
      accentColor="emerald"
      headerLeft={
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-agm-green-dark bg-agm-green-soft border border-agm-green/30 px-1.5 py-0.5 rounded text-[11px] inline-flex items-center gap-1 shadow-2xs">
            <EmployeesIcon size={11} className="text-agm-green" />
            {employee.employeeCode}
          </span>
          <span className="font-bold text-xs text-agm-text">
            {employee.firstName} {employee.lastName}
          </span>
          <span className="text-[11px] text-agm-muted font-medium">
            {employee.designation || "Staff"} &bull;{" "}
            <span className="font-semibold text-agm-text">
              {employee.department || "Operations"}
            </span>
          </span>
          <span
            className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${getEmploymentStatusBadge(
              employee.employmentStatus,
            )}`}
          >
            {employee.employmentStatus.replace("_", " ")}
          </span>
          {employee.phone && (
            <span className="text-[10px] font-mono text-agm-muted bg-agm-card border border-agm-box-border px-1.5 py-0.2 rounded">
              {employee.phone}
            </span>
          )}
        </div>
      }
      headerRight={
        <div className="flex items-center gap-1.5 flex-wrap">
          {onViewAttendance && (
            <button
              type="button"
              onClick={onViewAttendance}
              className="h-7 px-2.5 text-[11px] font-bold text-agm-green-dark bg-agm-green-soft hover:bg-agm-green/20 border border-agm-green/30 rounded-lg flex items-center gap-1 transition cursor-pointer shadow-2xs"
              title="Open full attendance and timesheets in dedicated section"
            >
              <AttendanceIcon size={13} className="text-agm-green" />
              <span>View Attendance &rarr;</span>
            </button>
          )}

          {isHR && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="h-7 px-2.5 text-[11px] font-bold text-agm-text bg-agm-card hover:bg-agm-box-bg border border-agm-box-border rounded-lg flex items-center gap-1 transition cursor-pointer shadow-2xs"
              title="Edit Employee Master Profile"
            >
              <EditIcon size={12} className="text-agm-navy" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <SectionCard
          title="UAE Compliance & IDs"
          icon={<ShieldCheckIcon size={12} className="text-agm-green" />}
        >
          {complianceItems.map((item) => (
            <DetailRow
              key={item.label}
              label={item.label}
              value={item.value}
              badge={getExpiryBadge(item.expiry)}
              mono={item.value !== "—"}
            />
          ))}
        </SectionCard>

        <SectionCard title="Employment & Contract">
          {contractItems.map((item) => (
            <DetailRow
              key={item.label}
              label={item.label}
              value={item.value}
              mono={item.mono}
            />
          ))}
        </SectionCard>

        <SectionCard title="Compensation & Banking">
          {salaryItems.map((item) => (
            <DetailRow
              key={item.label}
              label={item.label}
              value={item.value}
              mono={item.mono}
            />
          ))}
          <DetailRow
            label="Total Monthly Gross"
            value={formatCurrency(totalMonthlyGross)}
            mono
            highlight
          />
          <DetailRow
            label="WPS Bank & IBAN"
            value={
              employee.bankName
                ? `${employee.bankName}${employee.iban ? ` • ${employee.iban}` : ""}`
                : "Not Configured"
            }
            mono={Boolean(employee.iban)}
          />
        </SectionCard>
      </div>
    </CustomRowExpand>
  );
}
