"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdministrationRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/administration/users");
  }, [router]);

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <div className="animate-spin w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full" />
    </div>
  );
}
