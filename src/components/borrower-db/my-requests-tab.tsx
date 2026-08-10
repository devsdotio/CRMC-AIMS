"use client";

import { ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { MyRequestItem, MyRequestItemSkeleton } from "./my-request-item";
import { CancelRequestDialog } from "./cancel-request-dialog";
import type { PortalBorrowRequest, RequestStatusFilter } from "./types";
import { useState } from "react";

import { useBorrowRequests, useRejectBorrowRequestMutation } from "@/features/borrow-requests/client/use-borrow-requests";

const STATUS_FILTERS: { key: RequestStatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "returned", label: "Completed" },
];

export function MyRequestsTab() {
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("all");
  const [cancelTarget, setCancelTarget] = useState<PortalBorrowRequest | null>(null);

  const { data: response, isLoading: loading } = useBorrowRequests();
  const requests = response?.data ?? [];
  const { mutate: cancelRequest } = useRejectBorrowRequestMutation();

  const handleCancelConfirmed = (requestId: string) => {
    cancelRequest({ id: requestId, reason: "Cancelled by borrower" });
  };

  const filtered =
    statusFilter === "all"
      ? requests
      : requests.filter((r) => r.status === statusFilter);

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter requests by status"
      >
        {STATUS_FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? requests.length
              : requests.filter((r) => r.status === f.key).length;

          const isActive = statusFilter === f.key;

          const activeColors = {
            all: "bg-text text-card border-text",
            pending: "bg-status-repair-bg/15 text-status-repair-text border-status-repair-bg/40",
            approved: "bg-status-active-bg/15 text-status-active-text border-status-active-bg/40",
            rejected: "bg-status-outofservice-bg/10 text-status-outofservice-bg dark:text-status-outofservice-text border-status-outofservice-bg/40",
            returned: "bg-bg-subtle text-text border-border",
          };

          const badgeColors = {
            all: "bg-card/20 text-card",
            pending: "bg-status-repair-bg/20 text-status-repair-text",
            approved: "bg-status-active-bg/20 text-status-active-text",
            rejected: "bg-status-outofservice-bg/20 text-status-outofservice-bg dark:text-status-outofservice-text",
            returned: "bg-border text-text",
          };

          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              aria-pressed={isActive}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                isActive
                  ? activeColors[f.key]
                  : "bg-card border-border text-text-secondary hover:border-text-secondary/50 hover:text-text"
              )}
            >
              {f.label}
              {count > 0 && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[11px] font-bold",
                    isActive
                      ? badgeColors[f.key]
                      : "bg-bg-subtle text-text-secondary"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="rounded-xl border border-border overflow-hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <MyRequestItemSkeleton key={i} />
          ))
        ) : filtered.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-16 text-center">
             <div className="h-12 w-12 rounded-full bg-bg-subtle flex items-center justify-center mb-4">
               <ClipboardList className="h-5 w-5 text-text-secondary" aria-hidden />
             </div>
             <h3 className="text-sm font-semibold text-text">
               {statusFilter === "all"
                 ? "No requests yet"
                 : `No ${STATUS_FILTERS.find((f) => f.key === statusFilter)?.label.toLowerCase()} requests`}
             </h3>
             <p className="text-xs text-text-secondary mt-1 max-w-xs">
               {statusFilter === "all"
                 ? "Browse the available assets and consumables to submit your first borrow request."
                 : "No requests match this filter. Try selecting a different status."}
             </p>
           </div>
        ) : (
          filtered.map((request) => (
            <MyRequestItem
              key={request.id}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
              request={request as any}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onCancel={(r) => setCancelTarget(r as any)}
            />
          ))
        )}
      </div>

      {/* Cancel confirmation dialog */}
      {cancelTarget && (
        <CancelRequestDialog
          request={cancelTarget}
          open={!!cancelTarget}
          onOpenChange={(open) => {
            if (!open) setCancelTarget(null);
          }}
          onConfirm={() => {
            handleCancelConfirmed(cancelTarget.id);
            setCancelTarget(null);
          }}
        />
      )}
    </div>
  );
}
