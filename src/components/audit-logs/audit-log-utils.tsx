import React from "react";
import { cn } from "@/lib/utils";
import {
  Send,
  Check,
  CheckCircle,
  X,
  XCircle,
  PackageCheck,
  PackageMinus,
  RotateCcw,
  History,
  ShoppingCart,
  PlusCircle,
  Edit,
  Trash2,
  Wrench,
  UserCheck,
  UserX,
  FileText,
  User,
} from "lucide-react";

export type AuditActionMeta = {
  label: string;
  bg: string;
  text: string;
  iconText?: string;
  borderClass: string;
  badgeClass: string;
  icon: React.ReactNode;
};

export function getActionIcon(rawAction: string): React.ReactNode {
  const action = rawAction.toLowerCase().trim();
  switch (action) {
    case "pending":
    case "submitted":
    case "created":
    case "create":
      return <FileText className="h-3.5 w-3.5" />;
    case "approved":
    case "activated":
      return <Check className="h-3.5 w-3.5" />;
    case "rejected":
    case "cancelled":
    case "declined":
    case "deleted":
    case "delete":
      return <X className="h-3.5 w-3.5" />;
    case "released":
    case "check_out":
    case "checked_out":
      return <Send className="h-3.5 w-3.5 ml-0.5" />;
    case "returned":
    case "check_in":
    case "checked_in":
      return <RotateCcw className="h-3.5 w-3.5" />;
    case "purchased":
    case "purchase_lot_created":
      return <ShoppingCart className="h-3.5 w-3.5" />;
    case "flagged_repair":
    case "maintenance":
      return <Wrench className="h-3.5 w-3.5" />;
    case "update":
    case "updated":
      return <Edit className="h-3.5 w-3.5" />;
    case "deactivated":
      return <UserX className="h-3.5 w-3.5" />;
    default:
      return <History className="h-3.5 w-3.5" />;
  }
}

export function getActionStyle(rawAction: string): { bg: string; text: string; iconText?: string; borderClass: string; label: string } {
  const action = rawAction.toLowerCase().trim();
  switch (action) {
    case "submitted":
    case "pending":
    case "created":
    case "create":
      return {
        label: action === "create" || action === "created" ? "Created" : "Submitted",
        bg: "bg-bg-subtle border-border",
        text: "text-text-secondary",
        borderClass: "border-border",
      };
    case "approved":
      return {
        label: "Approved",
        bg: "bg-status-active-bg/20 border-status-active-bg/30",
        text: "text-status-active-text",
        borderClass: "border-status-active-bg/40",
      };
    case "rejected":
    case "cancelled":
    case "declined":
      return {
        label: action === "cancelled" ? "Cancelled" : "Rejected",
        bg: "bg-destructive border-destructive",
        text: "text-destructive",
        iconText: "text-white",
        borderClass: "border-destructive/40",
      };
    case "released":
    case "check_out":
    case "checked_out":
      return {
        label: "Released",
        bg: "bg-status-active-bg/20 border-status-active-bg/30",
        text: "text-status-active-text",
        borderClass: "border-status-active-bg/40",
      };
    case "unreleased":
      return {
        label: "Unreleased",
        bg: "bg-bg-subtle border-border",
        text: "text-text-secondary",
        borderClass: "border-border",
      };
    case "returned":
    case "check_in":
    case "checked_in":
      return {
        label: "Returned",
        bg: "bg-status-active-bg/20 border-status-active-bg/30",
        text: "text-status-active-text",
        borderClass: "border-status-active-bg/40",
      };
    case "purchased":
    case "purchase_lot_created":
      return {
        label: "Purchased",
        bg: "bg-category-av-bg/20 border-category-av-bg/30",
        text: "text-category-av-bg",
        borderClass: "border-category-av-bg/40",
      };
    case "update":
    case "updated":
      return {
        label: "Updated",
        bg: "bg-category-computing-bg/20 border-category-computing-bg/30",
        text: "text-category-computing-bg",
        borderClass: "border-category-computing-bg/40",
      };
    case "delete":
    case "deleted":
      return {
        label: "Deleted",
        bg: "bg-destructive border-destructive",
        text: "text-destructive",
        iconText: "text-white",
        borderClass: "border-destructive/40",
      };
    case "flagged_repair":
    case "maintenance":
      return {
        label: "Maintenance Flag",
        bg: "bg-status-repair-bg/20 border-status-repair-bg/30",
        text: "text-status-repair-text",
        borderClass: "border-status-repair-bg/40",
      };
    case "resolved":
      return {
        label: "Resolved",
        bg: "bg-status-active-bg/20 border-status-active-bg/30",
        text: "text-status-active-text",
        borderClass: "border-status-active-bg/40",
      };
    case "deactivated":
      return {
        label: "Deactivated",
        bg: "bg-status-retired-bg/20 border-status-retired-bg/30",
        text: "text-status-retired-text",
        borderClass: "border-status-retired-bg/40",
      };
    case "activated":
      return {
        label: "Activated",
        bg: "bg-status-active-bg/20 border-status-active-bg/30",
        text: "text-status-active-text",
        borderClass: "border-status-active-bg/40",
      };
    default:
      return {
        label: rawAction.replace(/_/g, " "),
        bg: "bg-bg-subtle border-border",
        text: "text-text-secondary",
        borderClass: "border-border",
      };
  }
}

