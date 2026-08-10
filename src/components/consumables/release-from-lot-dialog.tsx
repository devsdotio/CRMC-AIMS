"use client";

import { useEffect, useMemo, useState } from "react";
import { PackageMinus, X } from "lucide-react";

import type { ConsumableItem } from "@/types/inventory";
import type { PurchaseLot } from "@/types/purchase-lots";
import { formatPhp } from "@/components/projects/format-money";

function lotPayload(lot: PurchaseLot) {
  return lot.qrPayload?.trim() || `CRMC-AIMS-LOT:${lot.lotCode}`;
}

export type ReleaseFromLotInput = {
  code: string;
  quantity: number;
  recipientName?: string;
  reason?: string;
  notes?: string;
};

export interface ReleaseFromLotDialogProps {
  isOpen: boolean;
  item: ConsumableItem | null;
  /** Lots available for this item (quantityRemaining > 0 preferred). */
  lots: PurchaseLot[];
  /** Preselect a lot when opened from a row action. */
  initialLot?: PurchaseLot | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (input: ReleaseFromLotInput) => void | Promise<void>;
}

/**
 * Staff release form for consumables via supplier purchase-lot QR / lot code.
 * Quantity is entered after scan/selection; cost is taken from the lot snapshot.
 */
export function ReleaseFromLotDialog({
  isOpen,
  item,
  lots,
  initialLot = null,
  isSubmitting = false,
  onClose,
  onConfirm,
}: ReleaseFromLotDialogProps) {
  const availableLots = useMemo(
    () => lots.filter((lot) => lot.quantityRemaining > 0),
    [lots]
  );

  const [lotId, setLotId] = useState("");
  const [codeOverride, setCodeOverride] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [recipientName, setRecipientName] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const preferred =
      initialLot?.id && availableLots.some((l) => l.id === initialLot.id)
        ? initialLot.id
        : availableLots[0]?.id ?? "";
    setLotId(preferred);
    setCodeOverride("");
    setQuantity(1);
    setRecipientName("");
    setReason("");
    setNotes("");
    setError("");
  }, [isOpen, initialLot, availableLots]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const selected = availableLots.find((l) => l.id === lotId) ?? null;
  const maxQty = selected?.quantityRemaining ?? item.currentQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const code =
      codeOverride.trim() ||
      (selected ? lotPayload(selected) : "") ||
      selected?.lotCode ||
      "";

    if (!code) {
      setError("Select a stock lot or paste a lot QR / lot code.");
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("Quantity must be a positive whole number.");
      return;
    }
    if (selected && quantity > selected.quantityRemaining) {
      setError(
        `Only ${selected.quantityRemaining} ${item.unit} remaining on this lot.`
      );
      return;
    }
    if (quantity > item.currentQty) {
      setError(`Only ${item.currentQty} ${item.unit} available in stock.`);
      return;
    }

    try {
      await onConfirm({
        code,
        quantity,
        recipientName: recipientName.trim() || undefined,
        reason: reason.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Release failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="release-lot-heading"
        className="w-full max-w-md rounded-xl border border-border bg-bg shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-subtle/50">
          <div className="flex items-center gap-2">
            <PackageMinus className="h-4 w-4 text-accent" />
            <div>
              <h2
                id="release-lot-heading"
                className="text-sm font-bold text-text"
              >
                Release from supplier lot
              </h2>
              <p className="text-[11px] text-text-secondary">
                {item.itemCode} · {item.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:bg-border cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            Scan or select a purchase-lot tag (one QR per supplier batch). Cost
            and supplier from that lot are frozen on the stock log for
            reporting.
          </p>

          {availableLots.length > 0 ? (
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                Stock lot
              </span>
              <select
                value={lotId}
                onChange={(e) => {
                  setLotId(e.target.value);
                  setCodeOverride("");
                }}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text"
              >
                {availableLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.lotCode} · {lot.supplierName || "No supplier"} ·{" "}
                    {lot.quantityRemaining} left · {formatPhp(Number(lot.unitCost))}
                    /{item.unit}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="text-xs text-status-repair-text bg-status-repair-bg/20 border border-status-repair-bg/40 rounded-lg p-3">
              No open purchase lots with remaining stock. Restock with a supplier
              and unit cost first, or paste a lot code below if stock exists
              without remaining-lot balance.
            </p>
          )}

          <label className="block space-y-1">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
              Lot QR / code (optional override)
            </span>
            <input
              value={codeOverride}
              onChange={(e) => setCodeOverride(e.target.value)}
              placeholder="CRMC-AIMS-LOT:… or LOT-…"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs font-mono text-text"
            />
          </label>

          {selected && (
            <div className="rounded-lg border border-border bg-bg-subtle p-3 text-[11px] space-y-1">
              <div className="flex justify-between gap-2">
                <span className="text-text-secondary">Supplier</span>
                <span className="font-semibold text-text">
                  {selected.supplierName || "—"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-text-secondary">Unit cost (frozen)</span>
                <span className="font-semibold text-text">
                  {formatPhp(Number(selected.unitCost))}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-text-secondary">Remaining on lot</span>
                <span className="font-semibold text-text">
                  {selected.quantityRemaining} {item.unit}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                Quantity
              </span>
              <input
                type="number"
                min={1}
                max={maxQty}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
                Released to
              </span>
              <input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Recipient name"
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
              Reason
            </span>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Office request / department issue"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text resize-none"
            />
          </label>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-border text-text hover:bg-bg-subtle cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Releasing…" : "Release stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
