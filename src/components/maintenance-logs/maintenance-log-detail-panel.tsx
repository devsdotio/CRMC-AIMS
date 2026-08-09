"use client";
 
import { getCategoryStyle } from "@/constants/categories";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { X, CheckCircle2,   Tag,   ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MaintenanceLogRecord } from "@/types/maintenance-logs";

import { ConditionTag } from "./condition-tag";

export interface MaintenanceLogDetailPanelProps {
  record: MaintenanceLogRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (record: MaintenanceLogRecord) => void;
}

export function MaintenanceLogDetailPanel({
  record,
  isOpen,
  onClose,
  onResolve,
}: MaintenanceLogDetailPanelProps) {
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

  if (!isOpen || !record) return null;

  const categoryMeta = getCategoryStyle(record.category);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer Container */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mnt-detail-heading"
        className={cn(
          "relative flex flex-col w-full max-w-lg h-full bg-bg border-l border-border shadow-2xl z-10 overflow-hidden",
          "animate-in slide-in-from-right duration-250 ease-in-out"
        )}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-subtle/50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-text bg-bg px-2 py-0.5 rounded border border-border">
                {record.logCode}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  categoryMeta.bg,
                  categoryMeta.text
                )}
              >
                <Tag className="h-2.5 w-2.5 mr-1" />
                {categoryMeta.label}
              </span>
            </div>
            <h2 id="mnt-detail-heading" className="text-base font-bold text-text mt-0.5">
              Condition & Maintenance Entry Record
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close maintenance detail panel"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-border transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status & Condition Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-bg-subtle">
            <span className="text-xs font-semibold text-text-secondary">Logged Condition</span>
            <ConditionTag condition={record.isResolved ? "resolved" : record.condition} />
          </div>

          {/* Asset Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Asset Record
            </h3>
            <div className="p-4 rounded-lg border border-border bg-bg space-y-1.5 text-xs">
              <p className="text-sm font-bold text-text">{record.assetName}</p>
              <div className="flex items-center gap-2 text-text-secondary pt-1 border-t border-border">
                <span>Asset Code: <strong className="font-mono text-text">{record.assetCode}</strong></span>
                <span>·</span>
                <span>Logged: <strong>{record.dateLogged}</strong></span>
              </div>
            </div>
          </div>

          {/* Logging Context & Cross Reference Link */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Logging Origin & Context
            </h3>
            <div className="p-4 rounded-lg border border-border bg-bg space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Entry Source:</span>
                <span className="font-semibold text-text">
                  {record.source === "return_checkout" ? "Automated via Borrow Return Check-In" : "Manual Custodian Flag"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Logged By:</span>
                <span className="font-bold text-text">{record.loggedBy}</span>
              </div>

              {record.relatedBorrowLogCode && (
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-text-secondary">Related Checkout Log:</span>
                  <Link
                    href="/borrow-log"
                    className="inline-flex items-center gap-1 font-mono font-bold text-accent hover:underline"
                  >
                    {record.relatedBorrowLogCode}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Issue Description Notes */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Issue Description / Flag Notes
            </h3>
            <div className="p-3.5 rounded-lg border border-border bg-bg text-xs text-text leading-relaxed">
              {record.notes}
            </div>
          </div>

          {/* Resolution Audit (If resolved) */}
          {record.isResolved && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-status-active-text flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Maintenance Resolution Audit
              </h3>
              <div className="p-4 rounded-lg border border-status-active-bg/30 bg-status-active-bg/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Date Resolved:</span>
                  <span className="font-bold text-text">{record.resolutionDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Resolved By Tech:</span>
                  <span className="font-bold text-text">{record.resolvedBy}</span>
                </div>
                {record.resolutionNotes && (
                  <div className="pt-2 border-t border-status-active-bg/20 text-text leading-relaxed">
                    <span className="font-semibold block mb-0.5">Resolution Notes:</span>
                    {record.resolutionNotes}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer (Only if unresolved) */}
        {!record.isResolved && (
          <div className="p-4 border-t border-border bg-bg-subtle flex items-center justify-end shrink-0">
            <button
              type="button"
              onClick={() => onResolve(record)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
              Resolve Maintenance Flag
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
