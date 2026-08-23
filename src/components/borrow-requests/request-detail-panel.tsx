"use client";
 
import { useEffect, useRef, useState } from "react";
import { X, Check, Mail, Phone, Building2, Tag, History, FileText, User, Loader2, Send, CheckCircle, XCircle, PackageCheck, PackageMinus, RotateCcw, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatItemDescription, isUuid } from "@/lib/sanitize-display";
import { useCategoryStyleResolver } from "@/features/categories/client/use-category-style";
import type { BorrowRequest,  RequestStatus } from "@/types/borrow-requests";
import { AuditNoteDisplay } from "@/components/audit-logs/audit-log-utils";
import { LoadingState } from "@/components/providers/loading-context";

/** Deterministic color from a string — same code always gets the same hue. */
function getAssetCodeColor(code: string) {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = ((hash % 360) + 360) % 360;
  return {
    bg: `hsla(${hue}, 70%, 95%, 1)`,
    text: `hsla(${hue}, 60%, 35%, 1)`,
    border: `hsla(${hue}, 55%, 80%, 1)`,
  };
}

export interface RequestDetailPanelProps {
  request: BorrowRequest | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onApprove?: (request: BorrowRequest) => void;
  onReject?: (request: BorrowRequest) => void;
  onRelease?: (request: BorrowRequest) => void | Promise<void>;
  onReturn?: (request: BorrowRequest) => void | Promise<void>;
  onMarkUnreleased?: (request: BorrowRequest) => void | Promise<void>;
  onEdit?: (request: BorrowRequest) => void;
}

const STATUS_STYLES: Record<RequestStatus, { bg: string; text: string; label: string }> = {
  pending:    { bg: "bg-status-repair-bg/20",       text: "text-status-repair-text font-bold",      label: "Pending Review" },
  approved:   { bg: "bg-status-active-bg/20",       text: "text-status-active-text font-bold",      label: "Approved" },
  rejected:   { bg: "bg-destructive", text: "text-white font-bold", label: "Rejected" },
  released:   { bg: "bg-status-active-bg/20",       text: "text-status-active-text font-bold",      label: "Released" },
  unreleased: { bg: "bg-bg-subtle",                 text: "text-text-secondary font-bold",          label: "Unreleased" },
  returned:   { bg: "bg-status-active-bg/20",       text: "text-status-active-text font-bold",      label: "Returned" },
  cancelled:  { bg: "bg-bg-subtle",                 text: "text-text-secondary font-bold",          label: "Cancelled" },
};

function getActionIcon(action: string) {
  switch (action.toLowerCase()) {
    case "pending":
    case "created":
      return <Send className="h-3.5 w-3.5 text-accent" />;
    case "approved":
      return <CheckCircle className="h-3.5 w-3.5 text-status-active-text" />;
    case "released":
      return <PackageMinus className="h-3.5 w-3.5 text-status-active-text" />;
    case "unreleased":
      return <RotateCcw className="h-3.5 w-3.5 text-status-repair-text" />;
    case "returned":
      return <PackageCheck className="h-3.5 w-3.5 text-status-active-text" />;
    case "rejected":
    case "cancelled":
      return <XCircle className="h-3.5 w-3.5 text-status-outofservice-text" />;
    default:
      return <History className="h-3.5 w-3.5 text-text-secondary" />;
  }
}

