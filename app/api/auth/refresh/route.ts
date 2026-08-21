import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/jwt";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

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

    if (!stored || stored.revoked) {
      return NextResponse.json(
        { error: "Refresh token revoked or not found" },
        { status: 401 },
      );
    }

    const accessToken = signAccessToken({ userId: payload.userId });

    const newRefreshToken = signRefreshToken({ userId: payload.userId });

    await prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: payload.userId },
    });
    await prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { revoked: true },
    });

    return NextResponse.json(
      { accessToken, refreshToken: newRefreshToken },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
