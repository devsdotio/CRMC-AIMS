"use client";

import { Edit3, Trash2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

import type { CategoryItem } from "@/types/settings";

export interface CategoryListItemProps {
  category: CategoryItem;
  onEdit: (category: CategoryItem) => void;
  onDelete: (category: CategoryItem) => void;
}

const SWATCH_COLORS = [
  { bg: "bg-blue-500/15", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" },
  { bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
  { bg: "bg-violet-500/15", text: "text-violet-600 dark:text-violet-400", border: "border-violet-500/20" },
  { bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20" },
  { bg: "bg-rose-500/15", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/20" },
  { bg: "bg-cyan-500/15", text: "text-cyan-600 dark:text-cyan-400", border: "border-cyan-500/20" },
];

export function getSwatchForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SWATCH_COLORS.length;
  return SWATCH_COLORS[index];
}

export function CategoryListItem({
  category,
  onEdit,
  onDelete,
}: CategoryListItemProps) {
  const isUsed = category.itemCount > 0;
  const swatch = getSwatchForName(category.name);

  return (
    <div className="flex items-center justify-between gap-4 p-3.5 bg-bg rounded-xl border border-border transition-colors hover:bg-bg-subtle/60">
      <div className="flex items-center gap-3">
          <span 
            className={cn(
              "inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shrink-0 border",
              swatch.bg,
              swatch.text,
              swatch.border
            )}
          >
            <Tag className="h-3.5 w-3.5" />
          </span>

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
