"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import {
  Button,
  Modal,
  FormInput,
  FormSelect,
  FormSubmit,
} from "@/components/ui";
import { ASSIGNABLE_ROLES } from "../types";

export interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: {
    fullName: string;
    email: string;
    temporaryPassword: string;
    role: string;
  }) => Promise<void>;
  isPending: boolean;
}

export function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: CreateUserModalProps) {
  const [formError, setFormError] = useState("");

  const form = useForm({
    defaultValues: {
      fullName: "",
      email: "",
      temporaryPassword: "",
      role: "USER",
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        await onSubmit({
          fullName: value.fullName.trim(),
          email: value.email.trim(),
          temporaryPassword: value.temporaryPassword,
          role: value.role,
        });
        form.reset();
      } catch (err: any) {
        setFormError(err.message || "Failed to create user");
      }
    },
  });

  const handleClose = () => {
    setFormError("");
    form.reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add User Account"
      maxWidth="3xl"
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
          {(field) => (
            <FormInput
              field={field}
              label="Full Name *"
              placeholder="e.g. John Doe"
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

        <form.Field
          name="temporaryPassword"
          validators={{
            onChange: ({ value }) => {
              if (!value) return "Password is required";
              if (value.length < 12) return "Must be at least 12 characters";
              if (!/[A-Z]/.test(value)) return "Must include uppercase letter";
              if (!/[a-z]/.test(value)) return "Must include lowercase letter";
              if (!/[0-9]/.test(value)) return "Must include number";
              return undefined;
            },
          }}
        >
          {(field) => (
            <div>
              <FormInput
                field={field}
                type="password"
                label="Temporary Password *"
                placeholder="Min 12 chars (upper, lower, digit)"
                required
              />
            </div>
          )}
        </form.Field>

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
            Create Account
          </FormSubmit>
        </div>
      </form>
    </Modal>
  );
}
