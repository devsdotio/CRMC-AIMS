"use client";

import React, { useState } from "react";
import {
  ShoppingCart,
  Copy,
  Check,
  FileText,
  ShieldCheck,
} from "lucide-react";
import type { PurchaseLot } from "@/types/purchase-lots";
import { cn } from "@/lib/utils";
import { formatDateTime, formatRelativeTime } from "@/components/audit-logs/audit-log-utils";

interface PurchaseOrdersGridProps {
  lots: PurchaseLot[];
  loading?: boolean;
  onSelectLot: (lot: PurchaseLot) => void;
  onPrintSlip: (lot: PurchaseLot) => void;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs flex flex-col justify-between animate-pulse space-y-3">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 bg-border rounded" />
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-16 bg-border/60 rounded-full" />
            <div className="h-4 w-16 bg-border/60 rounded-full" />
          </div>
        </div>

        <div>
          <div className="h-4.5 w-3/4 bg-border rounded mb-1.5" />
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 bg-border/60 rounded" />
            <div className="h-3 w-16 bg-border/60 rounded" />
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between">
            <div className="h-3 w-24 bg-border/60 rounded" />
            <div className="h-3 w-16 bg-border/60 rounded" />
          </div>
          <div className="h-1.5 w-full bg-border/60 rounded-full" />
        </div>

        <div className="p-2.5 rounded-lg bg-bg-subtle/70 border border-border/70 space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-20 bg-border/60 rounded" />
            <div className="h-3 w-24 bg-border rounded" />
          </div>
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-border/60 rounded" />
            <div className="h-3 w-28 bg-border rounded" />
          </div>
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-border/60 rounded" />
            <div className="h-3.5 w-20 bg-border rounded" />
          </div>
        </div>

        <div className="flex justify-between pt-1">
          <div className="h-3 w-24 bg-border/60 rounded" />
          <div className="h-3 w-28 bg-border/60 rounded" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="h-7 w-24 bg-border rounded-lg" />
        <div className="h-3 w-20 bg-border/60 rounded" />
      </div>
    </div>
  );
}

export function PurchaseOrdersGrid({
  lots,
  loading = false,
  onSelectLot,
  onPrintSlip,
}: PurchaseOrdersGridProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Loading purchase orders cards">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (lots.length === 0) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 shadow-xs mb-3">
          <ShoppingCart className="h-7 w-7" strokeWidth={1.8} />
        </span>
        <h3 className="text-base font-bold text-text">No Purchase Orders Found</h3>
        <p className="text-xs text-text-secondary max-w-sm mt-1 leading-relaxed">
          No purchase orders match your filter criteria. Try adjusting your filters or search query.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {lots.map((lot) => {
        const remainingRatio =
          lot.quantity > 0 ? (lot.quantityRemaining / lot.quantity) * 100 : 0;
        const isDepleted = lot.quantityRemaining === 0;
        const isLowStock = !isDepleted && remainingRatio <= 20;
        const poDate = lot.purchasedOn || lot.createdAt.split("T")[0];

        return (
          <div
            key={lot.id}
            onClick={() => onSelectLot(lot)}
            className="rounded-xl border border-border bg-card p-4 shadow-xs hover:border-border hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group relative"
          >
            {/* Header: P.O Number & Badges */}
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-text bg-bg-subtle px-2 py-0.5 rounded border border-border">
                      {lot.poNumber || lot.lotCode}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopyCode(e, lot.poNumber || lot.lotCode)}
                      title="Copy P.O Number"
                      className="p-1 rounded text-text-secondary hover:text-text hover:bg-border/60 transition-colors cursor-pointer"
                    >
                      {copiedCode === (lot.poNumber || lot.lotCode) ? (
                        <Check className="h-3 w-3 text-status-active-text" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                  <div className="text-[10px] text-text-secondary mt-0.5 font-mono">
                    Lot: <strong className="text-text font-medium">{lot.lotCode}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
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
              </div>

              {/* Description & Quantity */}
              <div>
                <h3 className="text-sm font-bold text-text truncate" title={lot.itemName}>
                  {lot.itemName}
                </h3>
                <div className="flex items-center justify-between text-xs text-text-secondary mt-0.5">
                  <span className="font-mono text-[11px]">Code: {lot.itemCode}</span>
                  <span className="font-bold text-text">Qty: {lot.quantity} units</span>
                </div>
              </div>

              {/* Stock Progress Meter */}
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-text-secondary">Available Balance:</span>
                  <span className="font-bold text-text">{lot.quantityRemaining} / {lot.quantity} units</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-bg-subtle overflow-hidden border border-border/50">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      isDepleted
                        ? "bg-status-retired-bg"
                        : isLowStock
                        ? "bg-amber-500"
                        : "bg-status-active-bg"
                    )}
                    style={{ width: `${Math.min(100, Math.max(0, remainingRatio))}%` }}
                  />
                </div>
              </div>

              {/* Suggested Dealer & Purpose Card */}
              <div className="p-2.5 rounded-lg bg-bg-subtle/70 border border-border/70 text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">Suggested Dealer</span>
                  <span className="font-semibold text-text truncate max-w-[150px] text-right">
                    {lot.supplierName || "Direct / Internal"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-1 pt-1 border-t border-border/50">
                  <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">Purpose</span>
                  <span className="text-text-secondary truncate max-w-[160px] text-right text-[11px]">
                    {lot.notes || "Operations & Inventory"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/50">
                  <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">Estimated</span>
                  <span className="font-mono font-bold text-status-active-text">
                    ₱{Number(lot.totalCost).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Signatures / Custodian */}
              <div className="flex items-center justify-between text-[11px] text-text-secondary pt-0.5">
                <span className="truncate">Req: <strong className="text-text">{lot.recordedByName}</strong></span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                  <ShieldCheck className="h-3 w-3" />
                  Custodian Approved
                </span>
              </div>
            </div>

            {/* Footer Action Strip */}
            <div
              className="flex items-center justify-between pt-3 mt-3 border-t border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onPrintSlip(lot)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-bg hover:bg-bg-subtle text-text transition-colors cursor-pointer"
                title="Print Official PO Slip"
              >
                <FileText className="h-3.5 w-3.5 text-accent" />
                <span>Print PO Slip</span>
              </button>

              <span className="text-[11px] text-text-secondary font-medium group-hover:text-accent transition-colors">
                View Details →
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
