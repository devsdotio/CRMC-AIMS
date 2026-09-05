"use client";

import React, { useState } from "react";
import {
  Boxes,
  Copy,
  Check,
  FileText,
  Clock,
  ShieldCheck,
  Truck,
  PackageCheck,
  Ban,
  Building2,
  Trash2,
} from "lucide-react";
import type { PurchaseLot, PurchaseOrderStatus } from "@/types/purchase-lots";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/components/audit-logs/audit-log-utils";

interface PurchaseOrdersGridProps {
  lots: PurchaseLot[];
  loading?: boolean;
  onSelectLot: (lot: PurchaseLot) => void;
  onPrintSlip: (lot: PurchaseLot) => void;
  onDelete?: (lot: PurchaseLot) => void;
}

function getStatusCardClasses(status: PurchaseOrderStatus): {
  cardBorder: string;
  glow: string;
} {
  switch (status) {
    case "delivered":
      return {
        cardBorder:
          "border-t-4 border-t-emerald-500 hover:border-emerald-500/70 hover:shadow-emerald-500/5",
        glow: "from-emerald-500/8 via-emerald-500/2 to-transparent",
      };
    case "ordered":
      return {
        cardBorder:
          "border-t-4 border-t-blue-500 hover:border-blue-500/70 hover:shadow-blue-500/5",
        glow: "from-blue-500/8 via-blue-500/2 to-transparent",
      };
    case "approved":
      return {
        cardBorder:
          "border-t-4 border-t-amber-500 hover:border-amber-500/70 hover:shadow-amber-500/5",
        glow: "from-amber-500/8 via-amber-500/2 to-transparent",
      };
    case "cancelled":
      return {
        cardBorder:
          "border-t-4 border-t-rose-500 hover:border-rose-500/70 opacity-85",
        glow: "from-rose-500/8 via-rose-500/2 to-transparent",
      };
    case "pending_approval":
    default:
      return {
        cardBorder:
          "border-t-4 border-t-purple-500 hover:border-purple-500/70 hover:shadow-purple-500/5",
        glow: "from-purple-500/8 via-purple-500/2 to-transparent",
      };
  }
}

function ItemTypeBadge({ itemType }: { itemType: "asset" | "consumable" }) {
  if (itemType === "asset") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/25 shadow-2xs">
        Asset
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/25 shadow-2xs">
      Consumable
    </span>
  );
}

function StatusBadge({ status }: { status: PurchaseOrderStatus }) {
  if (status === "delivered") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs">
        <PackageCheck className="h-3 w-3" />
        Delivered
      </span>
    );
  }
  if (status === "ordered") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 shadow-2xs">
        <Truck className="h-3 w-3" />
        Ordered
      </span>
    );
  }
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-2xs">
        <ShieldCheck className="h-3 w-3" />
        Approved
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 shadow-2xs">
        <Ban className="h-3 w-3" />
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 shadow-2xs">
      <Clock className="h-3 w-3" />
      Pending Approval
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs flex flex-col justify-between animate-pulse space-y-3">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 bg-border rounded" />
          <div className="h-4 w-20 bg-border/60 rounded-full" />
        </div>
        <div className="h-4.5 w-3/4 bg-border rounded" />
        <div className="p-2.5 rounded-lg bg-bg-subtle/70 border border-border/70 space-y-2">
          <div className="h-3 w-full bg-border/60 rounded" />
          <div className="h-3 w-full bg-border/60 rounded" />
        </div>
      </div>
      <div className="h-7 w-full bg-border rounded-lg" />
    </div>
  );
}

