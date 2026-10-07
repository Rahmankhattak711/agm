"use client";

import React, { useState, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { PlusIcon } from "@/components/icons";
import { Button, PageHeader } from "@/components/ui";
import { useConfirm } from "@/context/ConfirmContext";
import { toast } from "@/lib/toast";
import {
  useCustomers,
  useDeleteCustomer,
  Customer,
} from "@/lib/hooks/api-hooks";
import {
  CustomerKpis,
  CustomerTable,
  CustomerFilterTab,
  CustomerCreateModal,
  CustomerEditModal,
  CustomerStatementDocument,
} from "./components";

export default function CustomersPage() {
  const { confirm } = useConfirm();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerFilterTab>("ALL");
  const { data: customers = [], isLoading, error } = useCustomers(search);
  const deleteCustomerMutation = useDeleteCustomer();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
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
      toast.error(`Unable to print statement: ${err.message}`);
    }
  };

  const handleOpenEdit = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsEditOpen(true);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    const isConfirmed = await confirm({
      title: "Delete Customer",
      message: `Are you sure you want to delete customer "${customer.name}" (${customer.customerCode})?`,
      variant: "danger",
      confirmText: "Delete Customer",
    });
    if (isConfirmed) {
      try {
        const res = await deleteCustomerMutation.mutateAsync(customer.id);
        toast.success(
          res.message || `Customer "${customer.name}" deleted successfully.`,
        );
        if (expandedCustomerId === customer.id) {
          setExpandedCustomerId(null);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to delete customer");
      }
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
      <PageHeader
        title="Customers"
        description="Manage client profiles, credit limits, contact information, and real-time statements of account."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            icon={<PlusIcon size={14} strokeWidth={2.5} />}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold text-xs shadow-xs cursor-pointer flex-1 sm:flex-initial"
          >
            Add New Customer
          </Button>
        }
      />

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
        onEditCustomer={handleOpenEdit}
        onDeleteCustomer={handleDeleteCustomer}
      />

      <CustomerCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <CustomerEditModal
        isOpen={isEditOpen}
        customer={customerToEdit}
        onClose={() => {
          setIsEditOpen(false);
          setCustomerToEdit(null);
        }}
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
