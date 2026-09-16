"use client";

import React, { useMemo, useState } from "react";
import AgreementTemplate from "@/components/documents/AgreementTemplate";
import {
  AgreementRecord,
  useAgreements,
  useDeleteAgreement,
} from "@/lib/hooks/api-hooks";
import {
  Button,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  Input,
  DashboardCard,
  DashboardCardGrid,
} from "@/components/ui";
import {
  EyeIcon,
  FileCheckIcon,
  SearchIcon,
  PlusIcon,
} from "@/components/icons";
import { FileText, FolderOpen, Trash2, Plus, Edit } from "lucide-react";
import { SAMPLE_RENOVATION_AGREEMENT } from "@/components/documents/constants";

export default function AgreementsAndDocumentsPage() {
  const { data: agreementsList = [], isLoading, error } = useAgreements();
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

  return (
    <div className="w-full pb-10 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            Agreements & Contracts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, customize clauses, save to database, and print legally
            binding renovation agreements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveView("EDITOR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === "EDITOR"
                  ? "bg-white text-slate-900 shadow-xs text-emerald-800"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Agreement Editor
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveView("LIST")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === "LIST"
                  ? "bg-white text-slate-900 shadow-xs text-emerald-800"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Saved Agreements ({agreementsList.length})
            </Button>
          </div>

          {activeView === "LIST" && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleCreateNew}
              className="bg-agm-green hover:bg-agm-green-2 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>New Agreement</span>
            </Button>
          )}
        </div>
      </div>

      <DashboardCardGrid cols={4} className="print:hidden">
        <DashboardCard
          title="Total Contract Pipeline"
          value={`AED ${formatNumber(totalContractVolume)}`}
          subtitle="Cumulative agreement value"
          variant="default"
        />
        <DashboardCard
          title="Total Agreements Stored"
          value={agreementsList.length}
          subtitle={`${agreementsList.length} legal contracts`}
          variant="default"
        />
        <DashboardCard
          title="Active Contracts"
          value={activeCount}
          subtitle="Work in progress contracts"
          variant="success"
        />
        <DashboardCard
          title="Completed Contracts"
          value={completedCount}
          subtitle="Finished and executed"
          variant="default"
        />
      </DashboardCardGrid>

      {activeView === "EDITOR" ? (
        <div className="overflow-visible">
          <AgreementTemplate
            initialData={selectedAgreement || SAMPLE_RENOVATION_AGREEMENT}
          />
        </div>
      ) : (
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
                {[
                  { id: "ALL", label: "All Agreements" },
                  { id: "ACTIVE", label: "Active" },
                  { id: "COMPLETED", label: "Completed" },
                  { id: "DRAFT", label: "Drafts" },
                ].map((tab) => {
                  const isActive = statusFilter === tab.id;
                  return (
                    <Button
                      key={tab.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      {tab.label}
                    </Button>
                  );
                })}
              </div>

              <span className="text-[11px] font-bold text-slate-500 font-mono">
                {filteredAgreements.length} Agreements Listed
              </span>
            </div>

            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search agreements by reference number, client name, project, or property location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-agm-green/20 focus:border-agm-green shadow-2xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <Table>
              <TableHead>
                <TableRow className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <TableHeaderCell className="py-3 px-3.5 font-bold text-xs">
                    Ref Number
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-3.5 font-bold text-xs">
                    Client Details
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-3.5 font-bold text-xs">
                    Project & Property
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-3.5 font-bold text-xs text-right">
                    Contract Value (AED)
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-3.5 font-bold text-xs text-center">
                    Status
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-3.5 font-bold text-xs text-center">
                    Date
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-3.5 font-bold text-xs text-right">
                    Actions
                  </TableHeaderCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {isLoading ? (
                  <TableLoading colSpan={7} />
                ) : filteredAgreements.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-xs text-slate-500"
                    >
                      {search
                        ? "No agreements found matching your search."
                        : "No saved agreements found in the database. Click 'New Agreement' or use the editor to create one."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgreements.map((agr) => (
                    <TableRow
                      key={agr.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenInEditor(agr)}
                    >
                      <TableCell className="py-3 px-3.5 font-mono font-bold text-xs text-slate-900">
                        {agr.refNumber}
                      </TableCell>

                      <TableCell className="py-3 px-3.5">
                        <div className="font-semibold text-xs text-slate-900">
                          {agr.client?.name || "N/A"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {agr.client?.phone || agr.client?.email || "No contact"}
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-3.5">
                        <div className="font-medium text-xs text-slate-800 line-clamp-1">
                          {agr.project || "Fitout Works"}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          {agr.property || "Dubai, UAE"}
                        </div>
                      </TableCell>

                      <TableCell className="py-3 px-3.5 text-right font-mono font-bold text-xs text-slate-900">
                        AED {formatNumber(agr.contractValueNum)}
                      </TableCell>

                      <TableCell className="py-3 px-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${getStatusBadgeClass(
                            agr.status,
                          )}`}
                        >
                          {agr.status || "DRAFT"}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 px-3.5 text-center text-xs text-slate-500 font-mono">
                        {agr.date || "N/A"}
                      </TableCell>

                      <TableCell className="py-3 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenInEditor(agr)}
                            className="text-xs px-2 py-1 text-slate-700 hover:text-agm-green border-slate-200"
                            title="Open in Editor"
                          >
                            <Edit size={12} className="mr-1" /> Edit
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={(e) => handleDelete(agr.id, e)}
                            className="text-xs px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
