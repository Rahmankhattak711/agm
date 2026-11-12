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
        "HR_MANAGER",
        "HR",
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
        { employeeName: { contains: search, mode: "insensitive" } },
        { position: { contains: search, mode: "insensitive" } },
        { emiratesId: { contains: search, mode: "insensitive" } },
      ];
    }

    const records = await (prisma as any).salaryCertificate.findMany({
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
      monthlySalaryNum: Number(r.monthlySalaryNum || 0),
      createdAt: r.createdAt?.toISOString?.() || r.createdAt,
      updatedAt: r.updatedAt?.toISOString?.() || r.updatedAt,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/commercial/salary-certificates error:", error);
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
        "HR_MANAGER",
        "HR",
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
      date: body.date || new Date().toLocaleDateString("en-GB"),
      status: body.status || "DRAFT",
      addressee: body.addressee || "To Whom It May Concern,",
      employeePrefix: body.employeePrefix || "Mr.",
      employeeName: body.employeeName || "",
      emiratesId: body.emiratesId || "",
      joiningDate: body.joiningDate || "",
      companyName: body.companyName || "AGM Fitout Technical Services LLC",
      position: body.position || "",
      purposeDisclaimer: body.purposeDisclaimer || "",
      monthlySalaryNum: body.monthlySalaryNum || 0,
      monthlySalaryText: body.monthlySalaryText || "",
      currency: body.currency || "AED",
      signatoryCompany:
        body.signatoryCompany || "AGM Fitout Technical Services LLC",
      signatoryTitle: body.signatoryTitle || "Authorized Signatory,",
      signatoryName: body.signatoryName || "Zeeshan Ahmad",
      signatoryDesignation: body.signatoryDesignation || "Accountant",
      showStampAndSignature: body.showStampAndSignature ?? true,
      city: body.city || "Dubai",
      poBox: body.poBox || "No",
      landline: body.landline || "New 1143 Business Center LLC",
      telephone: body.telephone || "+971 4 280 4184",
      vatNumber: body.vatNumber || "104094432200003",
      footerCompanyName:
        body.footerCompanyName || "AGM Fitout Technical Services",
      registeredAddress: body.registeredAddress || "",
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
      saved = await (prisma as any).salaryCertificate.upsert({
        where: { id: body.id },
        update: payload,
        create: { ...payload, id: body.id },
      });
    } else {
      const existing = await (prisma as any).salaryCertificate.findUnique({
        where: { refNumber: body.refNumber },
      });
      if (existing) {
        saved = await (prisma as any).salaryCertificate.update({
          where: { id: existing.id },
          data: payload,
        });
      } else {
        saved = await (prisma as any).salaryCertificate.create({
          data: payload,
        });
      }
    }

    return NextResponse.json({
      ...saved,
      monthlySalaryNum: Number(saved.monthlySalaryNum || 0),
      createdAt: saved.createdAt?.toISOString?.() || saved.createdAt,
      updatedAt: saved.updatedAt?.toISOString?.() || saved.updatedAt,
    });
  } catch (error: any) {
    console.error("POST /api/commercial/salary-certificates error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
