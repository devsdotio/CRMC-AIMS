"use client";

import { ClipboardCheck, Inbox } from "lucide-react";
import type { BorrowRequest, TabFilter } from "./types";
import { RequestListItem } from "./request-list-item";

export interface RequestListProps {
  requests: BorrowRequest[];
  activeTab: TabFilter;
  loading?: boolean;
  onSelect: (request: BorrowRequest) => void;
  onApprove: (request: BorrowRequest) => void;
  onReject: (request: BorrowRequest) => void;
}

// ─── Skeleton Row — Matches RequestListItem dimensions exactly ───────────────

function SkeletonRow() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:px-6 bg-bg border-b border-border animate-pulse">
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="h-3 w-24 bg-border rounded" />
          <div className="h-4 w-20 bg-border rounded-full" />
        </div>
        <div className="h-4 w-64 bg-border rounded" />
        <div className="flex items-center gap-3">
          <div className="h-3 w-28 bg-border rounded" />
          <div className="h-3 w-20 bg-border rounded" />
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="h-6 w-24 bg-border rounded-full" />
        <div className="h-8 w-20 bg-border rounded-md" />
        <div className="h-8 w-20 bg-border rounded-md" />
      </div>
    </div>
  );
}

// ─── Empty state messaging map ───────────────────────────────────────────────

const EMPTY_MESSAGES: Record<TabFilter, { title: string; subtitle: string }> = {
  pending: {
    title: "No pending requests",
    subtitle: "All borrow requests in the queue have been reviewed.",
  },
  approved: {
    title: "No approved requests",
    subtitle: "There are currently no approved requests matching your filters.",
  },
  rejected: {
    title: "No rejected requests",
    subtitle: "No requests have been rejected under this view.",
  },
  all: {
    title: "No requests found",
    subtitle: "No borrow requests match your search criteria or date filter.",
  },
};

export function RequestList({
  requests,
  activeTab,
  loading = false,
  onSelect,
  onApprove,
  onReject,
}: RequestListProps) {
  if (loading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    const emptyMeta = EMPTY_MESSAGES[activeTab];
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-subtle text-text-secondary border border-border">
          {activeTab === "pending" ? (
            <ClipboardCheck className="h-6 w-6 text-status-active-text" />
          ) : (
            <Inbox className="h-6 w-6 text-text-secondary" />
          )}
        </div>
        <div>
          <h3 className="text-base font-bold text-text">{emptyMeta.title}</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-sm">
            {emptyMeta.subtitle}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="tabpanel"
      id={`panel-${activeTab}`}
      aria-labelledby={`tab-${activeTab}`}
      className="divide-y divide-border"
    >
      {requests.map((request) => (
        <RequestListItem
          key={request.id}
          request={request}
          onSelect={onSelect}
          onApprove={onApprove}
          onReject={onReject}
        />
      ))}
    </div>
  );
}
