"use client";

import { User, Calendar, RotateCcw, Tag, Building2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BorrowLogRecord, AssetCategory } from "./types";
import { OverdueBadge } from "./overdue-badge";

export interface BorrowLogListItemProps {
  record: BorrowLogRecord;
  onSelect: (record: BorrowLogRecord) => void;
  onProcessReturn: (record: BorrowLogRecord) => void;
}

const CATEGORY_STYLES: Record<AssetCategory, { bg: string; text: string; label: string }> = {
  transport: { bg: "bg-category-transport-bg", text: "text-category-transport-text", label: "Transport" },
  computing: { bg: "bg-category-computing-bg", text: "text-category-computing-text", label: "Computing" },
  av:        { bg: "bg-category-av-bg",        text: "text-category-av-text",        label: "AV Equipment" },
  furniture: { bg: "bg-category-furniture-bg", text: "text-category-furniture-text", label: "Furniture" },
};

export function BorrowLogListItem({
  record,
  onSelect,
  onProcessReturn,
}: BorrowLogListItemProps) {
  const categoryMeta = CATEGORY_STYLES[record.category];

  return (
    <div
      onClick={() => onSelect(record)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(record);
        }
      }}
      className={cn(
        "group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:px-6 bg-bg border-b border-border transition-colors duration-150 cursor-pointer",
        "hover:bg-bg-subtle/80 focus:outline-none focus-visible:bg-bg-subtle focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
      )}
    >
      {/* Left Column: Transaction Code & Borrower/Asset Info */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {/* Row 1: LOG code & Category Tag */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono font-bold text-text-secondary">
            {record.logCode}
          </span>
          <span className="text-text-secondary/40">·</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase",
              categoryMeta.bg,
              categoryMeta.text
            )}
          >
            <Tag className="h-2.5 w-2.5" />
            {categoryMeta.label}
          </span>
          <span className="font-mono text-xs font-semibold text-text bg-bg-subtle px-1.5 py-0.5 rounded border border-border">
            {record.assetCode}
          </span>
        </div>

        {/* Row 2: Asset Name */}
        <h3 className="text-sm font-bold text-text truncate group-hover:text-accent transition-colors">
          {record.assetName}
        </h3>

        {/* Row 3: Borrower & Schedule */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
          <span className="flex items-center gap-1 font-semibold text-text">
            <User className="h-3.5 w-3.5 text-text-secondary/70 shrink-0" />
            {record.borrowerName}
          </span>
          <span className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 text-text-secondary/70 shrink-0" />
            {record.department}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-text-secondary/70 shrink-0" />
            Due: <span className="font-semibold text-text">{record.dueDate}</span>
          </span>
        </div>
      </div>

      {/* Right Column: Overdue Severity Badge / Status & Action */}
      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
        {/* Status Indicator */}
        {record.status === "overdue" && record.daysOverdue ? (
          <OverdueBadge daysOverdue={record.daysOverdue} />
        ) : record.status === "active" ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-status-active-bg/20 text-status-active-text">
            Active Checkout
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-status-retired-bg/20 text-status-retired-text">
            Returned ({record.conditionOnReturn === "good" ? "Good" : record.conditionOnReturn === "needs_repair" ? "Needs Repair" : "Damaged"})
          </span>
        )}

        {/* Action Button (Process Return for active/overdue items) */}
        {(record.status === "active" || record.status === "overdue") && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onProcessReturn(record);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer shadow-xs transition-colors duration-150",
              record.status === "overdue"
                ? "bg-accent text-accent-foreground hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                : "border border-border bg-bg text-text hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            )}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Process Return
          </button>
        )}

        {record.status === "returned" && (
          <button
            type="button"
            onClick={() => onSelect(record)}
            aria-label={`View audit record for ${record.logCode}`}
            className="p-1 rounded text-text-secondary hover:text-text hover:bg-border transition-colors cursor-pointer"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
