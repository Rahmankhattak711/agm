"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button, Input, Textarea, Select, DatePicker } from "@/components/ui";
import {
  PrintIcon,
  RefreshIcon,
  PlusIcon,
  SaveIcon,
  FolderOpenIcon,
  SpinnerIcon,
  CheckIcon,
  ChevronLeftIcon,
} from "@/components/icons";
import { QuotationHeader } from "@/components/quotation/QuotationHeader";
import { QuotationFooter } from "@/components/quotation/QuotationFooter";
import {
  SalaryCertificateDocumentData,
  SAMPLE_SALARY_CERTIFICATE,
  numberToWordsAED,
} from "./salary-certificate-constants";
import {
  useSalaryCertificates,
  useSaveSalaryCertificate,
  useDeleteSalaryCertificate,
  SalaryCertificateRecord,
} from "@/lib/hooks/api-hooks";
import { toast } from "@/lib/toast";
import {
  formatPdfDocumentTitle,
  printWithDocumentTitle,
} from "@/lib/utils/format";
import { useConfirm } from "@/context/ConfirmContext";
import { SalaryCertificateSavedModal } from "./SalaryCertificateSavedModal";

interface SalaryCertificateTemplateProps {
  initialData?: SalaryCertificateDocumentData | SalaryCertificateRecord | null;
  onSave?: (data: SalaryCertificateDocumentData) => void;
}

