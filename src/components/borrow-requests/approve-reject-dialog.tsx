"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  User,
  Building2,
  FileText,
  CalendarClock,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategoryStyleResolver } from "@/features/categories/client/use-category-style";
import { formatItemDescription } from "@/lib/sanitize-display";
import type { BorrowRequest } from "@/types/borrow-requests";
import type { ApproveBorrowRequestPayload } from "@/features/borrow-requests/client/borrow-requests-api";

type ApproveItem = ApproveBorrowRequestPayload["items"] extends
  | (infer T)[]
  | undefined
  ? T
  : never;

export interface ApproveRejectDialogProps {
  request: BorrowRequest | null;
  mode: "approve" | "reject" | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    request: BorrowRequest,
    mode: "approve" | "reject",
    payload?: { reason?: string; approve?: ApproveBorrowRequestPayload }
  ) => void | Promise<void>;
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
  const [reason, setReason] = useState("");
  const [approveNote, setApproveNote] = useState("");
  const [items, setItems] = useState<ApproveItem[]>(() =>
    request.items
      .filter((item) => item.itemType !== "consumable" && !item.consumableId)
      .map((item) => ({
        itemDescription: item.itemDescription,
        category: item.category,
        quantity: item.quantity,
        itemType: "asset" as const,
      }))
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resolveCategoryStyle = useCategoryStyleResolver();

  const isApprove = mode === "approve";
  const isAssignable = request.requestType === "assignable";

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

  const adjustQuantity = (index: number, delta: number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const nextQty = Math.max(1, Math.min(999, item.quantity + delta));
        return { ...item, quantity: nextQty };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isApprove && !reason.trim()) {
      setError("Please provide a brief reason for rejecting this request.");
      return;
    }
    if (isApprove && items.length === 0) {
      setError("This request has no asset lines to approve.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      if (isApprove) {
        await onConfirm(request, mode, {
          approve: {
            note: approveNote.trim() || undefined,
            items,
          },
        });
      } else {
        await onConfirm(request, mode, { reason: reason.trim() });
      }
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An error occurred. Please try again."
      );
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
        className="relative w-full max-w-lg max-h-[90vh] rounded-xl border border-border bg-bg shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 flex flex-col overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-border bg-bg-subtle/50 shrink-0">
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
                {isApprove
                  ? isAssignable
                    ? "Approve Assignment Request"
                    : "Approve Borrow Request"
                  : "Reject Request"}
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="rounded-lg border border-border bg-bg-subtle/50 overflow-hidden text-xs">
              <div className="flex items-center gap-4 px-3.5 py-2.5 border-b border-border">
                <div className="flex items-center gap-1.5 min-w-0">
                  <User className="h-3.5 w-3.5 text-text-secondary shrink-0" />
                  <span className="text-[10px] font-semibold uppercase text-text-secondary">
                    Requester:
                  </span>
                  <span className="font-bold text-text truncate">
                    {request.requesterName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-text-secondary shrink-0 ml-auto">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold uppercase">Dept:</span>
                  <span className="font-medium text-text">{request.department}</span>
                </div>
              </div>

              <div className="divide-y divide-border">
                {(isApprove ? items : request.items).map((item, idx) => {
                  const catStyle = resolveCategoryStyle(item.category);
                  const desc = formatItemDescription(
                    item.itemDescription,
                    catStyle.label,
                    item.itemType ?? "asset"
                  );
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-center gap-2.5 px-3.5 py-2.5",
                        idx % 2 === 1 && "bg-bg-subtle/60"
                      )}
                    >
                      {isApprove ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => adjustQuantity(idx, -1)}
                            disabled={item.quantity <= 1 || isSubmitting}
                            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-bg text-text-secondary hover:text-text disabled:opacity-40"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-6 text-center text-xs font-bold text-text">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustQuantity(idx, 1)}
                            disabled={item.quantity >= 999 || isSubmitting}
                            className="flex h-6 w-6 items-center justify-center rounded border border-border bg-bg text-text-secondary hover:text-text disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="flex items-center justify-center h-5 min-w-5 px-1 rounded bg-bg border border-border text-[10px] font-bold text-text shrink-0">
                          &times;{item.quantity}
                        </span>
                      )}
                      <span className="text-text font-medium truncate flex-1 min-w-0">
                        {desc}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-px text-[9px] font-bold uppercase shrink-0",
                          catStyle.bg,
                          catStyle.text
                        )}
                      >
                        {catStyle.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="px-3.5 py-2.5 border-t border-border bg-primary/5 space-y-1.5">
                <div className="flex items-start gap-2">
                  <FileText className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold uppercase text-text-secondary block mb-0.5">
                      Purpose
                    </span>
                    <p className="text-text font-medium leading-snug line-clamp-2">
                      {request.purpose}
                    </p>
                  </div>
                </div>
                {request.expectedReturnDate && (
                  <div className="flex items-center gap-1.5 justify-end">
                    <CalendarClock className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-semibold uppercase text-text-secondary">
                      Return:
                    </span>
                    <span className="text-primary font-bold">
                      {request.expectedReturnDate}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {isApprove ? (
              <div className="space-y-3">
                <p className="text-xs text-text-secondary">
                  Adjust quantities if needed, then approve. Specific units will be
                  selected when the request is released.
                </p>
                <div className="space-y-1.5">
                  <label
                    htmlFor="approve-note"
                    className="block text-xs font-semibold text-text"
                  >
                    Approval note (optional)
                  </label>
                  <textarea
                    id="approve-note"
                    value={approveNote}
                    onChange={(e) => setApproveNote(e.target.value)}
                    rows={2}
                    placeholder="Any notes for the requester or audit trail…"
                    disabled={isSubmitting}
                    className="w-full p-2.5 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                  />
                </div>
                {error && (
                  <p className="text-[11px] font-medium text-status-outofservice-text">
                    {error}
                  </p>
                )}
              </div>
            ) : (
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
                {error && (
                  <p className="text-[11px] font-medium text-status-outofservice-text">
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-border bg-bg-subtle/50 shrink-0">
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
                ? isSubmitting
                  ? "Approving…"
                  : "Confirm Approval"
                : isSubmitting
                  ? "Rejecting…"
                  : "Confirm Rejection"}
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
