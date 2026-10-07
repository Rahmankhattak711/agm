"use client";

import React, { useCallback, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import AgreementTemplate from "@/components/documents/AgreementTemplate";
import {
  AgreementRecord,
  useAgreements,
  useDeleteAgreement,
} from "@/lib/hooks/api-hooks";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/context/ConfirmContext";
import {
  Button,
  DataTable,
  Input,
  DashboardCard,
  DashboardCardGrid,
  PageHeader,
  FilterBar,
} from "@/components/ui";
import {
  SearchIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  FileTextIcon,
  FileCheckIcon,
  ShieldCheckIcon,
  UserIcon,
  CalendarIcon,
} from "@/components/icons";
import { SAMPLE_RENOVATION_AGREEMENT } from "@/components/documents/constants";
import { formatNumber } from "@/lib/utils/format";

export default function AgreementsAndDocumentsPage() {
  const { data: agreementsList = [], isLoading } = useAgreements();
  const deleteAgreementMutation = useDeleteAgreement();
  const { confirm } = useConfirm();

  const [activeView, setActiveView] = useState<"LIST" | "EDITOR">("LIST");
  const [selectedAgreement, setSelectedAgreement] =
    useState<AgreementRecord | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredAgreements = useMemo(() => {
    const q = search.toLowerCase().trim();
    return agreementsList.filter((item) => {
      const matchesSearch =
        !q ||
        item.refNumber.toLowerCase().includes(q) ||
        (item.client?.name && item.client.name.toLowerCase().includes(q)) ||
        (item.project && item.project.toLowerCase().includes(q)) ||
        (item.property && item.property.toLowerCase().includes(q));
      const matchesStatus =
        statusFilter === "ALL" || (item.status || "DRAFT") === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [agreementsList, search, statusFilter]);

  const totalContractVolume = useMemo(
    () =>
      agreementsList.reduce((s, a) => s + Number(a.contractValueNum || 0), 0),
    [agreementsList],
  );

  const completedCount = useMemo(
    () => agreementsList.filter((a) => a.status === "COMPLETED").length,
    [agreementsList],
  );

  const activeCount = useMemo(
    () => agreementsList.filter((a) => a.status === "ACTIVE").length,
    [agreementsList],
  );

  const draftCount = useMemo(
    () =>
      agreementsList.filter((a) => !a.status || a.status === "DRAFT").length,
    [agreementsList],
  );

  const handleOpenInEditor = useCallback((agr: AgreementRecord) => {
    setSelectedAgreement(agr);
    setActiveView("EDITOR");
  }, []);

  const handleCreateNew = () => {
    setSelectedAgreement(null);
    setActiveView("EDITOR");
  };

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const isConfirmed = await confirm({
        title: "Delete Agreement",
        message:
          "Are you sure you want to delete this agreement from the database?",
        variant: "danger",
        confirmText: "Delete",
      });
      if (!isConfirmed) {
        return;
      }
      try {
        await deleteAgreementMutation.mutateAsync(id);
        toast.success("Agreement deleted successfully");
        if (selectedAgreement?.id === id) {
          setSelectedAgreement(null);
        }
      } catch (err: any) {
        toast.error(
          "Error deleting agreement: " + (err.message || "Unknown error"),
        );
      }
    },
    [confirm, deleteAgreementMutation, selectedAgreement?.id],
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

  const columns: ColumnDef<AgreementRecord>[] = useMemo(
    () => [
      {
        accessorKey: "refNumber",
        header: "Ref Number",
        cell: ({ row }) => (
          <span
            className="font-mono font-bold text-xs text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 inline-block max-w-[200px] truncate"
            title={row.original.refNumber}
          >
            {row.original.refNumber}
          </span>
        ),
      },
      {
        accessorKey: "client.name",
        header: "Client",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5 whitespace-nowrap">
            <UserIcon size={12} className="text-slate-400 shrink-0" />
            {row.original.client?.name || "—"}
          </span>
        ),
      },
      {
        accessorKey: "project",
        header: "Project & Property",
        cell: ({ row }) => (
          <div className="flex flex-col max-w-[260px]">
            <span
              className="font-bold text-slate-900 text-xs flex items-center gap-1.5 truncate"
              title={row.original.project}
            >
              <FileTextIcon size={12} className="text-agm-green shrink-0" />
              {row.original.project || "—"}
            </span>
            <span
              className="text-[11px] text-slate-500 truncate mt-0.5"
              title={row.original.property}
            >
              {row.original.property || "—"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-xs text-slate-600 flex items-center gap-1.5 whitespace-nowrap">
            <CalendarIcon size={12} className="text-slate-400 shrink-0" />
            {row.original.date || "—"}
          </span>
        ),
      },
      {
        accessorKey: "contractValueNum",
        header: "Contract Value",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900 text-xs whitespace-nowrap bg-emerald-50/70 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200/80">
            AED {formatNumber(row.original.contractValueNum)}
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
      <PageHeader
        title="Company Agreements"
        description="Manage, edit, and print company agreement documents."
        actions={
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center bg-[#f0f4f8] p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveView("LIST")}
                className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  activeView === "LIST"
                    ? "bg-white text-agm-green shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Saved ({agreementsList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveView("EDITOR")}
                className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
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
              icon={<PlusIcon size={14} strokeWidth={2.5} />}
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              New Agreement
            </Button>
          </div>
        }
      />

      {activeView === "LIST" ? (
        <div className="space-y-6">
          <DashboardCardGrid cols={3}>
            <DashboardCard
              title="Approved Agreements"
              value={completedCount}
              subtitle="Executed & binding contracts"
              icon={<ShieldCheckIcon size={20} className="text-emerald-600" />}
              variant="success"
            />
            <DashboardCard
              title="Active Agreements"
              value={activeCount}
              subtitle="In-progress project works"
              icon={<FileCheckIcon size={20} className="text-blue-600" />}
              variant="default"
            />
            <DashboardCard
              title="Draft Agreements"
              value={draftCount}
              subtitle="Pending review or client approval"
              icon={<FileTextIcon size={20} className="text-slate-500" />}
              variant="default"
            />
          </DashboardCardGrid>

          <FilterBar
            tabs={[
              { id: "ALL", label: `All (${agreementsList.length})` },
              { id: "COMPLETED", label: `Approved (${completedCount})` },
              { id: "ACTIVE", label: `Active (${activeCount})` },
              { id: "DRAFT", label: `Draft (${draftCount})` },
            ]}
            activeTab={statusFilter}
            onTabChange={(st) => setStatusFilter(st)}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search ref, client, project, property..."
            totalCount={filteredAgreements.length}
            countLabel="Agreements"
          />

          <DataTable
            columns={columns}
            data={filteredAgreements}
            isLoading={isLoading}
            onRowClick={(row) => handleOpenInEditor(row)}
            emptyTitle="No agreements found"
            emptyMessage={
              search
                ? "No agreements matched your search criteria."
                : "No agreements in database. Click 'New Agreement' to create one."
            }
          />
        </div>
      ) : (
        <div>
          <AgreementTemplate
            key={selectedAgreement ? selectedAgreement.id : "new"}
            initialData={selectedAgreement || SAMPLE_RENOVATION_AGREEMENT}
            onSave={(saved) => setSelectedAgreement(saved)}
          />
        </div>
      )}
    </div>
  );
}
