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
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const mutation = useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
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
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[radial-gradient(ellipse_at_top,_#2d4a5e_0%,_#1b2e3d_45%,_#111d27_100%)]">
      
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <svg aria-hidden="true" viewBox="0 0 1440 900" className="w-full h-full object-cover">
          <path
            d="M-100 200 C 300 100, 600 400, 1000 250 C 1200 150, 1400 300, 1600 200"
            fill="none"
            stroke="#59a06d"
            strokeWidth="1.5"
          />
          <path
            d="M-50 400 C 400 300, 700 600, 1100 450 C 1300 350, 1500 500, 1700 400"
            fill="none"
            stroke="#a1d1b1"
            strokeWidth="1.2"
            strokeDasharray="6 6"
          />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md">
        
        <div className="rounded-3xl border border-white/12 bg-white/95 backdrop-blur-xl p-7 sm:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all">
          
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-3">
              <AgmLogo size="md" collapsed={false} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">Enterprise Sign In</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Access your accounting workspace, general ledger, and ERP portal.
            </p>
          </div>

          {mutation.error && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200 flex items-center gap-2 animate-in fade-in">
              <AlertCircleIcon className="w-4 h-4 shrink-0" />
              <span>{mutation.error.message}</span>
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
                          error ? "border-rose-400 bg-rose-50/30" : "border-slate-200 bg-slate-50/50"
                        } pl-10 pr-3.5 py-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition`}
                      />
                    </div>
                    {error && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{String(error)}</p>
                    )}
                  </div>
                );
              }}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) => (!value ? "Password is required" : undefined),
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
                          error ? "border-rose-400 bg-rose-50/30" : "border-slate-200 bg-slate-50/50"
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
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{String(error)}</p>
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
                  className="w-full rounded-xl bg-gradient-to-r from-[#215a36] to-[#1c472d] hover:from-[#28633a] hover:to-[#225537] py-3 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {mutation.isPending || isSubmitting ? (
                    <>
                      <SpinnerIcon className="w-4 h-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    "Sign In to Dashboard"
                  )}
                </button>
              )}
            </form.Subscribe>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
