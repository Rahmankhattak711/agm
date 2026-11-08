import { formatUaePhone } from "@/lib/utils/phone";
"use client";

import React, { useState, useEffect } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import {
  FileCheckIcon,
  PrintIcon,
  RefreshIcon,
  EditIcon,
  FolderOpenIcon,
  SaveIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SpinnerIcon,
  CheckIcon,
  FileTextIcon,
  ChevronLeftIcon,
} from "@/components/icons";
import QuotationHeader from "@/components/quotation/QuotationHeader";
import QuotationFooter from "@/components/quotation/QuotationFooter";
import {
  MethodStatementDocumentData,
  MethodStatementScopeItem,
  SAMPLE_METHOD_STATEMENT,
  DEFAULT_METHOD_STATEMENT_ITEMS,
} from "./method-statement-constants";
import {
  useMethodStatements,
  useSaveMethodStatement,
  useDeleteMethodStatement,
  MethodStatementRecord,
} from "@/lib/hooks/api-hooks";
import { toast } from "@/lib/toast";
import {
  formatPdfDocumentTitle,
  printWithDocumentTitle,
} from "@/lib/utils/format";
import { useConfirm } from "@/context/ConfirmContext";
import { MethodStatementSavedModal } from "./MethodStatementSavedModal";

interface MethodStatementTemplateProps {
  initialData?: MethodStatementDocumentData;
  onSave?: (data: MethodStatementDocumentData) => void;
  readOnly?: boolean;
}

