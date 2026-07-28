"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  Package,
  Repeat,
  Boxes,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ActivityType =
  | "return"
  | "borrow"
  | "request"
  | "restock"
  | "maintenance"
  | "release";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  description: string;
  relativeTime: string;
  actor?: string;
}

export interface RecentActivityFeedProps {
  entries: ActivityEntry[];
  loading?: boolean;
  maxRows?: number;
}

// ─── Icon map ────────────────────────────────────────────────────────────────

const ACTIVITY_META: Record<ActivityType, { icon: LucideIcon; colorClass: string; label: string }> = {
  return:      { icon: ArrowDownToLine, colorClass: "text-status-active-text bg-status-active-bg",          label: "Return" },
  borrow:      { icon: ArrowUpFromLine, colorClass: "text-category-computing-text bg-category-computing-bg", label: "Borrow" },
  request:     { icon: ClipboardList,   colorClass: "text-category-transport-text bg-category-transport-bg", label: "Request" },
  restock:     { icon: Boxes,           colorClass: "text-status-active-text bg-status-active-bg",          label: "Restock" },
  maintenance: { icon: Wrench,          colorClass: "text-status-repair-text bg-status-repair-bg",          label: "Maintenance" },
  release:     { icon: Package,         colorClass: "text-category-av-text bg-category-av-bg",              label: "Release" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-border", className)} aria-hidden="true" />;
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 py-3">
      <Skeleton className="h-7 w-7 rounded-full shrink-0 mt-0.5" />
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RecentActivityFeed({
  entries,
  loading = false,
  maxRows = 10,
}: RecentActivityFeedProps) {
  const visible = entries.slice(0, maxRows);

  return (
    <section
      className="rounded-lg border border-border bg-bg overflow-hidden"
      aria-labelledby="recent-activity-heading"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <h2 id="recent-activity-heading" className="text-sm font-semibold text-text">
          Recent Activity
        </h2>
        {!loading && (
          <p className="text-xs text-text-secondary mt-0.5">
            {entries.length === 0
              ? "Nothing logged yet"
              : `Latest ${Math.min(entries.length, maxRows)} actions`}
          </p>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-2">
        {loading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-text-secondary">No activity has been recorded yet.</p>
          </div>
        ) : (
          <ol className="divide-y divide-border" aria-label="Recent activity log">
            {visible.map((entry) => {
              const meta = ACTIVITY_META[entry.type];
              const Icon = meta.icon;
              return (
                <li key={entry.id} className="flex items-start gap-3.5 py-3 group">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold mt-0.5",
                      meta.colorClass,
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text leading-snug">{entry.description}</p>
                    <time className="text-xs text-text-secondary mt-0.5 block" title={entry.relativeTime}>
                      {entry.relativeTime}
                    </time>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
