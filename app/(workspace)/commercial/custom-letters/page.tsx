"use client";

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  CustomLetterTemplate,
  CustomLetterDocumentData,
  DEFAULT_CUSTOM_LETTER,
} from "@/components/documents";
import {
  useCustomLetters,
  useDeleteCustomLetter,
} from "@/lib/hooks/api-hooks";
import {
  Button,
  DataTable,
  Input,
  DashboardCard,
  DashboardCardGrid,
} from "@/components/ui";
import { SearchIcon } from "@/components/icons";
import { Trash2, Plus, FileText, Calendar, Edit3 } from "lucide-react";


export default function CustomLettersPage() {
  const { data: recordsList = [], isLoading } = useCustomLetters();
  const deleteMutation = useDeleteCustomLetter();

  const [activeView, setActiveView] = useState<"LIST" | "EDITOR">("EDITOR");
  const [selectedRecord, setSelectedRecord] =
    useState<CustomLetterDocumentData | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredRecords = useMemo(() => {
    const q = search.toLowerCase().trim();
    return recordsList.filter((item) => {
      const matchesSearch =
        !q ||
        item.refNumber.toLowerCase().includes(q) ||
        (item.docTitle && item.docTitle.toLowerCase().includes(q)) ||
        (item.subject && item.subject.toLowerCase().includes(q)) ||
        (item.addressee && item.addressee.toLowerCase().includes(q));
      const matchesStatus =
        statusFilter === "ALL" || (item.status || "DRAFT") === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [recordsList, search, statusFilter]);

  const issuedCount = useMemo(
    () =>
      recordsList.filter(
        (a) => a.status === "ISSUED" || a.status === "ACTIVE",
      ).length,
    [recordsList],
  );

  const draftCount = useMemo(
    () => recordsList.filter((a) => !a.status || a.status === "DRAFT").length,
    [recordsList],
  );

  const handleOpenInEditor = (record: CustomLetterDocumentData) => {
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
        "Are you sure you want to delete this custom letter/certificate?",
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
      alert("Error deleting letter: " + (err.message || "Unknown error"));
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    if (status === "ISSUED" || status === "ACTIVE") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const columns: ColumnDef<CustomLetterDocumentData>[] = useMemo(
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
        accessorKey: "docTitle",
        header: "Document Title & Subject",
        cell: ({ row }) => (
          <div className="flex flex-col max-w-[280px]">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1 truncate">
              <FileText size={12} className="text-agm-green shrink-0" />
              {row.original.docTitle || "OFFICIAL LETTER"}
            </span>
            <span className="text-[11px] text-slate-500 truncate">
              {row.original.subject || row.original.addressee || "—"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "addressee",
        header: "Addressee / Recipient",
        cell: ({ row }) => (
          <span className="text-slate-700 text-xs font-medium line-clamp-1">
            {row.original.addressee || "To Whom It May Concern"}
          </span>
        ),
      },
      {
        accessorKey: "date",
        header: "Issue Date",
        cell: ({ row }) => (
          <span className="text-slate-600 text-xs flex items-center gap-1 whitespace-nowrap">
            <Calendar size={11} className="text-slate-400" />
            {row.original.date || "—"}
          </span>
        ),
      },
      {
        accessorKey: "sections",
        header: "Sections",
        cell: ({ row }) => (
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
            {row.original.sections?.length || 0} Block{row.original.sections?.length === 1 ? "" : "s"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const isIssued =
            row.original.status === "ISSUED" ||
            row.original.status === "ACTIVE";
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
              title="Delete Document"
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
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Custom Letters &amp; Certificates</span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
              Generator
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create custom salary letters, experience certificates, NOCs, and formal company letters with official letterhead header, footer, dynamic headings, and paragraphs.
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
              <span>New Letter</span>
            </Button>
          )}
        </div>
      </div>

      {activeView === "LIST" ? (
        <div className="space-y-4">
          {/* Summary Cards */}
          <DashboardCardGrid cols={4}>
            <DashboardCard
              title="Total Documents"
              value={recordsList.length}
              subtitle="Saved in system"
            />
            <DashboardCard
              title="Issued"
              value={issuedCount}
              subtitle="Finalized & approved"
              variant="success"
            />
            <DashboardCard
              title="Draft"
              value={draftCount}
              subtitle="In progress"
            />
            <DashboardCard
              title="Document Types"
              value="Unlimited"
              subtitle="Salary, NOC, Service, etc."
            />
          </DashboardCardGrid>

          {/* Table Container */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by ref, title, recipient, subject..."
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
          <CustomLetterTemplate
            key={selectedRecord ? selectedRecord.id : "new"}
            initialData={selectedRecord || DEFAULT_CUSTOM_LETTER}
            onSave={(saved) => {
              setSelectedRecord(saved);
            }}
          />
        </div>
      )}
    </div>
  );
}
