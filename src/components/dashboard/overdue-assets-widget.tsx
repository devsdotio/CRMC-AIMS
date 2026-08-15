"use client";

import Link from "next/link";
import { BellRing, ChevronRight, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OverdueAsset {
  id: string;
  assetName: string;
  assetCode: string;
  borrowerName: string;
  department: string;
  daysOverdue: number;
  dueSince: string;
}

export interface OverdueAssetsWidgetProps {
  assets: OverdueAsset[];
  loading?: boolean;
  onSendReminder?: (id: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-border", className)} aria-hidden="true" />;
}

function overdueColor(days: number): { bg: string; text: string } {
  if (days >= 4) {
    return {
      bg:   "bg-status-outofservice-bg/10",
      text: "text-status-outofservice-text bg-status-outofservice-bg",
    };
  }
  return {
    bg:   "bg-status-repair-bg/10",
    text: "text-status-repair-text bg-status-repair-bg",
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OverdueAssetsWidget({
  assets,
  loading = false,
  onSendReminder,
}: OverdueAssetsWidgetProps) {
  const sorted = [...assets].sort((a, b) => b.daysOverdue - a.daysOverdue);

  return (
    <section
      className="flex flex-col rounded-lg border border-border bg-bg overflow-hidden"
      aria-labelledby="overdue-assets-heading"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 id="overdue-assets-heading" className="text-sm font-semibold text-text">
            Overdue Assets
          </h2>
          {!loading && (
            <p className="text-xs text-text-secondary mt-0.5">
              {assets.length === 0
                ? "Nothing overdue"
                : `${assets.length} item${assets.length !== 1 ? "s" : ""} past due date`}
            </p>
          )}
        </div>
        <Link
          href="/borrow-log?filter=overdue"
          className="flex items-center gap-0.5 text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Body */}
      {loading ? (
        <div className="px-5 py-1 divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-3.5">
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-md" />
            </div>
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 px-5 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-status-active-bg/15">
            <PackageCheck className="h-5 w-5 text-status-active-bg" strokeWidth={2} />
          </span>
          <div>
            <p className="text-sm font-medium text-text">No overdue items right now</p>
            <p className="text-xs text-text-secondary mt-0.5">
              All borrowed assets are within their return dates.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Overdue assets">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Asset</th>
                <th scope="col" className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Borrower</th>
                <th scope="col" className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-text-secondary hidden sm:table-cell">Dept.</th>
                <th scope="col" className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Days Late</th>
                <th scope="col" className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((asset) => {
                const { text } = overdueColor(asset.daysOverdue);
                return (
                  <tr key={asset.id} className="group hover:bg-bg-subtle transition-colors duration-100">
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-text block">{asset.assetName}</span>
                      <span className="text-xs text-text-secondary">{asset.assetCode}</span>
                    </td>
                    <td className="px-3 py-3.5 text-text">{asset.borrowerName}</td>
                    <td className="px-3 py-3.5 text-text-secondary hidden sm:table-cell">{asset.department}</td>
                    <td className="px-3 py-3.5 text-right">
                      <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", text)}>
                        {asset.daysOverdue}d
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {onSendReminder ? (
                        <button
                          type="button"
                          onClick={() => onSendReminder(asset.id)}
                          aria-label={`Send reminder for ${asset.assetName} to ${asset.borrowerName}`}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium",
                            "text-text-secondary transition-colors duration-150",
                            "hover:border-primary hover:text-text",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          )}
                        >
                          <BellRing className="h-3.5 w-3.5" />
                          Remind
                        </button>
                      ) : (
                        <Link
                          href="/borrow-log?filter=overdue"
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium",
                            "text-text-secondary transition-colors duration-150",
                            "hover:border-primary hover:text-text",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          )}
                        >
                          Open log
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
