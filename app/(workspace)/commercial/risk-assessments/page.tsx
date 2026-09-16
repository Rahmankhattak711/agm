"use client";

import React, { useMemo, useState } from "react";
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
import { SearchIcon } from "@/components/icons";
import { Trash2, Plus } from "lucide-react";
import { SAMPLE_RISK_ASSESSMENT } from "@/components/documents/risk-assessment-constants";

export default function RiskAssessmentsPage() {
  const { data: recordsList = [], isLoading } = useRiskAssessments();
  const deleteMutation = useDeleteRiskAssessment();

  const [activeView, setActiveView] = useState<"LIST" | "EDITOR">("EDITOR");
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
        (item.projectLocation && item.projectLocation.toLowerCase().includes(q));
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

  const handleOpenInEditor = (record: RiskAssessmentRecord) => {
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
      alert("Error deleting risk assessment: " + (err.message || "Unknown error"));
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "ACTIVE":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "DRAFT":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const columns: ColumnDef<RiskAssessmentRecord>[] = useMemo(
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
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-800 text-xs">
            {row.original.customerName || "—"}
          </span>
        ),
      },
      {
        accessorKey: "projectName",
        header: "Project & Location",
        cell: ({ row }) => (
          <div className="text-xs">
            <div className="font-medium text-slate-800">
              {row.original.projectName || "—"}
            </div>
            <div className="text-[11px] text-slate-400">
              {row.original.projectLocation || "—"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "date",
        header: "Date & Duration",
        cell: ({ row }) => (
          <div className="text-xs text-slate-600">
            <div>{row.original.date || "—"}</div>
            <div className="text-[11px] text-slate-400">
              {row.original.duration || "—"}
            </div>
          </div>
        ),
      },
      {
        id: "itemsCount",
        header: "Activities",
        cell: ({ row }) => (
          <span className="text-xs text-slate-800 font-medium">
            {row.original.items?.length || 0} activities
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${getStatusBadgeClass(
              row.original.status,
            )}`}
          >
            {row.original.status === "COMPLETED"
              ? "Approved"
              : row.original.status || "DRAFT"}
          </span>
        ),
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
              variant="secondary"
              size="sm"
              onClick={() => handleOpenInEditor(row.original)}
              className="text-xs text-slate-700 hover:bg-slate-100 px-2.5 py-1"
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={(e) => handleDelete(row.original.id, e)}
              className="text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200 px-2 py-1"
              title="Delete"
            >
              <Trash2 size={12} />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="w-full space-y-6">
      {/* Simplified Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-agm-box-border pb-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Project Risk Assessments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage and print project risk assessment documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveView("EDITOR")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeView === "EDITOR"
                  ? "bg-white text-agm-green shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveView("LIST")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeView === "LIST"
                  ? "bg-white text-agm-green shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Saved ({recordsList.length})
            </button>
          </div>

          {activeView === "LIST" && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleCreateNew}
              className="text-xs bg-agm-green hover:bg-agm-green-2 text-white flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>New Assessment</span>
            </Button>
          )}
        </div>
      </div>

      {activeView === "LIST" ? (
        <div className="space-y-6">
          {/* Simplified KPI Cards without icons */}
          <DashboardCardGrid cols={4}>
            <DashboardCard
              title="Total Assessments"
              value={recordsList.length}
              subtitle={`${recordsList.length} documents`}
            />
            <DashboardCard
              title="Approved"
              value={completedCount}
              subtitle="Signed & ready"
              variant="success"
            />
            <DashboardCard
              title="Active"
              value={activeCount}
              subtitle="In-progress"
              variant="default"
            />
            <DashboardCard
              title="Drafts"
              value={draftCount}
              subtitle="In preparation"
              variant="default"
            />
          </DashboardCardGrid>

          {/* Search and Filters */}
          <div className="bg-white p-3.5 rounded-xl border border-agm-box-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by ref number, customer, project, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-1.5 px-3 bg-slate-50 border border-agm-box-border rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-agm-green"
              >
                <option value="ALL">All Statuses ({recordsList.length})</option>
                <option value="COMPLETED">Approved ({completedCount})</option>
                <option value="ACTIVE">Active ({activeCount})</option>
                <option value="DRAFT">Draft ({draftCount})</option>
              </select>
            </div>
          </div>

          {/* TanStack DataTable */}
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
