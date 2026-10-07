"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  CustomLetterTemplate,
  CustomLetterDocumentData,
  DEFAULT_CUSTOM_LETTER,
} from "@/components/documents";
import { useCustomLetters, useDeleteCustomLetter } from "@/lib/hooks/api-hooks";
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

const COLUMNS: RegisterColumn[] = [
  { label: "Ref Number", compact: true, className: "whitespace-nowrap" },
  { label: "Document Title & Subject", compact: true },
  { label: "Addressee / Recipient", compact: true },
  {
    label: "Issue Date",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Sections",
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

export default function CustomLettersPage() {
  const { data: recordsList = [], isLoading } = useCustomLetters();
  const deleteMutation = useDeleteCustomLetter();
  const { confirm } = useConfirm();

  const [activeView, setActiveView] = useState<"LIST" | "EDITOR">("LIST");
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
        (a) =>
          (a.status as string) === "ISSUED" ||
          (a.status as string) === "COMPLETED",
      ).length,
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

  const handleOpenInEditor = useCallback((record: CustomLetterDocumentData) => {
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
        title: "Delete Custom Letter",
        message:
          "Are you sure you want to delete this custom letter/certificate?",
        variant: "danger",
        confirmText: "Delete",
      });
      if (!isConfirmed) {
        return;
      }
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Letter deleted successfully");
        if (selectedRecord?.id === id) {
          setSelectedRecord(null);
        }
      } catch (err: any) {
        toast.error(
          "Error deleting letter: " + (err.message || "Unknown error"),
        );
      }
    },
    [confirm, deleteMutation, selectedRecord?.id],
  );

  const getStatusBadge = (status?: string) => {
    const isIssued = status === "ISSUED" || status === "COMPLETED";
    if (isIssued) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          ISSUED
        </span>
      );
    }
    if (status === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          ACTIVE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        DRAFT
      </span>
    );
  };

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Custom Letters & Certificates"
        description="Official company correspondence, certificates, and compliance NOCs."
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
                <span>New Letter</span>
              </Button>
            )}
          </div>
        }
      />

      {activeView === "LIST" ? (
        <div className="space-y-6">
          <DashboardCardGrid cols={4}>
            <DashboardCard
              title="Total Letters"
              value={recordsList.length}
              subtitle={`${recordsList.length} documents recorded`}
              icon={<FileTextIcon size={20} className="text-slate-500" />}
            />
            <DashboardCard
              title="Issued"
              value={issuedCount}
              subtitle="Signed & ready"
              variant="success"
              icon={<FileCheckIcon size={20} className="text-emerald-600" />}
            />
            <DashboardCard
              title="Active / In Progress"
              value={activeCount}
              subtitle="Ongoing workflows"
              variant="default"
              icon={<ShieldCheckIcon size={20} className="text-blue-600" />}
            />
            <DashboardCard
              title="Drafts"
              value={draftCount}
              subtitle="In preparation"
              variant="default"
              icon={<CalendarIcon size={20} className="text-amber-600" />}
            />
          </DashboardCardGrid>

          <FilterBar
            tabs={[
              { id: "ALL", label: `All (${recordsList.length})` },
              { id: "ISSUED", label: `Issued (${issuedCount})` },
              { id: "ACTIVE", label: `Active (${activeCount})` },
              { id: "DRAFT", label: `Draft (${draftCount})` },
            ]}
            activeTab={statusFilter}
            onTabChange={(st) => setStatusFilter(st)}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by ref number, title, subject, or recipient..."
            totalCount={filteredRecords.length}
            countLabel="Letters"
          />

          <RegisterTable
            title="Custom Letters & Certificates Register"
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
                      title="No letters found"
                      description={
                        search
                          ? "No letters matched your search criteria."
                          : "No letters in database. Click 'New Letter' to create one."
                      }
                      actionLabel={search ? undefined : "New Letter"}
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
                      <div className="flex flex-col max-w-[280px]">
                        <span
                          className="font-bold text-slate-900 truncate"
                          title={row.docTitle}
                        >
                          {row.docTitle || "OFFICIAL LETTER"}
                        </span>
                        <span
                          className="text-[11px] text-slate-500 truncate mt-0.5"
                          title={row.subject || row.addressee}
                        >
                          {row.subject || row.addressee || "—"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-2 px-2.5 sm:px-3 text-xs">
                      <span
                        className="text-slate-800 font-medium truncate block max-w-[200px]"
                        title={row.addressee}
                      >
                        {row.addressee || "To Whom It May Concern"}
                      </span>
                    </TableCell>

                    <TableCell
                      align="center"
                      className="py-2 px-2.5 sm:px-3 text-center text-xs whitespace-nowrap"
                    >
                      <span className="text-xs text-slate-600 font-mono">
                        {row.date || "—"}
                      </span>
                    </TableCell>

                    <TableCell
                      align="center"
                      className="py-2 px-2.5 sm:px-3 text-center text-xs whitespace-nowrap"
                    >
                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {row.sections?.length || 0} Block
                        {row.sections?.length === 1 ? "" : "s"}
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
                          title="Edit Letter"
                        >
                          <EditIcon size={18} className="w-[18px] h-[18px]" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(row.id, e)}
                          className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Letter"
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
          <CustomLetterTemplate
            key={selectedRecord ? selectedRecord.id : "new"}
            initialData={selectedRecord || DEFAULT_CUSTOM_LETTER}
            onSave={(saved) => setSelectedRecord(saved)}
          />
        </div>
      )}
    </div>
  );
}