export default function SalaryCertificateTemplate({
  initialData,
  onSave,
}: SalaryCertificateTemplateProps) {
  const [data, setData] = useState<SalaryCertificateDocumentData>(
    initialData || SAMPLE_SALARY_CERTIFICATE,
  );
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<
    "DRAFT" | "ACTIVE" | "ISSUED" | "COMPLETED"
  >((data.status as any) || "ISSUED");

  const { data: savedRecords = [], isLoading: isLoadingSaved } =
    useSalaryCertificates();
  const saveMutation = useSaveSalaryCertificate();
  const deleteMutation = useDeleteSalaryCertificate();
  const { confirm } = useConfirm();

  const stampInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setStatus((initialData.status as any) || "ISSUED");
    }
  }, [initialData]);

  const handlePrint = () => {
    const printTitle = formatPdfDocumentTitle(
      [data.refNumber, data.employeeName, "Salary Certificate"],
      "AGM-Salary-Certificate",
    );
    printWithDocumentTitle(printTitle);
  };

  const handleNewBlank = () => {
    const year = new Date().getFullYear();
    const seq = Math.floor(1000 + Math.random() * 9000);
    const dateFormatted = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const newDoc: SalaryCertificateDocumentData = {
      ...SAMPLE_SALARY_CERTIFICATE,
      id: `sc-${Date.now()}`,
      refNumber: `AGM/AC/SC/${year}/${seq}`,
      date: dateFormatted,
      status: "DRAFT",
      employeePrefix: "Mr.",
      employeeName: "",
      emiratesId: "",
      joiningDate: "",
      position: "",
      monthlySalaryNum: 0,
      monthlySalaryText: "",
    };
    setData(newDoc);
    setStatus("DRAFT");
    toast.info("New blank salary certificate initialized");
  };

  const handleResetSample = () => {
    setData(SAMPLE_SALARY_CERTIFICATE);
    setStatus("ISSUED");
    toast.info("Reset to default sample certificate");
  };

  const handleSalaryChange = (numVal: number) => {
    setData((prev) => ({
      ...prev,
      monthlySalaryNum: numVal,
      monthlySalaryText: numberToWordsAED(numVal),
    }));
  };

  const handleSave = async () => {
    try {
      const payload: Partial<SalaryCertificateRecord> = {
        ...data,
        status,
        updatedAt: new Date().toISOString(),
      };

      const result = await saveMutation.mutateAsync(payload);
      if (result) {
        setData((prev) => ({ ...prev, id: result.id }));
        toast.success("Salary Certificate saved successfully!");
        if (onSave) onSave(result as any);
      }
    } catch (err: any) {
      toast.error(
        "Failed to save salary certificate: " +
          (err.message || "Unknown error"),
      );
    }
  };

  const handleLoadCertificate = (cert: SalaryCertificateRecord) => {
    setData(cert as any);
    setStatus((cert.status as any) || "ISSUED");
    toast.info(`Loaded certificate ${cert.refNumber}`);
  };

  const handleDeleteCertificate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: "Delete Salary Certificate",
      message: "Are you sure you want to delete this salary certificate?",
      variant: "danger",
      confirmText: "Delete",
    });
    if (!isConfirmed) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Salary certificate deleted successfully");
      if (data.id === id) {
        handleNewBlank();
      }
    } catch (err: any) {
      toast.error("Error deleting salary certificate: " + err.message);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-agm-box-border rounded-xl shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">
            Salary Certificate
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
            <option value="COMPLETED">COMPLETED</option>
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
            onClick={handleResetSample}
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
                      SALARY CERTIFICATE
                    </div>

                    <div className="w-full border border-slate-200 print:border-y print:border-x-0 print:border-slate-300 overflow-visible text-xs sm:text-[13px] break-inside-avoid print:break-inside-avoid">
                      <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 divide-y md:divide-y-0 md:divide-x print:divide-y-0 print:divide-x divide-slate-200 print:divide-slate-300">
                        <div className="grid grid-cols-3 p-2.5 print:p-1.5 bg-slate-50/60 print:bg-slate-50/80 items-center relative z-20">
                          <span className="font-bold text-slate-900 col-span-1 print:text-[11px]">
                            Date of Issue:
                          </span>
                          <div className="col-span-2">
                            <div className="print:hidden">
                              <DatePicker
                                value={data.date}
                                onChange={(val) =>
                                  setData((prev) => ({ ...prev, date: val }))
                                }
                                placeholder="Select date"
                                className="h-8 bg-white"
                              />
                            </div>
                            <span className="hidden print:inline font-bold text-black">
                              {data.date}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 p-2.5 bg-slate-50/60 items-center">
                          <span className="font-bold text-slate-900 col-span-1">
                            Reference No.:
                          </span>
                          <div className="col-span-2">
                            <div className="print:hidden">
                              <Input
                                value={data.refNumber}
                                onChange={(e) =>
                                  setData((prev) => ({
                                    ...prev,
                                    refNumber: e.target.value,
                                  }))
                                }
                                placeholder="Ref Number"
                                className="h-7 text-xs bg-white font-mono"
                              />
                            </div>
                            <span className="hidden print:inline font-bold text-black font-mono">
                              {data.refNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 print:space-y-2.5 print:px-4">
                      <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-200 space-y-1.5 print:p-0 print:border-none print:bg-transparent">
                        <div className="text-xs font-bold text-slate-700 print:hidden">
                          Addressee:
                        </div>
                        <div className="print:hidden">
                          <Input
                            value={data.addressee}
                            onChange={(e) =>
                              setData((prev) => ({
                                ...prev,
                                addressee: e.target.value,
                              }))
                            }
                            placeholder="e.g. TO WHOM IT MAY CONCERN"
                            className="h-8 text-xs font-bold bg-white max-w-md"
                          />
                        </div>
                        <div className="hidden print:block font-bold text-black text-[15px]">
                          {data.addressee}
                        </div>
                      </div>

                      <div className="hidden print:block space-y-6 text-[15px] leading-[2.1] text-slate-900 text-left pt-2">
                        <p>
                          This is to certify that{" "}
                          <strong className="font-bold text-black">
                            {data.employeePrefix} {data.employeeName}
                          </strong>
                          , holder of Emirates ID No.{" "}
                          <strong className="font-bold text-black font-sans">
                            {data.emiratesId}
                          </strong>{" "}
                          and joining date{" "}
                          <strong className="font-bold text-black font-sans">
                            {data.joiningDate}
                          </strong>
                          , is employed with{" "}
                          <strong className="font-bold text-black">
                            {data.companyName ||
                              "AGM Fitout Technical Services LLC"}
                          </strong>{" "}
                          in the position of{" "}
                          <strong className="font-bold text-black">
                            {data.position}
                          </strong>
                          .
                        </p>

                        <p className="text-slate-800">
                          {data.purposeDisclaimer}
                        </p>

                        <p>
                          {data.employeePrefix === "Ms." ||
                          data.employeePrefix === "Mrs."
                            ? "Her"
                            : "His"}{" "}
                          current monthly salary is{" "}
                          <strong className="font-bold text-black font-sans">
                            {data.currency}{" "}
                            {Number(
                              data.monthlySalaryNum || 0,
                            ).toLocaleString()}{" "}
                            ({data.monthlySalaryText})
                          </strong>
                          .
                        </p>
                      </div>

                      <div className="print:hidden space-y-4 pt-1">
                        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                            1. Employee Details
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-agm-text mb-1">
                                Prefix
                              </label>
                              <select
                                value={data.employeePrefix}
                                onChange={(e) =>
                                  setData((p) => ({
                                    ...p,
                                    employeePrefix: e.target.value as any,
                                  }))
                                }
                                className="w-full px-3 py-2 text-xs rounded-xl border border-agm-box-border bg-white focus:outline-none focus:ring-2 focus:ring-agm-green/20 focus:border-agm-green text-agm-text font-medium"
                              >
                                <option value="Mr.">Mr.</option>
                                <option value="Ms.">Ms.</option>
                                <option value="Mrs.">Mrs.</option>
                                <option value="Dr.">Dr.</option>
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <Input
                                label="Employee Full Name"
                                value={data.employeeName}
                                onChange={(e) =>
                                  setData((p) => ({
                                    ...p,
                                    employeeName: e.target.value,
                                  }))
                                }
                                placeholder="e.g. Zeeshan Ahmad"
                              />
                            </div>

                            <div>
                              <Input
                                label="Designation / Position"
                                value={data.position}
                                onChange={(e) =>
                                  setData((p) => ({
                                    ...p,
                                    position: e.target.value,
                                  }))
                                }
                                placeholder="e.g. Accountant"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <Input
                                label="Emirates ID No."
                                value={data.emiratesId}
                                onChange={(e) =>
                                  setData((p) => ({
                                    ...p,
                                    emiratesId: e.target.value,
                                  }))
                                }
                                placeholder="784-1994-1500490-4"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-agm-text mb-1">
                                Date of Joining
                              </label>
                              <DatePicker
                                value={data.joiningDate}
                                onChange={(val) =>
                                  setData((p) => ({
                                    ...p,
                                    joiningDate: val,
                                  }))
                                }
                                placeholder="e.g. 30 Apr 2024"
                                className="h-9 bg-white rounded-xl"
                              />
                            </div>

                            <div>
                              <Input
                                label="Employing Entity"
                                value={data.companyName}
                                onChange={(e) =>
                                  setData((p) => ({
                                    ...p,
                                    companyName: e.target.value,
                                  }))
                                }
                                placeholder="AGM Fitout Technical Services LLC"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                            2. Salary Compensation &amp; Currency
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <Input
                                label="Monthly Salary (AED)"
                                type="number"
                                value={data.monthlySalaryNum || ""}
                                onChange={(e) =>
                                  handleSalaryChange(Number(e.target.value))
                                }
                                placeholder="5000"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <Input
                                label="Salary in Words (Auto-generated)"
                                value={data.monthlySalaryText}
                                onChange={(e) =>
                                  setData((p) => ({
                                    ...p,
                                    monthlySalaryText: e.target.value,
                                  }))
                                }
                                placeholder="Five Thousand UAE Dirhams only"
                              />
                            </div>
                          </div>

                          <div>
                            <Textarea
                              label="Purpose / Bank Disclaimer Statement"
                              rows={2}
                              value={data.purposeDisclaimer}
                              onChange={(e) =>
                                setData((p) => ({
                                  ...p,
                                  purposeDisclaimer: e.target.value,
                                }))
                              }
                              placeholder="Disclaimer text..."
                            />
                          </div>
                        </div>
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
                                    setData((p) => ({
                                      ...p,
                                      signatoryName: e.target.value,
                                    }))
                                  }
                                  placeholder="Signatory Name"
                                />
                                <Input
                                  label="Signatory Designation"
                                  value={data.signatoryDesignation}
                                  onChange={(e) =>
                                    setData((p) => ({
                                      ...p,
                                      signatoryDesignation: e.target.value,
                                    }))
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
                                      setData((p) => ({
                                        ...p,
                                        companyStampUrl: undefined,
                                      }))
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
                          *** This is an official system-generated certificate
                          and does not require a physical signature or stamp.
                          ***
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

      <SalaryCertificateSavedModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedRecords={savedRecords}
        isLoadingSaved={isLoadingSaved}
        onLoadRecord={handleLoadCertificate}
        onDeleteRecord={handleDeleteCertificate}
        onNewBlank={handleNewBlank}
      />
    </div>
  );
}
