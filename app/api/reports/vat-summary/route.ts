import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

const MONTH_NAMES = [
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
  "JANUARY",
];

export async function GET() {
  try {
    const [sums, vatEntries, allLines] = await Promise.all([
      prisma.vatEntry.groupBy({
        by: ["vatType"],
        _sum: { vatAmount: true, taxableAmount: true },
      }),
      prisma.vatEntry.findMany({
        include: {
          vatRate: true,
          journalEntryLine: {
            include: {
              account: true,
              journalEntry: true,
            },
          },
        },
      }),
      prisma.journalEntryLine.findMany({
        include: {
          account: true,
          journalEntry: true,
          vatEntry: true,
        },
      }),
    ]);

    // Monthly accumulators
    const monthlyData: Record<
      string,
      {
        purchaseTaxable: number;
        purchaseNonVat: number;
        purchaseVat: number;
        incomeTaxable: number;
        incomeNonVat: number;
        incomeVat: number;
      }
    > = {};

    for (const m of MONTH_NAMES) {
      monthlyData[m] = {
        purchaseTaxable: 0,
        purchaseNonVat: 0,
        purchaseVat: 0,
        incomeTaxable: 0,
        incomeNonVat: 0,
        incomeVat: 0,
      };
    }

    // Populate from journal lines
    for (const l of allLines) {
      const entryDate = l.journalEntry?.entryDate
        ? new Date(l.journalEntry.entryDate)
        : null;
      if (!entryDate) continue;

      const mIdx = entryDate.getMonth(); // 0 = Jan, 1 = Feb...
      const mName = [
        "JANUARY",
        "FEBRUARY",
        "MARCH",
        "APRIL",
        "MAY",
        "JUNE",
        "JULY",
        "AUGUST",
        "SEPTEMBER",
        "OCTOBER",
        "NOVEMBER",
        "DECEMBER",
      ][mIdx];

      if (!monthlyData[mName]) continue;

      const type = l.account?.type;
      const debit = Number(l.debit || 0);
      const credit = Number(l.credit || 0);
      const vatEntry = l.vatEntry;

      if (vatEntry) {
        const vatAmt = Number(vatEntry.vatAmount || 0);
        const taxableAmt = Number(
          vatEntry.taxableAmount || (vatAmt > 0 ? vatAmt / 0.05 : 0),
        );

        if (vatEntry.vatType === "INPUT") {
          monthlyData[mName].purchaseTaxable += taxableAmt;
          monthlyData[mName].purchaseVat += vatAmt;
        } else if (vatEntry.vatType === "OUTPUT") {
          monthlyData[mName].incomeTaxable += taxableAmt;
          monthlyData[mName].incomeVat += vatAmt;
        }
      } else {
        // Non-VAT lines
        if (type === "EXPENSE" && debit > 0) {
          monthlyData[mName].purchaseNonVat += debit;
        } else if (type === "REVENUE" && credit > 0) {
          monthlyData[mName].incomeNonVat += credit;
        }
      }
    }

    // Monthly Purchase Breakdown
    const monthlyPurchases = MONTH_NAMES.map((m) => {
      const d = monthlyData[m];
      return {
        month: m,
        taxableAmount: d.purchaseTaxable,
        nonVatAmount: d.purchaseNonVat,
        vatAmount: d.purchaseVat,
        totalAmount: d.purchaseTaxable + d.purchaseNonVat + d.purchaseVat,
      };
    });

    // Monthly Income Breakdown
    const monthlyIncome = MONTH_NAMES.map((m) => {
      const d = monthlyData[m];
      return {
        month: m,
        taxableAmount: d.incomeTaxable,
        nonVatAmount: d.incomeNonVat,
        vatAmount: d.incomeVat,
        totalAmount: d.incomeTaxable + d.incomeNonVat + d.incomeVat,
      };
    });

    // Monthly Net Summary
    const monthlyNet = MONTH_NAMES.map((m) => {
      const d = monthlyData[m];
      const inVat = d.purchaseVat;
      const outVat = d.incomeVat;
      return {
        month: m,
        inputVat: inVat,
        outputVat: outVat,
        netVat: outVat - inVat,
      };
    });

    // Quarters
    const q1Months = ["FEBRUARY", "MARCH", "APRIL"];
    const q2Months = ["MAY", "JUNE", "JULY"];
    const q3Months = ["AUGUST", "SEPTEMBER", "OCTOBER"];
    const q4Months = ["NOVEMBER", "DECEMBER", "JANUARY"];

    const calcQuarter = (title: string, months: string[]) => {
      const inVat = months.reduce((s, m) => s + monthlyData[m].purchaseVat, 0);
      const outVat = months.reduce((s, m) => s + monthlyData[m].incomeVat, 0);
      const netVat = outVat - inVat;
      return {
        quarter: title,
        vatRate: "5%",
        inputVat: inVat,
        outputVat: outVat,
        netVat,
        position: netVat >= 0 ? "VAT Payable" : "VAT Receivable",
        status: netVat > 0 ? "Paid" : "Pending",
      };
    };

    const quarters = [
      calcQuarter("Feb,Mar,Apr-(1st)", q1Months),
      calcQuarter("May,Jun,July-(2nd)", q2Months),
      calcQuarter("Aug,Sep,Oct-(3rd)", q3Months),
      calcQuarter("Nov,Dec,Jan(4th)", q4Months),
    ];

    let totalInputVat = 0;
    let totalOutputVat = 0;
    for (const s of sums) {
      if (s.vatType === "INPUT") totalInputVat = Number(s._sum.vatAmount || 0);
      if (s.vatType === "OUTPUT") totalOutputVat = Number(s._sum.vatAmount || 0);
    }

    const totalTaxablePurchases = monthlyPurchases.reduce(
      (s, r) => s + r.taxableAmount,
      0,
    );
    const totalTaxableSales = monthlyIncome.reduce(
      (s, r) => s + r.taxableAmount,
      0,
    );
    const netTotalVat = totalOutputVat - totalInputVat;

    const formattedEntries = vatEntries.slice(0, 50).map((e) => ({
      id: e.id,
      vatType: e.vatType,
      taxableAmount: Number(e.taxableAmount || 0),
      vatRate: Number(e.vatRate?.rate || 5),
      vatAmount: Number(e.vatAmount || 0),
      createdAt:
        e.journalEntryLine?.journalEntry?.createdAt ||
        e.journalEntryLine?.journalEntry?.entryDate ||
        new Date().toISOString(),
      entryNumber: e.journalEntryLine?.journalEntry?.entryNumber || "—",
      entryDate:
        e.journalEntryLine?.journalEntry?.entryDate ||
        new Date().toISOString(),
      description:
        e.journalEntryLine?.journalEntry?.description || "VAT Transaction",
      accountName:
        e.journalEntryLine?.account?.accountName ||
        (e.vatType === "INPUT" ? "VAT Input Tax" : "VAT Output Tax"),
      accountCode:
        e.journalEntryLine?.account?.accountCode ||
        (e.vatType === "INPUT" ? "2200" : "2210"),
    }));

    return NextResponse.json({
      companyName: "AGM FITOUT TECHNICAL SERVICES LLC",
      reportTitle: "VAT Summary Report",
      quarters,
      monthlyNet,
      monthlyPurchases,
      monthlyIncome,
      // Totals
      inputVat: totalInputVat,
      outputVat: totalOutputVat,
      net: netTotalVat,
      taxableSales: totalTaxableSales,
      taxablePurchases: totalTaxablePurchases,
      status: netTotalVat >= 0 ? "PAYABLE" : "REFUNDABLE",
      entries: formattedEntries,
    });
  } catch (error: any) {
    console.error("GET /api/reports/vat-summary error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
