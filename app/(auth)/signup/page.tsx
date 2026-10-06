"use client";

import {
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  UserIcon,
} from "@/components/icons";
import { Button, Input } from "@/components/ui";
import AgmLogo from "@/components/AgmLogo";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const mutation = useMutation({
    mutationFn: async (values: {
      fullName: string;
      email: string;
      password: string;
    }) => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      return data;
    },
    onSuccess: (data) => {
      login(data.accessToken, data.refreshToken, data.user);
      router.push("/dashboard");
    },
  });

  const form = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value);
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
            Manage your entire business here.
          </h1>
          <p className="mt-3 text-sm text-slate-300 leading-relaxed">
            Create an account to access accounting, commercial, inventory, and
            team management tools.
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
              Create Account
            </h2>
            <p className="text-xs text-agm-muted mt-1 max-w-xs">
              Enter your details to create your user profile.
            </p>
          </div>

          {mutation.error && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-800 border border-rose-200 flex items-start gap-2 animate-in fade-in">
              <AlertCircleIcon className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
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
              name="fullName"
              validators={{
                onChange: ({ value }) =>
                  !value.trim() ? "Full name is required" : undefined,
              }}
            >
              {(field) => {
                const isTouched = field.state.meta.isTouched;
                const error = isTouched && field.state.meta.errors[0];
                return (
                  <Input
                    id="fullName"
                    name={field.name}
                    type="text"
                    label="Full Name"
                    labelClassName="mb-1.5 block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                    placeholder="John Doe"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={mutation.isPending}
                    error={error ? String(error) : undefined}
                    leftIcon={<UserIcon size={16} />}
                  />
                );
              }}
            </form.Field>

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
                  <Input
                    id="email"
                    name={field.name}
                    type="email"
                    label="Email Address"
                    labelClassName="mb-1.5 block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                    placeholder="name@agm.ae"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={mutation.isPending}
                    error={error ? String(error) : undefined}
                    leftIcon={<MailIcon size={16} />}
                  />
                );
              }}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) =>
                  !value
                    ? "Password is required"
                    : value.length < 6
                      ? "Password must be at least 6 characters"
                      : undefined,
              }}
            >
              {(field) => {
                const isTouched = field.state.meta.isTouched;
                const error = isTouched && field.state.meta.errors[0];
                return (
                  <Input
                    id="password"
                    name={field.name}
                    type={showPassword ? "text" : "password"}
                    label="Password"
                    labelClassName="mb-1.5 block text-[11px] font-bold text-slate-700 uppercase tracking-wider"
                    placeholder="••••••••"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={mutation.isPending}
                    error={error ? String(error) : undefined}
                    leftIcon={<LockIcon size={16} />}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 transition-colors"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOffIcon size={16} />
                        ) : (
                          <EyeIcon size={16} />
                        )}
                      </button>
                    }
                  />
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
                  className="w-full mt-2"
                >
                  Create Account
                </Button>
              )}
            </form.Subscribe>
          </form>

          <p className="mt-6 text-center text-xs text-agm-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-agm-green hover:text-agm-green-2 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
