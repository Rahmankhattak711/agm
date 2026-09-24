import { authFetch } from "@/lib/api-client";

export async function fetchJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await authFetch(url, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}
