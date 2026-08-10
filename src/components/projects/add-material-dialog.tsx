"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Boxes, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsumableItem } from "@/types/inventory";

export type MaterialFormInput = {
  consumableId: string;
  quantity: number;
  notes: string;
};

export function AddMaterialDialog({
  isOpen,
  items,
  loadingItems,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  items: ConsumableItem[];
  loadingItems?: boolean;
  onClose: () => void;
  onSubmit: (input: MaterialFormInput) => void | Promise<void>;
}) {
  const available = useMemo(
    () => items.filter((i) => i.currentQty > 0),
    [items]
  );
  const [consumableId, setConsumableId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setConsumableId(available[0]?.id ?? "");
    setQuantity(1);
    setNotes("");
    setError("");
    setIsSubmitting(false);
  }, [isOpen, available]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const selected = available.find((i) => i.id === consumableId) ?? null;

  const fieldClass = cn(
    "w-full h-9 px-3 text-xs bg-bg-subtle border border-border rounded-lg text-text",
    "focus:outline-none focus:ring-2 focus:ring-accent focus:bg-bg transition-colors"
  );
  const labelClass = "block text-[11px] font-bold text-text-secondary mb-1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      setError("Select an inventory item with available stock.");
      return;
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }
    if (quantity > selected.currentQty) {
      setError(
        `Only ${selected.currentQty} ${selected.unit} available in stock.`
      );
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit({
        consumableId: selected.id,
        quantity,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to charge materials."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="absolute inset-0"
        onClick={isSubmitting ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-bg border border-border rounded-xl shadow-2xl z-10 overflow-hidden my-4"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-subtle/50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Boxes className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text">Use inventory material</h2>
              <p className="text-[11px] text-text-secondary">
                Deducts stock and costs via purchase lots (FIFO)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-text-secondary hover:bg-border cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label htmlFor="mat-item" className={labelClass}>
              Consumable *
            </label>
            <select
              id="mat-item"
              value={consumableId}
              onChange={(e) => setConsumableId(e.target.value)}
              disabled={loadingItems || available.length === 0}
              className={cn(fieldClass, "cursor-pointer")}
            >
              {available.length === 0 && (
                <option value="">No stocked items</option>
              )}
              {available.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.itemCode}) — {i.currentQty} {i.unit}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="p-3 rounded-lg border border-border bg-bg-subtle text-[11px] space-y-1">
              <div className="flex justify-between text-text-secondary">
                <span>On hand</span>
                <span className="font-bold text-text">
                  {selected.currentQty} {selected.unit}
                </span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Costing</span>
                <span className="text-text">
                  FIFO from restock lots · older stock first
                </span>
              </div>
              {selected.supplier && (
                <div className="flex justify-between text-text-secondary">
                  <span>Last supplier label</span>
                  <span className="text-text">{selected.supplier}</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label htmlFor="mat-qty" className={labelClass}>
              Quantity to use *
            </label>
            <input
              id="mat-qty"
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="mat-notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="mat-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={cn(fieldClass, "h-auto py-2 resize-y min-h-14")}
              placeholder="Optional reference for this usage…"
            />
          </div>

          <p className="text-[10px] text-text-secondary">
              Stock is deducted immediately. Deleting the material line restores stock
              and remaining lot quantities.
            </p>

          {error && (
            <p className="text-xs text-status-outofservice-text bg-status-outofservice-bg/10 border border-status-outofservice-bg/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-bold rounded-lg border border-border cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || available.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-bold rounded-lg bg-accent text-accent-foreground cursor-pointer disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              {isSubmitting ? "Charging…" : "Charge to project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
