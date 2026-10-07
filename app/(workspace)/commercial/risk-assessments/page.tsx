"use client";

import React, { useCallback, useMemo, useState } from "react";
import RiskAssessmentTemplate from "@/components/documents/RiskAssessmentTemplate";
import {
  RiskAssessmentRecord,
  useRiskAssessments,
  useDeleteRiskAssessment,
} from "@/lib/hooks/api-hooks";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/context/ConfirmContext";
import {
  Button,
  RegisterTable,
  RegisterColumn,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  EmptyState,
  DashboardCard,
  DashboardCardGrid,
  PageHeader,
  FilterBar,
} from "@/components/ui";
import {
  PlusIcon,
  TrashIcon,
  EditIcon,
  FileTextIcon,
  FileCheckIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { SAMPLE_RISK_ASSESSMENT } from "@/components/documents/risk-assessment-constants";

const COLUMNS: RegisterColumn[] = [
  { label: "Doc Number", compact: true, className: "whitespace-nowrap" },
  { label: "Customer", compact: true },
  { label: "Project", compact: true },
  {
    label: "Date & Location",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Risk Activities",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Status",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Actions",
    align: "right",
    compact: true,
    hideOnPrint: true,
    className: "whitespace-nowrap pr-3 sm:pr-4",
  },
];

export default function RiskAssessmentsPage() {
  const { data: recordsList = [], isLoading } = useRiskAssessments();
  const deleteMutation = useDeleteRiskAssessment();
  const { confirm } = useConfirm();

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
      const isConfirmed = await confirm({
        title: "Delete Risk Assessment",
        message:
          "Are you sure you want to delete this risk assessment from the database?",
        variant: "danger",
        confirmText: "Delete",
      });
      if (!isConfirmed) {
        return;
      }
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Risk assessment deleted successfully");
        if (selectedRecord?.id === id) {
          setSelectedRecord(null);
        }
      } catch (err: any) {
        toast.error(
          "Error deleting risk assessment: " + (err.message || "Unknown error"),
        );
      }
    },
    [confirm, deleteMutation, selectedRecord?.id],
  );

  const getStatusBadge = (status?: string) => {
    if (status === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Approved
        </span>
      );
    }
    if (status === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Draft
      </span>
    );
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Project Risk Assessments"
        description="Manage, evaluate, and print project risk mitigation procedures."
        actions={
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
        }
      />

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

          <FilterBar
            tabs={[
              { id: "ALL", label: `All (${recordsList.length})` },
              { id: "COMPLETED", label: `Approved (${completedCount})` },
              { id: "ACTIVE", label: `Active (${activeCount})` },
              { id: "DRAFT", label: `Draft (${draftCount})` },
            ]}
            activeTab={statusFilter}
            onTabChange={(st) => setStatusFilter(st)}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search ref, customer, project, location..."
            totalCount={filteredRecords.length}
            countLabel="Assessments"
          />

          <RegisterTable
            title="Project Risk Assessments Register"
            countLabel={`${filteredRecords.length} Active Records`}
            columns={COLUMNS}
          >
            <TableBody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <TableLoading colSpan={7} rows={5} />
              ) : filteredRecords.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="p-0 border-0">
                    <EmptyState
                      icon={
                        <ShieldCheckIcon size={20} className="text-slate-400" />
                      }
                      title="No risk assessments found"
                      description={
                        search
                          ? "No risk assessments matched your search criteria."
                          : "No risk assessments in database. Click 'New Assessment' to create one."
                      }
                      actionLabel={search ? undefined : "New Assessment"}
                      onAction={search ? undefined : handleCreateNew}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => handleOpenInEditor(row)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <TableCell className="py-2 px-2.5 sm:px-3 font-mono font-bold text-xs text-slate-900 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
                        {row.refNumber}
                      </span>
                    </TableCell>

                    <TableCell className="py-2 px-2.5 sm:px-3 text-xs">
                      <span className="font-semibold text-slate-800">
                        {row.customerName || "—"}
                      </span>
                    </TableCell>

                    <TableCell className="py-2 px-2.5 sm:px-3 text-xs">
                      <span
                        className="font-bold text-slate-900 truncate block max-w-[240px]"
                        title={row.projectName}
                      >
                        {row.projectName || "—"}
                      </span>
                    </TableCell>

                    <TableCell className="py-2 px-2.5 sm:px-3 text-center text-xs whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-slate-700 font-mono font-medium">
                          {row.date || "—"}
                        </span>
                        <span
                          className="text-[11px] text-slate-400 truncate mt-0.5"
                          title={row.projectLocation}
                        >
                          {row.projectLocation || "—"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell
                      align="center"
                      className="py-2 px-2.5 sm:px-3 text-center text-xs whitespace-nowrap"
                    >
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {row.items?.length || 0} activit
                        {row.items?.length === 1 ? "y" : "ies"}
                      </span>
                    </TableCell>

                    <TableCell
                      align="center"
                      className="py-2 px-2.5 sm:px-3 text-center text-xs whitespace-nowrap"
                    >
                      {getStatusBadge(row.status)}
                    </TableCell>

                    <TableCell className="py-2 px-2.5 sm:px-3 text-right print:hidden whitespace-nowrap">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenInEditor(row)}
                          className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-teal-800 rounded-lg hover:bg-teal-50 transition cursor-pointer"
                          title="Edit Assessment"
                        >
                          <EditIcon size={18} className="w-[18px] h-[18px]" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(row.id, e)}
                          className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Assessment"
                        >
                          <TrashIcon size={18} className="w-[18px] h-[18px]" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </RegisterTable>
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