export function getActionMeta(rawAction: string): AuditActionMeta {
  const style = getActionStyle(rawAction);
  const icon = getActionIcon(rawAction);
  return {
    label: style.label,
    bg: style.bg,
    text: style.text,
    iconText: style.iconText,
    borderClass: style.borderClass,
    badgeClass: `${style.bg} ${style.text} border`,
    icon,
  };
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString || isoString === "—" || isoString === "none" || isoString === "null") return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString || isoString === "—" || isoString === "none" || isoString === "null") return "No activity";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDateTime(isoString);
  } catch {
    return isoString;
  }
}

export function stripAnsiArtifacts(str: string): string {
  if (!str) return "";
  return str
    .replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "") // ANSI escape sequences
    .replace(/\[[0-9;]*m/g, "") // Orphaned bracket codes like "[m", "[0m", "[32m"
    .replace(/\s+/g, " ")
    .trim();
}

export function parseAuditNote(action?: string | null, note?: string | null): {
  picker: string | null;
  description: string | null;
  actionType: "released" | "returned" | null;
} {
  if (!note) return { picker: null, description: null, actionType: null };

  const cleanedNote = stripAnsiArtifacts(note);
  if (!cleanedNote) return { picker: null, description: null, actionType: null };

  let picker: string | null = null;
  let description: string | null = cleanedNote;
  let actionType: "released" | "returned" | null = null;

  const act = (action || "").toLowerCase().trim();

  if (
    cleanedNote.toLowerCase().startsWith("released to:") ||
    act === "released" ||
    act === "checkout" ||
    act === "issue"
  ) {
    actionType = "released";
    if (/^released to:\s*/i.test(cleanedNote)) {
      const parts = cleanedNote.split(". ");
      picker = parts[0].replace(/^released to:\s*/i, "").trim();
      const rest = parts.slice(1).join(". ").trim();
      description = stripAnsiArtifacts(rest) || null;
    }
  } else if (
    cleanedNote.toLowerCase().startsWith("returned by:") ||
    act === "returned" ||
    act === "checkin"
  ) {
    actionType = "returned";
    if (/^returned by:\s*/i.test(cleanedNote)) {
      const parts = cleanedNote.split(". ");
      picker = parts[0].replace(/^returned by:\s*/i, "").trim();
      const rest = parts.slice(1).join(". ").trim();
      description = stripAnsiArtifacts(rest) || null;
    }
  }

  // Fallback pattern detection if action wasn't matched above
  if (!actionType) {
    if (/^released to:\s*/i.test(cleanedNote)) {
      actionType = "released";
      const parts = cleanedNote.split(". ");
      picker = parts[0].replace(/^released to:\s*/i, "").trim();
      const rest = parts.slice(1).join(". ").trim();
      description = stripAnsiArtifacts(rest) || null;
    } else if (/^returned by:\s*/i.test(cleanedNote)) {
      actionType = "returned";
      const parts = cleanedNote.split(". ");
      picker = parts[0].replace(/^returned by:\s*/i, "").trim();
      const rest = parts.slice(1).join(". ").trim();
      description = stripAnsiArtifacts(rest) || null;
    }
  }

  return { picker, description, actionType };
}

export function AuditNoteDisplay({
  action,
  note,
  className,
}: {
  action?: string | null;
  note?: string | null;
  className?: string;
}) {
  if (!note) return null;

  const { picker, description, actionType } = parseAuditNote(action, note);

  if (!picker && !description) return null;

  return (
    <div className={cn("mt-1.5 flex flex-wrap items-center gap-1.5", className)}>
      {picker && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/25 shadow-2xs">
          <User className="h-3 w-3 shrink-0 text-primary" />
          <span>
            {actionType === "returned" ? "Returned by: " : "Released to: "}
            <strong className="font-bold text-text bg-bg px-1.5 py-0.5 rounded border border-border/70 ml-0.5 inline-block">
              {picker}
            </strong>
          </span>
        </span>
      )}
      {description && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-normal bg-bg-subtle text-text border border-border shadow-2xs leading-snug">
          <FileText className="h-3 w-3 shrink-0 text-text-secondary" />
          <span>{description}</span>
        </span>
      )}
    </div>
  );
}

export function exportToCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return '""';
          const stringVal = typeof val === "object" ? JSON.stringify(val) : String(val);
          const escaped = stringVal.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function formatEntityDisplayCode(
  entityType: string,
  rawIdOrCode: string,
  metadata?: Record<string, unknown> | null
): string {
  if (!rawIdOrCode) return "N/A";

  // 1. If not a UUID, return as-is
  if (!UUID_REGEX.test(rawIdOrCode)) {
    return rawIdOrCode;
  }

  // 2. Check metadata for human-readable codes
  if (metadata) {
    const metaCode =
      (metadata.assetCode as string) ||
      (metadata.itemCode as string) ||
      (metadata.requestCode as string) ||
      (metadata.lotCode as string) ||
      (metadata.logCode as string) ||
      (metadata.code as string);
    if (metaCode && !UUID_REGEX.test(metaCode)) {
      return metaCode;
    }
  }

  // 3. Fallback prefix code
  const type = entityType.toLowerCase().replace(/_/g, "");
  let prefix = "ENT";
  if (type.includes("asset")) prefix = "AST";
  else if (type.includes("consumable") || type.includes("inventory")) prefix = "CON";
  else if (type.includes("borrow") || type.includes("request")) prefix = "REQ";
  else if (type.includes("purchase") || type.includes("lot") || type.includes("order")) prefix = "LOT";
  else if (type.includes("maint")) prefix = "MNT";
  else if (type.includes("user") || type.includes("profile")) prefix = "USR";

  return `${prefix}-${rawIdOrCode.slice(0, 8).toUpperCase()}`;
}
