"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useForm } from "@tanstack/react-form";
import {
  useWorkforceMonthlySheet,
  WorkforceMonthlySheetItem,
} from "@/lib/hooks/api-hooks";
import {
  Button,
  Modal,
  Input,
  Select,
  Card,
  DashboardCard,
  DashboardCardGrid,
} from "@/components/ui";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileSpreadsheetIcon,
  PrintIcon,
  SearchIcon,
  SpinnerIcon,
} from "@/components/icons";
import {
  formatCurrency,
  MONTH_NAMES,
  getPrevPeriod,
  getNextPeriod,
  exportWorkforceWpsCsv,
} from "@/lib/utils";
import { QuotationHeader } from "@/components/quotation/QuotationHeader";
import { QuotationFooter } from "@/components/quotation/QuotationFooter";

interface WorkforceMonthlySheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmployee: (empId: string) => void;
  initialMonth?: number;
  initialYear?: number;
}

export function WorkforceMonthlySheetModal({
  isOpen,
  onClose,
  onSelectEmployee,
  initialMonth,
  initialYear,
}: WorkforceMonthlySheetModalProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(
    initialMonth || currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    initialYear || currentDate.getFullYear(),
  );

  const [sorting, setSorting] = useState<SortingState>([
    { id: "employeeCode", desc: false },
  ]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [isJumpFormOpen, setIsJumpFormOpen] = useState<boolean>(false);

  const {
    data: workforceData,
    isLoading,
    error,
  } = useWorkforceMonthlySheet({
    month: selectedMonth,
    year: selectedYear,
  });

  const jumpForm = useForm({
    defaultValues: {
      jumpMonth: selectedMonth,
      jumpYear: selectedYear,
    },
    onSubmit: ({ value }) => {
      setSelectedMonth(Number(value.jumpMonth));
      setSelectedYear(Number(value.jumpYear));
      setIsJumpFormOpen(false);
    },
  });

  useEffect(() => {
    jumpForm.reset({
      jumpMonth: selectedMonth,
      jumpYear: selectedYear,
    });
  }, [selectedMonth, selectedYear, jumpForm]);

  const handlePrevMonth = () => {
    const { month, year } = getPrevPeriod(selectedMonth, selectedYear);
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const handleNextMonth = () => {
    const { month, year } = getNextPeriod(selectedMonth, selectedYear);
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const departments = useMemo(() => {
    if (!workforceData?.employeeSheets) return [];
    return Array.from(
      new Set(
        workforceData.employeeSheets.map((e) => e.department).filter(Boolean),
      ),
    );
  }, [workforceData?.employeeSheets]);

  const tableData = useMemo(() => {
    if (!workforceData?.employeeSheets) return [];
    if (departmentFilter === "ALL") return workforceData.employeeSheets;
    return workforceData.employeeSheets.filter(
      (e) => e.department === departmentFilter,
    );
  }, [workforceData?.employeeSheets, departmentFilter]);

  const columns = useMemo<ColumnDef<WorkforceMonthlySheetItem>[]>(
    () => [
      {
        accessorKey: "employeeCode",
        header: "Emp ID",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-agm-green text-[11px]">
            {row.original.employeeCode}
          </span>
        ),
      },
      {
        id: "name",
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        header: "Employee Name",
        enableSorting: true,
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-agm-text">
              {row.original.firstName} {row.original.lastName}
            </div>
            <div className="text-[10px] text-agm-muted">
              {row.original.designation}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "department",
        header: "Department",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-agm-box-bg text-agm-text border border-agm-box-border inline-block">
            {row.original.department}
          </span>
        ),
      },
      {
        accessorKey: "daysPresent",
        header: () => <div className="text-center">Present</div>,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-center font-bold text-agm-green">
            {row.original.daysPresent}d
          </div>
        ),
      },
      {
        accessorKey: "daysAbsent",
        header: () => <div className="text-center">Absent</div>,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-center font-bold text-rose-700">
            {row.original.daysAbsent > 0 ? `${row.original.daysAbsent}d` : "0"}
          </div>
        ),
      },
      {
        accessorKey: "overtimeHours",
        header: () => <div className="text-right">OT Hours</div>,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-right font-mono font-bold text-agm-green">
            {row.original.overtimeHours > 0
              ? `+${row.original.overtimeHours}h`
              : "—"}
          </div>
        ),
      },
      {
        accessorKey: "grossSalary",
        header: () => <div className="text-right">Gross (AED)</div>,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-right font-mono text-agm-text">
            {formatCurrency(row.original.grossSalary)}
          </div>
        ),
      },
      {
        accessorKey: "overtimeAmount",
        header: () => <div className="text-right">OT Pay</div>,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-right font-mono text-agm-green font-semibold">
            {row.original.overtimeAmount > 0
              ? `+${formatCurrency(row.original.overtimeAmount)}`
              : "—"}
          </div>
        ),
      },
      {
        accessorKey: "deductions",
        header: () => <div className="text-right">Deductions</div>,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-right font-mono text-rose-700">
            {row.original.deductions > 0
              ? `-${formatCurrency(row.original.deductions)}`
              : "—"}
          </div>
        ),
      },
      {
        accessorKey: "netSalary",
        header: () => <div className="text-right">Net Salary (AED)</div>,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-right font-mono font-black text-agm-text">
            {formatCurrency(row.original.netSalary)}
          </div>
        ),
      },
      {
        accessorKey: "isPaid",
        header: () => <div className="text-center">Status</div>,
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-center">
            <span
              className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                row.original.isPaid
                  ? "bg-agm-green-soft text-agm-green-dark border-agm-green/30"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              {row.original.isPaid ? "PAID" : "UNPAID"}
            </span>
          </div>
        ),
      },
      {
        id: "action",
        header: () => <div className="text-center">Action</div>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onClose();
                onSelectEmployee(row.original.id);
              }}
              className="text-xs text-agm-green hover:text-agm-green-2 hover:bg-agm-green-soft font-bold px-2.5 py-1 rounded cursor-pointer"
            >
              View Sheet
            </Button>
          </div>
        ),
      },
    ],
    [onClose, onSelectEmployee],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  const handleExportWPS = () => {
    const rowsToExport = table
      .getFilteredRowModel()
      .rows.map((r) => r.original);
    if (!rowsToExport.length || !workforceData) return;
    exportWorkforceWpsCsv(
      rowsToExport,
      workforceData.period.monthName,
      selectedYear,
    );
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const filteredRows = table.getFilteredRowModel().rows;
  const totalFilteredGross = filteredRows.reduce(
    (sum, r) => sum + r.original.grossSalary,
    0,
  );
  const totalFilteredOT = filteredRows.reduce(
    (sum, r) => sum + r.original.overtimeAmount,
    0,
  );
  const totalFilteredDeductions = filteredRows.reduce(
    (sum, r) => sum + r.original.deductions,
    0,
  );
  const totalFilteredNet = filteredRows.reduce(
    (sum, r) => sum + r.original.netSalary,
    0,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="7xl"
      closeOnOutsideClick={false}
    >
      <div className="print:hidden space-y-5 -mt-3 text-agm-text">
        <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-agm-sidebar via-agm-navy to-agm-navy-2 text-white border border-agm-sidebar-border shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-agm-green to-agm-green-2 flex items-center justify-center font-bold text-white shadow-inner shrink-0 ring-1 ring-white/20">
              <FileSpreadsheetIcon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Workforce Monthly Timesheet &amp; WPS Summary
              </h3>
              <p className="text-xs text-agm-ivory mt-0.5">
                Consolidated monthly attendance, overtime hours, deductions, and
                net WPS salaries for all staff.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end flex-wrap">
            <div className="relative flex items-center bg-white/10 backdrop-blur-xs rounded-xl p-1 border border-white/15">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white/15 rounded-lg text-agm-ivory hover:text-white transition cursor-pointer h-auto"
                title="Previous Month"
              >
                <ChevronLeftIcon size={16} />
              </Button>
              <button
                type="button"
                onClick={() => setIsJumpFormOpen((prev) => !prev)}
                className="px-3 py-0.5 text-center min-w-[130px] hover:bg-white/10 rounded-lg cursor-pointer transition"
                title="Click to jump to specific month/year"
              >
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-center gap-1">
                  <span>{MONTH_NAMES[selectedMonth - 1]}</span>
                  <CalendarIcon size={12} className="text-agm-green-soft" />
                </div>
                <div className="text-[10px] font-mono text-agm-green-soft font-semibold">
                  {selectedYear}
                </div>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white/15 rounded-lg text-agm-ivory hover:text-white transition cursor-pointer h-auto"
                title="Next Month"
              >
                <ChevronRightIcon size={16} />
              </Button>

              {isJumpFormOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-agm-card text-agm-text border border-agm-box-border shadow-xl rounded-xl p-3 w-64 animate-in fade-in zoom-in-95">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      jumpForm.handleSubmit();
                    }}
                    className="space-y-3"
                  >
                    <div className="text-xs font-bold text-agm-navy border-b border-agm-box-border pb-1.5 flex items-center justify-between">
                      <span>Jump to Period</span>
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
                              options={MONTH_NAMES.map((m, idx) => ({
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

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
            >
              <PrintIcon size={14} />
              <span className="hidden md:inline">Print Sheet</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportWPS}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
            >
              <FileSpreadsheetIcon size={14} />
              <span className="hidden md:inline">WPS Export</span>
            </Button>
          </div>
        </Card>

        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-agm-muted">
            <SpinnerIcon size={28} className="animate-spin text-agm-green" />
            <span className="text-xs font-medium text-agm-text">
              Calculating monthly workforce timesheet &amp; payroll...
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">
            Failed to load workforce summary: {(error as any).message}
          </div>
        )}

        {!isLoading && workforceData && (
          <>
            <DashboardCardGrid cols={4}>
              <DashboardCard
                title="Active Personnel"
                value={workforceData.workforceStats.totalEmployees}
                subtitle="Personnel on payroll"
                variant="default"
              />
              <DashboardCard
                title="Workforce Gross"
                value={formatCurrency(
                  workforceData.workforceStats.totalWorkforceGross,
                )}
                subtitle="Basic + allowances"
                variant="default"
              />
              <DashboardCard
                title="Total Overtime Pay"
                value={formatCurrency(
                  workforceData.workforceStats.totalOvertimeAmount,
                )}
                subtitle={`${workforceData.workforceStats.totalOvertimeHours}h OT logged`}
                variant="success"
              />
              <DashboardCard
                title="Net Payroll Liability"
                value={formatCurrency(
                  workforceData.workforceStats.totalNetPayroll,
                )}
                subtitle="Total net payable (WPS)"
                variant="default"
              />
            </DashboardCardGrid>

            <Card className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-agm-card rounded-xl border border-agm-box-border shadow-2xs">
              <div className="relative w-full sm:w-80">
                <SearchIcon
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-agm-muted"
                />
                <Input
                  type="text"
                  placeholder="Filter by name, code, designation..."
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9 py-1.5 text-xs shadow-none border-agm-box-border bg-agm-box-bg/50 focus:border-agm-green"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="w-full sm:w-48">
                  <Select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="py-1.5 text-xs shadow-none border-agm-box-border bg-agm-box-bg/50"
                    options={[
                      { value: "ALL", label: "All Departments" },
                      ...departments.map((d) => ({
                        value: d,
                        label: d,
                      })),
                    ]}
                  />
                </div>
                <div className="text-xs font-semibold text-agm-muted whitespace-nowrap">
                  {table.getFilteredRowModel().rows.length} Personnel
                </div>
              </div>
            </Card>

            <Card className="border border-agm-box-border rounded-xl overflow-hidden bg-agm-card shadow-2xs">
              <div className="max-h-[460px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-agm-box-bg text-agm-muted uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 border-b border-agm-box-border">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          const canSort = header.column.getCanSort();
                          const isSorted = header.column.getIsSorted();

                          return (
                            <th
                              key={header.id}
                              className={`py-2.5 px-3 select-none ${
                                canSort
                                  ? "cursor-pointer hover:text-agm-text transition-colors"
                                  : ""
                              }`}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              <div className="flex items-center gap-1.5">
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
                                    )}
                                {canSort && (
                                  <span className="text-[10px] text-agm-muted">
                                    {isSorted === "asc"
                                      ? "▲"
                                      : isSorted === "desc"
                                        ? "▼"
                                        : "⇅"}
                                  </span>
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-agm-box-border">
                    {table.getRowModel().rows.length > 0 ? (
                      table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-agm-box-bg/60 transition-colors"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="py-2 px-3">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="py-12 text-center text-agm-muted text-xs font-semibold"
                        >
                          No workforce records matching criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {filteredRows.length > 0 && (
                    <tfoot className="bg-agm-box-bg border-t-2 border-agm-box-border font-bold text-xs sticky bottom-0 z-10">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3 text-agm-text">
                          Filtered Total ({filteredRows.length} Staff)
                        </td>
                        <td className="py-2.5 px-3 text-center text-agm-green">
                          {filteredRows.reduce(
                            (sum, r) => sum + r.original.daysPresent,
                            0,
                          )}
                          d
                        </td>
                        <td className="py-2.5 px-3 text-center text-rose-700">
                          {filteredRows.reduce(
                            (sum, r) => sum + r.original.daysAbsent,
                            0,
                          )}
                          d
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-agm-green">
                          +
                          {filteredRows.reduce(
                            (sum, r) => sum + r.original.overtimeHours,
                            0,
                          )}
                          h
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-agm-text">
                          {formatCurrency(totalFilteredGross)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-agm-green">
                          +{formatCurrency(totalFilteredOT)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-700">
                          -{formatCurrency(totalFilteredDeductions)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-agm-text">
                          {formatCurrency(totalFilteredNet)}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-agm-box-border bg-agm-box-bg/40 text-xs">
                <div className="flex items-center gap-2 text-agm-muted">
                  <span>Rows per page:</span>
                  <select
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => {
                      table.setPageSize(Number(e.target.value));
                    }}
                    className="bg-agm-card border border-agm-box-border rounded px-2 py-1 text-xs text-agm-text focus:outline-hidden"
                  >
                    {[10, 15, 25, 50, 100].map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        {pageSize}
                      </option>
                    ))}
                  </select>
                  <span>
                    Showing {table.getRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} records
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-agm-muted font-medium">
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount() || 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="px-2 py-1 h-auto text-xs cursor-pointer disabled:opacity-40"
                    >
                      <ChevronLeftIcon size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="px-2 py-1 h-auto text-xs cursor-pointer disabled:opacity-40"
                    >
                      <ChevronRightIcon size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {workforceData && (
        <div className="hidden print:block font-sans text-agm-text bg-agm-card p-6 space-y-5">
          <QuotationHeader />

          <div className="text-center border-b-2 border-agm-navy pb-3 pt-2">
            <h1 className="text-lg font-black uppercase tracking-wider text-agm-navy">
              Workforce Monthly Timesheet &amp; WPS Payroll Register
            </h1>
            <p className="text-xs font-bold text-agm-muted uppercase tracking-widest mt-0.5">
              Pay Period: {workforceData.period.monthName} {selectedYear}
            </p>
          </div>

          <div className="grid grid-cols-4 border border-agm-box-border text-center text-xs divide-x divide-agm-box-border bg-agm-box-bg py-2">
            <div>
              <span className="text-[10px] text-agm-muted uppercase block font-bold">
                Total Personnel
              </span>
              <span className="font-bold text-sm text-agm-text">
                {workforceData.workforceStats.totalEmployees}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-agm-muted uppercase block font-bold">
                Gross Liability
              </span>
              <span className="font-bold text-sm text-agm-text">
                {formatCurrency(
                  workforceData.workforceStats.totalWorkforceGross,
                )}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-agm-muted uppercase block font-bold">
                Overtime Compensation
              </span>
              <span className="font-bold text-sm text-agm-green">
                {formatCurrency(
                  workforceData.workforceStats.totalOvertimeAmount,
                )}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-agm-muted uppercase block font-bold">
                Net WPS Payroll
              </span>
              <span className="font-black text-sm text-agm-text">
                {formatCurrency(workforceData.workforceStats.totalNetPayroll)}
              </span>
            </div>
          </div>

          <table className="w-full text-left text-xs border border-agm-box-border divide-y divide-agm-box-border">
            <thead className="bg-agm-box-bg text-agm-navy font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-2 px-2">Emp ID</th>
                <th className="py-2 px-2">Employee Name</th>
                <th className="py-2 px-2">Department</th>
                <th className="py-2 px-2 text-center">Present</th>
                <th className="py-2 px-2 text-center">Absent</th>
                <th className="py-2 px-2 text-right">OT (hrs)</th>
                <th className="py-2 px-2 text-right">Gross (AED)</th>
                <th className="py-2 px-2 text-right">OT Pay</th>
                <th className="py-2 px-2 text-right">Deductions</th>
                <th className="py-2 px-2 text-right">Net Pay (AED)</th>
                <th className="py-2 px-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-agm-box-border">
              {table.getFilteredRowModel().rows.map((row) => {
                const e = row.original;
                return (
                  <tr key={e.id}>
                    <td className="py-1.5 px-2 font-mono font-bold text-agm-green">
                      {e.employeeCode}
                    </td>
                    <td className="py-1.5 px-2 font-medium">
                      {e.firstName} {e.lastName}
                    </td>
                    <td className="py-1.5 px-2">{e.department}</td>
                    <td className="py-1.5 px-2 text-center">
                      {e.daysPresent}d
                    </td>
                    <td className="py-1.5 px-2 text-center">{e.daysAbsent}d</td>
                    <td className="py-1.5 px-2 text-right font-mono">
                      {e.overtimeHours > 0 ? `${e.overtimeHours}h` : "—"}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono">
                      {formatCurrency(e.grossSalary)}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-agm-green">
                      {e.overtimeAmount > 0
                        ? formatCurrency(e.overtimeAmount)
                        : "—"}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-rose-800">
                      {e.deductions > 0
                        ? `-${formatCurrency(e.deductions)}`
                        : "—"}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold">
                      {formatCurrency(e.netSalary)}
                    </td>
                    <td className="py-1.5 px-2 text-center font-bold text-[10px]">
                      {e.isPaid ? "PAID" : "UNPAID"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
            <div className="border-t border-agm-box-border pt-2">
              <span className="font-bold text-agm-text block">
                HR &amp; Operations Verification
              </span>
              <span className="text-[10px] text-agm-muted">
                Attendance &amp; Timesheets Verified
              </span>
            </div>
            <div className="border-t border-agm-box-border pt-2">
              <span className="font-bold text-agm-text block">
                Accounts &amp; Finance Approval
              </span>
              <span className="text-[10px] text-agm-muted">
                Authorized for UAE WPS Bank Transfer
              </span>
            </div>
          </div>

          <QuotationFooter />
        </div>
      )}
    </Modal>
  );
}
