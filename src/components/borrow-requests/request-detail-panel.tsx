"use client";
 
import { getCategoryStyle } from "@/constants/categories";

import { useEffect, useRef, useState } from "react";
import { X, Check, Mail, Phone, Building2, Tag, History, FileText, User, Loader2, Send, CheckCircle, XCircle, PackageCheck, PackageMinus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BorrowRequest,  RequestStatus } from "@/types/borrow-requests";

export interface RequestDetailPanelProps {
  request: BorrowRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (request: BorrowRequest) => void;
  onReject: (request: BorrowRequest) => void;
  onRelease?: (request: BorrowRequest) => void | Promise<void>;
  onReturn?: (request: BorrowRequest) => void | Promise<void>;
  onMarkUnreleased?: (request: BorrowRequest) => void | Promise<void>;
}

const STATUS_STYLES: Record<RequestStatus, { bg: string; text: string; label: string }> = {
  pending:    { bg: "bg-status-repair-bg/20",       text: "text-status-repair-text font-bold",      label: "Pending Review" },
  approved:   { bg: "bg-status-active-bg/20",       text: "text-status-active-text font-bold",      label: "Approved" },
  rejected:   { bg: "bg-status-outofservice-bg/20", text: "text-status-outofservice-text font-bold", label: "Rejected" },
  released:   { bg: "bg-status-active-bg/20",       text: "text-status-active-text font-bold",      label: "Released" },
  unreleased: { bg: "bg-bg-subtle",                 text: "text-text-secondary font-bold",          label: "Unreleased" },
  returned:   { bg: "bg-status-active-bg/20",       text: "text-status-active-text font-bold",      label: "Returned" },
};

function getActionIcon(action: string) {
  switch (action) {
    case "submitted": return <Send className="h-4 w-4" />;
    case "approved": return <CheckCircle className="h-4 w-4" />;
    case "rejected": return <XCircle className="h-4 w-4" />;
    case "released": return <PackageCheck className="h-4 w-4" />;
    case "unreleased": return <PackageMinus className="h-4 w-4" />;
    case "returned": return <RotateCcw className="h-4 w-4" />;
    default: return <History className="h-4 w-4" />;
  }
}

function getActionStyle(action: string) {
  switch (action) {
    case "submitted":
      return { bg: "bg-bg-subtle border-border", text: "text-text-secondary" };
    case "approved":
      return { bg: "bg-status-active-bg/20 border-status-active-bg/30", text: "text-status-active-text" };
    case "rejected":
      return { bg: "bg-status-outofservice-bg/20 border-status-outofservice-bg/30", text: "text-status-outofservice-text" };
    case "released":
      return { bg: "bg-status-active-bg/20 border-status-active-bg/30", text: "text-status-active-text" };
    case "unreleased":
      return { bg: "bg-bg-subtle border-border", text: "text-text-secondary" };
    case "returned":
      return { bg: "bg-status-active-bg/20 border-status-active-bg/30", text: "text-status-active-text" };
    default:
      return { bg: "bg-bg-subtle border-border", text: "text-text-secondary" };
  }
}

export function RequestDetailPanel({
  request,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onRelease,
  onReturn,
  onMarkUnreleased,
}: RequestDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isMarkingUnreleased, setIsMarkingUnreleased] = useState(false);

  // Keyboard Escape listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isMarkingUnreleased) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isMarkingUnreleased]);

  const handleMarkUnreleased = async () => {
    if (!onMarkUnreleased || !request) return;
    setIsMarkingUnreleased(true);
    try {
      await onMarkUnreleased(request);
    } finally {
      setIsMarkingUnreleased(false);
    }
  };

  if (!isOpen || !request) return null;

  const categoryMeta = getCategoryStyle(request.category);
  const statusMeta = STATUS_STYLES[request.status];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={() => !isMarkingUnreleased && onClose()} aria-hidden="true" />

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

          {request.status === "released" && onReturn ? (
            <button
              type="button"
              onClick={() => onReturn(request)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
              Mark Returned
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close request detail panel"
              className="p-1.5 rounded-lg text-text-secondary hover:text-text hover:bg-border transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Scrollable Panel Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-bg-subtle">
            <span className="text-xs font-semibold text-text-secondary">Current Status</span>
            <div className="flex items-center gap-2">
              {request.status === "released" && request.pickedUpBy && (
                <span
                  className="inline-flex items-center gap-1.5 justify-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-bg text-text-secondary border border-border shadow-xs"
                >
                  <User className="h-3 w-3" />
                  <span className="font-normal opacity-80">Picker:</span> {request.pickedUpBy}
                </span>
              )}
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

          {/* Fulfillment Details */}
          {request.pickedUpBy && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Fulfillment Details
              </h3>
              <div className="p-4 rounded-lg border border-border bg-bg space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-text-secondary shrink-0" />
                  <span className="text-text-secondary">Picked up by:</span>
                  <span className="font-bold text-text">{request.pickedUpBy}</span>
                </div>
              </div>
            </div>
          )}

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
              <ol className="relative border-l-2 border-border/60 ml-3 space-y-6">
                {request.history.map((h, index) => {
                  const style = getActionStyle(h.action);
                  return (
                    <li key={h.id} className="pl-6 relative">
                      <span className={cn(
                        "absolute -left-4.25 top-0 h-8 w-8 rounded-full border-2 flex items-center justify-center bg-bg shadow-sm z-10",
                        style.bg,
                        style.text
                      )}>
                        {getActionIcon(h.action)}
                      </span>
                      <div className="flex flex-col gap-0.5 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className={cn("font-bold capitalize", style.text)}>
                            {h.action}
                          </span>
                          <time className="text-[11px] text-text-secondary font-medium">{h.timestamp}</time>
                        </div>
                        <p className="text-xs text-text-secondary font-medium">By {h.actor}</p>
                      </div>
                      
                      {h.note && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(() => {
                            let picker = null;
                            let restOfNote = h.note;
                            
                            // Extract picker from released note if present
                            if (h.action === "released" && h.note.startsWith("Released to: ")) {
                              const parts = h.note.split(". ");
                              picker = parts[0].replace("Released to: ", "");
                              restOfNote = parts.slice(1).join(". ");
                            } else if (h.action === "returned" && h.note.startsWith("Returned by: ")) {
                              const parts = h.note.split(". ");
                              picker = parts[0].replace("Returned by: ", "");
                              restOfNote = parts.slice(1).join(". ");
                            }
                            
                            return (
                              <>
                                {picker && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-bg-subtle text-text-secondary border border-border shadow-xs">
                                    <User className="h-3 w-3" />
                                    {h.action === "returned" ? "Returned by: " : "Picked up by: "} {picker}
                                  </span>
                                )}
                                {restOfNote && (
                                  <span className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border shadow-xs max-w-full",
                                    style.bg,
                                    "text-text"
                                  )}>
                                    <FileText className="h-3 w-3 shrink-0" />
                                    <span className="truncate whitespace-normal leading-tight">{restOfNote}</span>
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </li>
                  );
                })}
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
        
        
        {/* Action Footer (Only for approved requests) */}
        {request.status === "approved" && onRelease && (
          <div className="p-4 border-t border-border bg-bg-subtle flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onRelease && request && onRelease(request)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-accent text-accent-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
              Release Request
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
