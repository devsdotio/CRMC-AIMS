"use client";

import { useState } from "react";
import { Tag, Calendar, ChevronDown, ChevronUp, AlertTriangle, History, Wrench, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryStyle } from "@/constants/categories";
import { OverdueBadge } from "@/components/ui/overdue-badge";
import {
  getActionStyle,
  getActionIcon,
  formatDateTime,
  formatRelativeTime,
  parseAuditNote,
} from "@/components/audit-logs/audit-log-utils";
import type { PortalBorrowLogRecord } from "./types";
import { useBorrowLogQuery } from "@/features/borrow-log/client/use-borrow-log";

function ConditionBadge({ condition }: { condition?: string }) {
  if (!condition) return null;
  const map: Record<string, { label: string; className: string }> = {
    good: {
      label: "Good Condition",
      className: "bg-status-active-bg/20 text-status-active-text border-status-active-bg/30",
    },
    damaged: {
      label: "Damaged",
      className: "bg-status-outofservice-bg/10 text-status-outofservice-bg dark:text-status-outofservice-text border-status-outofservice-bg/30",
    },
    needs_repair: {
      label: "Needs Repair",
      className: "bg-status-repair-bg/20 text-status-repair-text border-status-repair-bg/30",
    },
  };
  const meta = map[condition] ?? map.good;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap",
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 animate-pulse rounded bg-border" />
        <div className="h-3 w-32 animate-pulse rounded bg-border" />
      </div>
      <div className="h-6 w-24 animate-pulse rounded-full bg-border" />
    </div>
  );
}

