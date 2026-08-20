"use client";

import {
  Calendar,
  ChevronRight,
  Tag,
  FileText,
  Package,
} from "lucide-react";
import { getCategoryStyle } from "@/constants/categories";
import { cn } from "@/lib/utils";
import { formatItemDescription } from "@/lib/sanitize-display";
import type { PortalBorrowRequest } from "./types";

interface MyRequestItemProps {
  request: PortalBorrowRequest;
  onCancel?: (request: PortalBorrowRequest) => void;
  onViewDetails?: (request: PortalBorrowRequest) => void;
}

const WORKFLOW_STATUS_STYLES: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending: {
    label: "Pending Review",
    bg: "bg-status-repair-bg/20",
    text: "text-status-repair-text font-bold",
  },
  approved: {
    label: "Approved",
    bg: "bg-blue-500/15",
    text: "text-blue-600 dark:text-blue-400 font-bold",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-destructive",
    text: "text-white font-bold",
  },
  released: {
    label: "Issued / Released",
    bg: "bg-status-active-bg/20",
    text: "text-status-active-text font-bold",
  },
  returned: {
    label: "Completed",
    bg: "bg-status-active-bg/20",
    text: "text-status-active-text font-bold",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-bg-subtle",
    text: "text-text-secondary font-bold",
  },
};

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded bg-border", className)}
      aria-hidden
    />
  );
}

export function MyRequestItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 md:px-6 border-b border-border bg-bg">
      <div className="space-y-2 flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-16" />
        </div>
        <Skeleton className="h-4.5 w-56" />
        <Skeleton className="h-3.5 w-36" />
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </div>
  );
}

export function MyRequestItem({ request, onViewDetails }: MyRequestItemProps) {
  const statusStyle =
    WORKFLOW_STATUS_STYLES[request.status] ?? WORKFLOW_STATUS_STYLES.pending;

  const firstItem = request.items?.[0];
  const moreCount = (request.items?.length || 0) - 1;
  const categoryMeta = getCategoryStyle(firstItem?.category || "office");

  const itemSummary = formatItemDescription(
    firstItem?.itemDescription,
    categoryMeta.label,
    firstItem?.itemType
  );
  const totalUnits =
    request.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 1;

  const isSupply = request.items?.every((i) => i.itemType === "consumable");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onViewDetails?.(request)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onViewDetails?.(request);
        }
      }}
      className={cn(
        "group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:px-6 bg-bg border-b border-border transition-colors duration-150 cursor-pointer select-none",
        "hover:bg-bg-subtle/80 focus:outline-none focus-visible:bg-bg-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
      )}
      aria-label={`View details for ${request.requestCode}: ${itemSummary}`}
    >
      {/* Left Column: Code, Category, Title, Metadata */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {/* Row 1: Code, Category Badge, Type Tag */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="font-mono font-semibold text-text-secondary group-hover:text-accent transition-colors">
            {request.requestCode}
          </span>
          <span className="text-text-secondary/40">·</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
              categoryMeta.bg,
              categoryMeta.text
            )}
          >
            <Tag className="h-2.5 w-2.5" />
            {categoryMeta.label}
          </span>
          <span className="text-text-secondary/40">·</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-text-secondary bg-bg-subtle border border-border px-2 py-0.5 rounded-full uppercase tracking-wider">
            {isSupply ? "Supplies" : "Asset Borrow"}
          </span>
        </div>

        {/* Row 2: Item Description + Quantity Pill */}
        <h3 className="text-sm font-bold text-text truncate group-hover:text-accent transition-colors">
          {itemSummary} {moreCount > 0 ? `(+${moreCount} more)` : ""}
          <span className="ml-2 text-xs font-semibold text-text-secondary">
            (Qty: {totalUnits} {totalUnits === 1 ? "unit" : "units"})
          </span>
        </h3>

        {/* Row 3: Metadata with icons */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-text-secondary/70 shrink-0" />
            <span>
              {request.requestedDateFrom}
              {request.requestedDateTo &&
                request.requestedDateTo !== request.requestedDateFrom &&
                ` → ${request.requestedDateTo}`}
            </span>
          </span>
          {request.purpose && (
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-text-secondary/70 shrink-0" />
              <span className="truncate max-w-xs">{request.purpose}</span>
            </span>
          )}
          {moreCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1 text-text-secondary/80">
              <Package className="h-3.5 w-3.5 text-text-secondary/70 shrink-0" />
              <span className="truncate max-w-sm">
                {request.items.map((it) => `${it.itemDescription} (${it.quantity || 1})`).join(", ")}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Right Column: Status Badge & Chevron */}
      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
        <span
          className={cn(
            "inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums whitespace-nowrap",
            statusStyle.bg,
            statusStyle.text
          )}
        >
          {statusStyle.label}
        </span>
        <ChevronRight className="h-4 w-4 text-text-secondary/50 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}
