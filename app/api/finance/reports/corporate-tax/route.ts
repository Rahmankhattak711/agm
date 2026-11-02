import { NextResponse } from "next/server";
import { getAuthUser, hasRole, unauthorized, forbidden } from "@/lib/auth-server";
import { GetCorporateTaxQueryHandler } from "@/lib/modules/accounting";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, "ACCOUNTANT")) return forbidden();

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : undefined;

    const data = await GetCorporateTaxQueryHandler.execute({ year });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET /api/finance/reports/corporate-tax error:", error);
    return NextResponse.json(
      { error: "Failed to generate Corporate Tax report", details: error.message },
      { status: 500 },
    );
  }
}
