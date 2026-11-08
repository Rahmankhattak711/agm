"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { Modal, Button, FormInput, FormSubmit, FormUaePhoneInput } from "@/components/ui";
import { cleanUaePhone } from "@/lib/utils/phone";
import { useUpdateCustomer, Customer } from "@/lib/hooks/api-hooks";
import { toast } from "@/lib/toast";

export interface CustomerEditModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSuccess?: (customer?: Customer) => void;
}

export function CustomerEditModal({
  isOpen,
  customer,
  onClose,
  onSuccess,
}: CustomerEditModalProps) {
  const [formError, setFormError] = useState("");
  const updateCustomerMutation = useUpdateCustomer();

  const form = useForm({
    defaultValues: {
      customerCode: customer?.customerCode || "",
      name: customer?.name || "",
      companyName: customer?.companyName || "",
      phone: customer?.phone || "",
      email: customer?.email || "",
      address: customer?.address || "",
      creditLimit:
        customer?.creditLimit !== undefined
          ? String(customer.creditLimit)
          : "0",
    },
    onSubmit: async ({ value }) => {
      if (!customer) return;
      setFormError("");
      try {
        const res = await updateCustomerMutation.mutateAsync({
          id: customer.id,
          data: {
            customerCode: value.customerCode.trim() || undefined,
            name: value.name.trim(),
            companyName: value.companyName.trim() || null,
            phone: cleanUaePhone(value.phone) || null,
            email: value.email.trim() || null,
            address: value.address.trim() || null,
            creditLimit: parseFloat(value.creditLimit) || 0,
          },
        });
        toast.success(`Customer "${value.name}" updated successfully`);
        onClose();
        if (onSuccess) onSuccess(res);
      } catch (err: any) {
        setFormError(err.message || "Failed to update customer record");
      }
    },
  });

  useEffect(() => {
    if (isOpen && customer) {
      setFormError("");
      form.reset({
        customerCode: customer.customerCode || "",
        name: customer.name || "",
        companyName: customer.companyName || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        creditLimit:
          customer.creditLimit !== undefined
            ? String(customer.creditLimit)
            : "0",
      });
    }
  }, [isOpen, customer, form]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Customer: ${customer?.name || ""}`}
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
                placeholder="e.g. CUST-001"
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
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
          >
            Save Changes
          </FormSubmit>
        </div>
      </form>
    </Modal>
  );
}
