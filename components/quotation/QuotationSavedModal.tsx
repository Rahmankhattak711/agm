import React from "react";
import { FolderOpen, Loader2, Trash2 } from "lucide-react";
import { QuotationRecord } from "@/lib/hooks/api-hooks";
import { formatCurrency } from "./constants";
import { Button, Modal } from "@/components/ui";

export interface QuotationSavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedQuotations: QuotationRecord[];
  isLoadingSaved: boolean;
  onLoadQuotation: (q: QuotationRecord) => void;
  onDeleteQuotation: (id: string, e: React.MouseEvent) => void;
}

export const QuotationSavedModal: React.FC<QuotationSavedModalProps> = ({
  isOpen,
  onClose,
  savedQuotations,
  isLoadingSaved,
  onLoadQuotation,
  onDeleteQuotation,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Saved Database Quotations"
      maxWidth="2xl"
    >
      <div className="p-1 max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
        {isLoadingSaved ? (
          <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-emerald-600" size={24} />
            Loading database records...
          </div>
        ) : savedQuotations.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No quotations stored in the database yet. Create one and click
            &quot;Save to DB&quot;.
          </div>
        ) : (
          savedQuotations.map((q) => (
            <div
              key={q.id}
              onClick={() => onLoadQuotation(q)}
              className="py-3 px-3 hover:bg-slate-50 rounded-xl transition flex items-center justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 font-mono">
                    {q.quotationNo}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {q.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Client:{" "}
                  <strong className="text-slate-800">
                    {q.customer || "Unnamed Client"}
                  </strong>{" "}
                  {q.project ? `— Project: ${q.project}` : ""}{" "}
                  {q.location ? `(${q.location})` : ""}
                </p>
                <p className="text-[11px] text-slate-400">
                  Date: {q.date || "N/A"} | Total:{" "}
                  <strong>
                    AED {formatCurrency(Number(q.totalAmount || 0))}
                  </strong>{" "}
                  | Items: {q.items?.length || 0}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onLoadQuotation(q)}
                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                >
                  Load
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={(e) => onDeleteQuotation(q.id, e)}
                  title="Delete from DB"
                  icon={<Trash2 size={13} />}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

export default QuotationSavedModal;
