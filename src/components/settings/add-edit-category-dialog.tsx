"use client";

import { useState, useEffect } from "react";
import { X, Tag, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryItem, CategoryType } from "@/types/settings";

export interface AddEditCategoryDialogProps {
  isOpen: boolean;
  type: CategoryType;
  initialCategory?: CategoryItem | null;
  onClose: () => void;
  onSave: (categoryData: Partial<CategoryItem>) => void;
}


export function AddEditCategoryDialog({
  isOpen,
  type,
  initialCategory,
  onClose,
  onSave,
}: AddEditCategoryDialogProps) {
  const isEditing = Boolean(initialCategory);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const [prevOpenKey, setPrevOpenKey] = useState({ isOpen: false, id: initialCategory?.id });
  if (isOpen !== prevOpenKey.isOpen || initialCategory?.id !== prevOpenKey.id) {
    setPrevOpenKey({ isOpen, id: initialCategory?.id });
    if (isOpen) {
      if (initialCategory) {
        setName(initialCategory.name);
      } else {
        setName("");
      }
      setError("");
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter the category name.");
      return;
    }

    onSave({
      id: initialCategory ? initialCategory.id : `cat-${Date.now()}`,
      name: name.trim(),
      type,
      itemCount: initialCategory ? initialCategory.itemCount : 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Dialog Window */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cat-dialog-title"
        className="relative w-full max-w-md rounded-2xl border border-border bg-bg p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 space-y-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent shrink-0">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 id="cat-dialog-title" className="text-base font-bold text-text leading-tight">
                {isEditing ? `Edit ${type === "asset" ? "Asset" : "Consumable"} Category` : `Add New ${type === "asset" ? "Asset" : "Consumable"} Category`}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Configure taxonomy label & palette styling
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close category dialog"
            className="p-1 rounded-md text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Name */}
          <div className="space-y-1.5">
            <label htmlFor="cat-name-input" className="block text-xs font-semibold text-text">
              Category Name <span className="text-accent">*</span>
            </label>
            <input
              id="cat-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Computing, AV Equipment, Cleaning"
              className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>


          {error && <p className="text-xs font-bold text-status-outofservice-text">{error}</p>}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text rounded-md border border-border bg-bg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              {isEditing ? "Save Category Changes" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
