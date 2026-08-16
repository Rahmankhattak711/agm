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

  return fetch(url, { ...options, headers });
}
