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
  FileTextIcon,
  UserIcon,
} from "@/components/icons";
import type { CustomLetterDocumentData } from "./custom-letter-constants";
import { Button, Modal, Input } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

export interface CustomLetterSavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedRecords: CustomLetterDocumentData[];
  isLoadingSaved?: boolean;
  onLoadRecord: (record: CustomLetterDocumentData) => void;
  onDeleteRecord: (id: string, e: React.MouseEvent) => void;
  onNewBlank?: () => void;
}

export const CustomLetterSavedModal: React.FC<CustomLetterSavedModalProps> = ({
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
      r.docTitle?.toLowerCase().includes(q) ||
      r.subject?.toLowerCase().includes(q) ||
      r.addressee?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "ISSUED":
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
      title="Saved Company Letters & Certificates"
      maxWidth="2xl"
    >
      <div className="space-y-3 p-1">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by ref number, title, subject or recipient..."
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
                ? "No letters found matching your search query."
                : 'No letters stored in the database yet. Click "Save to DB" to store one.'}
            </div>
          ) : (
            filtered.map((r) => {
              const hasDeletePermission = canModify((r as any).createdById, [
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
                      {(r as any).createdBy?.fullName && (
                        <span className="text-[10px] text-agm-muted bg-agm-box-bg border border-agm-box-border px-1.5 py-0.2 rounded font-medium">
                          By {(r as any).createdBy.fullName}
                        </span>
                      )}
                      {!hasDeletePermission && (
                        <span className="text-[10px] font-semibold text-agm-muted bg-agm-box-bg border border-agm-box-border px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                          <EyeIcon size={10} /> View Only
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-agm-text font-bold flex items-center gap-1.5">
                      <FileTextIcon size={12} className="text-agm-green" />
                      {r.docTitle || "Official Letter"}
                    </p>
                    <p className="text-xs text-agm-muted line-clamp-1">
                      {r.subject || `To: ${r.addressee}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-agm-muted">
                      <span className="flex items-center gap-1">
                        <UserIcon size={11} className="text-agm-subtle" />
                        To: {r.addressee}
                      </span>
                      <span className="flex items-center gap-1 text-agm-subtle">
                        <CalendarIcon size={11} />
                        {r.date || "N/A"}
                      </span>
                      <span>
                        Sections:{" "}
                        <strong className="text-agm-text">
                          {r.sections?.length || 0}
                        </strong>
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
