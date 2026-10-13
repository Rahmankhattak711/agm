import "server-only";
import { env } from "@/lib/env";
import { NextResponse } from "next/server";

export function assertSameOrigin(req: Request): NextResponse | null {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (!origin) {
    const referer = req.headers.get("referer");
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const expectedUrl = new URL(env.APP_ORIGIN);
        if (
          refererUrl.origin === expectedUrl.origin ||
          (host && refererUrl.host === host)
        ) {
          return null;
        }
      } catch {}
    }
    return NextResponse.json(
      { error: "Forbidden: Origin verification failed" },
      { status: 403 },
    );
  }

  const expectedOrigin = new URL(env.APP_ORIGIN).origin;
  if (origin !== expectedOrigin) {
    if (host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host === host) {
          return null;
        }
      } catch {}
    }

    return NextResponse.json(
      { error: "Forbidden: Cross-site request rejected" },
      { status: 403 },
    );
  }

  return null;
}
