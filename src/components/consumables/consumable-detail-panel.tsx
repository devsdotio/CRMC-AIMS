"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  X,
  PlusCircle,
  SlidersHorizontal,
  MapPin,
  Truck,
  History,
  Tag,
  PackageMinus,
  PackagePlus,
  QrCode,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { LoadingState } from "@/components/providers/loading-context";
import type { ConsumableItem } from "@/types/inventory";
import type { PurchaseLot } from "@/types/purchase-lots";
import { useConsumableQuery } from "@/features/consumables/client/use-consumables";
import { usePurchaseLotsQuery } from "@/features/purchase-lots/client";
import { useConsumableMovementsQuery } from "@/features/stock-movements/client";
import type { StockMovement } from "@/features/stock-movements/client";
import { formatPhp } from "@/components/projects/format-money";
import { StockLevelBar } from "./stock-level-bar";
import { LotQrCodeDisplay } from "./lot-qr-code-display";
import { AuditNoteDisplay } from "@/components/audit-logs/audit-log-utils";

export interface ConsumableDetailPanelProps {
  item: ConsumableItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRestock?: (item: ConsumableItem) => void;
  onAdjust?: (item: ConsumableItem) => void;
  onRelease?: (item: ConsumableItem, lot?: PurchaseLot | null) => void;
  onEdit?: (item: ConsumableItem) => void;
}

function movementReasonLabel(reason: StockMovement["reason"]) {
  if (reason === "restock") return "Restock";
  if (reason === "issue") return "Issue";
  return "Adjustment";
}

function getMovementIcon(reason: StockMovement["reason"]) {
  switch (reason) {
    case "restock":
      return <PackagePlus className="h-3.5 w-3.5" />;
    case "issue":
      return <PackageMinus className="h-3.5 w-3.5" />;
    default:
      return <SlidersHorizontal className="h-3.5 w-3.5" />;
  }
}

function getMovementStyle(
  reason: StockMovement["reason"],
  direction: StockMovement["direction"]
) {
  if (reason === "restock" || (reason === "adjust" && direction === "in")) {
    return {
      bg: "bg-status-active-bg/20 border-status-active-bg/40",
      text: "text-status-active-text",
      badge:
        "bg-status-active-bg/15 text-status-active-text border-status-active-bg/30",
      iconText: "text-status-active-text",
    };
  }
  if (reason === "issue") {
    return {
      bg: "bg-primary/15 border-primary/30",
      text: "text-primary dark:text-primary-foreground",
      badge:
        "bg-primary/10 text-primary dark:text-primary-foreground border-primary/25",
      iconText: "text-primary dark:text-primary-foreground",
    };
  }
  return {
    bg: "bg-status-repair-bg/20 border-status-repair-bg/40",
    text: "text-status-repair-text",
    badge:
      "bg-status-repair-bg/15 text-status-repair-text border-status-repair-bg/30",
    iconText: "text-status-repair-text",
  };
}

