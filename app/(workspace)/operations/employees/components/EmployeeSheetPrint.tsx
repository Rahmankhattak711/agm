"use client";

import React from "react";
import { EmployeeMonthlySheetData } from "@/lib/hooks/api-hooks";
import { QuotationHeader } from "@/components/quotation/QuotationHeader";
import { QuotationFooter } from "@/components/quotation/QuotationFooter";
import { formatCurrency } from "@/lib/utils/format";
import { numberToWordsAED } from "@/components/documents/salary-certificate-constants";

interface EmployeeSheetPrintProps {
  sheetData: EmployeeMonthlySheetData;
  selectedMonth: number;
  selectedYear: number;
}

export function EmployeeSheetPrint({
  sheetData,
  selectedMonth,
  selectedYear,
}: EmployeeSheetPrintProps) {
  return (
    <div className="hidden print:block font-sans text-agm-text bg-agm-card p-6 space-y-6">
      <QuotationHeader />

      <div className="text-center border-b-2 border-agm-navy pb-3 pt-2">
        <h1 className="text-xl font-black uppercase tracking-wider text-agm-navy">
          Monthly Attendance Timesheet &amp; WPS Salary Slip
        </h1>
        <p className="text-xs font-bold text-agm-muted uppercase tracking-widest mt-0.5">
          Pay Period: {sheetData.period.monthName} {selectedYear} (01/
          {String(selectedMonth).padStart(2, "0")}/{selectedYear} —{" "}
          {sheetData.period.totalDaysInMonth}/
          {String(selectedMonth).padStart(2, "0")}/{selectedYear})
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 border border-agm-box-border p-4 text-xs bg-agm-card">
        <div className="space-y-1">
          <div>
            <span className="font-bold text-agm-muted">Employee Name: </span>
            <span className="font-black text-agm-text text-sm">
              {sheetData.employee.firstName} {sheetData.employee.lastName}
            </span>
          </div>
          <div>
            <span className="font-bold text-agm-muted">Employee Code: </span>
            <span className="font-mono font-bold text-agm-green">
              {sheetData.employee.employeeCode}
            </span>
          </div>
          <div>
            <span className="font-bold text-agm-muted">Designation: </span>
            <span className="font-semibold">
              {sheetData.employee.designation}
            </span>
          </div>
          <div>
            <span className="font-bold text-agm-muted">Department: </span>
            <span>{sheetData.employee.department}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div>
            <span className="font-bold text-agm-muted">Emirates ID: </span>
            <span className="font-mono font-bold">
              {sheetData.employee.emiratesId || "N/A"}
            </span>
          </div>
          <div>
            <span className="font-bold text-agm-muted">Payment Method: </span>
            <span>{sheetData.employee.paymentMethod.replace("_", " ")}</span>
          </div>
          <div>
            <span className="font-bold text-agm-muted">
              WPS Bank &amp; IBAN:{" "}
            </span>
            <span className="font-mono">
              {sheetData.employee.bankName || "RAK Bank"} -{" "}
              {sheetData.employee.iban || "N/A"}
            </span>
          </div>
          <div>
            <span className="font-bold text-agm-muted">Status: </span>
            <span className="font-bold text-agm-green">
              {sheetData.payroll.isPaid ? "PAID" : "UNPAID"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 border border-agm-box-border text-center text-xs divide-x divide-agm-box-border bg-agm-box-bg py-2">
        <div>
          <span className="text-[10px] text-agm-muted uppercase block font-bold">
            Calendar Days
          </span>
          <span className="font-bold text-sm text-agm-text">
            {sheetData.attendanceSummary.totalDays}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-agm-muted uppercase block font-bold">
            Days Present
          </span>
          <span className="font-bold text-sm text-agm-green">
            {sheetData.attendanceSummary.daysPresent}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-agm-muted uppercase block font-bold">
            Days Absent
          </span>
          <span className="font-bold text-sm text-rose-800">
            {sheetData.attendanceSummary.daysAbsent}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-agm-muted uppercase block font-bold">
            Overtime Hours
          </span>
          <span className="font-bold text-sm text-agm-green">
            {sheetData.attendanceSummary.totalOvertimeHours}h
          </span>
        </div>
        <div>
          <span className="text-[10px] text-agm-muted uppercase block font-bold">
            Attendance %
          </span>
          <span className="font-bold text-sm text-agm-text">
            {sheetData.attendanceSummary.attendanceRate}%
          </span>
        </div>
      </div>

      <div className="border border-agm-box-border">
        <div className="grid grid-cols-2 divide-x divide-agm-box-border text-xs">
          <div>
            <div className="bg-agm-box-bg font-bold p-2 text-agm-text uppercase tracking-wider border-b border-agm-box-border">
              Earnings (AED)
            </div>
            <div className="p-3 space-y-2">
              <div className="flex justify-between">
                <span>Basic Salary</span>
                <span className="font-mono font-bold">
                  {formatCurrency(sheetData.payroll.basicSalary)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Housing Allowance</span>
                <span className="font-mono">
                  {formatCurrency(sheetData.payroll.housingAllowance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Transport Allowance</span>
                <span className="font-mono">
                  {formatCurrency(sheetData.payroll.transportAllowance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Other Allowances</span>
                <span className="font-mono">
                  {formatCurrency(sheetData.payroll.otherAllowances)}
                </span>
              </div>
              <div className="flex justify-between border-t border-agm-box-border pt-1">
                <span>
                  Overtime Pay ({sheetData.payroll.overtimeHours}h @ 1.25x)
                </span>
                <span className="font-mono font-bold text-agm-green">
                  +{formatCurrency(sheetData.payroll.overtimeAmount)}
                </span>
              </div>
              {sheetData.payroll.bonusAmount > 0 && (
                <div className="flex justify-between">
                  <span>Performance / Discretionary Bonus</span>
                  <span className="font-mono font-bold text-agm-green">
                    +{formatCurrency(sheetData.payroll.bonusAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t-2 border-agm-box-border pt-2 text-agm-green">
                <span>Total Gross Earnings</span>
                <span className="font-mono">
                  {formatCurrency(
                    sheetData.payroll.grossSalary +
                      sheetData.payroll.overtimeAmount +
                      sheetData.payroll.bonusAmount,
                  )}
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-agm-box-bg font-bold p-2 text-agm-text uppercase tracking-wider border-b border-agm-box-border">
              Deductions (AED)
            </div>
            <div className="p-3 space-y-2">
              <div className="flex justify-between">
                <span>
                  Absence Deduction ({sheetData.attendanceSummary.daysAbsent}{" "}
                  days)
                </span>
                <span className="font-mono text-rose-800">
                  -{formatCurrency(sheetData.payroll.absenceDeduction)}
                </span>
              </div>
              {sheetData.payroll.otherDeductions > 0 && (
                <div className="flex justify-between">
                  <span>Other Deductions / Advance</span>
                  <span className="font-mono text-rose-800">
                    -{formatCurrency(sheetData.payroll.otherDeductions)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t-2 border-agm-box-border pt-2 text-rose-900">
                <span>Total Deductions</span>
                <span className="font-mono">
                  -{formatCurrency(sheetData.payroll.totalDeductions)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-agm-sidebar text-white p-3 flex justify-between items-center text-sm font-bold">
          <div>
            <span>NET SALARY PAYABLE: </span>
            <span className="text-agm-green-soft text-base font-mono ml-2 font-black">
              {formatCurrency(sheetData.payroll.netSalary)}
            </span>
          </div>
          <div className="text-xs text-agm-subtle italic font-normal">
            "{numberToWordsAED(sheetData.payroll.netSalary)}"
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 pt-12 text-center text-xs">
        <div className="border-t border-agm-box-border pt-2">
          <span className="font-bold text-agm-text block">
            Employee Signature
          </span>
          <span className="text-[10px] text-agm-muted">
            Acknowledged receipt of salary
          </span>
        </div>
        <div className="border-t border-agm-box-border pt-2">
          <span className="font-bold text-agm-text block">
            HR / Operations Manager
          </span>
          <span className="text-[10px] text-agm-muted">
            Attendance &amp; Leave Verified
          </span>
        </div>
        <div className="border-t border-agm-box-border pt-2">
          <span className="font-bold text-agm-text block">
            Finance &amp; Accounts
          </span>
          <span className="text-[10px] text-agm-muted">
            Authorized WPS Signatory
          </span>
        </div>
      </div>

      <QuotationFooter />
    </div>
  );
}
