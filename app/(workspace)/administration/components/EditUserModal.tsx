"use client";

import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import type { UserItem } from "@/lib/hooks/types";
import {
  Button,
  Modal,
  FormInput,
  FormSelect,
  FormSubmit,
} from "@/components/ui";
import { ASSIGNABLE_ROLES } from "../types";

export interface EditUserModalProps {
  isOpen: boolean;
  user: UserItem | null;
  currentUserId?: string;
  onClose: () => void;
  onSubmit: (values: {
    id: string;
    fullName: string;
    email: string;
    role?: string;
    isActive?: boolean;
    password?: string;
  }) => Promise<void>;
  isPending: boolean;
}

export function EditUserModal({
  isOpen,
  user,
  currentUserId,
  onClose,
  onSubmit,
  isPending,
}: EditUserModalProps) {
  const [formError, setFormError] = useState("");

  const form = useForm({
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      role: user?.role || "USER",
      isActive: user?.isActive ? "true" : "false",
      temporaryPassword: "",
    },
    onSubmit: async ({ value }) => {
      if (!user) return;
      setFormError("");
      try {
        await onSubmit({
          id: user.id,
          fullName: value.fullName.trim(),
          email: value.email.trim(),
          role: value.role,
          isActive: value.isActive === "true",
          password: value.temporaryPassword.trim()
            ? value.temporaryPassword.trim()
            : undefined,
        });
        form.reset();
      } catch (err: any) {
        setFormError(err.message || "Failed to update user");
      }
    },
  });

  useEffect(() => {
    if (user) {
      setFormError("");
      form.reset({
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive ? "true" : "false",
        temporaryPassword: "",
      });
    }
  }, [user, form]);

  const handleClose = () => {
    setFormError("");
    onClose();
  };

  const isTargetSuperAdmin = user?.role === "SUPER_ADMIN";
  const isSelf = user?.id === currentUserId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit User: ${user?.fullName || ""}`}
      maxWidth="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-3.5 text-xs"
      >
        {formError && (
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
            {formError}
          </div>
        )}

        <form.Field
          name="fullName"
          validators={{
            onChange: ({ value }) =>
              !value.trim() ? "Full name is required" : undefined,
          }}
        >
          {(field) => <FormInput field={field} label="Full Name *" required />}
        </form.Field>

        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) =>
              !value.trim()
                ? "Email is required"
                : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                  ? "Invalid email format"
                  : undefined,
          }}
        >
          {(field) => (
            <FormInput
              field={field}
              type="email"
              label="Email Address *"
              required
            />
          )}
        </form.Field>

        {!isTargetSuperAdmin && !isSelf && (
          <form.Field name="role">
            {(field) => (
              <FormSelect
                field={field}
                label="Role *"
                required
                options={ASSIGNABLE_ROLES.map((r) => ({
                  value: r.value,
                  label: r.label,
                }))}
              />
            )}
          </form.Field>
        )}

        {!isTargetSuperAdmin && !isSelf && (
          <form.Field name="isActive">
            {(field) => (
              <FormSelect
                field={field}
                label="Status"
                options={[
                  { value: "true", label: "Active" },
                  { value: "false", label: "Disabled" },
                ]}
              />
            )}
          </form.Field>
        )}

        <form.Field
          name="temporaryPassword"
          validators={{
            onChange: ({ value }) => {
              if (!value) return undefined;
              if (value.length < 12) return "Must be at least 12 characters";
              if (!/[A-Z]/.test(value)) return "Must include uppercase letter";
              if (!/[a-z]/.test(value)) return "Must include lowercase letter";
              if (!/[0-9]/.test(value)) return "Must include number";
              return undefined;
            },
          }}
        >
          {(field) => (
            <FormInput
              field={field}
              type="password"
              label="Reset Password (optional)"
              placeholder="Leave blank to keep current"
            />
          )}
        </form.Field>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <FormSubmit
            form={form}
            loading={isPending}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
          >
            Save Changes
          </FormSubmit>
        </div>
      </form>
    </Modal>
  );
}
