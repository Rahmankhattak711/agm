"use client";

import React, { useState, useEffect } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import {
  FileCheckIcon,
  PrintIcon,
  RefreshIcon,
  EditIcon,
  CheckIcon,
  CloseIcon,
  PlusIcon,
  FolderOpenIcon,
  SaveIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SpinnerIcon,
  ChevronLeftIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import QuotationHeader from "@/components/quotation/QuotationHeader";
import QuotationFooter from "@/components/quotation/QuotationFooter";
import {
  RiskAssessmentDocumentData,
  RiskAssessmentItem,
  SAMPLE_RISK_ASSESSMENT,
  DEFAULT_RISK_ITEMS,
} from "./risk-assessment-constants";
import {
  useRiskAssessments,
  useSaveRiskAssessment,
  useDeleteRiskAssessment,
  RiskAssessmentRecord,
} from "@/lib/hooks/api-hooks";
import { RiskAssessmentSavedModal } from "./RiskAssessmentSavedModal";

interface RiskAssessmentTemplateProps {
  initialData?: RiskAssessmentDocumentData;
  onSave?: (data: RiskAssessmentDocumentData) => void;
  readOnly?: boolean;
}

export default function RiskAssessmentTemplate({
  initialData,
  onSave,
  readOnly = false,
}: RiskAssessmentTemplateProps) {
  const [data, setData] = useState<RiskAssessmentDocumentData>(
    initialData || SAMPLE_RISK_ASSESSMENT,
  );
  const [isEditing, setIsEditing] = useState<boolean>(!readOnly);
  const [saveSuccess, setSaveSuccess] = useState<string>("");
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "COMPLETED">(
    (data.status as any) || "COMPLETED",
  );

  const { data: savedRecords = [], isLoading: isLoadingSaved } =
    useRiskAssessments();
  const saveMutation = useSaveRiskAssessment();
  const deleteMutation = useDeleteRiskAssessment();

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setStatus(initialData.status || "COMPLETED");
    }
  }, [initialData]);

  const handlePrint = () => {
    window.print();
  };

  const handleNewBlank = () => {
    const freshYear = new Date().getFullYear();
    const freshSeq = Date.now().toString().slice(-4);
    const newDoc: RiskAssessmentDocumentData = {
      id: `ra-${Date.now()}`,
      refNumber: `QR: Q-${freshSeq}.R1`,
      date: new Date().toLocaleDateString("en-GB"),
      status: "DRAFT",
      customerName: "",
      projectName: "",
      phoneNumber: "+971 ",
      projectLocation: "Dubai, UAE",
      startDate: new Date().toLocaleDateString("en-GB"),
      duration: "15 to 20 working days",
      workingHours: "Mon to Sat (08:00 - 05:00)",
      projectManager: {
        name: "Muhamed Assem",
        description:
          "The Site Manager shall be responsible for the over-all direction, coordination and control of all site activities and all construction works.",
      },
      constructionManager: {
        name: "Bilal Barah",
        description:
          "The Construction Manager shall report to Site Manager, developing and arranging the site construction team to the site necessary to manage and supervise the construction work including HSE and quality control, overall implementation and monitoring of all the activities for the successful completion of construction works.",
      },
      purpose:
        "This risk assessment gives guidelines contained herein to ensure that the job execution complies with the requirement of the specification and the authorities concerned and serves the intended purpose to satisfactory level.",
      scope:
        "Covers the nature and sequence of activities for interior renovation and construction works as itemized in the risk register below.",
      items: [
        {
          id: `risk-${Date.now()}-1`,
          activity:
            "1. Preparing the site: covering doors, door frames, floor protection, etc.",
          riskDescription: "No Risk",
          impact: "None",
          mitigation: "Standard site prep and floor protection procedures.",
        },
      ],
    };

    setData(newDoc);
    setStatus("DRAFT");
    setIsEditing(true);
    setSaveSuccess("Initialized blank Risk Assessment template!");
    setTimeout(() => setSaveSuccess(""), 3000);
  };

  const handleSaveToDb = async () => {
    try {
      const payload: RiskAssessmentRecord = {
        ...data,
        status: status,
      };

      const result = await saveMutation.mutateAsync(payload);
      setData((prev) => ({
        ...prev,
        id: result.id,
        status: result.status,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        createdBy: result.createdBy,
      }));

      if (onSave) {
        onSave(result);
      }

      setSaveSuccess(`Successfully saved ${result.refNumber} to database!`);
      setTimeout(() => setSaveSuccess(""), 4000);
    } catch (err: any) {
      alert(
        "Failed to save risk assessment: " + (err.message || "Unknown error"),
      );
    }
  };

  const handleLoadRecord = (record: RiskAssessmentRecord) => {
    setData(record);
    setStatus(record.status || "COMPLETED");
    setIsSavedModalOpen(false);
    setSaveSuccess(
      `Loaded ${record.refNumber} (${record.customerName || "Customer"})`,
    );
    setTimeout(() => setSaveSuccess(""), 3000);
  };

  const handleDeleteRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !confirm(
        "Are you sure you want to permanently delete this Risk Assessment from the database?",
      )
    ) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      if (data.id === id) {
        handleNewBlank();
      }
    } catch (err: any) {
      alert("Error deleting record: " + (err.message || "Unknown error"));
    }
  };

  const loadSamplePreset = () => {
    setData(SAMPLE_RISK_ASSESSMENT);
    setStatus("COMPLETED");
    setSaveSuccess("Loaded Matthysen Studio Risk Assessment Preset!");
    setTimeout(() => setSaveSuccess(""), 3000);
  };

  const handleAddItem = () => {
    const nextNum = (data.items?.length || 0) + 1;
    const newItem: RiskAssessmentItem = {
      id: `risk-${Date.now()}`,
      activity: `${nextNum}. Activity description here`,
      riskDescription: "No Risk",
      impact: "None",
      mitigation: "Standard precautions and supervision.",
    };
    setData((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const handleRemoveItem = (idx: number) => {
    setData((prev) => {
      const remaining = (prev.items || []).filter((_, i) => i !== idx);
      return {
        ...prev,
        items: remaining,
      };
    });
  };

  const handleMoveItem = (idx: number, direction: "up" | "down") => {
    const items = [...(data.items || [])];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const temp = items[idx];
    items[idx] = items[targetIdx];
    items[targetIdx] = temp;
    setData((prev) => ({ ...prev, items }));
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-agm-box-border rounded-xl shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">
            Risk Assessment
          </span>
          {data.refNumber && (
            <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              {data.refNumber}
            </span>
          )}
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in">
            <CheckIcon size={14} className="text-emerald-600 font-bold" />
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
            <PlusIcon size={14} />
            <span>New Blank</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsSavedModalOpen(true)}
            className="text-xs flex items-center gap-1.5 border-agm-box-border text-agm-text hover:bg-agm-box-bg cursor-pointer"
          >
            <FolderOpenIcon size={14} className="text-amber-600" />
            <span>Saved DB ({savedRecords.length})</span>
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
            disabled={saveMutation.isPending}
            onClick={handleSaveToDb}
            className="text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
          >
            {saveMutation.isPending ? (
              <SpinnerIcon size={14} className="animate-spin" />
            ) : (
              <SaveIcon size={14} />
            )}
            <span>{saveMutation.isPending ? "Saving..." : "Save to DB"}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadSamplePreset}
            className="text-xs flex items-center gap-1.5 border-agm-box-border text-agm-text hover:bg-agm-box-bg cursor-pointer"
            title="Reset to Matthysen Studio Preset"
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

      <RiskAssessmentSavedModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedRecords={savedRecords}
        isLoadingSaved={isLoadingSaved}
        onLoadRecord={handleLoadRecord}
        onDeleteRecord={handleDeleteRecord}
        onNewBlank={handleNewBlank}
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
                  <QuotationHeader fullWidthPrint />
                </th>
              </tr>
            </thead>

            <tfoot className="print-page-footer-group">
              <tr>
                <td className="p-0 border-none align-bottom">
                  <div
                    className="w-full opacity-0 pointer-events-none select-none"
                    style={{ minHeight: "115px" }}
                    aria-hidden="true"
                  >
                    <QuotationFooter />
                  </div>
                </td>
              </tr>
            </tfoot>

            <tbody>
              <tr>
                <td className="p-0 border-none align-top">
                  <div className="w-full px-10 py-6 text-agm-text text-xs sm:text-[13px] print:px-0 print:py-0 space-y-4 print:space-y-3">
                    <div className="w-full bg-agm-green text-white text-center py-2.5 px-4 print:py-1.5 print:px-3 font-bold text-sm sm:text-base tracking-wider uppercase shadow-xs">
                      PROJECT RISK ASSESSMENT
                    </div>

                    <div className="w-full border border-slate-200 print:border-y print:border-x-0 print:border-slate-300 overflow-hidden text-xs sm:text-[13px] break-inside-avoid print:break-inside-avoid">
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 print:divide-slate-300">
                        <div className="divide-y divide-slate-200">
                          <div className="grid grid-cols-3 p-2 bg-slate-50/60 items-center">
                            <span className="font-bold text-slate-900 col-span-1">
                              QR Ref No.:
                            </span>
                            <div className="col-span-2">
                              <div className="print:hidden">
                                <Input
                                  value={data.refNumber}
                                  onChange={(e) =>
                                    setData({
                                      ...data,
                                      refNumber: e.target.value,
                                    })
                                  }
                                  className="h-7 text-xs bg-white"
                                />
                              </div>
                              <span className="hidden print:inline font-semibold text-slate-900">
                                {data.refNumber}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 p-2 items-center">
                            <span className="font-bold text-slate-900 col-span-1">
                              Customer Name:
                            </span>
                            <div className="col-span-2">
                              <div className="print:hidden">
                                <Input
                                  value={data.customerName}
                                  onChange={(e) =>
                                    setData({
                                      ...data,
                                      customerName: e.target.value,
                                    })
                                  }
                                  className="h-7 text-xs bg-white"
                                />
                              </div>
                              <span className="hidden print:inline font-medium text-slate-800">
                                {data.customerName}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 p-2 bg-slate-50/60 items-center">
                            <span className="font-bold text-slate-900 col-span-1">
                              Phone Number:
                            </span>
                            <div className="col-span-2">
                              <div className="print:hidden">
                                <Input
                                  value={data.phoneNumber}
                                  onChange={(e) =>
                                    setData({
                                      ...data,
                                      phoneNumber: e.target.value,
                                    })
                                  }
                                  className="h-7 text-xs bg-white"
                                />
                              </div>
                              <span className="hidden print:inline text-slate-800">
                                {data.phoneNumber}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 p-2 items-center">
                            <span className="font-bold text-slate-900 col-span-1">
                              Project Starting Date:
                            </span>
                            <div className="col-span-2">
                              <div className="print:hidden">
                                <Input
                                  value={data.startDate}
                                  onChange={(e) =>
                                    setData({
                                      ...data,
                                      startDate: e.target.value,
                                    })
                                  }
                                  className="h-7 text-xs bg-white"
                                />
                              </div>
                              <span className="hidden print:inline text-slate-800">
                                {data.startDate}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 p-2 bg-slate-50/60 items-center">
                            <span className="font-bold text-slate-900 col-span-1">
                              Working Hours:
                            </span>
                            <div className="col-span-2">
                              <div className="print:hidden">
                                <Input
                                  value={data.workingHours}
                                  onChange={(e) =>
                                    setData({
                                      ...data,
                                      workingHours: e.target.value,
                                    })
                                  }
                                  className="h-7 text-xs bg-white"
                                />
                              </div>
                              <span className="hidden print:inline text-slate-800">
                                {data.workingHours}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="divide-y divide-slate-200">
                          <div className="grid grid-cols-3 p-2 bg-slate-50/60 items-center">
                            <span className="font-bold text-slate-900 col-span-1">
                              Date:
                            </span>
                            <div className="col-span-2">
                              <div className="print:hidden">
                                <Input
                                  value={data.date}
                                  onChange={(e) =>
                                    setData({ ...data, date: e.target.value })
                                  }
                                  className="h-7 text-xs bg-white"
                                />
                              </div>
                              <span className="hidden print:inline font-medium text-slate-800">
                                {data.date}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 p-2 items-center">
                            <span className="font-bold text-slate-900 col-span-1">
                              Project Name:
                            </span>
                            <div className="col-span-2">
                              <div className="print:hidden">
                                <Input
                                  value={data.projectName}
                                  onChange={(e) =>
                                    setData({
                                      ...data,
                                      projectName: e.target.value,
                                    })
                                  }
                                  className="h-7 text-xs bg-white"
                                />
                              </div>
                              <span className="hidden print:inline font-semibold text-slate-900">
                                {data.projectName}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 p-2 bg-slate-50/60 items-center">
                            <span className="font-bold text-slate-900 col-span-1">
                              Project Location:
                            </span>
                            <div className="col-span-2">
                              <div className="print:hidden">
                                <Input
                                  value={data.projectLocation}
                                  onChange={(e) =>
                                    setData({
                                      ...data,
                                      projectLocation: e.target.value,
                                    })
                                  }
                                  className="h-7 text-xs bg-white"
                                />
                              </div>
                              <span className="hidden print:inline text-slate-800">
                                {data.projectLocation}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 p-2 items-center">
                            <span className="font-bold text-slate-900 col-span-1">
                              Project Duration:
                            </span>
                            <div className="col-span-2">
                              <div className="print:hidden">
                                <Input
                                  value={data.duration}
                                  onChange={(e) =>
                                    setData({
                                      ...data,
                                      duration: e.target.value,
                                    })
                                  }
                                  className="h-7 text-xs bg-white"
                                />
                              </div>
                              <span className="hidden print:inline text-slate-800">
                                {data.duration}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 p-2 bg-slate-50/60 items-center">
                            <span className="font-bold text-slate-900 col-span-1">
                              Status:
                            </span>
                            <div className="col-span-2">
                              <span
                                className={`inline-block font-bold text-xs px-2.5 py-0.5 rounded border ${
                                  status === "COMPLETED"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : status === "ACTIVE"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                {status === "COMPLETED" ? "Approved" : status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 print:space-y-3 print:px-4">
                      <div className="space-y-3 pt-1 break-inside-avoid print:break-inside-avoid">
                        <div className="border border-slate-200 rounded-sm overflow-hidden">
                          <div className="bg-agm-green text-white font-bold px-3 py-1.5 text-xs sm:text-[13px] flex items-center justify-between">
                            <span>Project Manager</span>
                          </div>
                          <div className="p-3 bg-white space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs sm:text-[13px] min-w-[130px]">
                                Project Manager:
                              </span>
                              <div className="flex-1 print:hidden">
                                <Input
                                  value={data.projectManager?.name}
                                  onChange={(e) =>
                                    setData({
                                      ...data,
                                      projectManager: {
                                        ...data.projectManager,
                                        name: e.target.value,
                                      },
                                    })
                                  }
                                  className="h-7 text-xs w-full"
                                />
                              </div>
                              <span className="hidden print:inline font-semibold text-slate-900">
                                {data.projectManager?.name}
                              </span>
                            </div>
                            <div className="print:hidden">
                              <Textarea
                                value={data.projectManager?.description}
                                onChange={(e) =>
                                  setData({
                                    ...data,
                                    projectManager: {
                                      ...data.projectManager,
                                      description: e.target.value,
                                    },
                                  })
                                }
                                className="text-xs min-h-[44px]"
                              />
                            </div>
                            <p className="hidden print:block text-xs text-slate-600 italic leading-relaxed pt-0.5">
                              {data.projectManager?.description}
                            </p>
                          </div>
                        </div>

                        <div className="border border-slate-200 rounded-sm overflow-hidden">
                          <div className="bg-[#f0f7f3] text-agm-green font-bold px-3 py-1.5 text-xs sm:text-[13px] border-b border-slate-200 flex items-center justify-between">
                            <span>Construction Manager</span>
                          </div>
                          <div className="p-3 bg-white space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs sm:text-[13px] min-w-[150px]">
                                Construction Manager:
                              </span>
                              <div className="flex-1 print:hidden">
                                <Input
                                  value={data.constructionManager?.name}
                                  onChange={(e) =>
                                    setData({
                                      ...data,
                                      constructionManager: {
                                        ...data.constructionManager,
                                        name: e.target.value,
                                      },
                                    })
                                  }
                                  className="h-7 text-xs w-full"
                                />
                              </div>
                              <span className="hidden print:inline font-semibold text-slate-900">
                                {data.constructionManager?.name}
                              </span>
                            </div>
                            <div className="print:hidden">
                              <Textarea
                                value={data.constructionManager?.description}
                                onChange={(e) =>
                                  setData({
                                    ...data,
                                    constructionManager: {
                                      ...data.constructionManager,
                                      description: e.target.value,
                                    },
                                  })
                                }
                                className="text-xs min-h-[55px]"
                              />
                            </div>
                            <p className="hidden print:block text-xs text-slate-600 italic leading-relaxed pt-0.5">
                              {data.constructionManager?.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1 break-inside-avoid print:break-inside-avoid">
                        <div className="bg-agm-green text-white font-bold px-3 py-1.5 text-xs sm:text-[13px] uppercase tracking-wide">
                          PURPOSE & SCOPE
                        </div>

                        <div className="border border-slate-200 p-3 bg-slate-50/40 space-y-2.5">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 text-xs">
                              Purpose:
                            </div>
                            <div className="print:hidden">
                              <Textarea
                                value={data.purpose}
                                onChange={(e) =>
                                  setData({ ...data, purpose: e.target.value })
                                }
                                className="text-xs min-h-[44px] bg-white"
                              />
                            </div>
                            <p className="hidden print:block text-xs text-slate-700 leading-relaxed">
                              {data.purpose}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 text-xs">
                              Scope:
                            </div>
                            <div className="print:hidden">
                              <Textarea
                                value={data.scope}
                                onChange={(e) =>
                                  setData({ ...data, scope: e.target.value })
                                }
                                className="text-xs min-h-[44px] bg-white"
                              />
                            </div>
                            <p className="hidden print:block text-xs text-slate-700 leading-relaxed">
                              {data.scope}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-slate-300 text-xs sm:text-[13px]">
                            <thead>
                              <tr className="bg-agm-green text-white text-left font-semibold">
                                <th className="p-2.5 border border-agm-green-2 text-left w-[28%]">
                                  Activity / Scope of Work
                                </th>
                                <th className="p-2.5 border border-agm-green-2 text-left w-[26%]">
                                  Description of Risk
                                </th>
                                <th className="p-2.5 border border-agm-green-2 text-left w-[18%]">
                                  Impact on Project
                                </th>
                                <th className="p-2.5 border border-agm-green-2 text-left w-[28%]">
                                  Containment / Mitigation Action
                                </th>
                                <th className="p-2.5 border border-agm-green-2 text-center w-[40px] print:hidden">
                                  Act
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {data.items?.map((item, idx) => (
                                <tr
                                  key={item.id || idx}
                                  className={`break-inside-avoid page-break-inside-avoid print:break-inside-avoid ${
                                    idx % 2 === 1
                                      ? "bg-slate-50/50"
                                      : "bg-white"
                                  } hover:bg-slate-100/50 transition-colors`}
                                >
                                  <td className="p-2.5 border border-slate-200 align-top text-slate-800 font-medium leading-relaxed">
                                    <div className="print:hidden">
                                      <Textarea
                                        value={item.activity}
                                        onChange={(e) => {
                                          const updated = [...data.items];
                                          updated[idx].activity =
                                            e.target.value;
                                          setData({ ...data, items: updated });
                                        }}
                                        className="text-xs min-h-[44px] bg-white"
                                      />
                                    </div>
                                    <div className="hidden print:block font-medium text-slate-900 leading-relaxed whitespace-pre-wrap">
                                      {item.activity}
                                    </div>
                                  </td>

                                  <td className="p-2.5 border border-slate-200 align-top text-slate-700 leading-relaxed">
                                    <div className="print:hidden">
                                      <Textarea
                                        value={item.riskDescription}
                                        onChange={(e) => {
                                          const updated = [...data.items];
                                          updated[idx].riskDescription =
                                            e.target.value;
                                          setData({ ...data, items: updated });
                                        }}
                                        className="text-xs min-h-[44px] bg-white"
                                      />
                                    </div>
                                    <div className="hidden print:block text-slate-700 leading-relaxed whitespace-pre-wrap">
                                      {item.riskDescription}
                                    </div>
                                  </td>

                                  <td className="p-2.5 border border-slate-200 align-top text-slate-700 leading-relaxed">
                                    <div className="print:hidden">
                                      <Textarea
                                        value={item.impact}
                                        onChange={(e) => {
                                          const updated = [...data.items];
                                          updated[idx].impact = e.target.value;
                                          setData({ ...data, items: updated });
                                        }}
                                        className="text-xs min-h-[44px] bg-white"
                                      />
                                    </div>
                                    <div className="hidden print:block text-slate-700 leading-relaxed whitespace-pre-wrap">
                                      {item.impact}
                                    </div>
                                  </td>

                                  <td className="p-2.5 border border-slate-200 align-top text-slate-700 leading-relaxed">
                                    <div className="print:hidden">
                                      <Textarea
                                        value={item.mitigation}
                                        onChange={(e) => {
                                          const updated = [...data.items];
                                          updated[idx].mitigation =
                                            e.target.value;
                                          setData({ ...data, items: updated });
                                        }}
                                        className="text-xs min-h-[44px] bg-white"
                                      />
                                    </div>
                                    <div className="hidden print:block text-slate-700 leading-relaxed whitespace-pre-wrap">
                                      {item.mitigation}
                                    </div>
                                  </td>

                                  {isEditing && (
                                    <td className="p-1 border border-slate-200 align-top text-center print:hidden">
                                      <div className="flex flex-col items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleMoveItem(idx, "up")
                                          }
                                          disabled={idx === 0}
                                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                          title="Move Up"
                                        >
                                          <ArrowUpIcon size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleMoveItem(idx, "down")
                                          }
                                          disabled={
                                            idx === data.items.length - 1
                                          }
                                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                          title="Move Down"
                                        >
                                          <ArrowDownIcon size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveItem(idx)}
                                          className="p-0.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                                          title="Remove Row"
                                        >
                                          <TrashIcon size={13} />
                                        </button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {isEditing && (
                          <div className="pt-1 print:hidden">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAddItem}
                              className="text-xs flex items-center gap-1 text-agm-green border-dashed border-agm-green/50 hover:bg-agm-green-soft cursor-pointer"
                            >
                              <PlusIcon size={13} />
                              <span>Add Risk Assessment Row</span>
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 print:pt-2 text-center border-t border-slate-100 print:border-slate-200">
                        <p className="text-[11px] print:text-[10px] text-slate-500 font-medium italic">
                          *** This is an official system-generated document and
                          does not require a physical signature or stamp. ***
                        </p>
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
