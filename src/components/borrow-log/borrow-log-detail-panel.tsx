"use client";

import { useEffect, useRef } from "react";
import { X, RotateCcw, User, Mail, Phone, Building2, Tag, Calendar, History, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BorrowLogRecord, AssetCategory } from "./types";
import { OverdueBadge } from "./overdue-badge";

export interface BorrowLogDetailPanelProps {
  record: BorrowLogRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onProcessReturn: (record: BorrowLogRecord) => void;
}

const CATEGORY_STYLES: Record<AssetCategory, { bg: string; text: string; label: string }> = {
  transport: { bg: "bg-category-transport-bg", text: "text-category-transport-text", label: "Transport" },
  computing: { bg: "bg-category-computing-bg", text: "text-category-computing-text", label: "Computing" },
  av:        { bg: "bg-category-av-bg",        text: "text-category-av-text",        label: "AV Equipment" },
  furniture: { bg: "bg-category-furniture-bg", text: "text-category-furniture-text", label: "Furniture" },
};

export function BorrowLogDetailPanel({
  record,
  isOpen,
  onClose,
  onProcessReturn,
}: BorrowLogDetailPanelProps) {
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

  const categoryMeta = CATEGORY_STYLES[record.category];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer Container */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-detail-heading"
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
            <h2 id="log-detail-heading" className="text-base font-bold text-text mt-0.5">
              Borrow Audit Record
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close log detail panel"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-border transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-bg-subtle">
            <span className="text-xs font-semibold text-text-secondary">Checkout Status</span>
            {record.status === "overdue" && record.daysOverdue ? (
              <OverdueBadge daysOverdue={record.daysOverdue} />
            ) : record.status === "active" ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-status-active-bg/20 text-status-active-text">
                Active Checkout
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-status-retired-bg/20 text-status-retired-text">
                Returned ({record.conditionOnReturn === "good" ? "Good" : record.conditionOnReturn === "needs_repair" ? "Needs Repair" : "Damaged"})
              </span>
            )}
          </div>

          {/* Asset Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Asset Information
            </h3>
            <div className="p-4 rounded-lg border border-border bg-bg space-y-1.5 text-xs">
              <p className="text-sm font-bold text-text">{record.assetName}</p>
              <div className="flex items-center gap-2 text-text-secondary pt-1 border-t border-border">
                <span>Asset Tag: <strong className="font-mono text-text">{record.assetCode}</strong></span>
                <span>·</span>
                <span>Ref Request: <strong className="font-mono text-text">{record.requestCode}</strong></span>
              </div>
            </div>
          </div>

          {/* Borrower Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Borrower Information
            </h3>
            <div className="p-4 rounded-lg border border-border bg-bg space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-text">
                <User className="h-4 w-4 text-text-secondary shrink-0" />
                <span>{record.borrowerName}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Building2 className="h-4 w-4 shrink-0" />
                <span>{record.department} Department</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Mail className="h-4 w-4 shrink-0" />
                <a href={`mailto:${record.borrowerEmail}`} className="hover:underline text-accent">
                  {record.borrowerEmail}
                </a>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{record.borrowerPhone}</span>
              </div>
            </div>
          </div>

          {/* Schedule & Custodian Sign-off */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Schedule & Sign-Off
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-border bg-bg">
                <span className="text-text-secondary block mb-1">Released Date</span>
                <span className="font-semibold text-text">{new Date(record.releasedAt).toLocaleDateString()}</span>
                <span className="text-[11px] text-text-secondary/70 block mt-0.5">By {record.releasedBy}</span>
              </div>

              <div className="p-3 rounded-lg border border-border bg-bg">
                <span className="text-text-secondary block mb-1">Due Date</span>
                <span className="font-semibold text-text">{record.dueDate}</span>
                {record.returnedAt && (
                  <span className="text-[11px] text-status-active-text block mt-0.5">
                    Returned: {new Date(record.returnedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Condition Notes (if returned) */}
          {record.conditionNotes && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Return Inspection Notes
              </h3>
              <div className="p-3 rounded-lg border border-border bg-bg-subtle text-xs text-text leading-relaxed">
                {record.conditionNotes}
              </div>
            </div>
          )}

          {/* Audit History Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              Transaction Audit Trail
            </h3>
            <div className="p-4 rounded-lg border border-border bg-bg">
              <ol className="relative border-l border-border ml-2 space-y-4">
                {record.history.map((h) => (
                  <li key={h.id} className="ml-4">
                    <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-bg bg-accent" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-text capitalize">{h.action.replace("_", " ")}</span>
                      <time className="text-[11px] text-text-secondary">{h.timestamp}</time>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">Actor: {h.actor}</p>
                    {h.notes && (
                      <p className="text-xs text-text bg-bg-subtle p-2 rounded mt-1 border border-border">
                        {h.notes}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Footer Actions (Process Return for active/overdue items) */}
        {(record.status === "active" || record.status === "overdue") && (
          <div className="p-4 border-t border-border bg-bg-subtle flex items-center justify-end shrink-0">
            <button
              type="button"
              onClick={() => onProcessReturn(record)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <RotateCcw className="h-4 w-4" />
              Process Check-In Return
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
