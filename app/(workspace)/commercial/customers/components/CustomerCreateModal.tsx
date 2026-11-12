"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { Modal, Button, FormInput, FormSubmit, FormUaePhoneInput } from "@/components/ui";
import { cleanUaePhone } from "@/lib/utils/phone";
import { useCreateCustomer, Customer } from "@/lib/hooks/api-hooks";

const EMPTY_FORM = {
  customerCode: "",
  name: "",
  companyName: "",
  phone: "",
  email: "",
  address: "",
  creditLimit: "",
};

export interface CustomerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (customer?: Customer) => void;
}

export function CustomerCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: CustomerCreateModalProps) {
  const [formError, setFormError] = useState("");
  const createCustomerMutation = useCreateCustomer();

  const form = useForm({
    defaultValues: { ...EMPTY_FORM },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        const res = await createCustomerMutation.mutateAsync({
          customerCode: value.customerCode.trim() || undefined,
          name: value.name.trim(),
          companyName: value.companyName.trim() || undefined,
          phone: cleanUaePhone(value.phone) || undefined,
          email: value.email.trim() || undefined,
          address: value.address.trim() || undefined,
          creditLimit: parseFloat(value.creditLimit) || 0,
        });
        form.reset();
        onClose();
        if (onSuccess) onSuccess(res);
      } catch (err: any) {
        setFormError(err.message || "Failed to save customer record");
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
      setFormError("");
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Customer Profile"
      maxWidth="2xl"
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
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <form.Field name="customerCode">
            {(field) => (
              <FormInput
                field={field}
                label="Customer Code"
                placeholder="Auto-generated if blank (e.g. CUST-001)"
                className="font-mono"
              />
            )}
          </form.Field>

          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                !value.trim() ? "Customer name is required" : undefined,
            }}
          >
            {(field) => (
              <FormInput
                field={field}
                label="Customer Name / Entity *"
                required
                placeholder="Full Legal / Trading Name"
              />
            )}
          </form.Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <form.Field name="companyName">
            {(field) => (
              <FormInput
                field={field}
                label="Company / Organization Name"
                placeholder="Company LLC / Corporation"
              />
            )}
          </form.Field>

          <form.Field name="phone">
            {(field) => (
              <FormUaePhoneInput
                field={field}
                label="Phone / Mobile"
              />
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <FormInput
                field={field}
                label="Email Address"
                type="email"
                placeholder="accounts@client.com"
              />
            )}
          </form.Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <form.Field name="address">
            {(field) => (
              <FormInput
                field={field}
                label="Address / Site Location (UAE)"
                placeholder="Sheikh Zayed Rd, Dubai, UAE"
              />
            )}
          </form.Field>

          <form.Field name="creditLimit">
            {(field) => (
              <FormInput
                field={field}
                label="Credit Limit (AED)"
                type="number"
                step="0.01"
                placeholder="50000.00"
                className="font-mono"
              />
            )}
          </form.Field>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <FormSubmit
            form={form}
            className="text-white font-semibold text-xs cursor-pointer shadow-2xs"
            style={{ backgroundColor: "#1d4ed8" }}
          >
            Save Customer Record
          </FormSubmit>
        </div>
      </form>
    </Modal>
  );
}
