"use client";

import React, { useState, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Trash2,
  Calendar,
  Building2,
  Image as ImageIcon,
  Download,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckSquare,
  Square,
  FileDown,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/hooks/api-base";
import { Button, Input } from "@/components/ui";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/context/ConfirmContext";
import { buildEmployeeDossierPdf } from "@/lib/pdf/dossier-builder";

export default function EmployeeDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("Document Preview");
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);

  // Form State
  const [docType, setDocType] = useState<string>("PASSPORT");
  const [docNumber, setDocNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [ocrSuccess, setOcrSuccess] = useState<boolean>(false);

  // Fetch Employee details
  const { data: employee, isLoading: isLoadingEmp } = useQuery<any>({
    queryKey: ["employee-details", id],
    queryFn: () => fetchJson(`/api/employees/${id}`),
  });

  // Fetch Documents for this employee
  const { data: docsData, isLoading: isLoadingDocs, refetch } = useQuery<{
    documents: any[];
    summary: any;
  }>({
    queryKey: ["employee-documents", id],
    queryFn: () => fetchJson(`/api/hr/documents?employeeId=${id}`),
  });

  const documents = useMemo(() => docsData?.documents || [], [docsData?.documents]);

  // Find critical or expired documents for the top alert banner
  const criticalDocuments = useMemo(() => {
    return documents.filter((d: any) => d.status === "CRITICAL" || d.status === "EXPIRED");
  }, [documents]);

  const uploadMutation = useMutation({
    mutationFn: (body: any) =>
      fetchJson("/api/hr/documents", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents", id] });
      queryClient.invalidateQueries({ queryKey: ["employee-details", id] });
      toast.success("Compliance document saved successfully!");
      setIsUploading(false);
      setDocNumber("");
      setIssueDate("");
      setExpiryDate("");
      setNotes("");
      setFileBase64(null);
      setFileName(null);
      setOcrSuccess(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to upload document");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) =>
      fetchJson(`/api/hr/documents?id=${docId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents", id] });
      queryClient.invalidateQueries({ queryKey: ["employee-details", id] });
      toast.success("Document removed from employee vault.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete document");
    },
  });

  // Handle file select and trigger local OCR scanning
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("File size exceeds 8MB limit");
      return;
    }

    setFileName(file.name);
    setOcrSuccess(false);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Str = reader.result as string;
      setFileBase64(base64Str);

      // Trigger OCR scanner if it's an image
      if (base64Str.startsWith("data:image")) {
        try {
          setIsScanning(true);
          const scanRes = await fetchJson<any>("/api/hr/documents/scan", {
            method: "POST",
            body: JSON.stringify({ image: base64Str }),
          });

          if (scanRes && scanRes.success && scanRes.isDocument) {
            setOcrSuccess(true);
            if (scanRes.documentType && scanRes.documentType !== "OTHER") {
              setDocType(scanRes.documentType);
            }
            if (scanRes.documentNumber) {
              setDocNumber(scanRes.documentNumber);
            }
            if (scanRes.expiryDate) {
              setExpiryDate(scanRes.expiryDate);
            }
            if (scanRes.issueDate) {
              setIssueDate(scanRes.issueDate);
            }
            if (scanRes.notes) {
              setNotes(scanRes.notes);
            }
            toast.success(`Smart OCR: Auto-extracted ${scanRes.documentType} #${scanRes.documentNumber || ""}`);
          }
        } catch (scanErr) {
          console.warn("OCR scan notice:", scanErr);
        } finally {
          setIsScanning(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim() || !expiryDate.trim()) {
      toast.error("Document Number and Expiry Date are required");
      return;
    }

    uploadMutation.mutate({
      employeeId: id,
      documentType: docType,
      documentNumber: docNumber.trim(),
      issueDate: issueDate || undefined,
      expiryDate,
      fileName,
      fileUrl: fileBase64,
      notes,
    });
  };

  const handleDeleteDocument = async (doc: any) => {
    const confirmed = await confirm({
      title: `Delete ${doc.documentType.replace(/_/g, " ")}?`,
      message: `Are you sure you want to remove document #${doc.documentNumber || ""} from this employee profile?`,
      confirmText: "Delete Document",
      variant: "danger",
    });

    if (confirmed) {
      deleteMutation.mutate(doc.id);
    }
  };

  // Single document download handler
  const handleDownloadSingle = (doc: any) => {
    if (!doc.fileUrl) {
      toast.error("No attachment file is available to download.");
      return;
    }

    const safeEmployeeName = `${employee?.firstName || "Staff"}_${employee?.lastName || ""}`.trim().replace(/\s+/g, "_");
    const ext = doc.fileUrl.includes("png")
      ? "png"
      : doc.fileUrl.includes("pdf")
      ? "pdf"
      : "jpg";
    const downloadFileName = `${employee?.employeeCode || "EMP"}_${doc.documentType}_${safeEmployeeName}.${ext}`;

    const link = document.createElement("a");
    link.href = doc.fileUrl;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${downloadFileName}`);
  };

  // Toggle selection for bulk PDF merge
  const toggleSelectDoc = (docId: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedDocIds.size === documents.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(documents.map((d: any) => d.id)));
    }
  };

  // Download Merged PDF Dossier
  const handleDownloadMergedDossier = async () => {
    if (documents.length === 0) {
      toast.error("No compliance documents exist to merge.");
      return;
    }

    try {
      setIsGeneratingDossier(true);
      toast.info("Compiling official multi-page PDF dossier...");

      const selectedList =
        selectedDocIds.size > 0
          ? documents.filter((d: any) => selectedDocIds.has(d.id))
          : documents;

      const employeeFullName = `${employee?.firstName || ""} ${employee?.lastName || ""}`.trim() || "Staff Member";
      const joiningDateStr = employee?.joiningDate
        ? new Date(employee.joiningDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "N/A";

      const pdfBytes = await buildEmployeeDossierPdf(
        {
          employeeCode: employee?.employeeCode || "EMP-000",
          fullName: employeeFullName,
          department: employee?.department || "Operations",
          designation: employee?.designation || "Staff",
          joiningDate: joiningDateStr,
          email: employee?.email,
          phone: employee?.phone,
          employmentStatus: employee?.employmentStatus || "ACTIVE",
        },
        selectedList
      );

      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const safeName = employeeFullName.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `${employee?.employeeCode || "EMP"}_${safeName}_Compliance_Dossier.pdf`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Dossier PDF downloaded successfully!");
    } catch (err: any) {
      console.error("Dossier generation error:", err);
      toast.error("Failed to compile dossier PDF. Please try again.");
    } finally {
      setIsGeneratingDossier(false);
    }
  };

  // Context-aware dynamic labels and placeholders
  const getContextFields = (type: string) => {
    switch (type) {
      case "PASSPORT":
        return {
          numberLabel: "Passport Number *",
          placeholder: "e.g. Pass235523424 or AB1234567",
          notesPlaceholder: "e.g. Directorate of Immigration & Passports",
          docDesc: "National Travel Passport Document",
        };
      case "EMIRATES_ID":
        return {
          numberLabel: "Emirates ID Number *",
          placeholder: "e.g. 784-1990-1234567-1",
          notesPlaceholder: "e.g. UAE Federal Identity Authority (ICP)",
          docDesc: "Federal Identity Card (Front & Back)",
        };
      case "RESIDENCE_VISA":
        return {
          numberLabel: "Residence Visa File Number *",
          placeholder: "e.g. 201/2026/1234567",
          notesPlaceholder: "e.g. GDRFA Dubai Employment Residence",
          docDesc: "UAE Residence Employment Visa",
        };
      case "CONTRACT":
        return {
          numberLabel: "Labor Card / Contract Number *",
          placeholder: "e.g. MOHRE-12345678",
          notesPlaceholder: "e.g. MOHRE Limited Employment Contract",
          docDesc: "Ministry of Human Resources Contract",
        };
      default:
        return {
          numberLabel: "Document Number *",
          placeholder: "e.g. DOC-987654",
          notesPlaceholder: "e.g. Issuing authority, cert details",
          docDesc: "Compliance & Safety Certification",
        };
    }
  };

  const contextFields = getContextFields(docType);

  return (
    <div className="w-full min-h-full p-4 sm:p-6 space-y-5 bg-[#f8fafc] text-slate-800 font-sans">
      {/* =========================================================================
          TOP BREADCRUMB & HEADER
          ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/hr/employees/${id}`}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
            title="Back to Employee Profile"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Link href="/hr/employees" className="hover:text-slate-600">
                Employees
              </Link>
              <span>/</span>
              <Link href={`/hr/employees/${id}`} className="hover:text-slate-600">
                {employee?.firstName} {employee?.lastName}
              </Link>
              <span>/</span>
              <span className="text-slate-700 font-semibold">Compliance Documents Vault</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-0.5">
              Legal Documents &amp; Compliance Vault
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {documents.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={isGeneratingDossier}
              onClick={handleDownloadMergedDossier}
              className="text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-50"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
              {selectedDocIds.size > 0
                ? `Export ${selectedDocIds.size} as Merged PDF`
                : "Export All as Merged PDF"}
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            onClick={() => setIsUploading(!isUploading)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
          >
            <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
            {isUploading ? "Cancel Upload" : "Upload New Document"}
          </Button>
        </div>
      </div>

      {/* =========================================================================
          PROMINENT EXPIRY ALERT BANNER (If any document is critical or expired)
          ========================================================================= */}
      {criticalDocuments.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent border-l-4 border-rose-500 bg-white p-4 rounded-xl shadow-2xs space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wide">
                  Urgent Compliance Action Required
                </h4>
                <p className="text-xs text-rose-800 font-medium mt-0.5">
                  {criticalDocuments.length === 1
                    ? `${criticalDocuments[0].documentType.replace(/_/g, " ")} (${criticalDocuments[0].documentNumber || "N/A"}) requires renewal.`
                    : `${criticalDocuments.length} legal documents are expired or expiring within 30 days.`}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setIsUploading(true);
                if (criticalDocuments[0]) {
                  setDocType(criticalDocuments[0].documentType);
                }
              }}
              className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Renew Document Now
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {criticalDocuments.map((cd: any) => (
              <span
                key={cd.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-white border border-rose-200 text-rose-900 shadow-3xs"
              >
                <Clock className="w-3 h-3 text-rose-600" />
                <span>{cd.documentType.replace(/_/g, " ")}:</span>
                <span className="font-bold text-rose-700">
                  {cd.daysRemaining !== null
                    ? cd.daysRemaining <= 0
                      ? `Expired (${Math.abs(cd.daysRemaining)}d ago)`
                      : `${cd.daysRemaining} days left`
                    : "Action Required"}
                </span>
                <span className="text-[10px] text-slate-400">({cd.expiryDate})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          EMPLOYEE MASTER MINI CARD
          ========================================================================= */}
      {employee && (
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-2xs">
              {`${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">
                {employee.firstName} {employee.lastName}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                {employee.employeeCode} &bull; {employee.designation || "Staff"} &bull; {employee.department || "Operations"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {documents.length} Active Verified Credentials
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          DEDICATED UPLOAD FORM CARD (With Smart Local OCR Auto-Extraction)
          ========================================================================= */}
      {isUploading && (
        <div className="bg-white rounded-2xl p-5 border-2 border-emerald-600/40 shadow-md space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-emerald-600" />
                Upload &amp; Scan Compliance Document
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Drop your Passport or Emirates ID image. The local OCR engine will automatically extract the details.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">PNG, JPG, PDF up to 8MB</span>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
            {/* Row 1: Document Type, Context-Aware Document Number, Expiry Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Document Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={docType}
                  onChange={(e) => {
                    setDocType(e.target.value);
                    setOcrSuccess(false);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium cursor-pointer"
                >
                  <option value="PASSPORT">Passport</option>
                  <option value="EMIRATES_ID">Emirates ID</option>
                  <option value="RESIDENCE_VISA">Residence Visa</option>
                  <option value="CONTRACT">Labor Contract</option>
                  <option value="SAFETY_CERTIFICATE">Safety Certificate</option>
                  <option value="OTHER">Other Compliance Document</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-semibold">
                    {contextFields.numberLabel}
                  </label>
                  {ocrSuccess && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                      <Sparkles className="w-2.5 h-2.5" />
                      Auto-Extracted
                    </span>
                  )}
                </div>
                <Input
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder={contextFields.placeholder}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-semibold">
                    Expiry Date <span className="text-rose-500">*</span>
                  </label>
                  {ocrSuccess && expiryDate && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Verified
                    </span>
                  )}
                </div>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Row 2: Issue Date & Notes / Authority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Issue Date (Optional)
                </label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Issuing Authority / Notes
                </label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={contextFields.notesPlaceholder}
                />
              </div>
            </div>

            {/* Drag & Drop File Upload Box with Live Scanner Animation */}
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-xl p-5 text-center transition-all bg-slate-50/50">
              <input
                type="file"
                id="docUploadInput"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="docUploadInput" className="cursor-pointer block space-y-2">
                <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs border border-emerald-100">
                  {isScanning ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                  ) : (
                    <ImageIcon className="w-5 h-5" />
                  )}
                </div>

                {isScanning ? (
                  <div>
                    <span className="font-bold text-emerald-800 text-xs block flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      Scanning document with local OCR engine...
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Reading document type, number, dates, and MRZ code
                    </span>
                  </div>
                ) : fileName ? (
                  <div>
                    <span className="font-bold text-emerald-800 text-xs block flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {fileName}
                    </span>
                    <span className="text-[11px] text-slate-400">Click to replace file</span>
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-slate-700 text-xs block">
                      Click to browse or drag &amp; drop {docType.replace(/_/g, " ")} image / PDF
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Supported: JPG, PNG, WebP, PDF &bull; AI reads Passport MRZ &amp; Emirates ID
                    </span>
                  </div>
                )}
              </label>

              {/* Uploaded Image Preview */}
              {fileBase64 && fileBase64.startsWith("data:image") && (
                <div className="mt-3 inline-block">
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-xs max-h-36 mx-auto">
                    <img
                      src={fileBase64}
                      alt="Upload Preview"
                      className="max-h-36 w-auto object-contain bg-white"
                    />
                    <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                      Preview
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Form Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsUploading(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={uploadMutation.isPending}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer"
              >
                Save &amp; Register Document
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          DOCUMENTS REGISTER (DEDUPLICATED ACTIVE CREDENTIALS)
          ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Active Compliance Credentials Register
            </h3>
            <p className="text-[11px] text-slate-400">
              Single unified record per document type. Replaced documents are safely archived in renewal history.
            </p>
          </div>

          {documents.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
              >
                {selectedDocIds.size === documents.length ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                    <span>Select All ({documents.length})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {isLoadingDocs ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-400" />
            <p>Loading compliance vault records...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 shadow-2xs">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No Documents Uploaded Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Upload the employee passport or Emirates ID image. The smart scanner will automatically detect and organize credentials.
            </p>
            <Button
              size="sm"
              onClick={() => setIsUploading(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
            >
              <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
              Upload First Document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc: any) => {
              const hasImage = Boolean(doc.fileUrl);
              const isExpired = doc.status === "EXPIRED";
              const isCritical = doc.status === "CRITICAL";
              const isSelected = selectedDocIds.has(doc.id);

              return (
                <div
                  key={doc.id}
                  className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs group ${
                    isSelected
                      ? "border-emerald-600 ring-2 ring-emerald-600/20"
                      : "border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Select Checkbox, Icon, Title, Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleSelectDoc(doc.id)}
                          className="text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                          <FileText className="w-4 h-4" />
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 text-xs tracking-tight">
                            {doc.documentType.replace(/_/g, " ")}
                          </h4>
                          <span className="font-mono text-[11px] text-slate-600 font-semibold block">
                            {doc.documentNumber || "Not Registered"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isExpired
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : isCritical
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>

                    {/* Expiry Details Box */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1 font-mono">
                      <div className="flex justify-between text-slate-500 font-sans">
                        <span>Expiry Date:</span>
                        <span className="font-bold text-slate-800">{doc.expiryDate || "—"}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-sans">
                        <span>Countdown:</span>
                        <span
                          className={`font-bold ${
                            isExpired ? "text-rose-600" : isCritical ? "text-amber-600" : "text-emerald-700"
                          }`}
                        >
                          {doc.daysRemaining !== null
                            ? isExpired
                              ? `Expired (${Math.abs(doc.daysRemaining)}d ago)`
                              : `${doc.daysRemaining} days left`
                            : "No expiry"}
                        </span>
                      </div>
                    </div>

                    {/* Document Image Thumbnail Preview */}
                    {hasImage && doc.fileUrl.startsWith("data:image") ? (
                      <div
                        onClick={() => {
                          setSelectedPreviewImage(doc.fileUrl);
                          setPreviewTitle(`${doc.documentType.replace(/_/g, " ")} - ${doc.documentNumber || ""}`);
                        }}
                        className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-28 flex items-center justify-center cursor-pointer group"
                      >
                        <img
                          src={doc.fileUrl}
                          alt={doc.documentType}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          View Full Image
                        </div>
                      </div>
                    ) : hasImage && doc.fileUrl.includes("pdf") ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center gap-2 text-xs text-slate-600">
                        <FileText className="w-5 h-5 text-rose-600 shrink-0" />
                        <span className="truncate">{doc.fileName || "PDF Document Attached"}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Actions Row */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      {hasImage && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPreviewImage(doc.fileUrl);
                              setPreviewTitle(`${doc.documentType.replace(/_/g, " ")} - ${doc.documentNumber || ""}`);
                            }}
                            className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                            title="Preview Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadSingle(doc)}
                            className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
                            title="Download Single File"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </>
                      )}

                      {!hasImage && (
                        <span className="text-[11px] text-slate-400">Record Only</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          FULLSCREEN LIGHTBOX MODAL
          ========================================================================= */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">{previewTitle}</span>
              <button
                type="button"
                onClick={() => setSelectedPreviewImage(null)}
                className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
            <img
              src={selectedPreviewImage}
              alt="Document Full Preview"
              className="max-h-[75vh] w-auto mx-auto rounded-xl object-contain bg-slate-50"
            />
          </div>
        </div>
      )}
    </div>
  );
}
