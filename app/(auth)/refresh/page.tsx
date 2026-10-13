"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RefreshContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  useEffect(() => {
    let isMounted = true;

    async function attemptRefresh() {
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          if (isMounted) {
            router.replace(next);
          }
        } else {
          if (isMounted) {
            const loginUrl = `/login?next=${encodeURIComponent(next)}`;
            router.replace(loginUrl);
          }
        }
      } catch {
        if (isMounted) {
          router.replace(`/login?next=${encodeURIComponent(next)}`);
        }
      }
    }

    attemptRefresh();

    return () => {
      isMounted = false;
    };
  }, [next, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-slate-500">
          Restoring session...
        </p>
      </div>
    </div>
  );
}

export default function RefreshPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <RefreshContent />
    </Suspense>
  );
}
