"use client";

import { Wrench } from "lucide-react";
import type { MaintenanceLogRecord } from "@/types/maintenance-logs";
import { MaintenanceLogListItem } from "./maintenance-log-list-item";

export interface MaintenanceLogListProps {
  records: MaintenanceLogRecord[];
  loading?: boolean;
  onSelect: (record: MaintenanceLogRecord) => void;
  onResolve?: (record: MaintenanceLogRecord) => void;
}

// ─── Matched Skeleton Row for Maintenance Log List ────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:px-6 bg-bg border-b border-border animate-pulse">
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-24 bg-border rounded" />
          <div className="h-4 w-16 bg-border rounded" />
          <div className="h-4 w-20 bg-border rounded-full" />
        </div>
        <div className="h-4.5 w-64 bg-border rounded" />
        <div className="h-3.5 w-full max-w-md bg-border rounded" />
        <div className="flex items-center gap-3">
          <div className="h-3 w-28 bg-border rounded" />
          <div className="h-3 w-20 bg-border rounded" />
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="h-6 w-28 bg-border rounded-full" />
        <div className="h-8 w-20 bg-border rounded-md" />
      </div>
    </div>
  );
}

export function MaintenanceLogList({
  records,
  loading = false,
  onSelect,
  onResolve,
}: MaintenanceLogListProps) {
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
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-subtle text-text-secondary border border-border">
          <Wrench className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-text">No maintenance entries match these filters.</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-sm">
            Adjust your search query, category selection, or condition filter parameters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {records.map((record) => (
        <MaintenanceLogListItem
          key={record.id}
          record={record}
          onSelect={onSelect}
          onResolve={onResolve}
        />
      ))}
    </div>
  );
}
