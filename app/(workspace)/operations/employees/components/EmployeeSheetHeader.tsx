"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { Employee } from "@/lib/hooks/api-hooks";
import { Button, Card, Input, Select } from "@/components/ui";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileSpreadsheetIcon,
  PrintIcon,
} from "@/components/icons";
import { MONTH_NAMES } from "@/lib/utils";

interface EmployeeSheetHeaderProps {
  employee: Employee | null;
  selectedMonth: number;
  selectedYear: number;
  monthNames?: readonly string[] | string[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectPeriod?: (month: number, year: number) => void;
  onPrint?: () => void;
  onExportCSV?: () => void;
}

export function EmployeeSheetHeader({
  employee,
  selectedMonth,
  selectedYear,
  monthNames = MONTH_NAMES,
  onPrevMonth,
  onNextMonth,
  onSelectPeriod,
  onPrint,
  onExportCSV,
}: EmployeeSheetHeaderProps) {
  const [isJumpFormOpen, setIsJumpFormOpen] = useState<boolean>(false);

  const jumpForm = useForm({
    defaultValues: {
      jumpMonth: selectedMonth,
      jumpYear: selectedYear,
    },
    onSubmit: ({ value }) => {
      if (onSelectPeriod) {
        onSelectPeriod(Number(value.jumpMonth), Number(value.jumpYear));
      }
      setIsJumpFormOpen(false);
    },
  });

  useEffect(() => {
    jumpForm.reset({
      jumpMonth: selectedMonth,
      jumpYear: selectedYear,
    });
  }, [selectedMonth, selectedYear, jumpForm]);

  return (
    <Card className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-agm-sidebar via-agm-navy to-agm-navy-2 text-white border border-agm-sidebar-border shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-agm-green to-agm-green-2 flex items-center justify-center font-black text-xl text-white shadow-inner shrink-0 ring-2 ring-white/20">
          {employee?.firstName?.[0]}
          {employee?.lastName?.[0]}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-lg text-white truncate">
              {employee?.firstName} {employee?.lastName}
            </h3>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white/10 text-agm-green-soft border border-white/15">
              {employee?.employeeCode}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-agm-green-soft text-agm-green-dark border border-agm-green/20">
              {employee?.employmentStatus?.replace("_", " ")}
            </span>
          </div>
          <p className="text-xs text-agm-ivory flex items-center gap-2 mt-1 truncate">
            <span className="font-medium">
              {employee?.designation || "Staff"}
            </span>
            <span className="text-agm-subtle">&bull;</span>
            <span className="font-medium">
              {employee?.department || "Operations"}
            </span>
            {employee?.iban && (
              <>
                <span className="text-agm-subtle">&bull;</span>
                <span className="font-mono text-agm-green-soft text-[11px]">
                  IBAN: ...{employee.iban.slice(-6)}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
        <div className="relative flex items-center bg-white/10 backdrop-blur-xs rounded-xl p-1 border border-white/15">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onPrevMonth}
            className="p-1.5 text-agm-ivory hover:text-white hover:bg-white/15 cursor-pointer rounded-lg h-auto"
            title="Previous Month"
          >
            <ChevronLeftIcon size={16} />
          </Button>

          <button
            type="button"
            onClick={() => setIsJumpFormOpen((prev) => !prev)}
            className="px-3.5 py-0.5 text-center min-w-[130px] hover:bg-white/10 rounded-lg cursor-pointer transition"
            title="Click to jump to specific month/year"
          >
            <div className="text-xs font-black text-white uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span>{monthNames[selectedMonth - 1]}</span>
              <CalendarIcon size={12} className="text-agm-green-soft" />
            </div>
            <div className="text-[10px] font-mono text-agm-green-soft font-bold">
              {selectedYear}
            </div>
          </button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onNextMonth}
            className="p-1.5 text-agm-ivory hover:text-white hover:bg-white/15 cursor-pointer rounded-lg h-auto"
            title="Next Month"
          >
            <ChevronRightIcon size={16} />
          </Button>

          {isJumpFormOpen && (
            <div className="absolute top-full right-0 sm:left-0 mt-2 z-50 bg-agm-card text-agm-text border border-agm-box-border shadow-xl rounded-xl p-3 w-64 animate-in fade-in zoom-in-95">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  jumpForm.handleSubmit();
                }}
                className="space-y-3"
              >
                <div className="text-xs font-bold text-agm-navy border-b border-agm-box-border pb-1.5 flex items-center justify-between">
                  <span>Jump to Pay Period</span>
                  <button
                    type="button"
                    onClick={() => setIsJumpFormOpen(false)}
                    className="text-agm-muted hover:text-agm-text text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-agm-muted uppercase block mb-1">
                      Month
                    </label>
                    <jumpForm.Field name="jumpMonth">
                      {(field) => (
                        <Select
                          value={field.state.value.toString()}
                          onChange={(e) =>
                            field.handleChange(Number(e.target.value))
                          }
                          className="text-xs py-1"
                          options={monthNames.map((m, idx) => ({
                            value: (idx + 1).toString(),
                            label: m,
                          }))}
                        />
                      )}
                    </jumpForm.Field>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-agm-muted uppercase block mb-1">
                      Year
                    </label>
                    <jumpForm.Field name="jumpYear">
                      {(field) => (
                        <Input
                          type="number"
                          min={2020}
                          max={2035}
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(Number(e.target.value))
                          }
                          className="text-xs py-1 font-mono"
                        />
                      )}
                    </jumpForm.Field>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsJumpFormOpen(false)}
                    className="text-xs py-1 px-2.5 h-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="text-xs py-1 px-3 h-auto"
                  >
                    Apply
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {onPrint && (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPrint}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              title="Print Statement (PDF)"
            >
              <PrintIcon size={14} />
              <span>Print / Export PDF</span>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
