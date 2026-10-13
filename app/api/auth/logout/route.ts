export const runtime = "nodejs";

import prisma from "@/lib/prisma";
import {
  clearAuthCookies,
  getRefreshTokenFromCookie,
} from "@/lib/auth/cookies";
import { sha256 } from "@/lib/auth/tokens";
import { assertSameOrigin } from "@/lib/auth/origin";
import { createAuditLog } from "@/lib/auth/audit";

export async function POST(request: Request) {
  const originCheck = assertSameOrigin(request);
  if (originCheck) return originCheck;

  try {
    const rawToken = await getRefreshTokenFromCookie();
    if (rawToken) {
      const tokenHash = sha256(rawToken);
      const token = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (token) {
        await prisma.refreshToken.updateMany({
          where: { familyId: token.familyId },
          data: { revokedAt: new Date() },
        });

        await createAuditLog({
          actorId: token.userId,
          action: "AUTH_LOGOUT",
          entity: "RefreshToken",
          entityId: token.id,
          metadata: { familyId: token.familyId },
        });
      }
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    await clearAuthCookies();
  }

  return new Response(null, { status: 204 });
}
