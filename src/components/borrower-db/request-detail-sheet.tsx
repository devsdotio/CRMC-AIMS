"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
  Tag,
  User,
  Building2,
  Mail,
  FileText,
  History,
  Copy,
  Check,
  Send,
  RotateCcw,
  X,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategoryStyleMap } from "@/features/categories/client/use-categories";
import { formatItemDescription, formatAssetCodeDisplay, formatQuantityWithUnit } from "@/lib/sanitize-display";
import {
  getActionStyle,
  getActionIcon,
  formatDateTime,
  formatRelativeTime,
  parseAuditNote,
  AuditNoteDisplay,
} from "@/components/audit-logs/audit-log-utils";
import type { PortalBorrowRequest } from "./types";

export interface RequestDetailSheetProps {
  request: PortalBorrowRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel?: (request: PortalBorrowRequest) => void;
  onEdit?: (request: PortalBorrowRequest) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; icon: React.ElementType; color: string }
> = {
  pending: {
    label: "Pending Review",
    badge: "bg-status-repair-bg/20 text-status-repair-text border-status-repair-bg/40",
    icon: Hourglass,
    color: "text-status-repair-text",
  },
  approved: {
    label: "Approved",
    badge: "bg-status-active-bg/20 text-status-active-text border-status-active-bg/40",
    icon: CheckCircle2,
    color: "text-status-active-text",
  },
  rejected: {
    label: "Rejected",
    badge: "bg-destructive text-white border-destructive",
    icon: XCircle,
    color: "text-destructive",
  },
  released: {
    label: "Released / Active",
    badge: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40",
    icon: Send,
    color: "text-blue-600",
  },
  returned: {
    label: "Completed",
    badge: "bg-bg-subtle text-text border-border",
    icon: RotateCcw,
    color: "text-text",
  },
  cancelled: {
    label: "Cancelled",
    badge: "bg-bg-subtle text-text-secondary border-border",
    icon: X,
    color: "text-text-secondary",
  },
};

