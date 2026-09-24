"use client";

import React, { useCallback, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import RiskAssessmentTemplate from "@/components/documents/RiskAssessmentTemplate";
import {
  RiskAssessmentRecord,
  useRiskAssessments,
  useDeleteRiskAssessment,
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
  FileTextIcon,
  CalendarIcon,
  FileCheckIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@/components/icons";
import { SAMPLE_RISK_ASSESSMENT } from "@/components/documents/risk-assessment-constants";

export default function RiskAssessmentsPage() {
  const { data: recordsList = [], isLoading } = useRiskAssessments();
  const deleteMutation = useDeleteRiskAssessment();

  const [activeView, setActiveView] = useState<"LIST" | "EDITOR">("LIST");
  const [selectedRecord, setSelectedRecord] =
    useState<RiskAssessmentRecord | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredRecords = useMemo(() => {
    const q = search.toLowerCase().trim();
    return recordsList.filter((item) => {
      const matchesSearch =
        !q ||
        item.refNumber.toLowerCase().includes(q) ||
        (item.customerName && item.customerName.toLowerCase().includes(q)) ||
        (item.projectName && item.projectName.toLowerCase().includes(q)) ||
        (item.projectLocation &&
          item.projectLocation.toLowerCase().includes(q));
      const matchesStatus =
        statusFilter === "ALL" || (item.status || "DRAFT") === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [recordsList, search, statusFilter]);

  const completedCount = useMemo(
    () => recordsList.filter((a) => a.status === "COMPLETED").length,
    [recordsList],
  );

  const activeCount = useMemo(
    () => recordsList.filter((a) => a.status === "ACTIVE").length,
    [recordsList],
  );

  const draftCount = useMemo(
    () => recordsList.filter((a) => !a.status || a.status === "DRAFT").length,
    [recordsList],
  );

  const handleOpenInEditor = useCallback((record: RiskAssessmentRecord) => {
    setSelectedRecord(record);
    setActiveView("EDITOR");
  }, []);

  const handleCreateNew = () => {
    setSelectedRecord(null);
    setActiveView("EDITOR");
  };

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (
        !window.confirm(
          "Are you sure you want to delete this risk assessment from the database?",
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
          "Error deleting risk assessment: " + (err.message || "Unknown error"),
        );
      }
    },
    [deleteMutation, selectedRecord?.id],
  );

  const getStatusBadge = (status?: string) => {
    if (status === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Approved
        </span>
      );
    }
    if (status === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Draft
      </span>
    );
  };

  const columns: ColumnDef<RiskAssessmentRecord>[] = useMemo(
    () => [
      {
        accessorKey: "refNumber",
        header: "Doc Number",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-xs text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 whitespace-nowrap inline-block">
            {row.original.refNumber}
          </span>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
            <UserIcon size={12} className="text-slate-400 shrink-0" />
            {row.original.customerName || "—"}
          </span>
        ),
      },
      {
        accessorKey: "projectName",
        header: "Project",
        cell: ({ row }) => (
          <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5 truncate max-w-[240px]">
            <FileTextIcon size={12} className="text-agm-green shrink-0" />
            {row.original.projectName || "—"}
          </span>
        ),
      },
      {
        accessorKey: "date",
        header: "Date & Location",
        cell: ({ row }) => (
          <div className="flex flex-col text-xs">
            <span className="text-slate-700 font-medium flex items-center gap-1 whitespace-nowrap">
              <CalendarIcon size={12} className="text-slate-400 shrink-0" />
              {row.original.date || "—"}
            </span>
            <span className="text-[11px] text-slate-400 truncate mt-0.5">
              {row.original.projectLocation || "—"}
            </span>
          </div>
        ),
      },
      {
        id: "itemsCount",
        header: "Risk Activities",
        cell: ({ row }) => (
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
            {row.original.items?.length || 0} activit
            {row.original.items?.length === 1 ? "y" : "ies"}
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
    [handleDelete, handleOpenInEditor],
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-agm-box-border pb-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Project Risk Assessments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage, evaluate, and print project risk mitigation procedures.
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
              Saved ({recordsList.length})
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

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleCreateNew}
            className="text-xs bg-agm-green hover:bg-agm-green-2 text-white flex items-center gap-1.5 shadow-xs cursor-pointer font-semibold"
          >
            <PlusIcon size={14} />
            <span>New Assessment</span>
          </Button>
        </div>
      </div>

      {activeView === "LIST" ? (
        <div className="space-y-6">
          <DashboardCardGrid cols={3}>
            <DashboardCard
              title="Approved Assessments"
              value={completedCount}
              subtitle="Signed & ready for site"
              icon={<ShieldCheckIcon size={20} className="text-emerald-600" />}
              variant="success"
            />
            <DashboardCard
              title="Active Assessments"
              value={activeCount}
              subtitle="Under review & implementation"
              icon={<FileCheckIcon size={20} className="text-blue-600" />}
              variant="default"
            />
            <DashboardCard
              title="Draft Assessments"
              value={draftCount}
              subtitle="Pending review or details"
              icon={<FileTextIcon size={20} className="text-slate-500" />}
              variant="default"
            />
          </DashboardCardGrid>

          <div className="bg-white p-3 rounded-xl border border-agm-box-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Input
                placeholder="Search ref, customer, project, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<SearchIcon className="w-4 h-4 text-agm-muted" />}
                className="text-xs bg-slate-50/50 border-agm-box-border"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {["ALL", "COMPLETED", "ACTIVE", "DRAFT"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                      statusFilter === st
                        ? "bg-white text-slate-900 shadow-2xs font-semibold"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {st === "ALL"
                      ? `All (${recordsList.length})`
                      : st === "COMPLETED"
                        ? `Approved (${completedCount})`
                        : st}
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
            emptyTitle="No risk assessments found"
            emptyMessage={
              search
                ? "No risk assessments matched your search criteria."
                : "No risk assessments in database. Click 'New Assessment' to create one."
            }
          />
        </div>
      ) : (
        <div>
          <RiskAssessmentTemplate
            key={selectedRecord ? selectedRecord.id : "new"}
            initialData={selectedRecord || SAMPLE_RISK_ASSESSMENT}
            onSave={(saved) => setSelectedRecord(saved)}
          />
        </div>
      )}
    </div>
  );
}
