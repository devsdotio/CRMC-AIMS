"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  FileText,
  ShieldCheck,
  Printer,
  Copy,
  Check,
  Layers,
  Send,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PurchaseLot } from "@/types/purchase-lots";
import { formatPhp } from "@/components/projects/format-money";

interface PurchaseOrderDetailSheetProps {
  lot: PurchaseLot | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintSlip: (lot: PurchaseLot) => void;
  onPrintTag?: (lot: PurchaseLot) => void;
  onReleaseStock?: (lot: PurchaseLot) => void;
  canOperate?: boolean;
}

export function PurchaseOrderDetailSheet({
  lot,
  isOpen,
  onClose,
  onPrintSlip,
  onPrintTag,
  onReleaseStock,
  canOperate = false,
}: PurchaseOrderDetailSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !lot) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(lot.lotCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  const payload = lot.qrPayload?.trim() || `CRMC-AIMS-LOT:${lot.lotCode.trim()}`;
  const totalCostNum = parseFloat(lot.totalCost) || 0;
  const unitCostNum = parseFloat(lot.unitCost) || 0;
  const consumedUnits = Math.max(0, lot.quantity - lot.quantityRemaining);
  const remainingValue = lot.quantityRemaining * unitCostNum;
  const remainingRatio = lot.quantity > 0 ? (lot.quantityRemaining / lot.quantity) * 100 : 0;
  const isDepleted = lot.quantityRemaining === 0;
  const isLowStock = !isDepleted && remainingRatio <= 20;
  const poDate = lot.purchasedOn || lot.createdAt.split("T")[0];
  const canRelease =
    canOperate &&
    lot.itemType === "consumable" &&
    lot.quantityRemaining > 0 &&
    Boolean(onReleaseStock);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="po-detail-heading"
        className={cn(
          "relative flex flex-col w-full max-w-lg h-full bg-bg border-l border-border shadow-2xl z-10 overflow-hidden",
          "animate-in slide-in-from-right duration-250 ease-in-out"
        )}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-subtle/50 shrink-0">
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id="po-detail-heading" className="font-mono text-lg font-bold tracking-tight text-text">
                {lot.poNumber || lot.lotCode}
              </h2>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy P.O Number"
                className="p-1 rounded text-text-secondary hover:text-text hover:bg-border/60 transition-colors cursor-pointer"
              >
                {copiedCode ? (
                  <Check className="h-3.5 w-3.5 text-status-active-text" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>

              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize",
                  lot.itemType === "asset"
                    ? "bg-category-computing-bg/10 text-category-computing-bg border-category-computing-bg/30"
                    : "bg-category-av-bg/10 text-category-av-bg border-category-av-bg/30"
                )}
              >
                {lot.itemType}
              </span>

              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                  isDepleted
                    ? "bg-status-retired-bg/15 text-status-retired-text border-status-retired-bg/30"
                    : isLowStock
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "bg-status-active-bg/15 text-status-active-text border-status-active-bg/30"
                )}
              >
                {isDepleted ? "Depleted" : isLowStock ? "Low Stock" : "In Stock"}
              </span>
            </div>
            <p className="text-xs text-text-secondary font-medium mt-0.5 space-x-1.5 truncate">
              <span>CRMC Purchase Order</span>
              <span>•</span>
              <span className="font-mono">Lot: <strong className="text-text font-medium">{lot.lotCode}</strong></span>
              <span>•</span>
              <span>Date: <strong className="text-text font-semibold">{poDate}</strong></span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail panel"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-border transition-colors cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* CRMC PO Specifications Card */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-accent" />
                Purchase Order Details
              </span>
              <button
                type="button"
                onClick={() => onPrintSlip(lot)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline cursor-pointer"
              >
                <Printer className="h-3 w-3" />
                <span>Print Official PO Slip</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[11px] text-text-secondary font-medium block">Description / Item</span>
                <span className="font-bold text-text text-sm block">{lot.itemName}</span>
                <span className="font-mono text-[11px] text-text-secondary">Code: {lot.itemCode}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/60">
                <div>
                  <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider block">Quantity</span>
                  <span className="font-bold text-text text-sm">{lot.quantity} units</span>
                </div>
                <div>
                  <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider block">Estimated Cost</span>
                  <span className="font-mono font-bold text-status-active-text text-sm">
                    ₱{totalCostNum.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pt-1 border-t border-border/60">
                <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider block">Suggested Dealer</span>
                <span className="font-semibold text-text">{lot.supplierName || "Direct / Internal Procurement"}</span>
                {lot.reference && (
                  <span className="font-mono text-[11px] text-text-secondary block">Ref / Invoice: {lot.reference}</span>
                )}
              </div>

              <div className="pt-1 border-t border-border/60">
                <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider block">Purpose</span>
                <p className="text-text font-medium mt-0.5 leading-relaxed bg-bg-subtle/70 p-2 rounded-md border border-border/60">
                  {lot.notes || "Institutional Inventory & Operations"}
                </p>
              </div>
            </div>
          </div>

          {/* Stock Utilization & Holding Gauge */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                Inventory Stock Balance
              </span>
              <span className="text-xs font-bold text-text">
                {Math.round(remainingRatio)}% Available
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 w-full rounded-full bg-bg-subtle overflow-hidden border border-border">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isDepleted
                    ? "bg-status-retired-bg"
                    : isLowStock
                    ? "bg-amber-500"
                    : "bg-status-active-bg"
                )}
                style={{ width: `${Math.min(100, Math.max(0, remainingRatio))}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-lg bg-bg-subtle/80 border border-border/80">
                <span className="text-[10px] text-text-secondary block font-medium">Order Quantity</span>
                <span className="text-sm font-bold text-text block">{lot.quantity}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-bg-subtle/80 border border-border/80">
                <span className="text-[10px] text-text-secondary block font-medium">Available</span>
                <span className="text-sm font-bold text-status-active-text block">{lot.quantityRemaining}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-bg-subtle/80 border border-border/80">
                <span className="text-[10px] text-text-secondary block font-medium">Dispatched</span>
                <span className="text-sm font-bold text-text-secondary block">{consumedUnits}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/60">
              <span className="text-text-secondary">Remaining value</span>
              <span className="font-mono font-bold text-text">
                {formatPhp(remainingValue)}
              </span>
            </div>
            <p className="text-[10px] text-text-secondary font-mono truncate" title={payload}>
              QR: {payload}
            </p>
          </div>

          {/* Official Sign-Off Block */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Signatures & Authorizations
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-border bg-card space-y-1 text-center">
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">
                  Requested By
                </span>
                <div className="pt-2 border-b border-border font-bold text-text text-sm">
                  {lot.recordedByName}
                </div>
                <span className="text-[10px] text-text-secondary block pt-0.5">Staff / Requester</span>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card space-y-1 text-center">
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">
                  Approved By
                </span>
                <div className="pt-2 border-b border-border font-bold text-text text-xs">
                  JACINTO ANTONIO R. LEPITEN JR.
                </div>
                <span className="text-[10px] text-text-secondary block pt-0.5">Head Property Custodian</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-border bg-bg-subtle flex items-center justify-between shrink-0 gap-2 flex-wrap">
          <span className="text-xs text-text-secondary font-medium">
            Lot actions
          </span>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {onPrintTag && (
              <button
                type="button"
                onClick={() => onPrintTag(lot)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-border bg-bg text-text hover:bg-bg-subtle transition-colors cursor-pointer"
              >
                <Tag className="h-3.5 w-3.5" />
                <span>Print tag</span>
              </button>
            )}

            {canRelease && (
              <button
                type="button"
                onClick={() => onReleaseStock?.(lot)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-category-transport-bg/10 text-category-transport-bg border border-category-transport-bg/30 hover:bg-category-transport-bg/20 transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Release stock</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onPrintSlip(lot)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-accent transition-colors cursor-pointer shadow-2xs"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Print PO slip</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-border bg-bg text-text hover:bg-bg-subtle transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
