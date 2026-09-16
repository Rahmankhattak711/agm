"use client";

import React, { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import AgreementTemplate from "@/components/documents/AgreementTemplate";
import {
  AgreementRecord,
  useAgreements,
  useDeleteAgreement,
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
import { SAMPLE_RENOVATION_AGREEMENT } from "@/components/documents/constants";

export default function AgreementsAndDocumentsPage() {
  const { data: agreementsList = [], isLoading } = useAgreements();
  const deleteAgreementMutation = useDeleteAgreement();

  const [activeView, setActiveView] = useState<"LIST" | "EDITOR">("EDITOR");
  const [selectedAgreement, setSelectedAgreement] =
    useState<AgreementRecord | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const formatNumber = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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

  const handleOpenInEditor = (agr: AgreementRecord) => {
    setSelectedAgreement(agr);
    setActiveView("EDITOR");
  };

  const handleCreateNew = () => {
    setSelectedAgreement(null);
    setActiveView("EDITOR");
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Are you sure you want to delete this agreement from the database?",
      )
    ) {
      return;
    }
    try {
      await deleteAgreementMutation.mutateAsync(id);
      if (selectedAgreement?.id === id) {
        setSelectedAgreement(null);
      }
    } catch (err: any) {
      alert("Error deleting agreement: " + (err.message || "Unknown error"));
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

  const columns: ColumnDef<AgreementRecord>[] = useMemo(
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
        accessorKey: "client.name",
        header: "Client",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-800 text-xs">
            {row.original.client?.name || "—"}
          </span>
        ),
      },
      {
        accessorKey: "project",
        header: "Project & Property",
        cell: ({ row }) => (
          <div className="text-xs">
            <div className="font-medium text-slate-800">
              {row.original.project || "—"}
            </div>
            <div className="text-[11px] text-slate-400">
              {row.original.property || "—"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-xs text-slate-600">
            {row.original.date || "—"}
          </span>
        ),
      },
      {
        accessorKey: "contractValueNum",
        header: "Contract Value",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900 text-xs">
            AED {formatNumber(row.original.contractValueNum)}
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
            {row.original.status || "DRAFT"}
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
            Company Agreements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage, edit, and print company agreement documents.
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
              Saved ({agreementsList.length})
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
              <span>New Agreement</span>
            </Button>
          )}
        </div>
      </div>

      {activeView === "LIST" ? (
        <div className="space-y-6">
          {/* Simplified KPI Cards without icons */}
          <DashboardCardGrid cols={4}>
            <DashboardCard
              title="Total Agreements"
              value={agreementsList.length}
              subtitle={`${agreementsList.length} documents`}
            />
            <DashboardCard
              title="Total Volume"
              value={`AED ${formatNumber(totalContractVolume)}`}
              subtitle="All contracts"
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
                placeholder="Search by ref number, client name, project, or property..."
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
                <option value="ALL">All Statuses ({agreementsList.length})</option>
                <option value="COMPLETED">Completed ({completedCount})</option>
                <option value="ACTIVE">Active ({activeCount})</option>
                <option value="DRAFT">Draft ({draftCount})</option>
              </select>
            </div>
          </div>

          {/* TanStack DataTable */}
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
