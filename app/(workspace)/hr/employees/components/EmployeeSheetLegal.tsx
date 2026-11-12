"use client";

import React from "react";
import { EmployeeMonthlySheetData } from "@/lib/hooks/api-hooks";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  DashboardCardGrid,
} from "@/components/ui";
import { BriefcaseIcon } from "@/components/icons";

interface EmployeeSheetLegalProps {
  sheetData: EmployeeMonthlySheetData;
  selectedYear: number;
}

export function EmployeeSheetLegal({
  sheetData,
  selectedYear,
}: EmployeeSheetLegalProps) {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <DashboardCardGrid cols={3}>
        <Card className="rounded-2xl border border-agm-box-border shadow-2xs">
          <CardHeader className="p-4 border-b border-agm-box-border">
            <span className="text-[11px] font-bold text-agm-muted uppercase block">
              Emirates ID (UAE)
            </span>
            <CardTitle className="font-mono text-sm font-bold text-agm-text">
              {sheetData.employee.emiratesId || "Not on file"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {sheetData.employee.emiratesIdExpiry ? (
              <span className="text-[11px] text-agm-muted block">
                Expires:{" "}
                {new Date(
                  sheetData.employee.emiratesIdExpiry,
                ).toLocaleDateString("en-GB")}
              </span>
            ) : (
              <span className="text-[11px] text-agm-muted block">
                No expiry recorded
              </span>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-agm-box-border shadow-2xs">
          <CardHeader className="p-4 border-b border-agm-box-border">
            <span className="text-[11px] font-bold text-agm-muted uppercase block">
              UAE Residence Visa
            </span>
            <CardTitle className="font-mono text-sm font-bold text-agm-text">
              {sheetData.employee.visaNumber || "Not on file"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {sheetData.employee.visaExpiry ? (
              <span className="text-[11px] text-amber-800 font-semibold block">
                Expires:{" "}
                {new Date(sheetData.employee.visaExpiry).toLocaleDateString(
                  "en-GB",
                )}
              </span>
            ) : (
              <span className="text-[11px] text-agm-muted block">
                No expiry recorded
              </span>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-agm-green/30 bg-agm-green-soft shadow-2xs">
          <CardHeader className="p-4 border-b border-agm-green/20">
            <span className="text-[11px] font-bold text-agm-green-dark uppercase block">
              Annual Leave Balance
            </span>
            <CardTitle className="font-mono text-xl font-black text-agm-green-dark">
              {sheetData.employee.annualLeaveBalance} Days
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <span className="text-[10.5px] text-agm-green-2 block">
              Standard 30 calendar days per annum
            </span>
          </CardContent>
        </Card>
      </DashboardCardGrid>

      <Card className="rounded-2xl border border-agm-box-border shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-agm-box-border">
          <CardTitle className="text-xs font-bold text-agm-text flex items-center gap-1.5 uppercase tracking-wider">
            <BriefcaseIcon size={14} className="text-agm-navy" />
            <span>
              Leaves Incurred in {sheetData.period.monthName} {selectedYear}
            </span>
          </CardTitle>
          <span className="text-xs font-mono font-bold text-agm-muted">
            {sheetData.leaves?.length || 0} Records
          </span>
        </CardHeader>

        <CardContent className="p-4">
          {sheetData.leaves && sheetData.leaves.length > 0 ? (
            <div className="space-y-2">
              {sheetData.leaves.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-agm-box-bg border border-agm-box-border text-xs"
                >
                  <div>
                    <span className="font-bold text-agm-text">
                      {l.leaveType} Leave
                    </span>
                    <span className="text-agm-muted text-[11px] ml-2 font-mono">
                      {new Date(l.startDate).toLocaleDateString("en-GB")} to{" "}
                      {new Date(l.endDate).toLocaleDateString("en-GB")}
                    </span>
                    {l.reason && (
                      <p className="text-[11px] text-agm-muted mt-0.5">
                        Reason: {l.reason}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-bold font-mono text-agm-navy block">
                      {l.totalDays} Days
                    </span>
                    <span className="text-[10px] uppercase font-bold text-agm-green">
                      {l.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-agm-muted py-8 text-center italic">
              No leaves recorded for this employee in{" "}
              {sheetData.period.monthName} {selectedYear}.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
