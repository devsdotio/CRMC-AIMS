"use client";

import {
  RotateCcw,
  Send,
  Hourglass,
  FileText,
  CheckCircle2,
  XCircle,
  PackagePlus,
  PackageMinus,
  Wrench,
  History,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export type ActivityType =
  | "return"
  | "borrow"
  | "request"
  | "approved"
  | "rejected"
  | "cancelled"
  | "restock"
  | "checkout"
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

// ─── Icon and Style Map (Uniformed with Request Sheets & Audit Views) ────────

const ACTIVITY_META: Record<
  string,
  {
    icon: LucideIcon;
    pillClass: string;
    badgeClass: string;
    label: string;
  }
> = {
  return: {
    icon: RotateCcw,
    pillClass: "bg-bg-subtle text-text border border-border",
    badgeClass: "bg-bg-subtle text-text border-border",
    label: "Returned",
  },
  borrow: {
    icon: Send,
    pillClass:
      "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
    badgeClass:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    label: "Released",
  },
  release: {
    icon: Send,
    pillClass:
      "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
    badgeClass:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    label: "Released",
  },
  request: {
    icon: Hourglass,
    pillClass:
      "bg-status-repair-bg/15 text-status-repair-text border border-status-repair-bg/30",
    badgeClass:
      "bg-status-repair-bg/10 text-status-repair-text border-status-repair-bg/20",
    label: "Request",
  },
  pending: {
    icon: Hourglass,
    pillClass:
      "bg-status-repair-bg/15 text-status-repair-text border border-status-repair-bg/30",
    badgeClass:
      "bg-status-repair-bg/10 text-status-repair-text border-status-repair-bg/20",
    label: "Pending",
  },
  approved: {
    icon: CheckCircle2,
    pillClass:
      "bg-status-active-bg/15 text-status-active-text border border-status-active-bg/30",
    badgeClass:
      "bg-status-active-bg/10 text-status-active-text border-status-active-bg/20",
    label: "Approved",
  },
  rejected: {
    icon: XCircle,
    pillClass: "bg-destructive/15 text-destructive border border-destructive/30",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    label: "Rejected",
  },
  cancelled: {
    icon: XCircle,
    pillClass: "bg-destructive/15 text-destructive border border-destructive/30",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    label: "Cancelled",
  },
  restock: {
    icon: PackagePlus,
    pillClass:
      "bg-status-active-bg/15 text-status-active-text border border-status-active-bg/30",
    badgeClass:
      "bg-status-active-bg/10 text-status-active-text border-status-active-bg/20",
    label: "Restocked",
  },
  checkout: {
    icon: PackageMinus,
    pillClass:
      "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
    badgeClass:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    label: "Checkout",
  },
  maintenance: {
    icon: Wrench,
    pillClass:
      "bg-status-repair-bg/15 text-status-repair-text border border-status-repair-bg/30",
    badgeClass:
      "bg-status-repair-bg/10 text-status-repair-text border-status-repair-bg/20",
    label: "Maintenance",
  },
};

const DEFAULT_META = {
  icon: History,
  pillClass: "bg-bg-subtle text-text-secondary border border-border",
  badgeClass: "bg-bg-subtle text-text-secondary border-border",
  label: "Activity",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded bg-border", className)}
      aria-hidden="true"
    />
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3.5 py-3">
      <Skeleton className="h-8 w-8 rounded-full shrink-0 mt-0.5" />
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-20" />
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
      className="rounded-lg border border-border bg-card overflow-hidden shadow-xs"
      aria-labelledby="recent-activity-heading"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Activity className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="recent-activity-heading"
              className="text-sm font-bold text-text leading-none"
            >
              Recent Activity
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              Live audit stream of recent item events and movements
            </p>
          </div>
        </div>

        {!loading && entries.length > 0 && (
          <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-bg-subtle border border-border text-text-secondary">
            {Math.min(entries.length, maxRows)} of {entries.length}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-2">
        {loading ? (
          <div className="divide-y divide-border/60">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-5 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bg-subtle border border-border text-text-secondary shadow-xs">
              <History className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-sm font-bold text-text">No recent activity</p>
              <p className="text-xs text-text-secondary mt-1 max-w-xs leading-relaxed">
                No events or asset lifecycle movements have been recorded yet.
              </p>
            </div>
          </div>
        ) : (
          <ol className="divide-y divide-border/60" aria-label="Recent activity log">
            {visible.map((entry) => {
              const meta = ACTIVITY_META[entry.type] || DEFAULT_META;
              const Icon = meta.icon;

              return (
                <li
                  key={entry.id}
                  className="flex items-start gap-3.5 py-3 group hover:bg-bg-subtle/40 -mx-5 px-5 transition-colors"
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold mt-0.5 shadow-xs transition-transform duration-150 group-hover:scale-105",
                      meta.pillClass
                    )}
                    aria-hidden="true"
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-text leading-snug font-medium">
                        {entry.description}
                      </p>
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border leading-none shrink-0",
                          meta.badgeClass
                        )}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <time
                      className="text-xs text-text-secondary mt-1 block"
                      title={entry.relativeTime}
                    >
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
