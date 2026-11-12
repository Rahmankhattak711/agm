import {
  getAuthUser,
  unauthorized,
  forbidden,
  hasRole,
} from "@/lib/auth-server";
import { NextResponse } from "next/server";
import { PostSalesInvoiceCommandHandler } from "@/lib/modules/accounting";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"])) {
      return forbidden();
    }

    const { id } = await params;

    const result = await PostSalesInvoiceCommandHandler.execute({
      invoiceId: id,
      userId: authUser.id,
    });

    return NextResponse.json({
      success: true,
      invoice: result.invoice,
      journalEntryId: result.journalEntry.id,
    });
  } catch (error: any) {
    console.error("POST post sales invoice error:", error);
    return NextResponse.json(
      { error: "Failed to post sales invoice" },
      { status: 400 },
    );
  }
}
