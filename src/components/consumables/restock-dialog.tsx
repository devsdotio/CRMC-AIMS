"use client";

import { useState, useEffect } from "react";
import { X, PlusCircle, Check } from "lucide-react";

import type { ConsumableItem } from "@/types/inventory";

export interface RestockDialogProps {
  item: ConsumableItem | null;
  allItems: ConsumableItem[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmRestock: (itemId: string, qtyReceived: number, notes?: string) => void;
}

export function RestockDialog({
  item,
  allItems,
  isOpen,
  onClose,
  onConfirmRestock,
}: RestockDialogProps) {
  const [selectedItemId, setSelectedItemId] = useState("");
  const [qtyReceived, setQtyReceived] = useState<number>(20);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setSelectedItemId(item.id);
      } else if (allItems.length > 0) {
        setSelectedItemId(allItems[0].id);
      }
      setQtyReceived(20);
      setNotes("");
      setError("");
    }
  }, [isOpen, item, allItems]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const targetItem = allItems.find((i) => i.id === selectedItemId) || item;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetItem) {
      setError("Please select a consumable item to restock.");
      return;
    }
    if (qtyReceived <= 0) {
      setError("Quantity received must be greater than zero.");
      return;
    }

    onConfirmRestock(targetItem.id, Number(qtyReceived), notes.trim() || undefined);
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
        aria-labelledby="restock-dialog-title"
        className="relative w-full max-w-md rounded-2xl border border-border bg-bg p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 space-y-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent shrink-0">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 id="restock-dialog-title" className="text-base font-bold text-text leading-tight">
                Log Incoming Restock Shipment
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Increase supply quantity & record delivery receipt
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close restock dialog"
            className="p-1 rounded-md text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Item Picker */}
          <div className="space-y-1">
            <label htmlFor="restock-item-select" className="block text-xs font-semibold text-text">
              Target Consumable Item <span className="text-accent">*</span>
            </label>
            <select
              id="restock-item-select"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {allItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.itemCode}) — Current: {i.currentQty} {i.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Current vs New Quantity Preview */}
          {targetItem && (
            <div className="p-3.5 rounded-xl border border-border bg-bg-subtle text-xs space-y-1.5">
              <div className="flex justify-between text-text-secondary">
                <span>Current Stock:</span>
                <span className="font-bold text-text">{targetItem.currentQty} {targetItem.unit}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Adding Shipment:</span>
                <span className="font-bold text-status-active-text">+{qtyReceived || 0} {targetItem.unit}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border font-bold text-text">
                <span>New Expected Total:</span>
                <span className="text-accent">{targetItem.currentQty + (Number(qtyReceived) || 0)} {targetItem.unit}</span>
              </div>
            </div>
          )}

          {/* Quantity Received Input */}
          <div className="space-y-1">
            <label htmlFor="qty-received-input" className="block text-xs font-semibold text-text">
              Quantity Received <span className="text-accent">*</span>
            </label>
            <input
              id="qty-received-input"
              type="number"
              value={qtyReceived}
              onChange={(e) => {
                setQtyReceived(Number(e.target.value));
                if (error) setError("");
              }}
              min={1}
              className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg font-bold text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* PO Reference / Supplier Notes */}
          <div className="space-y-1">
            <label htmlFor="restock-notes-input" className="block text-xs font-semibold text-text">
              PO # / Delivery Receipt Notes
            </label>
            <textarea
              id="restock-notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. PO #8841 Received via PaperLine delivery"
              className="w-full p-2.5 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {error && <p className="text-xs font-bold text-status-outofservice-text">{error}</p>}

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
              Confirm Restock Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
