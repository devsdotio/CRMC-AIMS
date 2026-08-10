"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  PlusCircle,
  SlidersHorizontal,
  MapPin,
  Truck,
  History,
  Tag,
  PackageMinus,
  QrCode,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { ConsumableItem, StockHistoryEntry } from "@/types/inventory";
import type { PurchaseLot } from "@/types/purchase-lots";
import { usePurchaseLotsQuery } from "@/features/purchase-lots/client";
import { formatPhp } from "@/components/projects/format-money";
import { StockLevelBar } from "./stock-level-bar";
import { LotQrCodeDisplay } from "./lot-qr-code-display";

export interface ConsumableDetailPanelProps {
  item: ConsumableItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRestock: (item: ConsumableItem) => void;
  onAdjust: (item: ConsumableItem) => void;
  onRelease: (item: ConsumableItem, lot?: PurchaseLot | null) => void;
  onEdit?: (item: ConsumableItem) => void;
}

function historyTypeLabel(type: StockHistoryEntry["type"]) {
  if (type === "restock") return "Restock";
  if (type === "checkout") return "Release / checkout";
  return "Adjustment";
}

function actionTone(type: StockHistoryEntry["type"]) {
  if (type === "restock") return "text-status-active-text";
  if (type === "checkout") return "text-primary";
  return "text-text-secondary";
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

  const { data: lots = [], isLoading: lotsLoading } = usePurchaseLotsQuery({
    consumableId: item?.id,
    itemType: "consumable",
    enabled: Boolean(isOpen && item?.id),
  });

  const openLots = useMemo(
    () => lots.filter((l) => l.quantityRemaining > 0),
    [lots]
  );

  const historyNewestFirst = useMemo(() => {
    if (!item?.history) return [];
    return [...item.history].reverse();
  }, [item?.history]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    setExpandedLotId(null);
  }, [item?.id]);

  if (!isOpen || !item) return null;

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
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-text bg-bg px-2 py-0.5 rounded border border-border">
                {item.itemCode}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-bg-subtle text-text-secondary border border-border">
                <Tag className="h-2.5 w-2.5" />
                {item.category.replace(/_/g, " ")}
              </span>
            </div>
            <h2
              id="consumable-detail-heading"
              className="text-base font-bold text-text mt-0.5 leading-tight truncate"
            >
              {item.name}
            </h2>
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
              currentQty={item.currentQty}
              minThreshold={item.minThreshold}
              unit={item.unit}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onRestock(item)}
              className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-lg text-xs font-bold bg-accent text-accent-foreground hover:opacity-90 cursor-pointer shadow-xs"
            >
              <PlusCircle className="h-4 w-4" />
              Restock
            </button>
            <button
              type="button"
              onClick={() => onRelease(item)}
              className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-lg text-xs font-bold border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 cursor-pointer"
            >
              <PackageMinus className="h-4 w-4" />
              Release (lot)
            </button>
            <button
              type="button"
              onClick={() => onAdjust(item)}
              className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-lg text-xs font-semibold border border-border bg-bg text-text hover:border-primary cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Adjust
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-lg text-xs font-semibold border border-border bg-bg text-text hover:border-primary cursor-pointer"
              >
                Edit details
              </button>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Specifications
            </h3>
            <div className="p-4 rounded-lg border border-border bg-bg space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-text-secondary block">Unit</span>
                  <span className="font-bold text-text capitalize">
                    {item.unit}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block">Min threshold</span>
                  <span className="font-bold text-text">
                    {item.minThreshold} {item.unit}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-border grid grid-cols-2 gap-3">
                <div>
                  <span className="text-text-secondary block">Location</span>
                  <span className="font-semibold text-text flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-text-secondary shrink-0" />
                    {item.location}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block">
                    Last known supplier
                  </span>
                  <span className="font-semibold text-text flex items-center gap-1">
                    <Truck className="h-3 w-3 text-text-secondary shrink-0" />
                    {item.supplier || "Unspecified"}
                  </span>
                </div>
              </div>
              {item.notes && (
                <div className="pt-2 border-t border-border space-y-1">
                  <span className="text-text-secondary block font-semibold">
                    Notes
                  </span>
                  <p className="text-text bg-bg-subtle p-2.5 rounded border border-border leading-relaxed">
                    {item.notes}
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
              <p className="text-xs text-text-secondary py-3">Loading lots…</p>
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
                            {formatPhp(Number(lot.unitCost))}/{item.unit}
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
                          {!depleted && (
                            <button
                              type="button"
                              onClick={() => onRelease(item, lot)}
                              className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 cursor-pointer"
                            >
                              <PackageMinus className="h-3.5 w-3.5" />
                              Release from this lot
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

          {/* Accountability history */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              Accountability log
            </h3>
            <div className="p-4 rounded-lg border border-border bg-bg">
              {historyNewestFirst.length === 0 ? (
                <p className="text-xs text-text-secondary text-center py-3">
                  No stock movements logged yet.
                </p>
              ) : (
                <ol className="relative border-l border-border ml-2 space-y-4">
                  {historyNewestFirst.map((h) => {
                    const isPositive = h.quantityChange > 0;
                    return (
                      <li key={h.id} className="ml-4">
                        <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-bg bg-accent" />
                        <div className="flex items-start justify-between gap-2 text-xs">
                          <span
                            className={cn(
                              "font-bold capitalize",
                              actionTone(h.type)
                            )}
                          >
                            {historyTypeLabel(h.type)} (
                            {isPositive ? "+" : ""}
                            {h.quantityChange} {item.unit})
                          </span>
                          <time className="text-[11px] text-text-secondary shrink-0">
                            {h.date}
                          </time>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">
                          By <span className="font-semibold text-text">{h.actor}</span>
                          {h.recipientName
                            ? ` · to ${h.recipientName}`
                            : null}
                        </p>
                        {(h.lotCode ||
                          h.supplierName ||
                          h.unitCost ||
                          h.totalCost) && (
                          <div className="mt-1 text-[11px] space-y-0.5 rounded border border-border bg-bg-subtle px-2 py-1.5">
                            {h.lotCode && (
                              <p>
                                <span className="text-text-secondary">Lot </span>
                                <span className="font-mono font-semibold">
                                  {h.lotCode}
                                </span>
                              </p>
                            )}
                            {h.supplierName && (
                              <p>
                                <span className="text-text-secondary">
                                  Supplier{" "}
                                </span>
                                <span className="font-semibold">
                                  {h.supplierName}
                                </span>
                              </p>
                            )}
                            {(h.unitCost || h.totalCost) && (
                              <p>
                                {h.unitCost && (
                                  <>
                                    <span className="text-text-secondary">
                                      Unit{" "}
                                    </span>
                                    <span className="font-semibold">
                                      {formatPhp(Number(h.unitCost))}
                                    </span>
                                  </>
                                )}
                                {h.totalCost && (
                                  <>
                                    <span className="text-text-secondary">
                                      {" "}
                                      · Line{" "}
                                    </span>
                                    <span className="font-semibold">
                                      {formatPhp(Number(h.totalCost))}
                                    </span>
                                  </>
                                )}
                              </p>
                            )}
                          </div>
                        )}
                        {h.reason && (
                          <p className="text-[11px] text-accent font-semibold mt-0.5">
                            Reason: {h.reason}
                          </p>
                        )}
                        {h.notes && (
                          <p className="text-xs text-text bg-bg-subtle p-2 rounded mt-1 border border-border">
                            {h.notes}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
