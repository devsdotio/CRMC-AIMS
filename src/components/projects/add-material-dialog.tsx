"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Boxes, Check, Hash, Info, AlertCircle, Loader2 } from "lucide-react";
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
  const available = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    return list.filter((i) => i.currentQty > 0);
  }, [items]);
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
        aria-labelledby="material-form-heading"
        className="relative w-full max-w-md bg-bg border border-border rounded-xl shadow-2xl z-10 overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-subtle/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent shrink-0">
              <Boxes className="h-4 w-4" />
            </div>
            <div>
              <h2 id="material-form-heading" className="text-sm font-bold text-text">
                Use Inventory Material
              </h2>
              <p className="text-[11px] text-text-secondary">
                Deducts inventory stock and costs via purchase lots (FIFO)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-border transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Consumable Select */}
          <div>
            <label htmlFor="mat-item" className={labelClass}>
              Consumable Material <span className="text-accent">*</span>
            </label>
            <select
              id="mat-item"
              value={consumableId}
              onChange={(e) => setConsumableId(e.target.value)}
              disabled={loadingItems || available.length === 0}
              className={cn(fieldClass, "cursor-pointer")}
            >
              {available.length === 0 && (
                <option value="">No stocked items available</option>
              )}
              {available.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.itemCode}) — {i.currentQty} {i.unit} in stock
                </option>
              ))}
            </select>
          </div>

          {/* Selected Item Stock & Costing Card */}
          {selected && (
            <div className="p-3 rounded-lg border border-border bg-bg-subtle/60 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-medium">Available stock</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-active-bg/15 text-status-active-text border border-status-active-bg/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-active-bg" />
                  {selected.currentQty} {selected.unit} available
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-text-secondary">
                <span>Costing model</span>
                <span className="text-text font-medium">
                  FIFO (oldest lot unit cost charged first)
                </span>
              </div>
              {selected.supplier && (
                <div className="flex items-center justify-between text-[11px] text-text-secondary">
                  <span>Vendor reference</span>
                  <span className="text-text font-medium truncate max-w-44">{selected.supplier}</span>
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="mat-qty" className={labelClass}>
                Quantity to use <span className="text-accent">*</span>
              </label>
              {selected && (
                <span className="text-[10px] text-text-secondary">
                  Max: {selected.currentQty} {selected.unit}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
                <Hash className="h-3.5 w-3.5" />
              </span>
              <input
                id="mat-qty"
                type="number"
                min={1}
                max={selected?.currentQty}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className={cn(fieldClass, "pl-8.5 font-mono tabular-nums")}
              />
            </div>
          </div>

          {/* Notes */}
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
              placeholder="e.g. For wall repaint / electrical work in Room 204…"
            />
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-lg border border-border bg-bg-subtle/40 text-[11px] text-text-secondary">
            <Info className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
            <span>
              Stock is deducted immediately upon charging. Deleting the material line
              restores stock to active purchase lots.
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-status-outofservice-text bg-status-outofservice-bg/10 border border-status-outofservice-bg/30 rounded-lg p-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-bold rounded-lg border border-border bg-bg text-text hover:bg-bg-subtle transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || available.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-bold rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              {isSubmitting ? "Charging…" : "Charge to Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
