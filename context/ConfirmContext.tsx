"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  TrashIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  CloseIcon,
} from "@/components/icons";
import { Button } from "@/components/ui";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary" | "info";
  icon?: "trash" | "warning" | "question" | "check";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

let globalConfirmFn:
  ((options: ConfirmOptions | string) => Promise<boolean>) | null = null;

export const confirmModal = (
  options: ConfirmOptions | string,
): Promise<boolean> => {
  if (globalConfirmFn) {
    return globalConfirmFn(options);
  }
  const msg = typeof options === "string" ? options : options.message;
  return Promise.resolve(
    typeof window !== "undefined" ? window.confirm(msg) : true,
  );
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (val: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string) => {
    return new Promise<boolean>((resolve) => {
      const normalized: ConfirmOptions =
        typeof options === "string"
          ? {
              title: "Please Confirm",
              message: options,
              confirmText: "Confirm",
              cancelText: "Cancel",
              variant: options.toLowerCase().includes("delete")
                ? "danger"
                : "primary",
            }
          : {
              title:
                options.title ||
                (options.variant === "danger"
                  ? "Delete Confirmation"
                  : "Please Confirm"),
              message: options.message,
              confirmText:
                options.confirmText ||
                (options.variant === "danger" ? "Delete" : "Confirm"),
              cancelText: options.cancelText || "Cancel",
              variant: options.variant || "primary",
              icon: options.icon,
            };

      setDialogState({
        isOpen: true,
        options: normalized,
        resolve,
      });
    });
  }, []);

  globalConfirmFn = confirm;

  const handleClose = useCallback(
    (result: boolean) => {
      if (dialogState) {
        dialogState.resolve(result);
        setDialogState(null);
      }
    },
    [dialogState],
  );

  useEffect(() => {
    if (!dialogState?.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialogState?.isOpen, handleClose]);

  const currentOpts = dialogState?.options;
  const isDanger = currentOpts?.variant === "danger";
  const isWarning = currentOpts?.variant === "warning";
  const isCheck = currentOpts?.icon === "check";

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {dialogState?.isOpen && currentOpts && (
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-10 sm:pt-16 px-4 bg-slate-900/35 backdrop-blur-[2px] transition-all animate-in fade-in duration-150"
          onClick={() => handleClose(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-900/15 border border-slate-200/90 overflow-hidden transform transition-all duration-150 animate-in zoom-in-95 slide-in-from-top-3"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isDanger
                      ? "bg-rose-50 text-rose-600 border border-rose-100"
                      : isWarning
                        ? "bg-amber-50 text-amber-600 border border-amber-100"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  }`}
                >
                  {isDanger ? (
                    <TrashIcon size={16} />
                  ) : isWarning ? (
                    <AlertTriangleIcon size={16} />
                  ) : isCheck ? (
                    <CheckCircle2Icon size={16} />
                  ) : (
                    <AlertCircleIcon size={16} />
                  )}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                    {currentOpts.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {currentOpts.message}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleClose(false)}
                  className="p-1.5 h-auto text-slate-400 hover:text-slate-600 rounded-lg shrink-0 -mt-0.5 -mr-1"
                  aria-label="Close dialog"
                  icon={<CloseIcon size={14} />}
                />
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleClose(false)}
              >
                {currentOpts.cancelText || "Cancel"}
              </Button>
              <Button
                type="button"
                variant={isDanger ? "danger" : "primary"}
                size="sm"
                onClick={() => handleClose(true)}
              >
                {currentOpts.confirmText || "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    return { confirm: confirmModal };
  }
  return context;
}
