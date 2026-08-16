import { verifyRefreshToken } from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refreshToken, all } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Missing refreshToken" },
        { status: 400 },
      );
    }

    let payload: any;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 },
      );
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored) {
      return NextResponse.json(
        { error: "Refresh token not found" },
        { status: 404 },
      );
    }

    if (all) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId },
        data: { revoked: true },
      });
    } else {
      await prisma.refreshToken.update({
        where: { token: refreshToken },
        data: { revoked: true },
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
