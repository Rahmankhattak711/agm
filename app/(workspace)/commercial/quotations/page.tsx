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
  useConvertQuotationToSalesInvoice,
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
  Input,
  DashboardCard,
  DashboardCardGrid,
} from "@/components/ui";
import {
  EyeIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  SearchIcon,
  ShoppingCartIcon,
} from "@/components/icons";

export default function CommercialQuotationsPage() {
  const { data: products = [] } = useProducts();
  const { data: quotationsList = [], isLoading, error } = useQuotations();
  const convertToOrderMutation = useConvertQuotationToSalesOrder();
  const convertToInvoiceMutation = useConvertQuotationToSalesInvoice();

  const [activeView, setActiveView] = useState<"LIST" | "EDITOR">("EDITOR");
  const [selectedQuotation, setSelectedQuotation] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [convertingId, setConvertingId] = useState<string | null>(null);

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
        setConvertingId(qtnId);
        await convertToOrderMutation.mutateAsync(qtnId);
        alert("Quotation successfully converted to Sales Order!");
      } catch (err: any) {
        alert(`Error converting quotation: ${err.message}`);
      } finally {
        setConvertingId(null);
      }
    },
    [convertToOrderMutation],
  );

  const handleConvertToInvoice = useCallback(
    async (qtn: any) => {
      const confirmed = window.confirm(
        `Are you sure you want to convert Quotation "${qtn.quotationNo}" directly to a Tax Invoice? This will generate the Sales Invoice and remove the proposal from quotations.`,
      );
      if (!confirmed) return;

      try {
        setConvertingId(qtn.id);
        const newInvoice: any = await convertToInvoiceMutation.mutateAsync(
          qtn.id,
        );
        const goToInvoice = window.confirm(
          `Quotation converted successfully to Tax Invoice #${newInvoice?.invoiceNumber || ""}!\n\nClick OK to open Sales Invoices or Cancel to stay here.`,
        );
        if (goToInvoice) {
          window.location.href = "/commercial/sales-invoices";
        }
      } catch (err: any) {
        alert(`Error converting quotation to tax invoice: ${err.message}`);
      } finally {
        setConvertingId(null);
      }
    },
    [convertToInvoiceMutation],
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
    () =>
      quotationsList.reduce((s, q) => s + Number(q.totalAmount || 0), 0),
    [quotationsList],
  );

  const acceptedCount = useMemo(
    () => quotationsList.filter((q) => q.status === "ACCEPTED").length,
    [quotationsList],
  );

  const rejectedCount = useMemo(
    () => quotationsList.filter((q) => q.status === "REJECTED").length,
    [quotationsList],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Quotations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create commercial proposals, generate itemized BOQs, and convert
            accepted quotes into sales orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveView("EDITOR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === "EDITOR"
                  ? "bg-white text-slate-900 shadow-xs text-emerald-800"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Quotation Editor
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveView("LIST")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === "LIST"
                  ? "bg-white text-slate-900 shadow-xs text-emerald-800"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Saved Quotations ({quotationsList.length})
            </Button>
          </div>
        </div>
      </div>

      <DashboardCardGrid cols={4} className="print:hidden">
        <DashboardCard
          title="Total Proposal Pipeline"
          value={`AED ${formatNumber(totalQuotedVolume)}`}
          subtitle="Cumulative quotation value"
          variant="default"
        />
        <DashboardCard
          title="Total Proposals Issued"
          value={quotationsList.length}
          subtitle={`${quotationsList.length} commercial proposals`}
          variant="default"
        />
        <DashboardCard
          title="Accepted Deals"
          value={acceptedCount}
          subtitle="Converted proposals"
          variant="success"
        />
        <DashboardCard
          title="Rejected Deals"
          value={rejectedCount}
          subtitle="Declined proposals"
          variant="warning"
        />
      </DashboardCardGrid>

      {activeView === "EDITOR" ? (
        <div className="overflow-visible">
          <QuotationTemplate
            initialMeta={dynamicQuotationMeta}
            initialItems={dynamicQuotationItems}
            availableProducts={products}
          />
        </div>
      ) : (
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
                {[
                  { id: "ALL", label: "All Quotations" },
                  { id: "ACCEPTED", label: "Accepted Deals" },
                  { id: "REJECTED", label: "Rejected Deals" },
                ].map((tab) => {
                  const isActive = statusFilter === tab.id;
                  return (
                    <Button
                      key={tab.id}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-white text-emerald-800 shadow-xs border border-slate-200/80"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      {tab.label}
                    </Button>
                  );
                })}
              </div>

              <span className="text-[11px] font-bold text-slate-500 font-mono">
                {filteredQuotations.length} Proposals Listed
              </span>
            </div>

            <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
              <Input
                leftIcon={<SearchIcon size={14} className="text-slate-400" />}
                placeholder="Search quotation number, customer, project..."
                containerClassName="w-full sm:w-96"
                className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
                        No saved quotations found. Switch to &quot;Quotation
                        Editor&quot; tab to build a new proposal.
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
                            <FileSpreadsheetIcon
                              size={13}
                              className="text-teal-700 shrink-0"
                            />
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
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedQuotation(q);
                                setActiveView("EDITOR");
                              }}
                              className="p-1.5 text-slate-600 hover:text-teal-800 rounded-lg hover:bg-teal-50 transition cursor-pointer"
                              title="Edit / View in Editor"
                            >
                              <EyeIcon size={13} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleConvertToInvoice(q)}
                              disabled={convertingId === q.id}
                              icon={
                                <FileTextIcon
                                  size={12}
                                  className="text-teal-700"
                                />
                              }
                              className="text-[10px] font-bold text-teal-900 hover:bg-teal-50 border-teal-300 cursor-pointer"
                            >
                              {convertingId === q.id
                                ? "Converting..."
                                : "Convert to Invoice"}
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleConvert(q.id)}
                              disabled={convertingId === q.id}
                              icon={<ShoppingCartIcon size={12} />}
                              className="text-[10px] font-bold bg-agm-green hover:bg-agm-green-2 text-white cursor-pointer"
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
