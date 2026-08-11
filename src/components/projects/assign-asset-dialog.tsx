"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Package, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Asset } from "@/types/assets";

export type AssignAssetFormInput = {
  assetId: string;
  notes: string;
};

export function AssignAssetDialog({
  isOpen,
  assets,
  loadingAssets,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  assets: Asset[];
  loadingAssets?: boolean;
  onClose: () => void;
  onSubmit: (input: AssignAssetFormInput) => void | Promise<void>;
}) {
  const assignable = useMemo(
    () =>
      assets.filter(
        (a) =>
          a.status === "active" &&
          !a.currentHolder &&
          a.assignmentType === "assignable"
      ),
    [assets]
  );

  const [assetId, setAssetId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setAssetId(assignable[0]?.id ?? "");
    setNotes("");
    setError("");
    setIsSubmitting(false);
  }, [isOpen, assignable]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const selected = assignable.find((a) => a.id === assetId) ?? null;

  const fieldClass = cn(
    "w-full h-9 px-3 text-xs bg-bg-subtle border border-border rounded-lg text-text",
    "focus:outline-none focus:ring-2 focus:ring-accent focus:bg-bg transition-colors"
  );
  const labelClass = "block text-[11px] font-bold text-text-secondary mb-1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      setError("Select an active asset that is not currently in custody.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit({
        assetId: selected.id,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to assign asset."
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
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text">Assign asset</h2>
              <p className="text-[11px] text-text-secondary">
                Places asset in project custody (no borrower account)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-border disabled:opacity-50 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-[11px] text-status-outofservice-text">{error}</p>
          )}

          <div>
            <label htmlFor="assign-asset" className={labelClass}>
              Asset
            </label>
            {loadingAssets ? (
              <div className="h-9 rounded-lg bg-border animate-pulse" />
            ) : assignable.length === 0 ? (
              <p className="text-[11px] text-text-secondary border border-dashed border-border rounded-lg p-3">
                No free <strong>assignable</strong> assets available. Set assignment
                type to Assignable and ensure the asset is active with no holder.
              </p>
            ) : (
              <select
                id="assign-asset"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                className={fieldClass}
                disabled={isSubmitting}
              >
                {assignable.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.assetCode} — {a.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="assign-notes" className={labelClass}>
              Notes (optional)
            </label>
            <textarea
              id="assign-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={2000}
              disabled={isSubmitting}
              className={cn(fieldClass, "h-auto py-2 resize-y min-h-9")}
              placeholder="Why this asset is on the project…"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-bold rounded-lg border border-border bg-bg text-text hover:bg-bg-subtle disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selected}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-bold rounded-lg bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              {isSubmitting ? "Assigning…" : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
