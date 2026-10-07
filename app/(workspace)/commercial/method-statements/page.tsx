"use client";

import React, { useCallback, useMemo, useState } from "react";
import MethodStatementTemplate from "@/components/documents/MethodStatementTemplate";
import {
  MethodStatementRecord,
  useMethodStatements,
  useDeleteMethodStatement,
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
  CalendarIcon,
  FileCheckIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { SAMPLE_METHOD_STATEMENT } from "@/components/documents/method-statement-constants";

const COLUMNS: RegisterColumn[] = [
  { label: "Doc Number", compact: true, className: "whitespace-nowrap" },
  { label: "Customer", compact: true },
  { label: "Project & Work Type", compact: true },
  {
    label: "Date & Location",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Scope Steps",
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

export default function MethodStatementsPage() {
  const { data: recordsList = [], isLoading } = useMethodStatements();
  const deleteMutation = useDeleteMethodStatement();
  const { confirm } = useConfirm();

  const [activeView, setActiveView] = useState<"LIST" | "EDITOR">("LIST");
  const [selectedRecord, setSelectedRecord] =
    useState<MethodStatementRecord | null>(null);
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
        (item.workType && item.workType.toLowerCase().includes(q)) ||
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

  const handleOpenInEditor = useCallback((record: MethodStatementRecord) => {
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
        title: "Delete Method Statement",
        message:
          "Are you sure you want to delete this method statement from the database?",
        variant: "danger",
        confirmText: "Delete",
      });
      if (!isConfirmed) {
        return;
      }
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Method statement deleted successfully");
        if (selectedRecord?.id === id) {
          setSelectedRecord(null);
        }
      } catch (err: any) {
        toast.error(
          "Error deleting method statement: " +
            (err.message || "Unknown error"),
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
        title="Method Statements"
        description="Manage and print project method statement execution procedures."
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
                Saved Statements ({recordsList.length})
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
                <span>New Statement</span>
              </Button>
            )}
          </div>
        }
      />

      {activeView === "LIST" ? (
        <div className="space-y-6">
          <DashboardCardGrid cols={4}>
            <DashboardCard
              title="Total Statements"
              value={recordsList.length}
              subtitle={`${recordsList.length} procedures recorded`}
              icon={<FileTextIcon size={20} className="text-slate-500" />}
            />
            <DashboardCard
              title="Approved"
              value={completedCount}
              subtitle="Ready for execution"
              variant="success"
              icon={<FileCheckIcon size={20} className="text-emerald-600" />}
            />
            <DashboardCard
              title="Active / Ongoing"
              value={activeCount}
              subtitle="Site work in progress"
              variant="default"
              icon={<ShieldCheckIcon size={20} className="text-blue-600" />}
            />
            <DashboardCard
              title="Drafts"
              value={draftCount}
              subtitle="Under review"
              variant="default"
              icon={<CalendarIcon size={20} className="text-amber-600" />}
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
            searchPlaceholder="Search by doc number, customer, project, or location..."
            totalCount={filteredRecords.length}
            countLabel="Statements"
          />

          <RegisterTable
            title="Method Statements Register"
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
                        <FileTextIcon size={20} className="text-slate-400" />
                      }
                      title="No method statements found"
                      description={
                        search
                          ? "No method statements matched your search criteria."
                          : "No method statements in database. Click 'New Statement' to create one."
                      }
                      actionLabel={search ? undefined : "New Statement"}
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
                      <div className="flex flex-col max-w-[260px]">
                        <span
                          className="font-bold text-slate-900 truncate"
                          title={row.projectName}
                        >
                          {row.projectName || "—"}
                        </span>
                        <span
                          className="text-[11px] text-slate-500 truncate mt-0.5"
                          title={row.workType}
                        >
                          {row.workType || "—"}
                        </span>
                      </div>
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

                    <TableCell className="py-2 px-2 text-center whitespace-nowrap">
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {row.items?.length || 0} step
                        {row.items?.length === 1 ? "" : "s"}
                      </span>
                    </TableCell>

                    <TableCell className="py-2 px-2 text-center whitespace-nowrap">
                      {getStatusBadge(row.status)}
                    </TableCell>

                    <TableCell className="py-2 px-2 sm:pr-4 text-right print:hidden whitespace-nowrap">
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
                          title="Edit Statement"
                        >
                          <EditIcon size={18} className="w-[18px] h-[18px]" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(row.id, e)}
                          className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Statement"
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
          <MethodStatementTemplate
            key={selectedRecord ? selectedRecord.id : "new"}
            initialData={selectedRecord || SAMPLE_METHOD_STATEMENT}
            onSave={(saved) => setSelectedRecord(saved as any)}
          />
        </div>
      )}
    </div>
  );
}
