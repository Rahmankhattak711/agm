import { sumBy } from "@/lib/utils/math";

export interface MatchableInvoice {
  invoiceNumber: string;
  customerName: string | null;
  quotationRef: string | null;
  projectScope: string | null;
  subtotal: unknown;
  vatRate?: unknown;
  vatAmount?: unknown;
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
  quotation?: {
    quotationNo?: string | null;
    totalAmount?: unknown;
    vatPct?: unknown;
    vatAmount?: unknown;
  } | null;
}

export const INVOICE_MATCH_SELECT = {
  invoiceNumber: true,
  customerId: true,
  customerName: true,
  quotationRef: true,
  projectScope: true,
  subtotal: true,
  vatRate: true,
  vatAmount: true,
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
      (inv) =>
        inv.projectScope && inv.projectScope.trim().toLowerCase() === pClean,
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
          inv.customerName.toLowerCase() ===
            project.customer.name.toLowerCase());
      return scopeMatch && custMatch;
    });
  }

  const quoteNo = project.quotation?.quotationNo?.toLowerCase();
  const quoteRefMatch =
    project.name.match(/\((AGM-QTN-[^)]+|QTN-[^)]+)\)/i) ||
    project.description?.match(/(AGM-QTN-[\w-]+|QTN-[\w-]+)/i);
  const extractedQuoteRef = quoteRefMatch
    ? quoteRefMatch[1].toLowerCase()
    : null;

  if (!match && (quoteNo || extractedQuoteRef)) {
    const targetRef = quoteNo || extractedQuoteRef;
    match = invoices.find(
      (inv) => inv.quotationRef && inv.quotationRef.toLowerCase() === targetRef,
    );
  }

  return match;
}

export function resolveProjectValues(
  project: MatchableProject,
  invoices: MatchableInvoice[],
) {
  const inv = findMatchingInvoice(project, invoices);
  const invTotal =
    inv && Number(inv.totalAmount || 0) > 0 ? Number(inv.totalAmount) : 0;
  const itemsSum = inv ? sumBy(inv.items, (i) => i.totalAmount) : 0;
  const matchedInvAmount =
    invTotal ||
    (inv && Number(inv.subtotal || 0) > 0 ? Number(inv.subtotal) : 0) ||
    itemsSum;

  const contractValue =
    matchedInvAmount ||
    (project.contractValue !== undefined &&
    project.contractValue !== null &&
    Number(project.contractValue) > 0
      ? Number(project.contractValue)
      : 0) ||
    Number(project.budget || project.quotation?.totalAmount || 0);

  const budget =
    matchedInvAmount ||
    (project.budget !== undefined &&
    project.budget !== null &&
    Number(project.budget) > 0
      ? Number(project.budget)
      : 0) ||
    contractValue;

  const vatRate =
    inv?.vatRate !== undefined && inv?.vatRate !== null
      ? Number(inv.vatRate)
      : project.quotation?.vatPct !== undefined &&
          project.quotation?.vatPct !== null
        ? Number(project.quotation.vatPct)
        : inv && Number(inv.vatAmount || 0) > 0
          ? 5
          : 0;

  const vatAmount =
    inv?.vatAmount !== undefined && inv?.vatAmount !== null
      ? Number(inv.vatAmount)
      : project.quotation?.vatAmount !== undefined &&
          project.quotation?.vatAmount !== null
        ? Number(project.quotation.vatAmount)
        : 0;

  const invoiceNumber = inv?.invoiceNumber || null;

  return { contractValue, budget, vatRate, vatAmount, invoiceNumber };
}
