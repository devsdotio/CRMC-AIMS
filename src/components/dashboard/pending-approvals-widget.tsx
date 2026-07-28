"use client";

import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PendingRequest {
  id: string;
  requesterName: string;
  department: string;
  itemDescription: string;
  requestedAt: string;
  relativeTime: string;
}

export interface PendingApprovalsWidgetProps {
  requests: PendingRequest[];
  loading?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-border", className)} aria-hidden="true" />;
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-border last:border-0">
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-3 w-52" />
      </div>
      <div className="flex gap-2 shrink-0">
        <Skeleton className="h-7 w-16 rounded-md" />
        <Skeleton className="h-7 w-16 rounded-md" />
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PendingApprovalsWidget({
  requests,
  loading = false,
  onApprove,
  onReject,
}: PendingApprovalsWidgetProps) {
  return (
    <section
      className="flex flex-col rounded-lg border border-border bg-bg overflow-hidden"
      aria-labelledby="pending-approvals-heading"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 id="pending-approvals-heading" className="text-sm font-semibold text-text">
            Pending Approvals
          </h2>
          {!loading && (
            <p className="text-xs text-text-secondary mt-0.5">
              {requests.length === 0
                ? "All requests reviewed"
                : `${requests.length} awaiting action`}
            </p>
          )}
        </div>
        <Link
          href="/borrow-requests"
          className="flex items-center gap-0.5 text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Body */}
      <div className="divide-y divide-border">
        {loading ? (
          <div className="px-5">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-5 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-status-active-bg/15">
              <Check className="h-5 w-5 text-status-active-bg" strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-sm font-medium text-text">No pending requests</p>
              <p className="text-xs text-text-secondary mt-0.5">
                All borrow requests have been reviewed.
              </p>
            </div>
          </div>
        ) : (
          <ul className="px-5" aria-label="Pending borrow requests">
            {requests.slice(0, 5).map((req) => (
              <li
                key={req.id}
                className="flex items-center justify-between gap-4 py-3.5 last:pb-5"
              >
                {/* Info */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium text-text truncate">
                    {req.requesterName}
                    <span className="ml-1.5 text-xs font-normal text-text-secondary">
                      · {req.department}
                    </span>
                  </span>
                  <span className="text-xs text-text-secondary truncate">
                    {req.itemDescription}
                    <span className="mx-1.5 opacity-40">·</span>
                    {req.relativeTime}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onApprove?.(req.id)}
                    aria-label={`Approve request from ${req.requesterName}`}
                    className={cn(
                      "rounded-md border border-status-active-bg px-3 py-1.5 text-xs font-medium",
                      "text-status-active-bg transition-colors duration-150",
                      "hover:bg-status-active-bg hover:text-white",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-status-active-bg"
                    )}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject?.(req.id)}
                    aria-label={`Reject request from ${req.requesterName}`}
                    className={cn(
                      "rounded-md border border-border px-3 py-1.5 text-xs font-medium",
                      "text-text-secondary transition-colors duration-150",
                      "hover:border-accent hover:text-accent",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    )}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
