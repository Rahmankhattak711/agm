"use client";

import React, { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  Link2,
  CreditCard,
  File,
  CheckCircle2,
  Calendar,
  Upload,
  Camera,
  X,
  ShieldCheck,
} from "lucide-react";
import { useAccounts } from "@/lib/hooks/api-hooks";
import { formatAed } from "@/lib/utils/format";
import { toast } from "@/lib/toast";

const ASSET_CATEGORIES = [
  {
    value: "OFFICE_EQUIPMENT",
    label: "Office Equipment",
    defaultRate: 20,
    suggestedAccountCode: "1510",
  },
  {
    value: "COMPUTER_HARDWARE",
    label: "IT & Computer Hardware",
    defaultRate: 25,
    suggestedAccountCode: "1213",
  },
  {
    value: "COMPANY_VEHICLE",
    label: "Company Vehicles",
    defaultRate: 20,
    suggestedAccountCode: "1520",
  },
  {
    value: "MACHINERY_EQUIPMENT",
    label: "Machinery & Tools",
    defaultRate: 15,
    suggestedAccountCode: "1530",
  },
  {
    value: "FURNITURE_FIXTURES",
    label: "Furniture & Fixtures",
    defaultRate: 10,
    suggestedAccountCode: "1540",
  },
  {
    value: "LEASEHOLD_IMPROVEMENT",
    label: "Leasehold Improvements",
    defaultRate: 10,
    suggestedAccountCode: "1550",
  },
];

const INPUT_STYLE: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  backgroundColor: "#ffffff",
};

