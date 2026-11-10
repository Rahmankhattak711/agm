"use client";

import React, { useState } from "react";
import { Button, Input, Modal } from "@/components/ui";
import { toast } from "@/lib/toast";

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "contact" | "project";
  onCreated: (item: { id: string; name: string }) => void;
}

export function QuickCreateModal({ isOpen, onClose, type, onCreated }: QuickCreateModalProps) {
  const [name, setName] = useState("");
  const [codeOrEmail, setCodeOrEmail] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setLoading(true);
    try {
      if (type === "project") {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            projectCode: codeOrEmail || `PRJ-${Date.now().toString().slice(-4)}`,
            status: "IN_PROGRESS",
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create project");
        }
        const created = await res.json();
        toast.success(`Project "${name}" created successfully`);
        onCreated({ id: created.id, name: created.name });
        onClose();
      } else {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            companyName: name,
            email: codeOrEmail || undefined,
          }),
        });
        if (!res.ok) {
          const createdFallback = { id: `temp-${Date.now()}`, name };
          onCreated(createdFallback);
          toast.success(`Contact "${name}" added`);
          onClose();
          return;
        }
        const created = await res.json();
        toast.success(`Contact "${name}" created successfully`);
        onCreated({ id: created.id, name: created.name || created.companyName });
        onClose();
      }
    } catch (err: any) {
      if (type === "contact") {
        onCreated({ id: `temp-${Date.now()}`, name });
        toast.success(`Contact "${name}" added`);
        onClose();
      } else {
        toast.error(err.message || "Failed to create");
      }
    } finally {
      setLoading(false);
      setName("");
      setCodeOrEmail("");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === "project" ? "Create New Project / Site" : "Create New Contact"}
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2 font-sans">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-slate-700 block">
            {type === "project" ? "Project / Site Name *" : "Contact / Company Name *"}
          </label>
          <input
            type="text"
            placeholder={type === "project" ? "e.g. Marina Tower Penthouse" : "e.g. AGM Tech Services"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
            className="w-full h-9 px-3 rounded-xl bg-white text-[12px] font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all"
            style={{ border: "1px solid #cbd5e1" }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-slate-700 block">
            {type === "project" ? "Project Code (Optional)" : "Email / Phone (Optional)"}
          </label>
          <input
            type="text"
            placeholder={type === "project" ? "e.g. PRJ-MARINA-01" : "e.g. info@agm.ae"}
            value={codeOrEmail}
            onChange={(e) => setCodeOrEmail(e.target.value)}
            className="w-full h-9 px-3 rounded-xl bg-white text-[12px] font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10 transition-all"
            style={{ border: "1px solid #cbd5e1" }}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-8 px-3.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: "#ffffff",
              color: "#475569",
              border: "1px solid #cbd5e1",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-8 px-4 rounded-lg text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: "#1d4ed8",
              color: "#ffffff",
              border: "1px solid #1e40af",
            }}
          >
            {loading ? "Creating..." : "Save & Select"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
