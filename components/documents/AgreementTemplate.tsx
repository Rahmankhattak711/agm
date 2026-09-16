"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import {
  FileCheckIcon,
  PrintIcon,
  RefreshIcon,
  EditIcon,
  CheckIcon,
  CloseIcon,
  PlusIcon,
} from "@/components/icons";
import {
  Upload,
  FolderOpen,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  Check,
} from "lucide-react";
import QuotationHeader from "@/components/quotation/QuotationHeader";
import QuotationFooter from "@/components/quotation/QuotationFooter";
import {
  AgreementDocumentData,
  AgreementClause,
  ClientMaterialItem,
  PaymentMilestoneItem,
  SAMPLE_RENOVATION_AGREEMENT,
  DEFAULT_AGREEMENT_CLAUSES,
  DEFAULT_CLIENT_MATERIALS,
  DEFAULT_PAYMENT_MILESTONES,
} from "./constants";
import {
  useAgreements,
  useSaveAgreement,
  useDeleteAgreement,
  AgreementRecord,
} from "@/lib/hooks/api-hooks";
import { AgreementSavedModal } from "./AgreementSavedModal";

interface AgreementTemplateProps {
  initialData?: AgreementDocumentData;
  onSave?: (data: AgreementDocumentData) => void;
  readOnly?: boolean;
}

