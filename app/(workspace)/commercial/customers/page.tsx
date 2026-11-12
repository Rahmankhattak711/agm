"use client";

import React, { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { ArrowLeft, Users, Plus } from "lucide-react";
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
import { formatPdfDocumentTitle } from "@/lib/utils/format";

export default function CustomersPage() {
  const router = useRouter();
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
    documentTitle: formatPdfDocumentTitle(
      [
        "Statement",
        statementToPrint?.customer?.customerCode,
        statementToPrint?.customer?.name ||
          statementToPrint?.customer?.companyName,
      ],
      "Customer-Statement-of-Account",
    ),
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
    <div className="space-y-4">
      {/* ══════════ 1. EXECUTIVE COMPACT HEADER ══════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/commercial");
              }
            }}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-[#f8fafc] transition-colors shadow-2xs cursor-pointer flex items-center justify-center shrink-0"
            style={{ border: "1px solid #cbd5e1" }}
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
            }}
          >
            <Users className="w-4 h-4" style={{ color: "#1d4ed8" }} />
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Customers
            </h1>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: "#f1f5f9",
                color: "#475569",
              }}
            >
              {customers.length} records
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            style={{ backgroundColor: "#1d4ed8" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#1e40af")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#1d4ed8")
            }
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Customer</span>
          </button>
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
