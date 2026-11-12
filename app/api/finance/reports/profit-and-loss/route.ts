import {
  getAuthUser,
  isFinancialUser,
  unauthorized,
  forbidden,
} from "@/lib/auth-server";
import { NextResponse } from "next/server";
import { GetProfitLossQueryHandler } from "@/lib/modules/accounting";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!isFinancialUser(authUser)) return forbidden();

    const { searchParams } = new URL(request.url);
    const pnlReport = await GetProfitLossQueryHandler.execute({
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });

    return NextResponse.json(pnlReport);
  } catch (error: any) {
    console.error("GET /api/finance/reports/profit-and-loss error:", error);
    return NextResponse.json(
      { error: "Failed to generate Profit and Loss report", details: error.message },
      { status: 500 }
    );
  }
}