export default function AgreementTemplate({
  initialData,
  onSave,
  readOnly = false,
}: AgreementTemplateProps) {
  const [data, setData] = useState<AgreementDocumentData>(
    initialData || SAMPLE_RENOVATION_AGREEMENT,
  );
  const [isEditing, setIsEditing] = useState<boolean>(!readOnly);
  const [saveSuccess, setSaveSuccess] = useState<string>("");
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "COMPLETED">(
    (data.status as any) || "DRAFT",
  );

  const [contractorSignatureImg, setContractorSignatureImg] = useState<
    string | null
  >(data.contractorSignatory?.signatureUrl || null);
  const [clientSignatureImg, setClientSignatureImg] = useState<string | null>(
    data.clientSignatory?.signatureUrl || null,
  );

  const contractorFileRef = useRef<HTMLInputElement>(null);
  const clientFileRef = useRef<HTMLInputElement>(null);

  const { data: savedAgreements = [], isLoading: isLoadingSaved } =
    useAgreements();
  const saveAgreementMutation = useSaveAgreement();
  const deleteAgreementMutation = useDeleteAgreement();

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setStatus(initialData.status || "DRAFT");
      if (initialData.contractorSignatory?.signatureUrl) {
        setContractorSignatureImg(initialData.contractorSignatory.signatureUrl);
      }
      if (initialData.clientSignatory?.signatureUrl) {
        setClientSignatureImg(initialData.clientSignatory.signatureUrl);
      }
    }
  }, [initialData]);

  const handlePrint = () => {
    window.print();
  };

  const handleNewBlank = () => {
    const freshYear = new Date().getFullYear();
    const freshSeq = Date.now().toString().slice(-4);
    const newAgreement: AgreementDocumentData = {
      id: `agr-${Date.now()}`,
      title: "AGM FITOUT AGREEMENT",
      refNumber: `AGM-AGR-${freshYear}-${freshSeq}`,
      date: new Date().toLocaleDateString("en-GB"),
      status: "DRAFT",
      copiesCount: 2,
      contractor: {
        role: "Contractor",
        name: "AGM Fitout",
        licenseNumber: "1120950",
        representative: "Muhamed Assem",
        eid: "8741984-3163965-1",
        phone: "050 340 7300",
        email: "assem@agmfitout.com",
        address:
          "Sheikh Zayed Road, near Oasis Centre, Office No. 13-11, Adel Mohammed Ali Jassim Al Marzouqi Bldg, Dubai",
      },
      client: {
        role: "Client",
        name: "",
        eid: "",
        phone: "",
        email: "",
        address: "",
      },
      property: "",
      project: "Execution of General Renovation works",
      contractValueNum: 0,
      contractValueText: "",
      quotationRef: `AGM-QTN-${freshYear}-${freshSeq}`,
      clientMaterials: [...DEFAULT_CLIENT_MATERIALS],
      clauses: [...DEFAULT_AGREEMENT_CLAUSES],
      paymentMilestones: [...DEFAULT_PAYMENT_MILESTONES],
      contractorSignatory: {
        title: "AGM Fitout",
        name: "Muhammed Assem",
      },
      clientSignatory: {
        title: "Client",
        name: "",
      },
    };

    setData(newAgreement);
    setStatus("DRAFT");
    setContractorSignatureImg(null);
    setClientSignatureImg(null);
    setIsEditing(true);
    setSaveSuccess("Initialized blank agreement template!");
    setTimeout(() => setSaveSuccess(""), 3000);
  };

  const handleSaveToDb = async () => {
    try {
      const payload: Partial<AgreementRecord> = {
        ...data,
        status,
        contractorSignatory: {
          ...data.contractorSignatory,
          signatureUrl: contractorSignatureImg || undefined,
        },
        clientSignatory: {
          ...data.clientSignatory,
          signatureUrl: clientSignatureImg || undefined,
        },
      };

      const result = await saveAgreementMutation.mutateAsync(payload);
      if (result?.id) {
        setData((prev) => ({
          ...prev,
          id: result.id,
          status: result.status || status,
        }));
        if (onSave) onSave(result as any);
        setSaveSuccess(`Saved to DB as ${result.refNumber}!`);
        setTimeout(() => setSaveSuccess(""), 4000);
      }
    } catch (err: any) {
      alert("Error saving agreement: " + (err.message || "Unknown error"));
    }
  };

  const handleLoadAgreement = (agr: AgreementRecord) => {
    setData({
      id: agr.id,
      title: agr.title || "AGREEMENT",
      refNumber: agr.refNumber,
      date: agr.date,
      status: agr.status || "DRAFT",
      copiesCount: agr.copiesCount || 2,
      contractor: agr.contractor || SAMPLE_RENOVATION_AGREEMENT.contractor,
      client: agr.client || SAMPLE_RENOVATION_AGREEMENT.client,
      property: agr.property || "",
      project: agr.project || "",
      contractValueNum: Number(agr.contractValueNum || 0),
      contractValueText: agr.contractValueText || "",
      quotationRef: agr.quotationRef || "",
      clientMaterials: agr.clientMaterials?.length
        ? agr.clientMaterials
        : DEFAULT_CLIENT_MATERIALS,
      clauses: agr.clauses?.length ? agr.clauses : DEFAULT_AGREEMENT_CLAUSES,
      paymentMilestones: agr.paymentMilestones?.length
        ? agr.paymentMilestones
        : DEFAULT_PAYMENT_MILESTONES,
      contractorSignatory: agr.contractorSignatory || {
        title: "AGM Fitout",
        name: agr.contractor?.representative || "Muhammed Assem",
      },
      clientSignatory: agr.clientSignatory || {
        title: "Client",
        name: agr.client?.name || "",
      },
    });

    setStatus(agr.status || "DRAFT");
    setContractorSignatureImg(agr.contractorSignatory?.signatureUrl || null);
    setClientSignatureImg(agr.clientSignatory?.signatureUrl || null);
    setIsSavedModalOpen(false);
    setSaveSuccess(`Loaded agreement ${agr.refNumber}!`);
    setTimeout(() => setSaveSuccess(""), 3000);
  };

  const handleDeleteAgreement = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this agreement record from the database?",
      )
    ) {
      return;
    }
    try {
      await deleteAgreementMutation.mutateAsync(id);
      if (data.id === id) {
        handleNewBlank();
      }
    } catch (err: any) {
      alert("Error deleting agreement: " + (err.message || "Unknown error"));
    }
  };

  const loadSamplePreset = () => {
    setData(SAMPLE_RENOVATION_AGREEMENT);
    setStatus("COMPLETED");
    setContractorSignatureImg(null);
    setClientSignatureImg(null);
    setSaveSuccess("Loaded AGM Sulafa Tower Agreement Preset!");
    setTimeout(() => setSaveSuccess(""), 3000);
  };

  const handleContractorUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setContractorSignatureImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClientUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setClientSignatureImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddClause = () => {
    const nextNum = (data.clauses?.length || 0) + 1;
    const newClause: AgreementClause = {
      id: `cls-${Date.now()}`,
      number: nextNum,
      title: `Special Clause ${nextNum}`,
      text: "Specify agreement term, condition, requirement, or execution guideline here.",
    };
    setData((prev) => ({
      ...prev,
      clauses: [...(prev.clauses || []), newClause],
    }));
  };

  const handleRemoveClause = (idx: number) => {
    setData((prev) => {
      const remaining = (prev.clauses || []).filter((_, i) => i !== idx);
      const renumbered = remaining.map((c, i) => ({
        ...c,
        number: i + 1,
      }));
      return {
        ...prev,
        clauses: renumbered,
      };
    });
  };

  const handleUpdateClause = (
    idx: number,
    field: "title" | "text",
    val: string,
  ) => {
    setData((prev) => ({
      ...prev,
      clauses: (prev.clauses || []).map((c, i) =>
        i === idx ? { ...c, [field]: val } : c,
      ),
    }));
  };

  const handleMoveClause = (idx: number, direction: "up" | "down") => {
    setData((prev) => {
      const clauses = [...(prev.clauses || [])];
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= clauses.length) return prev;
      const temp = clauses[idx];
      clauses[idx] = clauses[targetIdx];
      clauses[targetIdx] = temp;
      const renumbered = clauses.map((c, i) => ({ ...c, number: i + 1 }));
      return { ...prev, clauses: renumbered };
    });
  };

  const handleAddSubItem = (clauseIdx: number) => {
    setData((prev) => ({
      ...prev,
      clauses: (prev.clauses || []).map((c, i) => {
        if (i !== clauseIdx) return c;
        const currentSubs = c.subItems || [];
        return {
          ...c,
          subItems: [...currentSubs, "New specification item"],
        };
      }),
    }));
  };

  const handleRemoveSubItem = (clauseIdx: number, subIdx: number) => {
    setData((prev) => ({
      ...prev,
      clauses: (prev.clauses || []).map((c, i) => {
        if (i !== clauseIdx) return c;
        return {
          ...c,
          subItems: (c.subItems || []).filter((_, s) => s !== subIdx),
        };
      }),
    }));
  };

  const handleUpdateSubItem = (
    clauseIdx: number,
    subIdx: number,
    val: string,
  ) => {
    setData((prev) => ({
      ...prev,
      clauses: (prev.clauses || []).map((c, i) => {
        if (i !== clauseIdx) return c;
        return {
          ...c,
          subItems: (c.subItems || []).map((sub, s) =>
            s === subIdx ? val : sub,
          ),
        };
      }),
    }));
  };

  const handleAddMaterial = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    const nextIdx = data.clientMaterials?.length || 0;
    const nextCode = chars[nextIdx % chars.length] || `item-${nextIdx + 1}`;
    const newMat: ClientMaterialItem = {
      id: `mat-${Date.now()}`,
      code: nextCode,
      label: "Specify Client Material Item",
    };
    setData((prev) => ({
      ...prev,
      clientMaterials: [...(prev.clientMaterials || []), newMat],
    }));
  };

  const handleRemoveMaterial = (id: string) => {
    setData((prev) => ({
      ...prev,
      clientMaterials: (prev.clientMaterials || []).filter((m) => m.id !== id),
    }));
  };

  const handleUpdateMaterial = (id: string, label: string) => {
    setData((prev) => ({
      ...prev,
      clientMaterials: (prev.clientMaterials || []).map((m) =>
        m.id === id ? { ...m, label } : m,
      ),
    }));
  };

  const handleAddMilestone = () => {
    const newMs: PaymentMilestoneItem = {
      id: `ms-${Date.now()}`,
      percentage: 10,
      milestone: "Payment Milestone Stage",
    };
    setData((prev) => ({
      ...prev,
      paymentMilestones: [...(prev.paymentMilestones || []), newMs],
    }));
  };

  const handleRemoveMilestone = (id: string) => {
    setData((prev) => ({
      ...prev,
      paymentMilestones: (prev.paymentMilestones || []).filter(
        (m) => m.id !== id,
      ),
    }));
  };

  const handleUpdateMilestone = (
    id: string,
    field: "percentage" | "milestone",
    val: any,
  ) => {
    setData((prev) => ({
      ...prev,
      paymentMilestones: (prev.paymentMilestones || []).map((m) =>
        m.id === id ? { ...m, [field]: val } : m,
      ),
    }));
  };

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      <div className="print:hidden w-full flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-agm-box-border rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">
            Company Agreement
          </span>
          {data.refNumber && (
            <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              {data.refNumber}
            </span>
          )}
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-agm-green-soft border border-agm-green/20 text-agm-green text-[11px] font-medium rounded-lg animate-fade-in">
            <Check className="w-3.5 h-3.5 text-agm-green" />
            <span>{saveSuccess}</span>
          </div>
        )}

        <div className="flex items-center flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNewBlank}
            className="text-xs flex items-center gap-1.5 border-agm-box-border text-agm-text hover:bg-agm-box-bg cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Blank</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsSavedModalOpen(true)}
            className="text-xs flex items-center gap-1.5 border-agm-box-border text-agm-text hover:bg-agm-box-bg cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>Saved DB ({savedAgreements.length})</span>
          </Button>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="text-xs py-1 px-2.5 bg-slate-50 border border-agm-box-border rounded-lg font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-agm-green cursor-pointer"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>

          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={saveAgreementMutation.isPending}
            onClick={handleSaveToDb}
            className="text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
          >
            {saveAgreementMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>
              {saveAgreementMutation.isPending ? "Saving..." : "Save to DB"}
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadSamplePreset}
            className="text-xs flex items-center gap-1.5 border-agm-box-border text-agm-text hover:bg-agm-box-bg cursor-pointer"
            title="Reset to AGM Sulafa Tower Preset"
          >
            <RefreshIcon className="w-3 h-3" />
            <span>Reset</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="text-xs flex items-center gap-1.5 bg-agm-green hover:bg-agm-green-2 text-white shadow-xs cursor-pointer"
          >
            <PrintIcon className="w-3.5 h-3.5" />
            <span>Print</span>
          </Button>
        </div>
      </div>

      <AgreementSavedModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedAgreements={savedAgreements}
        isLoadingSaved={isLoadingSaved}
        onLoadAgreement={handleLoadAgreement}
        onDeleteAgreement={handleDeleteAgreement}
        onNewBlank={handleNewBlank}
      />

      <input
        type="file"
        ref={contractorFileRef}
        onChange={handleContractorUpload}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={clientFileRef}
        onChange={handleClientUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="overflow-x-auto min-w-0 max-w-full custom-scrollbar print:overflow-visible w-full flex justify-center">
        <div
          className="mx-auto bg-white shadow-lg print:shadow-none max-w-full min-w-full rounded-xl print:rounded-none overflow-visible print:overflow-visible"
          id="printable-voucher"
        >
          <table className="print-page-table w-full border-collapse">
            <thead className="print-page-header-group">
              <tr>
                <th className="p-0 font-normal text-left border-none">
                  <QuotationHeader />
                </th>
              </tr>
            </thead>

            <tfoot className="print-page-footer-group">
              <tr>
                <td className="p-0 border-none align-bottom">
                  <div
                    className="w-full opacity-0 pointer-events-none select-none"
                    style={{ minHeight: "185px" }}
                    aria-hidden="true"
                  >
                    <QuotationFooter />
                    <div style={{ height: "45px", minHeight: "45px" }} />
                  </div>
                </td>
              </tr>
            </tfoot>

            <tbody className="print-page-body-group">
              <tr>
                <td className="p-0 border-none align-top">
                  <div className="w-full px-10 py-6 text-agm-text text-xs sm:text-[13px] leading-relaxed select-text space-y-4 print:px-8 print:py-2 print:space-y-3">
                    {/* Header Document Title & Meta */}
                    <div className="flex flex-col items-center justify-center space-y-1.5 pb-2 border-b border-slate-200">
                      <div className="flex items-center justify-center">
                        <div className="print:hidden">
                          <Input
                            type="text"
                            value={data.title}
                            onChange={(e) =>
                              setData({ ...data, title: e.target.value })
                            }
                            className="text-base sm:text-lg font-black text-neutral-900 tracking-wider text-center uppercase bg-white border-agm-box-border"
                            containerClassName="w-80"
                          />
                        </div>
                        <h1 className="hidden print:block text-base sm:text-lg font-black text-neutral-900 tracking-wider uppercase text-center">
                          {data.title || "AGM FITOUT AGREEMENT"}
                        </h1>
                      </div>

                      <div className="flex items-center gap-1.5 justify-center print:hidden">
                        <span className="italic text-neutral-500 text-xs sm:text-[13px] font-medium">
                          Agreement Ref:
                        </span>
                        <Input
                          type="text"
                          placeholder="Agreement Reference"
                          value={data.refNumber}
                          onChange={(e) =>
                            setData({ ...data, refNumber: e.target.value })
                          }
                          className="font-bold text-xs py-0.5 px-2.5 border-agm-box-border bg-white w-80"
                          containerClassName="w-auto inline-block"
                        />
                      </div>
                      <div className="hidden print:block text-center text-xs sm:text-[13px]">
                        <span className="italic text-neutral-500 font-medium">
                          Agreement Ref:{" "}
                        </span>
                        <strong className="font-bold text-neutral-900">
                          {data.refNumber}
                        </strong>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-neutral-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-500 font-semibold">Date:</span>
                          <div className="print:hidden">
                            <Input
                              type="text"
                              value={data.date}
                              onChange={(e) =>
                                setData({ ...data, date: e.target.value })
                              }
                              className="text-xs py-0.5 px-2 w-28 border-agm-box-border bg-white"
                              containerClassName="w-28 inline-block"
                            />
                          </div>
                          <span className="hidden print:inline font-bold text-neutral-800 font-mono">
                            {data.date}
                          </span>
                        </div>
                        <span className="text-neutral-300">•</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-neutral-500 font-semibold">Copies:</span>
                          <div className="print:hidden">
                            <Input
                              type="number"
                              value={data.copiesCount}
                              onChange={(e) =>
                                setData({
                                  ...data,
                                  copiesCount: Number(e.target.value),
                                })
                              }
                              className="text-xs py-0.5 px-2 w-16 border-agm-box-border bg-white"
                              containerClassName="w-16 inline-block"
                            />
                          </div>
                          <span className="hidden print:inline font-bold text-neutral-800">
                            {data.copiesCount} Original Sets
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Screen Direct Editable Paragraph View */}
                    <div className="space-y-3 text-justify text-xs sm:text-[13px] leading-relaxed text-neutral-800 print:hidden p-3.5 rounded-xl border border-slate-200 bg-slate-50/40">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 flex-wrap leading-loose">
                          <strong className="font-bold text-neutral-900">Contractor :</strong>
                          <Input
                            type="text"
                            placeholder="Company Name"
                            value={data.contractor.name}
                            onChange={(e) =>
                              setData({
                                ...data,
                                contractor: { ...data.contractor, name: e.target.value },
                              })
                            }
                            className="h-6 text-xs font-bold w-36 bg-white"
                            containerClassName="w-auto inline-block"
                          />
                          <span className="text-neutral-500 text-xs">, license number</span>
                          <Input
                            type="text"
                            placeholder="License No"
                            value={data.contractor.licenseNumber || ""}
                            onChange={(e) =>
                              setData({
                                ...data,
                                contractor: { ...data.contractor, licenseNumber: e.target.value },
                              })
                            }
                            className="h-6 text-xs w-28 bg-white"
                            containerClassName="w-auto inline-block"
                          />
                          <span className="text-neutral-500 text-xs">, represented by</span>
                          <Input
                            type="text"
                            placeholder="Representative"
                            value={data.contractor.representative || ""}
                            onChange={(e) =>
                              setData({
                                ...data,
                                contractor: { ...data.contractor, representative: e.target.value },
                                contractorSignatory: { ...data.contractorSignatory, name: e.target.value },
                              })
                            }
                            className="h-6 text-xs w-36 bg-white"
                            containerClassName="w-auto inline-block"
                          />
                          <span className="text-neutral-500 text-xs">, EID</span>
                          <Input
                            type="text"
                            placeholder="EID Number"
                            value={data.contractor.eid || ""}
                            onChange={(e) =>
                              setData({
                                ...data,
                                contractor: { ...data.contractor, eid: e.target.value },
                              })
                            }
                            className="h-6 text-xs w-36 bg-white"
                            containerClassName="w-auto inline-block"
                          />
                          <span className="text-neutral-500 text-xs">, phone</span>
                          <Input
                            type="text"
                            placeholder="Phone"
                            value={data.contractor.phone || ""}
                            onChange={(e) =>
                              setData({
                                ...data,
                                contractor: { ...data.contractor, phone: e.target.value },
                              })
                            }
                            className="h-6 text-xs w-32 bg-white"
                            containerClassName="w-auto inline-block"
                          />
                          <span className="text-neutral-500 text-xs">, e-mail</span>
                          <Input
                            type="text"
                            placeholder="Email"
                            value={data.contractor.email || ""}
                            onChange={(e) =>
                              setData({
                                ...data,
                                contractor: { ...data.contractor, email: e.target.value },
                              })
                            }
                            className="h-6 text-xs w-44 bg-white text-agm-green underline font-medium"
                            containerClassName="w-auto inline-block"
                          />
                          <span className="text-neutral-500 text-xs">, located at</span>
                        </div>
                        <Input
                          type="text"
                          placeholder="Office Address"
                          value={data.contractor.address || ""}
                          onChange={(e) =>
                            setData({
                              ...data,
                              contractor: { ...data.contractor, address: e.target.value },
                            })
                          }
                          className="h-6 text-xs w-full bg-white mt-0.5"
                          containerClassName="w-full block"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-slate-200">
                        <strong className="font-bold text-neutral-900">Client :</strong>
                        <Input
                          type="text"
                          placeholder="Client Name"
                          value={data.client.name}
                          onChange={(e) =>
                            setData({
                              ...data,
                              client: { ...data.client, name: e.target.value },
                              clientSignatory: { ...data.clientSignatory, name: e.target.value },
                            })
                          }
                          className="h-6 text-xs font-bold w-40 bg-white"
                          containerClassName="w-auto inline-block"
                        />
                        <span className="text-neutral-500 text-xs">(EID</span>
                        <Input
                          type="text"
                          placeholder="Client EID"
                          value={data.client.eid || ""}
                          onChange={(e) =>
                            setData({
                              ...data,
                              client: { ...data.client, eid: e.target.value },
                            })
                          }
                          className="h-6 text-xs w-40 bg-white"
                          containerClassName="w-auto inline-block"
                        />
                        <span className="text-neutral-500 text-xs">, phone number</span>
                        <Input
                          type="text"
                          placeholder="Phone Number"
                          value={data.client.phone || ""}
                          onChange={(e) =>
                            setData({
                              ...data,
                              client: { ...data.client, phone: e.target.value },
                            })
                          }
                          className="h-6 text-xs w-36 bg-white"
                          containerClassName="w-auto inline-block"
                        />
                        <span className="text-neutral-500 text-xs">)</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200">
                        <strong className="font-bold text-neutral-900 min-w-[70px]">Property :</strong>
                        <Input
                          type="text"
                          placeholder="Property details and unit location"
                          value={data.property}
                          onChange={(e) => setData({ ...data, property: e.target.value })}
                          className="h-6 text-xs w-full bg-white"
                          containerClassName="w-full flex-1"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200">
                        <strong className="font-bold text-neutral-900 min-w-[70px]">Project :</strong>
                        <Input
                          type="text"
                          placeholder="Project scope summary"
                          value={data.project}
                          onChange={(e) => setData({ ...data, project: e.target.value })}
                          className="h-6 text-xs w-full bg-white"
                          containerClassName="w-full flex-1"
                        />
                      </div>

                      <div className="space-y-1 pt-1.5 border-t border-slate-200">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="font-bold text-neutral-900">Contract Value :</strong>
                          <span className="text-neutral-700 text-xs">The Contract Value agreed between both parties for the Project is</span>
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={data.contractValueNum}
                            onChange={(e) =>
                              setData({ ...data, contractValueNum: Number(e.target.value) })
                            }
                            className="h-6 text-xs font-bold w-32 bg-white"
                            containerClassName="w-auto inline-block"
                          />
                          <span className="font-bold text-neutral-900 text-xs">AED, including VAT.</span>
                        </div>
                        <Input
                          type="text"
                          placeholder="Value in words and additional fixed scope terms"
                          value={data.contractValueText}
                          onChange={(e) => setData({ ...data, contractValueText: e.target.value })}
                          className="h-6 text-xs w-full bg-white"
                          containerClassName="w-full block"
                        />
                      </div>
                    </div>

                    {/* Print & Display Exact Legal Typography View */}
                    <div className="hidden print:block space-y-3 text-justify text-xs sm:text-[13.5px] leading-relaxed text-neutral-800">
                      <p>
                        <strong className="font-bold text-neutral-900">Contractor : </strong>
                        <strong className="font-bold text-neutral-900">{data.contractor.name}</strong>
                        {data.contractor.licenseNumber ? `, license number ${data.contractor.licenseNumber}` : ""}
                        {data.contractor.representative ? `, represented by ${data.contractor.representative}` : ""}
                        {data.contractor.eid ? `, EID ${data.contractor.eid}` : ""}
                        {data.contractor.phone ? `, phone ${data.contractor.phone}` : ""}
                        {data.contractor.email ? (
                          <>
                            , e-mail{" "}
                            <span className="text-agm-green underline underline-offset-2 font-medium">
                              {data.contractor.email}
                            </span>
                          </>
                        ) : (
                          ""
                        )}
                        {data.contractor.address ? `, located at ${data.contractor.address}` : ""}.
                      </p>

                      <p>
                        <strong className="font-bold text-neutral-900">Client : </strong>
                        <strong className="font-bold text-neutral-900">{data.client.name || "Client Name"}</strong>
                        {(data.client.eid || data.client.phone) && (
                          <>
                            {" "}
                            (
                            {[
                              data.client.eid ? `EID ${data.client.eid}` : null,
                              data.client.phone ? `phone number ${data.client.phone}` : null,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                            )
                          </>
                        )}
                        .
                      </p>

                      <p>
                        <strong className="font-bold text-neutral-900">Property : </strong>
                        <span>{data.property}</span>
                      </p>

                      <p>
                        <strong className="font-bold text-neutral-900">Project : </strong>
                        <span>{data.project}</span>
                      </p>

                      <p>
                        <strong className="font-bold text-neutral-900">Contract Value : </strong>
                        <span>The Contract Value agreed between both parties for the Project is </span>
                        <strong className="font-bold text-neutral-900">
                          {Number(data.contractValueNum || 0).toLocaleString()} AED
                        </strong>
                        <span>, including VAT. {data.contractValueText}</span>
                      </p>
                    </div>

                    <div className="pt-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-agm-text text-xs">
                          Both parties agree to the following terms and conditions:
                        </p>
                        {isEditing && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddClause}
                            className="text-xs flex items-center gap-1 border-dashed border-agm-green text-agm-green hover:bg-agm-green-soft py-0.5 px-2"
                          >
                            <Plus size={12} />
                            <span>Add Clause</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-justify leading-[1.5]">
                      {data.clauses && data.clauses.length > 0 ? (
                        data.clauses.map((clause, idx) => (
                          <div
                            key={clause.id || `clause-${idx}`}
                            className="space-y-1 transition break-inside-avoid page-break-inside-avoid print:break-inside-avoid"
                            style={{
                              breakInside: "avoid",
                              pageBreakInside: "avoid",
                            }}
                          >
                            {/* On-screen editable clause */}
                            <div className="space-y-1.5 p-2 rounded-lg border border-slate-200 bg-slate-50/60 relative group print:hidden">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-1">
                                  <span className="font-mono font-bold text-[11px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded">
                                    #{clause.number || idx + 1}
                                  </span>
                                  <Input
                                    type="text"
                                    placeholder="Clause Title (e.g. Identification and Documentation)"
                                    value={clause.title || ""}
                                    onChange={(e) =>
                                      handleUpdateClause(
                                        idx,
                                        "title",
                                        e.target.value,
                                      )
                                    }
                                    className="font-bold text-xs py-0.5 px-2 border-agm-box-border bg-white flex-1"
                                    containerClassName="flex-1"
                                  />
                                </div>

                                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveClause(idx, "up")}
                                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-600"
                                    title="Move Up"
                                  >
                                    <ChevronUp size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === data.clauses.length - 1}
                                    onClick={() =>
                                      handleMoveClause(idx, "down")
                                    }
                                    className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-600"
                                    title="Move Down"
                                  >
                                    <ChevronDown size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveClause(idx)}
                                    className="p-1 rounded hover:bg-rose-100 text-rose-600"
                                    title="Remove Clause"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>

                              <textarea
                                rows={2}
                                placeholder="Clause text and legal provisions..."
                                value={clause.text}
                                onChange={(e) =>
                                  handleUpdateClause(
                                    idx,
                                    "text",
                                    e.target.value,
                                  )
                                }
                                className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-agm-green resize-y font-sans leading-relaxed text-slate-800"
                              />

                              <div className="space-y-1 pl-2 border-l-2 border-slate-200">
                                {clause.subItems &&
                                  clause.subItems.map((sub, sIdx) => (
                                    <div
                                      key={sIdx}
                                      className="flex items-center gap-1.5"
                                    >
                                      <span className="text-[10px] font-mono text-slate-500">
                                        {String.fromCharCode(97 + sIdx)}.
                                      </span>
                                      <Input
                                        type="text"
                                        value={sub}
                                        onChange={(e) =>
                                          handleUpdateSubItem(
                                            idx,
                                            sIdx,
                                            e.target.value,
                                          )
                                        }
                                        className="text-xs py-0.5 px-2 bg-white border-slate-200 flex-1"
                                        containerClassName="flex-1"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveSubItem(idx, sIdx)
                                        }
                                        className="p-0.5 text-slate-400 hover:text-rose-600"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  ))}

                                <button
                                  type="button"
                                  onClick={() => handleAddSubItem(idx)}
                                  className="text-[10px] font-medium text-agm-green hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  <Plus size={10} /> Add Sub-Item Line
                                </button>
                              </div>
                            </div>

                            {/* Print clean formatted clause view */}
                            <div className="hidden print:block text-xs sm:text-[13px] text-neutral-800 space-y-0.5">
                              <p className="font-bold text-neutral-900">
                                {clause.number || idx + 1}. {clause.title || ""}
                              </p>
                              <p className="leading-relaxed">{clause.text}</p>
                              {clause.subItems && clause.subItems.length > 0 && (
                                <div className="pl-4 space-y-0.5 pt-0.5">
                                  {clause.subItems.map((sub, sIdx) => (
                                    <p key={sIdx}>
                                      {String.fromCharCode(97 + sIdx)}. {sub}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-slate-400 text-xs">
                          No clauses in this agreement. Click &quot;Add
                          Clause&quot; above to add contract terms.
                        </div>
                      )}

                      <div className="pt-1 flex justify-center print:hidden">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddClause}
                          className="text-xs flex items-center gap-1 border-dashed border-agm-green text-agm-green hover:bg-agm-green-soft px-3 py-1"
                        >
                          <Plus size={13} />
                          <span>Add Another Clause Line</span>
                        </Button>
                      </div>
                    </div>

                    <div
                      className="pt-4 border-t border-agm-box-border/80 break-inside-avoid page-break-inside-avoid print:break-inside-avoid"
                      style={{
                        breakInside: "avoid",
                        pageBreakInside: "avoid",
                      }}
                    >
                      <div className="grid grid-cols-2 gap-4 sm:gap-8 pt-1">
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-xs text-agm-text">
                            Contractor
                          </h4>
                          <div className="space-y-0.5 text-xs text-agm-muted">
                            <p className="font-semibold text-agm-text">
                              {data.contractor.name}
                            </p>
                            <p>
                              Rep:{" "}
                              {data.contractor.representative ||
                                data.contractorSignatory.name}
                            </p>
                            <p>Date: {data.date}</p>
                          </div>

                          <div
                            onClick={() => contractorFileRef.current?.click()}
                            className="w-full h-16 border border-dashed border-agm-box-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-agm-green hover:bg-agm-box-bg/50 transition-colors relative overflow-hidden group print:border-none print:bg-transparent print:h-14"
                          >
                            {contractorSignatureImg ? (
                              <>
                                <img
                                  src={contractorSignatureImg}
                                  alt="Contractor Signature"
                                  className="max-h-full max-w-full object-contain p-1"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-medium gap-1 print:hidden">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Change</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex flex-col items-center gap-0.5 text-agm-muted group-hover:text-agm-green transition-colors print:hidden">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span className="text-[10px]">
                                    Upload Signature / Stamp
                                  </span>
                                </div>
                                <div className="hidden print:flex w-full h-full items-end justify-center pb-1">
                                  <span className="text-[10px] text-neutral-400 border-t border-neutral-300 w-3/4 text-center pt-0.5">
                                    Authorized Signature &amp; Stamp
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="font-bold text-xs text-agm-text">
                            Client
                          </h4>
                          <div className="space-y-0.5 text-xs text-agm-muted">
                            <p className="font-semibold text-agm-text">
                              {data.client.name || "Client"}
                            </p>
                            <p>EID: {data.client.eid || "N/A"}</p>
                            <p>Date: {data.date}</p>
                          </div>

                          <div
                            onClick={() => clientFileRef.current?.click()}
                            className="w-full h-16 border border-dashed border-agm-box-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-agm-green hover:bg-agm-box-bg/50 transition-colors relative overflow-hidden group print:border-none print:bg-transparent print:h-14"
                          >
                            {clientSignatureImg ? (
                              <>
                                <img
                                  src={clientSignatureImg}
                                  alt="Client Signature"
                                  className="max-h-full max-w-full object-contain p-1"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-medium gap-1 print:hidden">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Change</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex flex-col items-center gap-0.5 text-agm-muted group-hover:text-agm-green transition-colors print:hidden">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span className="text-[10px]">
                                    Upload Client Signature
                                  </span>
                                </div>
                                <div className="hidden print:flex w-full h-full items-end justify-center pb-1">
                                  <span className="text-[10px] text-neutral-400 border-t border-neutral-300 w-3/4 text-center pt-0.5">
                                    Client Signature
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="print-footer-bottom fixed-print-footer hidden print:block">
            <QuotationFooter />
          </div>

          <div className="w-full px-10 pb-6 print:hidden">
            <QuotationFooter className="mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

