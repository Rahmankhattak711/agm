"use client";

import React, { useCallback, useMemo, useState } from "react";
import QuotationTemplate, {
  QuotationItem,
  QuotationMeta,
} from "@/components/QuotationTemplate";
import {
  useProducts,
  useQuotations,
  useConvertQuotationToSalesOrder,
} from "@/lib/hooks/api-hooks";
import {
  Button,
  Modal,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
} from "@/components/ui";
import {
  FileText,
  Plus,
  ShoppingCart,
  CheckCircle,
  Search,
  Eye,
  Printer,
  FileSpreadsheet,
  Building2,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

export default function CommercialQuotationsPage() {
  const { data: products = [] } = useProducts();
  const { data: quotationsList = [], isLoading, error } = useQuotations();
  const convertToOrderMutation = useConvertQuotationToSalesOrder();

  const [activeView, setActiveView] = useState<"LIST" | "EDITOR">("EDITOR");
  const [selectedQuotation, setSelectedQuotation] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const formatNumber = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const dynamicQuotationMeta: Partial<QuotationMeta> = useMemo(
    () =>
      selectedQuotation
        ? {
            quotationNo: selectedQuotation.quotationNo,
            date: selectedQuotation.date,
            validUntil: selectedQuotation.validUntil,
            customer: selectedQuotation.customer,
            attention: selectedQuotation.attention,
            address: selectedQuotation.address,
            trn: selectedQuotation.trn,
            mobile: selectedQuotation.mobile,
            project: selectedQuotation.project,
            location: selectedQuotation.location,
            reference: selectedQuotation.reference,
            preparedBy: selectedQuotation.preparedBy,
            contact: selectedQuotation.contact,
          }
        : {
            quotationNo: `AGM-QTN-2026-${Date.now().toString().slice(-4)}`,
            date: new Date().toLocaleDateString("en-GB"),
            validUntil: new Date(
              Date.now() + 10 * 24 * 60 * 60 * 1000,
            ).toLocaleDateString("en-GB"),
            customer: "",
            attention: "",
            address: "",
            trn: "",
            email: "",
            mobile: "",
            project: "",
            location: "",
            reference: "",
            preparedBy: "",
            contact: "",
          },
    [selectedQuotation],
  );

  const dynamicQuotationItems: QuotationItem[] = useMemo(() => {
    if (selectedQuotation?.items?.length) {
      return selectedQuotation.items.map((i: any, idx: number) => ({
        id: idx + 1,
        productId: i.productId,
        desc: i.description,
        qty: Number(i.quantity),
        rate: Number(i.unitRate),
        unit: i.unit,
        isFree: i.isFree,
      }));
    }
    return [
      {
        id: 1,
        desc: "",
        qty: 1,
        rate: 0,
      },
    ];
  }, [selectedQuotation]);

  const handleConvert = useCallback(
    async (qtnId: string) => {
      try {
        await convertToOrderMutation.mutateAsync(qtnId);
        alert("Quotation successfully converted to Sales Order!");
      } catch (err: any) {
        alert(`Error converting quotation: ${err.message}`);
      }
    },
    [convertToOrderMutation],
  );

  const filteredQuotations = useMemo(() => {
    const q = search.toLowerCase();
    return quotationsList.filter((item) => {
      const matchesSearch =
        item.quotationNo.toLowerCase().includes(q) ||
        (item.customer && item.customer.toLowerCase().includes(q)) ||
        (item.project && item.project.toLowerCase().includes(q));
      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotationsList, search, statusFilter]);

  const totalQuotedVolume = useMemo(
    () => filteredQuotations.reduce((s, q) => s + Number(q.totalAmount || 0), 0),
    [filteredQuotations],
  );

  const acceptedCount = useMemo(
    () => quotationsList.filter((q) => q.status === "ACCEPTED").length,
    [quotationsList],
  );

  const sentCount = useMemo(
    () => quotationsList.filter((q) => q.status === "SENT").length,
    [quotationsList],
  );

  return (
    <div className="space-y-6">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Commercial Quotations &amp; Proposals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AGM FITOUT TECHNICAL SERVICES LLC — Create official commercial <br /> proposals, generate multi-point  BOQ scope bundles, and convert <br /> accepted proposals into Sales Orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveView("EDITOR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === "EDITOR"
                  ? "bg-white text-slate-900 shadow-xs text-emerald-800"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Quotation Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveView("LIST")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === "LIST"
                  ? "bg-white text-slate-900 shadow-xs text-emerald-800"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Saved Quotations ({quotationsList.length})
            </button>
          </div>
        </div>
      </div>

      {/* 4 Elevated Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* 1. Total Quoted Pipeline */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Total Proposal Pipeline
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Cumulative quotation value
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-sky-500 font-sans mr-1">
              AED
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {formatNumber(totalQuotedVolume)}
            </span>
          </div>
        </div>

        {/* 2. Total Proposals Issued */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-teal-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              2. Total Proposals Issued
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              All commercial bids
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {quotationsList.length}
            </span>
            <span className="text-xs font-bold text-slate-500 font-sans ml-1.5">
              Proposals
            </span>
          </div>
        </div>

        {/* 3. Accepted Proposals */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              3. Won &amp; Accepted Deals
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Converted proposals
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-emerald-800 font-mono">
              {acceptedCount}
            </span>
            <span className="text-xs font-bold text-emerald-700 font-sans ml-1.5">
              Won
            </span>
          </div>
        </div>

        {/* 4. Active In-Review / Sent */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-purple-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              4. Active Negotiations
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Sent to clients for approval
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-purple-800 font-mono">
              {sentCount}
            </span>
            <span className="text-xs font-bold text-purple-700 font-sans ml-1.5">
              In Review
            </span>
          </div>
        </div>
      </div>

      {activeView === "EDITOR" ? (
        <div className="overflow-visible">
          <QuotationTemplate
            initialMeta={dynamicQuotationMeta}
            initialItems={dynamicQuotationItems}
            availableProducts={products}
          />
        </div>
      ) : (
        /* Saved Quotations Register Card */
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          {/* Search & Filter Strip */}
          <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Status Quick Pills */}
              <div className="flex flex-wrap items-center gap-1">
                {[
                  { id: "ALL", label: "All Quotations" },
                  { id: "ACCEPTED", label: "Accepted Deals" },
                  { id: "SENT", label: "Sent / In-Review" },
                  { id: "DRAFT", label: "Drafts" },
                ].map((tab) => {
                  const isActive = statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 text-emerald-800"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <span className="text-[11px] font-bold text-slate-500 font-mono">
                {filteredQuotations.length} Proposals Listed
              </span>
            </div>

            <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
              <div className="w-full sm:w-96 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search quotation number, customer, project..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error ? (
            <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
              Error loading quotations: {(error as any).message}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
                <h4 className="font-black text-xs uppercase tracking-wider text-white">
                  Master Commercial Quotations Register
                </h4>
                <span className="text-[11px] font-mono text-emerald-300 font-bold">
                  {filteredQuotations.length} Proposals
                </span>
              </div>

              <Table className="w-full text-xs text-left">
                <TableHead className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                      Quotation No
                    </TableHeaderCell>
                    <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                      Customer / Client
                    </TableHeaderCell>
                    <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                      Project Scope &amp; Ref
                    </TableHeaderCell>
                    <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                      Date
                    </TableHeaderCell>
                    <TableHeaderCell
                      align="right"
                      className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-[10.5px] tracking-wider"
                    >
                      Total (AED)
                    </TableHeaderCell>
                    <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                      Status
                    </TableHeaderCell>
                    <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                      Actions
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>

                <TableBody className="divide-y divide-slate-100 font-medium">
                  {isLoading ? (
                    <TableLoading colSpan={7} rows={5} />
                  ) : filteredQuotations.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-12 text-center text-slate-400 italic"
                      >
                        No saved quotations found. Switch to &quot;Quotation Editor&quot; tab to build a new proposal.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuotations.map((q) => (
                      <TableRow
                        key={q.id}
                        className="hover:bg-slate-50/60 text-slate-700 transition"
                      >
                        <TableCell className="py-3 px-4 font-mono font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <FileSpreadsheet size={13} className="text-teal-700 shrink-0" />
                            <span>{q.quotationNo}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-4 font-bold text-slate-900">
                          {q.customer || "—"}
                        </TableCell>
                        <TableCell className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {q.project || "—"}
                        </TableCell>
                        <TableCell className="py-3 px-3 font-mono text-slate-600 text-xs">
                          {q.date}
                        </TableCell>
                        <TableCell
                          align="right"
                          className="py-3 px-4 text-right font-mono font-black text-slate-900"
                        >
                          AED {formatNumber(q.totalAmount)}
                        </TableCell>
                        <TableCell className="py-3 px-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              q.status === "ACCEPTED"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : q.status === "SENT"
                                  ? "bg-sky-50 text-sky-800 border-sky-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {q.status === "ACCEPTED"
                              ? "Accepted"
                              : q.status === "SENT"
                                ? "Sent"
                                : "Draft"}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedQuotation(q);
                                setActiveView("EDITOR");
                              }}
                              className="p-1.5 text-slate-600 hover:text-teal-800 rounded-lg hover:bg-teal-50 transition cursor-pointer"
                              title="Edit / View in Editor"
                            >
                              <Eye size={13} />
                            </button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.location.href = `/commercial/sales-invoices?quotationNo=${encodeURIComponent(
                                  q.quotationNo,
                                )}&customerName=${encodeURIComponent(
                                  q.customer || "",
                                )}&projectScope=${encodeURIComponent(q.project || "")}`;
                              }}
                              icon={
                                <FileText
                                  size={12}
                                  className="text-teal-700"
                                />
                              }
                              className="text-[10px] font-bold text-teal-900 hover:bg-teal-50 border-teal-300 cursor-pointer"
                            >
                              Convert to Invoice
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleConvert(q.id)}
                              icon={<ShoppingCart size={12} />}
                              className="text-[10px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                            >
                              Convert to SO
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
