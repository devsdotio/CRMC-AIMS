"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, User, Layers, Info, Check, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BorrowRequest } from "@/types/borrow-requests";
import type { ReleaseBorrowRequestPayload } from "@/features/borrow-requests/client/borrow-requests-api";
import { usePurchaseLotsQuery } from "@/features/purchase-lots/client/use-purchase-lots";
import type { PurchaseLot } from "@/types/purchase-lots";
import { formatPhp } from "@/components/projects/format-money";

export interface ReleaseDialogProps {
  request: BorrowRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    request: BorrowRequest,
    payload: ReleaseBorrowRequestPayload
  ) => Promise<void>;
}

interface LotSelectionState {
  useFifo: boolean;
  selectedLotId?: string;
}

function ConsumableLotAllocationRow({
  item,
  state,
  onChange,
}: {
  item: BorrowRequest["items"][number];
  state: LotSelectionState;
  onChange: (updated: LotSelectionState) => void;
}) {
  const { data: lots = [], isLoading } = usePurchaseLotsQuery({
    consumableId: item.consumableId,
    itemType: "consumable",
    enabled: Boolean(item.consumableId),
  });

  const availableLots = useMemo(
    () => lots.filter((lot) => lot.quantityRemaining > 0),
    [lots]
  );

  const selectedLot = availableLots.find((l) => l.id === state.selectedLotId);
  const isShortfall =
    !state.useFifo &&
    selectedLot &&
    selectedLot.quantityRemaining < item.quantity;

  return (
    <div className="rounded-lg border border-border bg-bg-subtle/40 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold text-text truncate">
            {item.itemDescription}
          </p>
          <p className="text-[11px] text-text-secondary">
            Quantity requested:{" "}
            <span className="font-semibold text-text font-mono">
              {item.quantity}
            </span>
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-status-repair-bg/15 text-status-repair-text border border-status-repair-bg/30">
          Consumable
        </span>
      </div>

      <div className="space-y-2 pt-1 border-t border-border/50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange({ useFifo: true })}
            className={cn(
              "flex-1 py-1.5 px-2.5 rounded-md text-xs font-semibold border transition-all text-center",
              state.useFifo
                ? "bg-accent text-accent-foreground border-accent shadow-xs"
                : "bg-bg text-text-secondary border-border hover:text-text hover:bg-bg-subtle"
            )}
          >
            Auto (FIFO)
          </button>
          <button
            type="button"
            disabled={availableLots.length === 0}
            onClick={() =>
              onChange({
                useFifo: false,
                selectedLotId: state.selectedLotId || availableLots[0]?.id,
              })
            }
            className={cn(
              "flex-1 py-1.5 px-2.5 rounded-md text-xs font-semibold border transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed",
              !state.useFifo
                ? "bg-accent text-accent-foreground border-accent shadow-xs"
                : "bg-bg text-text-secondary border-border hover:text-text hover:bg-bg-subtle"
            )}
          >
            Select Specific Lot ({availableLots.length})
          </button>
        </div>

        {state.useFifo ? (
          <p className="text-[11px] text-text-secondary flex items-center gap-1.5 pt-0.5">
            <Info className="h-3.5 w-3.5 shrink-0 text-accent" />
            <span>
              Stock will be deducted automatically from the oldest active lots.
            </span>
          </p>
        ) : (
          <div className="space-y-1.5 pt-1">
            <label className="block text-[11px] font-semibold text-text">
              Deduct from Lot:
            </label>
            {isLoading ? (
              <p className="text-xs text-text-secondary animate-pulse">
                Loading lots…
              </p>
            ) : availableLots.length === 0 ? (
              <p className="text-xs text-status-repair-text">
                No active lots with remaining stock. Auto FIFO will be used.
              </p>
            ) : (
              <select
                value={state.selectedLotId || availableLots[0]?.id || ""}
                onChange={(e) =>
                  onChange({ useFifo: false, selectedLotId: e.target.value })
                }
                className="w-full px-2.5 py-1.5 bg-bg border border-border rounded-md text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              >
                {availableLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.lotCode} · {lot.supplierName || "Direct"} ·{" "}
                    {lot.quantityRemaining} remaining (
                    {formatPhp(Number(lot.unitCost))}/unit)
                  </option>
                ))}
              </select>
            )}

            {isShortfall && (
              <div className="flex items-start gap-1.5 rounded bg-status-repair-bg/10 border border-status-repair-bg/30 p-2 text-[11px] text-status-repair-text">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  Selected lot only has {selectedLot.quantityRemaining} remaining
                  (request is {item.quantity}). Remaining quantity will be drawn
                  from next available lot.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
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
  const [lotSelections, setLotSelections] = useState<
    Record<string, LotSelectionState>
  >({});

  const consumableItems = useMemo(
    () =>
      request?.items.filter(
        (i) => i.itemType === "consumable" || Boolean(i.consumableId)
      ) ?? [],
    [request]
  );

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen && request) {
      setPickedUpBy(request.requesterName || "");
      setNote("");
      setError("");

      const initialLots: Record<string, LotSelectionState> = {};
      request.items.forEach((item, idx) => {
        if (item.itemType === "consumable" || item.consumableId) {
          const key = item.consumableId || item.itemDescription || String(idx);
          initialLots[key] = { useFifo: true };
        }
      });
      setLotSelections(initialLots);
    }
  }, [isOpen, request]);

  // Handle escape key
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
      const consumableLines = consumableItems.map((item, idx) => {
        const key = item.consumableId || item.itemDescription || String(idx);
        const sel = lotSelections[key] || { useFifo: true };
        return {
          consumableId: item.consumableId,
          itemDescription: item.itemDescription,
          useFifo: sel.useFifo,
          allocations:
            !sel.useFifo && sel.selectedLotId
              ? [
                  {
                    lotId: sel.selectedLotId,
                    quantity: item.quantity,
                  },
                ]
              : undefined,
        };
      });

      await onConfirm(request, {
        pickedUpBy: pickedUpBy.trim(),
        note: note.trim() || undefined,
        consumableLines:
          consumableLines.length > 0 ? consumableLines : undefined,
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
      {/* Backdrop */}
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
            {request.items.map((i) => i.itemDescription).join(", ")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 flex flex-col gap-4.5 overflow-y-auto flex-1">
            {/* Consumable Lot Allocation Section */}
            {consumableItems.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary">
                  <Layers className="h-3.5 w-3.5 text-accent" />
                  <span>Consumable Batch & Lot Allocation</span>
                </div>
                <div className="space-y-2.5">
                  {consumableItems.map((item, idx) => {
                    const key =
                      item.consumableId ||
                      item.itemDescription ||
                      String(idx);
                    return (
                      <ConsumableLotAllocationRow
                        key={key}
                        item={item}
                        state={lotSelections[key] || { useFifo: true }}
                        onChange={(updated) =>
                          setLotSelections((prev) => ({
                            ...prev,
                            [key]: updated,
                          }))
                        }
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Picked Up By */}
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

            {/* Note */}
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
