"use client";

import { useState, useEffect } from "react";
import { X, PackagePlus, Edit } from "lucide-react";

import type { Asset, AssetCategory, AssetStatus } from "@/types/assets";
import { QRCodeDisplay } from "./qr-code-display";

export interface AddEditAssetDialogProps {
  isOpen: boolean;
  initialAsset?: Asset | null;
  onClose: () => void;
  onSave: (assetData: Partial<Asset>) => void;
}

const CATEGORY_PREFIXES: Record<AssetCategory, string> = {
  computing: "CP",
  av: "AV",
  transport: "TR",
  furniture: "FN",
};

function generateAssetCode(category: AssetCategory = "computing"): string {
  const prefix = CATEGORY_PREFIXES[category];
  const randomNum = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${randomNum}`;
}

interface AddEditAssetDialogFormProps {
  initialAsset?: Asset | null;
  onClose: () => void;
  onSave: (assetData: Partial<Asset>) => void;
}

function AddEditAssetDialogForm({
  initialAsset,
  onClose,
  onSave,
}: AddEditAssetDialogFormProps) {
  const isEditing = Boolean(initialAsset);

  const [name, setName] = useState(() => initialAsset?.name ?? "");
  const [category, setCategory] = useState<AssetCategory>(
    () => initialAsset?.category ?? "computing"
  );
  const [status, setStatus] = useState<AssetStatus>(
    () => initialAsset?.status ?? "active"
  );
  const [assetCode, setAssetCode] = useState(
    () => initialAsset?.assetCode ?? generateAssetCode("computing")
  );
  const [serialNumber, setSerialNumber] = useState(
    () => initialAsset?.serialNumber ?? ""
  );
  const [location, setLocation] = useState(
    () => initialAsset?.location ?? "IT Office — Rm 302"
  );
  const [department] = useState(
    () => initialAsset?.department ?? "IT"
  );
  const [notes, setNotes] = useState(() => initialAsset?.notes ?? "");
  const [value, setValue] = useState(() =>
    initialAsset?.value ? String(initialAsset.value) : ""
  );
  const [purchaseDate, setPurchaseDate] = useState(
    () =>
      initialAsset?.purchaseDate ?? new Date().toISOString().split("T")[0]
  );
  const [error, setError] = useState("");

  const handleCategoryChange = (newCat: AssetCategory) => {
    setCategory(newCat);
    if (!isEditing) {
      setAssetCode(generateAssetCode(newCat));
    }
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter the asset name.");
      return;
    }
    if (!location.trim()) {
      setError("Please enter the asset location.");
      return;
    }

    onSave({
      id: initialAsset ? initialAsset.id : `ast-${Date.now()}`,
      assetCode,
      name: name.trim(),
      category,
      status,
      serialNumber: serialNumber.trim() || undefined,
      location: location.trim(),
      department: department.trim() || undefined,
      notes: notes.trim() || undefined,
      value: value ? Number(value) : undefined,
      purchaseDate: purchaseDate || undefined,
      lastUpdated: new Date().toISOString().split("T")[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="relative w-full max-w-xl rounded-2xl border border-border bg-bg p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150 my-8"
      >
        <div className="flex items-center justify-between gap-3 mb-5 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent shrink-0">
              {isEditing ? <Edit className="h-5 w-5" /> : <PackagePlus className="h-5 w-5" />}
            </div>
            <div>
              <h3 id="dialog-title" className="text-base font-bold text-text leading-tight">
                {isEditing ? "Edit Institutional Asset" : "Register New Institutional Asset"}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                {isEditing ? `Updating asset tag ${assetCode}` : "Auto-generates QR tag code & registry record"}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_160px] gap-4 items-start p-3.5 rounded-xl border border-border bg-bg-subtle">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary block">
                Generated Asset Tag Code
              </span>
              <span className="font-mono text-base font-bold text-text bg-bg px-3 py-1.5 rounded border border-border inline-block">
                {assetCode}
              </span>
              <p className="text-[11px] text-text-secondary">
                Prefix matches selected category ({CATEGORY_PREFIXES[category]}).
              </p>
            </div>

            <div className="flex justify-center md:justify-end">
              <QRCodeDisplay assetCode={assetCode} assetName={name || "New Asset"} size={90} className="p-2 space-y-1 scale-90 origin-top" />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="asset-name-input" className="block text-xs font-semibold text-text">
              Asset Name <span className="text-accent">*</span>
            </label>
            <input
              id="asset-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. MacBook Pro 16-inch, Canon DSLR Camera"
              className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="category-select" className="block text-xs font-semibold text-text">
                Asset Category <span className="text-accent">*</span>
              </label>
              <select
                id="category-select"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as AssetCategory)}
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text font-medium focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="computing">Computing</option>
                <option value="av">AV Equipment</option>
                <option value="transport">Transport</option>
                <option value="furniture">Furniture</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="status-select" className="block text-xs font-semibold text-text">
                Initial Condition Status <span className="text-accent">*</span>
              </label>
              <select
                id="status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as AssetStatus)}
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text font-medium focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="active">Active (Serviceable)</option>
                <option value="needs_repair">Needs Repair</option>
                <option value="out_of_service">Out of Service</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="serial-input" className="block text-xs font-semibold text-text">
                Serial Number (Optional)
              </label>
              <input
                id="serial-input"
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SN-DL-98214-X"
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg font-mono text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="location-input" className="block text-xs font-semibold text-text">
                Primary Location <span className="text-accent">*</span>
              </label>
              <input
                id="location-input"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. IT Office — Rm 302"
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="value-input" className="block text-xs font-semibold text-text">
                Inventory Value (₱)
              </label>
              <input
                id="value-input"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. 58000"
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="date-input" className="block text-xs font-semibold text-text">
                Acquisition Date
              </label>
              <input
                id="date-input"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-bg border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="notes-input" className="block text-xs font-semibold text-text">
              Description / Custody Notes
            </label>
            <textarea
              id="notes-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add specific configuration details, included accessories, or warranty notes…"
              className="w-full p-2.5 text-xs bg-bg border border-border rounded-lg text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {error && <p className="text-xs font-bold text-status-outofservice-text">{error}</p>}

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
              {isEditing ? "Save Changes" : "Create Asset Tag Record"}
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
