import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await props.params;
    const record = await (prisma as any).customLetter.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Custom letter not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...record,
      sections:
        typeof record.sections === "string"
          ? JSON.parse(record.sections)
          : record.sections || [],
      createdAt: record.createdAt?.toISOString?.() || record.createdAt,
      updatedAt: record.updatedAt?.toISOString?.() || record.updatedAt,
    });
  } catch (error: any) {
    console.error("GET /api/commercial/custom-letters/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom letter", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await props.params;
    await (prisma as any).customLetter.delete({
      where: { id },
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE /api/commercial/custom-letters/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete custom letter", details: error.message },
      { status: 500 },
    );
  }
}
