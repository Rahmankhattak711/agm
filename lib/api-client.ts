import { authService } from "@/lib/auth-service";

export async function authFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = authService.getAccessToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && typeof window !== "undefined") {
    const isAuthApi =
      url.includes("/api/auth/signin") ||
      url.includes("/api/auth/signup") ||
      url.includes("/api/auth/signout");
    const isAuthPage =
      window.location.pathname.startsWith("/login") ||
      window.location.pathname.startsWith("/signup");

    if (!isAuthApi && !isAuthPage) {
      authService.clearSession();
      window.location.href = "/login?reset=1";
    }
  }

  return res;
}
