"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  useCustomers,
  useCustomerStatement,
  useSalesInvoices,
  Customer,
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
import { AgingBucketCard, AgingBucket } from "../components";
import {
  ReportKpiCard,
  ReportKpiGrid,
} from "@/app/(workspace)/finance/reports/components/ReportKpiCard";
import {
  FileText,
  Users2,
  Mail,
  Phone,
  Building2,
  ShieldAlert,
} from "lucide-react";

export default function CustomerReportsPage() {
  const [search, setSearch] = useState("");
  const [balanceFilter, setBalanceFilter] = useState<string>("ALL");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );

  const { data: customers = [], isLoading, error } = useCustomers();
  const { data: invoices = [] } = useSalesInvoices();
  const { data: statement, isLoading: statementLoading } = useCustomerStatement(
    selectedCustomerId || "",
  );

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return `AED ${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const agingBuckets = useMemo<AgingBucket[]>(() => {
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
        label: "Watchlist",
        daysRange: "31–60 Days",
        amount: 0,
        count: 0,
        color: "#d97706",
        badgeBg: "#fffbeb",
      },
      {
        label: "Overdue",
        daysRange: "61–90 Days",
        amount: 0,
        count: 0,
        color: "#ea580c",
        badgeBg: "#fff7ed",
      },
      {
        label: "Critical",
        daysRange: "90+ Days",
        amount: 0,
        count: 0,
        color: "#dc2626",
        badgeBg: "#fef2f2",
      },
    ];

    const now = new Date().getTime();

    invoices.forEach((inv) => {
      if (inv.status === "CANCELLED") return;
      const balance = Number(inv.remainingBalance || 0);
      if (balance <= 0) return;

      const invDate = inv.invoiceDate
        ? new Date(inv.invoiceDate).getTime()
        : now;
      const daysOld = Math.floor((now - invDate) / (1000 * 60 * 60 * 24));

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
  }, [invoices]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesCode = c.customerCode?.toLowerCase().includes(q);
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesCompany = c.companyName?.toLowerCase().includes(q);
        const matchesTrn = c.trn?.toLowerCase().includes(q);
        const matchesEmail = c.email?.toLowerCase().includes(q);
        if (
          !matchesCode &&
          !matchesName &&
          !matchesCompany &&
          !matchesTrn &&
          !matchesEmail
        ) {
          return false;
        }
      }

      const balance = Number(c.currentBalance || 0);
      if (balanceFilter === "HAS_BALANCE" && balance <= 0) return false;
      if (balanceFilter === "SETTLED" && balance > 0) return false;
      if (balanceFilter === "HIGH_BALANCE" && balance < 10000) return false;

      return true;
    });
  }, [customers, search, balanceFilter]);

  const totalClients = customers.length;

  const totalReceivables = useMemo(
    () =>
      customers.reduce(
        (acc, c) => acc + Math.max(0, Number(c.currentBalance || 0)),
        0,
      ),
    [customers],
  );

  const totalCreditLimit = useMemo(
    () => customers.reduce((acc, c) => acc + Number(c.creditLimit || 0), 0),
    [customers],
  );

  const clientsWithBalanceCount = useMemo(
    () => customers.filter((c) => Number(c.currentBalance || 0) > 0).length,
    [customers],
  );

  const activeCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId],
  );

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "customerCode",
        header: "Client Code",
        cell: ({ row }) => (
          <span
            onClick={() => setSelectedCustomerId(row.original.id)}
            className="font-mono font-bold text-emerald-950 hover:underline cursor-pointer"
          >
            {row.original.customerCode}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Customer / Entity",
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-slate-900 block leading-tight">
              {row.original.name}
            </span>
            {row.original.companyName && (
              <span className="text-[11px] text-slate-500 block">
                {row.original.companyName}
              </span>
            )}
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
        accessorKey: "creditLimit",
        header: () => <div className="text-right">Credit Limit</div>,
        cell: ({ row }) => (
          <span className="font-mono font-bold text-slate-700 block text-right">
            {formatCurrency(row.original.creditLimit)}
          </span>
        ),
      },
      {
        accessorKey: "currentBalance",
        header: () => <div className="text-right">Outstanding A/R</div>,
        cell: ({ row }) => {
          const balance = Number(row.original.currentBalance || 0);
          return (
            <span
              className={`font-mono font-black block text-right ${
                balance > 0 ? "text-rose-700" : "text-emerald-700"
              }`}
            >
              {formatCurrency(balance)}
            </span>
          );
        },
      },
      {
        accessorKey: "invoicesCount",
        header: () => <div className="text-center">Invoices</div>,
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-slate-700 block text-center">
            {row.original._count?.salesInvoices || 0}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Account Status",
        cell: ({ row }) => {
          const balance = Number(row.original.currentBalance || 0);
          const limit = Number(row.original.creditLimit || 0);
          const isOverLimit = limit > 0 && balance > limit;

          return (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isOverLimit
                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                  : balance > 0
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}
            >
              {isOverLimit
                ? "Exceeded Limit"
                : balance > 0
                  ? "Open Balance"
                  : "Settled"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center">Statement</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCustomerId(row.original.id)}
              icon={<FileText className="w-3.5 h-3.5" />}
              className="text-[10.5px] font-bold"
            >
              Statement
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <div className="space-y-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Customer &amp; Client Aging Reports
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Accounts Receivable Directory
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              AGM FITOUT TECHNICAL SERVICES LLC — Client receivable ledgers,
              credit risk exposure, open invoices, and statement of accounts.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => window.print()}
            icon={<PrintIcon className="w-4 h-4" strokeWidth={2.2} />}
          >
            Print Report
          </Button>
        </div>

        <ReportKpiGrid cols={3}>
          <ReportKpiCard
            title="Total Registered Clients"
            subtitle="Active corporate & individual accounts"
            value={totalClients}
            currency={false}
            accentColor="sky"
          />

          <ReportKpiCard
            title="Cumulative Outstanding A/R"
            subtitle={`Across ${clientsWithBalanceCount} open customer ledgers`}
            value={Number(totalReceivables).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            accentColor="rose"
            valueColor="text-rose-700"
          />

          <ReportKpiCard
            title="Clients With Open Balance"
            subtitle="Require collection follow-up"
            value={clientsWithBalanceCount}
            currency={false}
            accentColor="amber"
            valueColor="text-amber-700"
          />

          <ReportKpiCard
            title="Total Credit Limit Extended"
            subtitle="Approved client credit facilities"
            value={Number(totalCreditLimit).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            accentColor="blue"
            valueColor="text-blue-700"
          />
        </ReportKpiGrid>

        <AgingBucketCard
          title="Accounts Receivable (A/R) Aging Schedule"
          subtitle="Chronological breakdown of open customer balances based on invoice issue dates"
          buckets={agingBuckets}
          totalOverdue={totalReceivables}
        />

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="w-full sm:w-80">
              <Input
                placeholder="Search customer, code, company, TRN..."
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
                <option value="ALL">All Balance Statuses</option>
                <option value="HAS_BALANCE">Has Outstanding Balance</option>
                <option value="HIGH_BALANCE">
                  High Balance (&gt; 10,000 AED)
                </option>
                <option value="SETTLED">Fully Settled (0.00 AED)</option>
              </Select>
            </div>
          </div>

          {error ? (
            <div className="py-8 text-center text-xs text-red-500">
              Error loading customers: {(error as any).message}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredCustomers}
              isLoading={isLoading}
              emptyTitle="No customer records found"
              emptyMessage="No customer accounts match your search or filter criteria."
            />
          )}
        </div>
      </div>

      {selectedCustomerId && activeCustomer && (
        <Modal
          isOpen={Boolean(selectedCustomerId)}
          onClose={() => setSelectedCustomerId(null)}
          title={`Statement of Account: ${activeCustomer.name} (${activeCustomer.customerCode})`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Customer / Entity
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {activeCustomer.name}
                </span>
                {activeCustomer.trn && (
                  <span className="font-mono text-[10px] text-slate-500 block mt-0.5">
                    TRN: {activeCustomer.trn}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Credit Limit
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatCurrency(activeCustomer.creditLimit)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Invoices Count
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {activeCustomer._count?.salesInvoices || 0} Vouchers
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Outstanding Balance
                </span>
                <span className="font-mono font-black text-rose-700 text-sm block">
                  {formatCurrency(activeCustomer.currentBalance)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Chronological Transactions &amp; Invoices
              </h4>
              {statementLoading ? (
                <div className="py-8 text-center text-slate-400 animate-pulse">
                  Loading statement records...
                </div>
              ) : statement && (statement as any).invoices?.length > 0 ? (
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHead className="bg-slate-50 border-b border-slate-200">
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px]">
                        Invoice No
                      </TableHeaderCell>
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px]">
                        Date
                      </TableHeaderCell>
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px] text-right">
                        Billed Total
                      </TableHeaderCell>
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px] text-right">
                        Amount Paid
                      </TableHeaderCell>
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px] text-right">
                        Remaining Due
                      </TableHeaderCell>
                      <TableHeaderCell className="py-2.5 px-3 font-bold text-slate-600 text-[10.5px] text-center">
                        Status
                      </TableHeaderCell>
                    </TableHead>
                    <TableBody className="divide-y divide-slate-100 font-mono">
                      {(statement as any).invoices.map((inv: any) => (
                        <TableRow key={inv.id}>
                          <TableCell className="py-2 px-3 font-bold text-blue-950">
                            {inv.invoiceNumber}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-slate-600">
                            {inv.invoiceDate
                              ? new Date(inv.invoiceDate)
                                  .toISOString()
                                  .slice(0, 10)
                              : "—"}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-right text-slate-800">
                            {Number(inv.totalAmount).toFixed(2)}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-right text-emerald-700">
                            {Number(inv.paidAmount).toFixed(2)}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-right font-bold text-rose-700">
                            {Number(inv.remainingBalance).toFixed(2)}
                          </TableCell>
                          <TableCell className="py-2 px-3 text-center font-sans text-[10px]">
                            <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                              {inv.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  No transaction history recorded for this client.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCustomerId(null)}
              >
                Close Statement
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <div
        id="customers-print-area"
        className="mx-auto bg-white max-w-4xl rounded-xl print:rounded-none overflow-visible print:overflow-visible hidden print:block w-full"
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
                <div className="px-8 py-3 space-y-4">
                  <div className="flex justify-between items-center border-b-2 border-emerald-800 pb-2 print-avoid-break">
                    <div>
                      <span className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase block">
                        Accounts Receivable Directory
                      </span>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        CLIENT BALANCES &amp; CREDIT EXPOSURE
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-700 font-mono font-bold text-xs">
                        {filteredCustomers.length} Accounts
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

                  <div className="grid grid-cols-3 gap-3 p-4 bg-white rounded-xl border border-slate-200 print-avoid-break">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Total Clients
                      </span>
                      <span className="font-mono font-black text-slate-900">
                        {totalClients}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Total Outstanding A/R
                      </span>
                      <span className="font-mono font-black text-rose-700">
                        {formatCurrency(totalReceivables)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Credit Limit Extended
                      </span>
                      <span className="font-mono font-black text-blue-700">
                        {formatCurrency(totalCreditLimit)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs">
                      Customer Directory ({filteredCustomers.length} accounts)
                    </h4>
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-slate-600 uppercase">
                              Code
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-slate-600 uppercase">
                              Customer
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-slate-600 uppercase">
                              Contact
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-slate-600 uppercase text-right">
                              Credit Limit (AED)
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-slate-600 uppercase text-right">
                              Balance Due (AED)
                            </th>
                            <th className="py-2.5 px-3 text-[10px] font-bold text-slate-600 uppercase text-right">
                              Total Invoiced (AED)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {filteredCustomers.map((c) => (
                            <tr key={c.id}>
                              <td className="py-2 px-3 font-bold text-slate-900">
                                {c.customerCode}
                              </td>
                              <td className="py-2 px-3 font-sans font-medium text-slate-800">
                                {c.name}
                              </td>
                              <td className="py-2 px-3 font-sans text-slate-600">
                                {c.phone || c.email || "—"}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {Number(c.creditLimit).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-rose-700">
                                {Number(c.currentBalance).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-slate-700">
                                {c._count?.salesInvoices || 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="fixed-print-footer hidden print:block">
          <QuotationFooter />
        </div>
      </div>
    </>
  );
}
