"use client";

import React from "react";
import {
  EmployeeMonthlySheetData,
  MonthlySheetDailyRecord,
} from "@/lib/hooks/api-hooks";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  DashboardCard,
  DashboardCardGrid,
} from "@/components/ui";
import { GridIcon } from "@/components/icons";
import { CalendarSlot, WEEKDAY_SHORT_NAMES } from "@/lib/utils";

interface EmployeeSheetHeatmapProps {
  sheetData: EmployeeMonthlySheetData;
  calendarGrid: CalendarSlot[];
  selectedDayNumber: number;
  onSelectDay: (dayNumber: number) => void;
  selectedDayRecord: MonthlySheetDailyRecord | null;
  onSwitchToRoster: () => void;
}

export function EmployeeSheetHeatmap({
  sheetData,
  calendarGrid,
  selectedDayNumber,
  onSelectDay,
  selectedDayRecord,
  onSwitchToRoster,
}: EmployeeSheetHeatmapProps) {
  return (
    <div className="space-y-3.5">
      <DashboardCardGrid cols={5} className="!gap-2">
        <DashboardCard
          title="Present"
          value={`${sheetData.attendanceSummary.daysPresent}d`}
          subtitle={`of ${sheetData.attendanceSummary.totalDays} days`}
          variant="emerald"
        />
        <DashboardCard
          title="Absent"
          value={`${sheetData.attendanceSummary.daysAbsent}d`}
          subtitle="Deductions applied"
          variant={
            sheetData.attendanceSummary.daysAbsent > 0 ? "rose" : "default"
          }
        />
        <DashboardCard
          title="Overtime"
          value={`${sheetData.attendanceSummary.totalOvertimeHours}h`}
          subtitle="1.25x premium"
          variant="emerald"
        />
        <DashboardCard
          title="Late Count"
          value={sheetData.attendanceSummary.daysLate}
          subtitle={`${sheetData.attendanceSummary.totalLateMinutes}m total`}
          variant={
            sheetData.attendanceSummary.daysLate > 0 ? "amber" : "default"
          }
        />
        <DashboardCard
          title="Attendance"
          value={`${sheetData.attendanceSummary.attendanceRate}%`}
          subtitle="Punctuality index"
          variant="default"
        />
      </DashboardCardGrid>

      <Card className="rounded-2xl border border-agm-box-border shadow-2xs">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-agm-box-border">
          <div>
            <CardTitle className="text-xs uppercase tracking-wider text-agm-text font-bold flex items-center gap-1.5">
              <GridIcon size={14} className="text-agm-green" />
              <span>31-Day Attendance Heatmap Matrix</span>
            </CardTitle>
            <CardDescription className="text-[10.5px] text-agm-muted">
              Click any day tile to inspect punch timestamps and logs
            </CardDescription>
          </div>
          <div className="hidden sm:flex items-center gap-2.5 text-[10px] text-agm-muted font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-agm-green" />
              Present
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              Late
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              Absent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-agm-subtle" />
              Weekend
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-3.5 space-y-2.5">
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10.5px] font-bold text-agm-muted uppercase tracking-wider border-b border-agm-box-border pb-1">
            {WEEKDAY_SHORT_NAMES.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarGrid.map((item) => {
              if (item.isPadding || !item.record) {
                return (
                  <div
                    key={item.key}
                    className="h-16 rounded-xl bg-agm-box-bg/30 border border-transparent opacity-30"
                  />
                );
              }

              const rec = item.record;
              const isSelected = rec.dayNumber === selectedDayNumber;

              let bgStyle = "bg-agm-card hover:bg-agm-box-bg";
              let dotColor = "bg-agm-green";
              let label = "Present";

              if (rec.status === "PRESENT") {
                bgStyle =
                  "bg-agm-green-soft/50 hover:bg-agm-green-soft border-agm-green/20";
                dotColor = "bg-agm-green";
                label = "Present";
              } else if (rec.status === "LATE") {
                bgStyle = "bg-amber-50 hover:bg-amber-100/60 border-amber-200";
                dotColor = "bg-amber-600";
                label = `+${rec.lateMinutes}m`;
              } else if (rec.status === "ABSENT") {
                bgStyle = "bg-rose-50 hover:bg-rose-100/70 border-rose-200";
                dotColor = "bg-rose-600";
                label = "Absent";
              } else if (rec.status === "ON_LEAVE") {
                bgStyle =
                  "bg-purple-50 hover:bg-purple-100/60 border-purple-200";
                dotColor = "bg-purple-600";
                label = "Leave";
              } else if (rec.isWeekend) {
                bgStyle =
                  "bg-agm-box-bg/70 hover:bg-agm-box-bg text-agm-muted border-agm-box-border";
                dotColor = "bg-agm-subtle";
                label = "Rest";
              }

              return (
                <button
                  key={rec.date}
                  type="button"
                  onClick={() => onSelectDay(rec.dayNumber)}
                  className={`h-16 p-1.5 rounded-xl border flex flex-col justify-between text-left transition cursor-pointer relative ${bgStyle} ${
                    isSelected
                      ? "ring-2 ring-agm-navy shadow-sm border-agm-navy"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isSelected
                          ? "text-agm-navy font-black"
                          : "text-agm-text"
                      }`}
                    >
                      {rec.dayNumber}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  </div>

                  <div className="space-y-0.5 overflow-hidden">
                    {rec.checkInTime ? (
                      <span className="text-[9.5px] font-mono text-agm-text font-semibold block truncate">
                        {new Date(rec.checkInTime).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-medium text-agm-muted block truncate">
                        {label}
                      </span>
                    )}

                    {rec.overtimeHours > 0 && (
                      <span className="inline-block text-[9px] font-mono font-bold px-1 rounded bg-agm-green text-white">
                        +{rec.overtimeHours}h
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDayRecord && (
        <Card className="rounded-2xl border border-agm-box-border shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between py-2.5 border-b border-agm-box-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-agm-sidebar text-white flex items-center justify-center font-mono font-bold text-sm">
                {selectedDayRecord.dayNumber}
              </div>
              <div>
                <CardTitle className="text-xs font-bold text-agm-text">
                  {selectedDayRecord.dayName},{" "}
                  {new Date(selectedDayRecord.date).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  )}
                </CardTitle>
                <CardDescription className="text-[10.5px] text-agm-muted">
                  Daily Biometric Punch & Activity Record
                </CardDescription>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                selectedDayRecord.status === "PRESENT"
                  ? "bg-agm-green-soft text-agm-green-dark border-agm-green/25"
                  : selectedDayRecord.status === "ABSENT"
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : selectedDayRecord.status === "LATE"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-agm-box-bg text-agm-muted border-agm-box-border"
              }`}
            >
              {selectedDayRecord.status.replace("_", " ")}
            </span>
          </CardHeader>

          <CardContent className="p-3.5 space-y-2.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-agm-box-bg/70 border border-agm-box-border">
                <span className="text-[10px] font-bold text-agm-muted block uppercase">
                  Check In Time
                </span>
                <span className="font-mono font-bold text-agm-text text-sm">
                  {selectedDayRecord.checkInTime
                    ? new Date(
                        selectedDayRecord.checkInTime,
                      ).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-agm-box-bg/70 border border-agm-box-border">
                <span className="text-[10px] font-bold text-agm-muted block uppercase">
                  Check Out Time
                </span>
                <span className="font-mono font-bold text-agm-text text-sm">
                  {selectedDayRecord.checkOutTime
                    ? new Date(
                        selectedDayRecord.checkOutTime,
                      ).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-agm-box-bg/70 border border-agm-box-border">
                <span className="text-[10px] font-bold text-agm-muted block uppercase">
                  Working Hours
                </span>
                <span className="font-mono font-bold text-agm-navy text-sm">
                  {selectedDayRecord.workingHours > 0
                    ? `${selectedDayRecord.workingHours} hrs`
                    : "0 hrs"}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-agm-box-bg/70 border border-agm-box-border">
                <span className="text-[10px] font-bold text-agm-muted block uppercase">
                  Overtime Hours
                </span>
                <span className="font-mono font-bold text-agm-green text-sm">
                  {selectedDayRecord.overtimeHours > 0
                    ? `+${selectedDayRecord.overtimeHours} hrs`
                    : "0 hrs"}
                </span>
              </div>
            </div>

            {selectedDayRecord.notes && (
              <div className="text-[11px] text-agm-muted bg-agm-box-bg p-2 rounded-xl border border-agm-box-border italic">
                Remarks: &ldquo;{selectedDayRecord.notes}&rdquo;
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-agm-muted">
                Need line-by-line tabular review?
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onSwitchToRoster}
                className="text-xs font-bold text-agm-green hover:underline cursor-pointer flex items-center gap-1 h-auto p-0"
              >
                <span>Switch to Full Timecard Roster &rarr;</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
