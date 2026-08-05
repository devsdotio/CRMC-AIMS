"use client";

import { useEffect, useRef } from "react";
import { X, Check, Mail, Phone, Building2, Tag, History, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BorrowRequest, AssetCategory, RequestStatus } from "./types";

export interface RequestDetailPanelProps {
  request: BorrowRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (request: BorrowRequest) => void;
  onReject: (request: BorrowRequest) => void;
}

const CATEGORY_STYLES: Record<AssetCategory, { bg: string; text: string; label: string }> = {
  transport: { bg: "bg-category-transport-bg", text: "text-category-transport-text", label: "Transport" },
  computing: { bg: "bg-category-computing-bg", text: "text-category-computing-text", label: "Computing" },
  av:        { bg: "bg-category-av-bg",        text: "text-category-av-text",        label: "AV Equipment" },
  furniture: { bg: "bg-category-furniture-bg", text: "text-category-furniture-text", label: "Furniture" },
};

const STATUS_STYLES: Record<RequestStatus, { bg: string; text: string; label: string }> = {
  pending:  { bg: "bg-status-repair-bg/20",     text: "text-status-repair-text font-bold",      label: "Pending Review" },
  approved: { bg: "bg-status-active-bg/20",     text: "text-status-active-text font-bold",      label: "Approved" },
  rejected: { bg: "bg-status-outofservice-bg/20", text: "text-status-outofservice-text font-bold", label: "Rejected" },
  returned: { bg: "bg-status-retired-bg/20",    text: "text-status-retired-text font-bold",     label: "Returned" },
};

export function RequestDetailPanel({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: RequestDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Keyboard Escape listener
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

  const categoryMeta = CATEGORY_STYLES[request.category];
  const statusMeta = STATUS_STYLES[request.status];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer content panel */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-panel-heading"
        className={cn(
          "relative flex flex-col w-full max-w-lg h-full bg-bg border-l border-border shadow-2xl z-10 overflow-hidden",
          "animate-in slide-in-from-right duration-250 ease-in-out"
        )}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-subtle/50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-text-secondary">
                {request.requestCode}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                  categoryMeta.bg,
                  categoryMeta.text
                )}
              >
                <Tag className="h-2.5 w-2.5 mr-1" />
                {categoryMeta.label}
              </span>
            </div>
            <h2 id="detail-panel-heading" className="text-base font-bold text-text mt-0.5">
              Borrow Request Details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close request detail panel"
            className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-border transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Panel Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-bg-subtle">
            <span className="text-xs font-semibold text-text-secondary">Current Status</span>
            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold",
                statusMeta.bg,
                statusMeta.text
              )}
            >
              {statusMeta.label}
            </span>
          </div>

          {/* Requested Item Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Item Details
            </h3>
            <div className="p-4 rounded-lg border border-border bg-bg space-y-2">
              <p className="text-sm font-bold text-text">{request.itemDescription}</p>
              <div className="flex flex-wrap gap-4 text-xs text-text-secondary pt-1 border-t border-border">
                <div>
                  Quantity: <span className="font-bold text-text">{request.quantity}</span>
                </div>
                {request.assetCode && (
                  <div>
                    Asset Tag: <span className="font-mono font-bold text-text">{request.assetCode}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Requester Contact Info */}
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
              <div className="flex items-center gap-2 text-text-secondary">
                <Mail className="h-4 w-4 shrink-0" />
                <a href={`mailto:${request.requesterEmail}`} className="hover:underline text-accent">
                  {request.requesterEmail}
                </a>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{request.requesterPhone}</span>
              </div>
            </div>
          </div>

          {/* Purpose & Notes */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Purpose & Notes
            </h3>
            <div className="p-4 rounded-lg border border-border bg-bg space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-text-secondary shrink-0 mt-0.5" />
                <p className="text-text leading-relaxed">{request.purpose}</p>
              </div>
              {request.notes && (
                <div className="mt-2 pt-2 border-t border-border text-text-secondary">
                  <span className="font-semibold text-text">Additional Note:</span> {request.notes}
                </div>
              )}
              {request.rejectionReason && (
                <div className="mt-2 p-3 rounded bg-status-outofservice-bg/10 border border-status-outofservice-bg/20 text-status-outofservice-text font-medium">
                  <span className="font-bold block mb-0.5">Rejection Reason:</span>
                  {request.rejectionReason}
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Schedule & Return Date
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-border bg-bg">
                <span className="text-text-secondary block mb-1">Requested On</span>
                <span className="font-semibold text-text">{new Date(request.requestedAt).toLocaleDateString()}</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-bg">
                <span className="text-text-secondary block mb-1">Expected Return</span>
                <span className="font-semibold text-text">{request.expectedReturnDate}</span>
              </div>
            </div>
          </div>

          {/* History Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              Action History
            </h3>
            <div className="p-4 rounded-lg border border-border bg-bg">
              <ol className="relative border-l border-border ml-2 space-y-4">
                {request.history.map((h) => (
                  <li key={h.id} className="ml-4">
                    <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-bg bg-accent" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-text capitalize">{h.action}</span>
                      <time className="text-[11px] text-text-secondary">{h.timestamp}</time>
                    </div>
                    <p className="text-xs text-text-secondary mt-0.5">By {h.actor}</p>
                    {h.note && (
                      <p className="text-xs text-text bg-bg-subtle p-2 rounded mt-1 border border-border">
                        {h.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Action Footer (Only for pending requests) */}
        {request.status === "pending" && (
          <div className="p-4 border-t border-border bg-bg-subtle flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onReject(request)}
              className="px-4 py-2 text-xs font-semibold rounded-md border border-border bg-bg text-text-secondary hover:border-status-outofservice-bg hover:text-status-outofservice-text transition-colors cursor-pointer"
            >
              Reject Request
            </button>
            <button
              type="button"
              onClick={() => onApprove(request)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              Approve Request
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
