"use client";

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import SalaryCertificateTemplate from "@/components/documents/SalaryCertificateTemplate";
import {
  SalaryCertificateRecord,
  useSalaryCertificates,
  useDeleteSalaryCertificate,
} from "@/lib/hooks/api-hooks";
import {
  Button,
  DataTable,
  Input,
  DashboardCard,
  DashboardCardGrid,
} from "@/components/ui";
import { SearchIcon } from "@/components/icons";
import { Trash2, Plus, User, DollarSign, Calendar, Edit3 } from "lucide-react";
import { SAMPLE_SALARY_CERTIFICATE } from "@/components/documents/salary-certificate-constants";

export default function SalaryCertificatesPage() {
  const { data: recordsList = [], isLoading } = useSalaryCertificates();
  const deleteMutation = useDeleteSalaryCertificate();

  const [activeView, setActiveView] = useState<"LIST" | "EDITOR">("EDITOR");
  const [selectedRecord, setSelectedRecord] =
    useState<SalaryCertificateRecord | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredRecords = useMemo(() => {
    const q = search.toLowerCase().trim();
    return recordsList.filter((item) => {
      const matchesSearch =
        !q ||
        item.refNumber.toLowerCase().includes(q) ||
        (item.employeeName && item.employeeName.toLowerCase().includes(q)) ||
        (item.position && item.position.toLowerCase().includes(q)) ||
        (item.emiratesId && item.emiratesId.toLowerCase().includes(q));
      const matchesStatus =
        statusFilter === "ALL" || (item.status || "DRAFT") === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [recordsList, search, statusFilter]);

  const totalSalaryVolume = useMemo(
    () =>
      recordsList.reduce((acc, r) => acc + Number(r.monthlySalaryNum || 0), 0),
    [recordsList],
  );

  const issuedCount = useMemo(
    () =>
      recordsList.filter(
        (a) => a.status === "ISSUED" || a.status === "COMPLETED",
      ).length,
    [recordsList],
  );

  const draftCount = useMemo(
    () => recordsList.filter((a) => !a.status || a.status === "DRAFT").length,
    [recordsList],
  );

  const handleOpenInEditor = (record: SalaryCertificateRecord) => {
    setSelectedRecord(record);
    setActiveView("EDITOR");
  };

  const handleCreateNew = () => {
    setSelectedRecord(null);
    setActiveView("EDITOR");
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Are you sure you want to delete this salary certificate from the database?",
      )
    ) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      if (selectedRecord?.id === id) {
        setSelectedRecord(null);
      }
    } catch (err: any) {
      alert("Error deleting salary certificate: " + (err.message || "Unknown error"));
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    if (status === "ISSUED" || status === "COMPLETED") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const columns: ColumnDef<SalaryCertificateRecord>[] = useMemo(
    () => [
      {
        accessorKey: "refNumber",
        header: "Ref Number",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-xs text-slate-900">
            {row.original.refNumber}
          </span>
        ),
      },
      {
        accessorKey: "employeeName",
        header: "Employee Name",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-xs flex items-center gap-1">
              <User size={12} className="text-slate-400" />
              {row.original.employeePrefix} {row.original.employeeName || "—"}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              EID: {row.original.emiratesId || "N/A"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "position",
        header: "Position / Designation",
        cell: ({ row }) => (
          <span className="text-slate-700 text-xs font-medium">
            {row.original.position || "—"}
          </span>
        ),
      },
      {
        accessorKey: "monthlySalaryNum",
        header: "Monthly Salary",
        cell: ({ row }) => (
          <span className="font-bold text-slate-900 text-xs flex items-center gap-0.5">
            <DollarSign size={12} className="text-agm-green" />
            AED {Number(row.original.monthlySalaryNum || 0).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "date",
        header: "Issue Date",
        cell: ({ row }) => (
          <span className="text-slate-600 text-xs flex items-center gap-1">
            <Calendar size={11} className="text-slate-400" />
            {row.original.date || "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const isIssued =
            row.original.status === "ISSUED" ||
            row.original.status === "COMPLETED";
          return (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeClass(
                row.original.status,
              )}`}
            >
              {isIssued ? "ISSUED" : "DRAFT"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenInEditor(row.original)}
              className="text-xs h-7 px-2 border-slate-200 hover:bg-slate-50"
            >
              <Edit3 size={12} className="mr-1 text-slate-500" />
              Edit / Print
            </Button>
            <button
              onClick={(e) => handleDelete(row.original.id, e)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete Salary Certificate"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {/* Header & View Switcher */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Salary Certificates
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official employee salary certificates with UAE Embassy &amp; Bank
            compliance, electronic stamps and automated wording.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveView("EDITOR")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeView === "EDITOR"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Document Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveView("LIST")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeView === "LIST"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Directory ({recordsList.length})
            </button>
          </div>

          {activeView === "LIST" && (
            <Button
              onClick={handleCreateNew}
              className="bg-agm-green text-white hover:bg-agm-green-dark text-xs font-semibold flex items-center gap-1 shadow-xs"
              size="sm"
            >
              <Plus size={14} />
              <span>New Certificate</span>
            </Button>
          )}
        </div>
      </div>

      {activeView === "LIST" ? (
        <div className="space-y-4">
          {/* Summary Cards */}
          <DashboardCardGrid cols={4}>
            <DashboardCard
              title="Total Certificates"
              value={recordsList.length}
              subtitle="Saved in system"
            />
            <DashboardCard
              title="Issued"
              value={issuedCount}
              subtitle="Finalized & issued"
            />
            <DashboardCard
              title="Draft"
              value={draftCount}
              subtitle="In progress / draft"
            />
            <DashboardCard
              title="Total Monthly Value"
              value={`AED ${totalSalaryVolume.toLocaleString()}`}
              subtitle="Combined monthly payroll sum"
            />
          </DashboardCardGrid>

          {/* Table Container */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by ref, employee, position..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                  Filter Status:
                </span>
                <select
                  aria-label="Filter status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium outline-none focus:border-agm-green"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ISSUED">Issued</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
            </div>


            {/* TanStack Table */}
            <DataTable
              columns={columns}
              data={filteredRecords}
              isLoading={isLoading}
              onRowClick={(row) => handleOpenInEditor(row)}
            />
          </div>
        </div>
      ) : (
        <div className="w-full">
          <SalaryCertificateTemplate
            key={selectedRecord ? selectedRecord.id : "new"}
            initialData={selectedRecord || SAMPLE_SALARY_CERTIFICATE}
            onSave={(saved) => {
              setSelectedRecord(saved);
            }}
          />
        </div>
      )}
    </div>
  );
}
