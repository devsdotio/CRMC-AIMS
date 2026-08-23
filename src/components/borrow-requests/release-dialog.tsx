"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Check, Loader2, Package, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatAssetCodeDisplay, formatItemDescription } from "@/lib/sanitize-display";
import { useCategoryStyleResolver } from "@/features/categories/client/use-category-style";
import { assetsApi } from "@/features/assets/client/assets-api";
import type { BorrowRequest } from "@/types/borrow-requests";
import type { ReleaseBorrowRequestPayload } from "@/features/borrow-requests/client/borrow-requests-api";
import type { Asset } from "@/types/assets";

export interface ReleaseDialogProps {
  request: BorrowRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    request: BorrowRequest,
    payload: ReleaseBorrowRequestPayload
  ) => Promise<void>;
}

function ReleaseLineAssetPicker({
  lineIndex,
  item,
  requestType,
  selectedAssetIds,
  disabledAssetIds,
  onToggle,
}: {
  lineIndex: number;
  item: BorrowRequest["items"][number];
  requestType: "borrowable" | "assignable";
  selectedAssetIds: string[];
  disabledAssetIds: Set<string>;
  onToggle: (lineIndex: number, assetId: string) => void;
}) {
  const resolveCategoryStyle = useCategoryStyleResolver();
  const assignmentType = requestType === "assignable" ? "assignable" : "borrowable";

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["assets", "release-picker", item.category, assignmentType],
    queryFn: () =>
      assetsApi.listAssets(undefined, {
        category: item.category,
        availableOnly: true,
        assignmentType,
      }),
    enabled: Boolean(item.category),
  });

  const displayName = formatItemDescription(
    item.itemDescription,
    resolveCategoryStyle(item.category).label,
    item.itemType ?? "asset"
  );

  const remaining = item.quantity - selectedAssetIds.length;
  const isComplete = remaining === 0;

  return (
    <div className="rounded-lg border border-border bg-bg-subtle/40 p-3.5 space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-text truncate">{displayName}</p>
          <p className="text-[11px] text-text-secondary">
            Select {item.quantity} available unit{item.quantity === 1 ? "" : "s"}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
            isComplete
              ? "bg-status-active-bg/20 text-status-active-text"
              : "bg-status-repair-bg/20 text-status-repair-text"
          )}
        >
          {selectedAssetIds.length}/{item.quantity}
        </span>
      </div>

      <div className="space-y-1.5 pt-1 border-t border-border/50">
        {isLoading ? (
          <p className="text-xs text-text-secondary animate-pulse">
            Loading available units…
          </p>
        ) : assets.length === 0 ? (
          <p className="text-xs text-status-repair-text">
            No available units in this category. Restock or return units first.
          </p>
        ) : (
          <ul className="space-y-1 max-h-40 overflow-y-auto">
            {assets.map((asset: Asset) => {
              const isSelected = selectedAssetIds.includes(asset.id);
              const isDisabled =
                !isSelected &&
                (disabledAssetIds.has(asset.id) ||
                  selectedAssetIds.length >= item.quantity);
              const code = formatAssetCodeDisplay(asset.assetCode);

              return (
                <li key={asset.id}>
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onToggle(lineIndex, asset.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md border text-left text-xs transition-colors",
                      isSelected
                        ? "border-accent bg-accent/10 text-text"
                        : "border-border bg-bg hover:bg-bg-subtle text-text",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                        isSelected
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border bg-bg"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </span>
                    <span className="font-mono font-semibold shrink-0">{code}</span>
                    <span className="truncate flex-1">{asset.name}</span>
                    <span className="text-[10px] text-text-secondary shrink-0">
                      {asset.location}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {!isComplete && assets.length > 0 && (
          <p className="text-[11px] text-status-repair-text">
            Select {remaining} more unit{remaining === 1 ? "" : "s"} to continue.
          </p>
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
  const [selections, setSelections] = useState<Record<number, string[]>>({});

  const assetLines = useMemo(
    () =>
      (request?.items ?? []).filter(
        (item) => item.itemType !== "consumable" && !item.consumableId
      ),
    [request?.items]
  );

  const requestType = request?.requestType === "assignable" ? "assignable" : "borrowable";

  useEffect(() => {
    if (isOpen && request) {
      setPickedUpBy(request.requesterName || "");
      setNote("");
      setError("");
      setSelections({});
    }
  }, [isOpen, request]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  const disabledAssetIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(selections).forEach((lineIds) => {
      lineIds.forEach((id) => ids.add(id));
    });
    return ids;
  }, [selections]);

  const allLinesComplete = assetLines.every((item, idx) => {
    const selected = selections[idx] ?? [];
    return selected.length === item.quantity;
  });

  const toggleAsset = (lineIndex: number, assetId: string) => {
    setSelections((prev) => {
      const current = prev[lineIndex] ?? [];
      const lineQty = assetLines[lineIndex]?.quantity ?? 0;

      if (current.includes(assetId)) {
        return { ...prev, [lineIndex]: current.filter((id) => id !== assetId) };
      }
      if (current.length >= lineQty) return prev;
      return { ...prev, [lineIndex]: [...current, assetId] };
    });
    if (error) setError("");
  };

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickedUpBy.trim()) {
      setError("Name is required");
      return;
    }
    if (!allLinesComplete) {
      setError("Select the required number of units for each line before releasing.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const lineAllocations = assetLines.map((_, lineIndex) => ({
        lineIndex,
        assetIds: selections[lineIndex] ?? [],
      }));

      await onConfirm(request, {
        pickedUpBy: pickedUpBy.trim(),
        note: note.trim() || undefined,
        lineAllocations,
      });

      setPickedUpBy("");
      setNote("");
      setSelections({});
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
      <div
        className="absolute inset-0"
        onClick={() => !isSubmitting && onClose()}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl max-h-[90vh] bg-bg rounded-xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-border"
      >
        <div className="px-6 py-4.5 border-b border-border bg-bg-subtle/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">Release Request</h2>
              <p className="mt-0.5 text-xs text-text-secondary">
                {request.requestCode} · Select specific units to issue
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
            <div className="space-y-3">
              {assetLines.map((item, idx) => (
                <ReleaseLineAssetPicker
                  key={idx}
                  lineIndex={idx}
                  item={item}
                  requestType={requestType}
                  selectedAssetIds={selections[idx] ?? []}
                  disabledAssetIds={disabledAssetIds}
                  onToggle={toggleAsset}
                />
              ))}
            </div>

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
            </div>

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

            {error && (
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
              disabled={isSubmitting || !allLinesComplete}
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
