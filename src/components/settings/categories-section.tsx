"use client";

import { useState } from "react";
import type { CategoryItem, CategoryType } from "@/types/settings";
import { CategoryList } from "./category-list";
import { AddEditCategoryDialog } from "./add-edit-category-dialog";

export interface CategoriesSectionProps {
  assetCategories: CategoryItem[];
  consumableCategories: CategoryItem[];
  onSaveCategory: (categoryData: Partial<CategoryItem>) => void;
  onDeleteCategory: (category: CategoryItem) => void;
}

export function CategoriesSection({
  assetCategories,
  consumableCategories,
  onSaveCategory,
  onDeleteCategory,
}: CategoriesSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryItem | null>(null);
  const [dialogType, setDialogType] = useState<CategoryType>("asset");

  const handleAddCategory = (type: CategoryType) => {
    setEditTarget(null);
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleEditCategory = (category: CategoryItem) => {
    setEditTarget(category);
    setDialogType(category.type);
    setDialogOpen(true);
  };

  return (
    <div className="w-full space-y-6">
      <CategoryList
        categories={assetCategories}
        type="asset"
        title="Institutional Asset Categories"
        description="Taxonomy labels used to classify fixed institutional assets in the registry"
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={onDeleteCategory}
      />

      <CategoryList
        categories={consumableCategories}
        type="consumable"
        title="Consumable Supply Categories"
        description="Taxonomy labels used to classify consumable office and operational supplies"
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={onDeleteCategory}
      />

      <AddEditCategoryDialog
        isOpen={dialogOpen}
        type={dialogType}
        initialCategory={editTarget}
        onClose={() => {
          setDialogOpen(false);
          setEditTarget(null);
        }}
        onSave={onSaveCategory}
      />
    </div>
  );
}
