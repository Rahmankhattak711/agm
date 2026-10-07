"use client";

import React, { useCallback, useMemo, useState } from "react";
import SalaryCertificateTemplate from "@/components/documents/SalaryCertificateTemplate";
import {
  SalaryCertificateRecord,
  useSalaryCertificates,
  useDeleteSalaryCertificate,
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
  DollarSignIcon,
  CalendarIcon,
  FileCheckIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { SAMPLE_SALARY_CERTIFICATE } from "@/components/documents/salary-certificate-constants";

const COLUMNS: RegisterColumn[] = [
  { label: "Ref Number", compact: true, className: "whitespace-nowrap" },
  { label: "Employee & Emirates ID", compact: true },
  { label: "Designation / Position", compact: true },
  {
    label: "Monthly Salary",
    align: "right",
    compact: true,
    className: "whitespace-nowrap",
  },
  {
    label: "Issue Date",
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

export default function SalaryCertificatesPage() {
  const { data: recordsList = [], isLoading } = useSalaryCertificates();
  const deleteMutation = useDeleteSalaryCertificate();
  const { confirm } = useConfirm();

  const [activeView, setActiveView] = useState<"LIST" | "EDITOR">("LIST");
  const [selectedRecord, setSelectedRecord] =
    useState<SalaryCertificateRecord | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredRecords = useMemo(() => {
    const q = search.toLowerCase().trim();
    return recordsList.filter((item) => {
      const matchesSearch =
        !q ||
        item.refNumber.toLowerCase().includes(q) ||
        (item.employeeName && item.employeeName.toLowerCase().includes(q)) ||
        (item.position && item.position.toLowerCase().includes(q)) ||
        (item.emiratesId && item.emiratesId.toLowerCase().includes(q));
      const matchesStatus =
        statusFilter === "ALL" || (item.status || "DRAFT") === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [recordsList, search, statusFilter]);

  const totalSalaryVolume = useMemo(
    () =>
      recordsList.reduce((acc, r) => acc + Number(r.monthlySalaryNum || 0), 0),
    [recordsList],
  );

  const issuedCount = useMemo(
    () =>
      recordsList.filter(
        (a) => a.status === "ISSUED" || a.status === "COMPLETED",
      ).length,
    [recordsList],
  );

  const draftCount = useMemo(
    () => recordsList.filter((a) => !a.status || a.status === "DRAFT").length,
    [recordsList],
  );

  const activeCount = useMemo(
    () => recordsList.filter((a) => a.status === "ACTIVE").length,
    [recordsList],
  );

  const handleOpenInEditor = useCallback((record: SalaryCertificateRecord) => {
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
        title: "Delete Salary Certificate",
        message:
          "Are you sure you want to delete this salary certificate from the database?",
        variant: "danger",
        confirmText: "Delete",
      });
      if (!isConfirmed) {
        return;
      }
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Salary certificate deleted successfully");
        if (selectedRecord?.id === id) {
          setSelectedRecord(null);
        }
      } catch (err: any) {
        toast.error(
          "Error deleting salary certificate: " +
            (err.message || "Unknown error"),
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
        title="Salary Certificates"
        description="Official employee salary certificates with UAE Embassy & Bank compliance."
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
                <span>New Certificate</span>
              </Button>
            )}
          </div>
        }
      />

      {activeView === "LIST" ? (
        <div className="space-y-6">
          <DashboardCardGrid cols={4}>
            <DashboardCard
              title="Total Certificates"
              value={recordsList.length}
              subtitle={`${recordsList.length} documents recorded`}
              icon={<FileCheckIcon size={20} className="text-slate-500" />}
            />
            <DashboardCard
              title="Issued"
              value={issuedCount}
              subtitle="Signed & ready"
              variant="success"
              icon={<ShieldCheckIcon size={20} className="text-emerald-600" />}
            />
            <DashboardCard
              title="Active / In Progress"
              value={activeCount}
              subtitle="Processing"
              variant="default"
              icon={<CalendarIcon size={20} className="text-blue-600" />}
            />
            <DashboardCard
              title="Total Monthly Payroll"
              value={`AED ${totalSalaryVolume.toLocaleString()}`}
              subtitle="Combined salary volume"
              variant="default"
              icon={<DollarSignIcon size={20} className="text-agm-green" />}
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
            searchPlaceholder="Search by ref, employee name, designation, or Emirates ID..."
            totalCount={filteredRecords.length}
            countLabel="Certificates"
          />

          <RegisterTable
            title="Salary Certificates Register"
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
                        <FileCheckIcon size={20} className="text-slate-400" />
                      }
                      title="No salary certificates found"
                      description={
                        search
                          ? "No salary certificates matched your search criteria."
                          : "No salary certificates in database. Click 'New Certificate' to create one."
                      }
                      actionLabel={search ? undefined : "New Certificate"}
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
                      <div
                        className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-[260px]"
                        title={`${row.employeePrefix || "Mr."} ${row.employeeName || ""}`}
                      >
                        {row.employeePrefix || "Mr."} {row.employeeName || "—"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">
                        EID: {row.emiratesId || "N/A"}
                      </div>
                    </TableCell>

                    <TableCell className="py-2 px-2.5 sm:px-3 text-slate-700 text-xs">
                      <div
                        className="font-medium text-slate-800 truncate max-w-[140px] sm:max-w-[200px]"
                        title={row.position}
                      >
                        {row.position || "—"}
                      </div>
                    </TableCell>

                    <TableCell
                      align="right"
                      className="py-2 px-2.5 sm:px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap text-xs"
                    >
                      AED {Number(row.monthlySalaryNum || 0).toLocaleString()}
                    </TableCell>

                    <TableCell className="py-2 px-2 text-center text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {row.date || "—"}
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
                          title="Edit Certificate"
                        >
                          <EditIcon size={18} className="w-[18px] h-[18px]" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(row.id, e)}
                          className="h-8 w-8 p-0 flex items-center justify-center text-slate-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Certificate"
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
          <SalaryCertificateTemplate
            key={selectedRecord ? selectedRecord.id : "new"}
            initialData={selectedRecord || SAMPLE_SALARY_CERTIFICATE}
            onSave={(saved) => setSelectedRecord(saved as any)}
          />
        </div>
      )}
    </div>
  );
}
