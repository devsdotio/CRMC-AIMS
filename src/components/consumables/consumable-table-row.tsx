"use client";

import { PlusCircle, SlidersHorizontal, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConsumableItem } from "./types";
import { StockLevelBar } from "./stock-level-bar";

export interface ConsumableTableRowProps {
  item: ConsumableItem;
  onSelect: (item: ConsumableItem) => void;
  onRestock: (item: ConsumableItem) => void;
  onAdjust: (item: ConsumableItem) => void;
}

export function ConsumableTableRow({
  item,
  onSelect,
  onRestock,
  onAdjust,
}: ConsumableTableRowProps) {
  return (
    <tr
      onClick={() => onSelect(item)}
      tabIndex={0}
      role="row"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(item);
        }
      }}
      className={cn(
        "group border-b border-border bg-bg transition-colors duration-100 cursor-pointer",
        "hover:bg-bg-subtle/80 focus:outline-none focus-visible:bg-bg-subtle"
      )}
    >
      {/* Code & Item Name */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-text bg-bg-subtle px-1.5 py-0.5 rounded border border-border">
            {item.itemCode}
          </span>
          <span className="text-sm font-bold text-text group-hover:text-accent transition-colors block leading-tight">
            {item.name}
          </span>
        </div>
      </td>

      {/* Category Tag */}
      <td className="px-3 py-3.5 whitespace-nowrap">
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-bg-subtle text-text-secondary border border-border">
          <Tag className="h-2.5 w-2.5" />
          {item.category.replace("_", " ")}
        </span>
      </td>

      {/* Stock Level Bar Column */}
      <td className="px-3 py-3.5 min-w-[200px]">
        <StockLevelBar
          currentQty={item.currentQty}
          minThreshold={item.minThreshold}
          unit={item.unit}
        />
      </td>

      {/* Last Restocked */}
      <td className="px-3 py-3.5 text-xs text-text-secondary whitespace-nowrap hidden md:table-cell">
        {item.lastRestocked}
      </td>

      {/* Actions */}
      <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onAdjust(item)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-border bg-bg text-xs font-semibold text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
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
      </td>
    </tr>
  );
}
