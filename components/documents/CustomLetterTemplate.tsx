"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button, Input, Textarea, DatePicker } from "@/components/ui";
import {
  PrintIcon,
  RefreshIcon,
  PlusIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SaveIcon,
  CheckIcon,
  ListPlusIcon,
  TableIcon,
  MessageSquareIcon,
  AlertCircleIcon,
  FolderOpenIcon,
  SpinnerIcon,
  ChevronLeftIcon,
} from "@/components/icons";
import { QuotationHeader } from "@/components/quotation/QuotationHeader";
import { QuotationFooter } from "@/components/quotation/QuotationFooter";
import {
  CustomLetterDocumentData,
  CustomLetterSection,
  DEFAULT_CUSTOM_LETTER,
  SectionType,
} from "./custom-letter-constants";
import {
  useCustomLetters,
  useSaveCustomLetter,
  useDeleteCustomLetter,
} from "@/lib/hooks/api-hooks";
import { toast } from "@/lib/toast";
import {
  formatPdfDocumentTitle,
  printWithDocumentTitle,
} from "@/lib/utils/format";
import { useConfirm } from "@/context/ConfirmContext";
import { CustomLetterSavedModal } from "./CustomLetterSavedModal";

interface CustomLetterTemplateProps {
  initialData?: CustomLetterDocumentData | null;
  onSave?: (data: CustomLetterDocumentData) => void;
}

