"use client";

import { useEffect, useRef } from "react";
import { X, PlusCircle, SlidersHorizontal, MapPin, Truck, History, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsumableItem } from "@/types/inventory";
import { StockLevelBar } from "./stock-level-bar";

export interface ConsumableDetailPanelProps {
  item: ConsumableItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRestock: (item: ConsumableItem) => void;
  onAdjust: (item: ConsumableItem) => void;
}

export function ConsumableDetailPanel({
  item,
  isOpen,
  onClose,
  onRestock,
  onAdjust,
}: ConsumableDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer Container */}
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-subtle/50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-text bg-bg px-2 py-0.5 rounded border border-border">
                {item.itemCode}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-bg-subtle text-text-secondary border border-border">
                <Tag className="h-2.5 w-2.5" />
                {item.category.replace("_", " ")}
              </span>
            </div>
            <h2 id="consumable-detail-heading" className="text-base font-bold text-text mt-0.5 leading-tight">
              {item.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail panel"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-border transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stock Level Card */}
          <div className="p-4 rounded-xl border border-border bg-bg-subtle space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
              Stock Status & Severity
            </span>
            <StockLevelBar currentQty={item.currentQty} minThreshold={item.minThreshold} unit={item.unit} />
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onRestock(item)}
              className="inline-flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-bold bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <PlusCircle className="h-4 w-4" />
              Restock Inventory
            </button>

            <button
              type="button"
              onClick={() => onAdjust(item)}
              className="inline-flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-semibold border border-border bg-bg text-text hover:border-primary transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Manual Adjustment
            </button>
          </div>

          {/* Item Specification Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Supply Specifications
            </h3>
            <div className="p-4 rounded-lg border border-border bg-bg space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-text-secondary block">Unit of Measure:</span>
                  <span className="font-bold text-text capitalize">{item.unit}</span>
                </div>
                <div>
                  <span className="text-text-secondary block">Min Reorder Threshold:</span>
                  <span className="font-bold text-text">{item.minThreshold} {item.unit}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border grid grid-cols-2 gap-3">
                <div>
                  <span className="text-text-secondary block">Storage Location:</span>
                  <span className="font-semibold text-text flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-text-secondary" />
                    {item.location}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block">Preferred Supplier:</span>
                  <span className="font-semibold text-text flex items-center gap-1">
                    <Truck className="h-3 w-3 text-text-secondary" />
                    {item.supplier || "Unspecified"}
                  </span>
                </div>
              </div>

              {item.notes && (
                <div className="pt-2 border-t border-border space-y-1">
                  <span className="text-text-secondary block font-semibold">Notes:</span>
                  <p className="text-text bg-bg-subtle p-2.5 rounded border border-border leading-relaxed">
                    {item.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chronological History Log */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              Stock Movement History
            </h3>
            <div className="p-4 rounded-lg border border-border bg-bg">
              {item.history.length === 0 ? (
                <p className="text-xs text-text-secondary text-center py-3">
                  No stock adjustments or restock transactions logged for this item yet.
                </p>
              ) : (
                <ol className="relative border-l border-border ml-2 space-y-4">
                  {item.history.map((h) => {
                    const isPositive = h.quantityChange > 0;
                    return (
                      <li key={h.id} className="ml-4">
                        <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-bg bg-accent" />
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-text capitalize">
                            {h.type} ({isPositive ? `+${h.quantityChange}` : h.quantityChange} {item.unit})
                          </span>
                          <time className="text-[11px] text-text-secondary">{h.date}</time>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">By {h.actor}</p>
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
