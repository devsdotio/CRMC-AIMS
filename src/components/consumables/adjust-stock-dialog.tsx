"use client";

import { useState, useEffect, useMemo } from "react";
import { X, SlidersHorizontal, AlertTriangle, Check, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsumableItem } from "@/types/inventory";
import type { StockAdjustPayload } from "@/features/consumables/client";
import { usePurchaseLotsQuery } from "@/features/purchase-lots/client";
import { formatPhp } from "@/components/projects/format-money";

export interface AdjustStockDialogProps {
  item: ConsumableItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmAdjust: (itemId: string, payload: StockAdjustPayload) => void | Promise<void>;
}

const ADJUSTMENT_REASONS = [
  "Damaged / Expired Goods",
  "Lost / Missing Stock",
  "Physical Count Correction",
  "Department Direct Distribution",
  "Other Accountability Reason",
];

interface AdjustStockDialogFormProps {
  item: ConsumableItem;
  onClose: () => void;
  onConfirmAdjust: AdjustStockDialogProps["onConfirmAdjust"];
}

function AdjustStockDialogForm({
  item,
  onClose,
  onConfirmAdjust,
}: AdjustStockDialogFormProps) {
  const [adjustmentDelta, setAdjustmentDelta] = useState(
    item.currentQty > 0 ? -1 : 1
  );
  const [reason, setReason] = useState(ADJUSTMENT_REASONS[0]);
  const [notes, setNotes] = useState("");
  const [allocationMode, setAllocationMode] = useState<"specific" | "fifo">(
    "specific"
  );
  const [selectedLotId, setSelectedLotId] = useState<string>("");
  const [increaseMode, setIncreaseMode] = useState<
    "new_batch" | "attach_existing"
  >("new_batch");
  const [attachLotId, setAttachLotId] = useState<string>("");
  const [unitCost, setUnitCost] = useState<string>("0.00");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: lots = [], isLoading: lotsLoading } = usePurchaseLotsQuery({
    consumableId: item.id,
    itemType: "consumable",
    enabled: true,
  });

  const availableLots = useMemo(
    () => lots.filter((l) => l.quantityRemaining > 0),
    [lots]
  );

  useEffect(() => {
    if (availableLots.length > 0) {
      setSelectedLotId(availableLots[0].id);
      setAttachLotId(availableLots[0].id);
      setAllocationMode("specific");
    } else {
      setAllocationMode("fifo");
    }
  }, [availableLots]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const newExpectedQty = item.currentQty + adjustmentDelta;
  const isReducing = adjustmentDelta < 0;
  const isIncreasing = adjustmentDelta > 0;
  const selectedLot = availableLots.find((l) => l.id === selectedLotId) ?? null;
  const selectedAttachLot =
    availableLots.find((l) => l.id === attachLotId) ?? null;

  const isExceedingTotalStock = isReducing && Math.abs(adjustmentDelta) > item.currentQty;
  const isExceedingSelectedLot =
    isReducing &&
    allocationMode === "specific" &&
    Boolean(selectedLot && selectedLot.quantityRemaining < Math.abs(adjustmentDelta));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustmentDelta === 0) {
      setError("Adjustment change cannot be zero.");
      return;
    }
    if (newExpectedQty < 0) {
      setError(
        `Cannot deduct ${Math.abs(adjustmentDelta)} ${item.unit}. Only ${item.currentQty} ${item.unit} available in stock.`
      );
      return;
    }
    if (!reason.trim()) {
      setError("A reason is mandatory for auditing stock adjustments.");
      return;
    }

    const payload: StockAdjustPayload = {
      quantityChange: adjustmentDelta,
      reason: reason.trim(),
      notes: notes.trim() || undefined,
    };

    if (isReducing) {
      const need = Math.abs(adjustmentDelta);
      if (allocationMode === "specific" && selectedLotId) {
        const targetLot = availableLots.find((l) => l.id === selectedLotId);
        if (!targetLot) {
          setError("Please select an active lot to deduct from.");
          return;
        }
        if (targetLot.quantityRemaining < need) {
          setError(
            `Cannot deduct ${need} ${item.unit} from lot ${targetLot.lotCode}. Only ${targetLot.quantityRemaining} ${item.unit} remaining on this lot. Choose FIFO or select a larger lot.`
          );
          return;
        }
        payload.allocations = [
          {
            lotId: targetLot.id,
            lotCode: targetLot.lotCode,
            quantity: need,
          },
        ];
      } else {
        payload.useFifo = true;
      }
    } else if (isIncreasing) {
      if (increaseMode === "attach_existing" && attachLotId) {
        payload.attachLotId = attachLotId;
      } else {
        payload.createCorrectionLot = true;
        if (Number(unitCost) > 0) {
          payload.unitCost = Number(unitCost);
        }
      }
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onConfirmAdjust(item.id, payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Adjustment failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjust-dialog-title"
        className="relative w-full max-w-md rounded-2xl border border-border bg-bg p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 space-y-5 max-h-[90vh] overflow-y-auto"
      >
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
            <span className={cn(newExpectedQty < 0 ? "text-destructive" : "text-accent")}>
              {newExpectedQty} {item.unit}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className={cn(
                "w-full h-9 px-3 text-xs bg-bg border rounded-lg font-bold text-text focus:outline-none focus:ring-2",
                isExceedingTotalStock
                  ? "border-destructive focus:ring-destructive"
                  : "border-border focus:ring-accent"
              )}
            />
            {isExceedingTotalStock ? (
              <p className="text-[11px] text-destructive font-semibold flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Exceeds stock: cannot deduct {Math.abs(adjustmentDelta)} {item.unit} (only {item.currentQty} {item.unit} available).
              </p>
            ) : (
              <p className="text-[11px] text-text-secondary/70">
                Use negative values (e.g. -5) for lost/damaged stock (max -{item.currentQty} {item.unit}).
              </p>
            )}
          </div>

          {/* Lot Allocation Section */}
          <div className="space-y-2 p-3.5 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-text-secondary" />
                {isReducing ? "Source Batch / Purchase Lot" : "Batch & Lot Destination"}
              </label>
              {lotsLoading && (
                <span className="text-[10px] text-text-secondary animate-pulse">
                  Loading lots…
                </span>
              )}
            </div>

            {isReducing && (
              <div className="space-y-2 text-xs">
                {availableLots.length > 0 ? (
                  <>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-text">
                        <input
                          type="radio"
                          name="allocMode"
                          checked={allocationMode === "specific"}
                          onChange={() => setAllocationMode("specific")}
                          className="accent-primary"
                        />
                        Select specific lot
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-text">
                        <input
                          type="radio"
                          name="allocMode"
                          checked={allocationMode === "fifo"}
                          onChange={() => setAllocationMode("fifo")}
                          className="accent-primary"
                        />
                        Auto-deduct (FIFO)
                      </label>
                    </div>

                    {allocationMode === "specific" && (
                      <div className="space-y-2 pt-1">
                        <select
                          value={selectedLotId}
                          onChange={(e) => {
                            setSelectedLotId(e.target.value);
                            if (error) setError("");
                          }}
                          className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          {availableLots.map((lot) => (
                            <option key={lot.id} value={lot.id}>
                              {lot.lotCode} ({lot.quantityRemaining} {item.unit} rem. · {lot.supplierName || "No supplier"} · {formatPhp(Number(lot.unitCost))})
                            </option>
                          ))}
                        </select>

                        {selectedLot && (
                          <div className="p-2.5 rounded-lg border border-border/80 bg-bg-subtle text-[11px] space-y-1">
                            <div className="flex justify-between">
                              <span className="text-text-secondary">Lot Code:</span>
                              <span className="font-mono font-bold text-text">{selectedLot.lotCode}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-secondary">Current Balance:</span>
                              <span className="font-semibold text-text">{selectedLot.quantityRemaining} {item.unit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-secondary">Balance After -{Math.abs(adjustmentDelta)}:</span>
                              <span className={cn("font-bold font-mono", selectedLot.quantityRemaining - Math.abs(adjustmentDelta) < 0 ? "text-destructive" : "text-status-active-text")}>
                                {selectedLot.quantityRemaining - Math.abs(adjustmentDelta)} {item.unit}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {allocationMode === "fifo" && (
                      <p className="text-[11px] text-text-secondary pt-0.5 leading-relaxed">
                        System will automatically deduct quantity across the oldest active lots in FIFO order.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] text-text-secondary leading-relaxed bg-bg-subtle p-2 rounded border border-border">
                    No active supplier lots with remaining balance found. System will adjust overall stock directly.
                  </p>
                )}
              </div>
            )}

            {isIncreasing && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-text">
                    <input
                      type="radio"
                      name="incMode"
                      checked={increaseMode === "new_batch"}
                      onChange={() => setIncreaseMode("new_batch")}
                      className="accent-primary"
                    />
                    Create new correction batch
                  </label>
                  {availableLots.length > 0 && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-text">
                      <input
                        type="radio"
                        name="incMode"
                        checked={increaseMode === "attach_existing"}
                        onChange={() => setIncreaseMode("attach_existing")}
                        className="accent-primary"
                      />
                      Add to existing lot
                    </label>
                  )}
                </div>

                {increaseMode === "attach_existing" && availableLots.length > 0 ? (
                  <select
                    value={attachLotId}
                    onChange={(e) => setAttachLotId(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {availableLots.map((lot) => (
                      <option key={lot.id} value={lot.id}>
                        Add to {lot.lotCode} (currently {lot.quantityRemaining} {item.unit})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] text-text-secondary block">
                      Estimated Unit Valuation (₱)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-8 px-3 text-xs bg-bg border border-border rounded-lg font-mono text-text focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

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

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text rounded-md border border-border bg-bg transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                adjustmentDelta === 0 ||
                isExceedingTotalStock ||
                isExceedingSelectedLot
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              {isSubmitting ? "Submitting…" : "Confirm Stock Correction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdjustStockDialog({
  item,
  isOpen,
  onClose,
  onConfirmAdjust,
}: AdjustStockDialogProps) {
  if (!isOpen || !item) return null;

  return (
    <AdjustStockDialogForm
      key={item.id}
      item={item}
      onClose={onClose}
      onConfirmAdjust={onConfirmAdjust}
    />
  );
}