function getActionStyle(action: string) {
  switch (action) {
    case "submitted":
      return { bg: "bg-bg-subtle border-border", text: "text-text-secondary" };
    case "approved":
      return { bg: "bg-status-active-bg/20 border-status-active-bg/30", text: "text-status-active-text" };
    case "rejected":
      return { bg: "bg-destructive border-destructive", text: "text-white", iconText: "text-white" };
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
  isLoading = false,
  onClose,
  onApprove,
  onReject,
  onRelease,
  onReturn,
  onMarkUnreleased,
  onEdit,
}: RequestDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isMarkingUnreleased, setIsMarkingUnreleased] = useState(false);
  const resolveCategoryStyle = useCategoryStyleResolver();

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

  if (!isOpen) return null;

  if (isLoading || !request) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-200">
        <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Loading request details"
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
              icon="clipboard"
              message="Loading borrow request..."
              subtitle="Retrieving requested inventory items, borrower verification, and approval timeline"
            />
          </div>
        </aside>
      </div>
    );
  }

  const statusMeta = STATUS_STYLES[request.status];
  const hasReturnableAssets = request.items?.some(
    (item) => item.itemType === "asset" || Boolean(item.assetId)
  );

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
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 id="detail-panel-heading" className="font-mono text-lg font-bold tracking-tight text-text">
                {request.requestCode}
              </h2>
              {statusMeta && (
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border border-border/50",
                    statusMeta.bg,
                    statusMeta.text
                  )}
                >
                  {statusMeta.label}
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary font-medium mt-0.5 truncate">
              {hasReturnableAssets ? "Borrow Request" : "Supplies Requisition"} • Requester: <strong className="text-text font-semibold">{request.requesterName}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEdit && request.status === "pending" && (
              <button
                type="button"
                onClick={() => onEdit(request)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-bg text-text hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-colors cursor-pointer shadow-xs"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </button>
            )}

            {request.status === "released" && onReturn && hasReturnableAssets && (
              <button
                type="button"
                onClick={() => onReturn(request)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
                Mark Returned
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Panel Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Banner */}
          <div className="space-y-2">
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
            {request.rejectionReason && (
              <div className="p-3.5 rounded-lg border border-destructive bg-destructive/10 text-destructive text-xs">
                <span className="font-bold block mb-1">Rejection Reason:</span>
                {request.rejectionReason}
              </div>
            )}
          </div>

          {/* Requested Item Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Item Details
              </h3>
              <span className="text-[11px] font-semibold text-text-secondary bg-bg-subtle px-2 py-0.5 rounded-full border border-border">
                {request.items.length} {request.items.length === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="rounded-lg border border-border bg-bg overflow-hidden divide-y divide-border">
              {request.items.map((item, idx) => {
                const itemCategoryMeta = resolveCategoryStyle(item.category);
                const displayDesc = formatItemDescription(
                  item.itemDescription,
                  itemCategoryMeta.label,
                  item.itemType
                );
                const shouldShowAssetCode =
                  Boolean(item.assetCode) &&
                  !isUuid(item.assetCode) &&
                  !item.assetCode?.toLowerCase().startsWith("cat-");

                return (
                  <div key={idx} className={cn("px-3.5 py-2.5 flex items-center gap-3", idx % 2 === 1 && "bg-bg-subtle/50")}>
                    {/* Description + tags */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text truncate">{displayDesc}</p>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        <span className={cn("rounded-full px-1.5 py-px text-[9px] font-bold uppercase", itemCategoryMeta.bg, itemCategoryMeta.text)}>
                          {itemCategoryMeta.label}
                        </span>
                        <span className={cn(
                          "rounded-full px-1.5 py-px text-[9px] font-semibold uppercase",
                          item.itemType === "asset" ? "bg-primary/10 text-primary" : "bg-status-repair-bg/10 text-status-repair-text"
                        )}>
                          {item.itemType === "asset" ? "Asset" : "Consumable"}
                        </span>
                        {shouldShowAssetCode && item.assetCode && (() => {
                          const acColor = getAssetCodeColor(item.assetCode);
                          return (
                            <span
                              className="rounded-full px-1.5 py-px text-[9px] font-mono font-bold"
                              style={{ backgroundColor: acColor.bg, color: acColor.text, border: `1px solid ${acColor.border}` }}
                            >
                              {item.assetCode}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    {/* Quantity badge — right side */}
                    <span className="flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-bg-subtle border border-border text-[11px] font-bold text-text shrink-0">
                      &times;{item.quantity}
                    </span>
                  </div>
                );
              })}
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
                <a href={`mailto:${request.requesterEmail}`} className="hover:underline text-primary">
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
              {hasReturnableAssets ? "Schedule & Return Date" : "Schedule & Status"}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-border bg-bg">
                <span className="text-text-secondary block mb-1">Requested On</span>
                <span className="font-semibold text-text">{new Date(request.requestedAt).toLocaleDateString()}</span>
              </div>
              {hasReturnableAssets ? (
                <div className="p-3 rounded-lg border border-primary/25 bg-primary/5">
                  <span className="text-text-secondary block mb-1">Expected Return</span>
                  <span className="font-bold text-primary">{request.expectedReturnDate}</span>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-border bg-bg-subtle">
                  <span className="text-text-secondary block mb-1">Return Requirement</span>
                  <span className="font-semibold text-text-secondary">Non-returnable (Consumable)</span>
                </div>
              )}
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
                {[...request.history].reverse().map((h, index) => {
                  const style = getActionStyle(h.action);
                  return (
                    <li key={h.id} className="pl-6 relative">
                      <span className={cn(
                        "absolute -left-3.25 top-1.5 h-6 w-6 rounded-full border-2 flex items-center justify-center bg-bg shadow-sm z-10",
                        style.bg,
                        (style as Record<string, string>).iconText || style.text
                      )}>
                        {getActionIcon(h.action)}
                      </span>
                      <div className="flex flex-col gap-0.5 pt-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className={cn("font-bold capitalize", style.text)}>
                            {h.action}
                          </span>
                          <time className="text-[11px] text-text-secondary font-medium">{h.timestamp}</time>
                        </div>
                        <p className="text-xs text-text-secondary font-medium">By {h.actor}</p>
                      </div>
                      
                      {h.note && (
                        <AuditNoteDisplay action={h.action} note={h.note} className="mt-2" />
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>

        {/* Action Footer (Only for pending requests with action handlers) */}
        {request.status === "pending" && onApprove && onReject && (
          <div className="p-4 border-t border-border bg-bg-subtle flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onReject(request)}
              className="px-4 py-2 text-xs font-semibold rounded-md border border-border bg-bg text-text-secondary hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              Reject Request
            </button>
            <button
              type="button"
              onClick={() => onApprove(request)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
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
