"use client";

import { useState, useEffect } from "react";
import { X, PackagePlus, Edit } from "lucide-react";

import type { ConsumableItem, ConsumableCategory } from "@/types/inventory";

export interface AddEditConsumableDialogProps {
  isOpen: boolean;
  initialItem?: ConsumableItem | null;
  onClose: () => void;
  onSave: (itemData: Partial<ConsumableItem>) => void;
}

export function AddEditConsumableDialog({
  isOpen,
  initialItem,
  onClose,
  onSave,
}: AddEditConsumableDialogProps) {
  const isEditing = Boolean(initialItem);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<ConsumableCategory>("office_supplies");
  const [unit, setUnit] = useState("reams");
  const [currentQty, setCurrentQty] = useState<number>(0);
  const [minThreshold, setMinThreshold] = useState<number>(10);
  const [location, setLocation] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setName(initialItem.name);
        setCategory(initialItem.category);
        setUnit(initialItem.unit);
        setCurrentQty(initialItem.currentQty);
        setMinThreshold(initialItem.minThreshold);
        setLocation(initialItem.location);
        setSupplier(initialItem.supplier || "");
        setNotes(initialItem.notes || "");
      } else {
        setName("");
        setCategory("office_supplies");
        setUnit("reams");
        setCurrentQty(50);
        setMinThreshold(15);
        setLocation("Supply Storage Bay A1");
        setSupplier("");
        setNotes("");
      }
      setError("");
    }
  }, [isOpen, initialItem]);

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
      setError("Please enter the consumable item name.");
      return;
    }
    if (minThreshold < 1) {
      setError("Minimum reorder threshold must be at least 1.");
      return;
    }

    onSave({
      id: initialItem ? initialItem.id : `con-${Date.now()}`,
      itemCode: initialItem ? initialItem.itemCode : `CON-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      category,
      unit: unit.trim() || "units",
      currentQty: Number(currentQty),
      minThreshold: Number(minThreshold),
      location: location.trim() || "Supply Storage Bay",
      supplier: supplier.trim() || undefined,
      notes: notes.trim() || undefined,
      lastRestocked: new Date().toISOString().split("T")[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Dialog Window */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="relative w-full max-w-lg rounded-2xl border border-border bg-bg p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent shrink-0">
              {isEditing ? <Edit className="h-5 w-5" /> : <PackagePlus className="h-5 w-5" />}
            </div>
            <div>
              <h3 id="dialog-title" className="text-base font-bold text-text leading-tight">
                {isEditing ? "Edit Consumable Item" : "Register New Consumable Item"}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                {isEditing ? `Updating ${initialItem?.itemCode}` : "Add non-serialized supply item & threshold"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-md text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Name */}
          <div className="space-y-1">
            <label htmlFor="consumable-name-input" className="block text-xs font-semibold text-text">
              Item Name <span className="text-accent">*</span>
            </label>
            <input
              id="consumable-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. A4 Multipurpose Copy Paper 80gsm"
              className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Category & Unit Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="category-select" className="block text-xs font-semibold text-text">
                Category <span className="text-accent">*</span>
              </label>
              <select
                id="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as ConsumableCategory)}
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text font-medium focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="paper">Paper Products</option>
                <option value="ink_toner">Ink & Toner</option>
                <option value="cleaning">Cleaning & Sanitation</option>
                <option value="office_supplies">Office Supplies</option>
                <option value="medical">Medical Disposables</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="unit-input" className="block text-xs font-semibold text-text">
                Unit of Measure <span className="text-accent">*</span>
              </label>
              <input
                id="unit-input"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. reams, bottles, cartridges, boxes"
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Quantities Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-bg-subtle">
            <div className="space-y-1">
              <label htmlFor="current-qty-input" className="block text-xs font-semibold text-text">
                Current Initial Stock Qty
              </label>
              <input
                id="current-qty-input"
                type="number"
                value={currentQty}
                onChange={(e) => setCurrentQty(Number(e.target.value))}
                min={0}
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg font-bold text-text focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="min-threshold-input" className="block text-xs font-semibold text-text">
                Minimum Reorder Threshold <span className="text-accent">*</span>
              </label>
              <input
                id="min-threshold-input"
                type="number"
                value={minThreshold}
                onChange={(e) => setMinThreshold(Number(e.target.value))}
                min={1}
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg font-bold text-accent focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Location & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="location-input-con" className="block text-xs font-semibold text-text">
                Storage Location
              </label>
              <input
                id="location-input-con"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Supply Storage Bay A1"
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="supplier-input" className="block text-xs font-semibold text-text">
                Supplier Name (Optional)
              </label>
              <input
                id="supplier-input"
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. PaperLine Philippines"
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label htmlFor="consumable-notes-input" className="block text-xs font-semibold text-text">
              Notes / Consumption Specs
            </label>
            <textarea
              id="consumable-notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add specific reorder leads, packaging sizes, or usage instructions…"
              className="w-full p-2.5 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
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
              className="px-4 py-2 text-xs font-semibold rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              {isEditing ? "Save Changes" : "Create Supply Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
