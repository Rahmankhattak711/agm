"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { EmployeeMonthlySheetData } from "@/lib/hooks/api-hooks";
import { Button, Card } from "@/components/ui";
import { FormInput } from "@/components/ui/form";
import {
  DollarSignIcon,
  AlertTriangleIcon,
  WalletIcon,
  ShieldCheckIcon,
  SaveIcon,
  CheckCircle2Icon,
  SpinnerIcon,
  EditIcon,
} from "@/components/icons";
import { formatCurrency } from "@/lib/utils/format";

export interface PayrollAdjustmentValues {
  overtimeAmount: number;
  bonusAmount: number;
  absenceDeduction: number;
  otherDeductions: number;
  isPaid: boolean;
  paymentDate: string;
  remarks: string;
}

interface EmployeeSheetStatementProps {
  sheetData: EmployeeMonthlySheetData;
  isHR?: boolean;
  onSavePayroll?: (values: PayrollAdjustmentValues) => Promise<void>;
  isSavingPayroll?: boolean;
}

export function EmployeeSheetStatement({
  sheetData,
  isHR = false,
  onSavePayroll,
  isSavingPayroll = false,
}: EmployeeSheetStatementProps) {
  const [isEditingPayroll, setIsEditingPayroll] = useState<boolean>(false);

  const form = useForm({
    defaultValues: {
      overtimeAmount: sheetData.payroll.overtimeAmount,
      bonusAmount: sheetData.payroll.bonusAmount,
      absenceDeduction: sheetData.payroll.absenceDeduction,
      otherDeductions: sheetData.payroll.otherDeductions,
      isPaid: sheetData.payroll.isPaid,
      paymentDate: sheetData.payroll.paymentDate || "",
      remarks: sheetData.payroll.remarks || "",
    },
    onSubmit: async ({ value }) => {
      if (onSavePayroll) {
        await onSavePayroll({
          overtimeAmount: Number(value.overtimeAmount) || 0,
          bonusAmount: Number(value.bonusAmount) || 0,
          absenceDeduction: Number(value.absenceDeduction) || 0,
          otherDeductions: Number(value.otherDeductions) || 0,
          isPaid: Boolean(value.isPaid),
          paymentDate: value.paymentDate || "",
          remarks: value.remarks || "",
        });
      }
      setIsEditingPayroll(false);
    },
  });

  useEffect(() => {
    if (sheetData?.payroll) {
      form.reset({
        overtimeAmount: sheetData.payroll.overtimeAmount,
        bonusAmount: sheetData.payroll.bonusAmount,
        absenceDeduction: sheetData.payroll.absenceDeduction,
        otherDeductions: sheetData.payroll.otherDeductions,
        isPaid: sheetData.payroll.isPaid,
        paymentDate: sheetData.payroll.paymentDate || "",
        remarks: sheetData.payroll.remarks || "",
      });
      setIsEditingPayroll(false);
    }
  }, [sheetData, form]);

  const totalEarnings =
    sheetData.payroll.grossSalary +
    sheetData.payroll.overtimeAmount +
    sheetData.payroll.bonusAmount;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-agm-card border border-agm-box-border shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-agm-text">
              {sheetData.period.monthName} Payroll Statement
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                sheetData.payroll.isPaid
                  ? "bg-agm-green-soft text-agm-green-dark border-agm-green/30"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {sheetData.payroll.isPaid
                ? "Paid / Disbursed"
                : "Pending Disbursement"}
            </span>
          </div>
          <p className="text-xs text-agm-muted mt-0.5">
            {sheetData.employee.firstName} {sheetData.employee.lastName} &bull;{" "}
            <span className="font-mono">{sheetData.employee.employeeCode}</span>{" "}
            &bull; {sheetData.employee.designation || "Staff"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-agm-muted block">
              Net Payable
            </span>
            <span className="font-mono font-black text-xl text-agm-text">
              {formatCurrency(sheetData.payroll.netSalary)}
            </span>
          </div>

          {isHR && onSavePayroll && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditingPayroll(!isEditingPayroll)}
              className="text-xs font-semibold cursor-pointer h-auto py-1.5 px-3"
            >
              <EditIcon size={13} className="text-agm-green" />
              <span>{isEditingPayroll ? "Cancel" : "Edit Figures"}</span>
            </Button>
          )}
        </div>
      </div>

      {isEditingPayroll && isHR && onSavePayroll ? (
        <Card className="p-4 rounded-xl bg-agm-card border border-agm-box-border space-y-3">
          <div className="text-xs font-bold text-agm-text border-b border-agm-box-border pb-2">
            Adjust Earnings &amp; Deductions for {sheetData.period.monthName}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-3 text-xs"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <form.Field name="overtimeAmount">
                {(field) => (
                  <FormInput
                    field={field}
                    label="Overtime Pay (AED)"
                    type="number"
                    className="font-mono"
                  />
                )}
              </form.Field>

              <form.Field name="bonusAmount">
                {(field) => (
                  <FormInput
                    field={field}
                    label="Performance Bonus (AED)"
                    type="number"
                    className="font-mono"
                  />
                )}
              </form.Field>

              <form.Field name="absenceDeduction">
                {(field) => (
                  <FormInput
                    field={field}
                    label="Absence Deduction (AED)"
                    type="number"
                    className="font-mono text-rose-800"
                  />
                )}
              </form.Field>

              <form.Field name="otherDeductions">
                {(field) => (
                  <FormInput
                    field={field}
                    label="Other Deductions (AED)"
                    type="number"
                    className="font-mono text-rose-800"
                  />
                )}
              </form.Field>
            </div>

            <div className="pt-2 border-t border-agm-box-border flex items-center justify-between flex-wrap gap-2">
              <form.Field name="isPaid">
                {(field) => (
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-agm-text">
                    <input
                      type="checkbox"
                      checked={Boolean(field.state.value)}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="w-4 h-4 text-agm-green rounded"
                    />
                    <span>Mark as Disbursed (Paid)</span>
                  </label>
                )}
              </form.Field>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingPayroll(false)}
                  className="cursor-pointer text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingPayroll}
                  className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer flex items-center gap-1.5 text-xs"
                >
                  {isSavingPayroll ? (
                    <SpinnerIcon size={14} className="animate-spin" />
                  ) : (
                    <SaveIcon size={14} />
                  )}
                  <span>Save Figures</span>
                </Button>
              </div>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-3.5 rounded-xl bg-agm-card border border-agm-box-border space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-agm-box-border pb-1.5">
            <span className="font-bold text-agm-text flex items-center gap-1.5">
              <DollarSignIcon size={14} className="text-agm-green" />
              Earnings &amp; Allowances
            </span>
            <span className="font-mono font-bold text-agm-green-dark">
              +{formatCurrency(totalEarnings)}
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between py-0.5 text-agm-muted">
              <span>Basic Salary</span>
              <span className="font-mono font-bold text-agm-text">
                {formatCurrency(sheetData.payroll.basicSalary)}
              </span>
            </div>
            <div className="flex justify-between py-0.5 text-agm-muted">
              <span>Housing Allowance</span>
              <span className="font-mono font-medium text-agm-text">
                {formatCurrency(sheetData.payroll.housingAllowance)}
              </span>
            </div>
            <div className="flex justify-between py-0.5 text-agm-muted">
              <span>Transport Allowance</span>
              <span className="font-mono font-medium text-agm-text">
                {formatCurrency(sheetData.payroll.transportAllowance)}
              </span>
            </div>
            {sheetData.payroll.otherAllowances > 0 && (
              <div className="flex justify-between py-0.5 text-agm-muted">
                <span>Other Allowances</span>
                <span className="font-mono font-medium text-agm-text">
                  {formatCurrency(sheetData.payroll.otherAllowances)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-0.5 text-agm-muted">
              <span>Overtime ({sheetData.payroll.overtimeHours}h @ 1.25x)</span>
              <span className="font-mono font-bold text-agm-green-dark">
                +{formatCurrency(sheetData.payroll.overtimeAmount)}
              </span>
            </div>
            {sheetData.payroll.bonusAmount > 0 && (
              <div className="flex justify-between py-0.5 text-agm-muted">
                <span>Performance Bonus</span>
                <span className="font-mono font-bold text-agm-green-dark">
                  +{formatCurrency(sheetData.payroll.bonusAmount)}
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-3.5 rounded-xl bg-agm-card border border-agm-box-border space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-agm-box-border pb-1.5">
            <span className="font-bold text-agm-text flex items-center gap-1.5">
              <AlertTriangleIcon size={14} className="text-rose-600" />
              Deductions
            </span>
            <span className="font-mono font-bold text-rose-800">
              -{formatCurrency(sheetData.payroll.totalDeductions)}
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between py-0.5 text-agm-muted">
              <span>
                Absence ({sheetData.attendanceSummary.daysAbsent} days)
              </span>
              <span className="font-mono font-bold text-rose-800">
                -{formatCurrency(sheetData.payroll.absenceDeduction)}
              </span>
            </div>
            {sheetData.payroll.otherDeductions > 0 && (
              <div className="flex justify-between py-0.5 text-agm-muted">
                <span>Other Deductions</span>
                <span className="font-mono font-bold text-rose-800">
                  -{formatCurrency(sheetData.payroll.otherDeductions)}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-agm-box-border flex justify-between font-bold text-agm-text">
              <span>Total Deductions</span>
              <span className="font-mono text-rose-800">
                -{formatCurrency(sheetData.payroll.totalDeductions)}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 rounded-xl bg-agm-card border border-agm-box-border space-y-2 text-xs">
          <div className="flex items-center justify-between border-b border-agm-box-border pb-1.5">
            <span className="font-bold text-agm-text flex items-center gap-1.5">
              <WalletIcon size={14} className="text-agm-navy" />
              WPS &amp; Bank Routing
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-agm-green-soft text-agm-green-dark border border-agm-green/30 font-bold">
              WPS Valid
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div>
              <span className="text-[10px] uppercase font-bold text-agm-muted block">
                Bank Name
              </span>
              <span className="font-semibold text-agm-text">
                {sheetData.employee.bankName || "RAK Bank"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-agm-muted block">
                IBAN
              </span>
              <span className="font-mono font-semibold text-agm-text text-[10.5px]">
                {sheetData.employee.iban || "Not Provided"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-agm-muted block">
                Payment Method
              </span>
              <span className="font-medium text-agm-muted">
                {sheetData.employee.paymentMethod.replace("_", " ")}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
