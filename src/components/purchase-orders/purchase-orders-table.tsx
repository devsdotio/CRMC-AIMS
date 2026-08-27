"use client";

import React, { useState, useMemo } from "react";
import {
  Boxes,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  FileText,
  Clock,
  ShieldCheck,
  Truck,
  PackageCheck,
  Ban,
} from "lucide-react";
import type { PurchaseLot, PurchaseOrderStatus } from "@/types/purchase-lots";
import { cn } from "@/lib/utils";
import {
  formatDateTime,
  formatRelativeTime,
} from "@/components/audit-logs/audit-log-utils";

type SortField =
  | "createdAt"
  | "lotCode"
  | "itemName"
  | "quantity"
  | "totalCost"
  | "status";
type SortOrder = "asc" | "desc";

interface PurchaseOrdersTableProps {
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

function SkeletonTableRow() {
  return (
    <tr className="border-b border-border bg-bg animate-pulse">
      <td className="px-4 py-3">
        <div className="h-4 w-28 bg-border rounded mb-1.5" />
        <div className="h-3 w-20 bg-border/60 rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-5 w-20 bg-border rounded-full" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-40 bg-border rounded mb-1.5" />
        <div className="flex items-center gap-2">
          <div className="h-3 w-16 bg-border/60 rounded" />
          <div className="h-3.5 w-16 bg-border/60 rounded-full" />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-12 bg-border rounded" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-28 bg-border rounded mb-1" />
      </td>
      <td className="px-4 py-3">
        <div className="h-4 w-20 bg-border rounded mb-1" />
        <div className="h-3 w-14 bg-border/60 rounded" />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end">
          <div className="h-7 w-20 bg-border rounded-lg" />
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
      setSortOrder("asc");
    }
  };

  const sortedLots = useMemo(() => {
    return [...lots].sort((a, b) => {
      let aVal: string | number =
        (a[sortField as keyof PurchaseLot] as string | number) ?? "";
      let bVal: string | number =
        (b[sortField as keyof PurchaseLot] as string | number) ?? "";

      if (sortField === "totalCost") {
        aVal = parseFloat(a.totalCost) || 0;
        bVal = parseFloat(b.totalCost) || 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [lots, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="sticky top-0 z-10 bg-bg-subtle text-text-secondary border-b border-border font-semibold uppercase tracking-wider text-[11px] shadow-2xs">
            <tr>
              <th className="px-4 py-3.5">PO Number & Date</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Description</th>
              <th className="px-4 py-3.5">Qty</th>
              <th className="px-4 py-3.5">Dealer / Supplier</th>
              <th className="px-4 py-3.5">Cost (₱)</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonTableRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (lots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center min-h-96">
        <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 text-accent mb-3">
          <Boxes className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-text">
          No Purchase Orders Found
        </h3>
        <p className="text-xs text-text-secondary max-w-sm mt-1 leading-relaxed">
          No purchase orders match your active search and filter criteria. File
          a new PO or reset your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left" aria-label="Purchase orders table">
        <thead className="sticky top-0 z-10 bg-bg-subtle text-text-secondary border-b border-border font-semibold uppercase tracking-wider text-[11px] select-none shadow-2xs">
          <tr>
            <th
              onClick={() => handleSort("createdAt")}
              className="px-4 py-3.5 cursor-pointer hover:text-text transition-colors"
            >
                <div className="flex items-center gap-1.5">
                  <span>PO Number & Date</span>
                  {sortField === "createdAt" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                  )}
                </div>
              </th>

              <th
                onClick={() => handleSort("status")}
                className="px-4 py-3.5 cursor-pointer hover:text-text transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  {sortField === "status" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                  )}
                </div>
              </th>

              <th
                onClick={() => handleSort("itemName")}
                className="px-4 py-3.5 cursor-pointer hover:text-text transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Item Description</span>
                  {sortField === "itemName" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                  )}
                </div>
              </th>

              <th
                onClick={() => handleSort("quantity")}
                className="px-4 py-3.5 cursor-pointer hover:text-text transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Qty</span>
                  {sortField === "quantity" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                  )}
                </div>
              </th>

              <th className="px-4 py-3.5">Dealer / Supplier</th>

              <th
                onClick={() => handleSort("totalCost")}
                className="px-4 py-3.5 cursor-pointer hover:text-text transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Total Value (₱)</span>
                  {sortField === "totalCost" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                  )}
                </div>
              </th>

              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {sortedLots.map((lot) => {
              const displayPO = lot.poNumber || lot.lotCode;
              const poDate = lot.purchasedOn || lot.createdAt.split("T")[0];

              return (
                <tr
                  key={lot.id}
                  onClick={() => onSelectLot(lot)}
                  className="hover:bg-bg-subtle/60 transition-colors cursor-pointer group"
                >
                  {/* PO Number & Date */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-text group-hover:text-accent transition-colors">
                        {displayPO}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyCode(e, displayPO)}
                        title="Copy PO Code"
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-text-secondary hover:text-text transition-opacity"
                      >
                        {copiedCode === displayPO ? (
                          <Check className="h-3 w-3 text-status-active-text" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <span className="text-[11px] text-text-secondary block font-medium">
                      {poDate} ({formatRelativeTime(lot.createdAt)})
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={lot.status} />
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3">
                    <span className="font-semibold text-text block max-w-xs truncate">
                      {lot.itemName}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[10px] text-text-secondary">
                        {lot.itemCode}
                      </span>
                      <span className="text-[10px] text-text-secondary capitalize font-medium">
                        · {lot.itemType}
                      </span>
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="px-4 py-3 font-mono font-bold text-text whitespace-nowrap">
                    {lot.quantity}
                    {lot.status === "delivered" &&
                      lot.itemType === "consumable" && (
                        <span className="text-[10px] text-text-secondary block font-normal">
                          {lot.quantityRemaining} left
                        </span>
                      )}
                  </td>

                  {/* Supplier */}
                  <td className="px-4 py-3 text-text-secondary font-medium whitespace-nowrap max-w-37.5 truncate">
                    {lot.supplierName || "Direct / Internal"}
                  </td>

                  {/* Cost */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono font-bold text-status-active-text block">
                      ₱
                      {Number(lot.totalCost).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <span className="font-mono text-[10px] text-text-secondary">
                      @ ₱{Number(lot.unitCost).toFixed(2)}
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLot(lot);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-border bg-bg hover:bg-bg-subtle text-text transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
