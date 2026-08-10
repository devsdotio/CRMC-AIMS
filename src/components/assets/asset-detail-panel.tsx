"use client";

import { useEffect, useRef } from "react";
import { Edit3, MapPin, User, Tag, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Asset,  AssetStatus } from "@/types/assets";
import { QRCodeDisplay } from "./qr-code-display";
import { getCategoryStyle } from "@/constants/categories";

export interface AssetDetailPanelProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (asset: Asset) => void;
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
            onClick={() => onEdit(asset)}
            aria-label="Edit asset details"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-bg text-text-secondary hover:text-text border border-border hover:border-primary transition-colors cursor-pointer shadow-xs"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 flex flex-col gap-6">


          {/* QR Code Tag Card */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Physical QR Tag
            </h3>
            <QRCodeDisplay assetCode={asset.assetCode} assetName={asset.name} />
          </div>

          {/* Asset Record Card */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Asset Record
            </h3>
            
            <div className="bg-bg rounded-xl border border-border shadow-xs overflow-hidden">
              {/* Status Header */}
              <div className="p-4 border-b border-border bg-bg-subtle flex items-center justify-between">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  Current Condition
                </span>
                <div className="flex gap-2">
                  {asset.currentHolder ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-accent/20 text-accent uppercase tracking-wider">
                      Borrowed
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-status-active-bg/20 text-status-active-text uppercase tracking-wider">
                      Available
                    </span>
                  )}
                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", statusMeta.bg, statusMeta.text)}>
                    {statusMeta.label}
                  </span>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    asset.assignmentType === "assignable" 
                      ? "border-status-repair-text text-status-repair-text bg-status-repair-bg/10" 
                      : "border-accent text-accent bg-accent/10"
                  )}>
                    {asset.assignmentType === "assignable" ? "Assignable" : "Borrowable"}
                  </span>
                </div>
              </div>

              {/* Grid Properties */}
              <div className="p-5 grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                    Serial Number
                  </p>
                  <p className="text-sm font-mono font-medium text-text">
                    {asset.serialNumber || "N/A"}
                  </p>
                </div>
                
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> Location
                  </p>
                  <p className="text-sm font-medium text-text truncate" title={asset.location}>
                    {asset.location}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <User className="h-3 w-3" /> Custody
                  </p>
                  <p className="text-sm font-medium text-text truncate">
                    {asset.currentHolder ? (
                      <span title={`${asset.currentHolder} ${asset.department ? `(${asset.department})` : ""}`}>
                        {asset.currentHolder}
                      </span>
                    ) : (
                      <span className="text-status-active-text">Available In Stock</span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Acquisition
                  </p>
                  <p className="text-sm font-medium text-text">
                    {asset.purchaseDate || "Unrecorded"}
                  </p>
                </div>

                {asset.value && (
                  <div>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                      Inventory Value (₱)
                    </p>
                    <p className="text-sm font-mono font-medium text-text">
                      ₱{asset.value.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Notes Full Width */}
              {asset.notes && (
                <div className="p-5 border-t border-border bg-bg-subtle/30">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Custody Notes / Details
                  </p>
                  <p className="text-xs text-text leading-relaxed whitespace-pre-wrap">
                    {asset.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
