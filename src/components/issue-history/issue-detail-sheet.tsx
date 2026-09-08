"use client";

import { useEffect, useState } from "react";
import {
  X,
  Copy,
  Check,
  Box,
  Package,
  Calendar,
  Building2,
  User,
  Clock,
  Tag,
  FileText,
  Undo2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhp } from "@/components/projects/format-money";

export interface IssueDetailRecord {
  id: string;
  code: string;
  kind: "asset" | "supply";
  itemLabel: string;
  itemCode: string;
  destination: string;
  qtyLabel: string;
  when: string;
  actor: string;
  source?: string;
  extra?: string;
  department?: string;
  borrowerName?: string;
  borrowerEmail?: string;
  borrowerPhone?: string;
  category?: string;
  status?: string;
  dueDate?: string | null;
  returnedAt?: string | null;
  lotCode?: string | null;
  unitCost?: string | null;
  lineTotal?: string | null;
  unit?: string | null;
  notes?: string | null;
  requestCode?: string | null;
  custodyKind?: string;
  voided?: boolean;
  reversalMovementCode?: string | null;
  /** Real stock_movements.id for void API (supply issues). */
  movementId?: string;
}

interface IssueDetailSheetProps {
  record: IssueDetailRecord | null;
  isOpen: boolean;
  onClose: () => void;
  canOperate?: boolean;
  onVoidIssue?: (record: IssueDetailRecord, reason: string) => Promise<void>;
}

