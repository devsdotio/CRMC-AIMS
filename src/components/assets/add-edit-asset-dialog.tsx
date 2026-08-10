"use client";

import { useState, useEffect } from "react";
import { X, PackagePlus, Edit } from "lucide-react";

import type {
  Asset,
  AssetCategory,
  AssetStatus,
  AssetAssignmentType,
} from "@/types/assets";
import {
  ASSET_CATEGORY_OPTIONS,
  assetCategoryCodePrefix,
  normalizeAssetCategory,
  type AssetCategoryCode,
} from "@/lib/asset-category";
import { QRCodeDisplay } from "./qr-code-display";

export interface AddEditAssetDialogProps {
  isOpen: boolean;
  initialAsset?: Asset | null;
  onClose: () => void;
  onSave: (assetData: Partial<Asset>) => Promise<void> | void;
}

function generateAssetCode(category: AssetCategoryCode): string {
  const prefix = assetCategoryCodePrefix(category);
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${randomNum}`;
}

interface AddEditAssetDialogFormProps {
  initialAsset?: Asset | null;
  onClose: () => void;
  onSave: (assetData: Partial<Asset>) => Promise<void> | void;
}

function AddEditAssetDialogForm({
  initialAsset,
  onClose,
  onSave,
}: AddEditAssetDialogFormProps) {
  const isEditing = Boolean(initialAsset);

  const [name, setName] = useState(() => initialAsset?.name ?? "");
  const initialCategory = normalizeAssetCategory(initialAsset?.category) ?? "";
  const [category, setCategory] = useState<AssetCategoryCode | "">(
    initialCategory
  );
  const [status, setStatus] = useState<AssetStatus | "">(
    () => initialAsset?.status ?? "active"
  );
  const [assignmentType, setAssignmentType] = useState<AssetAssignmentType>(
    () => initialAsset?.assignmentType ?? "borrowable"
  );
  const [assetCode, setAssetCode] = useState(
    () =>
      initialAsset?.assetCode ??
      (initialCategory ? generateAssetCode(initialCategory) : "")
  );
  const [serialNumber, setSerialNumber] = useState(
    () => initialAsset?.serialNumber ?? ""
  );
  const [location, setLocation] = useState(
    () => initialAsset?.location ?? ""
  );
  const [department] = useState(() => initialAsset?.department ?? "");
  const [notes, setNotes] = useState(() => initialAsset?.notes ?? "");
  const [value, setValue] = useState(() =>
    initialAsset?.value != null ? String(initialAsset.value) : ""
  );
  const [purchaseDate, setPurchaseDate] = useState(
    () => initialAsset?.purchaseDate ?? ""
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategoryChange = (newCat: AssetCategoryCode | "") => {
    setCategory(newCat);
    if (!isEditing && newCat) {
      setAssetCode(generateAssetCode(newCat));
    } else if (!isEditing && !newCat) {
      setAssetCode("");
    }
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter the asset name.");
      return;
    }
    if (!category) {
      setError("Please select an asset category.");
      return;
    }
    if (!status) {
      setError("Please select an initial condition.");
      return;
    }
    if (!location.trim()) {
      setError("Please enter the asset location.");
      return;
    }
    const code = (
      assetCode.trim() || generateAssetCode(category)
    ).toUpperCase();
    if (!code || code === "PENDING...") {
      setError(
        "Asset code could not be generated. Select a category and try again."
      );
      return;
    }
    if (value.trim() !== "" && !Number.isFinite(Number(value))) {
      setError("Acquisition value must be a valid number.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onSave({
        id: initialAsset ? initialAsset.id : undefined,
        assetCode: code,
        name: name.trim(),
        category: category as AssetCategory,
        status: status as AssetStatus,
        assignmentType,
        serialNumber: serialNumber.trim() || undefined,
        location: location.trim(),
        department: department.trim() || undefined,
        notes: notes.trim() || undefined,
        value: value.trim() !== "" ? Number(value) : undefined,
        purchaseDate: purchaseDate || undefined,
        lastUpdated: new Date().toISOString().split("T")[0],
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while saving. Please try again."
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
        className="relative w-full max-w-4xl rounded-2xl border border-border bg-bg p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 my-8"
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
                {isEditing ? "Edit Asset Record" : "Register New Asset"}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Categories use registry codes matching the database enum:
                transport, computing, av, furniture.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-border disabled:opacity-50 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="text-xs font-bold text-status-outofservice-text bg-status-outofservice-bg/15 border border-status-outofservice-bg/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor="asset-name"
                  className="block text-xs font-semibold text-text"
                >
                  Asset Name <span className="text-accent">*</span>
                </label>
                <input
                  id="asset-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="e.g. MacBook Pro 16-inch, Canon DSLR Camera"
                  disabled={isSubmitting}
                  className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="category-select"
                    className="block text-xs font-semibold text-text"
                  >
                    Asset Category <span className="text-accent">*</span>
                  </label>
                  <select
                    id="category-select"
                    value={category}
                    onChange={(e) =>
                      handleCategoryChange(
                        e.target.value as AssetCategoryCode | ""
                      )
                    }
                    disabled={isSubmitting}
                    className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="" disabled>
                      Select a category...
                    </option>
                    {ASSET_CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="status-select"
                    className="block text-xs font-semibold text-text"
                  >
                    Initial Condition <span className="text-accent">*</span>
                  </label>
                  <select
                    id="status-select"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as AssetStatus | "")
                    }
                    disabled={isSubmitting}
                    className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="active">Active (Serviceable)</option>
                    <option value="needs_repair">Needs Repair</option>
                    <option value="out_of_service">Out of Service</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <span className="block text-xs font-semibold text-text">
                  Assignment Type <span className="text-accent">*</span>
                </span>
                <div className="flex flex-wrap gap-4 items-center min-h-9">
                  <label className="flex items-center gap-2 text-xs text-text cursor-pointer">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="borrowable"
                      checked={assignmentType === "borrowable"}
                      onChange={(e) =>
                        setAssignmentType(
                          e.target.value as AssetAssignmentType
                        )
                      }
                      disabled={isSubmitting}
                      className="text-accent focus:ring-accent"
                    />
                    Borrowable (short-term checkout)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-text cursor-pointer">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="assignable"
                      checked={assignmentType === "assignable"}
                      onChange={(e) =>
                        setAssignmentType(
                          e.target.value as AssetAssignmentType
                        )
                      }
                      disabled={isSubmitting}
                      className="text-accent focus:ring-accent"
                    />
                    Assignable (project custody)
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="serial-input"
                    className="block text-xs font-semibold text-text"
                  >
                    Serial Number
                  </label>
                  <input
                    id="serial-input"
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g. SN-DL-98214-X"
                    disabled={isSubmitting}
                    className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg font-mono text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="location-input"
                    className="block text-xs font-semibold text-text"
                  >
                    Location <span className="text-accent">*</span>
                  </label>
                  <input
                    id="location-input"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Central Warehouse Rack A"
                    disabled={isSubmitting}
                    className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="purchase-date"
                    className="block text-xs font-semibold text-text"
                  >
                    Purchase Date
                  </label>
                  <input
                    id="purchase-date"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="value-input"
                    className="block text-xs font-semibold text-text"
                  >
                    Acquisition Value (₱)
                  </label>
                  <input
                    id="value-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0.00"
                    disabled={isSubmitting}
                    className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg font-mono text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
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
                  rows={3}
                  disabled={isSubmitting}
                  placeholder="Optional remarks..."
                  className="w-full p-2.5 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label
                  htmlFor="asset-code"
                  className="block text-xs font-semibold text-text"
                >
                  Asset Code
                </label>
                <input
                  id="asset-code"
                  type="text"
                  value={assetCode}
                  onChange={(e) => setAssetCode(e.target.value.toUpperCase())}
                  disabled={isEditing || isSubmitting}
                  className="w-full h-9 px-3 text-xs bg-bg-subtle border border-border rounded-lg font-mono text-text focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-70"
                />
                <p className="text-[10px] text-text-secondary">
                  Auto-generated from category; editable before save.
                </p>
              </div>

              {assetCode ? (
                <div className="rounded-xl border border-border bg-bg-subtle/40 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary mb-2">
                    QR preview
                  </p>
                  <QRCodeDisplay
                    assetCode={assetCode}
                    assetName={name.trim() || assetCode}
                    size={160}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
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
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-bold rounded-lg bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? "Saving…"
                : isEditing
                  ? "Save changes"
                  : "Register asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AddEditAssetDialog({
  isOpen,
  initialAsset,
  onClose,
  onSave,
}: AddEditAssetDialogProps) {
  if (!isOpen) return null;

  return (
    <AddEditAssetDialogForm
      key={initialAsset?.id ?? "new"}
      initialAsset={initialAsset}
      onClose={onClose}
      onSave={onSave}
    />
  );
}
