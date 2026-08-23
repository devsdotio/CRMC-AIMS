"use client";

import { useState, useEffect, useRef } from "react";
import { X, AlertCircle, CheckCircle2, Loader2, User, Building2, FileText, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategoryStyleMap } from "@/features/categories/client/use-categories";
import { formatItemDescription } from "@/lib/sanitize-display";
import type { BorrowRequest } from "@/types/borrow-requests";

export interface ApproveRejectDialogProps {
  request: BorrowRequest | null;
  mode: "approve" | "reject" | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (request: BorrowRequest, mode: "approve" | "reject", reason?: string) => void | Promise<void>;
}

interface ApproveRejectDialogFormProps {
  request: BorrowRequest;
  mode: "approve" | "reject";
  onClose: () => void;
  onConfirm: ApproveRejectDialogProps["onConfirm"];
}

function ApproveRejectDialogForm({
  request,
  mode,
  onClose,
  onConfirm,
}: ApproveRejectDialogFormProps) {
  const { getCategoryStyle } = useCategoryStyleMap();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isApprove = mode === "approve";

  useEffect(() => {
    if (!isApprove) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isApprove]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApprove && !reason.trim()) {
      setError("Please provide a brief reason for rejecting this request.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onConfirm(request, mode, reason.trim());
      onClose();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="relative w-full max-w-md rounded-xl border border-border bg-bg p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full shrink-0",
                isApprove
                  ? "bg-status-active-bg/20 text-status-active-text"
                  : "bg-status-outofservice-bg/20 text-status-outofservice-text"
              )}
            >
              {isApprove ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 id="dialog-title" className="text-base font-bold text-text leading-tight">
                {isApprove ? "Approve Borrow Request" : "Reject Borrow Request"}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5 font-mono">
                {request.requestCode}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-md text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Request summary */}
          <div className="rounded-lg border border-border bg-bg-subtle/50 overflow-hidden text-xs">
            {/* Requester row */}
            <div className="flex items-center gap-4 px-3.5 py-2.5 border-b border-border">
              <div className="flex items-center gap-1.5 min-w-0">
                <User className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                <span className="text-[10px] font-semibold uppercase text-text-secondary">Requester:</span>
                <span className="font-bold text-text truncate">{request.requesterName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary shrink-0 ml-auto">
                <Building2 className="h-3.5 w-3.5" />
                <span className="text-[10px] font-semibold uppercase">Dept:</span>
                <span className="font-medium text-text">{request.department}</span>
              </div>
            </div>
            {/* Items */}
            <div className="divide-y divide-border">
              {request.items.map((item, idx) => {
                const catStyle = getCategoryStyle(item.category);
                const desc = formatItemDescription(item.itemDescription, catStyle.label, item.itemType);
                return (
                  <div key={idx} className={cn("flex items-center gap-2.5 px-3.5 py-2", idx % 2 === 1 && "bg-bg-subtle/60")}>
                    <span className="flex items-center justify-center h-5 min-w-5 px-1 rounded bg-bg border border-border text-[10px] font-bold text-text shrink-0">
                      &times;{item.quantity}
                    </span>
                    <span className="text-text font-medium truncate flex-1 min-w-0">{desc}</span>
                    <span className={cn("rounded px-1.5 py-px text-[9px] font-bold uppercase shrink-0", catStyle.bg, catStyle.text)}>
                      {catStyle.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Purpose + return date row */}
            <div className="px-3.5 py-2.5 border-t border-border bg-primary/5 space-y-1.5">
              <div className="flex items-start gap-2">
                <FileText className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold uppercase text-text-secondary block mb-0.5">Purpose</span>
                  <p className="text-text font-medium leading-snug line-clamp-2">{request.purpose}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <CalendarClock className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-semibold uppercase text-text-secondary">Return:</span>
                <span className="text-primary font-bold">{request.expectedReturnDate}</span>
              </div>
            </div>
          </div>

          {!isApprove ? (
            <div className="space-y-1.5">
              <label htmlFor="rejection-reason" className="block text-xs font-semibold text-text">
                Reason for Rejection <span className="text-accent">*</span>
              </label>
              <textarea
                id="rejection-reason"
                ref={textareaRef}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError("");
                }}
                rows={3}
                placeholder="State reason (e.g. Reserved for maintenance, Conflict with schedule…)"
                className={cn(
                  "w-full p-2.5 text-xs bg-bg border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent",
                  error ? "border-status-outofservice-bg" : "border-border"
                )}
              />
              {error && <p className="text-[11px] font-medium text-status-outofservice-text">{error}</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-text-secondary">
                Are you sure you want to approve this request? The requester will be notified to pick up the asset.
              </p>
              {error && <p className="text-[11px] font-medium text-status-outofservice-text">{error}</p>}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-text-secondary hover:text-text rounded-md border border-border bg-bg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors shadow-xs",
                isSubmitting ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:opacity-90",
                isApprove
                  ? "bg-accent text-accent-foreground"
                  : "border border-status-outofservice-bg bg-status-outofservice-bg text-white"
              )}
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isApprove 
                ? (isSubmitting ? "Approving..." : "Confirm Approval") 
                : (isSubmitting ? "Rejecting..." : "Confirm Rejection")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ApproveRejectDialog({
  request,
  mode,
  isOpen,
  onClose,
  onConfirm,
}: ApproveRejectDialogProps) {
  if (!isOpen || !request || !mode) return null;

  return (
    <ApproveRejectDialogForm
      key={`${request.id}-${mode}`}
      request={request}
      mode={mode}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
