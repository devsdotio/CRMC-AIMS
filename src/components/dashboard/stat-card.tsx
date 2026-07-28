"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export type StatCardVariant = "default" | "warning" | "danger";

export interface StatCardProps {
  label: string;
  value: number | null;
  contextLine?: string;
  icon: LucideIcon;
  variant?: StatCardVariant;
  href?: string;
  loading?: boolean;
}

// ─── Variant maps ────────────────────────────────────────────────────────────

const borderAccent: Record<StatCardVariant, string> = {
  default: "border-l-4 border-l-primary",
  warning: "border-l-4 border-l-status-repair-bg",
  danger:  "border-l-4 border-l-status-outofservice-bg",
};

const iconColor: Record<StatCardVariant, string> = {
  default: "text-text-secondary",
  warning: "text-status-repair-bg",
  danger:  "text-accent",
};

const valueColor: Record<StatCardVariant, string> = {
  default: "text-text",
  warning: "text-status-repair-bg",
  danger:  "text-accent",
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded bg-border", className)} aria-hidden="true" />
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  contextLine,
  icon: Icon,
  variant = "default",
  href,
  loading = false,
}: StatCardProps) {
  const isLoading = loading || value === null;

  const card = (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border border-border",
        "bg-bg p-5 transition-shadow duration-200",
        href && "cursor-pointer hover:shadow-md hover:shadow-black/5",
        borderAccent[variant],
      )}
      aria-label={`${label}: ${isLoading ? "loading" : value}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          {label}
        </p>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
            "bg-bg-subtle transition-colors duration-200",
            href && "group-hover:bg-border",
          )}
          aria-hidden="true"
        >
          <Icon className={cn("h-4 w-4", iconColor[variant])} strokeWidth={1.75} />
        </span>
      </div>

      {/* Value */}
      {isLoading ? (
        <Skeleton className="h-9 w-20" />
      ) : (
        <p className={cn("text-4xl font-bold tabular-nums leading-none", valueColor[variant])}>
          {(value as number).toLocaleString()}
        </p>
      )}

      {/* Context line */}
      {isLoading ? (
        <Skeleton className="h-3.5 w-32" />
      ) : (
        contextLine && (
          <p className="text-xs text-text-secondary">{contextLine}</p>
        )
      )}

      {/* Arrow hint on hover */}
      {href && !isLoading && (
        <span
          className="absolute right-4 bottom-4 text-[10px] font-medium text-text-secondary opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          aria-hidden="true"
        >
          View all →
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
      >
        {card}
      </Link>
    );
  }

  return card;
}

// ─── Grid wrapper ────────────────────────────────────────────────────────────

export interface StatCardsGridProps {
  stats: StatCardProps[];
}

export function StatCardsGrid({ stats }: StatCardsGridProps) {
  return (
    <section aria-label="Key performance indicators">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>
    </section>
  );
}
