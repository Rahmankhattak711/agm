"use client";

import React, { useCallback, useMemo, useState } from "react";
import { FileText, Mail, Phone, Plus, Printer, Search } from "lucide-react";
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
  const { data: customers = [], isLoading } = useCustomers(search);
  const createCustomerMutation = useCreateCustomer();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );

  const { data: statementData } = useCustomerStatement(selectedCustomerId);

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

  const totalReceivables = useMemo(
    () => customers.reduce((s, c) => s + Number(c.currentBalance), 0),
    [customers],
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 print:p-0 print:m-0">
      <div className="hidden print:block mb-6">
        <QuotationHeader />
        <div className="px-10 pt-4 pb-2 border-b border-slate-200 flex justify-between items-end">
          <div>
            <h1 className="text-lg font-black text-slate-900 uppercase">
              Customer Directory & Master Ledger
            </h1>
            <p className="text-xs text-slate-500">
              AGM FITOUT TECHNICAL SERVICES LLC — Client Profiles, TRN &
              Receivables Balances
            </p>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Printed: {new Date().toLocaleDateString("en-GB")}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Customer Directory & Statements
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
              Commercial Master Data
            </span>
          </div>
          <p className="text-xs text-slate-500">
            AGM FITOUT TECHNICAL SERVICES LLC — Comprehensive client database,
            credit limit controls, <br /> and real-time Statement of Account
            ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus size={14} />}
          >
            Add New Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
        <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
            Total Active Customers
          </p>
          <p className="text-xl font-black text-sky-950 font-mono">
            {customers.length} Accounts
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
            Total Outstanding Receivables
          </p>
          <p className="text-xl font-black text-rose-950 font-mono">
            AED{" "}
            {totalReceivables.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Statement of Account
          </p>
          <p className="text-xl font-black text-emerald-950 font-mono">
            Real-Time Double Entry
          </p>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <Input
          leftIcon={<Search size={15} />}
          placeholder="Search customer name, company, code, TRN, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-none bg-slate-50 focus:bg-white"
        />
      </div>

      <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm bg-white">
        <Table>
          <TableHead className="bg-slate-50/95 border-b border-slate-200">
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Customer Code
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Customer / Company
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              TRN (UAE VAT)
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">
              Contact / Phone
            </TableHeaderCell>
            <TableHeaderCell
              align="right"
              className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-[11px]"
            >
              Credit Limit (AED)
            </TableHeaderCell>
            <TableHeaderCell
              align="right"
              className="py-3 px-4 text-right font-bold text-slate-600 uppercase text-[11px]"
            >
              Outstanding (AED)
            </TableHeaderCell>
            <TableHeaderCell className="py-3 px-4 text-center font-bold text-slate-600 uppercase text-[11px] print:hidden">
              Statement
            </TableHeaderCell>
          </TableHead>

          <TableBody className="divide-y divide-slate-100">
            {isLoading ? (
              <TableLoading
                colSpan={7}
                message="Loading customer directory..."
              />
            ) : customers.length === 0 ? (
              <TableEmpty
                colSpan={7}
                title="No customers found"
                message='Click "Add New Customer" above to create your first customer.'
              />
            ) : (
              customers.map((c) => (
                <TableRow
                  key={c.id}
                  className="hover:bg-slate-50/60 text-slate-700 transition"
                >
                  <TableCell className="py-3 px-4 font-mono font-bold text-sky-950">
                    {c.customerCode}
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
                    {c.trn || "—"}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-slate-600">
                    <div>{c.contactPerson || c.phone || "—"}</div>
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
                    AED{" "}
                    {Number(c.creditLimit).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell
                    align="right"
                    className={`py-3 px-4 text-right font-mono font-black ${
                      Number(c.currentBalance) > 0
                        ? "text-rose-700"
                        : "text-emerald-700"
                    }`}
                  >
                    AED{" "}
                    {Number(c.currentBalance).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-center print:hidden">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => setSelectedCustomerId(c.id)}
                      icon={<FileText size={12} />}
                    >
                      Statement
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="lg"
                type="button"
                onClick={handleCloseCreate}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="lg"
                type="submit"
                disabled={createCustomerMutation.isPending}
              >
                {createCustomerMutation.isPending
                  ? "Saving..."
                  : "Save Customer Record"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

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
                  AED{" "}
                  {statementData.summary.currentOutstanding.toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2 },
                  )}
                </p>
                <p className="text-[11px] text-slate-500">
                  Billed: AED{" "}
                  {statementData.summary.totalBilled.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}{" "}
                  | Paid: AED{" "}
                  {statementData.summary.totalPaid.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <Table>
                <TableHead className="bg-slate-100">
                  <TableHeaderCell className="py-2.5 px-3">
                    Date
                  </TableHeaderCell>
                  <TableHeaderCell className="py-2.5 px-3">
                    Doc #
                  </TableHeaderCell>
                  <TableHeaderCell className="py-2.5 px-3">
                    Type
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-2.5 px-3 text-right"
                  >
                    Debit (Billed)
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-2.5 px-3 text-right"
                  >
                    Credit (Paid)
                  </TableHeaderCell>
                  <TableHeaderCell
                    align="right"
                    className="py-2.5 px-3 text-right"
                  >
                    Balance
                  </TableHeaderCell>
                </TableHead>
                <TableBody className="divide-y divide-slate-100">
                  {(statementData.statement || []).map(
                    (tx: any, idx: number) => (
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
                                ? "bg-amber-100 text-amber-800"
                                : tx.type === "PAYMENT"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {tx.type}
                          </span>
                        </TableCell>
                        <TableCell
                          align="right"
                          className="py-2.5 px-3 text-right font-mono text-slate-700"
                        >
                          {tx.debit > 0
                            ? `AED ${tx.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : "—"}
                        </TableCell>
                        <TableCell
                          align="right"
                          className="py-2.5 px-3 text-right font-mono text-emerald-700"
                        >
                          {tx.credit > 0
                            ? `AED ${tx.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : "—"}
                        </TableCell>
                        <TableCell
                          align="right"
                          className="py-2.5 px-3 text-right font-mono font-bold text-slate-900"
                        >
                          AED{" "}
                          {tx.runningBalance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                icon={<Printer size={13} />}
              >
                Print Statement of Account
              </Button>
              <Button
                variant="dark"
                size="sm"
                onClick={() => setSelectedCustomerId(null)}
              >
                Close Statement
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <div className="hidden print:block">
        <QuotationFooter />
      </div>
    </div>
  );
}
