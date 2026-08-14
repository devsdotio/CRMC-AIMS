"use client";

import { Edit3, Trash2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryStyle } from "@/constants/categories";
import type { CategoryItem } from "@/types/settings";

export interface CategoryListItemProps {
  category: CategoryItem;
  onEdit: (category: CategoryItem) => void;
  onDelete: (category: CategoryItem) => void;
}

export function getSwatchForName(name: string, colorToken?: string) {
  const style = getCategoryStyle(name, name, colorToken);
  return {
    bg: style.bg,
    text: style.text,
    border: "border-transparent",
  };
}

export function CategoryListItem({
  category,
  onEdit,
  onDelete,
}: CategoryListItemProps) {
  const isUsed = category.itemCount > 0;
  const categoryStyle = getCategoryStyle(category.name, category.name, category.colorToken);

  return (
    <div className="flex items-center justify-between gap-4 p-3.5 bg-bg rounded-xl border border-border transition-colors hover:bg-bg-subtle/60">
      <div className="flex items-center gap-3">
        <span 
          className={cn(
            "inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shrink-0 shadow-2xs",
            categoryStyle.bg,
            categoryStyle.text
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
