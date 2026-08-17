"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PackageMinus,
  X,
  QrCode,
  User,
  FileText,
  Check,
  Layers,
  Building2,
  Plus,
  Minus,
  AlertTriangle,
} from "lucide-react";

import type { ConsumableItem } from "@/types/inventory";
import type { PurchaseLot } from "@/types/purchase-lots";
import { formatPhp } from "@/components/projects/format-money";
import { cn } from "@/lib/utils";
import { useDepartmentsQuery } from "@/features/departments/client";
import { useProjectsQuery } from "@/features/projects/client";

function lotPayload(lot: PurchaseLot) {
  return lot.qrPayload?.trim() || `CRMC-AIMS-LOT:${lot.lotCode}`;
}

export type ReleaseFromLotInput = {
  code: string;
  quantity: number;
  recipientName?: string;
  reason?: string;
  notes?: string;
  departmentId?: string;
  projectId?: string;
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

const COMMON_RELEASE_REASONS = [
  "Department Issuance",
  "Emergency Clinic Distribution",
  "Direct Staff Issuance",
  "Routine Facility Requisition",
  "Project Allocation",
  "Other / Custom Reason",
];

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
  const { data: departments = [] } = useDepartmentsQuery();
  const { data: projects = [] } = useProjectsQuery();
  const availableLots = useMemo(
    () => lots.filter((lot) => lot.quantityRemaining > 0),
    [lots]
  );

  const [lotId, setLotId] = useState("");
  const [showManualCode, setShowManualCode] = useState(false);
  const [codeOverride, setCodeOverride] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [recipientName, setRecipientName] = useState("");
  const [reason, setReason] = useState(COMMON_RELEASE_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [destinationKind, setDestinationKind] = useState<"department" | "project">(
    "department"
  );
  const [departmentId, setDepartmentId] = useState("");
  const [projectId, setProjectId] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const preferred =
      initialLot?.id && availableLots.some((l) => l.id === initialLot.id)
        ? initialLot.id
        : availableLots[0]?.id ?? "";
    setLotId(preferred);
    setShowManualCode(false);
    setCodeOverride("");
    setQuantity(1);
    setRecipientName("");
    setReason(COMMON_RELEASE_REASONS[0]);
    setCustomReason("");
    setNotes("");
    setError("");
    setDestinationKind("department");
    setDepartmentId(departments[0]?.id ?? "");
    setProjectId(
      projects.find((p) => p.status !== "completed")?.id ?? projects[0]?.id ?? ""
    );
  }, [isOpen, initialLot, availableLots, departments, projects]);

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
  const maxQty = selected ? selected.quantityRemaining : item.currentQty;
  const unitCostNumber = selected ? Number(selected.unitCost) : 0;
  const estimatedTotalCost = quantity > 0 && unitCostNumber > 0 ? quantity * unitCostNumber : null;

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(prev + 1, maxQty));
    if (error) setError("");
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
    if (error) setError("");
  };

  const handleSetMax = () => {
    setQuantity(maxQty > 0 ? maxQty : 1);
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const code =
      codeOverride.trim() ||
      (selected ? lotPayload(selected) : "") ||
      selected?.lotCode ||
      "";

    if (!code) {
      setError("Select a stock lot or enter a lot code.");
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      setError("Quantity must be a positive whole number.");
      return;
    }
    if (selected && quantity > selected.quantityRemaining) {
      setError(
        `Only ${selected.quantityRemaining} ${item.unit} remaining on lot ${selected.lotCode}.`
      );
      return;
    }
    if (quantity > item.currentQty) {
      setError(
        `Not on hand. Only ${item.currentQty} ${item.unit} available. Restock first.`
      );
      return;
    }
    if (destinationKind === "department" && !departmentId) {
      setError("Select a department.");
      return;
    }
    if (destinationKind === "project" && !projectId) {
      setError("Select a project.");
      return;
    }

    const finalReason =
      reason === "Other / Custom Reason"
        ? customReason.trim() || "Stock release"
        : reason;

    try {
      await onConfirm({
        code,
        quantity,
        recipientName: recipientName.trim() || undefined,
        reason: finalReason,
        notes: notes.trim() || undefined,
        departmentId:
          destinationKind === "department" ? departmentId : undefined,
        projectId: destinationKind === "project" ? projectId : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Release failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 transition-opacity">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="release-lot-heading"
        className="relative w-full max-w-lg rounded-2xl border border-border bg-bg shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-border bg-bg-subtle/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary shrink-0">
              <PackageMinus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="release-lot-heading"
                className="text-base font-bold text-text leading-tight"
              >
                Release Stock from Lot
              </h2>
              <p className="text-xs text-text-secondary mt-0.5 font-mono truncate">
                {item.itemCode} · {item.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-text">Destination</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDestinationKind("department")}
                className={cn(
                  "flex-1 py-2 text-xs font-semibold rounded-lg border",
                  destinationKind === "department"
                    ? "border-primary bg-primary/5 text-text"
                    : "border-border text-text-secondary"
                )}
              >
                Department
              </button>
              <button
                type="button"
                onClick={() => setDestinationKind("project")}
                className={cn(
                  "flex-1 py-2 text-xs font-semibold rounded-lg border",
                  destinationKind === "project"
                    ? "border-primary bg-primary/5 text-text"
                    : "border-border text-text-secondary"
                )}
              >
                Project
              </button>
            </div>
            {destinationKind === "department" ? (
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full h-9 px-3 text-xs border border-border rounded-lg bg-bg"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full h-9 px-3 text-xs border border-border rounded-lg bg-bg"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.projectCode})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Stock Lot Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="release-lot-select"
                className="text-xs font-bold text-text flex items-center gap-1.5"
              >
                <Layers className="h-3.5 w-3.5 text-text-secondary" />
                Select Source Lot <span className="text-accent">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowManualCode(!showManualCode)}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="h-3 w-3" />
                {showManualCode ? "Select from list" : "Manual code / QR"}
              </button>
            </div>

            {showManualCode ? (
              <input
                id="manual-lot-code-input"
                value={codeOverride}
                onChange={(e) => {
                  setCodeOverride(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Scan QR or enter code (e.g. CRMC-AIMS-LOT:LOT-2026-001)"
                className="w-full h-9 px-3 rounded-lg border border-border bg-bg text-xs font-mono text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : availableLots.length > 0 ? (
              <select
                id="release-lot-select"
                value={lotId}
                onChange={(e) => {
                  setLotId(e.target.value);
                  setCodeOverride("");
                  if (error) setError("");
                }}
                className="w-full h-9 px-3 rounded-lg border border-border bg-bg text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {availableLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.lotCode} ({lot.quantityRemaining} {item.unit} rem. · {lot.supplierName || "No supplier"} · {formatPhp(Number(lot.unitCost))})
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-xs text-status-repair-text bg-status-repair-bg/15 border border-status-repair-bg/30 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  No open purchase lots with remaining balance. Restock to create a batch, or use the manual code option above.
                </span>
              </div>
            )}
          </div>

          {/* Selected Lot Metadata Card */}
          {selected && (
            <div className="rounded-xl border border-border bg-bg-subtle p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between items-center text-text-secondary">
                <span>Supplier:</span>
                <span className="font-semibold text-text truncate max-w-55">
                  {selected.supplierName || "Unassigned"}
                </span>
              </div>
              <div className="flex justify-between items-center text-text-secondary">
                <span>Unit Cost (Frozen):</span>
                <span className="font-mono font-semibold text-text">
                  {formatPhp(Number(selected.unitCost))} / {item.unit}
                </span>
              </div>
              <div className="flex justify-between items-center text-text-secondary">
                <span>Available in this Batch:</span>
                <span className="font-semibold text-text">
                  {selected.quantityRemaining} / {selected.quantity} {item.unit}
                </span>
              </div>
              {estimatedTotalCost !== null && (
                <div className="flex justify-between items-center pt-1.5 border-t border-border font-bold text-text">
                  <span>Line Valuation:</span>
                  <span className="text-primary font-mono">
                    {formatPhp(estimatedTotalCost)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quantity and Recipient */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Quantity */}
            <div className="space-y-1">
              <label
                htmlFor="release-quantity-input"
                className="block text-xs font-bold text-text"
              >
                Quantity to Release <span className="text-accent">*</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-bg text-text hover:bg-bg-subtle disabled:opacity-40 cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  id="release-quantity-input"
                  type="number"
                  min={1}
                  max={maxQty}
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(Math.max(1, Number(e.target.value)));
                    if (error) setError("");
                  }}
                  className="flex-1 h-9 px-3 rounded-lg border border-border bg-bg text-xs font-mono font-bold text-center text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={quantity >= maxQty}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-border bg-bg text-text hover:bg-bg-subtle disabled:opacity-40 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="h-9 px-2.5 rounded-lg border border-border bg-bg-subtle hover:bg-border text-[11px] font-bold text-text-secondary cursor-pointer"
                  title="Set maximum available quantity"
                >
                  Max
                </button>
              </div>
              <p className="text-[10px] text-text-secondary">
                Max allowable: {maxQty} {item.unit}
              </p>
            </div>

            {/* Recipient */}
            <div className="space-y-1">
              <label
                htmlFor="release-recipient-input"
                className="text-xs font-bold text-text flex items-center gap-1"
              >
                <User className="h-3 w-3 text-text-secondary" />
                Released To (Recipient / Dept)
              </label>
              <input
                id="release-recipient-input"
                value={recipientName}
                onChange={(e) => {
                  setRecipientName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Juan dela Cruz / ER Unit"
                className="w-full h-9 px-3 rounded-lg border border-border bg-bg text-xs text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-[10px] text-text-secondary">Personnel or unit receiving stock</p>
            </div>
          </div>

          {/* Reason Preset Selection */}
          <div className="space-y-1">
            <label
              htmlFor="release-reason-select"
              className="text-xs font-bold text-text flex items-center gap-1"
            >
              <Building2 className="h-3 w-3 text-text-secondary" />
              Accountability Reason <span className="text-accent">*</span>
            </label>
            <select
              id="release-reason-select"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              className="w-full h-9 px-3 rounded-lg border border-border bg-bg text-xs font-semibold text-text focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {COMMON_RELEASE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {reason === "Other / Custom Reason" && (
            <div className="space-y-1">
              <label
                htmlFor="custom-reason-input"
                className="block text-xs font-semibold text-text"
              >
                Specify Custom Reason <span className="text-accent">*</span>
              </label>
              <input
                id="custom-reason-input"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="e.g. Special training workshop kit allocation"
                className="w-full h-9 px-3 rounded-lg border border-border bg-bg text-xs text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Notes & Audit Explanation */}
          <div className="space-y-1">
            <label
              htmlFor="release-notes-input"
              className="text-xs font-semibold text-text flex items-center gap-1"
            >
              <FileText className="h-3 w-3 text-text-secondary" />
              Audit Notes & Reference Details
            </label>
            <textarea
              id="release-notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional remarks, requisition slip #, or incident details…"
              className="w-full p-2.5 rounded-lg border border-border bg-bg text-xs text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-status-outofservice-bg/10 border border-status-outofservice-bg/20 text-status-outofservice-text font-bold text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text rounded-lg border border-border bg-bg transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              {isSubmitting
                ? "Releasing…"
                : `Confirm Release (${quantity} ${item.unit})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
