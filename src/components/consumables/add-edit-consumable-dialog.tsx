"use client";

import { useState, useEffect, useMemo } from "react";
import { X, PackagePlus, Edit } from "lucide-react";
import type { ConsumableItem, ConsumableCategory } from "@/types/inventory";
import { useCategoriesQuery } from "@/features/categories/client/use-categories";

export interface AddEditConsumableDialogProps {
  isOpen: boolean;
  initialItem?: ConsumableItem | null;
  onClose: () => void;
  onSave: (itemData: Partial<ConsumableItem>) => void | Promise<void>;
}

interface AddEditConsumableDialogFormProps {
  initialItem?: ConsumableItem | null;
  onClose: () => void;
  onSave: (itemData: Partial<ConsumableItem>) => void | Promise<void>;
}

function AddEditConsumableDialogForm({
  initialItem,
  onClose,
  onSave,
}: AddEditConsumableDialogFormProps) {
  const isEditing = Boolean(initialItem);
  const { data: allCategories = [], isLoading: categoriesLoading } =
    useCategoriesQuery();
  const consumableCategories = useMemo(() => {
    const fromSettings = allCategories.filter((c) => c.type === "consumable");
    const current = initialItem?.category?.trim();
    if (
      current &&
      !fromSettings.some(
        (c) => c.name.toLowerCase() === current.toLowerCase()
      )
    ) {
      return [
        {
          id: `legacy-${current}`,
          name: current,
          type: "consumable" as const,
        },
        ...fromSettings,
      ];
    }
    return fromSettings;
  }, [allCategories, initialItem?.category]);

  const [name, setName] = useState(() => initialItem?.name ?? "");
  const [category, setCategory] = useState(
    () => initialItem?.category ?? ""
  );
  const [unit, setUnit] = useState(() => initialItem?.unit ?? "reams");
  const [currentQty, setCurrentQty] = useState(
    () => initialItem?.currentQty ?? 50
  );
  const [minThreshold, setMinThreshold] = useState(
    () => initialItem?.minThreshold ?? 15
  );
  const [location, setLocation] = useState(
    () => initialItem?.location ?? "Supply Storage Bay A1"
  );
  const [supplier, setSupplier] = useState(() => initialItem?.supplier ?? "");
  const [notes, setNotes] = useState(() => initialItem?.notes ?? "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing || category || consumableCategories.length === 0) return;
    setCategory(consumableCategories[0].name);
  }, [consumableCategories, category, isEditing]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter the consumable item name.");
      return;
    }
    if (!category) {
      setError(
        consumableCategories.length === 0
          ? "No consumable categories yet. Add them under Settings → Categories."
          : "Please select a category."
      );
      return;
    }
    if (minThreshold < 1) {
      setError("Minimum reorder threshold must be at least 1.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onSave({
        id: initialItem ? initialItem.id : undefined,
        itemCode: initialItem
          ? initialItem.itemCode
          : `CON-${Math.floor(1000 + Math.random() * 9000)}`,
        name: name.trim(),
        category: category as ConsumableCategory,
        unit: unit.trim() || "units",
        currentQty: Number(currentQty),
        minThreshold: Number(minThreshold),
        location: location.trim() || "Supply Storage Bay",
        supplier: supplier.trim() || undefined,
        notes: notes.trim() || undefined,
        lastRestocked: new Date().toISOString().split("T")[0],
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save consumable."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity overflow-y-auto">
      <div
        className="absolute inset-0"
        onClick={isSubmitting ? undefined : onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="relative w-full max-w-lg rounded-2xl border border-border bg-bg p-6 shadow-2xl z-10 my-8"
      >
        <div className="flex items-center justify-between gap-3 mb-5 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent shrink-0">
              {isEditing ? (
                <Edit className="h-5 w-5" />
              ) : (
                <PackagePlus className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3
                id="dialog-title"
                className="text-base font-bold text-text leading-tight"
              >
                {isEditing
                  ? "Edit Consumable Item"
                  : "Register New Consumable Item"}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Categories come from Settings → Category Management.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="p-1 rounded-md text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-xs font-bold text-status-outofservice-text">
              {error}
            </p>
          )}

          <div className="space-y-1">
            <label
              htmlFor="consumable-name-input"
              className="block text-xs font-semibold text-text"
            >
              Item Name <span className="text-accent">*</span>
            </label>
            <input
              id="consumable-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              placeholder="e.g. A4 Multipurpose Copy Paper 80gsm"
              className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="category-select"
                className="block text-xs font-semibold text-text"
              >
                Category <span className="text-accent">*</span>
              </label>
              <select
                id="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting || categoriesLoading}
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text font-medium focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {categoriesLoading ? (
                  <option value="">Loading…</option>
                ) : consumableCategories.length === 0 ? (
                  <option value="">No categories — add in Settings</option>
                ) : (
                  <>
                    <option value="" disabled>
                      Select a category…
                    </option>
                    {consumableCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="unit-input"
                className="block text-xs font-semibold text-text"
              >
                Unit of Measure <span className="text-accent">*</span>
              </label>
              <input
                id="unit-input"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                disabled={isSubmitting}
                placeholder="e.g. reams, bottles, cartridges"
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="qty-input"
                className="block text-xs font-semibold text-text"
              >
                Current Qty
              </label>
              <input
                id="qty-input"
                type="number"
                min={0}
                value={currentQty}
                onChange={(e) => setCurrentQty(Number(e.target.value))}
                disabled={isSubmitting || isEditing}
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70"
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="min-input"
                className="block text-xs font-semibold text-text"
              >
                Min Threshold
              </label>
              <input
                id="min-input"
                type="number"
                min={1}
                value={minThreshold}
                onChange={(e) => setMinThreshold(Number(e.target.value))}
                disabled={isSubmitting}
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="location-input"
              className="block text-xs font-semibold text-text"
            >
              Storage Location
            </label>
            <input
              id="location-input"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isSubmitting}
              className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="supplier-input"
              className="block text-xs font-semibold text-text"
            >
              Supplier (optional)
            </label>
            <input
              id="supplier-input"
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              disabled={isSubmitting}
              className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="notes-input"
              className="block text-xs font-semibold text-text"
            >
              Notes
            </label>
            <textarea
              id="notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              disabled={isSubmitting}
              className="w-full p-2.5 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-bold rounded-lg border border-border bg-bg text-text hover:bg-bg-subtle disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || consumableCategories.length === 0}
              className="h-9 px-4 text-xs font-bold rounded-lg bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Register item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddEditConsumableDialog({
  isOpen,
  initialItem,
  onClose,
  onSave,
}: AddEditConsumableDialogProps) {
  if (!isOpen) return null;
  return (
    <AddEditConsumableDialogForm
      key={initialItem?.id ?? "new"}
      initialItem={initialItem}
      onClose={onClose}
      onSave={onSave}
    />
  );
}
