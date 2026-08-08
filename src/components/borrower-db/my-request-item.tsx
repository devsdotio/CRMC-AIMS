"use client";

import {
  Tag,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Hourglass,
  X,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryStyle } from "@/constants/categories";
import type { PortalBorrowRequest } from "./types";

interface MyRequestItemProps {
  request: PortalBorrowRequest;
  onCancel: (request: PortalBorrowRequest) => void;
}

// Workflow status badges — deliberately different from asset condition tokens
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
    badgeClass:
      "bg-status-outofservice-bg/10 text-status-outofservice-bg dark:text-status-outofservice-text border-status-outofservice-bg/30",
    Icon: XCircle,
  },
  returned: {
    label: "Completed",
    badgeClass:
      "bg-bg-subtle text-text-secondary border-border",
    Icon: CheckCircle2,
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
    <div className="flex flex-col gap-3 p-4 md:px-6 border-b border-border bg-card">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </div>
      <Skeleton className="h-5 w-56" />
      <div className="flex gap-3">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3.5 w-28" />
      </div>
    </div>
  );
}

export function MyRequestItem({ request, onCancel }: MyRequestItemProps) {
  const categoryMeta = getCategoryStyle(request.category);
  const statusStyle =
    WORKFLOW_STATUS_STYLES[request.status] ?? WORKFLOW_STATUS_STYLES.pending;
  const StatusIcon = statusStyle.Icon;

  const isApprovedWaiting =
    request.status === "approved" && request.releasedStatus === "waiting_pickup";

  return (
    <article
      className={cn(
        "flex flex-col gap-2.5 p-4 md:px-6 border-b border-border bg-card transition-colors border-l-4",
        "hover:bg-bg-subtle/60",
        request.status === "pending" && "border-l-status-repair-bg/60",
        request.status === "approved" && "border-l-status-active-bg/60",
        request.status === "rejected" && "border-l-status-outofservice-bg/60",
        request.status === "returned" && "border-l-transparent"
      )}
    >
      {/* Row 1: Code, Category, Status */}
      <div className="flex items-center flex-wrap gap-2">
        <span className="font-mono text-xs font-semibold text-text-secondary">
          {request.requestCode}
        </span>
        <span className="text-text-secondary/30 text-xs">·</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border",
            categoryMeta.bg,
            categoryMeta.text,
            "border-transparent"
          )}
        >
          <Tag className="h-2.5 w-2.5" />
          {categoryMeta.label}
        </span>
        <span className="text-text-secondary/30 text-xs">·</span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-text-secondary border border-border px-2 py-0.5 rounded-full bg-bg-subtle">
          {request.itemType === "asset" ? "Borrow" : "Requisition"}
        </span>

        {/* Status badge */}
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap",
            statusStyle.badgeClass
          )}
        >
          <StatusIcon className="h-3 w-3 shrink-0" aria-hidden />
          {statusStyle.label}
        </span>
      </div>

      {/* Row 2: Item description */}
      <h3 className="text-sm font-bold text-text leading-snug">
        {request.itemDescription}
        {(request.requestedQuantity ?? request.quantity) > 1 && (
          <span className="ml-2 text-xs font-normal text-text-secondary">
            × {request.requestedQuantity ?? request.quantity}{" "}
            {request.itemType === "consumable" ? "units" : "item(s)"}
          </span>
        )}
      </h3>

      {/* Row 3: Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {request.requestedDateFrom}
            {request.requestedDateTo !== request.requestedDateFrom &&
              ` → ${request.requestedDateTo}`}
          </span>
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Submitted{" "}
          {new Date(request.requestedAt).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
          })}
        </span>
        {request.itemType === "asset" && request.assetCode && (
          <span className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="font-mono">{request.assetCode}</span>
          </span>
        )}
      </div>

      {/* Waiting for pickup indicator */}
      {isApprovedWaiting && (
        <div className="flex items-center gap-2 rounded-lg bg-status-active-bg/10 border border-status-active-bg/20 px-3 py-2">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-active-bg opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-status-active-bg" />
          </span>
          <p className="text-xs font-medium text-status-active-text">
            Approved — please proceed to the Property Custodian&apos;s Office for pickup.
          </p>
        </div>
      )}

      {/* Rejection reason */}
      {request.status === "rejected" && request.rejectionReason && (
        <div className="flex items-start gap-2 rounded-lg bg-status-outofservice-bg/10 border border-status-outofservice-bg/20 px-3 py-2">
          <AlertCircle
            className="h-4 w-4 shrink-0 text-status-outofservice-bg mt-0.5"
            aria-label="Rejection reason"
          />
          <p className="text-xs text-status-outofservice-bg dark:text-status-outofservice-text">
            <span className="font-semibold">Reason: </span>
            {request.rejectionReason}
          </p>
        </div>
      )}

      {/* Cancel action (pending only) */}
      {request.status === "pending" && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => onCancel(request)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-text-secondary hover:border-rose-400 hover:text-rose-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Cancel Request
          </button>
        </div>
      )}
    </article>
  );
}
