import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const item = await (prisma as any).methodStatement.findFirst({
      where: isUuid
        ? { OR: [{ id }, { refNumber: id }] }
        : { refNumber: id },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const existing = await (prisma as any).methodStatement.findFirst({
      where: isUuid
        ? { OR: [{ id }, { refNumber: id }] }
        : { refNumber: id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Method statement not found" },
        { status: 404 },
      );
    }

    await (prisma as any).methodStatement.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete method statement", details: error.message },
      { status: 500 },
    );
  }
}
