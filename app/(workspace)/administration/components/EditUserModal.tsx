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
      title="Edit User"
      maxWidth="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-3.5 text-xs w-full"
      >
        {formError && (
          <div className="p-3 bg-agm-box-bg border border-agm-box-border rounded-lg text-agm-navy font-semibold text-xs">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <form.Field
            name="fullName"
            validators={{
              onChange: ({ value }) =>
                !value.trim() ? "Full name is required" : undefined,
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                label="Full Name *"
                placeholder="Full Name"
                required
              />
            )}
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
                placeholder="user@agm.ae"
                required
              />
            )}
          </form.Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!isTargetSuperAdmin && !isSelf ? (
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
          ) : (
            <div>
              <label className="block text-xs font-bold text-agm-text mb-1">
                Role
              </label>
              <div className="px-3 py-2 rounded-xl bg-agm-box-bg border border-agm-box-border text-xs font-semibold text-agm-text">
                {user?.role} (Protected)
              </div>
            </div>
          )}

          {!isTargetSuperAdmin && !isSelf ? (
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
          ) : (
            <div>
              <label className="block text-xs font-bold text-agm-text mb-1">
                Status
              </label>
              <div className="px-3 py-2 rounded-xl bg-agm-green-soft border border-agm-box-border text-xs font-bold text-agm-green">
                Active
              </div>
            </div>
          )}
        </div>

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
              label="Reset Password"
              placeholder="Leave blank to keep current"
            />
          )}
        </form.Field>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-agm-box-border">
          <Button
            type="button"
            variant="outline"
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
