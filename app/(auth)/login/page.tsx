"use client";

import AgmLogo from "@/components/AgmLogo";
import {
  AlertCircleIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  RefreshIcon,
  UserPlusIcon,
} from "@/components/icons";
import { Button } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/lib/auth-service";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get("expired") === "1";
  const isDbReset = searchParams.get("reset") === "1";
  const { login } = useAuth();

  useEffect(() => {
    if (isDbReset || isExpired) {
      authService.clearSession();
    }
  }, [isDbReset, isExpired]);

  const mutation = useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        const err: any = new Error(data.error || "Login failed");
        err.isDbEmpty = Boolean(data.isDbEmpty);
        throw err;
      }
      return data;
    },
    onSuccess: (data) => {
      login(data.accessToken, data.refreshToken, data.user);
      router.push("/dashboard");
    },
  });

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-8 sm:py-12">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="flex justify-center mb-6">
          <AgmLogo size="lg" theme="light" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-slate-800">Sign In</h1>
            <p className="text-xs text-slate-500 mt-1">
              Enter your email and password to access AGM ERP
            </p>
          </div>

          {isDbReset && (
            <div className="mb-4 rounded-xl bg-teal-50 p-3 text-xs text-teal-900 border border-teal-200 flex items-start gap-2.5">
              <RefreshIcon className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Database Reset Detected</p>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  Previous sessions were cleared. Please sign in or create an
                  administrator account.
                </p>
              </div>
            </div>
          )}

          {isExpired && !isDbReset && (
            <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200 flex items-center gap-2.5">
              <ClockIcon className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Your session has expired. Please sign in again.</span>
            </div>
          )}

          {mutation.error && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircleIcon className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{mutation.error.message}</span>
              </div>
              {(mutation.error.message
                .toLowerCase()
                .includes("user not found") ||
                (mutation.error as any).isDbEmpty) && (
                <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
                  <span className="text-[11px] text-rose-700">
                    Need an initial account?
                  </span>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1 rounded-lg transition"
                  >
                    <UserPlusIcon size={12} />
                    <span>Create Admin</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) =>
                  !value
                    ? "Email is required"
                    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                      ? "Invalid email address"
                      : undefined,
              }}
            >
              {(field) => {
                const isTouched = field.state.meta.isTouched;
                const error = isTouched && field.state.meta.errors[0];
                return (
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
                        <MailIcon size={15} />
                      </div>
                      <input
                        id="email"
                        name={field.name}
                        type="email"
                        placeholder="admin@agm.ae"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        disabled={mutation.isPending}
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition ${
                          error ? "border-rose-300" : "border-slate-300"
                        }`}
                      />
                    </div>
                    {error && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">
                        {String(error)}
                      </p>
                    )}
                  </div>
                );
              }}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Password is required" : undefined,
              }}
            >
              {(field) => {
                const isTouched = field.state.meta.isTouched;
                const error = isTouched && field.state.meta.errors[0];
                return (
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center">
                        <LockIcon size={15} />
                      </div>
                      <input
                        id="password"
                        name={field.name}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        disabled={mutation.isPending}
                        className={`w-full pl-9 pr-9 py-2 text-xs rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition ${
                          error ? "border-rose-300" : "border-slate-300"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOffIcon size={15} />
                        ) : (
                          <EyeIcon size={15} />
                        )}
                      </button>
                    </div>
                    {error && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">
                        {String(error)}
                      </p>
                    )}
                  </div>
                );
              }}
            </form.Field>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={mutation.isPending || isSubmitting}
                  disabled={!canSubmit || mutation.isPending || isSubmitting}
                  className="w-full mt-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Sign In
                </Button>
              )}
            </form.Subscribe>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          &copy; {new Date().getFullYear()} AGM Technical Services LLC
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
