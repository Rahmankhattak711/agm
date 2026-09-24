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
import {
  SearchIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  UserIcon,
  DollarSignIcon,
  CalendarIcon,
  FileCheckIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
} from "@/components/icons";
import { SAMPLE_SALARY_CERTIFICATE } from "@/components/documents/salary-certificate-constants";

export default function SalaryCertificatesPage() {
  const { data: recordsList = [], isLoading } = useSalaryCertificates();
  const deleteMutation = useDeleteSalaryCertificate();

  const [activeView, setActiveView] = useState<"LIST" | "EDITOR">("LIST");
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

  const activeCount = useMemo(
    () => recordsList.filter((a) => a.status === "ACTIVE").length,
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
      alert(
        "Error deleting salary certificate: " +
          (err.message || "Unknown error"),
      );
    }
  };

  const getStatusBadge = (status?: string) => {
    const isIssued = status === "ISSUED" || status === "COMPLETED";
    if (isIssued) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          ISSUED
        </span>
      );
    }
    if (status === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          ACTIVE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        DRAFT
      </span>
    );
  };

  const columns: ColumnDef<SalaryCertificateRecord>[] = useMemo(
    () => [
      {
        accessorKey: "refNumber",
        header: "Ref Number",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-xs text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 whitespace-nowrap inline-block">
            {row.original.refNumber}
          </span>
        ),
      },
      {
        accessorKey: "employeeName",
        header: "Employee & Emirates ID",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <UserIcon size={12} className="text-slate-400" />
              {row.original.employeePrefix || "Mr."}{" "}
              {row.original.employeeName || "—"}
            </span>
            <span className="text-[11px] text-slate-500 font-mono mt-0.5">
              EID: {row.original.emiratesId || "N/A"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "position",
        header: "Designation / Position",
        cell: ({ row }) => (
          <span className="text-slate-700 text-xs font-medium flex items-center gap-1.5">
            <BriefcaseIcon size={12} className="text-slate-400 shrink-0" />
            {row.original.position || "—"}
          </span>
        ),
      },
      {
        accessorKey: "monthlySalaryNum",
        header: "Monthly Salary",
        cell: ({ row }) => (
          <span className="font-bold text-slate-900 text-xs flex items-center gap-1 bg-emerald-50/70 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100">
            <DollarSignIcon size={11} className="text-agm-green" />
            AED {Number(row.original.monthlySalaryNum || 0).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "date",
        header: "Issue Date",
        cell: ({ row }) => (
          <span className="text-slate-600 text-xs flex items-center gap-1.5 whitespace-nowrap">
            <CalendarIcon size={12} className="text-slate-400 shrink-0" />
            {row.original.date || "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div
            className="flex items-center justify-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenInEditor(row.original)}
              className="text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1 flex items-center gap-1 cursor-pointer"
            >
              <EditIcon size={12} />
              <span>Edit</span>
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={(e) => handleDelete(row.original.id, e)}
              className="text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200 px-2 py-1 flex items-center gap-1 cursor-pointer"
              title="Delete"
            >
              <TrashIcon size={12} />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-agm-box-border pb-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Salary Certificates
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official employee salary certificates with UAE Embassy &amp; Bank
            compliance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveView("LIST")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeView === "LIST"
                  ? "bg-white text-agm-green shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Saved Records ({recordsList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveView("EDITOR")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeView === "EDITOR"
                  ? "bg-white text-agm-green shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Editor
            </button>
          </div>

          {activeView === "LIST" && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleCreateNew}
              className="text-xs bg-agm-green hover:bg-agm-green-2 text-white flex items-center gap-1.5 shadow-xs cursor-pointer font-semibold"
            >
              <PlusIcon size={14} />
              <span>New Certificate</span>
            </Button>
          )}
        </div>
      </div>

      {activeView === "LIST" ? (
        <div className="space-y-6">
          <DashboardCardGrid cols={4}>
            <DashboardCard
              title="Total Certificates"
              value={recordsList.length}
              subtitle={`${recordsList.length} documents recorded`}
              icon={<FileCheckIcon size={20} className="text-slate-500" />}
            />
            <DashboardCard
              title="Issued"
              value={issuedCount}
              subtitle="Signed & ready"
              variant="success"
              icon={<ShieldCheckIcon size={20} className="text-emerald-600" />}
            />
            <DashboardCard
              title="Active / In Progress"
              value={activeCount}
              subtitle="Processing"
              variant="default"
              icon={<CalendarIcon size={20} className="text-blue-600" />}
            />
            <DashboardCard
              title="Total Monthly Payroll"
              value={`AED ${totalSalaryVolume.toLocaleString()}`}
              subtitle="Combined salary volume"
              variant="default"
              icon={<DollarSignIcon size={20} className="text-agm-green" />}
            />
          </DashboardCardGrid>

          <div className="bg-white p-3.5 rounded-xl border border-agm-box-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by ref, employee name, designation, or Emirates ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-slate-500 font-medium">
                Status:
              </span>
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                {(["ALL", "ISSUED", "ACTIVE", "DRAFT"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs rounded font-semibold transition-all cursor-pointer ${
                      statusFilter === st
                        ? "bg-white text-agm-green shadow-xs border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {st === "ALL" ? `All (${recordsList.length})` : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredRecords}
            isLoading={isLoading}
            onRowClick={(row) => handleOpenInEditor(row)}
            emptyTitle="No salary certificates found"
            emptyMessage={
              search
                ? "No salary certificates matched your search criteria."
                : "No salary certificates in database. Click 'New Certificate' to create one."
            }
          />
        </div>
      ) : (
        <div>
          <SalaryCertificateTemplate
            key={selectedRecord ? selectedRecord.id : "new"}
            initialData={selectedRecord || SAMPLE_SALARY_CERTIFICATE}
            onSave={(saved) => setSelectedRecord(saved as any)}
          />
        </div>
      )}
    </div>
  );
}
