import { NextResponse } from "next/server";
import {
  getMethodStatementById,
  deleteMethodStatement,
} from "@/lib/method-statements-db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const item = getMethodStatementById(id);
    if (!item) {
      return NextResponse.json(
        { error: "Method statement not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to get method statement", details: error.message },
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
    const ok = deleteMethodStatement(id);
    if (!ok) {
      return NextResponse.json(
        { error: "Method statement not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete method statement", details: error.message },
      { status: 500 },
    );
  }
}
