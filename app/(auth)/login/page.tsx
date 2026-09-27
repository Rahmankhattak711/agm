"use client";

import {
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  SpinnerIcon,
} from "@/components/icons";
import AgmLogo from "@/components/AgmLogo";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/lib/auth-service";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Clock, RefreshCw, UserPlus } from "lucide-react";

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
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#1d3345] via-[#243c50] to-[#2c455a] p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg
            aria-hidden="true"
            viewBox="0 0 1440 900"
            className="w-full h-full object-cover"
          >
            <line
              x1="0"
              y1="150"
              x2="1440"
              y2="750"
              stroke="#dff7e6"
              strokeWidth="1.2"
              strokeDasharray="6 6"
            />
            <line
              x1="0"
              y1="750"
              x2="1440"
              y2="150"
              stroke="#dff7e6"
              strokeWidth="1.2"
              strokeDasharray="6 6"
            />
            <rect
              x="200"
              y="100"
              width="400"
              height="700"
              fill="none"
              stroke="#dff7e6"
              strokeWidth="1"
            />
            <rect
              x="840"
              y="100"
              width="400"
              height="700"
              fill="none"
              stroke="#dff7e6"
              strokeWidth="1"
            />
            <circle
              cx="720"
              cy="450"
              r="320"
              fill="none"
              stroke="#dff7e6"
              strokeWidth="1"
              opacity="0.6"
            />
          </svg>
        </div>

        <div className="relative z-10">
          <AgmLogo size="lg" theme="light" />
        </div>

        <div className="relative z-10 max-w-md">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-[#a3e6ba] border border-emerald-400/30 text-xs font-bold uppercase tracking-wider mb-4">
            AGM ERP
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            All-in-one business management.
          </h1>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            Everything you need to run finance, sales, inventory, and operations
            in one system.
          </p>

          <div className="mt-6 space-y-2.5 text-xs text-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>Track general ledgers, P&amp;L, and VAT returns</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>Issue quotations, invoices, and payments</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>Control inventory, purchase orders, and warehouses</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span>Manage employees, attendance, and payroll</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between border-t border-white/10 pt-6">
          <span>© {new Date().getFullYear()} AGM Technical Services LLC</span>
          <span>UAE FTA Compliant</span>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(38,59,77,0.1)] border border-slate-200/80">
          <div className="lg:hidden mb-6 flex justify-center">
            <AgmLogo size="md" theme="dark" />
          </div>

          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-agm-text tracking-tight">
              Sign In
            </h2>
            <p className="text-xs text-agm-muted mt-1 max-w-xs">
              Enter your email and password to access your workspace.
            </p>
          </div>

          {isDbReset && (
            <div className="mb-4 rounded-xl bg-teal-50 p-3.5 text-xs font-semibold text-teal-900 border border-teal-200 flex items-start gap-2.5 animate-in fade-in shadow-2xs">
              <RefreshCw className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Database Reset Detected</p>
                <p className="text-[11px] text-teal-800 font-normal mt-0.5">
                  Previous sessions were cleared. Please sign in or create an
                  administrator account.
                </p>
              </div>
            </div>
          )}

          {isExpired && !isDbReset && (
            <div className="mb-4 rounded-xl bg-amber-50 p-3.5 text-xs font-semibold text-amber-800 border border-amber-200 flex items-center gap-2.5 animate-in fade-in">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Your session has expired. Please sign in again to continue.
              </span>
            </div>
          )}

          {mutation.error && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-800 border border-rose-200 space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircleIcon className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{mutation.error.message}</span>
              </div>
              {(mutation.error.message
                .toLowerCase()
                .includes("user not found") ||
                (mutation.error as any).isDbEmpty) && (
                <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-rose-700 font-normal">
                    Database reset or new system?
                  </span>
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-agm-green hover:bg-agm-green-2 px-2.5 py-1 rounded-lg transition"
                  >
                    <UserPlus className="w-3 h-3" />
                    Sign Up Admin
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
                      className="mb-1.5 block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                        <MailIcon className="w-4 h-4" />
                      </span>
                      <input
                        id="email"
                        name={field.name}
                        type="email"
                        placeholder="admin@agm.ae"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        disabled={mutation.isPending}
                        className={`w-full rounded-xl border ${
                          error
                            ? "border-rose-400 bg-rose-50/30"
                            : "border-slate-200 bg-slate-50/50"
                        } pl-10 pr-3.5 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition`}
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
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="password"
                        className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                      >
                        Password
                      </label>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                        <LockIcon className="w-4 h-4" />
                      </span>
                      <input
                        id="password"
                        name={field.name}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        disabled={mutation.isPending}
                        className={`w-full rounded-xl border ${
                          error
                            ? "border-rose-400 bg-rose-50/30"
                            : "border-slate-200 bg-slate-50/50"
                        } pl-10 pr-10 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOffIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
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
                <button
                  type="submit"
                  disabled={!canSubmit || mutation.isPending || isSubmitting}
                  className="w-full rounded-xl bg-agm-green hover:bg-agm-green-2 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-agm-green/30 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {mutation.isPending || isSubmitting ? (
                    <>
                      <SpinnerIcon className="w-4 h-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>
              )}
            </form.Subscribe>
          </form>

          <p className="mt-6 text-center text-xs text-agm-muted">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-agm-green hover:text-agm-green-2 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-agm-bg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agm-green" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
