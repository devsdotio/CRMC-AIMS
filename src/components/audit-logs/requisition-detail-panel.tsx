"use client";

import React, { useEffect, useRef } from "react";
import {
  X,
  User,
  Building2,
  Mail,
  Phone,
  FileText,
  History,
  CheckCircle,
  Clock,
  PackageCheck,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryStyle } from "@/constants/categories";
import {
  getActionStyle,
  getActionIcon,
  formatDateTime,
  formatRelativeTime,
  parseAuditNote,
} from "./audit-log-utils";
import type { ConsumableRequestDTO } from "@/server/modules/consumable-requests/consumable-request.types";

interface RequisitionDetailPanelProps {
  request: ConsumableRequestDTO | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RequisitionDetailPanel({
  request,
  isOpen,
  onClose,
}: RequisitionDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !request) return null;

  const style = getActionStyle(request.status);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="req-detail-heading"
        className={cn(
          "relative flex flex-col w-full max-w-lg h-full bg-bg border-l border-border shadow-2xl z-10 overflow-hidden",
          "animate-in slide-in-from-right duration-250 ease-in-out"
        )}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-subtle/50 shrink-0">
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 id="req-detail-heading" className="font-mono text-lg font-bold tracking-tight text-text">
                {request.requestCode}
              </h2>
              <span
                className={cn(
                  "inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold border capitalize",
                  style.bg,
                  style.text
                )}
              >
                {style.label}
              </span>
            </div>
            <p className="text-xs text-text-secondary font-medium mt-0.5 truncate">
              Requisition Slip • Requested by <strong className="text-text font-semibold">{request.requesterName}</strong>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail panel"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-border transition-colors cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Rejection / Cancellation Callout */}
          {request.rejectionReason && (
            <div className="p-3.5 rounded-lg border border-destructive bg-destructive/10 text-destructive text-xs">
              <span className="font-bold block mb-1">Rejection Reason:</span>
              {request.rejectionReason}
            </div>
          )}

          {/* Requested Items Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Requisition Items
              </h3>
              <span className="text-[11px] font-semibold text-text-secondary bg-bg-subtle px-2 py-0.5 rounded-full border border-border">
                {request.lines.length} {request.lines.length === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="rounded-lg border border-border bg-bg overflow-hidden divide-y divide-border">
              {request.lines.map((line, idx) => {
                const catStyle = getCategoryStyle(line.category);
                return (
                  <div
                    key={line.id || idx}
                    className={cn(
                      "px-3.5 py-2.5 flex items-center justify-between gap-3",
                      idx % 2 === 1 && "bg-bg-subtle/50"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text truncate">
                        {line.itemName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-px text-[9px] font-bold uppercase",
                            catStyle.bg,
                            catStyle.text
                          )}
                        >
                          {catStyle.label}
                        </span>
                        <span className="font-mono text-[10px] text-text-secondary">
                          {line.itemCode}
                        </span>
                      </div>
                    </div>

                    <span className="flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-bg-subtle border border-border text-[11px] font-bold text-text shrink-0">
                      &times;{line.quantityRequested} {line.unit}
                    </span>
                  </div>
                );
              })}
            </div>
            {Number(request.totalCost) > 0 && (
              <div className="flex justify-end pt-1 text-xs">
                <span className="text-text-secondary mr-2">Total Issue Valuation:</span>
                <strong className="text-text font-mono">
                  ₱{Number(request.totalCost).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </strong>
              </div>
            )}
          </div>

          {/* Requester Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Requester Information
            </h3>
            <div className="p-4 rounded-lg border border-border bg-bg space-y-2.5 text-xs">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-text-secondary shrink-0" />
                <span className="font-bold text-text">{request.requesterName}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Building2 className="h-4 w-4 shrink-0" />
                <span>{request.department} Department</span>
              </div>
              {request.requesterEmail && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>{request.requesterEmail}</span>
                </div>
              )}
              {request.requesterPhone && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{request.requesterPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Purpose & Notes */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Purpose & Notes
            </h3>
            <div className="p-4 rounded-lg border border-primary/25 bg-primary/5 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-text font-medium leading-relaxed">{request.purpose}</p>
              </div>
              {request.notes && (
                <div className="mt-2 pt-2 border-t border-primary/15 text-text-secondary">
                  <span className="font-semibold text-text">Additional Note:</span> {request.notes}
                </div>
              )}
            </div>
          </div>

          {/* Fulfillment Details */}
          {request.receivedBy && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Fulfillment Details
              </h3>
              <div className="p-4 rounded-lg border border-border bg-bg space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-text-secondary shrink-0" />
                  <span className="text-text-secondary">Received by:</span>
                  <span className="font-bold text-text">{request.receivedBy}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action History / Lifecycle Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              Action History
            </h3>
            <div className="p-4 rounded-lg border border-border bg-bg">
              <ol className="relative border-l-2 border-border/60 ml-3 space-y-6">
                {[...request.history].reverse().map((h) => {
                  const hStyle = getActionStyle(h.action);
                  const icon = getActionIcon(h.action);
                  const { picker, description } = parseAuditNote(h.action, h.note);
                  const isRejected = h.action === "rejected" || h.action === "cancelled";

                  return (
                    <li key={h.id} className="pl-6 relative">
                      <span
                        className={cn(
                          "absolute -left-3.25 top-1.5 h-6 w-6 rounded-full border-2 flex items-center justify-center bg-bg shadow-sm z-10",
                          hStyle.bg,
                          hStyle.iconText || hStyle.text
                        )}
                      >
                        {icon}
                      </span>
                      <div className="flex flex-col gap-0.5 pt-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className={cn("font-bold capitalize", hStyle.text)}>
                            {hStyle.label}
                          </span>
                          <time className="text-[11px] text-text-secondary font-medium">
                            {formatDateTime(h.timestamp)}
                          </time>
                        </div>
                        <p className="text-xs text-text-secondary font-medium">By {h.actor}</p>
                      </div>

                      {(picker || description) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {picker && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-bg-subtle text-text-secondary border border-border shadow-xs">
                              <User className="h-3 w-3" />
                              Received by: {picker}
                            </span>
                          )}
                          {description && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border shadow-xs max-w-full",
                                hStyle.bg,
                                isRejected ? "text-white" : "text-text"
                              )}
                            >
                              <FileText className="h-3 w-3 shrink-0" />
                              <span className="truncate whitespace-normal leading-tight">
                                {description}
                              </span>
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

        {/* Action Footer */}
        <div className="p-4 border-t border-border bg-bg-subtle flex items-center justify-between shrink-0">
          <span className="text-xs text-text-secondary">Immutable Requisition Audit Log</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg border border-border bg-bg text-text hover:bg-bg-subtle transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}
