"use client";

import { Check, X, Calendar, User, Building2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BorrowRequest, AssetCategory, RequestStatus } from "./types";

export interface RequestListItemProps {
  request: BorrowRequest;
  onSelect: (request: BorrowRequest) => void;
  onApprove: (request: BorrowRequest) => void;
  onReject: (request: BorrowRequest) => void;
}

const CATEGORY_STYLES: Record<AssetCategory, { bg: string; text: string; label: string }> = {
  transport: { bg: "bg-category-transport-bg", text: "text-category-transport-text", label: "Transport" },
  computing: { bg: "bg-category-computing-bg", text: "text-category-computing-text", label: "Computing" },
  av:        { bg: "bg-category-av-bg",        text: "text-category-av-text",        label: "AV Equipment" },
  furniture: { bg: "bg-category-furniture-bg", text: "text-category-furniture-text", label: "Furniture" },
};

const STATUS_STYLES: Record<RequestStatus, { bg: string; text: string; label: string }> = {
  pending:  { bg: "bg-status-repair-bg/20",     text: "text-status-repair-text font-bold",      label: "Pending Review" },
  approved: { bg: "bg-status-active-bg/20",     text: "text-status-active-text font-bold",      label: "Approved" },
  rejected: { bg: "bg-status-outofservice-bg/20", text: "text-status-outofservice-text font-bold", label: "Rejected" },
  returned: { bg: "bg-status-retired-bg/20",    text: "text-status-retired-text font-bold",     label: "Returned" },
};

export function RequestListItem({
  request,
  onSelect,
  onApprove,
  onReject,
}: RequestListItemProps) {
  const categoryMeta = CATEGORY_STYLES[request.category];
  const statusMeta = STATUS_STYLES[request.status];

  return (
    <div
      onClick={() => onSelect(request)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(request);
        }
      }}
      className={cn(
        "group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:px-6 bg-bg border-b border-border transition-colors duration-150 cursor-pointer",
        "hover:bg-bg-subtle/80 focus:outline-none focus-visible:bg-bg-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
      )}
    >
      {/* Left Column: Requester & Item Info */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {/* Row 1: Code & Category Tag */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono font-semibold text-text-secondary">
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
        </div>

        {/* Row 2: Item Description */}
        <h3 className="text-sm font-bold text-text truncate group-hover:text-accent transition-colors">
          {request.itemDescription}
          {request.quantity > 1 && (
            <span className="ml-2 text-xs font-semibold text-text-secondary">
              (Qty: {request.quantity})
            </span>
          )}
        </h3>

        {/* Row 3: Requester Name & Department */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
          <span className="flex items-center gap-1 font-medium text-text">
            <User className="h-3.5 w-3.5 text-text-secondary/70 shrink-0" />
            {request.requesterName}
          </span>
          <span className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 text-text-secondary/70 shrink-0" />
            {request.department}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-text-secondary/80">
            <Calendar className="h-3.5 w-3.5 text-text-secondary/70 shrink-0" />
            Return by: <span className="font-semibold text-text">{request.expectedReturnDate}</span>
          </span>
        </div>
      </div>

      {/* Right Column: Status Tag & Inline Actions */}
      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
        {/* Status Badge */}
        <span
          className={cn(
            "inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums whitespace-nowrap",
            statusMeta.bg,
            statusMeta.text
          )}
        >
          {statusMeta.label}
        </span>

        {/* Inline Actions (only for Pending requests) */}
        {request.status === "pending" && (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onApprove(request)}
              aria-label={`Approve request ${request.requestCode} from ${request.requesterName}`}
              className={cn(
                "inline-flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground",
                "shadow-xs transition-colors duration-150 hover:opacity-90",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
              )}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              Approve
            </button>
            <button
              type="button"
              onClick={() => onReject(request)}
              aria-label={`Reject request ${request.requestCode} from ${request.requesterName}`}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border border-border bg-bg px-3 py-1.5 text-xs font-semibold text-text-secondary",
                "transition-colors duration-150 hover:border-status-outofservice-bg hover:text-status-outofservice-text",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-status-outofservice-bg focus-visible:ring-offset-1"
              )}
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
