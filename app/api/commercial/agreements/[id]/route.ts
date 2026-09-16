import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const item = await (prisma as any).commercialAgreement.findFirst({
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
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: item.id,
      refNumber: item.refNumber,
      title: item.title,
      date: item.date,
      status: item.status,
      contractor: item.contractor,
      client: item.client,
      property: item.property,
      project: item.project,
      contractValueNum: item.contractValue?.num ?? 0,
      contractValueText: item.contractValue?.text ?? "",
      contractValue: item.contractValue,
      clauses: item.clauses,
      paymentMilestones: item.paymentMilestones,
      clientMaterials: item.clientMaterials,
      contractorSignatory: item.contractorSignatory,
      clientSignatory: item.clientSignatory,
      createdBy: item.createdBy,
      createdAt: item.createdAt?.toISOString?.() || item.createdAt,
      updatedAt: item.updatedAt?.toISOString?.() || item.updatedAt,
    });
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const existing = await (prisma as any).commercialAgreement.findFirst({
      where: isUuid
        ? { OR: [{ id }, { refNumber: id }] }
        : { refNumber: id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Agreement not found" }, { status: 404 });
    }

    await (prisma as any).commercialAgreement.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete agreement", details: error.message },
      { status: 500 },
    );
  }
}
