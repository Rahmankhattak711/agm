import { getAuthUser, unauthorized } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId parameter is required" },
        { status: 400 },
      );
    }

    const currentYear = new Date().getFullYear();
    const defaultFromDateStr = `${currentYear}-01-01`;
    const defaultToDateStr = new Date().toISOString().slice(0, 10);

    const fromDateParam = searchParams.get("fromDate") || defaultFromDateStr;
    const toDateParam = searchParams.get("toDate") || defaultToDateStr;
    const projectId = searchParams.get("projectId") || null;
    const transactionType = searchParams.get("transactionType") || "ALL";
    const statusParam = searchParams.get("status") || "ALL";

    const fromDate = new Date(fromDateParam);
    const toDate = new Date(toDateParam);
    toDate.setHours(23, 59, 59, 999);

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    const nameMatchFilters = Array.from(
      new Set(
        [
          customer.name,
          customer.companyName,
          customer.customerCode,
          ...customer.name.split(" ").filter((w) => w.length > 2),
          ...(customer.companyName
            ? customer.companyName.split(" ").filter((w) => w.length > 2)
            : []),
        ].filter(Boolean) as string[],
      ),
    );

    const rawSalesInvoices = await prisma.salesInvoice.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          ...nameMatchFilters.map((name) => ({
            customerName: { contains: name, mode: "insensitive" as const },
          })),
          { salesOrder: { customerId: customer.id } },
        ],
      },
      include: {
        items: true,
        journalEntry: {
          select: {
            id: true,
            entryNumber: true,
            isPosted: true,
          },
        },
      },
      orderBy: { invoiceDate: "asc" },
    });

    const salesInvoicesMap = new Map<string, (typeof rawSalesInvoices)[0]>();
    rawSalesInvoices.forEach((inv) => salesInvoicesMap.set(inv.id, inv));
    const salesInvoices = Array.from(salesInvoicesMap.values());
    const invoiceIds = salesInvoices.map((i) => i.id);

    const rawCustomerPayments = await prisma.customerPayment.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          ...(invoiceIds.length > 0
            ? [{ salesInvoiceId: { in: invoiceIds } }]
            : []),
          ...nameMatchFilters.map((name) => ({
            customerName: { contains: name, mode: "insensitive" as const },
          })),
        ],
      },
      include: {
        salesInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            projectScope: true,
          },
        },
        journalEntry: {
          select: {
            id: true,
            entryNumber: true,
            isPosted: true,
          },
        },
      },
      orderBy: { paymentDate: "asc" },
    });

    const paymentsMap = new Map<string, (typeof rawCustomerPayments)[0]>();
    rawCustomerPayments.forEach((pmt) => paymentsMap.set(pmt.id, pmt));
    const customerPayments = Array.from(paymentsMap.values());

    const rawCreditNotes = await prisma.creditNote.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          ...(invoiceIds.length > 0
            ? [{ salesInvoiceId: { in: invoiceIds } }]
            : []),
          ...nameMatchFilters.map((name) => ({
            customerName: { contains: name, mode: "insensitive" as const },
          })),
        ],
      },
      include: {
        salesInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
            projectScope: true,
          },
        },
        journalEntry: {
          select: {
            id: true,
            entryNumber: true,
            isPosted: true,
          },
        },
      },
      orderBy: { returnDate: "asc" },
    });

    const creditNotesMap = new Map<string, (typeof rawCreditNotes)[0]>();
    rawCreditNotes.forEach((cn) => creditNotesMap.set(cn.id, cn));
    const creditNotes = Array.from(creditNotesMap.values());

    const rawQuotations = await prisma.quotation.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          ...nameMatchFilters.map((name) => ({
            customer: { contains: name, mode: "insensitive" as const },
          })),
        ],
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const rawSalesOrders = await prisma.salesOrder.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          ...nameMatchFilters.map((name) => ({
            customerName: { contains: name, mode: "insensitive" as const },
          })),
        ],
      },
      orderBy: { orderDate: "asc" },
    });

    const rawProjects = await prisma.project.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          ...nameMatchFilters.map((name) => ({
            name: { contains: name, mode: "insensitive" as const },
          })),
          { quotation: { customerId: customer.id } },
          { quotation: { customer: { in: nameMatchFilters } } },
        ],
      },
      select: {
        id: true,
        projectCode: true,
        name: true,
        description: true,
        location: true,
        status: true,
        contractValue: true,
        progressPct: true,
      },
    });

    interface ProjectDetailItem {
      id: string;
      projectCode: string;
      name: string;
      description?: string | null;
      location?: string | null;
      contractValue?: number;
      status?: string;
      progressPct?: number;
    }

    const projectsMap = new Map<string, ProjectDetailItem>();
    rawProjects.forEach((p) =>
      projectsMap.set(p.id, {
        id: p.id,
        projectCode: p.projectCode,
        name: p.name,
        description: p.description,
        location: p.location,
        status: p.status,
        contractValue: Number(p.contractValue || 0),
        progressPct: p.progressPct,
      }),
    );

    rawQuotations.forEach((q) => {
      const projKey = q.project?.trim();
      if (projKey && !projectsMap.has(projKey)) {
        projectsMap.set(projKey, {
          id: q.id,
          projectCode: q.quotationNo,
          name: q.project || "Fitout Scope",
          description: q.notes || `Quotation ${q.quotationNo}`,
          location: q.location || null,
          status: q.status,
          contractValue: Number(q.totalAmount || 0),
          progressPct: undefined,
        });
      }
    });

    rawSalesOrders.forEach((so) => {
      const projKey = so.projectScope?.trim();
      if (projKey && !projectsMap.has(projKey)) {
        projectsMap.set(projKey, {
          id: so.id,
          projectCode: so.orderNumber,
          name: so.projectScope || "Confirmed Project",
          description: `Sales Order ${so.orderNumber}`,
          location: null,
          status: so.status,
          contractValue: Number(so.totalAmount || 0),
          progressPct: undefined,
        });
      }
    });

    rawSalesInvoices.forEach((inv) => {
      const projKey = inv.projectScope?.trim();
      if (projKey && !projectsMap.has(projKey)) {
        projectsMap.set(projKey, {
          id: inv.id,
          projectCode: inv.invoiceNumber,
          name: inv.projectScope || "Fitout Invoice Scope",
          description: `Tax Invoice ${inv.invoiceNumber}`,
          location: null,
          status: inv.status,
          contractValue: Number(inv.totalAmount || 0),
          progressPct: undefined,
        });
      }
    });

    const projects = Array.from(projectsMap.values());

    let selectedProjectName: string | null = null;
    if (projectId) {
      const proj = projects.find(
        (p) =>
          p.id === projectId ||
          p.name === projectId ||
          p.projectCode === projectId,
      );
      if (proj) selectedProjectName = `${proj.projectCode} - ${proj.name}`;
    } else if (projects.length > 0) {
      selectedProjectName = projects.map((p) => p.name).join(", ");
    }

    type RawTxType =
      "INVOICE" | "PAYMENT" | "CREDIT_NOTE" | "QUOTATION" | "ORDER";
    interface RawEvent {
      id: string;
      date: Date;
      rawType: RawTxType;
      type:
        | "Sales Invoice"
        | "Customer Payment"
        | "Credit Note"
        | "Quotation"
        | "Sales Order";
      reference: string;
      description: string;
      projectScope?: string | null;
      status: string;
      dueDate?: string | null;
      debit: number;
      credit: number;
      documentId: string;
      journalEntry?: {
        id: string;
        entryNumber: string;
        isPosted: boolean;
      } | null;
      paymentMethod?: string | null;
      referenceNumber?: string | null;
      isCancelled: boolean;
    }

    const allEvents: RawEvent[] = [];
    const recordedRefs = new Set<string>();

    salesInvoices.forEach((inv) => {
      const isCancelled = inv.status === "CANCELLED";
      recordedRefs.add(inv.invoiceNumber);
      if (inv.quotationRef) recordedRefs.add(inv.quotationRef);

      allEvents.push({
        id: inv.id,
        date: new Date(inv.invoiceDate),
        rawType: "INVOICE",
        type: "Sales Invoice",
        reference: inv.invoiceNumber,
        description: `Tax Invoice - ${inv.projectScope || "Fitout Works & Services"}`,
        projectScope: inv.projectScope,
        status: inv.status,
        dueDate: inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : null,
        debit: isCancelled ? 0 : Number(inv.totalAmount),
        credit: 0,
        documentId: inv.id,
        journalEntry: inv.journalEntry,
        isCancelled,
      });
    });

    rawSalesOrders.forEach((so) => {
      if (recordedRefs.has(so.orderNumber) || so.status === "CANCELLED") return;
      recordedRefs.add(so.orderNumber);

      allEvents.push({
        id: so.id,
        date: new Date(so.orderDate || so.createdAt),
        rawType: "INVOICE",
        type: "Sales Invoice",
        reference: so.orderNumber,
        description: `Sales Order - ${so.projectScope || "Confirmed Fitout Contract"}`,
        projectScope: so.projectScope,
        status: so.status,
        dueDate: so.deliveryDate
          ? so.deliveryDate.toISOString().slice(0, 10)
          : null,
        debit: Number(so.totalAmount),
        credit: 0,
        documentId: so.id,
        isCancelled: false,
      });
    });

    rawQuotations.forEach((q) => {
      if (
        recordedRefs.has(q.quotationNo) ||
        q.status === "REJECTED" ||
        Number(q.totalAmount) === 0
      )
        return;
      recordedRefs.add(q.quotationNo);

      allEvents.push({
        id: q.id,
        date: new Date(q.createdAt),
        rawType: "INVOICE",
        type: "Sales Invoice",
        reference: q.quotationNo,
        description: `Quotation Scope - ${q.project || "Fitout Works Refurbishment"}`,
        projectScope: q.project,
        status: q.status,
        dueDate: null,
        debit: Number(q.totalAmount),
        credit: 0,
        documentId: q.id,
        isCancelled: false,
      });
    });

    customerPayments.forEach((pmt) => {
      allEvents.push({
        id: pmt.id,
        date: new Date(pmt.paymentDate),
        rawType: "PAYMENT",
        type: "Customer Payment",
        reference: pmt.receiptNumber,
        description: `Customer Receipt (${pmt.paymentMethod.replace(/_/g, " ")})${
          pmt.referenceNumber ? ` • Ref: ${pmt.referenceNumber}` : ""
        }${pmt.salesInvoice ? ` • Inv: ${pmt.salesInvoice.invoiceNumber}` : ""}`,
        projectScope: pmt.salesInvoice?.projectScope || null,
        status: "PAID",
        dueDate: null,
        debit: 0,
        credit: Number(pmt.amount),
        documentId: pmt.id,
        journalEntry: pmt.journalEntry,
        paymentMethod: pmt.paymentMethod,
        referenceNumber: pmt.referenceNumber,
        isCancelled: false,
      });
    });

    creditNotes.forEach((cn) => {
      const isCancelled = cn.status === "CANCELLED";
      allEvents.push({
        id: cn.id,
        date: new Date(cn.returnDate),
        rawType: "CREDIT_NOTE",
        type: "Credit Note",
        reference: cn.creditNoteNumber,
        description: `Credit Note - ${cn.reason || "Scope Reduction"}${
          cn.salesInvoice ? ` (Ref: ${cn.salesInvoice.invoiceNumber})` : ""
        }`,
        projectScope: cn.salesInvoice?.projectScope || null,
        status: cn.status,
        dueDate: null,
        debit: 0,
        credit: isCancelled ? 0 : Number(cn.totalAmount),
        documentId: cn.id,
        journalEntry: cn.journalEntry,
        isCancelled,
      });
    });

    allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

    let openingBalance = 0;
    const periodEvents: RawEvent[] = [];

    allEvents.forEach((evt) => {
      if (evt.isCancelled) return;

      if (evt.date < fromDate) {
        openingBalance += evt.debit - evt.credit;
      } else if (evt.date >= fromDate && evt.date <= toDate) {
        if (transactionType !== "ALL") {
          if (transactionType === "INVOICE" && evt.rawType !== "INVOICE")
            return;
          if (transactionType === "PAYMENT" && evt.rawType !== "PAYMENT")
            return;
          if (
            transactionType === "CREDIT_NOTE" &&
            evt.rawType !== "CREDIT_NOTE"
          )
            return;
        }

        if (statusParam === "POSTED" && !evt.journalEntry?.isPosted) {
          return;
        }

        periodEvents.push(evt);
      }
    });

    let currentBalance = openingBalance;
    const transactions = periodEvents.map((evt) => {
      currentBalance += evt.debit - evt.credit;
      return {
        id: evt.id,
        date: evt.date.toISOString().slice(0, 10),
        reference: evt.reference,
        rawType: evt.rawType,
        type: evt.type,
        description: evt.description,
        projectScope: evt.projectScope,
        debit: evt.debit,
        credit: evt.credit,
        balance: currentBalance,
        status: evt.status,
        dueDate: evt.dueDate,
        documentId: evt.documentId,
        journalEntry: evt.journalEntry,
        paymentMethod: evt.paymentMethod,
        referenceNumber: evt.referenceNumber,
      };
    });

    const totalInvoiced = periodEvents
      .filter((e) => e.rawType === "INVOICE" && !e.isCancelled)
      .reduce((s, e) => s + e.debit, 0);

    const totalPayments = periodEvents
      .filter((e) => e.rawType === "PAYMENT")
      .reduce((s, e) => s + e.credit, 0);

    const totalCreditNotes = periodEvents
      .filter((e) => e.rawType === "CREDIT_NOTE" && !e.isCancelled)
      .reduce((s, e) => s + e.credit, 0);

    const totalAdjustments = 0;
    const closingBalance = currentBalance;

    const now = new Date().getTime();
    let overdueAmount = 0;

    const outstandingInvoices: {
      id: string;
      invoiceNo: string;
      invoiceDate: string;
      dueDate: string | null;
      invoiceAmount: number;
      paid: number;
      creditNote: number;
      outstanding: number;
      status: "Paid" | "Partially Paid" | "Unpaid" | "Overdue";
      daysOverdue: number;
      projectScope?: string | null;
    }[] = [];

    let agingCurrent = 0;
    let agingDays1to30 = 0;
    let agingDays31to60 = 0;
    let agingDays61to90 = 0;
    let agingDays90Plus = 0;

    let countCurrent = 0;
    let countDays1to30 = 0;
    let countDays31to60 = 0;
    let countDays61to90 = 0;
    let countDays90Plus = 0;

    salesInvoices.forEach((inv) => {
      if (inv.status === "CANCELLED") return;

      const invTotal = Number(inv.totalAmount);
      const paid = Number(inv.paidAmount || 0);

      const appliedCredits = creditNotes
        .filter(
          (cn) => cn.salesInvoiceId === inv.id && cn.status !== "CANCELLED",
        )
        .reduce((sum, cn) => sum + Number(cn.totalAmount), 0);

      let outstanding = Number(inv.remainingBalance);
      if (isNaN(outstanding) || outstanding <= 0) {
        outstanding = Math.max(0, invTotal - paid - appliedCredits);
      }

      const invoiceDateStr = inv.invoiceDate.toISOString().slice(0, 10);
      const dueDateStr = inv.dueDate
        ? inv.dueDate.toISOString().slice(0, 10)
        : null;

      const dueOrInvoiceTime = inv.dueDate
        ? new Date(inv.dueDate).getTime()
        : new Date(inv.invoiceDate).getTime();

      const diffDays = Math.floor(
        (now - dueOrInvoiceTime) / (1000 * 60 * 60 * 24),
      );
      const isPastDue = diffDays > 0;

      let invoiceStatus: "Paid" | "Partially Paid" | "Unpaid" | "Overdue";
      if (outstanding <= 0.01) {
        invoiceStatus = "Paid";
      } else if (isPastDue) {
        invoiceStatus = "Overdue";
        overdueAmount += outstanding;
      } else if (paid > 0 || appliedCredits > 0) {
        invoiceStatus = "Partially Paid";
      } else {
        invoiceStatus = "Unpaid";
      }

      if (outstanding > 0.01) {
        if (diffDays <= 0) {
          agingCurrent += outstanding;
          countCurrent += 1;
        } else if (diffDays <= 30) {
          agingDays1to30 += outstanding;
          countDays1to30 += 1;
        } else if (diffDays <= 60) {
          agingDays31to60 += outstanding;
          countDays31to60 += 1;
        } else if (diffDays <= 90) {
          agingDays61to90 += outstanding;
          countDays61to90 += 1;
        } else {
          agingDays90Plus += outstanding;
          countDays90Plus += 1;
        }

        outstandingInvoices.push({
          id: inv.id,
          invoiceNo: inv.invoiceNumber,
          invoiceDate: invoiceDateStr,
          dueDate: dueDateStr,
          invoiceAmount: invTotal,
          paid,
          creditNote: appliedCredits,
          outstanding,
          status: invoiceStatus,
          daysOverdue: Math.max(0, diffDays),
          projectScope: inv.projectScope,
        });
      }
    });

    let arControlAccountBalance = 0;
    let customerArPostedBalance = 0;

    const arAccount = await prisma.chartOfAccount.findFirst({
      where: {
        OR: [
          { accountCode: "1200" },
          { accountName: { contains: "Receivable", mode: "insensitive" } },
        ],
      },
      include: {
        journalLines: {
          where: {
            journalEntry: {
              isPosted: true,
            },
          },
          select: {
            debit: true,
            credit: true,
            journalEntryId: true,
          },
        },
      },
    });

    if (arAccount) {
      arControlAccountBalance = arAccount.journalLines.reduce(
        (sum, line) => sum + Number(line.debit) - Number(line.credit),
        0,
      );

      const customerJournalIds = new Set<string>();
      salesInvoices.forEach((i) => {
        if (i.journalEntryId) customerJournalIds.add(i.journalEntryId);
      });
      customerPayments.forEach((p) => {
        if (p.journalEntryId) customerJournalIds.add(p.journalEntryId);
      });
      creditNotes.forEach((c) => {
        if (c.journalEntryId) customerJournalIds.add(c.journalEntryId);
      });

      customerArPostedBalance = arAccount.journalLines
        .filter((l) => customerJournalIds.has(l.journalEntryId))
        .reduce(
          (sum, line) => sum + Number(line.debit) - Number(line.credit),
          0,
        );
    }

    const lifetimeBilled = salesInvoices
      .filter((i) => i.status !== "CANCELLED")
      .reduce((s, i) => s + Number(i.totalAmount), 0);
    const lifetimePaid = customerPayments.reduce(
      (s, p) => s + Number(p.amount),
      0,
    );
    const lifetimeCredits = creditNotes
      .filter((c) => c.status !== "CANCELLED")
      .reduce((s, c) => s + Number(c.totalAmount), 0);

    const totalCustomerSoaBalance =
      lifetimeBilled - lifetimePaid - lifetimeCredits;
    const diff = Math.abs(totalCustomerSoaBalance - customerArPostedBalance);
    const isReconciled = diff < 0.05;

    const resolvedTrn =
      (customer as any).trn ||
      rawSalesInvoices.find((i) => i.customerTrn)?.customerTrn ||
      null;

    return NextResponse.json({
      customer: {
        id: customer.id,
        customerCode: customer.customerCode,
        name: customer.name,
        companyName: customer.companyName,
        trn: resolvedTrn,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        creditLimit: Number(customer.creditLimit || 0),
        currentBalance: totalCustomerSoaBalance,
      },
      period: {
        fromDate: fromDateParam,
        toDate: toDateParam,
        currency: "AED",
        projectName: selectedProjectName,
      },
      projects,
      openingBalance,
      transactions,
      totals: {
        invoices: totalInvoiced,
        payments: totalPayments,
        creditNotes: totalCreditNotes,
        adjustments: totalAdjustments,
        closingBalance,
        overdueAmount,
      },
      outstandingInvoices,
      aging: {
        current: agingCurrent,
        days1to30: agingDays1to30,
        days31to60: agingDays31to60,
        days61to90: agingDays61to90,
        days90Plus: agingDays90Plus,
        counts: {
          current: countCurrent,
          days1to30: countDays1to30,
          days31to60: countDays31to60,
          days61to90: countDays61to90,
          days90Plus: countDays90Plus,
        },
      },
      reconciliation: {
        customerSoaBalance: totalCustomerSoaBalance,
        arControlAccountBalance,
        customerArPostedBalance,
        status: isReconciled ? "Reconciled" : "Difference Found",
        difference: diff,
      },
    });
  } catch (error: any) {
    console.error("GET /api/reports/statement-of-account error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate Statement of Account" },
      { status: 500 },
    );
  }
}
