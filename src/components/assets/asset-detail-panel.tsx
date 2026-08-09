"use client";

import { useEffect, useRef } from "react";
import { X, Edit3, Wrench, MapPin, User, Tag, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Asset,  AssetStatus } from "@/types/assets";
import { QRCodeDisplay } from "./qr-code-display";
import { getCategoryStyle } from "@/constants/categories";

export interface AssetDetailPanelProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (asset: Asset) => void;
  onMarkMaintenance: (asset: Asset) => void;
}

const STATUS_STYLES: Record<AssetStatus, { bg: string; text: string; label: string }> = {
  active:         { bg: "bg-status-active-bg/20",     text: "text-status-active-text font-bold",      label: "Active" },
  needs_repair:   { bg: "bg-status-repair-bg/20",     text: "text-status-repair-text font-bold",      label: "Needs Repair" },
  out_of_service: { bg: "bg-status-outofservice-bg/20", text: "text-status-outofservice-text font-bold", label: "Out of Service" },
  retired:        { bg: "bg-status-retired-bg/20",    text: "text-status-retired-text font-bold",     label: "Retired" },
};

export function AssetDetailPanel({
  asset,
  isOpen,
  onClose,
  onEdit,
  onMarkMaintenance,
}: AssetDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !asset) return null;

  const categoryMeta = getCategoryStyle(asset.category);
  const statusMeta = STATUS_STYLES[asset.status];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer Container */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-detail-heading"
        className={cn(
          "relative flex flex-col w-full max-w-lg h-full bg-bg border-l border-border shadow-2xl z-10 overflow-hidden",
          "animate-in slide-in-from-right duration-250 ease-in-out"
        )}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-subtle/50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-text bg-bg px-2 py-0.5 rounded border border-border">
                {asset.assetCode}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  categoryMeta.bg,
                  categoryMeta.text
                )}
              >
                <Tag className="h-2.5 w-2.5 mr-1" />
                {categoryMeta.label}
              </span>
            </div>
            <h2 id="asset-detail-heading" className="text-base font-bold text-text mt-0.5 leading-tight">
              {asset.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close asset detail panel"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-border transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Quick Actions Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-bg-subtle">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-text-secondary block uppercase tracking-wider">
                Current Condition
              </span>
              <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-xs font-bold", statusMeta.bg, statusMeta.text)}>
                {statusMeta.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(asset)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-bg text-text hover:border-primary transition-colors cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onMarkMaintenance(asset)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-status-repair-bg/20 text-status-repair-text hover:bg-status-repair-bg/30 transition-colors cursor-pointer"
              >
                <Wrench className="h-3.5 w-3.5" />
                Flag Repair
              </button>
            </div>
          </div>

          {/* QR Code Tag Card */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Physical QR Tag
            </h3>
            <QRCodeDisplay assetCode={asset.assetCode} assetName={asset.name} />
          </div>

          {/* Asset Info Overview */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Asset Record
            </h3>
            <div className="p-4 rounded-lg border border-border bg-bg space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-text-secondary block">Serial Number:</span>
                  <span className="font-mono font-bold text-text">{asset.serialNumber || "N/A"}</span>
                </div>
                <div>
                  <span className="text-text-secondary block">Location:</span>
                  <span className="font-semibold text-text flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-text-secondary" />
                    {asset.location}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border grid grid-cols-2 gap-3">
                <div>
                  <span className="text-text-secondary block">Current Custodian:</span>
                  {asset.currentHolder ? (
                    <span className="font-semibold text-text flex items-center gap-1">
                      <User className="h-3 w-3 text-text-secondary" />
                      {asset.currentHolder} ({asset.department})
                    </span>
                  ) : (
                    <span className="font-semibold text-status-active-text">Available in Stock</span>
                  )}
                </div>
                <div>
                  <span className="text-text-secondary block">Acquisition Date:</span>
                  <span className="font-semibold text-text flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-text-secondary" />
                    {asset.purchaseDate || "Unrecorded"}
                  </span>
                </div>
              </div>

              {asset.value && (
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-text-secondary">Inventory Value:</span>
                  <span className="font-mono font-bold text-text">
                    ₱{asset.value.toLocaleString()}
                  </span>
                </div>
              )}

              {asset.notes && (
                <div className="pt-2 border-t border-border space-y-1">
                  <span className="text-text-secondary block font-semibold">Notes:</span>
                  <p className="text-text bg-bg-subtle p-2 rounded border border-border leading-relaxed">
                    {asset.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Maintenance & Condition Log Entries */}
          <div className="space-y-3">

            <div className="p-4 rounded-lg border border-border bg-bg">
              {asset.maintenanceHistory.length === 0 ? (
                <p className="text-xs text-text-secondary text-center py-3">
                  No maintenance records logged for this asset yet.
                </p>
              ) : (
                <ol className="relative border-l border-border ml-2 space-y-4">
                  {asset.maintenanceHistory.map((m) => (
                    <li key={m.id} className="ml-4">
                      <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-bg bg-accent" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-text capitalize">{m.type}</span>
                        <time className="text-[11px] text-text-secondary">{m.date}</time>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">{m.description}</p>
                      <span className="text-[10px] text-text-secondary/70 block mt-0.5">
                        Tech: {m.technician}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
