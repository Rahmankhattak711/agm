import { AccountDetailItem } from "./hooks/types";

export function getAccountTransactionDetails(
  acc: { id: string; accountCode?: string; accountName: string; type?: string },
  balance: number,
  lines: any[],
  invoices: any[],
  payments: any[],
  bills: any[],
  expenses: any[],
  projects: any[],
  std?: any,
): AccountDetailItem[] {
  const details: AccountDetailItem[] = [];
  const journalLines = (lines || []).filter((l) => l.accountId === acc.id);

  for (const jl of journalLines) {
    const d = Number(jl.debit || 0);
    const c = Number(jl.credit || 0);
    details.push({
      id: jl.id,
      date: jl.journalEntry?.entryDate
        ? new Date(jl.journalEntry.entryDate).toISOString().split("T")[0]
        : "-",
      reference: jl.journalEntry?.entryNumber || "-",
      description:
        jl.description || jl.journalEntry?.narration || acc.accountName,
      partyName: "-",
      debit: d,
      credit: c,
      amount: acc.type === "ASSET" || acc.type === "EXPENSE" ? d - c : c - d,
    });
  }

  if (details.length === 0) {
    const code = acc.accountCode || "";
    const name = (acc.accountName || "").toLowerCase();

    if (
      acc.id === std?.ar?.id ||
      code === "1200" ||
      name.includes("receivable")
    ) {
      for (const inv of invoices || []) {
        const tot = Number(inv.totalAmount || 0);
        const pd = Number(inv.paidAmount || 0);
        details.push({
          id: inv.id,
          date: inv.invoiceDate
            ? new Date(inv.invoiceDate).toISOString().split("T")[0]
            : "-",
          reference: inv.invoiceNumber,
          description: `Sales Invoice (${inv.status || "OPEN"})`,
          partyName:
            inv.customerRel?.name || inv.customerRel?.companyName || "-",
          debit: tot,
          credit: pd,
          amount: Math.max(0, tot - pd),
        });
      }
    } else if (
      acc.id === std?.ap?.id ||
      code === "2000" ||
      name.includes("payable")
    ) {
      for (const b of bills || []) {
        const tot = Number(b.totalAmount || 0);
        details.push({
          id: b.id,
          date: b.billDate
            ? new Date(b.billDate).toISOString().split("T")[0]
            : "-",
          reference: b.billNumber,
          description: `Supplier Bill (${b.status || "OPEN"})`,
          partyName: b.supplier?.name || "-",
          debit: 0,
          credit: tot,
          amount: tot,
        });
      }
    } else if (
      acc.id === std?.bank?.id ||
      code === "1020" ||
      code === "1010" ||
      name.includes("bank") ||
      name.includes("cash")
    ) {
      for (const p of payments || []) {
        const amt = Number(p.amount || 0);
        details.push({
          id: p.id,
          date: p.paymentDate
            ? new Date(p.paymentDate).toISOString().split("T")[0]
            : "-",
          reference: p.receiptNumber || "Payment Receipt",
          description: `Customer Receipt (${p.paymentMethod || "Bank Transfer"})`,
          partyName: p.customerRel?.name || p.customerRel?.companyName || "-",
          debit: amt,
          credit: 0,
          amount: amt,
        });
      }
      for (const e of expenses || []) {
        const amt = Number(e.amount || 0);
        details.push({
          id: e.id,
          date: e.expenseDate
            ? new Date(e.expenseDate).toISOString().split("T")[0]
            : "-",
          reference: e.expenseNumber || e.reference || "Expense",
          description: e.description || e.category || "Operational Expense",
          partyName: e.payee || "-",
          debit: 0,
          credit: amt,
          amount: -amt,
        });
      }
    } else if (
      acc.id === std?.outputVat?.id ||
      code === "2210" ||
      name.includes("vat output")
    ) {
      for (const inv of invoices || []) {
        const vat = Number(inv.vatAmount || 0);
        if (vat > 0) {
          details.push({
            id: inv.id,
            date: inv.invoiceDate
              ? new Date(inv.invoiceDate).toISOString().split("T")[0]
              : "-",
            reference: inv.invoiceNumber,
            description: `VAT Output (5%) on ${inv.invoiceNumber}`,
            partyName:
              inv.customerRel?.name || inv.customerRel?.companyName || "-",
            debit: 0,
            credit: vat,
            amount: vat,
          });
        }
      }
    } else if (
      acc.id === std?.inputVat?.id ||
      code === "1210" ||
      name.includes("vat input")
    ) {
      for (const b of bills || []) {
        const vat = Number(b.vatAmount || 0);
        if (vat > 0) {
          details.push({
            id: b.id,
            date: b.billDate
              ? new Date(b.billDate).toISOString().split("T")[0]
              : "-",
            reference: b.billNumber,
            description: `Input Tax Credit (5%) on ${b.billNumber}`,
            partyName: b.supplier?.name || "-",
            debit: vat,
            credit: 0,
            amount: vat,
          });
        }
      }
    } else if (
      acc.type === "REVENUE" ||
      acc.id === std?.salesRevenue?.id ||
      code.startsWith("4") ||
      name.includes("revenue") ||
      name.includes("sales")
    ) {
      for (const inv of invoices || []) {
        const sub = Number(inv.subtotal || 0);
        details.push({
          id: inv.id,
          date: inv.invoiceDate
            ? new Date(inv.invoiceDate).toISOString().split("T")[0]
            : "-",
          reference: inv.invoiceNumber,
          description: `Contract Revenue (${inv.status || "OPEN"})`,
          partyName:
            inv.customerRel?.name || inv.customerRel?.companyName || "-",
          debit: 0,
          credit: sub,
          amount: sub,
        });
      }
    } else if (
      acc.type === "EXPENSE" ||
      code.startsWith("5") ||
      code.startsWith("6") ||
      name.includes("expense") ||
      name.includes("material") ||
      name.includes("cost")
    ) {
      for (const pr of projects || []) {
        for (const c of pr.costs || []) {
          const amt = Number(c.amount || 0);
          details.push({
            id: c.id,
            date: c.date ? new Date(c.date).toISOString().split("T")[0] : "-",
            reference: c.reference || pr.projectCode,
            description: `${pr.name}: ${c.description} [${c.costType}]`,
            partyName: pr.customer?.name || "-",
            debit: amt,
            credit: 0,
            amount: amt,
          });
        }
      }
      for (const e of expenses || []) {
        const amt = Number(e.amount || 0);
        details.push({
          id: e.id,
          date: e.expenseDate
            ? new Date(e.expenseDate).toISOString().split("T")[0]
            : "-",
          reference: e.expenseNumber || e.reference || "Expense",
          description: e.description || e.category || "Operational Expense",
          partyName: e.payee || "-",
          debit: amt,
          credit: 0,
          amount: amt,
        });
      }
      for (const b of bills || []) {
        const sub = Number(b.subtotal || 0);
        details.push({
          id: `bill-${b.id}`,
          date: b.billDate
            ? new Date(b.billDate).toISOString().split("T")[0]
            : "-",
          reference: b.billNumber,
          description: `Direct Supplier Bill: ${b.supplier?.name || "Supplier"}`,
          partyName: b.supplier?.name || "-",
          debit: sub,
          credit: 0,
          amount: sub,
        });
      }
    } else if (
      acc.type === "ASSET" ||
      code.startsWith("15") ||
      name.includes("machinery") ||
      name.includes("furniture") ||
      name.includes("equipment") ||
      name.includes("vehicle")
    ) {
      if (balance > 0) {
        details.push({
          id: `fixed-asset-${acc.id}`,
          date: "-",
          reference: acc.accountCode || "ASSET",
          description: `${acc.accountName} (Historical Capital Asset)`,
          partyName: "-",
          debit: balance,
          credit: 0,
          amount: balance,
        });
      }
    } else if (
      acc.type === "EQUITY" ||
      code.startsWith("3") ||
      name.includes("capital") ||
      name.includes("equity")
    ) {
      if (balance > 0) {
        details.push({
          id: `equity-${acc.id}`,
          date: "-",
          reference: acc.accountCode || "EQUITY",
          description: `${acc.accountName} (Equity & Retained Position)`,
          partyName: "-",
          debit: 0,
          credit: balance,
          amount: balance,
        });
      }
    }
  }

  return details;
}
