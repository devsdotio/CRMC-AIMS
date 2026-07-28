"use client";

import { Plus } from "lucide-react";
import type { CategoryItem, CategoryType } from "./types";
import { CategoryListItem } from "./category-list-item";

export interface CategoryListProps {
  categories: CategoryItem[];
  type: CategoryType;
  title: string;
  description: string;
  onAddCategory: (type: CategoryType) => void;
  onEditCategory: (category: CategoryItem) => void;
  onDeleteCategory: (category: CategoryItem) => void;
}

export function CategoryList({
  categories,
  type,
  title,
  description,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: CategoryListProps) {
  return (
    <div className="p-6 rounded-2xl border border-border bg-bg space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-base font-bold text-text">{title}</h3>
          <p className="text-xs text-text-secondary mt-0.5">{description}</p>
        </div>

        <button
          type="button"
          onClick={() => onAddCategory(type)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Add Category
        </button>
      </div>

      <div className="space-y-2.5">
        {categories.map((cat) => (
          <CategoryListItem
            key={cat.id}
            category={cat}
            onEdit={onEditCategory}
            onDelete={onDeleteCategory}
          />
        ))}
      </div>
    </div>
  );
}
