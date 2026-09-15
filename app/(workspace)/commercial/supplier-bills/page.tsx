"use client";

import React, { useMemo, useState, useRef, Fragment } from "react";
import { useReactToPrint } from "react-to-print";
import {
  BanknoteIcon,
  ChevronDownIcon,
  CloseIcon,
  EyeIcon,
  FileCheck2Icon,
  PlusIcon,
  PrintIcon,
  ReceiptIcon,
  SearchIcon,
  ShieldCheckIcon,
  TrashIcon,
} from "@/components/icons";
import {
  Button,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  Modal,
  Input,
  Select,
  FormInput,
  FormSelect,
  FormSubmit,
} from "@/components/ui";
import { useForm } from "@tanstack/react-form";
import {
  useSupplierBills,
  useCreateSupplierBill,
  usePostSupplierBill,
  useCreateSupplierPayment,
  useSuppliers,
  useProducts,
  SupplierBill,
} from "@/lib/hooks/api-hooks";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";

interface SupplierBillDocumentProps {
  bill: SupplierBill;
}

const SupplierBillDocument: React.FC<SupplierBillDocumentProps> = ({
  bill,
}) => {
  const formattedBillDate = bill.billDate
    ? new Date(bill.billDate).toLocaleDateString("en-GB")
    : "-";
  const formattedDueDate = bill.dueDate
    ? new Date(bill.dueDate).toLocaleDateString("en-GB")
    : "-";

  const subtotal = Number(bill.subtotal || bill.totalAmount / 1.05 || 0);
  const vatAmount = Number(bill.vatAmount || bill.totalAmount - subtotal || 0);
  const totalAmount = Number(bill.totalAmount || 0);
  const paidAmount = Number(bill.paidAmount || 0);
  const remainingBalance = Number(bill.remainingBalance || 0);

  const formatNum = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div
      id="printable-bill"
      className="mx-auto bg-white max-w-4xl min-w-[700px] md:min-w-0 rounded-xl print:rounded-none overflow-visible print:overflow-visible print:w-full print:shadow-none font-sans"
    >
      <table className="print-page-table w-full border-collapse">
        <thead className="print-page-header-group">
          <tr>
            <th className="p-0 font-normal text-left border-none">
              <QuotationHeader />
            </th>
          </tr>
        </thead>

        <tfoot className="print-page-footer-group">
          <tr>
            <td className="p-0 border-none align-bottom">
              <div
                className="w-full opacity-0 pointer-events-none select-none"
                style={{ minHeight: "175px" }}
                aria-hidden="true"
              >
                <QuotationFooter />
                <div style={{ height: "45px", minHeight: "45px" }} />
              </div>
            </td>
          </tr>
        </tfoot>

        <tbody className="print-page-body-group">
          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 py-3.5 print:px-8 print:py-2.5 w-full border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between gap-8">
                  <div>
                    <h1 className="text-2xl print:text-2xl font-black text-slate-900 tracking-tight">
                      SUPPLIER BILL / AP VOUCHER
                    </h1>
                    <p className="text-[11px] print:text-[11px] font-semibold text-emerald-700 mt-0.5 print:mt-0">
                      Official Accounts Payable &amp; Tax Requisition Voucher
                      (UAE FTA 5% VAT)
                    </p>
                  </div>

                  <div className="w-[320px] print:w-[320px] space-y-1 text-[12px] print:text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Bill Voucher No:
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {bill.billNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Bill Date:
                      </span>
                      <span className="font-bold text-slate-900">
                        {formattedBillDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Due Date:
                      </span>
                      <span className="font-bold text-slate-900">
                        {formattedDueDate}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold whitespace-nowrap">
                        Status:
                      </span>
                      <span className="font-bold text-emerald-800">
                        {bill.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-0 border-none align-top">
              <div className="grid grid-cols-2 gap-4 print:gap-3 px-10 py-3.5 print:px-8 print:py-2 text-[12px] print:text-[12px] print-avoid-break">
                <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2.5 rounded-xl shadow-2xs">
                  <div className="font-bold mb-2 print:mb-1.5 text-slate-900 uppercase text-[11px] print:text-[11px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                    SUPPLIER / VENDOR DETAILS
                  </div>
                  <div className="space-y-1.5 print:space-y-1">
                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Vendor Name:
                      </span>
                      <span className="font-bold text-slate-900">
                        {bill.supplierName}
                      </span>
                    </div>

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        UAE VAT TRN:
                      </span>
                      <span className="font-mono text-slate-800 font-bold">
                        {bill.supplierTrn || "N/A"}
                      </span>
                    </div>

                    {bill.purchaseOrderId && (
                      <div className="flex items-start gap-1">
                        <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                          Linked PO:
                        </span>
                        <span className="font-mono text-slate-700">
                          {bill.purchaseOrderId}
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-1">
                      <span className="w-24 print:w-24 text-[11px] print:text-[11px] font-semibold text-slate-500 shrink-0">
                        Terms:
                      </span>
                      <span className="text-slate-700">
                        Standard Supplier 30-Day Credit
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2.5 rounded-xl shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="font-bold mb-2 print:mb-1.5 text-slate-900 uppercase text-[11px] print:text-[11px] tracking-wider text-agm-green flex items-center gap-1.5 border-b border-slate-200/60 pb-1 print:pb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                      PAYABLE FINANCIAL SUMMARY
                    </div>
                    <div className="space-y-1.5 print:space-y-1 text-[11.5px] print:text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          Bill Subtotal (Excl. VAT):
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          AED {formatNum(subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          Recoverable VAT (5%):
                        </span>
                        <span className="font-mono font-bold text-purple-700">
                          AED {formatNum(vatAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">
                          Amount Settled / Paid:
                        </span>
                        <span className="font-mono font-bold text-emerald-700">
                          AED {formatNum(paidAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between bg-white print:bg-transparent p-2 rounded-lg border">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                      Balance Due (Payable):
                    </span>
                    <span
                      className={`font-mono text-base font-black ${
                        remainingBalance > 0
                          ? "text-rose-700"
                          : "text-emerald-700"
                      }`}
                    >
                      AED {formatNum(remainingBalance)}
                    </span>
                  </div>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 py-2 print:px-8 print:py-1">
                <table className="w-full border-collapse text-[11.5px] print:text-[10.5px]">
                  <thead>
                    <tr className="bg-agm-green border border-agm-box-border text-white">
                      <th className="py-2.5 px-2.5 font-bold w-12 border border-agm-box-border text-white text-center align-middle">
                        S.No
                      </th>
                      <th className="py-2.5 px-3 font-bold border border-agm-box-border text-white text-left align-middle">
                        DESCRIPTION OF MATERIALS / SERVICES
                      </th>
                      <th className="py-2.5 px-2 font-bold w-20 border border-agm-box-border text-white text-center align-middle">
                        QTY
                      </th>
                      <th className="py-2.5 px-3 font-bold w-28 border border-agm-box-border text-white text-right align-middle">
                        UNIT COST (AED)
                      </th>
                      <th className="py-2.5 px-3 font-bold w-32 border border-agm-box-border text-white text-right align-middle">
                        TOTAL (AED)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-agm-box-border">
                    {!bill.items || bill.items.length === 0 ? (
                      <tr className="hover:bg-slate-50/50 bg-white print-avoid-break">
                        <td className="py-2 px-2.5 align-middle text-center font-bold text-slate-700 border border-agm-box-border">
                          1
                        </td>
                        <td className="py-2 px-3 align-middle text-left font-medium text-slate-800 border border-agm-box-border">
                          Direct Procurement Materials / Site Supply
                        </td>
                        <td className="py-2 px-2 align-middle text-center font-mono font-bold text-slate-800 border border-agm-box-border">
                          1
                        </td>
                        <td className="py-2 px-3 align-middle text-right font-mono font-semibold text-slate-800 border border-agm-box-border">
                          {formatNum(subtotal)}
                        </td>
                        <td className="py-2 px-3 align-middle text-right font-mono font-bold text-slate-900 border border-agm-box-border">
                          {formatNum(subtotal)}
                        </td>
                      </tr>
                    ) : (
                      bill.items.map((it: any, idx: number) => {
                        const itCost = Number(it.unitCost || 0);
                        const itQty = Number(it.quantity || 1);
                        const itTotal = itCost * itQty;
                        return (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/50 bg-white print-avoid-break"
                          >
                            <td className="py-2 px-2.5 align-middle text-center font-bold text-slate-700 border border-agm-box-border">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 align-middle text-left font-medium text-slate-800 border border-agm-box-border">
                              {it.description ||
                                it.product?.name ||
                                "Direct site supplies"}
                            </td>
                            <td className="py-2 px-2 align-middle text-center font-mono font-bold text-slate-800 border border-agm-box-border">
                              {itQty} {it.unit || "PCS"}
                            </td>
                            <td className="py-2 px-3 align-middle text-right font-mono font-semibold text-slate-800 border border-agm-box-border">
                              {formatNum(itCost)}
                            </td>
                            <td className="py-2 px-3 align-middle text-right font-mono font-bold text-slate-900 border border-agm-box-border">
                              {formatNum(itTotal)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>

          <tr>
            <td className="p-0 border-none align-top">
              <div className="px-10 print:px-8">
                <div className="flex items-stretch justify-between gap-4 mt-3.5 print:mt-2 print-avoid-break">
                  <div className="flex-1 border border-slate-200 print:border-slate-300 bg-slate-50/60 print:bg-transparent p-3.5 print:p-2 rounded-xl text-[11px] print:text-[10px] flex flex-col justify-center shadow-2xs">
                    <div className="font-bold mb-1 text-slate-900 uppercase text-[10.5px] print:text-[10px] tracking-wider text-agm-green flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-agm-green"></span>
                      GENERAL LEDGER &amp; TAX ADJUSTMENT RECORD
                    </div>
                    <div className="space-y-1 text-slate-600 font-medium leading-relaxed">
                      <div>
                        Certified voucher for vendor invoice payable to{" "}
                        <strong>{bill.supplierName}</strong>.
                      </div>
                      <div className="text-[10.5px] text-slate-600 font-mono">
                        Double-Entry Impact: Dr. Direct Cost / Inventory (5000)
                        • Dr. Input VAT (2220) • Cr. Accounts Payable (2000)
                      </div>
                    </div>
                  </div>

                  <div className="w-80 border border-slate-200 print:border-slate-300 bg-white rounded-xl overflow-hidden shadow-2xs text-[12px] print:text-[11px]">
                    <div className="divide-y divide-slate-100 print:divide-slate-200">
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/40">
                        <span className="font-semibold text-slate-600">
                          Subtotal (Excl. VAT):
                        </span>
                        <span className="font-mono font-bold text-slate-900">
                          AED {formatNum(subtotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/40">
                        <span className="font-semibold text-slate-600">
                          Recoverable VAT (5%):
                        </span>
                        <span className="font-mono font-bold text-purple-700">
                          AED {formatNum(vatAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-2.5 bg-agm-green text-white">
                        <span className="font-bold text-xs uppercase tracking-wider">
                          Grand Total (AED):
                        </span>
                        <span className="font-mono font-black text-sm">
                          AED {formatNum(totalAmount)}
                        </span>
                      </div>
                    </div>
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

      <div className="px-10 pb-6 print:hidden">
        <QuotationFooter className="mt-6" />
      </div>
    </div>
  );
};

export default function SupplierBillsPage() {
  const { data: bills = [], isLoading, error } = useSupplierBills();
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();

  const createBillMutation = useCreateSupplierBill();
  const postBillMutation = usePostSupplierBill();
  const paymentMutation = useCreateSupplierPayment();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<SupplierBill | null>(null);
  const [paymentModalBill, setPaymentModalBill] = useState<SupplierBill | null>(
    null,
  );
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

  const [billToPrint, setBillToPrint] = useState<SupplierBill | null>(null);
  const printDocumentRef = useRef<HTMLDivElement>(null);

  const triggerPrint = useReactToPrint({
    contentRef: printDocumentRef,
    documentTitle: billToPrint?.billNumber
      ? `Supplier-Bill-${billToPrint.billNumber}`
      : "Supplier-Bill-Voucher",
  });

  const handlePrintBill = (bill: SupplierBill) => {
    setBillToPrint(bill);
    setTimeout(() => {
      triggerPrint();
    }, 80);
  };

  const [createBillError, setCreateBillError] = useState("");
  const [disbursalError, setDisbursalError] = useState("");

  const createBillForm = useForm({
    defaultValues: {
      billNumber: "",
      supplierId: "",
      supplierName: "",
      supplierTrn: "",
      billDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      items: [
        {
          productId: "",
          description: "Direct materials / site supply",
          quantity: 1,
          unitCost: 0,
          unit: "PCS",
        },
      ],
      autoPost: true,
    },
    onSubmit: async ({ value }) => {
      if (!value.supplierName.trim()) {
        setCreateBillError("Please select or enter a supplier.");
        return;
      }
      setCreateBillError("");
      try {
        await createBillMutation.mutateAsync({
          billNumber: value.billNumber.trim() || undefined,
          supplierId: value.supplierId || undefined,
          supplierName: value.supplierName.trim(),
          supplierTrn: value.supplierTrn.trim() || undefined,
          billDate: value.billDate,
          dueDate: value.dueDate,
          items: value.items,
          autoPost: value.autoPost,
        });
        setIsCreateOpen(false);
        createBillForm.reset();
      } catch (err: any) {
        setCreateBillError(err.message || "Failed to create supplier bill");
      }
    },
  });

  const paymentForm = useForm({
    defaultValues: {
      amount: "",
      paymentMethod: "BANK_TRANSFER",
      referenceNumber: "",
    },
    onSubmit: async ({ value }) => {
      if (!paymentModalBill) return;
      setDisbursalError("");
      const amt = parseFloat(value.amount);
      if (isNaN(amt) || amt <= 0) {
        setDisbursalError("Invalid payment amount.");
        return;
      }
      try {
        await paymentMutation.mutateAsync({
          supplierId: paymentModalBill.supplierId || undefined,
          supplierName: paymentModalBill.supplierName,
          supplierBillId: paymentModalBill.id,
          amount: amt,
          paymentDate: new Date().toISOString().slice(0, 10),
          paymentMethod: value.paymentMethod as any,
          referenceNumber: value.referenceNumber.trim() || undefined,
        });
        setPaymentModalBill(null);
        paymentForm.reset();
      } catch (err: any) {
        setDisbursalError(err.message || "Failed to record payment");
      }
    },
  });

  const handleOpenCreate = () => {
    setCreateBillError("");
    createBillForm.reset();
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    createBillForm.reset();
  };

  const handleOpenPayment = (bill: SupplierBill) => {
    setDisbursalError("");
    paymentForm.reset({
      amount: String(bill.remainingBalance || ""),
      paymentMethod: "BANK_TRANSFER",
      referenceNumber: "",
    });
    setPaymentModalBill(bill);
  };

  const handleClosePayment = () => {
    setPaymentModalBill(null);
    paymentForm.reset();
  };

  const formatNumber = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const addItem = () => {
    const current = createBillForm.getFieldValue("items");
    createBillForm.setFieldValue("items", [
      ...current,
      {
        productId: "",
        description: "",
        quantity: 1,
        unitCost: 0,
        unit: "PCS",
      },
    ]);
  };

  const removeItem = (idx: number) => {
    const current = createBillForm.getFieldValue("items");
    createBillForm.setFieldValue(
      "items",
      current.filter((_, i) => i !== idx),
    );
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const current = [...createBillForm.getFieldValue("items")];
    current[idx] = { ...current[idx], [field]: value };
    if (field === "productId") {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        current[idx].description = prod.name;
        current[idx].unitCost = Number(prod.costPrice || 0);
        current[idx].unit = prod.unit || "PCS";
      }
    }
    createBillForm.setFieldValue("items", current);
  };

  const handleSupplierSelect = (id: string) => {
    createBillForm.setFieldValue("supplierId", id);
    const sup = suppliers.find((s) => s.id === id);
    if (sup) {
      createBillForm.setFieldValue("supplierName", sup.name);
      createBillForm.setFieldValue("supplierTrn", sup.trn || "");
    }
  };

  const handlePostBill = async (id: string) => {
    try {
      await postBillMutation.mutateAsync(id);
    } catch (err: any) {
      alert(`Error posting bill: ${err.message}`);
    }
  };

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesBill = b.billNumber.toLowerCase().includes(q);
        const matchesSupplier = b.supplierName.toLowerCase().includes(q);
        const matchesTrn = b.supplierTrn?.toLowerCase().includes(q);
        if (!matchesBill && !matchesSupplier && !matchesTrn) return false;
      }
      return true;
    });
  }, [bills, statusFilter, search]);

  const totalPayables = useMemo(
    () => bills.reduce((acc, b) => acc + Number(b.totalAmount || 0), 0),
    [bills],
  );

  const totalOutstanding = useMemo(
    () => bills.reduce((acc, b) => acc + Number(b.remainingBalance || 0), 0),
    [bills],
  );

  const totalSettled = totalPayables - totalOutstanding;
  const totalInputVat = useMemo(
    () => bills.reduce((acc, b) => acc + Number(b.vatAmount || 0), 0),
    [bills],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Supplier Bills
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log vendor invoices, claim 5% input tax, track settlement
            disbursements, and post to General Ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Record Supplier Bill
          </Button>
        </div>
      </div>

      <ReportKpiGrid cols={4}>
        <ReportKpiCard
          title="1. Gross Vendor Payables"
          subtitle="Cumulative procurement billed"
          value={formatNumber(totalPayables)}
          currency="AED"
          accentColor="sky"
          valueColor="text-sky-900"
        />
        <ReportKpiCard
          title="2. Open AP Balance Due"
          subtitle="Pending vendor disbursements"
          value={formatNumber(totalOutstanding)}
          currency="AED"
          accentColor="rose"
          valueColor="text-rose-700"
        />
        <ReportKpiCard
          title="3. Settled Disbursements"
          subtitle="Disbursed vendor liabilities"
          value={formatNumber(totalSettled)}
          currency="AED"
          accentColor="emerald"
          valueColor="text-emerald-800"
        />
        <ReportKpiCard
          title="4. Recoverable VAT (5%)"
          subtitle="Input tax claimable from FTA"
          value={formatNumber(totalInputVat)}
          currency="AED"
          accentColor="purple"
          valueColor="text-purple-800"
        />
      </ReportKpiGrid>

      <div className="p-3.5 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              {[
                { id: "ALL", label: "All Bills" },
                { id: "POSTED", label: "Posted to GL" },
                { id: "PARTIALLY_PAID", label: "Partially Paid" },
                { id: "PAID", label: "Fully Paid" },
                { id: "DRAFT", label: "Drafts" },
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
              {filteredBills.length} Invoices Found
            </span>
          </div>

          <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
            <Input
              leftIcon={<SearchIcon size={14} className="text-slate-400" />}
              placeholder="Search bill number, vendor, TRN..."
              containerClassName="w-full sm:w-80"
              className="py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading supplier bills: {(error as any).message}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between print:bg-none print:!bg-slate-100 print:!text-slate-900">
              <h4 className="font-black text-xs uppercase tracking-wider text-white print:!text-slate-900">
                Accounts Payable &amp; Vendor Invoices Register
              </h4>
              <span className="text-[11px] font-mono text-emerald-300 font-bold print:!text-slate-700">
                {filteredBills.length} Active Records
              </span>
            </div>

            <Table className="w-full text-xs text-left">
              <TableHead className="bg-slate-50 border-b border-slate-200">
                <TableRow>
                  <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    Bill No
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    Supplier / Vendor
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    Bill Date
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-3 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    Due Date
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-3 px-3 text-right font-bold text-slate-600 uppercase text-[10.5px] tracking-wider"
                  >
                    Total (AED)
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-3 px-3 text-right font-bold text-slate-600 uppercase text-[10.5px] tracking-wider"
                  >
                    Balance Due
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    Status
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-3 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider print:hidden">
                    Actions
                  </TableHeaderCell>
                </TableRow>
              </TableHead>

              <TableBody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <TableLoading colSpan={8} rows={5} />
                ) : filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-12 text-center text-slate-400 italic"
                    >
                      No supplier bills match your search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.map((b) => {
                    const isExpanded = expandedBillId === b.id;
                    return (
                      <Fragment key={b.id}>
                        <TableRow
                          onClick={() =>
                            setExpandedBillId(isExpanded ? null : b.id)
                          }
                          className={`hover:bg-emerald-50/40 cursor-pointer transition-colors ${
                            isExpanded
                              ? "bg-emerald-50/50 font-semibold"
                              : "text-slate-700"
                          }`}
                        >
                          <TableCell className="py-3 px-4 font-mono font-bold text-teal-800">
                            <div className="flex items-center gap-2">
                              <ChevronDownIcon
                                size={15}
                                className={`shrink-0 transition-transform duration-200 ${
                                  isExpanded
                                    ? "rotate-180 text-emerald-800"
                                    : "text-slate-400"
                                }`}
                              />
                              <ReceiptIcon
                                size={13}
                                className="text-teal-700 shrink-0"
                              />
                              <span className="hover:text-emerald-800 transition-colors">
                                {b.billNumber}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4 font-bold text-slate-900">
                            <div>{b.supplierName}</div>
                            {b.supplierTrn && (
                              <div className="text-[10px] text-slate-400 font-mono font-normal">
                                TRN: {b.supplierTrn}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-3 text-slate-600 font-mono">
                            {b.billDate
                              ? new Date(b.billDate).toLocaleDateString("en-GB")
                              : "-"}
                          </TableCell>
                          <TableCell className="py-3 px-3 text-slate-600 font-mono">
                            {b.dueDate
                              ? new Date(b.dueDate).toLocaleDateString("en-GB")
                              : "-"}
                          </TableCell>
                          <TableCell
                            align="right"
                            className="py-3 px-3 text-right font-mono font-bold text-slate-900"
                          >
                            {formatNumber(b.totalAmount)}
                          </TableCell>
                          <TableCell
                            align="right"
                            className="py-3 px-3 text-right font-mono font-bold"
                          >
                            <span
                              className={
                                Number(b.remainingBalance) > 0
                                  ? "text-rose-700"
                                  : "text-emerald-700"
                              }
                            >
                              {formatNumber(b.remainingBalance)}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                b.status === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : b.status === "POSTED"
                                    ? "bg-sky-50 text-sky-700 border border-sky-200"
                                    : b.status === "PARTIALLY_PAID"
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {b.status === "PAID"
                                ? "Paid"
                                : b.status === "POSTED"
                                  ? "Posted"
                                  : b.status === "PARTIALLY_PAID"
                                    ? "Partial"
                                    : "Draft"}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-3 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrintBill(b);
                                }}
                                icon={
                                  <PrintIcon
                                    size={13}
                                    className="text-emerald-700"
                                  />
                                }
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 transition cursor-pointer"
                                title="Print Voucher (PDF)"
                              >
                                Print
                              </Button>
                              {b.status === "DRAFT" && (
                                <Button
                                  variant="dark"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePostBill(b.id);
                                  }}
                                  icon={<FileCheck2Icon size={12} />}
                                  className="text-[10px] font-bold bg-agm-green text-white hover:bg-agm-green-2 cursor-pointer"
                                >
                                  Post
                                </Button>
                              )}
                              {b.status !== "DRAFT" && b.status !== "PAID" && (
                                <Button
                                  variant="dark"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPayment(b);
                                  }}
                                  icon={<BanknoteIcon size={12} />}
                                  className="text-[10px] font-bold bg-teal-800 text-white hover:bg-teal-900 cursor-pointer"
                                >
                                  Disburse
                                </Button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedBillId(isExpanded ? null : b.id);
                                }}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  isExpanded
                                    ? "text-emerald-800 bg-emerald-100"
                                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                }`}
                                title={
                                  isExpanded
                                    ? "Collapse preview"
                                    : "Expand preview"
                                }
                              >
                                <ChevronDownIcon
                                  size={14}
                                  className={`transition-transform duration-200 ${
                                    isExpanded
                                      ? "rotate-180 text-emerald-800"
                                      : ""
                                  }`}
                                />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow className="hover:bg-transparent bg-slate-50/70">
                            <TableCell
                              colSpan={8}
                              className="p-0 border-b-2 border-emerald-600/40"
                            >
                              <div className="px-6 py-5 space-y-4 border-l-4 border-l-emerald-600 bg-gradient-to-b from-white via-slate-50/40 to-slate-100/40 shadow-inner">
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                                  <div className="flex flex-wrap items-center gap-2.5">
                                    <span className="px-2.5 py-1 rounded-lg bg-teal-900 text-teal-200 font-mono font-bold text-xs shadow-2xs">
                                      {b.billNumber}
                                    </span>
                                    <span className="text-xs font-bold text-slate-900">
                                      {b.supplierName}
                                    </span>
                                    {b.supplierTrn && (
                                      <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                        <ShieldCheckIcon
                                          size={12}
                                          className="text-emerald-700"
                                        />
                                        TRN: {b.supplierTrn}
                                      </span>
                                    )}
                                    <span
                                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                        b.status === "PAID"
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                          : b.status === "POSTED"
                                            ? "bg-sky-50 text-sky-800 border-sky-200"
                                            : "bg-amber-50 text-amber-800 border-amber-200"
                                      }`}
                                    >
                                      {b.status}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handlePrintBill(b)}
                                      icon={
                                        <PrintIcon
                                          size={13}
                                          className="text-emerald-700"
                                        />
                                      }
                                      className="text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
                                    >
                                      Print Voucher (PDF)
                                    </Button>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedBillId(null)}
                                      className="text-xs text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                                      title="Collapse preview"
                                    >
                                      <CloseIcon size={15} />
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-2xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                      Total Bill Value
                                    </span>
                                    <span className="text-base font-black font-mono text-slate-900 block">
                                      AED {formatNumber(b.totalAmount)}
                                    </span>
                                    <span className="text-[10px] text-slate-500 block">
                                      Gross payable amount
                                    </span>
                                  </div>

                                  <div className="p-3 bg-rose-50/90 border border-rose-200/80 rounded-xl space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                                      Remaining Balance Due
                                    </span>
                                    <span className="text-base font-black font-mono text-rose-800 block">
                                      AED {formatNumber(b.remainingBalance)}
                                    </span>
                                    <span className="text-[10px] text-rose-600/90 font-medium block">
                                      {Number(b.remainingBalance) > 0
                                        ? "Awaiting payment settlement"
                                        : "Fully settled"}
                                    </span>
                                  </div>

                                  <div className="p-3 bg-purple-50/80 border border-purple-200/80 rounded-xl space-y-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                                      Recoverable VAT (5%)
                                    </span>
                                    <span className="text-base font-black font-mono text-purple-800 block">
                                      AED{" "}
                                      {formatNumber(
                                        b.vatAmount ||
                                          b.totalAmount - b.totalAmount / 1.05,
                                      )}
                                    </span>
                                    <span className="text-[10px] text-purple-600 block">
                                      FTA Input Tax credit
                                    </span>
                                  </div>

                                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-0.5 shadow-2xs">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                      Payment Due Date
                                    </span>
                                    <span className="text-xs font-bold text-slate-900 block font-mono">
                                      {b.dueDate
                                        ? new Date(
                                            b.dueDate,
                                          ).toLocaleDateString("en-GB")
                                        : "Immediate"}
                                    </span>
                                    <span className="text-[10px] text-slate-500 block">
                                      Bill Date:{" "}
                                      {b.billDate
                                        ? new Date(
                                            b.billDate,
                                          ).toLocaleDateString("en-GB")
                                        : "-"}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-2xs space-y-2.5">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                      <span className="font-bold text-xs uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                                        <ReceiptIcon
                                          size={14}
                                          className="text-teal-700"
                                        />
                                        Vendor &amp; Invoice Information
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                                        AP Ledger Record
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                                      <div>
                                        <span className="text-[10px] font-semibold text-slate-400 block">
                                          Vendor / Supplier
                                        </span>
                                        <span className="font-bold text-slate-800">
                                          {b.supplierName}
                                        </span>
                                      </div>

                                      <div>
                                        <span className="text-[10px] font-semibold text-slate-400 block">
                                          UAE VAT TRN
                                        </span>
                                        <span className="font-mono font-bold text-emerald-800">
                                          {b.supplierTrn || "Not Registered"}
                                        </span>
                                      </div>

                                      <div>
                                        <span className="text-[10px] font-semibold text-slate-400 block">
                                          Invoice Issue Date
                                        </span>
                                        <span className="font-mono text-slate-700">
                                          {b.billDate
                                            ? new Date(
                                                b.billDate,
                                              ).toLocaleDateString("en-GB")
                                            : "-"}
                                        </span>
                                      </div>

                                      <div>
                                        <span className="text-[10px] font-semibold text-slate-400 block">
                                          Payment Maturity
                                        </span>
                                        <span className="font-mono text-slate-700">
                                          {b.dueDate
                                            ? new Date(
                                                b.dueDate,
                                              ).toLocaleDateString("en-GB")
                                            : "-"}
                                        </span>
                                      </div>

                                      <div>
                                        <span className="text-[10px] font-semibold text-slate-400 block">
                                          Paid Disbursal
                                        </span>
                                        <span className="font-mono font-bold text-emerald-700">
                                          AED {formatNumber(b.paidAmount || 0)}
                                        </span>
                                      </div>

                                      <div>
                                        <span className="text-[10px] font-semibold text-slate-400 block">
                                          GL Ledger Status
                                        </span>
                                        <span className="font-bold text-slate-800">
                                          {b.status === "POSTED" ||
                                          b.status === "PAID"
                                            ? "Posted to Ledger"
                                            : "Draft Entry"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="border border-slate-200 bg-white rounded-xl p-4 shadow-2xs space-y-2.5 flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="font-bold text-xs uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                                          <BanknoteIcon
                                            size={14}
                                            className="text-teal-700"
                                          />
                                          Line Items &amp; Accounting Scope
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                                          {b.items?.length || 1} Item(s)
                                        </span>
                                      </div>

                                      <div className="space-y-1.5 pt-2">
                                        {!b.items || b.items.length === 0 ? (
                                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                                            <div>
                                              <span className="font-bold text-slate-800 block">
                                                Direct Procurement / Site Supply
                                              </span>
                                              <span className="text-[10px] text-slate-400">
                                                Direct material supplies
                                              </span>
                                            </div>
                                            <span className="font-mono font-bold text-slate-900">
                                              AED {formatNumber(b.totalAmount)}
                                            </span>
                                          </div>
                                        ) : (
                                          b.items.map(
                                            (it: any, idx: number) => (
                                              <div
                                                key={idx}
                                                className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                                              >
                                                <div>
                                                  <span className="font-bold text-slate-800 block">
                                                    {it.description ||
                                                      it.product?.name ||
                                                      "Material line"}
                                                  </span>
                                                  <span className="text-[10px] text-slate-400 font-mono">
                                                    Qty: {it.quantity || 1} •
                                                    Unit: AED{" "}
                                                    {formatNumber(
                                                      it.unitCost || 0,
                                                    )}
                                                  </span>
                                                </div>
                                                <span className="font-mono font-bold text-slate-900">
                                                  AED{" "}
                                                  {formatNumber(
                                                    Number(it.quantity || 1) *
                                                      Number(it.unitCost || 0),
                                                  )}
                                                </span>
                                              </div>
                                            ),
                                          )
                                        )}
                                      </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                      <span className="text-[10.5px] text-slate-500 font-mono">
                                        GL Impact: Dr. 5000 Purchases • Dr. 2220
                                        Input VAT • Cr. 2000 AP
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handlePrintBill(b)}
                                        icon={
                                          <PrintIcon
                                            size={12}
                                            className="text-emerald-700"
                                          />
                                        }
                                        className="text-xs font-bold text-teal-800 hover:text-teal-900 cursor-pointer p-0 h-auto flex items-center gap-1"
                                      >
                                        Print Full Voucher →
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={handleCloseCreate}
        title="Record Supplier Bill (Accounts Payable)"
        maxWidth="2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            createBillForm.handleSubmit();
          }}
          className="space-y-4 text-xs"
        >
          {createBillError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {createBillError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <createBillForm.Field name="billNumber">
              {(field) => (
                <FormInput
                  field={field}
                  label="Bill / Invoice Number"
                  placeholder="Auto-generated if empty (e.g. BILL-2026-001)"
                  className="font-mono"
                />
              )}
            </createBillForm.Field>
            <createBillForm.Field name="supplierId">
              {(field) => (
                <FormSelect
                  field={field}
                  label="Select Existing Supplier"
                  onChange={(e) => handleSupplierSelect(e.target.value)}
                >
                  <option value="">-- Choose Vendor or Enter New --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.trn ? `(TRN: ${s.trn})` : ""}
                    </option>
                  ))}
                </FormSelect>
              )}
            </createBillForm.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <createBillForm.Field name="supplierName">
              {(field) => (
                <FormInput
                  field={field}
                  label="Supplier / Vendor Name *"
                  placeholder="Vendor legal name"
                  required
                />
              )}
            </createBillForm.Field>
            <createBillForm.Field name="supplierTrn">
              {(field) => (
                <FormInput
                  field={field}
                  label="Supplier VAT TRN"
                  placeholder="100XXXXXXXXX003 (15 digits)"
                  className="font-mono"
                />
              )}
            </createBillForm.Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <createBillForm.Field name="billDate">
              {(field) => (
                <FormInput
                  field={field}
                  label="Bill Date *"
                  type="date"
                  required
                />
              )}
            </createBillForm.Field>
            <createBillForm.Field name="dueDate">
              {(field) => (
                <FormInput
                  field={field}
                  label="Due Date *"
                  type="date"
                  required
                />
              )}
            </createBillForm.Field>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">
                Itemized Procurement Scope
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                icon={<PlusIcon size={12} />}
                className="text-[11px] cursor-pointer"
              >
                Add Item
              </Button>
            </div>

            <createBillForm.Field name="items">
              {(itemsField) => {
                const itemsList = itemsField.state.value || [];
                return (
                  <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                    {itemsList.map((it, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200"
                      >
                        <div className="col-span-5">
                          <Input
                            placeholder="Item description"
                            value={it.description}
                            onChange={(e) =>
                              updateItem(idx, "description", e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="Qty"
                            min="1"
                            value={it.quantity}
                            onChange={(e) =>
                              updateItem(
                                idx,
                                "quantity",
                                parseFloat(e.target.value) || 1,
                              )
                            }
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Unit Cost"
                            value={it.unitCost}
                            onChange={(e) =>
                              updateItem(
                                idx,
                                "unitCost",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            required
                          />
                        </div>
                        <div className="col-span-2 text-right font-mono font-bold text-slate-800">
                          AED{" "}
                          {formatNumber(
                            Number(it.quantity || 0) * Number(it.unitCost || 0),
                          )}
                        </div>
                        <div className="col-span-1 text-center">
                          {itemsList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer p-1"
                            >
                              <TrashIcon size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }}
            </createBillForm.Field>

            <createBillForm.Subscribe selector={(state) => state.values.items}>
              {(itemsList) => {
                const sub = (itemsList || []).reduce(
                  (acc, it) =>
                    acc + Number(it.quantity || 0) * Number(it.unitCost || 0),
                  0,
                );
                const vat = sub * 0.05;
                const tot = sub + vat;
                return (
                  <div className="flex justify-end pt-2 text-right font-mono space-y-1">
                    <div className="w-64 bg-slate-100 p-3 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span>AED {formatNumber(sub)}</span>
                      </div>
                      <div className="flex justify-between text-purple-700 font-medium">
                        <span>Input VAT (5%):</span>
                        <span>AED {formatNumber(vat)}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-bold text-sm border-t border-slate-200 pt-1">
                        <span>Total Payable:</span>
                        <span>AED {formatNumber(tot)}</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            </createBillForm.Subscribe>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <createBillForm.Field name="autoPost">
              {(field) => (
                <input
                  type="checkbox"
                  id="autoPost"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
              )}
            </createBillForm.Field>
            <label htmlFor="autoPost" className="text-slate-700 font-medium">
              Post to General Ledger automatically upon creation
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              type="button"
              onClick={handleCloseCreate}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <FormSubmit
              form={createBillForm}
              className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
            >
              Save Bill Voucher
            </FormSubmit>
          </div>
        </form>
      </Modal>

      {selectedBill && (
        <Modal
          isOpen={!!selectedBill}
          onClose={() => setSelectedBill(null)}
          title={`Supplier Bill — ${selectedBill.billNumber}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Vendor
                </p>
                <p className="font-bold text-slate-900 text-sm">
                  {selectedBill.supplierName}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  TRN: {selectedBill.supplierTrn || "N/A"}
                </p>
              </div>
              <div className="text-right font-mono">
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Status
                </p>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 uppercase">
                  {selectedBill.status}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Due:{" "}
                  {selectedBill.dueDate
                    ? new Date(selectedBill.dueDate).toLocaleDateString("en-GB")
                    : "-"}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <Table className="w-full text-xs">
                <TableHead className="bg-slate-100">
                  <TableRow>
                    <TableHeaderCell className="py-2 px-3">
                      Description
                    </TableHeaderCell>
                    <TableHeaderCell className="py-2 px-3 text-center">
                      Qty
                    </TableHeaderCell>
                    <TableHeaderCell
                      align="right"
                      className="py-2 px-3 text-right"
                    >
                      Cost
                    </TableHeaderCell>
                    <TableHeaderCell
                      align="right"
                      className="py-2 px-3 text-right"
                    >
                      Total
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody className="divide-y divide-slate-100">
                  {!selectedBill.items || selectedBill.items.length === 0 ? (
                    <TableRow>
                      <TableCell className="py-2 px-3">
                        Direct procurement
                      </TableCell>
                      <TableCell className="py-2 px-3 text-center font-mono">
                        1
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-2 px-3 text-right font-mono"
                      >
                        {formatNumber(selectedBill.totalAmount)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-2 px-3 text-right font-mono font-bold"
                      >
                        {formatNumber(selectedBill.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedBill.items.map((it: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="py-2 px-3">
                          {it.description || "Supply line"}
                        </TableCell>
                        <TableCell className="py-2 px-3 text-center font-mono">
                          {it.quantity}
                        </TableCell>
                        <TableCell
                          align="right"
                          className="py-2 px-3 text-right font-mono"
                        >
                          {formatNumber(it.unitCost)}
                        </TableCell>
                        <TableCell
                          align="right"
                          className="py-2 px-3 text-right font-mono font-bold"
                        >
                          {formatNumber(it.quantity * it.unitCost)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl font-mono text-xs">
              <span className="font-bold text-slate-700">Balance Due:</span>
              <span
                className={`font-black text-sm ${
                  Number(selectedBill.remainingBalance) > 0
                    ? "text-rose-700"
                    : "text-emerald-700"
                }`}
              >
                AED {formatNumber(selectedBill.remainingBalance)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrintBill(selectedBill)}
                icon={<PrintIcon size={13} className="text-emerald-700" />}
                className="cursor-pointer"
              >
                Print Voucher (PDF)
              </Button>
              <Button
                variant="dark"
                size="sm"
                onClick={() => setSelectedBill(null)}
                className="cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {paymentModalBill && (
        <Modal
          isOpen={!!paymentModalBill}
          onClose={handleClosePayment}
          title={`Disburse Payment — ${paymentModalBill.billNumber}`}
          maxWidth="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              paymentForm.handleSubmit();
            }}
            className="space-y-3.5 text-xs"
          >
            {disbursalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                {disbursalError}
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-slate-500 font-medium">Vendor / Payee</p>
              <p className="font-bold text-slate-900 text-sm">
                {paymentModalBill.supplierName}
              </p>
              <p className="font-mono text-rose-700 font-bold mt-1">
                Outstanding Balance: AED{" "}
                {formatNumber(paymentModalBill.remainingBalance)}
              </p>
            </div>

            <paymentForm.Field name="amount">
              {(field) => (
                <FormInput
                  field={field}
                  label="Payment Amount (AED) *"
                  type="number"
                  step="0.01"
                  max={paymentModalBill.remainingBalance}
                  min="0.01"
                  required
                  className="font-mono font-bold"
                />
              )}
            </paymentForm.Field>

            <paymentForm.Field name="paymentMethod">
              {(field) => (
                <FormSelect field={field} label="Disbursal Method *">
                  <option value="BANK_TRANSFER">
                    Corporate Bank Transfer (WPS)
                  </option>
                  <option value="CHEQUE">Corporate Cheque</option>
                  <option value="CASH">Petty Cash</option>
                  <option value="CREDIT_CARD">Corporate Card</option>
                </FormSelect>
              )}
            </paymentForm.Field>

            <paymentForm.Field name="referenceNumber">
              {(field) => (
                <FormInput
                  field={field}
                  label="Reference / Cheque / Txn Number"
                  placeholder="Txn reference / Cheque number"
                  className="font-mono"
                />
              )}
            </paymentForm.Field>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                type="button"
                onClick={handleClosePayment}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <FormSubmit
                form={paymentForm}
                className="bg-teal-800 hover:bg-teal-900 text-white font-bold cursor-pointer"
              >
                Confirm Disbursal
              </FormSubmit>
            </div>
          </form>
        </Modal>
      )}

      <div
        style={{
          position: "fixed",
          left: "-99999px",
          top: "-99999px",
          width: "210mm",
        }}
      >
        <div ref={printDocumentRef}>
          {billToPrint && <SupplierBillDocument bill={billToPrint} />}
        </div>
      </div>
    </div>
  );
}