export function IssueDetailSheet({
  record,
  isOpen,
  onClose,
  canOperate = false,
  onVoidIssue,
}: IssueDetailSheetProps) {
  const [copied, setCopied] = useState(false);
  const [showVoidForm, setShowVoidForm] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowVoidForm(false);
      setVoidReason("");
      setIsVoiding(false);
    }
  }, [isOpen, record?.id]);

  if (!isOpen || !record) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(record.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAsset = record.kind === "asset";
  const canUndoSupply =
    !isAsset &&
    canOperate &&
    !record.voided &&
    Boolean(onVoidIssue) &&
    Boolean(record.movementId);

  const formattedDate = new Date(record.when).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        <div className="p-5 border-b border-border bg-bg-subtle/50 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider",
                  isAsset
                    ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                    : "bg-status-active-bg/20 text-status-active-text border border-status-active-bg/30"
                )}
              >
                {isAsset ? <Box className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                {isAsset ? "Asset Custody Issue" : "Supply Issue"}
              </span>
              {record.voided && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-status-repair-bg/15 text-status-repair-text border-status-repair-bg/30">
                  Voided
                </span>
              )}
              {record.source && (
                <span className="text-[11px] font-semibold text-text-secondary px-2 py-0.5 rounded bg-bg border border-border">
                  {record.source}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-text-secondary hover:text-text hover:bg-bg-subtle transition-colors cursor-pointer"
              aria-label="Close transaction details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-black text-text tracking-wide">
                {record.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1 rounded text-text-secondary hover:text-text hover:bg-bg transition-colors cursor-pointer"
                title="Copy transaction code"
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
              Issued on {formattedDate}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="p-4 rounded-xl border border-border bg-bg space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-accent" />
              Item Specifications
            </h4>
            <div className="space-y-1.5">
              <p className="text-base font-bold text-text">{record.itemLabel}</p>
              <span className="font-mono text-xs font-bold text-text-secondary bg-bg-subtle px-2 py-0.5 rounded border border-border inline-block">
                Code: {record.itemCode}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border text-xs">
              <div>
                <span className="text-text-secondary block text-[11px]">Quantity</span>
                <span className="font-bold text-text font-mono text-sm">{record.qtyLabel}</span>
              </div>
              {record.lotCode && (
                <div>
                  <span className="text-text-secondary block text-[11px]">Source Lot</span>
                  <span className="font-bold text-text font-mono">{record.lotCode}</span>
                </div>
              )}
              {record.unitCost && (
                <div>
                  <span className="text-text-secondary block text-[11px]">Unit Valuation</span>
                  <span className="font-bold text-text font-mono">
                    {formatPhp(Number(record.unitCost))}
                  </span>
                </div>
              )}
              {record.lineTotal && (
                <div>
                  <span className="text-text-secondary block text-[11px]">Total Dispatched Value</span>
                  <span className="font-bold text-status-active-text font-mono">
                    {formatPhp(Number(record.lineTotal))}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-bg space-y-3 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-accent" />
              Destination
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-text-secondary text-[11px] block">Department / Project</span>
                <p className="font-bold text-text">{record.destination || "—"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-text-secondary text-[11px] block">Issued By</span>
                <p className="font-bold text-text flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-text-secondary" />
                  {record.actor || "System"}
                </p>
              </div>
              {record.requestCode && (
                <div className="space-y-1">
                  <span className="text-text-secondary text-[11px] block">Originating Request</span>
                  <span className="font-mono font-bold text-text bg-bg-subtle px-2 py-0.5 rounded border border-border inline-block">
                    {record.requestCode}
                  </span>
                </div>
              )}
              {record.voided && record.reversalMovementCode && (
                <div className="space-y-1">
                  <span className="text-text-secondary text-[11px] block">Restock Movement</span>
                  <span className="font-mono font-bold text-status-active-text bg-bg-subtle px-2 py-0.5 rounded border border-border inline-block">
                    {record.reversalMovementCode}
                  </span>
                </div>
              )}
            </div>
          </div>

          {isAsset && (
            <div className="p-4 rounded-xl border border-border bg-bg space-y-3 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-accent" />
                Custody Timeline
              </h4>
              <div>
                <span className="text-text-secondary text-[11px] block">Released Date</span>
                <span className="font-semibold text-text">{formattedDate}</span>
              </div>
            </div>
          )}

          {record.notes && (
            <div className="p-4 rounded-xl border border-border bg-bg space-y-2 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-accent" />
                Transaction Notes
              </h4>
              <p className="text-text-secondary leading-relaxed bg-bg-subtle p-3 rounded-lg border border-border font-mono text-[11px]">
                {record.notes}
              </p>
            </div>
          )}

          {showVoidForm && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Undo2 className="h-3.5 w-3.5" />
                Undo Supply Issue
              </h4>
              <p className="text-text-secondary leading-relaxed">
                This restocks the issued quantity back into inventory
                {record.lotCode ? ` (lot ${record.lotCode})` : ""}. The original MOV
                stays for audit; a compensating restock is recorded.
              </p>
              <div className="space-y-1">
                <label htmlFor="supply-void-reason" className="text-[11px] font-semibold text-text">
                  Reason (optional)
                </label>
                <textarea
                  id="supply-void-reason"
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Issued to wrong department"
                  className="w-full p-2 text-xs rounded-lg border border-border bg-bg text-text focus:ring-1 focus:ring-accent focus:outline-hidden resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isVoiding}
                  onClick={() => {
                    setShowVoidForm(false);
                    setVoidReason("");
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-bg-subtle text-text cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isVoiding || !onVoidIssue}
                  onClick={async () => {
                    if (!onVoidIssue) return;
                    setIsVoiding(true);
                    try {
                      await onVoidIssue(record, voidReason.trim());
                      setShowVoidForm(false);
                      setVoidReason("");
                      onClose();
                    } finally {
                      setIsVoiding(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-status-repair-bg text-white hover:opacity-90 cursor-pointer disabled:opacity-50"
                >
                  {isVoiding ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Restocking…
                    </>
                  ) : (
                    <>
                      <Undo2 className="h-3.5 w-3.5" />
                      Confirm Undo
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-bg-subtle shrink-0 flex items-center justify-between gap-3">
          <div>
            {canUndoSupply && !showVoidForm ? (
              <button
                type="button"
                onClick={() => setShowVoidForm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
              >
                <Undo2 className="h-3.5 w-3.5" />
                Undo Issue
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-lg border border-border bg-bg hover:bg-bg-subtle transition-colors cursor-pointer text-text"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
