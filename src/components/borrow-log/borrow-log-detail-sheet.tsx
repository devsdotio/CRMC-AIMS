"use client";

import { useState } from "react";
import {
  X,
  Copy,
  Check,
  Box,
  Calendar,
  Building2,
  User,
  Clock,
  Tag,
  FileText,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BorrowLogRecord } from "@/features/borrow-log/client";
import { useCategoryStyleMap } from "@/features/categories/client/use-categories";
import { OverdueBadge } from "@/components/ui/overdue-badge";
import { LoadingState } from "@/components/providers/loading-context";

interface BorrowLogDetailSheetProps {
  record: BorrowLogRecord | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onRecordReturn?: (record: BorrowLogRecord) => void;
  canOperate?: boolean;
}

export function BorrowLogDetailSheet({
  record,
  isOpen,
  isLoading = false,
  onClose,
  onRecordReturn,
  canOperate,
}: BorrowLogDetailSheetProps) {
  const { getCategoryStyle } = useCategoryStyleMap();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  if (isLoading || !record) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200">
        <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Loading custody record"
          className={cn(
            "relative flex flex-col w-full max-w-lg h-full bg-bg border-l border-border shadow-2xl z-10 overflow-hidden",
            "animate-in slide-in-from-right duration-250 ease-in-out"
          )}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-subtle/50 shrink-0">
            <div className="h-6 w-36 bg-border/60 rounded-md animate-pulse" />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-border transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <LoadingState
              variant="card"
              icon="layers"
              message="Loading custody log record..."
              subtitle="Retrieving checkout timestamp, borrower profile, and return status"
            />
          </div>
        </aside>
      </div>
    );
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(record.logCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categoryMeta = getCategoryStyle(rowCategoryOrDefault(record.category));
  const releasedDateStr = new Date(record.releasedAt).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Panel */}
      <div className="relative z-10 w-full max-w-lg h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border bg-bg-subtle/50 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                <Box className="h-3.5 w-3.5" />
                Asset Custody Log
              </span>
              <span
                className={cn(
                  "text-[11px] font-bold px-2 py-0.5 rounded-full border",
                  record.status === "overdue"
                    ? "bg-status-outofservice-bg/15 text-status-outofservice-text border-status-outofservice-bg/30"
                    : record.status === "active"
                      ? "bg-status-active-bg/15 text-status-active-text border-status-active-bg/30"
                      : "bg-bg-subtle text-text-secondary border-border"
                )}
              >
                {record.status === "overdue" ? (
                  <OverdueBadge daysOverdue={record.daysOverdue ?? 1} />
                ) : record.status === "returned" ? (
                  "Returned"
                ) : (
                  "Active Custody"
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer"
              aria-label="Close custody details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-black text-text tracking-wide">
                  {record.logCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1 rounded text-text-secondary hover:text-text hover:bg-bg transition-colors cursor-pointer"
                  title="Copy log code"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-status-active-text" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                {copied && (
                  <span className="text-[10px] font-bold text-status-active-text animate-in fade-in">
                    Copied!
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Released on {releasedDateStr}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Asset Info Card */}
          <div className="p-4 rounded-xl border border-border bg-bg space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-accent" />
              Asset Details
            </h4>
            <div className="space-y-1">
              <p className="text-base font-bold text-text">{record.assetName}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-text-secondary bg-bg-subtle px-2 py-0.5 rounded border border-border">
                  Code: {record.assetCode}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full border",
                    categoryMeta.bg,
                    categoryMeta.text
                  )}
                >
                  {categoryMeta.label}
                </span>
                <span className="text-xs text-text-secondary bg-bg-subtle px-2 py-0.5 rounded border border-border font-medium">
                  {record.custodyKind === "assignment" ? "Assignable Asset" : "Borrowable Asset"}
                </span>
              </div>
            </div>
          </div>

          {/* Accountable Holder / Recipient Card */}
          <div className="p-4 rounded-xl border border-border bg-bg space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-accent" />
              Borrower & Department Details
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-text-secondary text-[11px] block">Primary Borrower</span>
                <p className="font-bold text-text">{record.borrowerName}</p>
              </div>

              <div className="space-y-1">
                <span className="text-text-secondary text-[11px] block">Assigned Department</span>
                <p className="font-bold text-text flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-text-secondary" />
                  {record.department}
                </p>
              </div>

              {record.borrowerEmail && (
                <div className="space-y-1">
                  <span className="text-text-secondary text-[11px] block">Contact Email</span>
                  <p className="font-medium text-text flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-text-secondary" />
                    {record.borrowerEmail}
                  </p>
                </div>
              )}

              {record.borrowerPhone && (
                <div className="space-y-1">
                  <span className="text-text-secondary text-[11px] block">Phone / Mobile</span>
                  <p className="font-medium text-text flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-text-secondary" />
                    {record.borrowerPhone}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-text-secondary text-[11px] block">Released By (Custodian)</span>
                <p className="font-bold text-text">{record.releasedBy}</p>
              </div>

              {record.requestCode && (
                <div className="space-y-1">
                  <span className="text-text-secondary text-[11px] block">Originating Request</span>
                  <span className="font-mono font-bold text-text bg-bg-subtle px-2 py-0.5 rounded border border-border inline-block">
                    {record.requestCode}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline & Due Dates */}
          <div className="p-4 rounded-xl border border-border bg-bg space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-accent" />
              Custody Timeline
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-text-secondary text-[11px] block">Released At</span>
                <span className="font-semibold text-text">{releasedDateStr}</span>
              </div>
              <div>
                <span className="text-text-secondary text-[11px] block">Due Date</span>
                <span className="font-semibold text-text">
                  {record.dueDate
                    ? new Date(record.dueDate).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Open Custody"}
                </span>
              </div>
              {record.returnedAt && (
                <div>
                  <span className="text-text-secondary text-[11px] block">Returned At</span>
                  <span className="font-semibold text-status-active-text">
                    {new Date(record.returnedAt).toLocaleString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
              )}
              {record.conditionOnReturn && (
                <div>
                  <span className="text-text-secondary text-[11px] block">Return Condition</span>
                  <span className="font-bold capitalize text-text">{record.conditionOnReturn}</span>
                </div>
              )}
            </div>
          </div>

          {/* Condition Notes */}
          {record.conditionNotes && (
            <div className="p-4 rounded-xl border border-border bg-bg space-y-2 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-accent" />
                Return Inspection Notes
              </h4>
              <p className="text-text-secondary leading-relaxed bg-bg-subtle p-3 rounded-lg border border-border font-mono text-[11px]">
                {record.conditionNotes}
              </p>
            </div>
          )}
        </div>

        {/* Footer with Action */}
        <div className="p-4 border-t border-border bg-bg-subtle shrink-0 flex items-center justify-between gap-3">
          {canOperate && record.status !== "returned" && onRecordReturn ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRecordReturn(record);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Record Return</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-lg border border-border bg-bg hover:bg-bg-subtle transition-colors cursor-pointer text-text"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function rowCategoryOrDefault(cat?: string): string {
  if (cat === "electronics" || cat === "furniture" || cat === "machinery" || cat === "office" || cat === "medical" || cat === "vehicles" || cat === "tools") {
    return cat;
  }
  return "office";
}
