"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatItemDescription } from "@/lib/sanitize-display";
import type { BorrowRequest } from "@/types/borrow-requests";
import type { ReleaseBorrowRequestPayload } from "@/features/borrow-requests/client/borrow-requests-api";

export interface ReleaseDialogProps {
  request: BorrowRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    request: BorrowRequest,
    payload: ReleaseBorrowRequestPayload
  ) => Promise<void>;
}

export function ReleaseDialog({
  request,
  isOpen,
  onClose,
  onConfirm,
}: ReleaseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickedUpBy, setPickedUpBy] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && request) {
      setPickedUpBy(request.requesterName || "");
      setNote("");
      setError("");
    }
  }, [isOpen, request]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickedUpBy.trim()) {
      setError("Name is required");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await onConfirm(request, {
        pickedUpBy: pickedUpBy.trim(),
        note: note.trim() || undefined,
      });

      setPickedUpBy("");
      setNote("");
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to release item. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div
        className="absolute inset-0"
        onClick={() => !isSubmitting && onClose()}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg max-h-[90vh] bg-bg rounded-xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-border"
      >
        <div className="px-6 py-4.5 border-b border-border bg-bg-subtle/50 shrink-0">
          <h2 className="text-base font-bold text-text">Release Request</h2>
          <p className="mt-0.5 text-xs text-text-secondary">
            Releasing {request.requestCode} ·{" "}
            {request.items.map((i) => formatItemDescription(i.itemDescription, i.category, i.itemType)).join(", ")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 flex flex-col gap-4.5 overflow-y-auto flex-1">
            <div className="space-y-1.5">
              <label
                htmlFor="pickedUpBy"
                className="text-xs font-bold uppercase tracking-wider text-text-secondary"
              >
                Picked Up By <span className="text-status-outofservice-text">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-text-secondary/60" />
                </div>
                <input
                  id="pickedUpBy"
                  type="text"
                  placeholder="Enter full name of recipient"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full pl-9 pr-4 py-2 bg-bg border border-border rounded-lg text-sm text-text placeholder:text-text-secondary/50",
                    "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-shadow",
                    error &&
                      !pickedUpBy.trim() &&
                      "border-status-outofservice-bg focus:ring-status-outofservice-bg"
                  )}
                  value={pickedUpBy}
                  onChange={(e) => setPickedUpBy(e.target.value)}
                />
              </div>
              {error && !pickedUpBy.trim() && (
                <p className="text-xs font-medium text-status-outofservice-text">
                  {error}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="note"
                className="text-xs font-bold uppercase tracking-wider text-text-secondary"
              >
                Release Notes (Optional)
              </label>
              <textarea
                id="note"
                placeholder="Any comments or condition notes upon release…"
                disabled={isSubmitting}
                className={cn(
                  "w-full px-3.5 py-2 bg-bg border border-border rounded-lg text-sm text-text placeholder:text-text-secondary/50 resize-none h-20",
                  "focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-shadow"
                )}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {error && pickedUpBy.trim() && (
              <div className="p-3 rounded-lg bg-status-outofservice-bg/10 border border-status-outofservice-bg/30 text-xs text-status-outofservice-text flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-bg-subtle/50 border-t border-border flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text hover:bg-bg-subtle rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center min-w-32 px-4 py-2 bg-accent text-accent-foreground text-xs font-bold rounded-lg shadow-xs hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Releasing…
                </>
              ) : (
                "Release Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