export default function RegisterFixedAssetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: accounts = [] } = useAccounts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Core Form State
  const [assetCode, setAssetCode] = useState(
    () => `AST-${Date.now().toString().slice(-4)}`,
  );
  const [assetName, setAssetName] = useState("");
  const [category, setCategory] = useState("OFFICE_EQUIPMENT");
  const [serialNumber, setSerialNumber] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [purchaseDate, setPurchaseDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [cost, setCost] = useState("0");
  const [salvageValue, setSalvageValue] = useState("0");
  const [depreciationRate, setDepreciationRate] = useState("20");

  // Ledger Accounts State
  const [autoCapitalize, setAutoCapitalize] = useState(true);
  const [assetAccountId, setAssetAccountId] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [accumulatedDeprAccountId, setAccumulatedDeprAccountId] = useState("");
  const [deprExpenseAccountId, setDeprExpenseAccountId] = useState("");

  // File & Notes State (Saved in fixed_assets table)
  const [imageUrl, setImageUrl] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileType, setFileType] = useState<string>("");
  const [fileSizeLabel, setFileSizeLabel] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Filter specific posting accounts
  const assetAccounts = useMemo(() => {
    return accounts.filter(
      (a) =>
        (a.type === "ASSET" || a.accountCode.startsWith("1")) &&
        (a.level || 4) >= 2,
    );
  }, [accounts]);

  const paymentAccounts = useMemo(() => {
    return accounts.filter(
      (a) =>
        (a.type === "ASSET" &&
          (a.accountCode.startsWith("10") || a.accountCode.startsWith("11"))) ||
        (a.type === "LIABILITY" && a.accountCode.startsWith("20")),
    );
  }, [accounts]);

  const expenseAccounts = useMemo(() => {
    return accounts.filter(
      (a) =>
        a.type === "EXPENSE" ||
        a.accountCode.startsWith("5") ||
        a.accountCode.startsWith("6"),
    );
  }, [accounts]);

  // Handle category change with auto-suggestions
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const catConfig = ASSET_CATEGORIES.find((c) => c.value === newCat);
    if (catConfig) {
      setDepreciationRate(catConfig.defaultRate.toString());

      const matchingAsset = assetAccounts.find(
        (a) =>
          a.accountCode.startsWith(catConfig.suggestedAccountCode) ||
          (catConfig.suggestedAccountCode === "1213" && a.accountCode === "1213"),
      );
      if (matchingAsset) {
        setAssetAccountId(matchingAsset.id);
      }
    }
  };

  // Set default accounts once accounts are loaded
  React.useEffect(() => {
    if (accounts.length > 0 && !assetAccountId) {
      const defaultAsset =
        accounts.find((a) => a.accountCode === "1213") ||
        accounts.find((a) => a.accountCode.startsWith("15")) ||
        assetAccounts[0];
      if (defaultAsset) setAssetAccountId(defaultAsset.id);

      const defaultBank =
        accounts.find((a) => a.accountCode === "1020") ||
        accounts.find((a) => a.accountCode === "1010") ||
        paymentAccounts[0];
      if (defaultBank) setPaymentAccountId(defaultBank.id);

      const defaultAccum =
        accounts.find((a) =>
          a.accountName.toLowerCase().includes("accumulated"),
        ) ||
        accounts.find((a) => a.accountCode.startsWith("159")) ||
        assetAccounts[0];
      if (defaultAccum) setAccumulatedDeprAccountId(defaultAccum.id);

      const defaultExpense =
        accounts.find((a) =>
          a.accountName.toLowerCase().includes("depreciation"),
        ) || expenseAccounts[0];
      if (defaultExpense) setDeprExpenseAccountId(defaultExpense.id);
    }
  }, [
    accounts,
    assetAccountId,
    assetAccounts,
    paymentAccounts,
    expenseAccounts,
  ]);

  const processSelectedFile = (file: File) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isAllowedExt = ["jpg", "jpeg", "png", "webp", "pdf"].includes(ext);

    if (!allowedTypes.includes(file.type) && !isAllowedExt) {
      toast.error("Only JPG, PNG, WEBP, or PDF files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Maximum allowed file size is 5MB.");
      return;
    }

    setFileName(file.name);
    const detectedType = file.type
      ? file.type.toUpperCase()
      : ext === "pdf"
        ? "APPLICATION/PDF"
        : `IMAGE/${ext.toUpperCase()}`;
    setFileType(detectedType);

    const kb = Math.max(1, Math.round(file.size / 1024));
    setFileSizeLabel(kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle image / file upload from Computer or Phone
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleClearFile = () => {
    setImageUrl("");
    setFileName("");
    setFileType("");
    setFileSizeLabel("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const numericCost = Math.max(0, parseFloat(cost) || 0);
  const numericSalvage = Math.max(0, parseFloat(salvageValue) || 0);
  const numericRate = Math.max(0, parseFloat(depreciationRate) || 0);
  const annualDepr = Math.max(
    0,
    Math.round((numericCost - numericSalvage) * (numericRate / 100) * 100) / 100,
  );
  const selectedCategoryLabel =
    ASSET_CATEGORIES.find((c) => c.value === category)?.label ||
    "Office Equipment";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!assetName.trim()) {
      setFormError("Please enter an asset title.");
      return;
    }
    if (isNaN(numericCost) || numericCost <= 0) {
      setFormError("Please enter a valid purchase cost greater than 0 AED.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetCode: assetCode.trim(),
          assetName: assetName.trim(),
          category,
          purchaseDate,
          cost: numericCost,
          salvageValue: numericSalvage,
          depreciationRate: numericRate || 20,
          assetAccountId: assetAccountId || undefined,
          accumulatedDeprAccountId: accumulatedDeprAccountId || undefined,
          deprExpenseAccountId: deprExpenseAccountId || undefined,
          paymentAccountId: autoCapitalize ? paymentAccountId : undefined,
          autoCapitalize,
          serialNumber: serialNumber.trim() || undefined,
          assignedTo: assignedTo.trim() || undefined,
          imageUrl: imageUrl || undefined,
          fileName: fileName.trim() || undefined,
          fileType: fileType || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register fixed asset");
      }

      toast.success(
        autoCapitalize && paymentAccountId
          ? `Asset ${assetCode} registered & capitalized in General Ledger!`
          : `Asset ${assetCode} registered successfully!`,
      );

      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["balance-sheet"] });
      queryClient.invalidateQueries({ queryKey: ["trial-balance-report"] });

      router.push("/operations/fixed-assets");
    } catch (err: any) {
      setFormError(err.message || "Failed to create fixed asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="w-full min-h-full font-sans text-slate-700 px-4 sm:px-6 py-4"
      style={{ backgroundColor: "#eef2f6" }}
    >
      <div className="max-w-5xl mx-auto space-y-4">
        {/* =========================================================================
            TOP HEADER CARD
            ========================================================================= */}
        <div
          className="bg-white rounded-2xl px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            border: "1px solid #cbd5e1",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/operations/fixed-assets")}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              style={{ border: "1px solid #cbd5e1" }}
              title="Back to Fixed Assets"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "#dbeafe",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
              }}
            >
              <FileText className="w-4 h-4" />
            </div>

            <div>
              <h1 className="text-sm sm:text-[15px] font-semibold text-slate-900">
                Register Asset
              </h1>
              <p className="text-[11px] font-normal text-slate-500">
                Asset details, linked ledger accounts, financials, and file in one clean flow.
              </p>
            </div>
          </div>

          <div className="self-start sm:self-auto">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium"
              style={{
                backgroundColor: "#ecfdf5",
                color: "#047857",
                border: "1px solid #6ee7b7",
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
              <span>Secure asset record</span>
            </span>
          </div>
        </div>

        {formError && (
          <div
            className="px-4 py-3 rounded-xl text-xs font-medium"
            style={{
              backgroundColor: "#fff1f2",
              color: "#be123c",
              border: "1px solid #fda4af",
            }}
          >
            {formError}
          </div>
        )}

        {/* =========================================================================
            TWO-COLUMN FORM + STICKY SUMMARY SIDEBAR
            ========================================================================= */}
        <form
          id="register-asset-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4"
          style={{ position: "relative" }}
        >
          {/* LEFT COLUMN: FORM SECTIONS */}
          <div className="lg:col-span-8 space-y-4">
            {/* Section 1: Asset Information (Soft Blue Tint Header) */}
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{
                border: "1px solid #cbd5e1",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              }}
            >
              <div
                className="px-5 py-3 flex items-center gap-2.5"
                style={{
                  backgroundColor: "#f0f7ff",
                  borderBottom: "1px solid #dbeafe",
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: "#dbeafe",
                    color: "#1d4ed8",
                  }}
                >
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-semibold text-slate-800">
                  Asset Information
                </h2>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Asset Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder="e.g. Dell OptiPlex 7090 - IT Workstation"
                    required
                    style={INPUT_STYLE}
                    className="w-full rounded-lg px-3 py-2 text-xs font-normal text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Asset Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    style={INPUT_STYLE}
                    className="w-full rounded-lg px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
                  >
                    {ASSET_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Acquisition Date <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      required
                      style={INPUT_STYLE}
                      className="w-full rounded-lg pl-8 pr-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Asset Code
                  </label>
                  <input
                    type="text"
                    value={assetCode}
                    onChange={(e) => setAssetCode(e.target.value)}
                    placeholder="AST-001"
                    required
                    style={INPUT_STYLE}
                    className="w-full rounded-lg px-3 py-2 text-xs font-normal text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Custodian / Department
                  </label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="e.g. Operations / Site Engineer / Owner"
                    style={INPUT_STYLE}
                    className="w-full rounded-lg px-3 py-2 text-xs font-normal text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Serial / Plate Number
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g. SN-89234 or Plate A-9902"
                    style={INPUT_STYLE}
                    className="w-full rounded-lg px-3 py-2 text-xs font-normal text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Linked Records / Accounts (Soft Indigo Tint Header) */}
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{
                border: "1px solid #cbd5e1",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              }}
            >
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{
                  backgroundColor: "#f5f3ff",
                  borderBottom: "1px solid #e0e7ff",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: "#e0e7ff",
                      color: "#4338ca",
                    }}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-xs font-semibold text-slate-800">
                    Linked Ledger Accounts
                  </h2>
                </div>

                <label className="inline-flex items-center gap-1.5 text-[11px] font-normal text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCapitalize}
                    onChange={(e) => setAutoCapitalize(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-600 cursor-pointer"
                  />
                  <span>Auto-capitalize in General Ledger</span>
                </label>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Asset Account (Debit)
                  </label>
                  <select
                    value={assetAccountId}
                    onChange={(e) => setAssetAccountId(e.target.value)}
                    required
                    style={INPUT_STYLE}
                    className="w-full rounded-lg px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
                  >
                    {assetAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountCode} - {a.accountName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Payment Method / Account (Credit)
                  </label>
                  <select
                    value={paymentAccountId}
                    onChange={(e) => setPaymentAccountId(e.target.value)}
                    disabled={!autoCapitalize}
                    required={autoCapitalize}
                    style={INPUT_STYLE}
                    className="w-full rounded-lg px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-blue-600 cursor-pointer disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    {paymentAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountCode} - {a.accountName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Accumulated Depreciation Account
                  </label>
                  <select
                    value={accumulatedDeprAccountId}
                    onChange={(e) => setAccumulatedDeprAccountId(e.target.value)}
                    required
                    style={INPUT_STYLE}
                    className="w-full rounded-lg px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
                  >
                    {assetAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountCode} - {a.accountName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Depreciation Expense Account
                  </label>
                  <select
                    value={deprExpenseAccountId}
                    onChange={(e) => setDeprExpenseAccountId(e.target.value)}
                    required
                    style={INPUT_STYLE}
                    className="w-full rounded-lg px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
                  >
                    {expenseAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountCode} - {a.accountName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Financial Details (Soft Amber/Warm Tint Header) */}
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{
                border: "1px solid #cbd5e1",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              }}
            >
              <div
                className="px-5 py-3 flex items-center gap-2.5"
                style={{
                  backgroundColor: "#fffbeb",
                  borderBottom: "1px solid #fef08a",
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: "#fef3c7",
                    color: "#b45309",
                  }}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-semibold text-slate-800">
                  Financial Details
                </h2>
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Amount (AED) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    required
                    style={INPUT_STYLE}
                    className="w-full rounded-lg px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Salvage Value (AED)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={salvageValue}
                    onChange={(e) => setSalvageValue(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    style={INPUT_STYLE}
                    className="w-full rounded-lg px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Depr. Rate (%/yr)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={depreciationRate}
                    onChange={(e) => setDepreciationRate(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    required
                    style={INPUT_STYLE}
                    className="w-full rounded-lg px-3 py-2 text-xs font-normal text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: File & Notes (Soft Mint/Green Tint Header + Computer & Phone Upload) */}
            <div
              className="bg-white rounded-2xl overflow-hidden"
              style={{
                border: "1px solid #cbd5e1",
                boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              }}
            >
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{
                  backgroundColor: "#f0fdf4",
                  borderBottom: "1px solid #bbf7d0",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: "#dcfce7",
                      color: "#15803d",
                    }}
                  >
                    <File className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-xs font-semibold text-slate-800">
                    File &amp; Notes
                  </h2>
                </div>

                <span
                  className="inline-flex items-center gap-1 text-[10.5px] font-normal px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                  }}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Direct DB Storage</span>
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1.5">
                    Choose Asset File / Image (Computer or Phone)
                  </label>

                  {/* Hidden File Input (Computer / Phone Gallery / PDF / Images) */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Hidden Camera Input (Direct Phone Camera Capture) */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Interactive Upload Box */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-all"
                    style={{
                      backgroundColor: isDragging ? "#eff6ff" : "#f8fafc",
                      border: isDragging
                        ? "1.5px dashed #1d4ed8"
                        : "1.5px dashed #93c5fd",
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                        style={{
                          backgroundColor: "#1d4ed8",
                          color: "#ffffff",
                          border: "1px solid #1e40af",
                        }}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Choose File</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cameraInputRef.current?.click();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer shrink-0 sm:hidden"
                        style={{
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Camera</span>
                      </button>

                      <div className="min-w-0">
                        <span className="text-xs font-normal text-slate-700 block truncate">
                          {fileName || "No file chosen — click to browse or drop file here"}
                        </span>
                        {fileSizeLabel && (
                          <span className="text-[10px] text-emerald-600 font-normal">
                            {fileSizeLabel} • Ready to save in database
                          </span>
                        )}
                      </div>
                    </div>

                    {fileName && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearFile();
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 cursor-pointer"
                        style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}
                        title="Remove selected file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-[10.5px] font-normal text-slate-400 mt-1.5">
                    Allowed: JPG, PNG, WEBP, or PDF. Maximum size: 5MB. Works on PC, Mac, Android &amp; iPhone.
                  </p>

                  {/* Image / PDF Preview */}
                  {imageUrl && (
                    <div
                      className="mt-2.5 p-2.5 rounded-xl flex items-center justify-between gap-3"
                      style={{
                        backgroundColor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {imageUrl.startsWith("data:image") ? (
                          <img
                            src={imageUrl}
                            alt="Selected asset preview"
                            className="h-12 w-12 rounded-lg object-cover bg-white shrink-0"
                            style={{ border: "1px solid #cbd5e1" }}
                          />
                        ) : (
                          <div
                            className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: "#fee2e2",
                              color: "#b91c1c",
                              border: "1px solid #fecaca",
                            }}
                          >
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-slate-800 block truncate">
                            {fileName}
                          </span>
                          <span className="text-[10.5px] font-normal text-emerald-700">
                            {fileType} ({fileSizeLabel}) — Stored securely in fixed_assets table
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      File Name
                    </label>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="Selected file name"
                      style={{
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#f8fafc",
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs font-normal text-slate-700 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-600 block mb-1">
                      File Type
                    </label>
                    <input
                      type="text"
                      value={fileType}
                      readOnly
                      placeholder="AUTO DETECTED"
                      style={{
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#f8fafc",
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs font-normal text-slate-500 placeholder-slate-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Description / Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional details about this asset..."
                    style={INPUT_STYLE}
                    className="w-full rounded-lg px-3 py-2 text-xs font-normal text-slate-800 placeholder-slate-400 outline-none focus:border-blue-600 resize-y"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: FULL-HEIGHT TRACK + STICKY INNER WRAPPER */}
          <div className="lg:col-span-4">
            <div
              className="space-y-3.5"
              style={{ position: "sticky", top: "16px", zIndex: 10 }}
            >
              {/* Summary Box */}
              <div
                className="bg-white rounded-2xl p-4 space-y-3"
                style={{
                  border: "1px solid #cbd5e1",
                  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
                    ASSET SUMMARY
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
                    {selectedCategoryLabel}
                  </h3>
                </div>

                <div className="space-y-1.5">
                  <div
                    className="rounded-lg px-3 py-2 flex items-center justify-between text-xs"
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span className="font-normal text-slate-500">Amount</span>
                    <span className="font-medium text-slate-800">
                      {formatAed(numericCost)}
                    </span>
                  </div>

                  <div
                    className="rounded-lg px-3 py-2 flex items-center justify-between text-xs"
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span className="font-normal text-slate-500">
                      Annual Depr. ({numericRate}%)
                    </span>
                    <span className="font-medium text-slate-800">
                      {formatAed(annualDepr)}
                    </span>
                  </div>

                  <div
                    className="rounded-lg px-3 py-2 flex items-center justify-between text-xs"
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span className="font-normal text-slate-500">Status</span>
                    <span className="font-medium text-slate-800 text-[11px] uppercase">
                      {autoCapitalize ? "CAPITALIZED" : "DRAFT"}
                    </span>
                  </div>
                </div>

                <div
                  className="rounded-xl p-3"
                  style={{
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <span
                    className="text-[9.5px] font-medium uppercase tracking-wider block"
                    style={{ color: "#1d4ed8" }}
                  >
                    TOTAL NET BOOK AMOUNT
                  </span>
                  <span className="text-base font-semibold text-slate-900 block mt-0.5">
                    {formatAed(numericCost)}
                  </span>
                </div>
              </div>

              {/* Readiness Status Box */}
              <div
                className="rounded-2xl p-3.5"
                style={{
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #6ee7b7",
                }}
              >
                <div
                  className="flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: "#047857" }}
                >
                  <CheckCircle2
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: "#10b981" }}
                  />
                  <span>Ready to upload</span>
                </div>
                <p
                  className="text-[11px] font-normal mt-1 leading-relaxed"
                  style={{ color: "#065f46" }}
                >
                  Add the asset title, acquisition date, amount, and optional image or PDF file.
                </p>
              </div>

              {/* Submit & Cancel Box */}
              <div
                className="bg-white rounded-2xl p-3.5 space-y-2"
                style={{
                  border: "1px solid #cbd5e1",
                  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                }}
              >
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl text-white text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  style={{
                    backgroundColor: "#1d4ed8",
                    color: "#ffffff",
                    border: "1px solid #1e40af",
                  }}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Saving Asset..." : "Register Asset"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/operations/fixed-assets")}
                  className="w-full py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-xs font-normal transition-all cursor-pointer"
                  style={{ border: "1px solid #cbd5e1" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
