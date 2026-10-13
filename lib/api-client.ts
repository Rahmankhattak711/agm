let activeRefreshPromise: Promise<boolean> | null = null;

async function executeRefresh(): Promise<boolean> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

export async function fetchWithRefresh(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(input, { ...init, headers });

  const urlStr = typeof input === "string" ? input : input.toString();
  const isAuthEndpoint =
    urlStr.includes("/api/auth/login") ||
    urlStr.includes("/api/auth/refresh") ||
    urlStr.includes("/api/auth/logout") ||
    urlStr.includes("/api/auth/signin") ||
    urlStr.includes("/api/auth/signout");

  if (res.status === 401 && !isAuthEndpoint && typeof window !== "undefined") {
    const refreshed = await executeRefresh();

    if (refreshed) {
      res = await fetch(input, { ...init, headers });
    } else {
      if (!window.location.pathname.startsWith("/login")) {
        const currentPath = window.location.pathname + window.location.search;
        window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;
      }
    }
  }

  return res;
}

export const authFetch = fetchWithRefresh;