export default function CustomLetterTemplate({
  initialData,
  onSave,
}: CustomLetterTemplateProps) {
  const [data, setData] = useState<CustomLetterDocumentData>(
    initialData || DEFAULT_CUSTOM_LETTER,
  );
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "ISSUED">(
    (data.status as any) || "ISSUED",
  );
  const stampInputRef = useRef<HTMLInputElement>(null);

  const { data: savedRecords = [], isLoading: isLoadingSaved } =
    useCustomLetters();
  const saveMutation = useSaveCustomLetter();
  const deleteMutation = useDeleteCustomLetter();
  const { confirm } = useConfirm();

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setStatus((initialData.status as any) || "ISSUED");
    }
  }, [initialData]);

  const handleNewBlank = () => {
    const freshYear = new Date().getFullYear();
    const freshSeq = Math.floor(1000 + Math.random() * 9000);
    const newDoc: CustomLetterDocumentData = {
      ...DEFAULT_CUSTOM_LETTER,
      id: `cl-${Date.now()}`,
      refNumber: `AGM/CORP/CL/${freshYear}/${freshSeq}`,
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      docTitle: "OFFICIAL COMPANY LETTER",
      status: "DRAFT",
      subject: "Subject: Official Correspondence",
      addressee: "TO WHOM IT MAY CONCERN,",
      addresseeSubtitle: "United Arab Emirates",
      sections: [
        {
          id: `sec-1`,
          heading: "Statement of Confirmation",
          paragraph:
            "This is an official communication issued by AGM Fitout Technical Services LLC.",
          type: "PARAGRAPH",
        },
      ],
    };
    setData(newDoc);
    setStatus("DRAFT");
    toast.info("New blank document initialized");
  };

  const handleResetDefault = () => {
    setData(DEFAULT_CUSTOM_LETTER);
    setStatus("ISSUED");
    toast.info("Reset to default experience certificate template");
  };

  const handleSave = async () => {
    try {
      const payload: Partial<CustomLetterDocumentData> = {
        ...data,
        status,
        updatedAt: new Date().toISOString(),
      };
      const result = await saveMutation.mutateAsync(payload);
      if (result) {
        setData((prev) => ({ ...prev, id: result.id }));
        toast.success("Letter saved to database successfully!");
        if (onSave) onSave(result);
      }
    } catch (err: any) {
      toast.error("Failed to save letter: " + (err.message || "Unknown error"));
    }
  };

  const handleLoadLetter = (letter: CustomLetterDocumentData) => {
    setData(letter);
    setStatus((letter.status as any) || "ISSUED");
    toast.info(`Loaded letter ${letter.refNumber}`);
  };

  const handleDeleteLetter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: "Delete Custom Letter",
      message: "Are you sure you want to delete this custom letter?",
      variant: "danger",
      confirmText: "Delete",
    });
    if (!isConfirmed) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Letter deleted successfully");
      if (data.id === id) {
        handleNewBlank();
      }
    } catch (err: any) {
      toast.error("Error deleting letter: " + (err.message || "Unknown error"));
    }
  };

  const handlePrint = () => {
    const printTitle = formatPdfDocumentTitle(
      [data.refNumber, data.addressee, data.subject || data.docTitle],
      "AGM-Company-Letter",
    );
    printWithDocumentTitle(printTitle);
  };

  const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setData((prev) => ({
          ...prev,
          companyStampUrl: ev.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addSection = (type: SectionType = "PARAGRAPH") => {
    const newSection: CustomLetterSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      heading:
        type === "KEY_VALUE"
          ? "Key Particulars"
          : type === "BULLETS"
            ? "Terms & Specifications"
            : "Section Title",
      paragraph:
        type === "PARAGRAPH" || type === "CALLOUT"
          ? "Enter your official paragraph text or declaration here. You can format and customize as needed."
          : undefined,
      type,
      keyValues:
        type === "KEY_VALUE"
          ? [
              {
                id: `kv-1`,
                label: "Item / Parameter",
                value: "Details or value",
              },
              {
                id: `kv-2`,
                label: "Amount / Specification",
                value: "AED 0.00",
              },
            ]
          : undefined,
      bulletPoints:
        type === "BULLETS"
          ? [
              "First item or operational clause.",
              "Second item or operational clause.",
            ]
          : undefined,
      isHighlight: type === "CALLOUT",
    };

    setData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const updateSection = (
    index: number,
    field: keyof CustomLetterSection,
    value: any,
  ) => {
    setData((prev) => {
      const newSecs = [...prev.sections];
      newSecs[index] = { ...newSecs[index], [field]: value };
      return { ...prev, sections: newSecs };
    });
  };

  const removeSection = (index: number) => {
    setData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const moveSection = (index: number, direction: "UP" | "DOWN") => {
    setData((prev) => {
      const newSecs = [...prev.sections];
      const targetIndex = direction === "UP" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSecs.length) return prev;
      const temp = newSecs[index];
      newSecs[index] = newSecs[targetIndex];
      newSecs[targetIndex] = temp;
      return { ...prev, sections: newSecs };
    });
  };

  const addKeyValueRow = (secIndex: number) => {
    setData((prev) => {
      const newSecs = [...prev.sections];
      const cur = newSecs[secIndex];
      const newKvs = [
        ...(cur.keyValues || []),
        { id: `kv-${Date.now()}`, label: "New Label", value: "Value" },
      ];
      newSecs[secIndex] = { ...cur, keyValues: newKvs };
      return { ...prev, sections: newSecs };
    });
  };

  const updateKeyValue = (
    secIndex: number,
    kvIndex: number,
    field: "label" | "value",
    val: string,
  ) => {
    setData((prev) => {
      const newSecs = [...prev.sections];
      const cur = newSecs[secIndex];
      const kvs = [...(cur.keyValues || [])];
      kvs[kvIndex] = { ...kvs[kvIndex], [field]: val };
      newSecs[secIndex] = { ...cur, keyValues: kvs };
      return { ...prev, sections: newSecs };
    });
  };

  const removeKeyValue = (secIndex: number, kvIndex: number) => {
    setData((prev) => {
      const newSecs = [...prev.sections];
      const cur = newSecs[secIndex];
      const kvs = (cur.keyValues || []).filter((_, i) => i !== kvIndex);
      newSecs[secIndex] = { ...cur, keyValues: kvs };
      return { ...prev, sections: newSecs };
    });
  };

  const addBullet = (secIndex: number) => {
    setData((prev) => {
      const newSecs = [...prev.sections];
      const cur = newSecs[secIndex];
      const bullets = [...(cur.bulletPoints || []), "New bullet item text"];
      newSecs[secIndex] = { ...cur, bulletPoints: bullets };
      return { ...prev, sections: newSecs };
    });
  };

  const updateBullet = (secIndex: number, bIndex: number, val: string) => {
    setData((prev) => {
      const newSecs = [...prev.sections];
      const cur = newSecs[secIndex];
      const bullets = [...(cur.bulletPoints || [])];
      bullets[bIndex] = val;
      newSecs[secIndex] = { ...cur, bulletPoints: bullets };
      return { ...prev, sections: newSecs };
    });
  };

  const removeBullet = (secIndex: number, bIndex: number) => {
    setData((prev) => {
      const newSecs = [...prev.sections];
      const cur = newSecs[secIndex];
      const bullets = (cur.bulletPoints || []).filter((_, i) => i !== bIndex);
      newSecs[secIndex] = { ...cur, bulletPoints: bullets };
      return { ...prev, sections: newSecs };
    });
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-agm-box-border rounded-xl shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">
            Custom Letter / Certificate
          </span>
          {data.refNumber && (
            <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
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
            <option value="ISSUED">ISSUED</option>
          </select>

          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={saveMutation.isPending}
            onClick={handleSave}
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
            onClick={handleResetDefault}
            className="text-xs flex items-center gap-1.5 border-agm-box-border text-agm-text hover:bg-agm-box-bg cursor-pointer"
            title="Reset to default sample"
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

      <div className="print:hidden flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
        <span className="text-xs font-bold text-slate-600">
          Document Structure Builder:
        </span>
        <div className="flex items-center flex-wrap gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addSection("PARAGRAPH")}
            className="text-xs bg-white text-slate-700 hover:text-slate-900 border-slate-200 flex items-center gap-1"
          >
            <MessageSquareIcon size={13} className="text-slate-500" />
            <span>+ Paragraph</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addSection("KEY_VALUE")}
            className="text-xs bg-white text-slate-700 hover:text-slate-900 border-slate-200 flex items-center gap-1"
          >
            <TableIcon size={13} className="text-slate-500" />
            <span>+ Data Table</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addSection("BULLETS")}
            className="text-xs bg-white text-slate-700 hover:text-slate-900 border-slate-200 flex items-center gap-1"
          >
            <ListPlusIcon size={13} className="text-slate-500" />
            <span>+ Bullets</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addSection("CALLOUT")}
            className="text-xs bg-white text-slate-700 hover:text-slate-900 border-slate-200 flex items-center gap-1"
          >
            <AlertCircleIcon size={13} className="text-amber-600" />
            <span>+ Notice Box</span>
          </Button>
        </div>
      </div>

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
                  <div className="w-full px-10 py-6 text-agm-text text-xs sm:text-[13px] print:px-0 print:py-0 space-y-4 print:space-y-2">
                    <div className="w-full bg-agm-green text-white text-center py-2.5 px-4 print:py-1.5 print:px-3 font-bold text-sm sm:text-base tracking-wider uppercase shadow-xs">
                      {data.docTitle || "OFFICIAL COMPANY LETTER"}
                    </div>

                    <div className="w-full border border-slate-200 print:border-y print:border-x-0 print:border-slate-300 overflow-visible text-xs sm:text-[13px] break-inside-avoid print:break-inside-avoid">
                      <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 divide-y md:divide-y-0 md:divide-x print:divide-y-0 print:divide-x divide-slate-200 print:divide-slate-300">
                        <div className="divide-y divide-slate-200 print:divide-y-0">
                          <div className="grid grid-cols-3 p-2 print:p-1 bg-slate-50/60 print:bg-slate-50/80 items-center relative z-20">
                            <span className="font-bold text-slate-900 col-span-1 print:text-[11px]">
                              Date of Issue:
                            </span>
                            <div className="col-span-2">
                              <div className="print:hidden">
                                <DatePicker
                                  value={data.date}
                                  onChange={(val) =>
                                    setData({ ...data, date: val })
                                  }
                                  placeholder="Select date"
                                  className="h-8 bg-white"
                                />
                              </div>
                              <span className="hidden print:inline font-bold text-black print:text-[11.5px]">
                                {data.date}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 p-2 items-center print:hidden">
                            <span className="font-bold text-slate-900 col-span-1">
                              Document Title:
                            </span>
                            <div className="col-span-2">
                              <Input
                                value={data.docTitle}
                                onChange={(e) =>
                                  setData({
                                    ...data,
                                    docTitle: e.target.value.toUpperCase(),
                                  })
                                }
                                className="h-7 text-xs bg-white font-bold"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="divide-y divide-slate-200 print:divide-y-0">
                          <div className="grid grid-cols-3 p-2 print:p-1 bg-slate-50/60 print:bg-slate-50/80 items-center">
                            <span className="font-bold text-slate-900 col-span-1 print:text-[11px]">
                              Reference No.:
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
                                  className="h-7 text-xs bg-white font-mono"
                                />
                              </div>
                              <span className="hidden print:inline font-mono font-bold text-black print:text-[11.5px]">
                                {data.refNumber}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 p-2 items-center print:hidden">
                            <span className="font-bold text-slate-900 col-span-1">
                              Status:
                            </span>
                            <div className="col-span-2">
                              <span className="font-bold text-xs text-agm-green bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 print:space-y-2.5 print:px-4">
                      <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-200 space-y-2 print:p-0 print:border-none print:bg-transparent">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden">
                          <div>
                            <Input
                              label="Recipient / Addressee"
                              value={data.addressee}
                              onChange={(e) =>
                                setData({ ...data, addressee: e.target.value })
                              }
                              placeholder="To Whom It May Concern,"
                              containerClassName="w-full"
                            />
                          </div>
                          <div>
                            <Input
                              label="Location / Subtitle (Optional)"
                              value={data.addresseeSubtitle || ""}
                              onChange={(e) =>
                                setData({
                                  ...data,
                                  addresseeSubtitle: e.target.value,
                                })
                              }
                              placeholder="Dubai, United Arab Emirates"
                              containerClassName="w-full"
                            />
                          </div>
                        </div>
                        <div className="hidden print:block space-y-0.5 pt-1">
                          <div className="font-bold text-black text-sm">
                            {data.addressee}
                          </div>
                          {data.addresseeSubtitle && (
                            <div className="text-slate-700 text-xs">
                              {data.addresseeSubtitle}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 print:space-y-1">
                        <div className="print:hidden">
                          <Input
                            label="Subject Line"
                            value={data.subject}
                            onChange={(e) =>
                              setData({ ...data, subject: e.target.value })
                            }
                            placeholder="Subject: ..."
                            containerClassName="w-full"
                          />
                        </div>
                        <div className="hidden print:block font-bold text-black text-sm underline pt-1">
                          {data.subject}
                        </div>

                        <div className="pt-1">
                          <div className="print:hidden">
                            <Input
                              label="Salutation"
                              value={data.salutation}
                              onChange={(e) =>
                                setData({ ...data, salutation: e.target.value })
                              }
                              placeholder="Dear Sir / Madam,"
                              containerClassName="w-full sm:w-72"
                            />
                          </div>
                          <div className="hidden print:block font-semibold text-slate-900 text-xs">
                            {data.salutation}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-2">
                        {data.sections.map((section, secIdx) => (
                          <div
                            key={section.id}
                            className="relative group border border-slate-200 rounded-xl p-3.5 print:p-0 print:border-none bg-white space-y-2.5 shadow-2xs print:shadow-none"
                          >
                            <div className="print:hidden flex items-center justify-between pb-2 border-b border-slate-100">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Section {secIdx + 1} ({section.type})
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => moveSection(secIdx, "UP")}
                                  disabled={secIdx === 0}
                                  className="w-7 h-7 rounded-lg border border-agm-box-border bg-white text-agm-muted hover:text-agm-text hover:bg-agm-box-bg disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                                  title="Move Up"
                                >
                                  <ArrowUpIcon size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveSection(secIdx, "DOWN")}
                                  disabled={secIdx === data.sections.length - 1}
                                  className="w-7 h-7 rounded-lg border border-agm-box-border bg-white text-agm-muted hover:text-agm-text hover:bg-agm-box-bg disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer"
                                  title="Move Down"
                                >
                                  <ArrowDownIcon size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeSection(secIdx)}
                                  className="w-7 h-7 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer"
                                  title="Delete Section"
                                >
                                  <TrashIcon size={14} />
                                </button>
                              </div>
                            </div>

                            <div>
                              <div className="print:hidden">
                                <Input
                                  label="Section Heading"
                                  value={section.heading || ""}
                                  onChange={(e) =>
                                    updateSection(
                                      secIdx,
                                      "heading",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="SECTION HEADING (OPTIONAL)"
                                />
                              </div>
                              {section.heading && (
                                <div className="hidden print:block font-bold text-black text-xs uppercase tracking-wide pt-1">
                                  {section.heading}
                                </div>
                              )}
                            </div>

                            {section.type === "KEY_VALUE" ? (
                              <div className="space-y-2 pt-1">
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                  <table className="w-full border-collapse text-xs">
                                    <tbody>
                                      {(section.keyValues || []).map(
                                        (kv, kvIdx) => (
                                          <tr
                                            key={kv.id}
                                            className="border-b border-slate-200 last:border-none"
                                          >
                                            <td className="w-2/5 p-2 bg-slate-50 font-semibold text-slate-800 border-r border-slate-200">
                                              <div className="print:hidden">
                                                <Input
                                                  value={kv.label}
                                                  onChange={(e) =>
                                                    updateKeyValue(
                                                      secIdx,
                                                      kvIdx,
                                                      "label",
                                                      e.target.value,
                                                    )
                                                  }
                                                  className="h-7 text-xs bg-white"
                                                  placeholder="Parameter / Item"
                                                />
                                              </div>
                                              <span className="hidden print:inline font-semibold text-slate-900">
                                                {kv.label}
                                              </span>
                                            </td>
                                            <td className="p-2 text-slate-800">
                                              <div className="flex items-center gap-2">
                                                <div className="flex-1 print:hidden">
                                                  <Input
                                                    value={kv.value}
                                                    onChange={(e) =>
                                                      updateKeyValue(
                                                        secIdx,
                                                        kvIdx,
                                                        "value",
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="h-7 text-xs bg-white"
                                                    placeholder="Details or value"
                                                  />
                                                </div>
                                                <span className="hidden print:inline text-slate-900 font-medium">
                                                  {kv.value}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    removeKeyValue(
                                                      secIdx,
                                                      kvIdx,
                                                    )
                                                  }
                                                  className="print:hidden w-7 h-7 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                                  title="Remove row"
                                                >
                                                  <TrashIcon size={13} />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ),
                                      )}
                                    </tbody>
                                  </table>
                                </div>

                                <div className="print:hidden flex justify-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addKeyValueRow(secIdx)}
                                    className="text-xs flex items-center gap-1.5"
                                  >
                                    <PlusIcon size={12} /> Add Row
                                  </Button>
                                </div>
                              </div>
                            ) : section.type === "BULLETS" ? (
                              <div className="space-y-2 pt-1">
                                <div className="space-y-1.5">
                                  {(section.bulletPoints || []).map(
                                    (bp, bIdx) => (
                                      <div
                                        key={bIdx}
                                        className="flex items-start gap-2 text-xs"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-agm-green mt-2 shrink-0"></span>
                                        <div className="flex-1 print:hidden">
                                          <Input
                                            value={bp}
                                            onChange={(e) =>
                                              updateBullet(
                                                secIdx,
                                                bIdx,
                                                e.target.value,
                                              )
                                            }
                                            className="h-7 text-xs bg-white"
                                            placeholder="Bullet statement..."
                                          />
                                        </div>
                                        <span className="hidden print:inline text-slate-800 leading-relaxed">
                                          {bp}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeBullet(secIdx, bIdx)
                                          }
                                          className="print:hidden w-7 h-7 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                                          title="Remove bullet"
                                        >
                                          <TrashIcon size={13} />
                                        </button>
                                      </div>
                                    ),
                                  )}
                                </div>

                                <div className="print:hidden flex justify-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addBullet(secIdx)}
                                    className="text-xs flex items-center gap-1.5"
                                  >
                                    <PlusIcon size={12} /> Add Bullet Point
                                  </Button>
                                </div>
                              </div>
                            ) : section.type === "CALLOUT" ? (
                              <div className="p-3 bg-amber-50/70 border-l-4 border-amber-500 rounded-r-lg">
                                <div className="print:hidden">
                                  <Textarea
                                    rows={3}
                                    value={section.paragraph || ""}
                                    onChange={(e) =>
                                      updateSection(
                                        secIdx,
                                        "paragraph",
                                        e.target.value,
                                      )
                                    }
                                    className="text-xs"
                                    placeholder="Notice or highlight statement..."
                                  />
                                </div>
                                <p className="hidden print:block text-slate-800 italic leading-relaxed text-xs">
                                  {section.paragraph}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <div className="print:hidden">
                                  <Textarea
                                    rows={3}
                                    value={section.paragraph || ""}
                                    onChange={(e) =>
                                      updateSection(
                                        secIdx,
                                        "paragraph",
                                        e.target.value,
                                      )
                                    }
                                    className="text-xs"
                                    placeholder="Enter paragraph statement..."
                                  />
                                </div>
                                <p className="hidden print:block text-slate-800 leading-relaxed text-xs">
                                  {section.paragraph}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="pt-2">
                        <div className="print:hidden">
                          <Input
                            label="Closing Sentence / Note (Optional)"
                            value={data.closingText || ""}
                            onChange={(e) =>
                              setData({ ...data, closingText: e.target.value })
                            }
                            placeholder="e.g. This certificate is issued upon the request of the employee without liability."
                            containerClassName="w-full"
                          />
                        </div>
                        {data.closingText && (
                          <div className="hidden print:block text-slate-800 text-xs italic pt-1">
                            {data.closingText}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 print:pt-2 border-t border-slate-200 space-y-3 print:space-y-1 text-xs sm:text-[13px] break-inside-avoid print:break-inside-avoid">
                        <div>
                          <p className="text-slate-700 font-medium text-[11.5px] print:text-[11px]">
                            For and on behalf of,
                          </p>
                          <p className="font-bold text-slate-900 text-sm print:text-[12.5px] pt-0.5">
                            {data.signatoryCompany}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 print:gap-4 pt-1 print:pt-0">
                          <div className="space-y-2 print:space-y-0.5">
                            <div className="h-14 print:h-8 flex items-end">
                              <div className="w-60 print:w-48 border-b border-slate-400 print:border-slate-800 pb-0.5 text-xs text-slate-400 font-medium italic">
                                Authorized Signatory
                              </div>
                            </div>

                            <div className="space-y-1 print:space-y-0">
                              <div className="print:hidden w-64 space-y-2">
                                <Input
                                  label="Signatory Name"
                                  value={data.signatoryName}
                                  onChange={(e) =>
                                    setData({
                                      ...data,
                                      signatoryName: e.target.value,
                                    })
                                  }
                                  placeholder="Signatory Name"
                                />
                                <Input
                                  label="Signatory Designation"
                                  value={data.signatoryDesignation}
                                  onChange={(e) =>
                                    setData({
                                      ...data,
                                      signatoryDesignation: e.target.value,
                                    })
                                  }
                                  placeholder="Signatory Designation"
                                />
                              </div>
                              <div className="hidden print:block space-y-0">
                                <div className="font-bold text-black text-[12px]">
                                  {data.signatoryName}
                                </div>
                                <div className="text-slate-800 text-[11px] font-medium">
                                  {data.signatoryDesignation}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-center justify-center">
                            <input
                              type="file"
                              ref={stampInputRef}
                              onChange={handleStampUpload}
                              accept="image/*"
                              className="hidden"
                            />

                            {data.companyStampUrl ? (
                              <div className="relative inline-flex flex-col items-center gap-2">
                                <img
                                  src={data.companyStampUrl}
                                  alt="Company Stamp"
                                  className="max-h-[120px] max-w-[220px] print:max-h-[65px] print:max-w-[130px] object-contain"
                                />
                                <div className="print:hidden flex gap-2">
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                      stampInputRef.current?.click()
                                    }
                                    className="text-xs"
                                  >
                                    Change Stamp
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="danger"
                                    size="sm"
                                    onClick={() =>
                                      setData({
                                        ...data,
                                        companyStampUrl: undefined,
                                      })
                                    }
                                    className="text-xs"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div
                                  onClick={() => stampInputRef.current?.click()}
                                  className="print:hidden group flex items-center gap-3.5 px-5 py-3.5 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-agm-green hover:bg-agm-green-soft/40 transition-all duration-200"
                                  title="Click to upload company stamp"
                                >
                                  <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-agm-green/10 flex items-center justify-center transition-all">
                                    <svg
                                      className="w-5 h-5 text-slate-400 group-hover:text-agm-green transition-colors"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={1.8}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                                      />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-700 group-hover:text-agm-green text-xs transition-colors">
                                      Company Stamp
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                      Click to upload (PNG/JPG)
                                    </p>
                                  </div>
                                </div>

                                <div className="hidden print:flex flex-col items-center justify-center w-20 h-20 print:w-16 print:h-16 border-2 border-dashed border-slate-300 rounded-full text-center p-1 text-slate-400 text-[9px] font-medium">
                                  <span>Official Seal</span>
                                  <span>&amp; Stamp</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 print:pt-1 text-center border-t border-slate-100 print:border-slate-200">
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

          <div className="w-full px-10 sm:px-12 pb-6 print:hidden">
            <QuotationFooter className="mt-6" />
          </div>
        </div>
      </div>

      <CustomLetterSavedModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedRecords={savedRecords}
        isLoadingSaved={isLoadingSaved}
        onLoadRecord={handleLoadLetter}
        onDeleteRecord={handleDeleteLetter}
        onNewBlank={handleNewBlank}
      />
    </div>
  );
}
