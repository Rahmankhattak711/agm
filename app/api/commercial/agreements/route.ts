import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "").toUpperCase().trim();

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { refNumber: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { date: { contains: search, mode: "insensitive" } },
      ];
    }

    const records = await (prisma as any).commercialAgreement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    const formatted = records.map((r: any) => ({
      id: r.id,
      refNumber: r.refNumber,
      title: r.title,
      date: r.date,
      status: r.status,
      contractor: r.contractor,
      client: r.client,
      property: r.property,
      project: r.project,
      contractValueNum: r.contractValue?.num ?? 0,
      contractValueText: r.contractValue?.text ?? "",
      contractValue: r.contractValue,
      clauses: r.clauses,
      paymentMilestones: r.paymentMilestones,
      clientMaterials: r.clientMaterials,
      contractorSignatory: r.contractorSignatory,
      clientSignatory: r.clientSignatory,
      createdBy: r.createdBy,
      createdAt: r.createdAt?.toISOString?.() || r.createdAt,
      updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/commercial/agreements error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agreements from database", details: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    const body = await request.json();

    if (!body.refNumber) {
      return NextResponse.json(
        { error: "Agreement reference number is required" },
        { status: 400 },
      );
    }

    const payload = {
      refNumber: body.refNumber,
      title: body.title || "AGM FITOUT AGREEMENT",
      date: body.date || new Date().toLocaleDateString("en-GB"),
      status: body.status || "DRAFT",
      contractor: body.contractor || {},
      client: body.client || {},
      property: body.property || {},
      project: body.project || {},
      contractValue: {
        num: body.contractValueNum || 0,
        text: body.contractValueText || "",
        ...(typeof body.contractValue === "object" ? body.contractValue : {}),
      },
      clauses: body.clauses || [],
      paymentMilestones: body.paymentMilestones || [],
      clientMaterials: body.clientMaterials || [],
      contractorSignatory: body.contractorSignatory || null,
      clientSignatory: body.clientSignatory || null,
      createdById: authUser?.id || null,
    };

    let saved: any;
    const isUuid = body.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id);

    if (isUuid) {
      saved = await (prisma as any).commercialAgreement.upsert({
        where: { id: body.id },
        update: payload,
        create: { ...payload, id: body.id },
      });
    } else {
      const existing = await (prisma as any).commercialAgreement.findUnique({
        where: { refNumber: body.refNumber },
      });
      if (existing) {
        saved = await (prisma as any).commercialAgreement.update({
          where: { id: existing.id },
          data: payload,
        });
      } else {
        saved = await (prisma as any).commercialAgreement.create({
          data: payload,
        });
      }
    }

    return NextResponse.json({
      id: saved.id,
      refNumber: saved.refNumber,
      title: saved.title,
      date: saved.date,
      status: saved.status,
      contractor: saved.contractor,
      client: saved.client,
      property: saved.property,
      project: saved.project,
      contractValueNum: saved.contractValue?.num ?? 0,
      contractValueText: saved.contractValue?.text ?? "",
      contractValue: saved.contractValue,
      clauses: saved.clauses,
      paymentMilestones: saved.paymentMilestones,
      clientMaterials: saved.clientMaterials,
      contractorSignatory: saved.contractorSignatory,
      clientSignatory: saved.clientSignatory,
      createdAt: saved.createdAt?.toISOString?.() || saved.createdAt,
      updatedAt: saved.updatedAt?.toISOString?.() || saved.updatedAt,
    });
  } catch (error: any) {
    console.error("POST /api/commercial/agreements error:", error);
    return NextResponse.json(
      { error: "Failed to save agreement to database", details: error.message },
      { status: 500 },
    );
  }
}
