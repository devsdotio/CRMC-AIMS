"use client";

import { useState, useEffect } from "react";
import { X, SlidersHorizontal, AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsumableItem } from "./types";

export interface AdjustStockDialogProps {
  item: ConsumableItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmAdjust: (itemId: string, adjustmentDelta: number, reason: string, notes?: string) => void;
}

const ADJUSTMENT_REASONS = [
  "Damaged / Expired Goods",
  "Lost / Missing Stock",
  "Physical Count Correction",
  "Department Direct Distribution",
  "Other Accountability Reason",
];

export function AdjustStockDialog({
  item,
  isOpen,
  onClose,
  onConfirmAdjust,
}: AdjustStockDialogProps) {
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(-1);
  const [reason, setReason] = useState(ADJUSTMENT_REASONS[0]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && item) {
      setAdjustmentDelta(-1);
      setReason(ADJUSTMENT_REASONS[0]);
      setNotes("");
      setError("");
    }
  }, [isOpen, item]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const newExpectedQty = item.currentQty + adjustmentDelta;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustmentDelta === 0) {
      setError("Adjustment change cannot be zero.");
      return;
    }
    if (newExpectedQty < 0) {
      setError("Adjustment cannot reduce current stock below zero.");
      return;
    }
    if (!reason.trim()) {
      setError("A reason is mandatory for auditing stock adjustments.");
      return;
    }

    onConfirmAdjust(item.id, adjustmentDelta, reason.trim(), notes.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Dialog Window */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjust-dialog-title"
        className="relative w-full max-w-md rounded-2xl border border-border bg-bg p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 space-y-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-status-repair-bg/20 text-status-repair-text shrink-0">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h3 id="adjust-dialog-title" className="text-base font-bold text-text leading-tight">
                Manual Stock Correction
              </h3>
              <p className="text-xs text-text-secondary mt-0.5 font-mono">
                {item.itemCode} · {item.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close adjust dialog"
            className="p-1 rounded-md text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current vs New Quantity Preview */}
        <div className="p-3.5 rounded-xl border border-border bg-bg-subtle text-xs space-y-1.5">
          <div className="flex justify-between text-text-secondary">
            <span>Current Recorded Stock:</span>
            <span className="font-bold text-text">{item.currentQty} {item.unit}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Adjustment Change:</span>
            <span className={cn("font-bold", adjustmentDelta < 0 ? "text-status-outofservice-text" : "text-status-active-text")}>
              {adjustmentDelta > 0 ? `+${adjustmentDelta}` : adjustmentDelta} {item.unit}
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-border font-bold text-text">
            <span>New Calculated Total:</span>
            <span className="text-accent">{newExpectedQty} {item.unit}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity Change Delta Input */}
          <div className="space-y-1">
            <label htmlFor="adjustment-delta-input" className="block text-xs font-semibold text-text">
              Stock Quantity Change (+ or -) <span className="text-accent">*</span>
            </label>
            <input
              id="adjustment-delta-input"
              type="number"
              value={adjustmentDelta}
              onChange={(e) => {
                setAdjustmentDelta(Number(e.target.value));
                if (error) setError("");
              }}
              placeholder="e.g. -5 or +10"
              className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg font-bold text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="text-[11px] text-text-secondary/70">Use negative values (e.g. -5) for lost/damaged stock.</p>
          </div>

          {/* MANDATORY Reason Select */}
          <div className="space-y-1">
            <label htmlFor="adjustment-reason-select" className="block text-xs font-bold text-text">
              Accountability Reason <span className="text-accent">*</span>
            </label>
            <select
              id="adjustment-reason-select"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {ADJUSTMENT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label htmlFor="adjust-notes-input" className="block text-xs font-semibold text-text">
              Explanation & Incident Details
            </label>
            <textarea
              id="adjust-notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Provide context for audit records…"
              className="w-full p-2.5 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded bg-status-outofservice-bg/10 border border-status-outofservice-bg/20 text-status-outofservice-text font-bold text-xs flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text rounded-md border border-border bg-bg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              Confirm Stock Correction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
