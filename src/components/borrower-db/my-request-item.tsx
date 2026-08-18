"use client";

import {
  Calendar,
  CheckCircle2,
  XCircle,
  Hourglass,
  ChevronRight,
  Send,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortalBorrowRequest } from "./types";

interface MyRequestItemProps {
  request: PortalBorrowRequest;
  onCancel?: (request: PortalBorrowRequest) => void;
  onViewDetails?: (request: PortalBorrowRequest) => void;
}

const WORKFLOW_STATUS_STYLES: Record<
  string,
  { label: string; badgeClass: string; Icon: React.ElementType }
> = {
  pending: {
    label: "Pending Review",
    badgeClass:
      "bg-status-repair-bg/20 text-status-repair-text border-status-repair-bg/30",
    Icon: Hourglass,
  },
  approved: {
    label: "Approved",
    badgeClass:
      "bg-status-active-bg/20 text-status-active-text border-status-active-bg/30",
    Icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    badgeClass: "bg-destructive text-white border border-destructive/30",
    Icon: XCircle,
  },
  released: {
    label: "Released",
    badgeClass:
      "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",
    Icon: Send,
  },
  returned: {
    label: "Completed",
    badgeClass:
      "bg-bg-subtle text-text border-border",
    Icon: RotateCcw,
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
    <div className="flex items-center justify-between p-4 md:px-5 border-b border-border bg-card">
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
  const StatusIcon = statusStyle.Icon;

  const firstItem = request.items?.[0];
  const moreCount = (request.items?.length || 0) - 1;

  const itemSummary = firstItem
    ? `${firstItem.itemDescription}${moreCount > 0 ? ` +${moreCount} more` : ""}`
    : "Request";

  const totalUnits = request.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 1;

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
        "flex items-center justify-between gap-4 p-4 md:px-5 border-b border-border bg-card transition-all cursor-pointer group select-none",
        "hover:bg-bg-subtle/80 focus:outline-none focus-visible:bg-bg-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
      )}
      aria-label={`View details for ${request.requestCode}: ${itemSummary}`}
    >
      {/* Left: Code, Primary Item Title, Date Range */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-text-secondary group-hover:text-accent transition-colors">
            {request.requestCode}
          </span>
          <span className="text-text-secondary/30 text-xs">·</span>
          <span className="text-xs text-text-secondary">
            {new Date(request.requestedAt).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="text-text-secondary/30 text-xs">·</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-bg-subtle border border-border px-1.5 py-0.5 rounded">
            {totalUnits} {totalUnits === 1 ? "unit" : "units"}
          </span>
        </div>

        <h3 className="text-sm font-bold text-text truncate group-hover:text-accent transition-colors">
          {itemSummary}
        </h3>

        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-accent" aria-hidden />
            <span>
              {request.requestedDateFrom}
              {request.requestedDateTo && request.requestedDateTo !== request.requestedDateFrom &&
                ` → ${request.requestedDateTo}`}
            </span>
          </span>
        </div>
      </div>

      {/* Right: Status Badge & Chevron */}
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap",
            statusStyle.badgeClass
          )}
        >
          <StatusIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {statusStyle.label}
        </span>
        <ChevronRight className="h-4 w-4 text-text-secondary/50 group-hover:text-text group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}
