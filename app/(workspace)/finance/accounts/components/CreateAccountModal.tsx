"use client";

import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useCreateAccount, ChartOfAccount } from "@/lib/hooks/api-hooks";
import { toast } from "@/lib/toast";
import {
  Modal,
  Button,
  FormInput,
  FormSelect,
  FormSubmit,
} from "@/components/ui";
import { ACCOUNT_TYPES } from "./types";

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: ChartOfAccount[];
  initialType?: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  initialParentId?: string;
}

export function CreateAccountModal({
  isOpen,
  onClose,
  accounts,
  initialType = "ASSET",
  initialParentId = "",
}: CreateAccountModalProps) {
  const [formError, setFormError] = useState("");
  const createAccountMutation = useCreateAccount();

  const form = useForm({
    defaultValues: {
      accountCode: "",
      accountName: "",
      type: initialType,
      parentId: initialParentId,
    },
    onSubmit: async ({ value }) => {
      setFormError("");
      try {
        await createAccountMutation.mutateAsync({
          accountCode: value.accountCode.trim(),
          accountName: value.accountName.trim(),
          type: value.type,
          parentId: value.parentId || null,
        });
        toast.success(
          `Account "${value.accountName.trim()}" created successfully`,
        );
        form.reset();
        onClose();
      } catch (err: any) {
        setFormError(err.message || "Failed to create account");
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
      setFormError("");
      form.reset({
        accountCode: "",
        accountName: "",
        type: initialType,
        parentId: initialParentId,
      });
    }
  }, [isOpen, initialType, initialParentId, form]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Chart of Account"
      maxWidth="md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4 w-full sm:w-96 text-xs"
      >
        {formError && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-200">
            {formError}
          </div>
        )}

        <form.Field
          name="accountCode"
          validators={{
            onChange: ({ value }) =>
              !value.trim() ? "Account code is required" : undefined,
          }}
        >
          {(field) => (
            <FormInput
              field={field}
              label="Account Code *"
              placeholder="e.g. 1050, 4020, 5300"
              required
            />
          )}
        </form.Field>

        <form.Field
          name="accountName"
          validators={{
            onChange: ({ value }) =>
              !value.trim() ? "Account name is required" : undefined,
          }}
        >
          {(field) => (
            <FormInput
              field={field}
              label="Account Name *"
              placeholder="e.g. Office Stationery, Marketing Revenue"
              required
            />
          )}
        </form.Field>

        <form.Field name="type">
          {(field) => (
            <FormSelect
              field={field}
              label="Account Classification *"
              options={ACCOUNT_TYPES.map((t) => ({
                value: t.value,
                label: `${t.label} (${t.value})`,
              }))}
            />
          )}
        </form.Field>

        <form.Field name="parentId">
          {(field) => (
            <FormSelect
              field={field}
              label="Parent Account (Optional Hierarchy)"
              options={[
                { value: "", label: "-- Top-Level Primary Account --" },
                ...accounts.map((a) => ({
                  value: a.id,
                  label: `${a.accountCode} - ${a.accountName} (${a.type})`,
                })),
              ]}
            />
          )}
        </form.Field>

        <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <FormSubmit
            form={form}
            variant="primary"
            size="sm"
            loading={createAccountMutation.isPending}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
          >
            Save Account
          </FormSubmit>
        </div>
      </form>
    </Modal>
  );
}