export function RequestDetailSheet({
  request,
  open,
  onOpenChange,
  onCancel,
  onEdit,
}: RequestDetailSheetProps) {
  const { getCategoryStyle } = useCategoryStyleMap();
  const [copied, setCopied] = useState(false);

  // Close on escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setCopied(false);
    }
  }, [open, request?.id]);

  if (!open || !request) return null;

  const statusConfig = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const hasAsset = request.items?.some((i) => i.itemType === "asset");
  const isConsumable = request.items?.every((i) => i.itemType === "consumable");

  const handleCopyCode = () => {
    if (request.requestCode) {
      navigator.clipboard.writeText(request.requestCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Synthesize logs if history array is empty so the accountability timeline is always complete
  const rawLogs =
    request.history && request.history.length > 0
      ? request.history
      : [
          {
            id: "sub-1",
            action: "submitted" as const,
            actor: request.requesterName || "Requester",
            timestamp: request.requestedAt || new Date().toISOString(),
            note: request.purpose || "Request submitted for review",
          },
          ...(request.status === "approved" || request.status === "released" || request.status === "returned"
            ? [
                {
                  id: "app-1",
                  action: "approved" as const,
                  actor: "Property Custodian",
                  timestamp: request.requestedAt,
                  note: "Request approved and queued for issuance",
                },
              ]
            : []),
          ...(request.status === "rejected"
            ? [
                {
                  id: "rej-1",
                  action: "rejected" as const,
                  actor: "Property Custodian",
                  timestamp: request.requestedAt,
                  note: request.rejectionReason || "Request was rejected",
                },
              ]
            : []),
          ...(request.status === "released" || request.status === "returned"
            ? [
                {
                  id: "rel-1",
                  action: "released" as const,
                  actor: "Property Custodian",
                  timestamp: request.requestedDateFrom || request.requestedAt,
                  note: request.pickedUpBy
                    ? `Released to: ${request.pickedUpBy}`
                    : isConsumable
                    ? "Supplies issued and deducted from stock"
                    : "Items released to requester",
                },
              ]
            : []),
          ...(request.status === "returned"
            ? [
                {
                  id: "ret-1",
                  action: "returned" as const,
                  actor: "Property Custodian",
                  timestamp: request.requestedDateTo || request.expectedReturnDate,
                  note: "Items returned and checked back into inventory",
                },
              ]
            : []),
        ];

  // Present newest action first, matching the admin accountability timeline view
  const logs = [...rawLogs].reverse();

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-code-highlight"
    >
      {/* Backdrop (Click to close) */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="relative z-10 w-full max-w-xl h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250">
        {/* Highlighted Header - Code & Badge as Heroes */}
        <div className="p-5 border-b border-border bg-card shrink-0 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Highlighted Request Code */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 border border-accent/25 shadow-xs">
                <span id="request-code-highlight" className="font-mono text-base font-extrabold text-accent tracking-wide">
                  {request.requestCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  aria-label="Copy request code"
                  className="p-1 rounded-md text-accent hover:bg-accent/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-status-active-text" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {copied && (
                <span className="text-[11px] font-bold text-status-active-text animate-in fade-in duration-150">
                  Copied!
                </span>
              )}
            </div>

            {/* Highlighted Status Badge & Edit Action */}
            <div className="flex items-center gap-2">
              {onEdit && request.status === "pending" && (
                <button
                  type="button"
                  onClick={() => onEdit(request)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-border bg-bg-subtle text-text hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-colors shadow-xs cursor-pointer"
                  title="Edit request details"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}

              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border shadow-xs tracking-wide",
                  statusConfig.badge
                )}
              >
                <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                {statusConfig.label}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-text-secondary pt-0.5">
            <span className="font-bold text-text">
              {isConsumable ? "Supplies Requisition" : "Borrow Request"}
            </span>
            <span>
              Submitted {new Date(request.requestedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Scrollable Sheet Body - All Sections Visible at a Glance */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status Notice Banner */}
          {request.status === "approved" && (
            <div className="rounded-xl border border-status-active-bg/30 bg-status-active-bg/10 p-3.5 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-status-active-text shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-status-active-text">
                  Request Approved
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Please proceed to the Property Custodian&apos;s Office with your staff ID to complete checkout and pickup.
                </p>
              </div>
            </div>
          )}

          {request.status === "rejected" && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-destructive">
                  Request Rejected
                </p>
                <p className="text-xs text-text leading-relaxed">
                  <span className="font-semibold">Reason: </span>
                  {request.rejectionReason || "No specific reason provided."}
                </p>
              </div>
            </div>
          )}

          {/* Requester Details */}
          <section aria-labelledby="requester-heading" className="space-y-2">
            <h3 id="requester-heading" className="text-[11px] font-bold uppercase tracking-wider text-text-secondary px-1">
              Requester Information
            </h3>
            <div className="rounded-xl border border-border bg-card p-3.5 grid grid-cols-2 gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-text-secondary shrink-0" />
                <div>
                  <p className="text-[10px] text-text-secondary uppercase tracking-wide">Name</p>
                  <p className="font-bold text-text mt-0.5">{request.requesterName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-text-secondary shrink-0" />
                <div>
                  <p className="text-[10px] text-text-secondary uppercase tracking-wide">Department</p>
                  <p className="font-bold text-text mt-0.5">{request.department}</p>
                </div>
              </div>

              <div className="col-span-2 flex items-center gap-2 pt-1 border-t border-border/50">
                <Mail className="h-4 w-4 text-text-secondary shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-text-secondary uppercase tracking-wide">Email</p>
                  <p className="font-medium text-text mt-0.5 truncate">{request.requesterEmail}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Requested Items */}
          <section aria-labelledby="items-heading" className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 id="items-heading" className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Requested Items ({request.items?.length || 0})
              </h3>
              <span className="text-[10px] text-text-secondary font-mono">
                {request.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 1} Total Units
              </span>
            </div>
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden shadow-xs">
              {request.items?.map((item, idx) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const catMeta = getCategoryStyle(item.category as any);
                const desc = formatItemDescription(item.itemDescription, catMeta.label, item.itemType);
                const displayCode = formatAssetCodeDisplay(item.assetCode);
                return (
                  <div key={idx} className="p-3.5 flex items-center gap-3.5 bg-card hover:bg-bg-subtle/40 transition-colors">
                    <div className={cn("h-9 w-9 shrink-0 rounded-lg flex items-center justify-center border", catMeta.bg, "border-transparent")}>
                      <Tag className={cn("h-4 w-4", catMeta.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text truncate">{desc}</p>
                      <p className="text-xs text-text-secondary font-mono mt-0.5">
                        {displayCode ? `${displayCode} · ` : ""}<span className="capitalize">{catMeta.label}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0 bg-bg-subtle px-2.5 py-1 rounded-md border border-border">
                      <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Qty</p>
                      <p className="font-bold text-xs text-text">
                        {formatQuantityWithUnit(item.quantity, item.unit, item.itemType)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Schedule & Timing */}
          <section aria-labelledby="schedule-heading" className="space-y-2">
            <h3 id="schedule-heading" className="text-[11px] font-bold uppercase tracking-wider text-text-secondary px-1">
              Schedule & Dates
            </h3>
            <div className="rounded-xl border border-border bg-card p-3.5 grid grid-cols-2 gap-3 text-xs shadow-xs">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                  {!hasAsset ? "Date Needed" : "Checkout Date"}
                </p>
                <div className="flex items-center gap-1.5 font-bold text-text">
                  <Calendar className="h-3.5 w-3.5 text-accent" />
                  <span>{request.requestedDateFrom || request.requestedAt?.split("T")[0]}</span>
                </div>
              </div>

              {hasAsset && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                    Expected Return
                  </p>
                  <div className="flex items-center gap-1.5 font-bold text-status-outofservice-bg">
                    <Clock className="h-3.5 w-3.5 text-status-outofservice-bg" />
                    <span>{request.requestedDateTo || request.expectedReturnDate}</span>
                  </div>
                </div>
              )}

              <div className="col-span-2 pt-2 border-t border-border/50 flex items-center justify-between text-text-secondary">
                <span className="text-[11px]">Submitted On</span>
                <span className="font-medium text-text">
                  {new Date(request.requestedAt).toLocaleString("en-PH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>
          </section>

          {/* Purpose */}
          <section aria-labelledby="purpose-heading" className="space-y-2">
            <h3 id="purpose-heading" className="text-[11px] font-bold uppercase tracking-wider text-text-secondary px-1">
              Purpose / Justification
            </h3>
            <div className="rounded-xl border border-accent/20 bg-accent/5 p-3.5 shadow-xs">
              <p className="text-xs text-text leading-relaxed">{request.purpose}</p>
            </div>
          </section>

          {/* Notes if provided */}
          {request.notes && (
            <section aria-labelledby="notes-heading" className="space-y-2">
              <h3 id="notes-heading" className="text-[11px] font-bold uppercase tracking-wider text-text-secondary px-1">
                Additional Notes
              </h3>
              <div className="rounded-xl border border-border bg-bg-subtle/50 p-3.5 shadow-xs">
                <p className="text-xs text-text leading-relaxed">{request.notes}</p>
              </div>
            </section>
          )}

          {/* ── Accountability & Action History (Admin Replicated UI) ── */}
          <section aria-labelledby="logs-heading" className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 id="logs-heading" className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-accent" />
                Accountability & Action History
              </h3>
              <span className="text-[10px] text-text-secondary font-mono">
                {logs.length} Event{logs.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-border bg-bg shadow-xs">
              <ol className="relative border-l-2 border-border/60 ml-3 space-y-6">
                {logs.map((h, index) => {
                  const style = getActionStyle(h.action);
                  const icon = getActionIcon(h.action);
                  const { picker, description } = parseAuditNote(h.action, h.note);
                  const isRejected =
                    h.action.toLowerCase() === "rejected" ||
                    h.action.toLowerCase() === "cancelled";

                  return (
                    <li key={h.id || index} className="pl-6 relative">
                      {/* Timeline Circular Node - Replicating admin action node */}
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
                              {formatDateTime(h.timestamp)}
                            </time>
                            <span className="text-[10px] text-text-secondary/80">
                              ({formatRelativeTime(h.timestamp)})
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-text-secondary font-medium">
                          By <span className="font-semibold text-text">{h.actor}</span>
                        </p>
                      </div>

                      {/* Action Chips: Picked up / Returned by & Notes */}
                      <AuditNoteDisplay action={h.action} note={h.note} className="mt-2" />
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>
        </div>

        {/* Footer Actions (Only for pending cancellation) */}
        {request.status === "pending" && onCancel && (
          <div className="p-4 border-t border-border bg-card shrink-0 flex items-center justify-between gap-3">
            <p className="text-xs text-text-secondary">
              Need to withdraw this pending request?
            </p>
            <button
              type="button"
              onClick={() => onCancel(request)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
            >
              <X className="h-3.5 w-3.5" />
              Cancel Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