export function BorrowHistoryTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: records = [], isLoading: loading } = useBorrowLogQuery();

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div>
      <div className="rounded-xl border border-border overflow-hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-bg-subtle flex items-center justify-center mb-4">
              <History className="h-5 w-5 text-text-secondary" aria-hidden />
            </div>
            <h3 className="text-sm font-semibold text-text">No borrow history yet</h3>
            <p className="text-xs text-text-secondary mt-1 max-w-xs">
              Your completed and active borrowings will appear here once you
              start borrowing items.
            </p>
          </div>
        ) : (
          records.map((record) => {
            const categoryMeta = getCategoryStyle(record.category);
            const isExpanded = expandedId === record.id;
            const isOverdue = record.status === "overdue";
            const hasDamageNote =
              record.conditionOnReturn === "damaged" ||
              record.conditionOnReturn === "needs_repair";

            return (
              <div
                key={record.id}
                className={cn(
                  "border-b border-border last:border-b-0 transition-colors border-l-4",
                  isOverdue
                    ? "border-l-status-outofservice-bg bg-status-outofservice-bg/5"
                    : record.status === "active"
                    ? "border-l-status-active-bg/60 bg-card hover:bg-bg-subtle/60"
                    : record.conditionOnReturn === "needs_repair"
                    ? "border-l-status-repair-bg/60 bg-card hover:bg-bg-subtle/60"
                    : record.conditionOnReturn === "damaged"
                    ? "border-l-status-outofservice-bg/60 bg-card hover:bg-bg-subtle/60"
                    : "border-l-transparent bg-card hover:bg-bg-subtle/60",
                  "pl-0"
                )}
              >
                {/* Main row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(record.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`history-detail-${record.id}`}
                  className={cn(
                    "w-full flex flex-col sm:flex-row sm:items-center gap-2.5 p-4 md:px-5 text-left cursor-pointer",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
                  )}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Code + Category */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-text-secondary">
                        {record.logCode}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border",
                          categoryMeta.bg,
                          categoryMeta.text,
                          "border-transparent"
                        )}
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {categoryMeta.label}
                      </span>
                      {isOverdue && (
                        <span className="sr-only">Overdue item</span>
                      )}
                    </div>

                    {/* Asset name */}
                    <p className="text-sm font-semibold text-text truncate">
                      {record.assetName}
                      {isOverdue && (
                        <AlertTriangle
                          className="inline ml-1.5 h-3.5 w-3.5 text-status-outofservice-bg"
                          aria-hidden
                        />
                      )}
                    </p>

                    {/* Dates row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Borrowed:{" "}
                        <span className="font-medium text-text">
                          {new Date(record.releasedAt).toLocaleDateString(
                            "en-PH",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        Due:{" "}
                        <span
                          className={cn(
                            "font-medium",
                            isOverdue ? "text-status-outofservice-bg font-bold" : "text-text"
                          )}
                        >
                          {record.dueDate}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Right column: status + expand toggle */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isOverdue && record.daysOverdue ? (
                      <OverdueBadge daysOverdue={record.daysOverdue} />
                    ) : record.status === "active" ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-status-active-bg/20 text-status-active-text border border-status-active-bg/30">
                        Active
                      </span>
                    ) : (
                      <ConditionBadge condition={record.conditionOnReturn} />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-text-secondary" aria-hidden />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-secondary" aria-hidden />
                    )}
                  </div>
                </button>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div
                    id={`history-detail-${record.id}`}
                    className="px-4 md:px-5 pb-4 space-y-4 border-t border-border bg-bg-subtle/30"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-card border border-border">
                        <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-0.5">Asset Code</p>
                        <p className="font-mono font-bold text-text">{record.assetCode}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-card border border-border">
                        <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-0.5">Released By</p>
                        <p className="font-medium text-text">{record.releasedBy}</p>
                      </div>
                      {record.returnedAt && (
                        <div className="p-2.5 rounded-lg bg-card border border-border">
                          <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-0.5">Returned On</p>
                          <p className="font-medium text-text">
                            {new Date(record.returnedAt).toLocaleDateString(
                              "en-PH",
                              { month: "short", day: "numeric", year: "numeric" }
                            )}
                          </p>
                        </div>
                      )}
                      {record.receivedBy && (
                        <div className="p-2.5 rounded-lg bg-card border border-border">
                          <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold mb-0.5">Received By</p>
                          <p className="font-medium text-text">{record.receivedBy}</p>
                        </div>
                      )}
                    </div>

                    {/* Condition notes */}
                    {record.conditionNotes && (
                      <div
                        className={cn(
                          "flex items-start gap-2 rounded-xl p-3 text-xs shadow-xs",
                          hasDamageNote
                            ? "bg-status-repair-bg/10 border border-status-repair-bg/30"
                            : "bg-status-active-bg/10 border border-status-active-bg/30"
                        )}
                      >
                        {hasDamageNote ? (
                          <Wrench
                            className="h-4 w-4 shrink-0 text-status-repair-bg mt-0.5"
                            aria-label="Damage note"
                          />
                        ) : null}
                        <div>
                          <p className="font-bold text-text mb-0.5">Condition Remarks</p>
                          <p className="text-text-secondary leading-relaxed">{record.conditionNotes}</p>
                        </div>
                      </div>
                    )}

                    {/* Accountability Audit History Timeline (Replicated Admin UI) */}
                    <div className="space-y-2.5 pt-1">
                      <p className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                        <History className="h-3.5 w-3.5 text-accent" />
                        Accountability Audit Trail ({record.history.length})
                      </p>

                      <div className="p-4 rounded-xl border border-border bg-bg shadow-xs">
                        <ol className="relative border-l-2 border-border/60 ml-3 space-y-6">
                          {record.history.map((entry, idx) => {
                            const style = getActionStyle(entry.action);
                            const icon = getActionIcon(entry.action);
                            const { picker, description } = parseAuditNote(entry.action, entry.notes);
                            const timeStr = entry.timestamp instanceof Date ? entry.timestamp.toISOString() : String(entry.timestamp || "");

                            return (
                              <li key={entry.id || idx} className="pl-6 relative">
                                {/* Timeline Circular Node */}
                                <span
                                  className={cn(
                                    "absolute -left-3.25 top-1.5 h-6 w-6 rounded-full border-2 flex items-center justify-center bg-bg shadow-xs z-10",
                                    style.bg,
                                    (style as Record<string, string>).iconText || style.text
                                  )}
                                >
                                  {icon}
                                </span>

                                <div className="flex flex-col gap-0.5 pt-1.5">
                                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                                    <span className={cn("font-bold capitalize text-xs", style.text)}>
                                      {style.label}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-right">
                                      <time className="text-[11px] text-text-secondary font-medium">
                                        {formatDateTime(timeStr)}
                                      </time>
                                      <span className="text-[10px] text-text-secondary/80">
                                        ({formatRelativeTime(timeStr)})
                                      </span>
                                    </div>
                                  </div>

                                  <p className="text-xs text-text-secondary font-medium">
                                    By <span className="font-semibold text-text">{entry.actorName}</span>
                                  </p>
                                </div>

                                {/* Chips */}
                                {(picker || description) && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {picker && (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-bg-subtle text-text-secondary border border-border shadow-xs">
                                        <User className="h-3 w-3" />
                                        {entry.action === "returned" ? "Returned by: " : "Picked up by: "} {picker}
                                      </span>
                                    )}
                                    {description && (
                                      <span
                                        className={cn(
                                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border shadow-xs max-w-full",
                                          style.bg,
                                          style.text
                                        )}
                                      >
                                        <FileText className="h-3 w-3 shrink-0" />
                                        <span className="truncate whitespace-normal leading-tight">{description}</span>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
