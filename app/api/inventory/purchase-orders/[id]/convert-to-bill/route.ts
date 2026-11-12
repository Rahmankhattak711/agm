import { getAuthUser, unauthorized, forbidden, hasRole } from "@/lib/auth-server";
import { convertPurchaseOrderToBill } from "@/lib/commercial-accounting";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (
      !hasRole(authUser, [
        "SUPER_ADMIN",
        "ADMIN",
        "ACCOUNTANT",
        "INVENTORY_MANAGER",
      ])
    ) {
      return forbidden();
    }

    const { id } = await params;
    const result = await convertPurchaseOrderToBill(id, authUser.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST convert PO to bill error:", error);
    return NextResponse.json(
      { error: "Failed to convert purchase order to bill" },
      { status: 500 },
    );
  }
}
