"use client";

import React, { useState } from "react";
import { FolderOpen, Loader2, Trash2, Eye, Plus, Search } from "lucide-react";
import { MethodStatementRecord } from "@/lib/hooks/api-hooks";
import { Button, Modal, Input } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

export interface MethodStatementSavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedRecords: MethodStatementRecord[];
  isLoadingSaved: boolean;
  onLoadRecord: (record: MethodStatementRecord) => void;
  onDeleteRecord: (id: string, e: React.MouseEvent) => void;
  onNewBlank?: () => void;
}

export const MethodStatementSavedModal: React.FC<MethodStatementSavedModalProps> = ({
  isOpen,
  onClose,
  savedRecords,
  isLoadingSaved,
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
      r.customerName?.toLowerCase().includes(q) ||
      r.projectName?.toLowerCase().includes(q) ||
      r.projectLocation?.toLowerCase().includes(q) ||
      r.workType?.toLowerCase().includes(q) ||
      r.projectManager?.name?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status?: string) => {
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Saved Method Statements"
      maxWidth="2xl"
    >
      <div className="space-y-3 p-1">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by ref number, customer, project or work type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-agm-muted" />}
            className="text-xs bg-agm-box-bg/50 border-agm-box-border text-agm-text"
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
              <Plus size={13} />
              <span>New Blank</span>
            </Button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-100">
          {isLoadingSaved ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-agm-green" size={24} />
              Loading database records...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              {search
                ? "No method statements matched your search query."
                : 'No method statements stored in the database yet. Click "Save to DB" to store one.'}
            </div>
          ) : (
            filtered.map((r) => {
              const hasDeletePermission = canModify(r.createdBy?.id, ["ACCOUNTANT", "ADMIN"]);

              return (
                <div
                  key={r.id}
                  onClick={() => onLoadRecord(r)}
                  className="py-3 px-3.5 hover:bg-slate-50/90 transition flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 font-mono tracking-tight">
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
                        <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded font-medium">
                          By {r.createdBy.fullName}
                        </span>
                      )}
                      {!hasDeletePermission && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                          <Eye size={10} /> View Only
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      Customer:{" "}
                      <strong className="text-slate-900 font-semibold">
                        {r.customerName || "Unnamed Customer"}
                      </strong>{" "}
                      {r.projectName ? `— Project: ${r.projectName}` : ""}{" "}
                      {r.workType ? `(${r.workType})` : ""}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Date: {r.date || "N/A"} | Location: {r.projectLocation || "N/A"} | Scope Steps:{" "}
                      <strong className="text-slate-800">{r.items?.length || 0}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onLoadRecord(r)}
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-xs"
                    >
                      <FolderOpen size={12} className="mr-1" /> Load
                    </Button>
                    {hasDeletePermission && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={(e) => onDeleteRecord(r.id, e)}
                        className="bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200 text-xs px-2"
                        title="Delete Document"
                      >
                        <Trash2 size={13} />
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
