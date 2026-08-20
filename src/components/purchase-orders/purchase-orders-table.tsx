"use client";

import React, { useState, useMemo } from "react";
import {
  ShoppingCart,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  FileText,
} from "lucide-react";
import type { PurchaseLot } from "@/types/purchase-lots";
import { cn } from "@/lib/utils";
import { formatDateTime, formatRelativeTime } from "@/components/audit-logs/audit-log-utils";

type SortField = "createdAt" | "lotCode" | "itemName" | "quantity" | "totalCost";
type SortOrder = "asc" | "desc";

interface PurchaseOrdersTableProps {
  lots: PurchaseLot[];
  loading?: boolean;
  onSelectLot: (lot: PurchaseLot) => void;
  onPrintSlip: (lot: PurchaseLot) => void;
}

function SkeletonTableRow() {
  return (
    <tr className="border-b border-border bg-bg animate-pulse">
      {/* 1. P.O Number & Date */}
      <td className="px-4 py-3">
        <div className="h-4 w-28 bg-border rounded mb-1.5" />
        <div className="h-3 w-20 bg-border/60 rounded" />
      </td>

      {/* 2. Quantity */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="h-4 w-12 bg-border rounded" />
          <div className="h-3.5 w-14 bg-border/60 rounded-full" />
        </div>
        <div className="h-1.5 w-full bg-border/60 rounded-full" />
      </td>

      {/* 3. Description */}
      <td className="px-4 py-3">
        <div className="h-4 w-40 bg-border rounded mb-1.5" />
        <div className="flex items-center gap-2">
          <div className="h-3 w-16 bg-border/60 rounded" />
          <div className="h-3.5 w-16 bg-border/60 rounded-full" />
        </div>
      </td>

      {/* 4. Suggested Dealer */}
      <td className="px-4 py-3">
        <div className="h-4 w-28 bg-border rounded mb-1" />
        <div className="h-3 w-16 bg-border/60 rounded" />
      </td>

      {/* 5. Purpose */}
      <td className="px-4 py-3">
        <div className="h-4 w-32 bg-border rounded" />
      </td>

      {/* 6. Estimated Cost */}
      <td className="px-4 py-3">
        <div className="h-4 w-20 bg-border rounded mb-1" />
        <div className="h-3 w-14 bg-border/60 rounded" />
      </td>

      {/* 7. Actions */}
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end">
          <div className="h-7 w-24 bg-border rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

export function PurchaseOrdersTable({
  lots,
  loading = false,
  onSelectLot,
  onPrintSlip,
}: PurchaseOrdersTableProps) {
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedLots = useMemo(() => {
    return [...lots].sort((a, b) => {
      let comparison = 0;
      if (sortField === "createdAt") {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === "lotCode") {
        comparison = a.lotCode.localeCompare(b.lotCode);
      } else if (sortField === "itemName") {
        comparison = a.itemName.localeCompare(b.itemName);
      } else if (sortField === "quantity") {
        comparison = a.quantity - b.quantity;
      } else if (sortField === "totalCost") {
        comparison = parseFloat(a.totalCost) - parseFloat(b.totalCost);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [lots, sortField, sortOrder]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3 text-accent" />
    ) : (
      <ArrowDown className="h-3 w-3 text-accent" />
    );
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse" aria-label="Loading purchase orders table">
            <thead className="bg-bg-subtle text-text-secondary border-b border-border font-semibold uppercase tracking-wider text-[11px] select-none">
              <tr>
                <th className="px-4 py-3.5 whitespace-nowrap">P.O Number & Date</th>
                <th className="px-4 py-3.5 whitespace-nowrap min-w-[130px]">Quantity</th>
                <th className="px-4 py-3.5 min-w-[200px]">Description</th>
                <th className="px-4 py-3.5 whitespace-nowrap min-w-[150px]">Suggested Dealer</th>
                <th className="px-4 py-3.5 whitespace-nowrap min-w-[140px]">Purpose</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Estimated Cost</th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonTableRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
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
          No purchase orders match your filter criteria. Try adjusting your search query or reset filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          {/* Columns aligned with CRMC Official Purchase Order Form */}
          <thead className="bg-bg-subtle text-text-secondary border-b border-border font-semibold uppercase tracking-wider text-[11px] select-none">
            <tr>
              <th
                onClick={() => handleSort("lotCode")}
                className="px-4 py-3.5 cursor-pointer group hover:text-text transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>P.O Number & Date</span>
                  {renderSortIcon("lotCode")}
                </div>
              </th>
              <th
                onClick={() => handleSort("quantity")}
                className="px-4 py-3.5 cursor-pointer group hover:text-text transition-colors whitespace-nowrap min-w-[130px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Quantity</span>
                  {renderSortIcon("quantity")}
                </div>
              </th>
              <th
                onClick={() => handleSort("itemName")}
                className="px-4 py-3.5 cursor-pointer group hover:text-text transition-colors min-w-[200px]"
              >
                <div className="flex items-center gap-1.5">
                  <span>Description</span>
                  {renderSortIcon("itemName")}
                </div>
              </th>
              <th className="px-4 py-3.5 whitespace-nowrap min-w-[150px]">
                Suggested Dealer
              </th>
              <th className="px-4 py-3.5 whitespace-nowrap min-w-[140px]">
                Purpose
              </th>
              <th
                onClick={() => handleSort("totalCost")}
                className="px-4 py-3.5 cursor-pointer group hover:text-text transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Estimated Cost</span>
                  {renderSortIcon("totalCost")}
                </div>
              </th>
              <th className="px-4 py-3.5 text-right whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedLots.map((lot) => {
              const remainingRatio =
                lot.quantity > 0 ? (lot.quantityRemaining / lot.quantity) * 100 : 0;
              const isDepleted = lot.quantityRemaining === 0;
              const isLowStock = !isDepleted && remainingRatio <= 20;
              const poDate = lot.purchasedOn || lot.createdAt.split("T")[0];

              return (
                <tr
                  key={lot.id}
                  onClick={() => onSelectLot(lot)}
                  className="hover:bg-bg-subtle/70 transition-colors cursor-pointer group"
                >
                  {/* 1. P.O Number & Date */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-text bg-bg-subtle px-1.5 py-0.5 rounded border border-border">
                        {lot.poNumber || lot.lotCode}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyCode(e, lot.poNumber || lot.lotCode)}
                        title="Copy P.O Number"
                        className="p-1 rounded text-text-secondary hover:text-text hover:bg-border/60 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        {copiedCode === (lot.poNumber || lot.lotCode) ? (
                          <Check className="h-3 w-3 text-status-active-text" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <div className="text-[10px] text-text-secondary mt-0.5 space-x-1.5">
                      <span>Date: <strong className="text-text font-medium">{poDate}</strong></span>
                      <span>•</span>
                      <span className="font-mono">Lot: <strong className="text-text font-medium">{lot.lotCode}</strong></span>
                    </div>
                  </td>

                  {/* 2. Quantity (with availability sub-gauge) */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="font-bold text-text">
                          {lot.quantity} <span className="font-normal text-text-secondary">units</span>
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                            isDepleted
                              ? "bg-status-retired-bg/15 text-status-retired-text"
                              : isLowStock
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              : "bg-status-active-bg/15 text-status-active-text"
                          )}
                        >
                          {lot.quantityRemaining} left
                        </span>
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
                  </td>

                  {/* 3. Description */}
                  <td className="px-4 py-3">
                    <div className="space-y-0.5 max-w-[240px]">
                      <span className="font-bold text-text truncate block" title={lot.itemName}>
                        {lot.itemName}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                        <span className="font-mono text-text-secondary">Code: {lot.itemCode}</span>
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded font-semibold capitalize border",
                            lot.itemType === "asset"
                              ? "bg-category-computing-bg/10 text-category-computing-bg border-category-computing-bg/30"
                              : "bg-category-av-bg/10 text-category-av-bg border-category-av-bg/30"
                          )}
                        >
                          {lot.itemType}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 4. Suggested Dealer */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold text-text block truncate max-w-[160px]" title={lot.supplierName || "Direct / Internal"}>
                      {lot.supplierName || "Direct / Internal"}
                    </span>
                    {lot.reference && (
                      <span className="text-[10px] font-mono text-text-secondary block truncate max-w-[160px]">
                        Ref: {lot.reference}
                      </span>
                    )}
                  </td>

                  {/* 5. Purpose */}
                  <td className="px-4 py-3">
                    <p className="text-text-secondary text-[11px] truncate max-w-[160px]" title={lot.notes || "Institutional Inventory & Operations"}>
                      {lot.notes || "Inventory & Operations"}
                    </p>
                  </td>

                  {/* 6. Estimated Cost */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono font-bold text-status-active-text block text-xs">
                      ₱{Number(lot.totalCost).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] font-mono text-text-secondary block">
                      @ ₱{Number(lot.unitCost).toLocaleString("en-US", { minimumFractionDigits: 2 })}/ea
                    </span>
                  </td>

                  {/* 7. Actions */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                      {/* Print Official CRMC PO Slip */}
                      <button
                        type="button"
                        onClick={() => onPrintSlip(lot)}
                        title="Print Official CRMC PO Slip"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-accent hover:bg-accent/10 rounded-lg border border-border transition-colors cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Print PO Slip</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
