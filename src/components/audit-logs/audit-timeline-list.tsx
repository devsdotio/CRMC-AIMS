import { cn } from "@/lib/utils";
import { Send, CheckCircle, XCircle, PackageCheck, PackageMinus, RotateCcw, History, FileText, ShoppingCart, FileSpreadsheet } from "lucide-react";
import type { FlattenedLog } from "@/features/audit-logs/client/audit-logs-api";

function getActionIcon(action: string) {
  switch (action) {
    case "submitted":
    case "pending": return <Send className="h-4 w-4" />;
    case "approved": return <CheckCircle className="h-4 w-4" />;
    case "rejected": return <XCircle className="h-4 w-4" />;
    case "released": return <PackageCheck className="h-4 w-4" />;
    case "unreleased": return <PackageMinus className="h-4 w-4" />;
    case "returned": return <RotateCcw className="h-4 w-4" />;
    case "cancelled": return <XCircle className="h-4 w-4" />;
    case "purchased": return <ShoppingCart className="h-4 w-4" />;
    default: return <History className="h-4 w-4" />;
  }
}

function getActionStyle(action: string) {
  switch (action) {
    case "submitted":
    case "pending":
      return { bg: "bg-bg-subtle border-border", text: "text-text-secondary" };
    case "approved":
    case "purchased":
      return { bg: "bg-status-active-bg/20 border-status-active-bg/30", text: "text-status-active-text" };
    case "rejected":
    case "cancelled":
      return { bg: "bg-destructive border-destructive", text: "text-white" };
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

export function AuditTimelineList({ logs, emptyIcon: EmptyIcon, emptyMessage, emptyDescription }: { 
  logs: FlattenedLog[];
  emptyIcon: any;
  emptyMessage: string;
  emptyDescription: string;
}) {
  if (logs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <EmptyIcon className="h-12 w-12 text-text-secondary mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-text">{emptyMessage}</h3>
        <p className="text-sm text-text-secondary max-w-sm mt-1">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 w-full">
      <div className="w-full">
        <ol className="relative border-l-2 border-border/60 ml-3 space-y-6">
          {logs.map((log) => {
            const style = getActionStyle(log.action);
            return (
              <li key={log.id} className="pl-6 relative">
                <span className={cn(
                  "absolute -left-4.25 top-0 h-8 w-8 rounded-full border-2 flex items-center justify-center bg-bg shadow-sm z-10",
                  style.bg,
                  (style as Record<string, string>).iconText || style.text
                )}>
                  {getActionIcon(log.action)}
                </span>
                <div className="flex flex-col gap-0.5 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold capitalize text-sm text-text">
                        {log.requestCode}
                      </span>
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border", style.bg, style.text, style.bg.replace('bg-', 'border-'))}>
                        {log.action}
                      </span>
                    </div>
                    <time className="text-[11px] text-text-secondary font-medium">
                      {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(log.timestamp))}
                    </time>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-secondary font-medium mt-0.5">
                    <span>By {log.actor}</span>
                    {log.department && (
                      <>
                        <span className="opacity-50">•</span>
                        <span>{log.department}</span>
                      </>
                    )}
                  </div>
                </div>
                
                {log.note && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border shadow-xs max-w-full",
                      style.bg,
                      (log.action === "rejected" || log.action === "cancelled") ? "text-white" : "text-text"
                    )}>
                      <FileText className="h-3 w-3 shrink-0" />
                      <span className="truncate whitespace-normal leading-tight">{log.note}</span>
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
