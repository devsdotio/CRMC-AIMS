"use client";

import { PlusCircle, SlidersHorizontal, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsumableItem } from "@/types/inventory";
import { StockLevelBar } from "./stock-level-bar";

export interface ConsumableCardProps {
  item: ConsumableItem;
  onSelect: (item: ConsumableItem) => void;
  onRestock: (item: ConsumableItem) => void;
  onAdjust: (item: ConsumableItem) => void;
}

export function ConsumableCard({
  item,
  onSelect,
  onRestock,
  onAdjust,
}: ConsumableCardProps) {
  return (
    <div
      onClick={() => onSelect(item)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(item);
        }
      }}
      className={cn(
        "group relative flex flex-col rounded-xl border border-border bg-bg overflow-hidden transition-all duration-200 cursor-pointer",
        "hover:shadow-md hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      )}
    >
      {/* Top Banner: Item Code & Category Tag (Neutral colors per design rule) */}
      <div className="flex items-center justify-between p-3.5 border-b border-border bg-bg-subtle/50">
        <span className="font-mono text-xs font-bold text-text bg-bg px-2 py-0.5 rounded border border-border">
          {item.itemCode}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-bg-subtle text-text-secondary border border-border">
          <Tag className="h-2.5 w-2.5" />
          {item.category.replace("_", " ")}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <h3 className="text-sm font-bold text-text leading-snug line-clamp-2 group-hover:text-accent transition-colors">
          {item.name}
        </h3>

        {/* Stock Level Bar Component */}
        <div className="mt-auto pt-2">
          <StockLevelBar
            currentQty={item.currentQty}
            minThreshold={item.minThreshold}
            unit={item.unit}
          />
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-4 py-2.5 bg-bg-subtle border-t border-border flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onAdjust(item)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-secondary hover:text-text cursor-pointer"
        >
          <SlidersHorizontal className="h-3 w-3" />
          Adjust
        </button>

        <button
          type="button"
          onClick={() => onRestock(item)}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Restock
        </button>
      </div>
    </div>
  );
}
