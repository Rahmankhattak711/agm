"use client";

import React, { useState } from "react";
import {
  BookOpenIcon,
  SpinnerIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  SearchIcon,
  CalendarIcon,
  UserIcon,
  DollarSignIcon,
} from "@/components/icons";
import { SalaryCertificateRecord } from "@/lib/hooks/api-hooks";
import { Button, Modal, Input } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

export interface SalaryCertificateSavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedRecords: SalaryCertificateRecord[];
  isLoadingSaved?: boolean;
  onLoadRecord: (record: SalaryCertificateRecord) => void;
  onDeleteRecord: (id: string, e: React.MouseEvent) => void;
  onNewBlank?: () => void;
}

export const SalaryCertificateSavedModal: React.FC<
  SalaryCertificateSavedModalProps
> = ({
  isOpen,
  onClose,
  savedRecords = [],
  isLoadingSaved = false,
  onLoadRecord,
  onDeleteRecord,
  onNewBlank,
}) => {
  const { canModify } = useAuth();
  const [search, setSearch] = useState("");

  const filtered = savedRecords.filter((r) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      r.refNumber?.toLowerCase().includes(q) ||
      r.employeeName?.toLowerCase().includes(q) ||
      r.position?.toLowerCase().includes(q) ||
      r.emiratesId?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "ISSUED":
      case "COMPLETED":
        return "bg-agm-green-soft text-agm-green border-agm-box-border";
      case "ACTIVE":
        return "bg-agm-box-bg text-agm-navy border-agm-box-border";
      case "DRAFT":
      default:
        return "bg-agm-box-bg text-agm-muted border-agm-box-border";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Saved Salary Certificate Documents"
      maxWidth="2xl"
    >
      <div className="space-y-3 p-1">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by ref number, employee, position or Emirates ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<SearchIcon className="w-4 h-4 text-agm-muted" />}
            className="text-xs bg-agm-box-bg border-agm-box-border text-agm-text"
            containerClassName="flex-1"
          />
          {onNewBlank && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onNewBlank();
                onClose();
              }}
              className="text-xs flex items-center gap-1 border-dashed border-agm-green text-agm-green hover:bg-agm-green-soft whitespace-nowrap"
            >
              <PlusIcon size={13} />
              <span>New Blank</span>
            </Button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-agm-box-border rounded-lg border border-agm-box-border">
          {isLoadingSaved ? (
            <div className="py-12 text-center text-xs text-agm-muted flex flex-col items-center gap-2">
              <SpinnerIcon className="animate-spin text-agm-green" size={24} />
              Loading database records...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-agm-muted">
              {search
                ? "No salary certificates matched your search query."
                : 'No salary certificates stored in the database yet. Click "Save to DB" to store one.'}
            </div>
          ) : (
            filtered.map((r) => {
              const hasDeletePermission = canModify(r.createdBy?.id, [
                "ACCOUNTANT",
                "ADMIN",
              ]);

              return (
                <div
                  key={r.id}
                  onClick={() => {
                    onLoadRecord(r);
                    onClose();
                  }}
                  className="py-3 px-3.5 hover:bg-agm-box-bg transition flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-agm-text font-mono tracking-tight">
                        {r.refNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(
                          r.status,
                        )}`}
                      >
                        {r.status || "DRAFT"}
                      </span>
                      {r.createdBy?.fullName && (
                        <span className="text-[10px] text-agm-muted bg-agm-box-bg border border-agm-box-border px-1.5 py-0.2 rounded font-medium">
                          By {r.createdBy.fullName}
                        </span>
                      )}
                      {!hasDeletePermission && (
                        <span className="text-[10px] font-semibold text-agm-muted bg-agm-box-bg border border-agm-box-border px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                          <EyeIcon size={10} /> View Only
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-agm-text font-medium flex items-center gap-1.5">
                      <UserIcon size={12} className="text-agm-subtle" />
                      <strong className="text-agm-text font-semibold">
                        {r.employeePrefix || "Mr."}{" "}
                        {r.employeeName || "Unnamed Employee"}
                      </strong>
                      {r.position ? `— ${r.position}` : ""}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-agm-muted">
                      <span>
                        Emirates ID:{" "}
                        <strong className="text-agm-text font-mono">
                          {r.emiratesId || "N/A"}
                        </strong>
                      </span>
                      <span className="flex items-center gap-0.5 text-agm-green font-semibold">
                        <DollarSignIcon size={11} />
                        AED {Number(r.monthlySalaryNum || 0).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-agm-subtle">
                        <CalendarIcon size={11} />
                        {r.date || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        onLoadRecord(r);
                        onClose();
                      }}
                      className="bg-agm-green-soft text-agm-green hover:bg-agm-green hover:text-white border-agm-box-border text-xs"
                    >
                      <BookOpenIcon size={12} className="mr-1" /> Load
                    </Button>
                    {hasDeletePermission && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={(e) => onDeleteRecord(r.id, e)}
                        className="text-xs px-2"
                        title="Delete Document"
                      >
                        <TrashIcon size={13} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
