"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Layers, Loader2, User } from "lucide-react";

import { formatPhp } from "@/components/projects/format-money";
import { usePurchaseLotsQuery } from "@/features/purchase-lots/client/use-purchase-lots";
import type { ConsumableRequest } from "@/features/consumable-requests/client";
import type { ReleaseConsumableRequestPayload } from "@/features/consumable-requests/client/consumable-requests-api";

export interface ReleaseConsumableRequestDialogProps {
  request: ConsumableRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    request: ConsumableRequest,
    payload: ReleaseConsumableRequestPayload
  ) => Promise<void>;
}

function ReleaseLineLotRow({
  line,
  selectedLotId,
  onChange,
}: {
  line: ConsumableRequest["lines"][number];
  selectedLotId?: string;
  onChange: (lotId: string) => void;
}) {
  const { data: lots = [], isLoading } = usePurchaseLotsQuery({
    consumableId: line.consumableId,
    itemType: "consumable",
    enabled: Boolean(line.consumableId),
  });

  const availableLots = useMemo(
    () => lots.filter((lot) => lot.quantityRemaining > 0),
    [lots]
  );

  const selectedLot = availableLots.find((l) => l.id === selectedLotId);
  const isShortfall =
    selectedLot && selectedLot.quantityRemaining < line.quantityRequested;

  return (
    <div className="rounded-lg border border-border bg-bg-subtle/40 p-3.5 space-y-2.5">
      <div className="min-w-0">
        <p className="text-xs font-bold text-text truncate">{line.itemName}</p>
        <p className="text-[11px] text-text-secondary font-mono">
          {line.itemCode} · qty {line.quantityRequested} {line.unit}
        </p>
      </div>

      <div className="space-y-1.5 pt-1 border-t border-border/50">
        <label className="block text-[11px] font-semibold text-text">
          Issue from lot
        </label>
        {isLoading ? (
          <p className="text-xs text-text-secondary animate-pulse">
            Loading lots…
          </p>
        ) : availableLots.length === 0 ? (
          <p className="text-xs text-status-repair-text">
            No active lots with remaining stock. Restock first.
          </p>
        ) : (
          <select
            value={selectedLotId || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-bg border border-border rounded-md text-xs text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          >
            <option value="">Select a lot…</option>
            {availableLots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                {lot.lotCode} · {lot.quantityRemaining} remaining (
                {formatPhp(Number(lot.unitCost))}/unit)
              </option>
            ))}
          </select>
        )}
        {isShortfall && selectedLot && (
          <div className="flex items-start gap-1.5 rounded bg-status-repair-bg/10 border border-status-repair-bg/30 p-2 text-[11px] text-status-repair-text">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              Selected lot only has {selectedLot.quantityRemaining} remaining
              (line needs {line.quantityRequested}). Choose another lot.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReleaseConsumableRequestDialog({
  request,
  isOpen,
  onClose,
  onConfirm,
}: ReleaseConsumableRequestDialogProps) {
  const [receivedBy, setReceivedBy] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lotByLine, setLotByLine] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen || !request) return;
    setReceivedBy(request.department);
    setNote("");
    setError("");
    setLotByLine({});
  }, [isOpen, request]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivedBy.trim()) {
      setError("Name of person who received the supplies is required.");
      return;
    }
    const missing = request.lines.filter((line) => !lotByLine[line.id]);
    if (missing.length > 0) {
      setError("Select a lot for every line.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onConfirm(request, {
        receivedBy: receivedBy.trim(),
        note: note.trim() || undefined,
        lines: request.lines.map((line) => ({
          lineId: line.id,
          allocations: [
            {
              lotId: lotByLine[line.id],
              quantity: line.quantityRequested,
            },
          ],
        })),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Issue failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
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
          <h2 className="text-base font-bold text-text">Issue supplies</h2>
          <p className="mt-0.5 text-xs text-text-secondary font-mono">
            {request.requestCode} · {request.department}
          </p>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-6 flex flex-col gap-4.5 overflow-y-auto flex-1">
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary">
                <Layers className="h-3.5 w-3.5 text-accent" />
                <span>Lot per line</span>
              </div>
              <div className="space-y-2.5">
                {request.lines.map((line) => (
                  <ReleaseLineLotRow
                    key={line.id}
                    line={line}
                    selectedLotId={lotByLine[line.id]}
                    onChange={(lotId) =>
                      setLotByLine((prev) => ({ ...prev, [line.id]: lotId }))
                    }
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="receivedBy"
                className="text-xs font-bold uppercase tracking-wider text-text-secondary"
              >
                Received by <span className="text-status-outofservice-text">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-text-secondary/60" />
                </div>
                <input
                  id="receivedBy"
                  type="text"
                  disabled={isSubmitting}
                  className="w-full pl-9 pr-4 py-2 bg-bg border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="releaseNote"
                className="text-xs font-bold uppercase tracking-wider text-text-secondary"
              >
                Notes (optional)
              </label>
              <textarea
                id="releaseNote"
                rows={2}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-text resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-status-outofservice-text">
                {error}
              </p>
            )}
          </div>

          <div className="px-6 py-4 border-t border-border bg-bg-subtle/30 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-border text-text-secondary hover:text-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Issue & deduct stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
