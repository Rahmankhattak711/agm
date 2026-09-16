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
        { customerName: { contains: search, mode: "insensitive" } },
        { projectName: { contains: search, mode: "insensitive" } },
        { projectLocation: { contains: search, mode: "insensitive" } },
      ];
    }

    const records = await (prisma as any).riskAssessment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    return NextResponse.json(records);
  } catch (error: any) {
    console.error("GET /api/commercial/risk-assessments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch risk assessments from database", details: error.message },
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
        { error: "Reference number is required" },
        { status: 400 },
      );
    }

    const payload = {
      refNumber: body.refNumber,
      date: body.date || new Date().toLocaleDateString("en-GB"),
      status: body.status || "DRAFT",
      customerName: body.customerName || "",
      projectName: body.projectName || "",
      phoneNumber: body.phoneNumber || "",
      projectLocation: body.projectLocation || "",
      startDate: body.startDate || "",
      duration: body.duration || "",
      workingHours: body.workingHours || "",
      projectManager: body.projectManager || {},
      constructionManager: body.constructionManager || {},
      purpose: body.purpose || "",
      scope: body.scope || "",
      items: body.items || [],
      createdById: authUser?.id || null,
    };

    let saved: any;
    const isUuid = body.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id);

    if (isUuid) {
      saved = await (prisma as any).riskAssessment.upsert({
        where: { id: body.id },
        update: payload,
        create: { ...payload, id: body.id },
      });
    } else {
      const existing = await (prisma as any).riskAssessment.findUnique({
        where: { refNumber: body.refNumber },
      });
      if (existing) {
        saved = await (prisma as any).riskAssessment.update({
          where: { id: existing.id },
          data: payload,
        });
      } else {
        saved = await (prisma as any).riskAssessment.create({
          data: payload,
        });
      }
    }

    return NextResponse.json(saved);
  } catch (error: any) {
    console.error("POST /api/commercial/risk-assessments error:", error);
    return NextResponse.json(
      { error: "Failed to save risk assessment to database", details: error.message },
      { status: 500 },
    );
  }
}
