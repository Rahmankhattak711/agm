"use client";

import React, { useState, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { PlusIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { useCustomers, Customer } from "@/lib/hooks/api-hooks";
import {
  CustomerKpis,
  CustomerTable,
  CustomerFilterTab,
  CustomerCreateModal,
  CustomerStatementDocument,
} from "./components";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerFilterTab>("ALL");
  const { data: customers = [], isLoading, error } = useCustomers(search);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(
    null,
  );

  const [statementToPrint, setStatementToPrint] = useState<{
    customer: Customer;
    statement: any[];
    summary: {
      totalBilled: number;
      totalPaid: number;
      totalCredits: number;
      currentOutstanding: number;
    };
  } | null>(null);

  const printDocumentRef = useRef<HTMLDivElement>(null);

  const triggerPrint = useReactToPrint({
    contentRef: printDocumentRef,
    documentTitle: statementToPrint?.customer?.customerCode
      ? `Statement-${statementToPrint.customer.customerCode}`
      : "Customer-Statement-of-Account",
  });

  const handlePrintCustomer = async (
    customer: Customer,
    existingData?: {
      customer: Customer;
      statement: any[];
      summary: {
        totalBilled: number;
        totalPaid: number;
        totalCredits: number;
        currentOutstanding: number;
      };
    },
  ) => {
    if (existingData) {
      setStatementToPrint(existingData);
      setTimeout(() => {
        triggerPrint();
      }, 100);
      return;
    }
    try {
      const res = await fetch(
        `/api/commercial/customers/${customer.id}/statement`,
      );
      if (!res.ok) throw new Error("Failed to load customer statement");
      const data = await res.json();
      setStatementToPrint(data);
      setTimeout(() => {
        triggerPrint();
      }, 100);
    } catch (err: any) {
      alert(`Unable to print statement: ${err.message}`);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const bal = Number(c.currentBalance || 0);
      if (statusFilter === "OUTSTANDING") return bal > 0;
      if (statusFilter === "SETTLED") return bal <= 0;
      if (
        (statusFilter as any) === "TRN" ||
        (statusFilter as any) === "COMPANY"
      )
        return Boolean(c.companyName);
      return true;
    });
  }, [customers, statusFilter]);

  const totalReceivables = useMemo(
    () =>
      customers.reduce(
        (s, c) => s + Math.max(0, Number(c.currentBalance || 0)),
        0,
      ),
    [customers],
  );

  const totalCreditLimits = useMemo(
    () => customers.reduce((s, c) => s + Number(c.creditLimit || 0), 0),
    [customers],
  );

  const corporateCount = useMemo(
    () => customers.filter((c) => c.companyName).length,
    [customers],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Customers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage client profiles, credit limits, contact information, and
            real-time statements of account.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer flex-1 sm:flex-initial"
          >
            Add New Customer
          </Button>
        </div>
      </div>

      <CustomerKpis
        totalClients={customers.length}
        totalReceivables={totalReceivables}
        totalCreditLimits={totalCreditLimits}
        corporateCount={corporateCount}
      />

      <CustomerTable
        customers={filteredCustomers}
        isLoading={isLoading}
        error={error}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        expandedCustomerId={expandedCustomerId}
        onToggleExpand={(id) =>
          setExpandedCustomerId((prev) => (prev === id ? null : id))
        }
        onPrintCustomer={handlePrintCustomer}
      />

      <CustomerCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <div
        style={{
          position: "fixed",
          left: "-99999px",
          top: "-99999px",
          width: "210mm",
        }}
      >
        <div ref={printDocumentRef}>
          {statementToPrint && (
            <CustomerStatementDocument
              customer={statementToPrint.customer}
              statement={statementToPrint.statement}
              summary={statementToPrint.summary}
            />
          )}
        </div>
      </div>
    </div>
  );
}
