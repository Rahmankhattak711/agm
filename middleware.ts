import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_EXACT_PATHS = new Set([
  "/login",
  "/refresh",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/signin",
  "/api/auth/signout",
]);

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ||
    process.env.ACCESS_TOKEN_SECRET ||
    "agm_access_secret_super_key_2026_secure",
);

async function verifyEdgeToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET_KEY, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/signup" || pathname.startsWith("/signup/")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (PUBLIC_EXACT_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/docs") || pathname.startsWith("/api/doc")) {
    return NextResponse.next();
  }

  const proxyTarget = process.env.API_PROXY_URL;
  if (proxyTarget && pathname.startsWith("/api/proxy/")) {
    const targetPath = pathname.replace("/api/proxy/", "/");
    const targetUrl = new URL(targetPath, proxyTarget);
    targetUrl.search = request.nextUrl.search;
    return NextResponse.rewrite(targetUrl, {
      request: { headers: new Headers(request.headers) },
    });
  }

  const accessCookie = request.cookies.get("agm_access_token")?.value;
  const refreshCookie = request.cookies.get("agm_refresh_token")?.value;
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const rawToken = accessCookie || bearerToken;
  const isAccessTokenValid = rawToken ? await verifyEdgeToken(rawToken) : false;

  const isApiRoute = pathname.startsWith("/api/");

  if (isAccessTokenValid) {
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    const response = NextResponse.next();
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return response;
  }

  if (isApiRoute) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or expired access token" },
      { status: 401 },
    );
  }

  if (refreshCookie) {
    const refreshUrl = new URL("/refresh", request.url);
    refreshUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(refreshUrl);
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
