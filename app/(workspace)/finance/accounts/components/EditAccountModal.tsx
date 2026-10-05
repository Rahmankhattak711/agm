"use client";

import { useState, useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { useUpdateAccount, ChartOfAccount } from "@/lib/hooks/api-hooks";
import { toast } from "@/lib/toast";
import {
  Modal,
  Button,
  FormInput,
  FormSelect,
  FormSubmit,
} from "@/components/ui";
import { ACCOUNT_TYPES } from "./types";

interface EditAccountModalProps {
  account: ChartOfAccount | null;
  onClose: () => void;
  accounts: ChartOfAccount[];
}

export function EditAccountModal({
  account,
  onClose,
  accounts,
}: EditAccountModalProps) {
  const [formError, setFormError] = useState("");
  const updateAccountMutation = useUpdateAccount();

  const form = useForm({
    defaultValues: {
      accountCode: account?.accountCode || "",
      accountName: account?.accountName || "",
      type: account?.type || "ASSET",
      parentId: account?.parentId || "",
      isActive: account?.isActive ?? true,
    },
    onSubmit: async ({ value }) => {
      if (!account) return;
      setFormError("");
      try {
        await updateAccountMutation.mutateAsync({
          id: account.id,
          data: {
            accountCode: value.accountCode.trim(),
            accountName: value.accountName.trim(),
            type: value.type,
            parentId: value.parentId || null,
            isActive: value.isActive,
          },
        });
        toast.success(
          `Account "${value.accountName.trim()}" updated successfully`,
        );
        onClose();
      } catch (err: any) {
        setFormError(err.message || "Failed to update account");
      }
    },
  });

  useEffect(() => {
    if (account) {
      setFormError("");
      form.reset({
        accountCode: account.accountCode,
        accountName: account.accountName,
        type: account.type,
        parentId: account.parentId || "",
        isActive: account.isActive,
      });
    }
  }, [account]);

  if (!account) return null;

  return (
    <Modal
      isOpen={Boolean(account)}
      onClose={onClose}
      title={`Edit Account: ${account.accountCode}`}
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
              placeholder="Account name"
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
                ...accounts
                  .filter((a) => a.id !== account.id)
                  .map((a) => ({
                    value: a.id,
                    label: `${a.accountCode} - ${a.accountName}`,
                  })),
              ]}
            />
          )}
        </form.Field>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="isActiveToggle"
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            checked={form.state.values.isActive}
            onChange={(e) => form.setFieldValue("isActive", e.target.checked)}
          />
          <label
            htmlFor="isActiveToggle"
            className="text-xs font-semibold text-slate-700 cursor-pointer"
          >
            Account is Active (Enabled for Journal Postings)
          </label>
        </div>

        <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <FormSubmit
            form={form}
            variant="primary"
            size="sm"
            loading={updateAccountMutation.isPending}
            className="bg-agm-green hover:bg-agm-green-2 text-white font-bold cursor-pointer"
          >
            Update Account
          </FormSubmit>
        </div>
      </form>
    </Modal>
  );
}
