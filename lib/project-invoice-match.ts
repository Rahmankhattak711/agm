import { sumBy } from "@/lib/utils/math";

export interface MatchableInvoice {
  invoiceNumber: string;
  customerName: string | null;
  quotationRef: string | null;
  projectScope: string | null;
  subtotal: unknown;
  totalAmount: unknown;
  items?: { totalAmount: unknown }[];
}

export interface MatchableProject {
  name: string;
  projectCode: string;
  description: string | null;
  contractValue: unknown;
  budget: unknown;
  customer?: { name: string } | null;
  quotation?: { quotationNo?: string | null; totalAmount?: unknown } | null;
}

export const INVOICE_MATCH_SELECT = {
  invoiceNumber: true,
  customerId: true,
  customerName: true,
  quotationRef: true,
  projectScope: true,
  subtotal: true,
  totalAmount: true,
  items: { select: { totalAmount: true } },
} as const;

export const cleanProjName = (name: string) =>
  name
    .replace(/\s*\((AGM-QTN-[^)]+|QTN-[^)]+)\)\s*/i, "")
    .trim()
    .toLowerCase();

export function findMatchingInvoice<I extends MatchableInvoice>(
  project: MatchableProject,
  invoices: I[],
): I | undefined {
  const pClean = cleanProjName(project.name);
  const projNum = project.projectCode.match(/\d+$/)?.[0];

  let match = invoices.find((inv) => {
    if (project.description && project.description.includes(inv.invoiceNumber))
      return true;
    const invNum = inv.invoiceNumber.match(/\d+$/)?.[0];
    return Boolean(projNum && invNum && projNum === invNum);
  });

  if (!match && pClean) {
    match = invoices.find(
      (inv) => inv.projectScope && inv.projectScope.trim().toLowerCase() === pClean,
    );
  }

  if (!match && pClean) {
    match = invoices.find((inv) => {
      if (!inv.projectScope) return false;
      const invScope = inv.projectScope.trim().toLowerCase();
      const scopeMatch = invScope.includes(pClean) || pClean.includes(invScope);
      const custMatch =
        !project.customer?.name ||
        (inv.customerName &&
          inv.customerName.toLowerCase() === project.customer.name.toLowerCase());
      return scopeMatch && custMatch;
    });
  }

  const quoteNo = project.quotation?.quotationNo?.toLowerCase();
  if (!match && quoteNo) {
    match = invoices.find((inv) => inv.quotationRef?.toLowerCase() === quoteNo);
  }

  return match;
}

export function resolveProjectValues(
  project: MatchableProject,
  invoices: MatchableInvoice[],
) {
  const inv = findMatchingInvoice(project, invoices);
  const itemsSum = inv ? sumBy(inv.items, (i) => i.totalAmount) : 0;
  const matchedInvAmount =
    itemsSum || (inv ? Number(inv.subtotal || inv.totalAmount) : 0);
  const contractValue =
    matchedInvAmount ||
    Number(
      project.contractValue ||
        project.budget ||
        project.quotation?.totalAmount ||
        0,
    );
  const budget = matchedInvAmount || Number(project.budget || contractValue || 0);
  return { contractValue, budget };
}
