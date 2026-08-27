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
} from "lucide-react";
import type { PurchaseLot, PurchaseOrderStatus } from "@/types/purchase-lots";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/components/audit-logs/audit-log-utils";

interface PurchaseOrdersGridProps {
  lots: PurchaseLot[];
  loading?: boolean;
  onSelectLot: (lot: PurchaseLot) => void;
  onPrintSlip: (lot: PurchaseLot) => void;
}

function StatusBadge({ status }: { status: PurchaseOrderStatus }) {
  if (status === "delivered") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
        <PackageCheck className="h-3 w-3" />
        Delivered
      </span>
    );
  }
  if (status === "ordered") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
        <Truck className="h-3 w-3" />
        Ordered
      </span>
    );
  }
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
        <ShieldCheck className="h-3 w-3" />
        Approved
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
        <Ban className="h-3 w-3" />
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-bg-subtle text-text-secondary border border-border">
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

        return (
          <div
            key={lot.id}
            onClick={() => onSelectLot(lot)}
            className="rounded-xl border border-border bg-card p-4.5 shadow-2xs hover:shadow-md hover:border-accent/40 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              {/* Top Row: PO Number & Status Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-xs font-bold text-text group-hover:text-accent transition-colors truncate">
                    {displayPO}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleCopyCode(e, displayPO)}
                    title="Copy PO Number"
                    className="p-1 rounded text-text-secondary hover:text-text hover:bg-border/60 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedCode === displayPO ? (
                      <Check className="h-3 w-3 text-status-active-text" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>

                <StatusBadge status={lot.status} />
              </div>

              {/* Item Info */}
              <div>
                <h3 className="text-sm font-bold text-text group-hover:text-accent transition-colors line-clamp-1">
                  {lot.itemName}
                </h3>
                <div className="flex items-center justify-between text-[11px] text-text-secondary mt-0.5">
                  <span className="font-mono">{lot.itemCode}</span>
                  <span className="capitalize">{lot.itemType}</span>
                </div>
              </div>

              {/* Order Specs Box */}
              <div className="p-3 rounded-lg bg-bg-subtle/70 border border-border/70 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary font-medium">Quantity:</span>
                  <span className="font-mono font-bold text-text">
                    {lot.quantity} {lot.itemType === "asset" ? "unit" : "units"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-text-secondary font-medium">Unit Cost:</span>
                  <span className="font-mono font-semibold text-text">₱{unitCostNum.toFixed(2)}</span>
                </div>

                <div className="flex justify-between pt-1 border-t border-border/50">
                  <span className="text-text-secondary font-medium">Total PO Value:</span>
                  <span className="font-mono font-bold text-status-active-text">
                    ₱{totalCostNum.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Supplier & Requester Info */}
              <div className="space-y-1 text-[11px] text-text-secondary pt-0.5">
                <div className="flex items-center justify-between truncate">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    <span>{lot.supplierName || "Internal / Direct"}</span>
                  </span>
                  <span>{poDate}</span>
                </div>
                <div className="truncate">
                  <span>Req by: <strong className="text-text font-medium">{lot.recordedByName}</strong></span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3.5 mt-3 border-t border-border/80">
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
                  className="p-1.5 rounded-lg border border-border bg-bg hover:bg-bg-subtle text-text-secondary hover:text-text transition-colors cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onSelectLot(lot)}
                  className="px-3 py-1 text-[11px] font-bold rounded-lg border border-border bg-bg hover:bg-bg-subtle text-text transition-colors cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
