import { getAuthUser, unauthorized } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import { GetGeneralLedgerQueryHandler } from "@/lib/modules/accounting";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { searchParams } = new URL(request.url);
    const glRecords = await GetGeneralLedgerQueryHandler.execute({
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      accountId: searchParams.get("accountId"),
      search: searchParams.get("search"),
      journalId: searchParams.get("journalId") || searchParams.get("journal"),
    });

    return NextResponse.json(glRecords);
  } catch (error: any) {
    console.error("GET /api/finance/general-ledger error:", error);
    return NextResponse.json(
      { error: "Failed to fetch general ledger records" },
      { status: 500 }
    );
  }
}
