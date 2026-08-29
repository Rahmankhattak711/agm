"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  useSuppliers,
  useSupplierBills,
  Supplier,
} from "@/lib/hooks/api-hooks";
import { SearchIcon, PrintIcon, EyeIcon } from "@/components/icons";
import {
  Button,
  Input,
  Select,
  DataTable,
  Modal,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";
import {
  AgingBucketCard,
  AgingBucket,
} from "@/components/reports/AgingBucketCard";
import { Building2, FileText, Mail, Phone, Clock } from "lucide-react";

export default function SupplierReportsPage() {
  const [search, setSearch] = useState("");
  const [balanceFilter, setBalanceFilter] = useState<string>("ALL");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(
    null,
  );
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState(false);

  const { data: suppliers = [], isLoading, error } = useSuppliers();
  const { data: bills = [] } = useSupplierBills();

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Compute A/P Aging Buckets from open vendor bills
  const apAgingBuckets = useMemo<AgingBucket[]>(() => {
    const buckets = [
      {
        label: "Current",
        daysRange: "0–30 Days",
        amount: 0,
        count: 0,
        color: "#059669",
        badgeBg: "#ecfdf5",
      },
      {
        label: "Approaching Due",
        daysRange: "31–60 Days",
        amount: 0,
        count: 0,
        color: "#d97706",
        badgeBg: "#fffbeb",
      },
      {
        label: "Past Due",
        daysRange: "61–90 Days",
        amount: 0,
        count: 0,
        color: "#ea580c",
        badgeBg: "#fff7ed",
      },
      {
        label: "Severely Overdue",
        daysRange: "90+ Days",
        amount: 0,
        count: 0,
        color: "#dc2626",
        badgeBg: "#fef2f2",
      },
    ];

    const now = new Date().getTime();

    bills.forEach((b) => {
      if (b.status === "CANCELLED") return;
      const balance = Number(b.remainingBalance || 0);
      if (balance <= 0) return;

      const billDate = b.billDate ? new Date(b.billDate).getTime() : now;
      const daysOld = Math.floor((now - billDate) / (1000 * 60 * 60 * 24));

      if (daysOld <= 30) {
        buckets[0].amount += balance;
        buckets[0].count += 1;
      } else if (daysOld <= 60) {
        buckets[1].amount += balance;
        buckets[1].count += 1;
      } else if (daysOld <= 90) {
        buckets[2].amount += balance;
        buckets[2].count += 1;
      } else {
        buckets[3].amount += balance;
        buckets[3].count += 1;
      }
    });

    return buckets;
  }, [bills]);

  // Map total billed and outstanding per supplier
  const supplierMetricsMap = useMemo(() => {
    const map: Record<
      string,
      {
        totalBilled: number;
        totalPaid: number;
        openBalance: number;
        billCount: number;
      }
    > = {};

    bills.forEach((b) => {
      if (b.status === "CANCELLED") return;
      const key = b.supplierId || b.supplierName;
      if (!map[key]) {
        map[key] = {
          totalBilled: 0,
          totalPaid: 0,
          openBalance: 0,
          billCount: 0,
        };
      }
      map[key].totalBilled += Number(b.totalAmount || 0);
      map[key].totalPaid += Number(b.paidAmount || 0);
      map[key].openBalance += Number(b.remainingBalance || 0);
      map[key].billCount += 1;
    });

    return map;
  }, [bills]);

  // Enriched & filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const metrics = supplierMetricsMap[s.id] ||
        supplierMetricsMap[s.name] || {
          totalBilled: 0,
          totalPaid: 0,
          openBalance: 0,
          billCount: 0,
        };

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesCode = s.supplierCode?.toLowerCase().includes(q);
        const matchesName = s.name?.toLowerCase().includes(q);
        const matchesTrn = s.trn?.toLowerCase().includes(q);
        const matchesContact = s.contactPerson?.toLowerCase().includes(q);
        const matchesEmail = s.email?.toLowerCase().includes(q);
        if (
          !matchesCode &&
          !matchesName &&
          !matchesTrn &&
          !matchesContact &&
          !matchesEmail
        ) {
          return false;
        }
      }

      if (balanceFilter === "HAS_BALANCE" && metrics.openBalance <= 0)
        return false;
      if (balanceFilter === "SETTLED" && metrics.openBalance > 0) return false;
      if (balanceFilter === "HIGH_BALANCE" && metrics.openBalance < 10000)
        return false;

      return true;
    });
  }, [suppliers, supplierMetricsMap, search, balanceFilter]);

  // KPI Metrics
  const totalSuppliersCount = suppliers.length;

  const totalProcurementBilled = useMemo(
    () =>
      bills
        .filter((b) => b.status !== "CANCELLED")
        .reduce((acc, b) => acc + Number(b.totalAmount || 0), 0),
    [bills],
  );

  const totalOutstandingAP = useMemo(
    () =>
      bills
        .filter((b) => b.status !== "CANCELLED")
        .reduce((acc, b) => acc + Number(b.remainingBalance || 0), 0),
    [bills],
  );

  const totalDisbursed = useMemo(
    () =>
      bills
        .filter((b) => b.status !== "CANCELLED")
        .reduce((acc, b) => acc + Number(b.paidAmount || 0), 0),
    [bills],
  );

  const activeSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId) || null,
    [suppliers, selectedSupplierId],
  );

  const activeSupplierBills = useMemo(
    () =>
      bills.filter(
        (b) =>
          b.supplierId === selectedSupplierId ||
          (activeSupplier && b.supplierName === activeSupplier.name),
      ),
    [bills, selectedSupplierId, activeSupplier],
  );

  // TanStack Columns
  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: "supplierCode",
        header: "Supplier Code",
        cell: ({ row }) => (
          <span
            onClick={() => setSelectedSupplierId(row.original.id)}
            className="font-mono font-bold text-cyan-950 hover:underline cursor-pointer"
          >
            {row.original.supplierCode}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Vendor / Company",
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-slate-900 block leading-tight">
              {row.original.name}
            </span>
            {row.original.trn && (
              <span className="font-mono text-[10px] text-slate-400 mt-0.5 inline-block">
                TRN: {row.original.trn}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "contact",
        header: "Contact Details",
        cell: ({ row }) => (
          <div className="space-y-0.5 text-slate-600">
            {row.original.contactPerson && (
              <span className="font-medium text-slate-800 block">
                {row.original.contactPerson}
              </span>
            )}
            {row.original.phone && (
              <span className="font-mono text-[11px] text-slate-500 block">
                {row.original.phone}
              </span>
            )}
            {row.original.email && (
              <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                {row.original.email}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "address",
        header: "Location / Address",
        cell: ({ row }) => (
          <span className="text-slate-600 text-xs truncate max-w-[140px] block">
            {row.original.address || "UAE"}
          </span>
        ),
      },
      {
        id: "totalBilled",
        header: () => <div className="text-right">Total Billed</div>,
        cell: ({ row }) => {
          const m =
            supplierMetricsMap[row.original.id] ||
            supplierMetricsMap[row.original.name];
          return (
            <span className="font-mono font-bold text-slate-900 block text-right">
              {formatCurrency(m?.totalBilled || 0)}
            </span>
          );
        },
      },
      {
        id: "openBalance",
        header: () => <div className="text-right">Payable Balance (A/P)</div>,
        cell: ({ row }) => {
          const m =
            supplierMetricsMap[row.original.id] ||
            supplierMetricsMap[row.original.name];
          const balance = Number(m?.openBalance || 0);
          return (
            <span
              className={`font-mono font-black block text-right ${
                balance > 0 ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              {formatCurrency(balance)}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Liability Status",
        cell: ({ row }) => {
          const m =
            supplierMetricsMap[row.original.id] ||
            supplierMetricsMap[row.original.name];
          const balance = Number(m?.openBalance || 0);

          return (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                balance > 0
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}
            >
              {balance > 0 ? "Open Payable" : "Settled"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center">Ledger</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSupplierId(row.original.id)}
              icon={<FileText className="w-3.5 h-3.5" />}
              className="text-[10.5px] font-bold"
            >
              Ledger
            </Button>
          </div>
        ),
      },
    ],
    [supplierMetricsMap],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Supplier &amp; Vendor Payable Reports
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200">
              Accounts Payable Directory
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            AGM FITOUT TECHNICAL SERVICES LLC — Vendor accounts payable ledgers,
            procurement history, payment terms, and outstanding liability
            balances.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsPrintSummaryOpen(true)}
          icon={<PrintIcon className="w-4 h-4" strokeWidth={2.2} />}
        >
          Print Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Active Suppliers
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {totalSuppliersCount}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered materials &amp; fitout vendors
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Open Accounts Payable (A/P)
          </p>
          <p className="text-2xl font-black text-amber-700 mt-1">
            {formatCurrency(totalOutstandingAP)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Pending supplier payment liabilities
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Procurement Spend
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(totalProcurementBilled)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Cumulative vendor invoice volume
          </p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Disbursed Settlements
          </p>
          <p className="text-2xl font-black text-emerald-800 mt-1">
            {formatCurrency(totalDisbursed)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Realized vendor payments
          </p>
        </div>
      </div>

      <AgingBucketCard
        title="Accounts Payable (A/P) Aging Schedule"
        subtitle="Chronological breakdown of open vendor liabilities based on supplier bill dates"
        buckets={apAgingBuckets}
        totalOverdue={totalOutstandingAP}
      />

      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search supplier, code, contact, TRN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={
                <SearchIcon
                  className="w-4 h-4 text-slate-400"
                  strokeWidth={2}
                />
              }
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value)}
              containerClassName="w-full sm:w-48"
            >
              <option value="ALL">All Payable Statuses</option>
              <option value="HAS_BALANCE">Has Outstanding A/P</option>
              <option value="HIGH_BALANCE">
                High Balance (&gt; 10,000 AED)
              </option>
              <option value="SETTLED">Fully Settled (0.00 AED)</option>
            </Select>
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-red-500">
            Error loading suppliers: {(error as any).message}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredSuppliers}
            isLoading={isLoading}
            emptyTitle="No supplier records found"
            emptyMessage="No supplier accounts match your search or filter criteria."
          />
        )}
      </div>

      {selectedSupplierId && activeSupplier && (
        <Modal
          isOpen={Boolean(selectedSupplierId)}
          onClose={() => setSelectedSupplierId(null)}
          title={`Supplier Statement & Ledger: ${activeSupplier.name} (${activeSupplier.supplierCode})`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Vendor Name
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {activeSupplier.name}
                </span>
                {activeSupplier.trn && (
                  <span className="font-mono text-[10px] text-slate-500 block mt-0.5">
                    TRN: {activeSupplier.trn}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Location / Address
                </span>
                <span className="font-semibold text-slate-800">
                  {activeSupplier.address || "UAE"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Total Purchases
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatCurrency(
                    (
                      supplierMetricsMap[activeSupplier.id] ||
                      supplierMetricsMap[activeSupplier.name]
                    )?.totalBilled || 0,
                  )}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Open Payable (A/P)
                </span>
                <span className="font-mono font-black text-amber-700 text-sm block">
                  {formatCurrency(
                    (
                      supplierMetricsMap[activeSupplier.id] ||
                      supplierMetricsMap[activeSupplier.name]
                    )?.openBalance || 0,
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Supplier Bills &amp; Invoices
              </h4>
              {activeSupplierBills.length > 0 ? (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHead className="bg-slate-50 border-b border-slate-200">
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px]">
                        Bill No
                      </TableHeaderCell>
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px]">
                        Bill Date
                      </TableHeaderCell>
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px] text-right">
                        Total Amount
                      </TableHeaderCell>
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px] text-right">
                        Amount Paid
                      </TableHeaderCell>
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px] text-right">
                        Balance Due
                      </TableHeaderCell>
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px] text-center">
                        Status
                      </TableHeaderCell>
                    </TableHead>
                    <TableBody className="divide-y divide-slate-100 font-mono">
                      {activeSupplierBills.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="py-2 px-3 font-bold text-cyan-950">
                            {b.billNumber}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-slate-600">
                            {b.billDate
                              ? new Date(b.billDate).toISOString().slice(0, 10)
                              : "—"}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-right text-slate-800">
                            {Number(b.totalAmount).toFixed(2)}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-right text-emerald-700">
                            {Number(b.paidAmount).toFixed(2)}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-right font-bold text-amber-700">
                            {Number(b.remainingBalance).toFixed(2)}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-center font-sans text-[10px]">
                            <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                              {b.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  No bills on record for this vendor.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSupplierId(null)}
              >
                Close Ledger
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isPrintSummaryOpen && (
        <Modal
          isOpen={isPrintSummaryOpen}
          onClose={() => setIsPrintSummaryOpen(false)}
          title="Print Supplier Payables Summary"
          maxWidth="4xl"
        >
          <div className="space-y-6 text-xs print:p-0">
            <div
              className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6 print:border-none print:shadow-none print:p-0"
              id="suppliers-print-area"
            >
              <table className="print-page-table w-full border-collapse">
                <thead className="print-page-header-group">
                  <tr>
                    <th className="p-0 font-normal text-left border-none">
                      <div className="mb-4">
                        <QuotationHeader className="-mx-6 -mt-6 mb-4 print:m-0" />
                      </div>
                    </th>
                  </tr>
                </thead>

                <tfoot className="print-page-footer-group">
                  <tr>
                    <td className="p-0 border-none">
                      <div className="h-[80px] w-full hidden print:block" />
                    </td>
                  </tr>
                </tfoot>

                <tbody className="print-page-body-group">
                  <tr>
                    <td className="p-0 border-none align-top">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center border-b-2 border-emerald-800 pb-2 print-avoid-break">
                          <div>
                            <span className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase block">
                              Accounts Payable Directory
                            </span>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">
                              VENDOR BALANCES &amp; PROCUREMENT SUMMARY
                            </h3>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-700 font-mono font-bold text-xs">
                              {filteredSuppliers.length} Vendors
                            </p>
                            <p className="text-slate-400 text-[10px]">
                              Generated:{" "}
                              {new Date().toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Total Suppliers
                            </span>
                            <span className="font-mono font-black text-slate-900">
                              {totalSuppliersCount}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Total Open A/P
                            </span>
                            <span className="font-mono font-black text-amber-700">
                              {formatCurrency(totalOutstandingAP)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Total Purchases
                            </span>
                            <span className="font-mono font-black text-slate-900">
                              {formatCurrency(totalProcurementBilled)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-900 text-xs">
                            Supplier Directory ({filteredSuppliers.length}{" "}
                            vendors)
                          </h4>
                          <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                  <th className="py-2 px-3 text-[10px] font-bold text-slate-600 uppercase">
                                    Code
                                  </th>
                                  <th className="py-2 px-3 text-[10px] font-bold text-slate-600 uppercase">
                                    Supplier
                                  </th>
                                  <th className="py-2 px-3 text-[10px] font-bold text-slate-600 uppercase">
                                    Terms
                                  </th>
                                  <th className="py-2 px-3 text-[10px] font-bold text-slate-600 uppercase text-right">
                                    Total Billed (AED)
                                  </th>
                                  <th className="py-2 px-3 text-[10px] font-bold text-slate-600 uppercase text-right">
                                    Balance Due (AED)
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-mono">
                                {filteredSuppliers.map((s) => {
                                  const m =
                                    supplierMetricsMap[s.id] ||
                                    supplierMetricsMap[s.name];
                                  return (
                                    <tr key={s.id}>
                                      <td className="py-1.5 px-3 font-bold text-slate-900">
                                        {s.supplierCode}
                                      </td>
                                      <td className="py-1.5 px-3 font-sans font-medium text-slate-800">
                                        {s.name}
                                      </td>
                                      <td className="py-1.5 px-3 font-sans text-slate-600">
                                        {s.address || "UAE"}
                                      </td>
                                      <td className="py-1.5 px-3 text-right">
                                        {Number(m?.totalBilled || 0).toFixed(2)}
                                      </td>
                                      <td className="py-1.5 px-3 text-right font-bold text-amber-700">
                                        {Number(m?.openBalance || 0).toFixed(2)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="hidden print:block">
                <QuotationFooter />
              </div>
              <div className="print:hidden">
                <QuotationFooter className="-mx-6 -mb-6 mt-6" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPrintSummaryOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                icon={<PrintIcon className="w-4 h-4" strokeWidth={2} />}
              >
                Print Document
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
