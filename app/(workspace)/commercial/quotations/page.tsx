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
} from "lucide-react";

export default function CommercialQuotationsPage() {
  const { data: products = [] } = useProducts();
  const { data: quotationsList = [], isLoading } = useQuotations();
  const convertToOrderMutation = useConvertQuotationToSalesOrder();

  const [activeView, setActiveView] = useState<"LIST" | "EDITOR">("EDITOR");
  const [selectedQuotation, setSelectedQuotation] = useState<any | null>(null);
  const [search, setSearch] = useState("");

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
    return quotationsList.filter(
      (item) =>
        item.quotationNo.toLowerCase().includes(q) ||
        (item.customer && item.customer.toLowerCase().includes(q)) ||
        (item.project && item.project.toLowerCase().includes(q)),
    );
  }, [quotationsList, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Commercial Quotations & Proposals
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Sales Cycle — Step 1
            </span>
          </div>
          <p className="text-xs text-slate-500">
            AGM FITOUT TECHNICAL SERVICES LLC — Create official commercial
            proposals, <br /> generate multi-point BOQ scope bundles, and
            convert accepted proposals into Sales Orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveView("EDITOR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === "EDITOR"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Quotation Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveView("LIST")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === "LIST"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Saved Quotations ({quotationsList.length})
            </button>
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
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl border border-slate-200">
            <Search size={14} className="text-slate-400 ml-2" />
            <input
              type="text"
              placeholder="Search quotation number, customer, project..."
              className="w-full text-xs bg-transparent outline-none text-slate-800"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs bg-white">
            <Table className="w-full text-xs text-left">
              <TableHead className="bg-slate-50 border-b border-slate-200">
                <TableHeaderCell className="py-3 px-4">
                  Quotation No
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-4">
                  Customer
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-4">
                  Project / Scope
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-3">Date</TableHeaderCell>
                <TableHeaderCell align="right" className="py-3 px-4 text-right">
                  Total (AED)
                </TableHeaderCell>
                <TableHeaderCell className="py-3 px-3">Status</TableHeaderCell>
                <TableHeaderCell className="py-3 px-3 text-center">
                  Actions
                </TableHeaderCell>
              </TableHead>

              <TableBody className="divide-y divide-slate-100">
                {isLoading ? (
                  <TableLoading colSpan={7} rows={5} />
                ) : filteredQuotations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-slate-400 italic"
                    >
                      No saved quotations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotations.map((q) => (
                    <TableRow key={q.id} className="hover:bg-slate-50/60">
                      <TableCell className="py-3 px-4 font-mono font-bold text-emerald-950">
                        {q.quotationNo}
                      </TableCell>
                      <TableCell className="py-3 px-4 font-bold text-slate-900">
                        {q.customer || "—"}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {q.project || "—"}
                      </TableCell>
                      <TableCell className="py-3 px-3 text-slate-600">
                        {q.date}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-3 px-4 text-right font-mono font-black"
                      >
                        AED{" "}
                        {Number(q.totalAmount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            q.status === "ACCEPTED"
                              ? "bg-emerald-100 text-emerald-800"
                              : q.status === "SENT"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {q.status}
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
                            className="p-1 text-slate-400 hover:text-emerald-700 rounded-md hover:bg-emerald-50"
                            title="Edit / View in Editor"
                          >
                            <Eye size={14} />
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
                                className="text-emerald-700"
                              />
                            }
                            className="text-[10px] font-bold text-emerald-800 hover:bg-emerald-50 border-emerald-300"
                          >
                            Convert to Invoice
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleConvert(q.id)}
                            icon={<ShoppingCart size={12} />}
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
        </div>
      )}
    </div>
  );
}
