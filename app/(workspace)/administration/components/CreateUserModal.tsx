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
      role: "USER",
      temporaryPassword: "",
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        await onSubmit({
          fullName: value.fullName.trim(),
          email: value.email.trim(),
          role: value.role,
          temporaryPassword: value.temporaryPassword,
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Add User" maxWidth="lg">
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

          <form.Field
            name="temporaryPassword"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "Password is required";
                if (value.length < 12) return "Must be at least 12 characters";
                if (!/[A-Z]/.test(value))
                  return "Must include uppercase letter";
                if (!/[a-z]/.test(value))
                  return "Must include lowercase letter";
                if (!/[0-9]/.test(value)) return "Must include number";
                return undefined;
              },
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                type="password"
                label="Temporary Password *"
                placeholder="Min 12 characters"
                required
              />
            )}
          </form.Field>
        </div>

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
            Create User
          </FormSubmit>
        </div>
      </form>
    </Modal>
  );
}
