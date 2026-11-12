"use client";

import React, { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  FileText,
  Lock,
  ArrowRight,
  RefreshCw,
  Building2,
  AlertCircle,
  Truck,
} from "lucide-react";
import {
  usePayrollBatch,
  useUpdatePayrollBatchStatus,
} from "@/lib/hooks/hr-hooks";
import { Button } from "@/components/ui";
import { toast } from "@/lib/toast";

export default function PayrollProcessingPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: batch, isLoading, refetch } = usePayrollBatch(selectedMonth, selectedYear);
  const updateStatusMutation = useUpdatePayrollBatchStatus();

  const handleUpdateStatus = async (newStatus: "REVIEWED" | "APPROVED" | "PAID") => {
    try {
      await updateStatusMutation.mutateAsync({
        month: selectedMonth,
        year: selectedYear,
        status: newStatus,
      });

      if (newStatus === "APPROVED") {
        toast.success(`Payroll for ${batch?.monthName} approved! Salary slips generated and GL posted.`);
      } else if (newStatus === "PAID") {
        toast.success(`Payment disbursement recorded for ${batch?.monthName}!`);
      } else {
        toast.success(`Payroll marked as Reviewed`);
      }
      refetch();
    } catch {
      toast.error("Failed to update payroll batch status");
    }
  };

  const status = batch?.status || "DRAFT";
  const items = batch?.items || [];
  const glEntries = batch?.accountingGlEntries || [];

  return (
    <div className="w-full min-h-full p-4 sm:p-6 space-y-4 bg-[#f8fafc] text-slate-800 font-sans">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-700">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Monthly Payroll Processing & GL Journal
              </h1>
              <p className="text-xs text-slate-500">
                WPS monthly calculations, attendance overtime, unpaid leave deductions & double-entry ledger integration
              </p>
            </div>
          </div>
        </div>

        {/* Period Selector & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none font-medium"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2026, i, 1).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-none font-mono font-medium"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>

          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Batch State Lifecycle Bar */}
      <div className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Batch: {batch?.batchNumber || "PAY-202611"}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                status === "PAID"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : status === "APPROVED"
                  ? "bg-blue-100 text-blue-800 border-blue-300"
                  : status === "REVIEWED"
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-slate-100 text-slate-700 border-slate-300"
              }`}
            >
              Status: {status}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {status === "DRAFT" && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatus("REVIEWED")}
              loading={updateStatusMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5 mr-1" />
              Mark as Reviewed
            </Button>
          )}

          {status === "REVIEWED" && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatus("APPROVED")}
              loading={updateStatusMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Approve Payroll & Lock Batch
            </Button>
          )}

          {status === "APPROVED" && (
            <Button
              size="sm"
              onClick={() => handleUpdateStatus("PAID")}
              loading={updateStatusMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Record Payment Disbursement (WPS)
            </Button>
          )}

          {status === "PAID" && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Disbursed to Bank on {batch?.paymentDate || "Recorded"}
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Workforce Count
          </span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{batch?.totalEmployees || 0}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Staff included in batch</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Gross Payroll
          </span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">
            AED {batch?.totalGrossPayroll?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Basic + Allowances + OT</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Overtime Accruals
          </span>
          <p className="text-xl font-bold font-mono text-blue-700 mt-1">
            +AED {batch?.totalOvertimeAmount?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">From daily timesheets</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Net Payroll Payable
          </span>
          <p className="text-xl font-bold font-mono text-emerald-700 mt-1">
            AED {batch?.totalNetPayroll?.toLocaleString() || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Disbursement net of deductions</p>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-700">
          Monthly Calculation Register: {batch?.monthName} {selectedYear}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                <th className="px-3.5 py-3">Employee</th>
                <th className="px-3 py-3">Role & Dept</th>
                <th className="px-3 py-3 text-right">Basic</th>
                <th className="px-3 py-3 text-right">Allowances</th>
                <th className="px-3 py-3 text-right">OT Pay</th>
                <th className="px-3 py-3 text-right">Gross</th>
                <th className="px-3 py-3 text-right">Deductions</th>
                <th className="px-3 py-3 text-right">Net Payable</th>
                <th className="px-3 py-3">Payment Info</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Computing monthly payroll...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No records found
                  </td>
                </tr>
              ) : (
                items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3.5 py-2.5">
                      <div className="font-semibold text-slate-900">{item.employeeName}</div>
                      <div className="font-mono text-[10.5px] text-slate-500">{item.employeeCode}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-slate-800 font-medium">{item.designation}</div>
                      <div className="text-[10.5px] text-slate-500">{item.department}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-900">
                      AED {item.basicSalary.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                      AED {(item.housingAllowance + item.transportAllowance + item.otherAllowances).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-blue-700">
                      {item.overtimeAmount > 0 ? `+AED ${item.overtimeAmount.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                      AED {item.grossSalary.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-rose-600">
                      {item.totalDeductions > 0 ? `-AED ${item.totalDeductions.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-800 text-[13px]">
                      AED {item.netSalary.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">
                      {item.iban ? item.iban.slice(-8) : "Cash/WPS"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Double-Entry General Ledger Journal Entry Breakdown Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Finance General Ledger Posting Breakdown (Double-Entry Equilibrium)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Source: Payroll Engine &bull; GL 5101–5104
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
                <th className="px-3 py-2">GL Account Code</th>
                <th className="px-3 py-2">Account Title</th>
                <th className="px-3 py-2 text-right">Debit (AED)</th>
                <th className="px-3 py-2 text-right">Credit (AED)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {glEntries.map((gl: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2 font-bold text-slate-900">{gl.accountCode}</td>
                  <td className="px-3 py-2 font-sans text-slate-800">{gl.accountName}</td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">
                    {gl.debit > 0 ? `AED ${gl.debit.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900">
                    {gl.credit > 0 ? `AED ${gl.credit.toLocaleString()}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50/70 border-t-2 border-blue-200 font-bold text-blue-900 font-mono text-xs">
                <td colSpan={2} className="px-3 py-2 font-sans uppercase">
                  Total Ledger Equilibrium (Dr = Cr)
                </td>
                <td className="px-3 py-2 text-right">
                  AED {batch?.totalGrossPayroll?.toLocaleString() || 0}
                </td>
                <td className="px-3 py-2 text-right">
                  AED {batch?.totalGrossPayroll?.toLocaleString() || 0}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
