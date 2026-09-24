"use client";

import React, { useCallback, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import MethodStatementTemplate from "@/components/documents/MethodStatementTemplate";
import {
  MethodStatementRecord,
  useMethodStatements,
  useDeleteMethodStatement,
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
import { SAMPLE_METHOD_STATEMENT } from "@/components/documents/method-statement-constants";

export default function MethodStatementsPage() {
  const { data: recordsList = [], isLoading } = useMethodStatements();
  const deleteMutation = useDeleteMethodStatement();

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
      if (
        !window.confirm(
          "Are you sure you want to delete this method statement from the database?",
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
          "Error deleting method statement: " +
            (err.message || "Unknown error"),
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
          COMPLETED
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

  const columns: ColumnDef<MethodStatementRecord>[] = useMemo(
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
        header: "Project & Work Type",
        cell: ({ row }) => (
          <div className="flex flex-col max-w-[260px]">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5 truncate">
              <FileTextIcon size={12} className="text-agm-green shrink-0" />
              {row.original.projectName || "—"}
            </span>
            <span className="text-[11px] text-slate-500 truncate mt-0.5">
              {row.original.workType || "—"}
            </span>
          </div>
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
        header: "Scope Steps",
        cell: ({ row }) => (
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
            {row.original.items?.length || 0} step
            {row.original.items?.length === 1 ? "" : "s"}
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
            Method Statements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage and print project method statement execution procedures.
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
      </div>

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

          <div className="bg-white p-3.5 rounded-xl border border-agm-box-border shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by doc number, customer, project, or location..."
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
                {(["ALL", "COMPLETED", "ACTIVE", "DRAFT"] as const).map(
                  (st) => (
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
                  ),
                )}
              </div>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredRecords}
            isLoading={isLoading}
            onRowClick={(row) => handleOpenInEditor(row)}
            emptyTitle="No method statements found"
            emptyMessage={
              search
                ? "No method statements matched your search criteria."
                : "No method statements in database. Click 'New Statement' to create one."
            }
          />
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
