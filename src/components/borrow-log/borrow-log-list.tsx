"use client";

import { ClipboardCheck, CheckCircle2 } from "lucide-react";
import type { BorrowLogRecord, LogTabFilter } from "./types";
import { BorrowLogListItem } from "./borrow-log-list-item";

export interface BorrowLogListProps {
  records: BorrowLogRecord[];
  activeTab: LogTabFilter;
  loading?: boolean;
  onSelect: (record: BorrowLogRecord) => void;
  onProcessReturn: (record: BorrowLogRecord) => void;
}

// ─── Matched Skeleton Row for Borrow Log List ───────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:px-6 bg-bg border-b border-border animate-pulse">
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-24 bg-border rounded" />
          <div className="h-4 w-20 bg-border rounded-full" />
          <div className="h-4 w-16 bg-border rounded" />
        </div>
        <div className="h-4.5 w-64 bg-border rounded" />
        <div className="flex items-center gap-3">
          <div className="h-3 w-28 bg-border rounded" />
          <div className="h-3 w-20 bg-border rounded" />
          <div className="h-3 w-24 bg-border rounded" />
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="h-6 w-24 bg-border rounded-full" />
        <div className="h-8 w-28 bg-border rounded-md" />
      </div>
    </div>
  );
}

// ─── Empty state messaging map ───────────────────────────────────────────────

const EMPTY_MESSAGES: Record<LogTabFilter, { title: string; subtitle: string }> = {
  active: {
    title: "No active borrowings",
    subtitle: "There are currently no items checked out in active custody.",
  },
  overdue: {
    title: "No overdue items",
    subtitle: "All checked-out assets are within their designated return terms.",
  },
  returned: {
    title: "No returned logs",
    subtitle: "No completed asset return transactions match your filters.",
  },
  all: {
    title: "No transactions found",
    subtitle: "No borrow or return logs match your search criteria or date filter.",
  },
};

export function BorrowLogList({
  records,
  activeTab,
  loading = false,
  onSelect,
  onProcessReturn,
}: BorrowLogListProps) {
  if (loading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    const emptyMeta = EMPTY_MESSAGES[activeTab];
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-subtle text-text-secondary border border-border">
          {activeTab === "overdue" ? (
            <CheckCircle2 className="h-6 w-6 text-status-active-text" />
          ) : (
            <ClipboardCheck className="h-6 w-6 text-text-secondary" />
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
      {records.map((record) => (
        <BorrowLogListItem
          key={record.id}
          record={record}
          onSelect={onSelect}
          onProcessReturn={onProcessReturn}
        />
      ))}
    </div>
  );
}
