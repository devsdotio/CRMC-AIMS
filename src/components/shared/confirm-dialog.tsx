"use client";

import { useEffect } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "warning";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "destructive",
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const isDestructive = variant === "destructive";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity">
      <div
        className="absolute inset-0"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md rounded-xl border border-border bg-bg p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
                isDestructive
                  ? "bg-status-outofservice-bg/15 text-status-outofservice-text"
                  : "bg-status-repair-bg/15 text-status-repair-text"
              )}
            >
              {isDestructive ? (
                <Trash2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3
                id="confirm-dialog-title"
                className="text-base font-bold text-text leading-tight"
              >
                {title}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-9 px-4 text-xs font-bold text-text rounded-lg border border-border bg-bg hover:bg-bg-subtle transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isLoading}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-4 text-xs font-bold rounded-lg transition-opacity cursor-pointer disabled:opacity-50 shadow-xs",
              isDestructive
                ? "bg-status-outofservice-bg text-white hover:opacity-90"
                : "bg-accent text-accent-foreground hover:opacity-90"
            )}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
