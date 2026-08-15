"use client";

import { useState, useMemo, useEffect } from "react";
import { ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MyRequestItem } from "./my-request-item";
import { CancelRequestDialog } from "./cancel-request-dialog";
import { RequestDetailSheet } from "./request-detail-sheet";
import type { PortalBorrowRequest, RequestStatusFilter } from "./types";
import { LoadingState } from "@/components/providers/loading-context";

import { useBorrowRequests, useRejectBorrowRequestMutation } from "@/features/borrow-requests/client/use-borrow-requests";

const STATUS_FILTERS: { key: RequestStatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "returned", label: "Completed" },
];

const REQUESTS_PAGE_SIZE = 5;

export function MyRequestsTab() {
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>("all");
  const [cancelTarget, setCancelTarget] = useState<PortalBorrowRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PortalBorrowRequest | null>(null);
  const [page, setPage] = useState(1);

  const { data: response, isLoading: loading } = useBorrowRequests();
  const requests = useMemo(() => response?.data ?? [], [response?.data]);
  const { mutate: cancelRequest } = useRejectBorrowRequestMutation();

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleCancelConfirmed = (requestId: string) => {
    cancelRequest({ id: requestId, reason: "Cancelled by borrower" });
  };

  const filtered = useMemo(() => {
    return statusFilter === "all"
      ? requests
      : requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / REQUESTS_PAGE_SIZE));
  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * REQUESTS_PAGE_SIZE;
    return filtered.slice(start, start + REQUESTS_PAGE_SIZE);
  }, [filtered, page]);

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
            all: "bg-accent text-accent-foreground border-accent",
            pending: "bg-status-repair-bg/15 text-status-repair-text border-status-repair-bg/40",
            approved: "bg-status-active-bg/15 text-status-active-text border-status-active-bg/40",
            rejected: "bg-destructive text-white border-destructive",
            returned: "bg-bg-subtle text-text border-border",
          };

          const badgeColors = {
            all: "bg-card/20 text-card",
            pending: "bg-status-repair-bg/20 text-status-repair-text",
            approved: "bg-status-active-bg/20 text-status-active-text",
            rejected: "bg-destructive text-white",
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
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        {loading ? (
          <LoadingState
            variant="card"
            icon="clipboard"
            message="Loading your requests..."
            subtitle="Fetching your borrow and requisition requests..."
            className="border-none shadow-none py-12"
          />
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
                ? "Browse the available assets and consumables to submit your first borrow or requisition request."
                : "No requests match this filter. Try selecting a different status."}
            </p>
          </div>
        ) : (
          paginatedRequests.map((request) => (
            <MyRequestItem
              key={request.id}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              request={request as any}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onViewDetails={(r) => setSelectedRequest(r as any)}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onCancel={(r) => setCancelTarget(r as any)}
            />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
          <p className="text-xs text-text-secondary">
            Page <span className="font-semibold text-text">{page}</span> of{" "}
            <span className="font-semibold text-text">{totalPages}</span> (
            {filtered.length} total request{filtered.length !== 1 ? "s" : ""})
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-subtle transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Request Detail Sheet */}
      {selectedRequest && (
        <RequestDetailSheet
          request={selectedRequest}
          open={!!selectedRequest}
          onOpenChange={(open) => {
            if (!open) setSelectedRequest(null);
          }}
          onCancel={(r) => {
            setSelectedRequest(null);
            setCancelTarget(r);
          }}
        />
      )}

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
