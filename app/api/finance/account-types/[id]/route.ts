import {
  getAuthUser,
  unauthorized,
  hasRole,
  forbidden,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const { id } = await params;

    const subtype = await prisma.accountSubtype.findUnique({
      where: { id },
    });

    if (!subtype) {
      return NextResponse.json(
        { error: "Account type not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(subtype);
  } catch (error: any) {
    console.error("GET /api/finance/account-types/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch account type" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"])) {
      return forbidden("Forbidden: Only Finance users can modify account types");
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      nameAr,
      type,
      cashFlowType,
      description,
      parentCodePrefix,
      enablePayments,
      showInExpenseClaims,
    } = body;

    const existing = await prisma.accountSubtype.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Account type not found" },
        { status: 404 },
      );
    }

    const trimmedName = name ? name.trim() : existing.name;

    if (trimmedName.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await prisma.accountSubtype.findFirst({
        where: {
          name: { equals: trimmedName, mode: "insensitive" },
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: `Account type "${trimmedName}" already exists.` },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.accountSubtype.update({
      where: { id },
      data: {
        name: trimmedName,
        nameAr: nameAr !== undefined ? (nameAr?.trim() || null) : existing.nameAr,
        type: type ?? existing.type,
        cashFlowType: cashFlowType ?? existing.cashFlowType,
        description: description !== undefined ? (description?.trim() || null) : existing.description,
        parentCodePrefix: parentCodePrefix !== undefined ? (parentCodePrefix?.trim() || null) : existing.parentCodePrefix,
        enablePayments: enablePayments !== undefined ? Boolean(enablePayments) : existing.enablePayments,
        showInExpenseClaims: showInExpenseClaims !== undefined ? Boolean(showInExpenseClaims) : existing.showInExpenseClaims,
      },
    });

    // If name changed, synchronize existing accounts in chart_of_accounts
    if (existing.name !== trimmedName) {
      await prisma.chartOfAccount.updateMany({
        where: { accountSubtype: existing.name },
        data: { accountSubtype: trimmedName },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/finance/account-types/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update account type" },
      { status: 500 },
    );
  }
}

export const PATCH = PUT;

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"])) {
      return forbidden("Forbidden: Only Finance users can delete account types");
    }

    const { id } = await params;

    const existing = await prisma.accountSubtype.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Account type not found" },
        { status: 404 },
      );
    }

    // Set accountSubtype to null for any accounts currently using this subtype
    await prisma.chartOfAccount.updateMany({
      where: { accountSubtype: existing.name },
      data: { accountSubtype: null },
    });

    await prisma.accountSubtype.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Account type "${existing.name}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/finance/account-types/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete account type" },
      { status: 500 },
    );
  }
}
