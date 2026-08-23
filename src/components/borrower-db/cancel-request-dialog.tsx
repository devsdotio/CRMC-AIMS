"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatItemDescription } from "@/lib/sanitize-display";
import type { PortalBorrowRequest } from "./types";

interface CancelRequestDialogProps {
  request: PortalBorrowRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}

export function CancelRequestDialog({
  request,
  open,
  onOpenChange,
  onConfirm,
}: CancelRequestDialogProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    if (isCancelling) return;
    setIsCancelling(true);
    try {
      await onConfirm();
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-dialog-title"
      aria-describedby="cancel-dialog-desc"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !isCancelling && onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-xl bg-card border border-border shadow-2xl p-6 space-y-4"
        )}
      >
        <div className="space-y-1">
          <h2
            id="cancel-dialog-title"
            className="text-base font-bold text-text"
          >
            Cancel Borrow Request?
          </h2>
          <p id="cancel-dialog-desc" className="text-sm text-text-secondary">
            Are you sure you want to cancel this request? This action cannot be
            undone.
          </p>
        </div>

        <div className="rounded-lg bg-bg-subtle border border-border px-3 py-2 text-sm max-h-40 overflow-y-auto">
          <p className="font-mono text-xs text-text-secondary mb-1">
            {request.requestCode}
          </p>
          <div className="space-y-1">
            {request.items?.map((item, idx) => (
              <p key={idx} className="font-semibold text-text">
                {formatItemDescription(item.itemDescription, item.category, item.itemType)}
                <span className="ml-2 text-xs font-normal text-text-secondary">
                  × {item.quantity}{" "}
                  {item.itemType === "consumable" ? "unit(s)" : "item(s)"}
                </span>
              </p>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isCancelling}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            Keep Request
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isCancelling}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-status-outofservice-bg text-status-outofservice-text hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-status-outofservice-bg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCancelling && <Loader2 className="h-4 w-4 animate-spin" />}
            {isCancelling ? "Cancelling…" : "Yes, Cancel Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
