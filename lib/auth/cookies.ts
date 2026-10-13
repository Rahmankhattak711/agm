import "server-only";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export const ACCESS_TOKEN_COOKIE = "agm_access_token";
export const REFRESH_TOKEN_COOKIE = "agm_refresh_token";

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
) {
  const cookieStore = await cookies();
  const accessTtlSeconds = (env.ACCESS_TOKEN_TTL_MINUTES || 15) * 60;
  const refreshTtlSeconds = (env.REFRESH_TOKEN_TTL_DAYS || 7) * 24 * 60 * 60;

  cookieStore.set({
    name: ACCESS_TOKEN_COOKIE,
    value: accessToken,
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
    path: "/",
    maxAge: accessTtlSeconds,
  });

  cookieStore.set({
    name: REFRESH_TOKEN_COOKIE,
    value: refreshToken,
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: refreshTtlSeconds,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: ACCESS_TOKEN_COOKIE,
    value: "",
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  cookieStore.set({
    name: REFRESH_TOKEN_COOKIE,
    value: "",
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 0,
  });
}

export async function getAccessTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value || null;
}

export async function getRefreshTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value || null;
}
