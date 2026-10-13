"use client";

import AgmLogo from "@/components/AgmLogo";
import {
  AlertCircleIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
} from "@/components/icons";
import { Button, Input } from "@/components/ui";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

function ChangePasswordForm() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (values: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password");
      }
      return data;
    },
    onSuccess: () => {
      router.push("/dashboard");
    },
  });

  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
      });
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
            <h1 className="text-xl font-bold text-slate-800">
              Change Password
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Your account requires a new password before continuing.
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
              name="currentPassword"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Current password is required" : undefined,
              }}
            >
              {(field) => {
                const isTouched = field.state.meta.isTouched;
                const error = isTouched && field.state.meta.errors[0];
                return (
                  <Input
                    id="currentPassword"
                    name={field.name}
                    type={showCurrent ? "text" : "password"}
                    label="Current Temporary Password"
                    placeholder="••••••••"
                    leftIcon={<LockIcon size={15} />}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        aria-label={
                          showCurrent ? "Hide password" : "Show password"
                        }
                      >
                        {showCurrent ? (
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

            <form.Field
              name="newPassword"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return "New password is required";
                  if (value.length < 12)
                    return "Must be at least 12 characters";
                  if (!/[A-Z]/.test(value))
                    return "Must include uppercase letter";
                  if (!/[a-z]/.test(value))
                    return "Must include lowercase letter";
                  if (!/[0-9]/.test(value)) return "Must include a digit";
                  return undefined;
                },
              }}
            >
              {(field) => {
                const isTouched = field.state.meta.isTouched;
                const error = isTouched && field.state.meta.errors[0];
                const val = field.state.value;
                return (
                  <div className="space-y-1.5">
                    <Input
                      id="newPassword"
                      name={field.name}
                      type={showNew ? "text" : "password"}
                      label="New Password"
                      placeholder="••••••••"
                      leftIcon={<LockIcon size={15} />}
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                          aria-label={
                            showNew ? "Hide password" : "Show password"
                          }
                        >
                          {showNew ? (
                            <EyeOffIcon size={15} />
                          ) : (
                            <EyeIcon size={15} />
                          )}
                        </button>
                      }
                      value={val}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      disabled={mutation.isPending}
                      error={error ? String(error) : undefined}
                    />

                    <div className="space-y-1 text-[11px] text-slate-500 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-3.5 h-3.5 flex items-center justify-center rounded-full ${val.length >= 12 ? "text-emerald-700 font-bold" : "text-slate-400"}`}
                        >
                          <CheckIcon size={12} />
                        </span>
                        <span>At least 12 characters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-3.5 h-3.5 flex items-center justify-center rounded-full ${/[A-Z]/.test(val) && /[a-z]/.test(val) ? "text-emerald-700 font-bold" : "text-slate-400"}`}
                        >
                          <CheckIcon size={12} />
                        </span>
                        <span>Upper and lowercase letters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-3.5 h-3.5 flex items-center justify-center rounded-full ${/[0-9]/.test(val) ? "text-emerald-700 font-bold" : "text-slate-400"}`}
                        >
                          <CheckIcon size={12} />
                        </span>
                        <span>At least one number</span>
                      </div>
                    </div>
                  </div>
                );
              }}
            </form.Field>

            <form.Field
              name="confirmPassword"
              validators={{
                onChangeListenTo: ["newPassword"],
                onChange: ({ value, fieldApi }) => {
                  if (!value) return "Please confirm your password";
                  if (value !== fieldApi.form.getFieldValue("newPassword")) {
                    return "Passwords do not match";
                  }
                  return undefined;
                },
              }}
            >
              {(field) => {
                const isTouched = field.state.meta.isTouched;
                const error = isTouched && field.state.meta.errors[0];
                return (
                  <Input
                    id="confirmPassword"
                    name={field.name}
                    type={showNew ? "text" : "password"}
                    label="Confirm New Password"
                    placeholder="••••••••"
                    leftIcon={<LockIcon size={15} />}
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
                  Set New Password
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

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700" />
        </div>
      }
    >
      <ChangePasswordForm />
    </Suspense>
  );
}
