"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BorrowLogRecord } from "@/features/borrow-log/client/borrow-log-api";

export function ReturnLogDialog({
  record,
  isOpen,
  onClose,
  onConfirm,
}: {
  record: BorrowLogRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    condition: "good" | "damaged" | "needs_repair";
    conditionNotes?: string;
    flagMaintenance?: boolean;
  }) => Promise<void>;
}) {
  const [condition, setCondition] = useState<"good" | "damaged" | "needs_repair">("good");
  const [conditionNotes, setConditionNotes] = useState("");
  const [flagMaintenance, setFlagMaintenance] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCondition("good");
      setConditionNotes("");
      setFlagMaintenance(false);
      setError("");
    }
  }, [isOpen, record]);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await onConfirm({
        condition,
        conditionNotes: conditionNotes.trim() || undefined,
        flagMaintenance,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record return.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md rounded-xl bg-bg border border-border shadow-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-text">
            {record.custodyKind === "assignment"
              ? "Pull back assignment"
              : "Record return"}
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {record.assetName} · {record.assetCode}
            {record.custodyKind === "assignment"
              ? " · restores asset to stock"
              : ""}
          </p>
        </div>
        <div className="p-5 space-y-3">
          <label className="block text-xs font-bold text-text">
            Condition on return
            <select
              value={condition}
              onChange={(e) =>
                setCondition(e.target.value as "good" | "damaged" | "needs_repair")
              }
              className="mt-1 w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg"
            >
              <option value="good">Good</option>
              <option value="damaged">Damaged</option>
              <option value="needs_repair">Needs repair</option>
            </select>
          </label>
          <label className="block text-xs font-bold text-text">
            Notes
            <textarea
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full px-3 py-2 text-xs bg-bg border border-border rounded-lg"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-text">
            <input
              type="checkbox"
              checked={flagMaintenance}
              onChange={(e) => setFlagMaintenance(e.target.checked)}
            />
            Flag this asset for maintenance
          </label>
          {error && (
            <p className="text-xs font-semibold text-status-outofservice-text">{error}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-border"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-accent text-accent-foreground",
              isSubmitting && "opacity-60"
            )}
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Confirm return
          </button>
        </div>
      </form>
    </div>
  );
}
