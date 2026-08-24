import {
  forbidden,
  getAuthUser,
  hasRole,
  unauthorized,
} from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();
    if (!hasRole(authUser, "ACCOUNTANT", "HR")) {
      return forbidden("Forbidden: Only Accountants, HR, and Admins can create fixed assets");
    }

    const body = await request.json();
    const {
      assetCode,
      assetName,
      purchaseDate,
      cost,
      salvageValue,
      depreciationRate,
      assetAccountId,
      accumulatedDeprAccountId,
      deprExpenseAccountId,
    } = body;

    if (
      !assetCode ||
      !assetName ||
      !purchaseDate ||
      !cost ||
      !assetAccountId ||
      !accumulatedDeprAccountId ||
      !deprExpenseAccountId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const created = await prisma.fixedAsset.create({
      data: {
        assetCode,
        assetName,
        purchaseDate: new Date(purchaseDate),
        cost: Number(cost),
        salvageValue: salvageValue ? Number(salvageValue) : 0,
        depreciationRate: depreciationRate ? Number(depreciationRate) : 20.0,
        assetAccountId,
        accumulatedDeprAccountId,
        deprExpenseAccountId,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) return unauthorized();

    const assets = await prisma.fixedAsset.findMany({
      include: { schedules: true },
    });
    return NextResponse.json(assets);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
