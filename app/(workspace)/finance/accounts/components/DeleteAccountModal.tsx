"use client";

import { ChartOfAccount } from "@/lib/hooks/api-hooks";
import { Modal, Button } from "@/components/ui";

interface DeleteAccountModalProps {
  account: ChartOfAccount | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
}

export function DeleteAccountModal({
  account,
  onClose,
  onConfirm,
  isPending,
}: DeleteAccountModalProps) {
  if (!account) return null;

  return (
    <Modal
      isOpen={Boolean(account)}
      onClose={onClose}
      title="Archive or Delete Account"
      maxWidth="sm"
    >
      <div className="space-y-4 text-xs">
        <p className="text-slate-600">
          Are you sure you want to remove{" "}
          <strong className="text-slate-900">
            {account.accountCode} - {account.accountName}
          </strong>
          ?
        </p>
        <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
          If this account has historical journal transactions, it will be safely{" "}
          <strong>archived (marked inactive)</strong> so historical financial
          statements remain balanced. If it has no transactions, it will be
          permanently deleted.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onConfirm}
            loading={isPending}
          >
            Confirm Remove
          </Button>
        </div>
      </div>
    </Modal>
  );
}
