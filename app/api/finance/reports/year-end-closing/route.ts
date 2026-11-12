import {
  getAuthUser,
  hasRole,
  isFinancialUser,
  unauthorized,
  forbidden,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { YearEndClosingService } from "@/lib/services/accounting/year-end-closing.service";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!isFinancialUser(authUser)) return forbidden();

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || "2026", 10);

    const summary = await YearEndClosingService.calculateYearSummary(year);
    const allClosings = await prisma.fiscalYearClosing.findMany({
      orderBy: { year: "desc" },
      include: {
        closedBy: {
          select: { fullName: true, email: true },
        },
      },
    });

    return NextResponse.json({
      currentYear: summary,
      history: allClosings,
    });
  } catch (error: any) {
    console.error("GET /api/finance/reports/year-end-closing error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fiscal year summary", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, "ACCOUNTANT")) {
      return forbidden("Only Accountants and Admins can close a financial year");
    }

    const body = await request.json();
    const year = parseInt(body.year, 10);

    if (!year) {
      return NextResponse.json({ error: "Missing fiscal year" }, { status: 400 });
    }

    const result = await YearEndClosingService.closeFiscalYear(year, authUser.id);

    return NextResponse.json({
      success: true,
      message: `Fiscal Year ${year} closed successfully. Net Profit/Loss transferred to Retained Earnings.`,
      result,
    });
  } catch (error: any) {
    console.error("POST /api/finance/reports/year-end-closing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to close fiscal year" },
      { status: 500 }
    );
  }
}
