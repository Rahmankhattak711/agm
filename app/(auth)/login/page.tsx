"use client";

import AgmLogo from "@/components/AgmLogo";
import {
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
} from "@/components/icons";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const { login } = useAuth();

  const mutation = useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid credentials");
      }
      return data;
    },
    onSuccess: (data) => {
      login("", "", data.user);
      if (data.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push(next);
      }
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
              Enter your corporate credentials to access AGM ERP
            </p>
          </div>

          {mutation.error && (
            <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 flex items-start gap-2">
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
                    placeholder="admin@agm.ae"
                    leftIcon={<MailIcon size={15} />}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={mutation.isPending}
                    error={error ? String(error) : undefined}
                  />
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
                  <Input
                    id="password"
                    name={field.name}
                    type={showPassword ? "text" : "password"}
                    label="Password"
                    placeholder="••••••••"
                    leftIcon={<LockIcon size={15} />}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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
                    }
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={mutation.isPending}
                    error={error ? String(error) : undefined}
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
                  Sign In
                </Button>
              )}
            </form.Subscribe>
          </form>
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
