"use client";

import { Edit3, Trash2, Tag, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryItem } from "./types";

export interface CategoryListItemProps {
  category: CategoryItem;
  onEdit: (category: CategoryItem) => void;
  onDelete: (category: CategoryItem) => void;
}

const COLOR_SWATCH_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  transport: { bg: "bg-category-transport-bg", text: "text-category-transport-text", label: "Transport" },
  computing: { bg: "bg-category-computing-bg", text: "text-category-computing-text", label: "Computing" },
  av:        { bg: "bg-category-av-bg",        text: "text-category-av-text",        label: "AV Equipment" },
  furniture: { bg: "bg-category-furniture-bg", text: "text-category-furniture-text", label: "Furniture" },
};

export function CategoryListItem({
  category,
  onEdit,
  onDelete,
}: CategoryListItemProps) {
  const swatch = category.colorToken ? COLOR_SWATCH_STYLES[category.colorToken] : null;
  const isUsed = category.itemCount > 0;

  return (
    <div className="flex items-center justify-between gap-4 p-3.5 bg-bg rounded-xl border border-border transition-colors hover:bg-bg-subtle/60">
      <div className="flex items-center gap-3">
        {/* Color Swatch or Tag Icon */}
        {swatch ? (
          <span
            className={cn(
              "inline-flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold shrink-0 border border-current/20",
              swatch.bg,
              swatch.text
            )}
          >
            <Tag className="h-3.5 w-3.5" />
          </span>
        ) : (
          <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold shrink-0 bg-bg-subtle text-text-secondary border border-border">
            <Tag className="h-3.5 w-3.5" />
          </span>
        )}

        <div>
          <span className="text-xs font-bold text-text block leading-tight">
            {category.name}
          </span>
          <span className="text-[11px] text-text-secondary block mt-0.5">
            {category.itemCount} {category.type === "asset" ? "assets" : "supplies"} categorized
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit(category)}
          aria-label={`Edit category ${category.name}`}
          className="p-1.5 rounded-md border border-border bg-bg text-text-secondary hover:text-text hover:border-primary transition-colors cursor-pointer"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>

        {isUsed ? (
          <button
            type="button"
            disabled
            title={`${category.itemCount} items use this category — reassign them before deleting.`}
            className="p-1.5 rounded-md border border-border/40 bg-bg-subtle text-text-secondary/40 cursor-not-allowed opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onDelete(category)}
            aria-label={`Delete category ${category.name}`}
            className="p-1.5 rounded-md border border-border bg-bg text-text-secondary hover:border-status-retired-bg hover:text-status-retired-text transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