export function ConsumableDetailPanel({
  item,
  isOpen,
  onClose,
  onRestock,
  onAdjust,
  onRelease,
  onEdit,
}: ConsumableDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [expandedLotId, setExpandedLotId] = useState<string | null>(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // List payload omits history for speed — load full record when the panel opens.
  const { data: detailItem, isLoading: detailLoading } = useConsumableQuery(
    item?.id ?? "",
    { enabled: Boolean(isOpen && item?.id) }
  );
  const displayItem = detailItem ?? item;

  const { data: lots = [], isLoading: lotsLoading } = usePurchaseLotsQuery({
    consumableId: item?.id,
    itemType: "consumable",
    enabled: Boolean(isOpen && item?.id),
  });
  const { data: movements = [], isLoading: movementsLoading } =
    useConsumableMovementsQuery(item?.id ?? "", {
      enabled: Boolean(isOpen && item?.id),
    });

  const openLots = useMemo(
    () => lots.filter((l) => l.quantityRemaining > 0),
    [lots]
  );

  const displayedMovements = isHistoryExpanded
    ? movements
    : movements.slice(0, 4);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    setExpandedLotId(null);
    setIsHistoryExpanded(false);
  }, [item?.id]);

  if (!isOpen || !item || !displayItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consumable-detail-heading"
        className={cn(
          "relative flex flex-col w-full max-w-lg h-full bg-bg border-l border-border shadow-2xl z-10 overflow-hidden",
          "animate-in slide-in-from-right duration-250 ease-in-out"
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-subtle/50 shrink-0">
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2
                id="consumable-detail-heading"
                className="font-mono text-lg font-bold tracking-tight text-text"
              >
                {displayItem.itemCode}
              </h2>
              <span
                className={cn(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border",
                  displayItem.currentQty === 0
                    ? "bg-status-outofservice-bg/20 text-status-outofservice-text border-status-outofservice-bg/30"
                    : displayItem.currentQty <= displayItem.minThreshold
                    ? "bg-status-repair-bg/20 text-status-repair-text border-status-repair-bg/30"
                    : "bg-status-active-bg/20 text-status-active-text border-status-active-bg/30"
                )}
              >
                {displayItem.currentQty === 0
                  ? "Out of Stock"
                  : displayItem.currentQty <= displayItem.minThreshold
                  ? "Low Stock"
                  : "In Stock"}
              </span>
            </div>
            <p className="text-xs text-text-secondary font-medium mt-0.5 truncate">
              {displayItem.category.replace(/_/g, " ")} • <strong className="text-text font-semibold">{displayItem.name}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail panel"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-border transition-colors cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-4 rounded-xl border border-border bg-bg-subtle space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
              Stock status
            </span>
            <StockLevelBar
              currentQty={displayItem.currentQty}
              minThreshold={displayItem.minThreshold}
              unit={displayItem.unit}
            />
            {(displayItem.reservedQty ?? 0) > 0 && (
              <p className="text-[11px] text-status-repair-text">
                {displayItem.reservedQty} {displayItem.unit} reserved for approved
                supply requests · {displayItem.availableQty ?? displayItem.currentQty - displayItem.reservedQty} available to issue
              </p>
            )}
          </div>

          {(onRestock || onRelease || onAdjust || onEdit) && (
          <div className="grid grid-cols-2 gap-2">
            {onRestock && (
            <button
              type="button"
              onClick={() => onRestock(displayItem)}
              className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-lg text-xs font-bold bg-accent text-accent-foreground hover:opacity-90 cursor-pointer shadow-xs"
            >
              <PlusCircle className="h-4 w-4" />
              Restock
            </button>
            )}
            {onRelease && (
            <button
              type="button"
              onClick={() => onRelease(displayItem)}
              className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-lg text-xs font-bold border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 cursor-pointer"
            >
              <PackageMinus className="h-4 w-4" />
              Issue
            </button>
            )}
            {onAdjust && (
            <button
              type="button"
              onClick={() => onAdjust(displayItem)}
              className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-lg text-xs font-semibold border border-border bg-bg text-text hover:border-primary cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Adjust
            </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(displayItem)}
                className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-lg text-xs font-semibold border border-border bg-bg text-text hover:border-primary cursor-pointer"
              >
                Edit details
              </button>
            )}
          </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Specifications
            </h3>
            <div className="p-4 rounded-lg border border-border bg-bg space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-text-secondary block">Unit</span>
                  <span className="font-bold text-text capitalize">
                    {displayItem.unit}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block">Min threshold</span>
                  <span className="font-bold text-text">
                    {displayItem.minThreshold} {displayItem.unit}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-border grid grid-cols-2 gap-3">
                <div>
                  <span className="text-text-secondary block">Location</span>
                  <span className="font-semibold text-text flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-text-secondary shrink-0" />
                    {displayItem.location}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block">
                    Last known supplier
                  </span>
                  <span className="font-semibold text-text flex items-center gap-1">
                    <Truck className="h-3 w-3 text-text-secondary shrink-0" />
                    {displayItem.supplier || "Unspecified"}
                  </span>
                </div>
              </div>
              {displayItem.notes && (
                <div className="pt-2 border-t border-border space-y-1">
                  <span className="text-text-secondary block font-semibold">
                    Notes
                  </span>
                  <p className="text-text bg-bg-subtle p-2.5 rounded border border-border leading-relaxed">
                    {displayItem.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Supplier lots + QR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <QrCode className="h-3.5 w-3.5" />
                Purchase lots (QR per supplier batch)
              </h3>
              <span className="text-[10px] font-semibold text-text-secondary">
                {openLots.length} open · {lots.length} total
              </span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Each restock creates a lot with frozen unit cost and supplier.
              Print the lot QR for shelf tags — staff scan it to release
              quantity.
            </p>

            {lotsLoading ? (
              <LoadingState
                variant="card"
                icon="truck"
                message="Loading active purchase lots…"
                subtitle="Retrieving intake batches and lot allocations"
              />
            ) : lots.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-center">
                <p className="text-xs text-text-secondary">
                  No purchase lots yet. Restock with a supplier and unit cost to
                  create one.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {lots.map((lot) => {
                  const expanded = expandedLotId === lot.id;
                  const depleted = lot.quantityRemaining <= 0;
                  return (
                    <li
                      key={lot.id}
                      className={cn(
                        "rounded-lg border border-border bg-bg overflow-hidden",
                        depleted && "opacity-70"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedLotId(expanded ? null : lot.id)
                        }
                        className="w-full flex items-start gap-3 p-3 text-left hover:bg-bg-subtle/60 cursor-pointer"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] font-bold text-text">
                              {lot.lotCode}
                            </span>
                            {depleted ? (
                              <span className="text-[9px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded bg-bg-subtle text-text-secondary border border-border">
                                Depleted
                              </span>
                            ) : (
                              <span className="text-[9px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded bg-status-active-bg/15 text-status-active-text border border-status-active-bg/30">
                                Open
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-text-secondary truncate">
                            {lot.supplierName || "No supplier"} ·{" "}
                            {formatPhp(Number(lot.unitCost))}/{displayItem.unit}
                          </p>
                          <p className="text-[11px] text-text">
                            <span className="font-semibold">
                              {lot.quantityRemaining}
                            </span>
                            /{lot.quantity} remaining · received{" "}
                            {lot.purchasedOn}
                            {lot.recordedByName
                              ? ` · by ${lot.recordedByName}`
                              : ""}
                          </p>
                        </div>
                        {expanded ? (
                          <ChevronUp className="h-4 w-4 text-text-secondary shrink-0 mt-0.5" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-text-secondary shrink-0 mt-0.5" />
                        )}
                      </button>

                      {expanded && (
                        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                          <LotQrCodeDisplay
                            lotCode={lot.lotCode}
                            qrPayload={lot.qrPayload}
                            label={`${lot.itemName} · ${lot.supplierName || "—"}`}
                            size={128}
                          />
                          {!depleted && onRelease && (
                            <button
                              type="button"
                              onClick={() => onRelease(displayItem, lot)}
                              className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 cursor-pointer"
                            >
                              <PackageMinus className="h-3.5 w-3.5" />
                              Issue from this lot
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Stock movement ledger */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                Stock ledger
              </h3>
              <Link
                href={`/issue-history?kind=supply&item=${encodeURIComponent(displayItem.itemCode)}`}
                title="View issue history"
                className="p-1 rounded-md text-text-secondary hover:text-primary hover:bg-bg-subtle transition-colors cursor-pointer"
                aria-label="View issue history"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            {movementsLoading && movements.length === 0 ? (
              <LoadingState
                variant="card"
                icon="layers"
                message="Loading stock ledger…"
                subtitle="Retrieving in/out movements"
              />
            ) : movements.length === 0 ? (
              <div className="p-4 rounded-xl border border-border bg-bg shadow-xs">
                <p className="text-xs text-text-secondary text-center py-3">
                  No stock movements logged yet.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-border bg-bg shadow-xs">
                <>
                  <div className="relative">
                    <ol className="relative border-l-2 border-border/60 ml-3 space-y-6">
                      {displayedMovements.map((m) => {
                        const signedQty =
                          m.direction === "out" ? -m.qty : m.qty;
                        const style = getMovementStyle(m.reason, m.direction);
                        return (
                          <li key={m.id} className="relative pl-6">
                            <span
                              className={cn(
                                "absolute -left-3.25 top-1.5 h-6 w-6 rounded-full border-2 flex items-center justify-center bg-bg shadow-sm z-10",
                                style.bg,
                                style.iconText
                              )}
                            >
                              {getMovementIcon(m.reason)}
                            </span>
                            <div className="flex items-start justify-between gap-2 text-xs pt-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={cn(
                                    "font-bold capitalize",
                                    style.text
                                  )}
                                >
                                  {movementReasonLabel(m.reason)}
                                </span>
                                <span
                                  className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border",
                                    style.badge
                                  )}
                                >
                                  {signedQty > 0 ? "+" : ""}
                                  {signedQty} {displayItem.unit}
                                </span>
                                <span className="font-mono text-[10px] font-semibold text-text-secondary">
                                  {m.movementCode}
                                </span>
                              </div>
                              <time className="text-[11px] text-text-secondary shrink-0 font-medium">
                                {new Date(m.createdAt).toLocaleDateString()}
                              </time>
                            </div>
                            <p className="text-xs text-text-secondary mt-0.5 font-medium">
                              By{" "}
                              <span className="font-semibold text-text">
                                {m.actorName}
                              </span>
                              {m.destinationLabel
                                ? ` · ${m.destinationLabel}`
                                : null}
                            </p>
                            {(m.lotCode || m.unitCost || m.lineTotal) && (
                              <div className="mt-1.5 text-[11px] space-y-0.5 rounded border border-border bg-bg-subtle px-2 py-1.5">
                                {m.lotCode && (
                                  <p>
                                    <span className="text-text-secondary">
                                      Lot{" "}
                                    </span>
                                    <span className="font-mono font-semibold">
                                      {m.lotCode}
                                    </span>
                                  </p>
                                )}
                                {(m.unitCost || m.lineTotal) && (
                                  <p>
                                    {m.unitCost && (
                                      <>
                                        <span className="text-text-secondary">
                                          Unit{" "}
                                        </span>
                                        <span className="font-semibold">
                                          {formatPhp(Number(m.unitCost))}
                                        </span>
                                      </>
                                    )}
                                    {m.lineTotal && (
                                      <>
                                        <span className="text-text-secondary">
                                          {" "}
                                          · Line{" "}
                                        </span>
                                        <span className="font-semibold">
                                          {formatPhp(Number(m.lineTotal))}
                                        </span>
                                      </>
                                    )}
                                  </p>
                                )}
                              </div>
                            )}
                            {m.notes && (
                              <AuditNoteDisplay action={m.reason} note={m.notes} />
                            )}
                          </li>
                        );
                      })}
                    </ol>

                    {movements.length > 4 && !isHistoryExpanded && (
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-bg via-bg/85 to-transparent pointer-events-none" />
                    )}
                  </div>

                  {movements.length > 4 && (
                    <div
                      className={cn(
                        "relative z-10 flex justify-center",
                        !isHistoryExpanded ? "-mt-4 pt-1" : "mt-4 pt-2"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-bg/90 backdrop-blur-xs hover:bg-primary/10 border border-border shadow-xs cursor-pointer py-1 px-3 rounded-full transition-all duration-150"
                      >
                        {isHistoryExpanded ? (
                          <>
                            Show less <ChevronUp className="h-3.5 w-3.5" />
                          </>
                        ) : (
                          <>
                            See more ({movements.length - 4} more){" "}
                            <ChevronDown className="h-3.5 w-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
