"use client";

import React from "react";
import { Customer } from "@/lib/hooks/api-hooks";
import { StatementOfAccountDocument } from "@/components/documents/StatementOfAccountDocument";
import { StatementOfAccountData } from "@/lib/hooks/types";

export interface CustomerStatementDocumentProps {
  customer: Customer;
  statement: any[];
  summary: {
    totalBilled: number;
    totalPaid: number;
    totalCredits: number;
    currentOutstanding: number;
  };
}

export const CustomerStatementDocument: React.FC<
  CustomerStatementDocumentProps
> = ({ customer, statement = [], summary }) => {
  const currentYear = new Date().getFullYear();
  const fromDate = `${currentYear}-01-01`;
  const toDate = new Date().toISOString().slice(0, 10);

  const formattedTransactions = statement.map((tx: any, idx: number) => ({
    id: tx.id || `tx-${idx}`,
    date: tx.date || "",
    reference: tx.reference || tx.ref || "—",
    rawType: (tx.type || "INVOICE") as "INVOICE" | "PAYMENT" | "CREDIT_NOTE",
    type: (tx.type === "PAYMENT"
      ? "Customer Payment"
      : tx.type === "CREDIT_NOTE"
      ? "Credit Note"
      : "Sales Invoice") as "Sales Invoice" | "Customer Payment" | "Credit Note",
    description: tx.description || "",
    debit: Number(tx.debit || 0),
    credit: Number(tx.credit || 0),
    balance: Number(tx.runningBalance || tx.balance || 0),
    status: tx.status || "POSTED",
    dueDate: tx.dueDate || null,
    documentId: tx.documentId || "",
  }));

  const soaData: StatementOfAccountData = {
    customer: {
      id: customer.id,
      customerCode: customer.customerCode,
      name: customer.name,
      companyName: customer.companyName || null,
      trn: customer.trn || null,
      phone: customer.phone || null,
      email: customer.email || null,
      address: customer.address || null,
      creditLimit: Number(customer.creditLimit || 0),
      currentBalance: Number(summary?.currentOutstanding || customer.currentBalance || 0),
    },
    period: {
      fromDate,
      toDate,
      currency: "AED",
    },
    openingBalance: 0,
    transactions: formattedTransactions,
    totals: {
      invoices: Number(summary?.totalBilled || 0),
      payments: Number(summary?.totalPaid || 0),
      creditNotes: Number(summary?.totalCredits || 0),
      adjustments: 0,
      closingBalance: Number(summary?.currentOutstanding || 0),
      overdueAmount: 0,
    },
    outstandingInvoices: [],
    aging: {
      current: Number(summary?.currentOutstanding || 0),
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      days90Plus: 0,
      counts: {
        current: 0,
        days1to30: 0,
        days31to60: 0,
        days61to90: 0,
        days90Plus: 0,
      },
    },
    reconciliation: {
      customerSoaBalance: Number(summary?.currentOutstanding || 0),
      arControlAccountBalance: 0,
      customerArPostedBalance: Number(summary?.currentOutstanding || 0),
      status: "Reconciled",
      difference: 0,
    },
  };

  return <StatementOfAccountDocument data={soaData} />;
};

export default CustomerStatementDocument;
