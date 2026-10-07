"use client";

import React, { useCallback, useMemo, useState } from "react";
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
import { SAMPLE_RENOVATION_AGREEMENT } from "@/components/documents/constants";
import { formatNumber } from "@/lib/utils/format";

const COLUMNS: RegisterColumn[] = [
  { label: "Ref Number", compact: true, className: "whitespace-nowrap" },
  { label: "Client", compact: true },
  { label: "Project & Property", compact: true },
  {
    label: "Date",
    align: "center",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Contract Value",
    align: "right",
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

          <RegisterTable
            title="Company Agreements Register"
            countLabel={`${filteredAgreements.length} Active Records`}
            columns={COLUMNS}
          >
            <TableBody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <TableLoading colSpan={7} rows={5} />
              ) : filteredAgreements.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="p-0 border-0">
                    <EmptyState
                      icon={
                        <FileTextIcon size={20} className="text-slate-400" />
                      }
                      title="No agreements found"
                      description={
                        search
                          ? "No agreements matched your search criteria."
                          : "No agreements in database. Click 'New Agreement' to create one."
                      }
                      actionLabel={search ? undefined : "New Agreement"}
                      onAction={search ? undefined : handleCreateNew}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgreements.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => handleOpenInEditor(row)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <TableCell className="py-2 px-2.5 sm:px-3 font-mono font-bold text-xs text-slate-900 whitespace-nowrap">
                      <span
                        className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200 inline-block max-w-[200px] truncate"
                        title={row.refNumber}
                      >
                        {row.refNumber}
                      </span>
                    </TableCell>

                    <TableCell className="py-2 px-2.5 sm:px-3 text-xs">
                      <span className="font-semibold text-slate-800 whitespace-nowrap">
                        {row.client?.name || "—"}
                      </span>
                    </TableCell>

                    <TableCell className="py-2 px-2.5 sm:px-3 text-xs">
                      <div className="flex flex-col max-w-[260px]">
                        <span
                          className="font-bold text-slate-900 truncate"
                          title={row.project}
                        >
                          {row.project || "—"}
                        </span>
                        <span
                          className="text-[11px] text-slate-500 truncate mt-0.5"
                          title={row.property}
                        >
                          {row.property || "—"}
                        </span>
                      </div>
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
                      align="right"
                      className="py-2 px-2.5 sm:px-3 text-right whitespace-nowrap font-mono font-bold text-slate-900 text-xs"
                    >
                      AED {formatNumber(row.contractValueNum)}
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
                          title="Edit Agreement"
                        >
                          <EditIcon size={18} className="w-[18px] h-[18px]" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(row.id, e)}
                          className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Agreement"
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
