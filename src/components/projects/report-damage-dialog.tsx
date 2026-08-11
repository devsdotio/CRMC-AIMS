"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle, Check, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectAssetAssignment } from "@/types/projects";
import { formatPhp } from "./format-money";

export type ReportDamageFormInput = {
  mode: "maintenance" | "write_off";
  amount: string;
  assetStatus: "out_of_service" | "retired";
  notes: string;
};

export function ReportDamageDialog({
  isOpen,
  assignment,
  defaultValue,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  assignment: ProjectAssetAssignment | null;
  /** Asset book value for default write-off charge */
  defaultValue?: number | null;
  onClose: () => void;
  onSubmit: (input: ReportDamageFormInput) => void | Promise<void>;
}) {
  const [mode, setMode] = useState<"maintenance" | "write_off">("maintenance");
  const [amount, setAmount] = useState("");
  const [assetStatus, setAssetStatus] = useState<"out_of_service" | "retired">(
    "out_of_service"
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setMode("maintenance");
    setAmount(
      defaultValue != null && Number.isFinite(defaultValue)
        ? defaultValue.toFixed(2)
        : ""
    );
    setAssetStatus("out_of_service");
    setNotes("");
    setError("");
    setIsSubmitting(false);
  }, [isOpen, assignment?.id, defaultValue]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !assignment) return null;

  const fieldClass = cn(
    "w-full h-9 px-3 text-xs bg-bg-subtle border border-border rounded-lg text-text",
    "focus:outline-none focus:ring-2 focus:ring-accent focus:bg-bg transition-colors"
  );
  const labelClass = "block text-[11px] font-bold text-text-secondary mb-1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError("Describe the damage or loss (required).");
      return;
    }
    if (mode === "write_off" && amount.trim() !== "") {
      const n = Number(amount);
      if (!Number.isFinite(n) || n < 0) {
        setError("Amount must be a non-negative number.");
        return;
      }
    }

    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit({
        mode,
        amount: amount.trim(),
        assetStatus,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to report damage."
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-outofservice-bg/40 text-status-outofservice-text">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text">Report damage</h2>
              <p className="text-[11px] text-text-secondary">
                {assignment.assetCode} — {assignment.assetName}
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

          <div className="space-y-2">
            <span className={labelClass}>Outcome</span>
            <label
              className={cn(
                "flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer",
                mode === "maintenance"
                  ? "border-accent bg-accent/10"
                  : "border-border bg-bg-subtle/40"
              )}
            >
              <input
                type="radio"
                name="damage-mode"
                className="mt-0.5"
                checked={mode === "maintenance"}
                onChange={() => setMode("maintenance")}
                disabled={isSubmitting}
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs font-bold text-text">
                  <Wrench className="h-3.5 w-3.5" />
                  Flag for repair
                </span>
                <span className="block text-[10px] text-text-secondary mt-0.5">
                  Keeps asset on project; creates maintenance log; status
                  needs_repair. No write-off charge.
                </span>
              </span>
            </label>
            <label
              className={cn(
                "flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer",
                mode === "write_off"
                  ? "border-accent bg-accent/10"
                  : "border-border bg-bg-subtle/40"
              )}
            >
              <input
                type="radio"
                name="damage-mode"
                className="mt-0.5"
                checked={mode === "write_off"}
                onChange={() => setMode("write_off")}
                disabled={isSubmitting}
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs font-bold text-text">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Write off (expense)
                </span>
                <span className="block text-[10px] text-text-secondary mt-0.5">
                  Closes assignment as written off, charges project spend, and
                  marks the asset out of service/retired.
                </span>
              </span>
            </label>
          </div>

          {mode === "write_off" && (
            <>
              <div>
                <label htmlFor="wo-amount" className={labelClass}>
                  Charge amount (₱)
                  {defaultValue != null && (
                    <span className="font-normal text-text-secondary">
                      {" "}
                      · book value {formatPhp(defaultValue)}
                    </span>
                  )}
                </label>
                <input
                  id="wo-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isSubmitting}
                  className={fieldClass}
                  placeholder="0.00"
                />
                <p className="text-[10px] text-text-secondary mt-1">
                  Leave blank to use book value (or ₱0 if none).
                </p>
              </div>
              <div>
                <label htmlFor="wo-status" className={labelClass}>
                  Asset status after write-off
                </label>
                <select
                  id="wo-status"
                  value={assetStatus}
                  onChange={(e) =>
                    setAssetStatus(
                      e.target.value as "out_of_service" | "retired"
                    )
                  }
                  disabled={isSubmitting}
                  className={fieldClass}
                >
                  <option value="out_of_service">Out of service</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label htmlFor="damage-notes" className={labelClass}>
              Damage / loss notes
            </label>
            <textarea
              id="damage-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={4000}
              required
              disabled={isSubmitting}
              className={cn(fieldClass, "h-auto py-2 resize-y min-h-9")}
              placeholder="What happened, and when…"
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
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-xs font-bold rounded-lg bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              {isSubmitting
                ? "Saving…"
                : mode === "write_off"
                  ? "Write off"
                  : "Flag repair"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