export default function MethodStatementTemplate({
  initialData,
  onSave,
  readOnly = false,
}: MethodStatementTemplateProps) {
  const [data, setData] = useState<MethodStatementDocumentData>(
    initialData || SAMPLE_METHOD_STATEMENT,
  );
  const [isEditing, setIsEditing] = useState<boolean>(!readOnly);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "COMPLETED">(
    (data.status as any) || "COMPLETED",
  );

  const { data: savedRecords = [], isLoading: isLoadingSaved } =
    useMethodStatements();
  const saveMutation = useSaveMethodStatement();
  const deleteMutation = useDeleteMethodStatement();
  const { confirm } = useConfirm();

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setStatus(initialData.status || "COMPLETED");
    }
  }, [initialData]);

  const handlePrint = () => {
    const printTitle = formatPdfDocumentTitle(
      [data.refNumber, data.customerName, data.projectName],
      "AGM-Method-Statement",
    );
    printWithDocumentTitle(printTitle);
  };

  const handleNewBlank = () => {
    const freshYear = new Date().getFullYear();
    const freshSeq = Date.now().toString().slice(-4);
    const newDoc: MethodStatementDocumentData = {
      id: `ms-${Date.now()}`,
      refNumber: `QR: Q-${freshSeq}.R1`,
      date: new Date().toLocaleDateString("en-GB"),
      status: "DRAFT",
      customerName: "",
      projectName: "",
      phoneNumber: "+971 ",
      customerEmail: "N/A",
      projectLocation: "Dubai, UAE",
      workType: "General Renovation & Fitout Work",
      startDate: new Date().toLocaleDateString("en-GB"),
      duration: "15 to 20 working days",
      workingHours: "Mon to Sat 8 to 5",
      projectManager: {
        name: "Mr. MD Assem",
        description:
          "The Site Manager shall be responsible for the over-all direction, coordination and control of all site activities and all construction works.",
      },
      constructionManager: {
        name: "Mr. Bilal Barah",
        description:
          "The Construction Manager shall report to Site Manager, developing and arranging the site construction team to the site necessary to manage and supervise the construction works including HSE and quality control, overall implementation and monitoring of all the activities for the successful completion of construction works.",
      },
      introduction:
        "This method statement details the method of performing the various activities involved in the course of works for renovation work.",
      purpose:
        "This method statement gives guidelines contained herein so as to ensure that the job execution complies with the requirement of the specification and the authorities concerned and serves the intended purpose to satisfactory level.",
      scopeOverview:
        "This method statement covers the nature and type of work for renovation works includes.",
      items: [
        {
          id: `ms-item-${Date.now()}-1`,
          number: 1,
          description:
            "Careful removal and disposal of existing structures and preparation of site work.",
        },
      ],
    };

    setData(newDoc);
    setStatus("DRAFT");
    setIsEditing(true);
    toast.info("Initialized blank Method Statement template!");
  };

  const handleSaveToDb = async () => {
    try {
      const payload: MethodStatementRecord = {
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

      toast.success(`Successfully saved ${result.refNumber} to database!`);
    } catch (err: any) {
      toast.error(
        "Failed to save method statement: " + (err.message || "Unknown error"),
      );
    }
  };

  const handleLoadRecord = (record: MethodStatementRecord) => {
    setData(record);
    setStatus(record.status || "COMPLETED");
    setIsSavedModalOpen(false);
    toast.info(
      `Loaded ${record.refNumber} (${record.customerName || "Customer"})`,
    );
  };

  const handleDeleteRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: "Delete Method Statement",
      message:
        "Are you sure you want to permanently delete this Method Statement from the database?",
      variant: "danger",
      confirmText: "Delete",
    });
    if (!isConfirmed) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Method statement deleted successfully");
      if (data.id === id) {
        handleNewBlank();
      }
    } catch (err: any) {
      toast.error("Error deleting record: " + (err.message || "Unknown error"));
    }
  };

  const loadSamplePreset = () => {
    setData(SAMPLE_METHOD_STATEMENT);
    setStatus("COMPLETED");
    toast.success("Loaded Matthysen Studio Method Statement Preset!");
  };

  const handleAddItem = () => {
    const nextNum = (data.items?.length || 0) + 1;
    const newItem: MethodStatementScopeItem = {
      id: `ms-item-${Date.now()}`,
      number: nextNum,
      description: "Scope step description and execution procedure.",
    };
    setData((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const handleRemoveItem = (idx: number) => {
    setData((prev) => {
      const remaining = (prev.items || []).filter((_, i) => i !== idx);
      const renumbered = remaining.map((it, i) => ({
        ...it,
        number: i + 1,
      }));
      return {
        ...prev,
        items: renumbered,
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
    const renumbered = items.map((it, i) => ({
      ...it,
      number: i + 1,
    }));
    setData((prev) => ({ ...prev, items: renumbered }));
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-agm-box-border rounded-xl shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">
            Method Statement
          </span>
          {data.refNumber && (
            <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              {data.refNumber}
            </span>
          )}
        </div>

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

      <MethodStatementSavedModal
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
                    <div className="w-full bg-[#d7eedc] text-agm-green border border-agm-green/20 text-center py-2 px-4 print:py-1.5 print:px-3 font-bold text-sm sm:text-base tracking-wider uppercase shadow-2xs">
                      METHOD STATEMENT
                    </div>

                    {(data.projectName || data.customerName) && (
                      <div className="w-full bg-slate-50 print:bg-transparent border-x border-b border-slate-200 print:border-none text-center py-1.5 px-3 -mt-3 text-xs sm:text-[12.5px] text-slate-700 print:text-slate-900 font-medium">
                        {data.projectName && (
                          <span>
                            Project:{" "}
                            <strong className="font-bold text-slate-900">
                              {data.projectName}
                            </strong>
                          </span>
                        )}
                        {data.projectName && data.customerName && (
                          <span className="mx-2 text-slate-400">•</span>
                        )}
                        {data.customerName && (
                          <span>
                            Client:{" "}
                            <strong className="font-bold text-slate-900">
                              {data.customerName}
                            </strong>
                          </span>
                        )}
                      </div>
                    )}

                    <div className="w-full border border-slate-200 print:border-y print:border-x-0 print:border-slate-300 overflow-hidden text-xs sm:text-[13px] break-inside-avoid print:break-inside-avoid">
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 print:divide-slate-300">
                        <div className="divide-y divide-slate-200">
                          <div className="grid grid-cols-3 p-2 bg-slate-50/60 items-center">
                            <span className="font-bold text-slate-900 col-span-1">
                              Document No.
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
                              Customer Name
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
                              Customer Phone
                            </span>
                            <div className="col-span-2">
                              <div className="print:hidden">
                                <Input
                                  value={data.phoneNumber}
                                  onChange={(e) =>
                                    setData({
                                      ...data,
                                      phoneNumber: formatUaePhone(e.target.value),
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
                              Location
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

                          <div className="grid grid-cols-3 p-2 bg-slate-50/60 items-center">
                            <span className="font-bold text-slate-900 col-span-1">
                              Starting Date
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

                          <div className="grid grid-cols-3 p-2 items-center">
                            <span className="font-bold text-slate-900 col-span-1">
                              Working Hours
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
                              Date
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
                              Project / Unit
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
                              Customer Email
                            </span>
                            <div className="col-span-2">
                              <div className="print:hidden">
                                <Input
                                  value={data.customerEmail}
                                  onChange={(e) =>
                                    setData({
                                      ...data,
                                      customerEmail: e.target.value,
                                    })
                                  }
                                  className="h-7 text-xs bg-white"
                                />
                              </div>
                              <span className="hidden print:inline text-slate-800">
                                {data.customerEmail}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 p-2 items-center">
                            <span className="font-bold text-slate-900 col-span-1">
                              Work Type
                            </span>
                            <div className="col-span-2">
                              <div className="print:hidden">
                                <Input
                                  value={data.workType}
                                  onChange={(e) =>
                                    setData({
                                      ...data,
                                      workType: e.target.value,
                                    })
                                  }
                                  className="h-7 text-xs bg-white"
                                />
                              </div>
                              <span className="hidden print:inline font-medium text-slate-900">
                                {data.workType}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 p-2 bg-slate-50/60 items-center">
                            <span className="font-bold text-slate-900 col-span-1">
                              Duration
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

                          <div className="grid grid-cols-3 p-2 items-center">
                            <span className="font-bold text-slate-900 col-span-1">
                              Project Manager
                            </span>
                            <div className="col-span-2">
                              <div className="print:hidden">
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
                                  className="h-7 text-xs bg-white"
                                />
                              </div>
                              <span className="hidden print:inline font-semibold text-slate-900">
                                {data.projectManager?.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 print:space-y-3 print:px-4">
                      <div className="space-y-3 pt-1 break-inside-avoid print:break-inside-avoid">
                        <div className="bg-[#f0f7f3] text-agm-green font-bold px-3 py-1.5 text-xs sm:text-[13px] border border-slate-200">
                          ROLES & RESPONSIBILITIES
                        </div>

                        <div className="border border-slate-200 rounded-sm overflow-hidden p-3 bg-white space-y-3">
                          <div className="space-y-1">
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
                            <p className="hidden print:block text-xs text-slate-600 leading-relaxed pt-0.5">
                              {data.projectManager?.description}
                            </p>
                          </div>

                          <div className="space-y-1 pt-2 border-t border-slate-100">
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
                            <p className="hidden print:block text-xs text-slate-600 leading-relaxed pt-0.5">
                              {data.constructionManager?.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1 break-inside-avoid print:break-inside-avoid">
                        <div className="font-bold text-slate-900 text-xs sm:text-[13px] tracking-wide uppercase">
                          INTRODUCTION
                        </div>
                        <div className="border border-slate-200 p-2.5 bg-slate-50/40">
                          <div className="print:hidden">
                            <Textarea
                              value={data.introduction}
                              onChange={(e) =>
                                setData({
                                  ...data,
                                  introduction: e.target.value,
                                })
                              }
                              className="text-xs min-h-[44px] bg-white"
                            />
                          </div>
                          <p className="hidden print:block text-xs text-slate-700 leading-relaxed">
                            {data.introduction}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1 break-inside-avoid print:break-inside-avoid">
                        <div className="bg-[#f0f7f3] text-agm-green font-bold px-3 py-1.5 text-xs sm:text-[13px] border border-slate-200">
                          PURPOSE
                        </div>
                        <div className="border border-slate-200 p-2.5 bg-white">
                          <div className="print:hidden">
                            <Textarea
                              value={data.purpose}
                              onChange={(e) =>
                                setData({ ...data, purpose: e.target.value })
                              }
                              className="text-xs min-h-[44px]"
                            />
                          </div>
                          <p className="hidden print:block text-xs text-slate-700 leading-relaxed">
                            {data.purpose}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1 break-inside-avoid print:break-inside-avoid">
                        <div className="bg-[#f0f7f3] text-agm-green font-bold px-3 py-1.5 text-xs sm:text-[13px] border border-slate-200">
                          SCOPE OF WORK
                        </div>

                        <div className="p-1">
                          <div className="print:hidden">
                            <Input
                              value={data.scopeOverview}
                              onChange={(e) =>
                                setData({
                                  ...data,
                                  scopeOverview: e.target.value,
                                })
                              }
                              className="text-xs bg-white mb-2"
                            />
                          </div>
                          <p className="hidden print:block text-xs text-slate-700 leading-relaxed mb-2">
                            {data.scopeOverview}
                          </p>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-slate-300 text-xs sm:text-[13px]">
                            <thead>
                              <tr className="bg-slate-100 text-slate-900 font-bold">
                                <th className="p-2.5 border border-slate-300 text-center w-[70px]">
                                  No.
                                </th>
                                <th className="p-2.5 border border-slate-300 text-left">
                                  Description
                                </th>
                                {isEditing && (
                                  <th className="p-2.5 border border-slate-300 text-center w-[50px] print:hidden">
                                    Act
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {data.items?.map((item, idx) => (
                                <tr
                                  key={item.id || idx}
                                  className={`break-inside-avoid page-break-inside-avoid print:break-inside-avoid ${
                                    idx % 2 === 1
                                      ? "bg-slate-50/40"
                                      : "bg-white"
                                  } hover:bg-slate-50 transition-colors`}
                                >
                                  <td className="p-2.5 border border-slate-200 align-top text-center font-bold text-slate-900">
                                    {item.number || idx + 1}
                                  </td>

                                  <td className="p-2.5 border border-slate-200 align-top text-slate-800 leading-relaxed">
                                    <div className="print:hidden">
                                      <Textarea
                                        value={item.description}
                                        onChange={(e) => {
                                          const updated = [...data.items];
                                          updated[idx].description =
                                            e.target.value;
                                          setData({ ...data, items: updated });
                                        }}
                                        className="text-xs min-h-[44px] bg-white"
                                      />
                                    </div>
                                    <div className="hidden print:block text-slate-800 leading-relaxed whitespace-pre-wrap">
                                      {item.description}
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
                                          title="Remove Step"
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
                              <span>Add Scope Step</span>
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
