"use client";

import React, { useState } from "react";
import {
  FolderOpenIcon,
  SpinnerIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  SearchIcon,
  CheckCircle2Icon,
} from "@/components/icons";
import { AgreementRecord } from "@/lib/hooks/api-hooks";
import { Button, Modal, Input } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

export interface AgreementSavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedAgreements: AgreementRecord[];
  isLoadingSaved: boolean;
  onLoadAgreement: (agr: AgreementRecord) => void;
  onDeleteAgreement: (id: string, e: React.MouseEvent) => void;
  onNewBlank?: () => void;
}

export const AgreementSavedModal: React.FC<AgreementSavedModalProps> = ({
  isOpen,
  onClose,
  savedAgreements,
  isLoadingSaved,
  onLoadAgreement,
  onDeleteAgreement,
  onNewBlank,
}) => {
  const { canModify } = useAuth();
  const [search, setSearch] = useState("");

  const filtered = savedAgreements.filter((a) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      a.refNumber?.toLowerCase().includes(q) ||
      a.client?.name?.toLowerCase().includes(q) ||
      a.project?.toLowerCase().includes(q) ||
      a.property?.toLowerCase().includes(q) ||
      a.contractor?.name?.toLowerCase().includes(q)
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
      title="Saved Database Agreements"
      maxWidth="2xl"
    >
      <div className="space-y-3 p-1">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ref number, client name, or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-agm-green focus:border-agm-green"
            />
          </div>
          {onNewBlank && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onNewBlank();
                onClose();
              }}
              className="text-xs flex items-center gap-1 border-dashed border-agm-green text-agm-green hover:bg-agm-green-soft cursor-pointer"
            >
              <PlusIcon size={13} />
              <span>New Blank</span>
            </Button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-100">
          {isLoadingSaved ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <SpinnerIcon className="animate-spin text-agm-green" size={24} />
              Loading database records...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              {search
                ? "No agreements matched your search query."
                : 'No agreements stored in the database yet. Create one and click "Save to DB".'}
            </div>
          ) : (
            filtered.map((a) => {
              const hasDeletePermission = canModify(a.createdBy?.id, [
                "ACCOUNTANT",
                "ADMIN",
              ]);

              return (
                <div
                  key={a.id}
                  onClick={() => onLoadAgreement(a)}
                  className="py-3 px-3.5 hover:bg-slate-50/90 transition flex items-center justify-between cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 font-mono tracking-tight">
                        {a.refNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(
                          a.status,
                        )}`}
                      >
                        {a.status || "DRAFT"}
                      </span>
                      {a.createdBy?.fullName && (
                        <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded font-medium">
                          By {a.createdBy.fullName}
                        </span>
                      )}
                      {!hasDeletePermission && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                          <EyeIcon size={10} /> View Only
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      Client:{" "}
                      <strong className="text-slate-900 font-semibold">
                        {a.client?.name || "Unnamed Client"}
                      </strong>{" "}
                      {a.project ? `— Project: ${a.project}` : ""}{" "}
                      {a.property ? `(${a.property})` : ""}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Date: {a.date || "N/A"} | Value:{" "}
                      <strong className="text-slate-800">
                        AED {Number(a.contractValueNum || 0).toLocaleString()}
                      </strong>{" "}
                      | Clauses: {a.clauses?.length || 0}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onLoadAgreement(a)}
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-xs"
                    >
                      <FolderOpenIcon size={12} className="mr-1" /> Load
                    </Button>
                    {hasDeletePermission && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={(e) => onDeleteAgreement(a.id, e)}
                        className="bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200 text-xs px-2 cursor-pointer"
                        title="Delete Agreement"
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