export function PurchaseOrdersGrid({
  lots,
  loading = false,
  onSelectLot,
  onPrintSlip,
  onDelete,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (lots.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-card rounded-xl border border-border min-h-96">
        <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 text-accent mb-3">
          <Boxes className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-text">No Purchase Orders Found</h3>
        <p className="text-xs text-text-secondary max-w-sm mt-1 leading-relaxed">
          No purchase orders match your active search and filter criteria. File a new PO or reset your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {lots.map((lot) => {
        const displayPO = lot.poNumber || lot.lotCode;
        const poDate = lot.purchasedOn || lot.createdAt.split("T")[0];
        const unitCostNum = parseFloat(lot.unitCost) || 0;
        const totalCostNum = parseFloat(lot.totalCost) || 0;
        const statusMeta = getStatusCardClasses(lot.status);
        const remainingRatio =
          lot.quantity > 0 ? lot.quantityRemaining / lot.quantity : 0;
        const isDepleted =
          lot.status === "delivered" && lot.quantityRemaining === 0;
        const isLowStock =
          lot.status === "delivered" && !isDepleted && remainingRatio <= 0.2;

        return (
          <div
            key={lot.id}
            onClick={() => onSelectLot(lot)}
            className={cn(
              "rounded-xl border border-border bg-card p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden",
              statusMeta.cardBorder
            )}
          >
            {/* Subtle Top Gradient Glow */}
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-16 bg-gradient-to-b pointer-events-none",
                statusMeta.glow
              )}
            />

            <div className="space-y-3.5 relative z-1">
              {/* Top Row: PO Number, Item Type & Status Badge */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-xs font-bold text-text bg-bg-subtle/80 px-2 py-0.5 rounded-md border border-border group-hover:border-accent/40 group-hover:text-accent transition-colors truncate shadow-2xs">
                    {displayPO}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleCopyCode(e, displayPO)}
                    title="Copy PO Number"
                    className="p-1 rounded text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer shrink-0"
                  >
                    {copiedCode === displayPO ? (
                      <Check className="h-3 w-3 text-status-active-text" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                  <ItemTypeBadge itemType={lot.itemType} />
                </div>

                <StatusBadge status={lot.status} />
              </div>

              {/* Item Info */}
              <div>
                <h3 className="text-sm font-bold text-text group-hover:text-accent transition-colors line-clamp-1 leading-snug">
                  {lot.itemName}
                </h3>
                <div className="flex items-center justify-between text-[11px] text-text-secondary mt-1">
                  <span className="font-mono bg-bg-subtle/60 px-1.5 py-0.2 rounded border border-border/60 text-[10px]">
                    {lot.itemCode}
                  </span>
                  <span className="text-[10px] text-text-secondary font-medium">
                    {poDate}
                  </span>
                </div>
              </div>

              {/* Order Specs Box */}
              <div className="p-3 rounded-lg bg-bg-subtle/80 border border-border/80 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary font-medium">Quantity:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-text">
                      {lot.quantity} {lot.itemType === "asset" ? (lot.quantity === 1 ? "unit" : "units") : "pcs"}
                    </span>
                    {lot.status === "delivered" && lot.itemType === "consumable" && (
                      <>
                        {isDepleted ? (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Depleted
                          </span>
                        ) : lot.quantityRemaining < lot.quantity ? (
                          <span
                            className={cn(
                              "inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold border",
                              isLowStock
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                            )}
                          >
                            {lot.quantityRemaining} left
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                            In Stock
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-text-secondary font-medium">Unit Cost:</span>
                  <span className="font-mono font-semibold text-text">
                    ₱{unitCostNum.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1.5 border-t border-border/60">
                  <span className="text-text-secondary font-medium text-[11px] uppercase tracking-wider">
                    Total Value:
                  </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ₱{totalCostNum.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Supplier & Requester Info */}
              <div className="space-y-1 text-[11px] text-text-secondary pt-0.5">
                <div className="flex items-center justify-between truncate">
                  <span className="flex items-center gap-1.5 text-text font-medium truncate">
                    <Building2 className="h-3 w-3 text-text-secondary shrink-0" />
                    <span className="truncate">{lot.supplierName || "Internal / Direct"}</span>
                  </span>
                </div>
                <div className="truncate text-[10px] text-text-secondary">
                  <span>Req by: <strong className="text-text font-medium">{lot.recordedByName}</strong></span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3.5 mt-3 border-t border-border/80 relative z-1">
              <span className="text-[10px] text-text-secondary font-medium">
                {formatRelativeTime(lot.createdAt)}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrintSlip(lot);
                  }}
                  title="Print Official Form Slip"
                  className="p-1.5 rounded-lg border border-border bg-bg hover:bg-bg-subtle text-text-secondary hover:text-text hover:border-accent/40 transition-colors cursor-pointer shadow-2xs"
                >
                  <FileText className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelectLot(lot)}
                  className="px-3 py-1 text-[11px] font-semibold rounded-lg border border-border bg-bg hover:bg-bg-subtle text-text hover:border-primary/40 transition-colors cursor-pointer shadow-2xs"
                >
                  View Details
                </button>
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(lot);
                    }}
                    title="Delete Purchase Order"
                    aria-label="Delete Purchase Order"
                    className="p-1.5 rounded-lg border border-destructive/25 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white transition-colors cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
