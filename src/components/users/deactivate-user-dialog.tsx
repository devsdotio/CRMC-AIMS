"use client";
/* eslint-disable react/no-unescaped-entities */

import { useEffect } from "react";
import { X, UserX } from "lucide-react";
import type { UserAccount } from "@/types/users";

export interface DeactivateUserDialogProps {
  user: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDeactivate: (user: UserAccount) => void;
}

export function DeactivateUserDialog({
  user,
  isOpen,
  onClose,
  onConfirmDeactivate,
}: DeactivateUserDialogProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Dialog Window */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="deactivate-dialog-title"
        className="relative w-full max-w-md rounded-2xl border border-border bg-bg p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 space-y-4"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-status-retired-bg/20 text-status-retired-text shrink-0">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <h3 id="deactivate-dialog-title" className="text-base font-bold text-text leading-tight">
                Deactivate Staff Account
              </h3>
              <p className="text-xs text-text-secondary mt-0.5 font-mono">
                {user.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close deactivate dialog"
            className="p-1 rounded-md text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Confirmation Body Summary */}
        <div className="p-4 rounded-xl border border-border bg-bg-subtle text-xs space-y-2">
          <p className="text-text font-bold leading-snug">
            Are you sure you want to deactivate {user.name}'s account?
          </p>
          <ul className="list-disc list-inside space-y-1 text-text-secondary">
            <li>This account will lose system access immediately.</li>
            <li>All past approvals, releases, and maintenance logs remain in the audit trail.</li>
            <li>The account can be re-activated by an Admin at any time.</li>
          </ul>
        </div>

        {/* Action Buttons (Neutral/Outline style for caution CTA per requirement) */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text rounded-md border border-border bg-bg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDeactivate(user);
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold rounded-md border border-status-retired-bg bg-bg text-status-retired-text hover:bg-status-retired-bg/10 transition-colors cursor-pointer"
          >
            Confirm Deactivation
          </button>
        </div>
      </div>
    </div>
  );
}
