import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/inventory",
  "/finance",
  "/operations",
  "/administration",
  "/quotation",
];

const PROTECTED_API_PREFIXES = [
  "/api/inventory",
  "/api/employees",
  "/api/assets",
  "/api/accounts",
  "/api/finance",
  "/api/journal-entries",
  "/api/petty-cash",
  "/api/reports",
  "/api/users",
];

const AUTH_PREFIXES = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const proxyTarget = process.env.API_PROXY_URL;
  if (proxyTarget && pathname.startsWith("/api/proxy/")) {
    const targetPath = pathname.replace("/api/proxy/", "/");
    const targetUrl = new URL(targetPath, proxyTarget);
    targetUrl.search = request.nextUrl.search;

    return NextResponse.rewrite(targetUrl, {
      request: {
        headers: new Headers(request.headers),
      },
    });
  }

  const token =
    request.cookies.get("agm_access_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const isProtectedPath = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isProtectedApiPath = PROTECTED_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isAuthPath = AUTH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtectedApiPath && !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isProtectedPath && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && token) {
    const dashboardUrl = new URL("/inventory/products", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
