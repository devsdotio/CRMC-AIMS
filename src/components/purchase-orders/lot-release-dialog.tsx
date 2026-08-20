"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  Package,
  AlertCircle,
  CheckCircle2,
  Loader2,
  DollarSign,
  User,
} from "lucide-react";
import type { PurchaseLot } from "@/types/purchase-lots";
import { useReleaseFromLotMutation } from "@/features/purchase-lots/client/use-purchase-lots";
import { useToast } from "@/components/providers/toast-context";
import { cn } from "@/lib/utils";

interface LotReleaseDialogProps {
  lot: PurchaseLot | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LotReleaseDialog({
  lot,
  isOpen,
  onClose,
  onSuccess,
}: LotReleaseDialogProps) {
  const toast = useToast();
  const releaseMutation = useReleaseFromLotMutation();

  const [quantity, setQuantity] = useState<number>(1);
  const [recipientName, setRecipientName] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && lot) {
      setQuantity(1);
      setRecipientName("");
      setReason("");
      setErrorMsg(null);
    }
  }, [isOpen, lot]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !lot) return null;

  const maxQty = lot.quantityRemaining;
  const unitCostNum = parseFloat(lot.unitCost) || 0;
  const totalReleaseValue = quantity * unitCostNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (quantity <= 0) {
      setErrorMsg("Please enter a valid quantity of at least 1.");
      return;
    }

    if (quantity > maxQty) {
      setErrorMsg(`Cannot release more than available lot balance (${maxQty} units).`);
      return;
    }

    try {
      await releaseMutation.mutateAsync({
        code: lot.lotCode,
        quantity,
        recipientName: recipientName.trim() || undefined,
        reason: reason.trim() || undefined,
      });

      toast.success(
        `Successfully released ${quantity}x ${lot.itemName} from lot ${lot.lotCode}.`
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to release stock from lot.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="release-dialog-title"
        className="relative w-full max-w-md rounded-2xl border border-border bg-bg shadow-2xl z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-subtle/50">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-category-transport-bg" />
            <h2 id="release-dialog-title" className="text-sm font-bold text-text">
              Direct Stock Release from Lot
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-text-secondary hover:text-text hover:bg-border/60 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-status-outofservice-bg/10 border border-status-outofservice-bg/30 text-status-outofservice-text flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Lot Summary Card */}
          <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-text bg-bg-subtle px-1.5 py-0.5 rounded border border-border">
                {lot.lotCode}
              </span>
              <span className="font-bold text-status-active-text">
                {lot.quantityRemaining} units available
              </span>
            </div>
            <p className="text-sm font-bold text-text">{lot.itemName}</p>
            <div className="flex items-center justify-between text-text-secondary text-[11px] pt-1 border-t border-border">
              <span>Cost snapshot:</span>
              <span className="font-mono font-medium text-text">
                ₱{unitCostNum.toLocaleString("en-US", { minimumFractionDigits: 2 })} / unit
              </span>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="release-qty" className="font-semibold text-text">
                Quantity to Release <span className="text-accent">*</span>
              </label>
              <span className="text-[11px] text-text-secondary">
                Max: <strong>{maxQty}</strong>
              </span>
            </div>
            <input
              id="release-qty"
              type="number"
              min={1}
              max={maxQty}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-subtle text-text text-sm font-bold focus:bg-bg focus:ring-1 focus:ring-ring focus:outline-hidden"
            />
          </div>

          {/* Recipient Name */}
          <div className="space-y-1.5">
            <label htmlFor="release-recipient" className="font-semibold text-text">
              Recipient / Department / Requester
            </label>
            <input
              id="release-recipient"
              type="text"
              placeholder="e.g. Dr. Santos / Pharmacy Ward"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-subtle text-text text-xs focus:bg-bg focus:ring-1 focus:ring-ring focus:outline-hidden"
            />
          </div>

          {/* Reason / Notes */}
          <div className="space-y-1.5">
            <label htmlFor="release-reason" className="font-semibold text-text">
              Disbursement Purpose / Notes
            </label>
            <textarea
              id="release-reason"
              rows={2}
              placeholder="e.g. Emergency ER replenishment"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg-subtle text-text text-xs focus:bg-bg focus:ring-1 focus:ring-ring focus:outline-hidden resize-none"
            />
          </div>

          {/* Financial Calculation summary */}
          <div className="p-3 rounded-lg bg-bg-subtle/70 border border-border flex items-center justify-between">
            <span className="text-text-secondary font-medium">Total Cost Deduction:</span>
            <span className="font-mono font-bold text-status-active-text text-sm">
              ₱{totalReleaseValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-border bg-bg hover:bg-bg-subtle text-text transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={releaseMutation.isPending || quantity <= 0 || quantity > maxQty}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-category-transport-bg text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              {releaseMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Confirm Dispatch</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
