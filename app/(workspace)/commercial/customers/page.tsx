"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  Building2,
  FileText,
  Mail,
  Phone,
  Plus,
  Printer,
  Search,
  UserCheck,
  ShieldCheck,
  CreditCard,
  Layers,
  ArrowUpRight,
  Eye,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Modal,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableEmpty,
  TableLoading,
} from "@/components/ui";
import {
  useCustomers,
  useCustomerStatement,
  useCreateCustomer,
  Customer,
} from "@/lib/hooks/api-hooks";
import { QuotationHeader, QuotationFooter } from "@/components/quotation";

export default function CustomersMasterPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "OUTSTANDING" | "SETTLED" | "TRN"
  >("ALL");
  const { data: customers = [], isLoading, error } = useCustomers(search);
  const createCustomerMutation = useCreateCustomer();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );

  const { data: statementData } = useCustomerStatement(selectedCustomerId);

  const formatNumber = (val: number | string | undefined) => {
    const num = Number(val || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const EMPTY_FORM = {
    customerCode: "",
    name: "",
    companyName: "",
    trn: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    creditLimit: "",
  };
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const setField = useCallback(
    <K extends keyof typeof EMPTY_FORM>(k: K, v: string) =>
      setForm((p) => ({ ...p, [k]: v })),
    [],
  );

  const handleCloseCreate = useCallback(() => {
    setIsCreateOpen(false);
    setForm({ ...EMPTY_FORM });
  }, []);

  const handleCreateCustomer = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await createCustomerMutation.mutateAsync({
          customerCode: form.customerCode || undefined,
          name: form.name,
          companyName: form.companyName || undefined,
          trn: form.trn || undefined,
          contactPerson: form.contactPerson || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          creditLimit: parseFloat(form.creditLimit) || 0,
        });
        handleCloseCreate();
      } catch (err: any) {
        alert(`Error creating customer: ${err.message}`);
      }
    },
    [createCustomerMutation, form, handleCloseCreate],
  );

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const bal = Number(c.currentBalance || 0);
      if (statusFilter === "OUTSTANDING") return bal > 0;
      if (statusFilter === "SETTLED") return bal <= 0;
      if (statusFilter === "TRN") return Boolean(c.trn);
      return true;
    });
  }, [customers, statusFilter]);

  const totalReceivables = useMemo(
    () => customers.reduce((s, c) => s + Math.max(0, Number(c.currentBalance || 0)), 0),
    [customers],
  );

  const totalCreditLimits = useMemo(
    () => customers.reduce((s, c) => s + Number(c.creditLimit || 0), 0),
    [customers],
  );

  const trnCount = useMemo(
    () => customers.filter((c) => c.trn).length,
    [customers],
  );

  return (
    <div className="space-y-6">
      {/* Simple Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Customer Directory &amp; Statements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            AGM FITOUT TECHNICAL SERVICES LLC — Comprehensive client database, credit limit controls, <br /> and real-time Statement of Account ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer"
            icon={<Printer size={14} />}
          >
            Print Register
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus size={14} strokeWidth={2.5} />}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            Add New Customer
          </Button>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {/* 1. Total Active Clients */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-sky-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              1. Total Active Clients
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Registered client accounts
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {customers.length}
            </span>
            <span className="text-xs font-bold text-slate-500 font-sans ml-1.5">
              Clients
            </span>
          </div>
        </div>

        {/* 2. Outstanding Receivables */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-rose-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              2. Outstanding Receivables
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Open invoices due
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-rose-500 font-sans mr-1">
              AED
            </span>
            <span className="text-xl font-black text-rose-700 font-mono">
              {formatNumber(totalReceivables)}
            </span>
          </div>
        </div>

        {/* 3. Approved Credit Facility */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-emerald-500" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              3. Total Credit Facility
            </span>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              Extended credit limits
            </span>
          </div>
          <div className="pt-2">
            <span className="text-xs font-semibold text-emerald-600 font-sans mr-1">
              AED
            </span>
            <span className="text-xl font-black text-emerald-800 font-mono">
              {formatNumber(totalCreditLimits)}
            </span>
          </div>
        </div>

        {/* 4. VAT TRN Compliant */}
        <div className="relative overflow-hidden p-4.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
          <div className="absolute inset-x-0 top-0 h-[2.5px] bg-teal-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                4. Corporate TRN
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 border border-teal-200">
                Tax Reg
              </span>
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block truncate">
              VAT verified entities
            </span>
          </div>
          <div className="pt-2">
            <span className="text-2xl font-black text-teal-900 font-mono">
              {trnCount}
            </span>
            <span className="text-xs font-bold text-teal-700 font-sans ml-1.5">
              Verified
            </span>
          </div>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        {/* Search & Filter Strip */}
        <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Status Quick Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: "ALL", label: "All Clients" },
                { id: "OUTSTANDING", label: "Outstanding Due" },
                { id: "SETTLED", label: "Settled Accounts" },
                { id: "TRN", label: "Tax Registered (TRN)" },
              ].map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id as any)}
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
              {filteredCustomers.length} Clients Displayed
            </span>
          </div>

          <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
            <div className="w-full sm:w-96 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search customer name, company, code, TRN, phone..."
                className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-emerald-500 shadow-2xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className="py-8 text-center text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
            Error loading customer directory: {(error as any).message}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="bg-[radial-gradient(circle_at_top,_#3f5d72,_#233c4d_42%,_#1d2f3f_100%)] text-white p-3.5 px-5 flex items-center justify-between">
              <h4 className="font-black text-xs uppercase tracking-wider text-white">
                Master Customer Directory &amp; Ledger
              </h4>
              <span className="text-[11px] font-mono text-emerald-300 font-bold">
                {filteredCustomers.length} Clients
              </span>
            </div>

            <Table className="w-full text-xs text-left">
              <TableHead className="bg-slate-50 border-b border-slate-200">
                <TableRow>
                  <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    Customer Code
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    Customer / Company
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    TRN (UAE VAT)
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[10.5px] tracking-wider">
                    Contact / Phone
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-[10.5px] tracking-wider"
                  >
                    Credit Limit (AED)
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-[10.5px] tracking-wider"
                  >
                    Outstanding (AED)
                  </TableHeaderCell>
                  <TableHeaderCell className="py-3 px-4 text-center font-bold text-slate-600 uppercase text-[10.5px] tracking-wider print:hidden">
                    Actions
                  </TableHeaderCell>
                </TableRow>
              </TableHead>

              <TableBody className="divide-y divide-slate-100 font-medium">
                {isLoading ? (
                  <TableLoading
                    colSpan={7}
                    message="Loading customer directory..."
                  />
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-slate-400 italic"
                    >
                      No customers match your search criteria. Click &quot;Add New Customer&quot; to create a new profile.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((c) => (
                    <TableRow
                      key={c.id}
                      className="hover:bg-slate-50/60 text-slate-700 transition"
                    >
                      <TableCell className="py-3 px-4 font-mono font-bold text-teal-800">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={13} className="text-teal-700 shrink-0" />
                          <span>{c.customerCode}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 font-bold text-slate-900">
                        <div>{c.name}</div>
                        {c.companyName && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            {c.companyName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-4 font-mono text-slate-600">
                        {c.trn ? (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                            {c.trn}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-slate-600">
                        <div className="font-semibold text-slate-800">
                          {c.contactPerson || c.phone || "—"}
                        </div>
                        {c.email && (
                          <div className="text-[10px] text-slate-400">
                            {c.email}
                          </div>
                        )}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-3 px-4 text-right font-mono font-semibold text-slate-700"
                      >
                        {formatNumber(c.creditLimit)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className={`py-3 px-4 text-right font-mono font-black text-xs ${
                          Number(c.currentBalance) > 0
                            ? "text-rose-700"
                            : "text-emerald-700"
                        }`}
                      >
                        {formatNumber(c.currentBalance)}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerId(c.id)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <FileText size={12} />
                          Statement
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modal for Creating Customer */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Add New Customer Profile"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateCustomer} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Customer Code"
                placeholder="Auto-generated if blank (e.g. CUST-001)"
                value={form.customerCode}
                onChange={(e) => setField("customerCode", e.target.value)}
                className="font-mono"
              />

              <Input
                label="Customer Name / Entity *"
                placeholder="Full Legal / Trading Name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Company / Organization Name"
                placeholder="Company LLC / Corporation"
                value={form.companyName}
                onChange={(e) => setField("companyName", e.target.value)}
              />

              <Input
                label="UAE VAT TRN (15 Digits)"
                placeholder="100XXXXXXXXX003"
                value={form.trn}
                onChange={(e) => setField("trn", e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Contact Person"
                placeholder="Managing Director / PM"
                value={form.contactPerson}
                onChange={(e) => setField("contactPerson", e.target.value)}
              />

              <Input
                label="Phone / Mobile"
                placeholder="+971 50 XXXXXXX"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="accounts@client.com"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Address / Site Location (UAE)"
                placeholder="Sheikh Zayed Rd, Dubai, UAE"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
              />

              <Input
                label="Credit Limit (AED)"
                type="number"
                step="0.01"
                placeholder="50000.00"
                value={form.creditLimit}
                onChange={(e) => setField("creditLimit", e.target.value)}
                className="font-mono"
              />
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
              <Button
                variant="primary"
                type="submit"
                disabled={createCustomerMutation.isPending}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
              >
                {createCustomerMutation.isPending
                  ? "Saving..."
                  : "Save Customer Record"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Statement of Account Modal */}
      {selectedCustomerId && statementData && (
        <Modal
          isOpen={!!selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
          title={`Statement of Account — ${statementData.customer.name}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">
                  Customer Profile
                </p>
                <p className="text-sm font-black text-slate-900">
                  {statementData.customer.name}
                </p>
                {statementData.customer.companyName && (
                  <p className="text-slate-600 font-medium">
                    {statementData.customer.companyName}
                  </p>
                )}
                <p className="text-slate-500 font-mono mt-0.5">
                  TRN: {statementData.customer.trn || "N/A"}
                </p>
              </div>

              <div className="text-right font-mono space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase">
                  Total Outstanding
                </p>
                <p className="text-xl font-black text-rose-700">
                  AED {formatNumber(statementData.summary.currentOutstanding)}
                </p>
                <p className="text-[11px] text-slate-500">
                  Billed: AED {formatNumber(statementData.summary.totalBilled)} | Paid: AED {formatNumber(statementData.summary.totalPaid)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <Table className="w-full text-xs">
                <TableHead className="bg-slate-100">
                  <TableRow>
                    <TableHeaderCell className="py-2.5 px-3">Date</TableHeaderCell>
                    <TableHeaderCell className="py-2.5 px-3">Doc #</TableHeaderCell>
                    <TableHeaderCell className="py-2.5 px-3">Type</TableHeaderCell>
                    <TableHeaderCell align="right" className="py-2.5 px-3 text-right">
                      Debit (Billed)
                    </TableHeaderCell>
                    <TableHeaderCell align="right" className="py-2.5 px-3 text-right">
                      Credit (Paid)
                    </TableHeaderCell>
                    <TableHeaderCell align="right" className="py-2.5 px-3 text-right">
                      Balance
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody className="divide-y divide-slate-100 font-medium">
                  {(statementData.statement || []).map((tx: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="py-2.5 px-3 font-mono">
                        {tx.date}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {tx.ref}
                      </TableCell>
                      <TableCell className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.type === "INVOICE"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : tx.type === "PAYMENT"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-sky-50 text-sky-800 border border-sky-200"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-2.5 px-3 text-right font-mono text-slate-700"
                      >
                        {tx.debit > 0 ? formatNumber(tx.debit) : "—"}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-2.5 px-3 text-right font-mono text-emerald-800"
                      >
                        {tx.credit > 0 ? formatNumber(tx.credit) : "—"}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="py-2.5 px-3 text-right font-mono font-black text-slate-900"
                      >
                        AED {formatNumber(tx.runningBalance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                icon={<Printer size={13} />}
                className="cursor-pointer"
              >
                Print Statement of Account
              </Button>
              <Button
                variant="dark"
                size="sm"
                onClick={() => setSelectedCustomerId(null)}
                className="cursor-pointer"
              >
                Close Statement
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
