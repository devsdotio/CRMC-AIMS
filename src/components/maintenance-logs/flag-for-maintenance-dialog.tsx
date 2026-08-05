"use client";

import { useState, useEffect } from "react";
import { X, Wrench, AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConditionState } from "./types";
import type { AssetCategory } from "@/components/assets/types";

export interface FlagForMaintenanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmFlag: (flagData: {
    assetCode: string;
    assetName: string;
    category: AssetCategory;
    condition: ConditionState;
    notes: string;
    scheduledDate?: string;
  }) => void;
}

const SAMPLE_ASSETS: { code: string; name: string; category: AssetCategory }[] = [
  { code: "AV-031", name: "Canon EOS 90D DSLR Camera Kit", category: "av" },
  { code: "CP-080", name: "Dell Latitude 5420 Laptop", category: "computing" },
  { code: "TR-004", name: "Toyota Coaster Utility Van", category: "transport" },
  { code: "FN-012", name: "Modular Executive Conference Table", category: "furniture" },
  { code: "AV-014", name: "Epson PowerLite LCD Projector #A-102", category: "av" },
];

export function FlagForMaintenanceDialog({
  isOpen,
  onClose,
  onConfirmFlag,
}: FlagForMaintenanceDialogProps) {
  const [selectedAssetCode, setSelectedAssetCode] = useState(SAMPLE_ASSETS[0].code);
  const [condition, setCondition] = useState<ConditionState>("needs_maintenance");
  const [notes, setNotes] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedAssetCode(SAMPLE_ASSETS[0].code);
      setCondition("needs_maintenance");
      setNotes("");
      setScheduledDate("");
      setError("");
    }
  }, [isOpen]);

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

  const targetAsset = SAMPLE_ASSETS.find((a) => a.code === selectedAssetCode) || SAMPLE_ASSETS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError("Please describe the fault or maintenance issue (required).");
      return;
    }

    onConfirmFlag({
      assetCode: targetAsset.code,
      assetName: targetAsset.name,
      category: targetAsset.category,
      condition,
      notes: notes.trim(),
      scheduledDate: scheduledDate || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Dialog Window */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="flag-dialog-title"
        className="relative w-full max-w-lg rounded-2xl border border-border bg-bg p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 my-6 space-y-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent shrink-0">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h3 id="flag-dialog-title" className="text-base font-bold text-text leading-tight">
                Flag Asset for Maintenance / Repair
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Creates an open maintenance flag & updates asset inventory condition status
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close flag dialog"
            className="p-1 rounded-md text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Asset Select */}
          <div className="space-y-1">
            <label htmlFor="flag-asset-select" className="block text-xs font-semibold text-text">
              Target Institutional Asset <span className="text-accent">*</span>
            </label>
            <select
              id="flag-asset-select"
              value={selectedAssetCode}
              onChange={(e) => setSelectedAssetCode(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {SAMPLE_ASSETS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>
          </div>

          {/* Condition Severity Select */}
          <div className="space-y-1">
            <label htmlFor="flag-condition-select" className="block text-xs font-semibold text-text">
              Flagged Condition Status <span className="text-accent">*</span>
            </label>
            <select
              id="flag-condition-select"
              value={condition}
              onChange={(e) => setCondition(e.target.value as ConditionState)}
              className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="needs_maintenance">Needs Maintenance / Repair</option>
              <option value="damaged">Damaged / Out of Service</option>
            </select>
          </div>

          {/* Optional Scheduled Date */}
          <div className="space-y-1">
            <label htmlFor="scheduled-date-input" className="block text-xs font-semibold text-text">
              Target Service Completion Date (Optional)
            </label>
            <input
              id="scheduled-date-input"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Required Issue Notes */}
          <div className="space-y-1">
            <label htmlFor="flag-notes-input" className="block text-xs font-semibold text-text">
              Issue Description / Fault Details <span className="text-accent">*</span>
            </label>
            <textarea
              id="flag-notes-input"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (error) setError("");
              }}
              rows={3}
              placeholder="Describe the defect, sticky controls, physical damage, or required cleaning…"
              className={cn(
                "w-full p-2.5 text-xs bg-bg border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent",
                error ? "border-status-outofservice-bg" : "border-border"
              )}
            />
          </div>

          {/* Cross feature notice */}
          <div className="p-3 rounded-lg border border-border bg-bg-subtle text-[11px] text-text-secondary flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <span>
              <strong>Cross-Feature Effect:</strong> Submitting this flag will set asset tag{" "}
              <strong className="font-mono text-text">{targetAsset.code}</strong> status to{" "}
              <span className="font-bold text-text">"{condition.replace("_", " ")}"</span> across the Assets Registry until resolved.
            </span>
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
              Confirm Maintenance Flag
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
