"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { Loader2 } from "lucide-react";
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
  const [saveSuccess, setSaveSuccess] = useState<string>("");
  const [isSavedModalOpen, setIsSavedModalOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<"DRAFT" | "ISSUED">(
    (data.status as any) === "DRAFT" ? "DRAFT" : "ISSUED",
  );

  const { data: savedRecords = [], isLoading: isLoadingSaved } =
    useSalaryCertificates();
  const saveMutation = useSaveSalaryCertificate();
  const deleteMutation = useDeleteSalaryCertificate();

  const stampInputRef = React.useRef<HTMLInputElement>(null);


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
      setStatus(initialData.status === "DRAFT" ? "DRAFT" : "ISSUED");
    }
  }, [initialData]);

  const handlePrint = () => {
    window.print();
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
    setSaveSuccess("New blank salary certificate initialized");
    setTimeout(() => setSaveSuccess(""), 3000);
  };

  const handleResetSample = () => {
    setData(SAMPLE_SALARY_CERTIFICATE);
    setStatus("ISSUED");
    setSaveSuccess("Reset to default sample certificate");
    setTimeout(() => setSaveSuccess(""), 3000);
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
        setSaveSuccess("Salary Certificate saved successfully!");
        if (onSave) onSave(result as any);
        setTimeout(() => setSaveSuccess(""), 4000);
      }
    } catch (err: any) {
      alert("Failed to save salary certificate: " + (err.message || "Unknown error"));
    }
  };

  const handleLoadCertificate = (cert: SalaryCertificateRecord) => {
    setData(cert as any);
    setStatus(cert.status === "DRAFT" ? "DRAFT" : "ISSUED");
  };

  const handleDeleteCertificate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this salary certificate?")) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      if (data.id === id) {
        handleNewBlank();
      }
    } catch (err: any) {
      alert("Error deleting salary certificate: " + err.message);
    }
  };

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      {/* Action Toolbar */}
      <div className="print:hidden w-full flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-agm-box-border rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-800">
            Salary Certificate
          </span>
          {data.refNumber && (
            <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
              {data.refNumber}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              aria-label="Document status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className={`text-xs font-semibold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                status === "ISSUED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              <option value="DRAFT">Draft</option>
              <option value="ISSUED">Issued</option>
            </select>
          </div>


          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsSavedModalOpen(true)}
            className="text-xs border-slate-200"
          >
            Saved ({savedRecords.length})
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNewBlank}
            className="text-xs border-slate-200"
          >
            New Blank
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetSample}
            className="text-xs border-slate-200 text-slate-600"
            title="Reset to official sample"
          >
            Reset Sample
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
          >
            Print / PDF
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="text-xs bg-agm-green text-white hover:bg-agm-green-dark font-semibold flex items-center gap-1.5 shadow-xs"
          >
            {saveMutation.isPending && (
              <Loader2 size={13} className="animate-spin" />
            )}
            Save to DB
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="print:hidden w-full p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <span className="font-medium">{saveSuccess}</span>
          <button
            onClick={() => setSaveSuccess("")}
            className="text-emerald-500 hover:text-emerald-700 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Printable Document Canvas using QuotationHeader and QuotationFooter */}
      <div className="w-full print:overflow-visible">
        <div
          className="bg-white shadow-lg print:shadow-none w-full rounded-xl print:rounded-none overflow-visible print:overflow-visible border border-agm-box-border/80 print:border-none"
          id="printable-voucher"
        >
          <table className="print-page-table w-full border-collapse">
            {/* Table Header using QuotationHeader */}
            <thead className="print-page-header-group">
              <tr>
                <th className="p-0 font-normal text-left border-none">
                  <QuotationHeader />
                </th>
              </tr>
            </thead>

            {/* Table Footer using QuotationFooter */}
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

            {/* Document Body */}
            <tbody>
              <tr>
                <td className="p-0 border-none">
                  <div className="px-10 sm:px-12 py-7 print:px-10 print:py-5 flex flex-col justify-start space-y-6 sm:space-y-7 text-[15px] sm:text-[15.5px] leading-relaxed text-slate-900">
                    {/* Header Row: Date (Left) and Reference (Right) */}
                    <div className="flex items-center justify-between text-[14px] text-slate-900 font-sans w-full pb-2.5 border-b border-slate-200/80 print:border-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Date:</span>
                        <div className="print:hidden">
                          <input
                            aria-label="Certificate issue date"
                            type="text"
                            value={data.date}
                            onChange={(e) =>
                              setData((prev) => ({ ...prev, date: e.target.value }))
                            }
                            className="font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded px-2.5 py-0.5 text-xs outline-none focus:border-agm-green w-[140px]"
                            placeholder="04 Sep 2026"
                          />
                        </div>
                        <span className="hidden print:inline font-bold text-black">
                          {data.date}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Reference:</span>
                        <div className="print:hidden">
                          <input
                            aria-label="Reference number"
                            type="text"
                            value={data.refNumber}
                            onChange={(e) =>
                              setData((prev) => ({
                                ...prev,
                                refNumber: e.target.value,
                              }))
                            }
                            className="font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-2.5 py-0.5 text-xs outline-none focus:border-agm-green w-[210px]"
                          />
                        </div>
                        <span className="hidden print:inline font-bold text-black font-mono">
                          {data.refNumber}
                        </span>
                      </div>
                    </div>

                    {/* Document Title */}
                    <div className="text-center py-3 sm:py-4">
                      <h1 className="text-[22px] sm:text-[24px] font-black tracking-widest text-slate-900 uppercase font-sans border-b-2 border-slate-900 inline-block px-4 pb-1">
                        SALARY CERTIFICATE
                      </h1>
                    </div>

                    {/* Addressee */}
                    <div className="text-[16px] font-bold text-slate-900">
                      <div className="print:hidden">
                        <input
                          aria-label="Addressee salutation"
                          type="text"
                          value={data.addressee}
                          onChange={(e) =>
                            setData((prev) => ({
                              ...prev,
                              addressee: e.target.value,
                            }))
                          }
                          className="font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded px-3 py-1 text-[15px] outline-none focus:border-agm-green w-[300px]"
                        />
                      </div>
                      <div className="hidden print:block font-bold text-black text-[16px]">
                        {data.addressee}
                      </div>
                    </div>

                    {/* Print-Only Presentation — Flawless Typography without Inputs */}
                    <div className="hidden print:block space-y-6 text-[15px] leading-[2.1] text-slate-900 text-left pt-1">
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
                          {data.companyName || "AGM Fitout Technical Services LLC"}
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
                        {data.employeePrefix === "Ms." || data.employeePrefix === "Mrs."
                          ? "Her"
                          : "His"}{" "}
                        current monthly salary is{" "}
                        <strong className="font-bold text-black font-sans">
                          {data.currency} {data.monthlySalaryNum?.toLocaleString()} (
                          {data.monthlySalaryText})
                        </strong>
                        .
                      </p>
                    </div>

                    {/* Screen / Interactive Editor Presentation */}
                    <div className="print:hidden space-y-6 text-left leading-[2.2] text-slate-900 pt-1">
                      {/* Paragraph 1: Employee Details & Certification */}
                      <p className="text-[15px]">
                        This is to certify that{" "}
                        <span className="inline-flex items-center gap-1 font-bold text-black">
                          <select
                            aria-label="Employee prefix"
                            value={data.employeePrefix}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                employeePrefix: e.target.value as any,
                              }))
                            }
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-1.5 py-0.5 text-xs font-bold outline-none cursor-pointer"
                          >
                            <option value="Mr.">Mr.</option>
                            <option value="Ms.">Ms.</option>
                            <option value="Mrs.">Mrs.</option>
                            <option value="Dr.">Dr.</option>
                          </select>
                          <input
                            aria-label="Employee Full Name"
                            type="text"
                            value={data.employeeName}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                employeeName: e.target.value,
                              }))
                            }
                            placeholder="Employee Name"
                            className="font-bold text-black bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded px-2.5 py-0.5 text-[15px] outline-none focus:border-agm-green w-[290px]"
                          />
                        </span>
                        , holder of Emirates ID No.{" "}
                        <input
                          aria-label="Emirates ID No"
                          type="text"
                          value={data.emiratesId}
                          onChange={(e) =>
                            setData((p) => ({
                              ...p,
                              emiratesId: e.target.value,
                            }))
                          }
                          placeholder="784-1994-1500490-4"
                          className="font-bold text-black bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded px-2.5 py-0.5 text-[15px] outline-none focus:border-agm-green w-[190px] font-sans"
                        />{" "}
                        and joining date{" "}
                        <input
                          aria-label="Joining Date"
                          type="text"
                          value={data.joiningDate}
                          onChange={(e) =>
                            setData((p) => ({
                              ...p,
                              joiningDate: e.target.value,
                            }))
                          }
                          placeholder="30/4/2024"
                          className="font-bold text-black bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded px-2.5 py-0.5 text-[15px] outline-none focus:border-agm-green w-[115px] font-sans"
                        />
                        , is employed with{" "}
                        <span className="font-bold text-black">
                          {data.companyName || "AGM Fitout Technical Services LLC"}
                        </span>{" "}
                        in the position of{" "}
                        <input
                          aria-label="Employee Position / Designation"
                          type="text"
                          value={data.position}
                          onChange={(e) =>
                            setData((p) => ({ ...p, position: e.target.value }))
                          }
                          placeholder="Position / Designation"
                          className="font-bold text-black bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded px-2.5 py-0.5 text-[15px] outline-none focus:border-agm-green w-[190px]"
                        />
                        .
                      </p>

                      {/* Paragraph 2: Disclaimer */}
                      <div>
                        <textarea
                          rows={2}
                          aria-label="Certificate Purpose / Disclaimer"
                          value={data.purposeDisclaimer}
                          onChange={(e) =>
                            setData((p) => ({
                              ...p,
                              purposeDisclaimer: e.target.value,
                            }))
                          }
                          className="w-full text-[14.5px] text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:border-agm-green resize-none leading-relaxed"
                        />
                      </div>

                      {/* Paragraph 3: Salary Information */}
                      <p className="text-[15px]">
                        {data.employeePrefix === "Ms." || data.employeePrefix === "Mrs."
                          ? "Her"
                          : "His"}{" "}
                        current monthly salary is{" "}
                        <span className="font-bold text-black">
                          {data.currency}{" "}
                          <input
                            aria-label="Monthly Salary Amount"
                            type="number"
                            value={data.monthlySalaryNum || ""}
                            onChange={(e) =>
                              handleSalaryChange(Number(e.target.value))
                            }
                            placeholder="5000"
                            className="font-bold text-black bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded px-2.5 py-0.5 text-[15px] outline-none focus:border-agm-green w-[100px] font-sans"
                          />{" "}
                          (
                          <input
                            aria-label="Monthly Salary in Words"
                            type="text"
                            value={data.monthlySalaryText}
                            onChange={(e) =>
                              setData((p) => ({
                                ...p,
                                monthlySalaryText: e.target.value,
                              }))
                            }
                            placeholder="Five Thousand UAE Dirhams only"
                            className="font-bold text-black bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded px-2.5 py-0.5 text-[15px] outline-none focus:border-agm-green w-[310px]"
                          />
                          )
                        </span>
                        .
                      </p>
                    </div>

                    {/* Closing & Signatory Block */}
                    <div className="pt-8 sm:pt-10 space-y-4 text-[15px] text-slate-900">
                      <div>
                        <p className="text-slate-800">For and on behalf of,</p>
                        <p className="font-black text-black text-[16px] pt-1">
                          {data.signatoryCompany}
                        </p>
                      </div>

                      {/* Two-Column Signatory & Stamp Layout */}
                      <div className="flex items-end justify-between pt-4 gap-8">
                        {/* Left Column: Signatory Details & Signature Line */}
                        <div className="space-y-2">
                          <div className="h-16 flex items-end">
                            <div className="w-60 border-b border-slate-400 print:border-slate-800 pb-1 text-xs text-slate-400 font-medium italic">
                              Authorized Signatory
                            </div>
                          </div>

                          <div className="space-y-0.5 pt-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800 text-sm">Name:</span>
                              <div className="print:hidden">
                                <input
                                  aria-label="Signatory Name"
                                  type="text"
                                  value={data.signatoryName}
                                  onChange={(e) =>
                                    setData((p) => ({
                                      ...p,
                                      signatoryName: e.target.value,
                                    }))
                                  }
                                  className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs font-bold text-black outline-none focus:border-agm-green w-[180px]"
                                />
                              </div>
                              <span className="hidden print:inline font-bold text-black text-sm">
                                {data.signatoryName}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="font-semibold text-slate-800 text-sm">
                                Designation:
                              </span>
                              <div className="print:hidden">
                                <input
                                  aria-label="Signatory Designation"
                                  type="text"
                                  value={data.signatoryDesignation}
                                  onChange={(e) =>
                                    setData((p) => ({
                                      ...p,
                                      signatoryDesignation: e.target.value,
                                    }))
                                  }
                                  className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold text-slate-900 outline-none focus:border-agm-green w-[180px]"
                                />
                              </div>
                              <span className="hidden print:inline font-medium text-slate-800 text-sm">
                                {data.signatoryDesignation}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Company Stamp */}
                        <div className="flex flex-col items-center justify-center">
                          <input
                            type="file"
                            ref={stampInputRef}
                            onChange={handleStampUpload}
                            accept="image/*"
                            className="hidden"
                          />

                          {data.companyStampUrl ? (
                            /* Uploaded stamp — show image */
                            <div className="relative inline-flex flex-col items-center gap-2">
                              <img
                                src={data.companyStampUrl}
                                alt="Company Stamp"
                                className="max-h-[120px] max-w-[220px] object-contain"
                              />
                              <div className="print:hidden flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => stampInputRef.current?.click()}
                                  className="text-xs text-agm-green hover:text-agm-green-2 font-semibold bg-agm-green-soft px-2.5 py-1 rounded-lg border border-agm-green/30 cursor-pointer transition-all whitespace-nowrap"
                                >
                                  Change Stamp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setData((p) => ({ ...p, companyStampUrl: undefined }))}
                                  className="text-xs text-red-500 hover:text-red-600 font-medium px-2.5 py-1 rounded-lg border border-red-200 hover:bg-red-50 cursor-pointer transition-all"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* No stamp uploaded */
                            <>
                              {/* On-Screen Upload Zone */}
                              <div
                                onClick={() => stampInputRef.current?.click()}
                                className="print:hidden group flex items-center gap-3.5 px-5 py-3.5 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-agm-green hover:bg-agm-green-soft/40 transition-all duration-200"
                                title="Click to upload company stamp"
                              >
                                <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-agm-green/10 flex items-center justify-center transition-all">
                                  <svg className="w-5 h-5 text-slate-400 group-hover:text-agm-green transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-700 group-hover:text-agm-green text-xs transition-colors">
                                    Company Stamp
                                  </p>
                                  <p className="text-[11px] text-slate-400">Click to upload (PNG/JPG)</p>
                                </div>
                              </div>

                              {/* Print Mode: Designated Stamp & Seal Frame */}
                              <div className="hidden print:flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-slate-300 rounded-full text-center p-2 text-slate-400 text-[11px] font-medium">
                                <span>Official Seal</span>
                                <span>&amp; Stamp</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Fixed Print Footer Bottom */}
          <div className="print-footer-bottom fixed-print-footer hidden print:block">
            <QuotationFooter />
          </div>

          {/* On-screen Footer */}
          <div className="w-full px-10 sm:px-12 pb-6 print:hidden">
            <QuotationFooter className="mt-6" />
          </div>
        </div>
      </div>

      {/* Saved Records Modal */}
      <SalaryCertificateSavedModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedCertificates={savedRecords}
        onLoadCertificate={handleLoadCertificate}
        onDeleteCertificate={handleDeleteCertificate}
      />
    </div>
  );
}
