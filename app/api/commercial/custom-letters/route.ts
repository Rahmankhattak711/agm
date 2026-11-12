import { NextResponse } from "next/server";
import { getAuthUser, unauthorized, forbidden, hasRole } from "@/lib/auth-server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (
      !hasRole(authUser, [
        "SUPER_ADMIN",
        "ADMIN",
        "COMMERCIAL_MANAGER",
        "PROJECT_MANAGER",
        "ESTIMATOR",
        "ACCOUNTANT",
      ])
    ) {
      return forbidden();
    }

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
        { docTitle: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
        { addressee: { contains: search, mode: "insensitive" } },
      ];
    }

    const records = await (prisma as any).customLetter.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    const formatted = (records || []).map((r: any) => ({
      ...r,
      sections:
        typeof r.sections === "string"
          ? JSON.parse(r.sections)
          : r.sections || [],
      createdAt: r.createdAt?.toISOString?.() || r.createdAt,
      updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/commercial/custom-letters error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (
      !hasRole(authUser, [
        "SUPER_ADMIN",
        "ADMIN",
        "COMMERCIAL_MANAGER",
        "PROJECT_MANAGER",
        "ESTIMATOR",
        "ACCOUNTANT",
      ])
    ) {
      return forbidden();
    }
    const body = await request.json();

    if (!body.refNumber) {
      return NextResponse.json(
        { error: "Reference number is required" },
        { status: 400 },
      );
    }

    const payload = {
      refNumber: body.refNumber,
      docTitle: body.docTitle || "OFFICIAL COMPANY LETTER",
      date: body.date || new Date().toLocaleDateString("en-GB"),
      status: body.status || "DRAFT",
      addressee: body.addressee || "To Whom It May Concern,",
      addresseeSubtitle: body.addresseeSubtitle || null,
      subject: body.subject || "",
      salutation: body.salutation || "Dear Sir / Madam,",
      sections: Array.isArray(body.sections) ? body.sections : [],
      closingText: body.closingText || null,
      signatoryCompany:
        body.signatoryCompany || "AGM Fitout Technical Services LLC",
      signatoryTitle: body.signatoryTitle || "Authorized Signatory,",
      signatoryName: body.signatoryName || "Zeeshan Ahmad",
      signatoryDesignation: body.signatoryDesignation || "Authorized Signatory",
      showStampAndSignature: body.showStampAndSignature ?? true,
      companyStampUrl: body.companyStampUrl || null,
      signatorySignatureUrl: body.signatorySignatureUrl || null,
      notes: body.notes || null,
      createdById: authUser?.id || null,
    };

    let saved: any;
    const isUuid =
      body.id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        body.id,
      );

    if (isUuid) {
      saved = await (prisma as any).customLetter.upsert({
        where: { id: body.id },
        update: payload,
        create: { ...payload, id: body.id },
        include: {
          createdBy: { select: { id: true, fullName: true, email: true } },
        },
      });
    } else {
      const existing = await (prisma as any).customLetter.findUnique({
        where: { refNumber: body.refNumber },
      });
      if (existing) {
        saved = await (prisma as any).customLetter.update({
          where: { id: existing.id },
          data: payload,
          include: {
            createdBy: { select: { id: true, fullName: true, email: true } },
          },
        });
      } else {
        saved = await (prisma as any).customLetter.create({
          data: payload,
          include: {
            createdBy: { select: { id: true, fullName: true, email: true } },
          },
        });
      }
    }

    return NextResponse.json({
      ...saved,
      sections:
        typeof saved.sections === "string"
          ? JSON.parse(saved.sections)
          : saved.sections || [],
      createdAt: saved.createdAt?.toISOString?.() || saved.createdAt,
      updatedAt: saved.updatedAt?.toISOString?.() || saved.updatedAt,
    });
  } catch (error: any) {
    console.error("POST /api/commercial/custom-letters error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
