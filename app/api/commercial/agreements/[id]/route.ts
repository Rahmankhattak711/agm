import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
import { getAgreementById, deleteAgreement } from "@/lib/agreements-db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const item = getAgreementById(id);
    if (!item) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to get agreement", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ok = deleteAgreement(id);
    if (!ok) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete agreement", details: error.message },
      { status: 500 },
    );
  }
}
