"use client";



import {
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  Calendar,
  Tag,
  ChevronRight,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getCategoryStyle } from "@/constants/categories";
import { useBorrowerPortal } from "./context";
import {
  PortalSummaryStats,
  PortalBorrowRequest,
  PortalBorrowLogRecord,
} from "./types";
import { useDashboardSnapshotQuery } from "@/features/dashboard/client/use-dashboard";
import { useMeQuery } from "@/features/users/client";
import type { DashboardPendingRequest } from "@/server/modules/dashboard/dashboard.service";

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value?: number;
  subtext: string;
  icon: React.ElementType;
  tone?: "default" | "warning" | "danger" | "success";
  isLoading?: boolean;
}

function DashStatCard({ label, value, subtext, icon: Icon, tone = "default", isLoading }: StatCardProps) {
  const toneStyles = {
    default: {
      icon: "bg-accent/10 text-accent",
      value: "text-text",
    },
    success: {
      icon: "bg-status-active-bg/15 text-status-active-text",
      value: "text-text",
    },
    warning: {
      icon: "bg-status-repair-bg/15 text-status-repair-text",
      value: "text-status-repair-text",
    },
    danger: {
      icon: "bg-status-outofservice-bg/15 text-status-outofservice-text",
      value: "text-status-outofservice-text",
    },
  };

  const styles = toneStyles[tone];
  const showBadge = !isLoading && value !== undefined && value > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-text-secondary/30 transition-colors duration-200">
      <div className="flex items-start justify-between">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", styles.icon)}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        {tone === "warning" && showBadge && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-status-repair-text bg-status-repair-bg/10 border border-status-repair-bg/30 px-2 py-0.5 rounded-full">
            Attention
          </span>
        )}
        {tone === "danger" && showBadge && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-status-outofservice-text bg-status-outofservice-bg/10 border border-status-outofservice-bg/30 px-2 py-0.5 rounded-full">
            Urgent
          </span>
        )}
      </div>
      <div>
        {isLoading ? (
          <div className="h-9 w-12 bg-border animate-pulse rounded my-1" />
        ) : (
          <p className={cn("text-3xl font-bold tabular-nums", styles.value)}>{value ?? 0}</p>
        )}
        <p className="text-sm font-semibold text-text mt-0.5">{label}</p>
        <p className="text-xs text-text-secondary mt-0.5">{subtext}</p>
      </div>
    </div>
  );
}

// ─── Active Borrow Card ────────────────────────────────────────────────────────

function ActiveBorrowCard({ record }: { record: PortalBorrowLogRecord }) {
  const categoryMeta = getCategoryStyle(record.category);
  const isOverdue = record.status === "overdue";
  const dueDate = record.dueDate ? new Date(record.dueDate) : null;
  const daysLeft = dueDate
    ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-bg-subtle/50 transition-colors duration-150 border-l-4",
        isOverdue
          ? "border-l-status-outofservice-bg bg-status-outofservice-bg/5"
          : "border-l-status-active-bg/60"
      )}
    >
      <div
        className={cn(
          "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center",
          categoryMeta.bg
        )}
      >
        <Tag className={cn("h-4 w-4", categoryMeta.text)} aria-hidden />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text truncate">{record.assetName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-mono text-xs text-text-secondary">{record.assetCode}</span>
          <span className="text-text-secondary/40">·</span>
          <span
            className={cn(
              "text-xs font-semibold",
              isOverdue
                ? "text-status-outofservice-bg dark:text-status-outofservice-text"
                : daysLeft !== null && daysLeft <= 2
                  ? "text-status-repair-text"
                  : "text-text-secondary"
            )}
          >
            {!record.dueDate
              ? "Assigned"
              : isOverdue
              ? `${record.daysOverdue}d overdue`
              : daysLeft === 0
              ? "Due today"
              : daysLeft !== null && daysLeft < 0
              ? "Overdue"
              : `${daysLeft}d left`}
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-xs text-text-secondary">{record.dueDate ? "Due" : "Custody"}</p>
        <p
          className={cn(
            "text-xs font-bold",
            isOverdue ? "text-status-outofservice-bg dark:text-status-outofservice-text" : "text-text"
          )}
        >
          {record.dueDate ?? "Open assignment"}
        </p>
      </div>
    </div>
  );
}

function ActiveBorrowCardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 border-l-4 border-l-transparent">
      <div className="h-10 w-10 shrink-0 rounded-xl bg-border animate-pulse" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-32 bg-border animate-pulse rounded" />
        <div className="h-3 w-24 bg-border animate-pulse rounded" />
      </div>
      <div className="shrink-0 text-right space-y-1">
        <div className="h-3 w-6 bg-border animate-pulse rounded ml-auto" />
        <div className="h-3 w-16 bg-border animate-pulse rounded" />
      </div>
    </div>
  );
}

// ─── Pending Request Card ─────────────────────────────────────────────────────

function PendingRequestCard({ request }: { request: DashboardPendingRequest }) {
  const isApproved = false; // Snapshot pending requests are always pending
  const isRejected = false;

  const statusBadge = { label: "Pending", className: "bg-status-repair-bg/15 text-status-repair-text border-status-repair-bg/30" };

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-bg-subtle/50 transition-colors duration-150 border-l-4",
      "border-l-status-repair-bg/60"
    )}>
      <div className={cn("h-8 w-8 shrink-0 rounded-lg flex items-center justify-center", "bg-office-bg text-office-text")}>
        <Tag className={cn("h-3.5 w-3.5", "text-office-text")} aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text truncate">
          {request.itemDescription}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-xs text-text-secondary font-mono">{request.id.substring(0, 8).toUpperCase()}</p>
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border",
          statusBadge.className
        )}
      >
        {statusBadge.label}
      </span>
    </div>
  );
}

function PendingRequestCardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 border-l-4 border-l-transparent">
      <div className="h-8 w-8 shrink-0 rounded-lg bg-border animate-pulse" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-40 bg-border animate-pulse rounded" />
        <div className="h-3 w-20 bg-border animate-pulse rounded" />
      </div>
      <div className="h-5 w-16 rounded-full bg-border animate-pulse" />
    </div>
  );
}

// ─── Quick Action Button ───────────────────────────────────────────────────────

function QuickActionBtn({
  icon: Icon,
  label,
  description,
  onClick,
  href,
  tone = "default",
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick?: () => void;
  href?: string;
  tone?: "accent" | "default";
}) {
  const inner = (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 w-full text-left cursor-pointer",
        "hover:border-text-secondary/30 transition-colors duration-150",
        tone === "accent"
          ? "border-accent/30 bg-accent/5 hover:bg-accent/10"
          : "border-border bg-card hover:bg-bg-subtle"
      )}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
          tone === "accent" ? "bg-accent text-accent-foreground" : "bg-bg-subtle text-text-secondary"
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold", tone === "accent" ? "text-accent" : "text-text")}>
          {label}
        </p>
        <p className="text-xs text-text-secondary">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-text-secondary shrink-0" aria-hidden />
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return <button type="button" onClick={onClick}>{inner}</button>;
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export function BorrowerDashboard() {
  const { openWizard } = useBorrowerPortal();
  const { data: snapshot, isLoading } = useDashboardSnapshotQuery();
  const { data: me } = useMeQuery();
  const loading = isLoading || !snapshot;

  const stats = snapshot?.summary;
  const overdueAssets = snapshot?.overdueAssets || [];
  const rawPending = snapshot?.pendingRequests || [];

  const activeItemsMapped = overdueAssets.map((asset) => ({
    id: asset.id,
    assetCode: asset.assetCode,
    assetName: asset.assetName,
    category: "computing" as const, // Fallback category since snapshot doesn't include it in OverdueAsset
    status: "overdue" as const,
    dueDate: asset.dueSince.split("T")[0],
    daysOverdue: asset.daysOverdue,
  }));

  const pendingRequestsMapped = rawPending;

  const statCards: StatCardProps[] = [
    {
      label: "Active Borrowings",
      value: stats?.activeBorrows,
      subtext: "Items currently out on loan",
      icon: Package,
      tone: "default",
      isLoading: loading,
    },
    {
      label: "Pending Requests",
      value: stats?.pendingApprovals,
      subtext: stats?.pendingApprovals ? "Awaiting staff approval" : "No pending requests",
      icon: Clock,
      tone: stats && stats.pendingApprovals > 0 ? "warning" : "default",
      isLoading: loading,
    },
    {
      label: "Overdue Items",
      value: stats?.overdueAssets,
      subtext: stats?.overdueAssets ? "Past due date — return immediately" : "All items on time",
      icon: AlertTriangle,
      tone: stats && stats.overdueAssets > 0 ? "danger" : "default",
      isLoading: loading,
    },
    {
      label: "Low Stock Consumables",
      value: stats?.lowStockItems,
      subtext: "Needs attention",
      icon: Tag,
      tone: "warning",
      isLoading: loading,
    },
  ];

  return (
    <div className="flex flex-col gap-3 bg-bg-subtle max-w-full overflow-x-hidden" data-theme="light">

      {/* ── Greeting Banner ─────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <TrendingUp className="h-6 w-6 text-accent" aria-hidden />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-text">
            {me?.department ? `${me.department} portal` : "Department portal"}
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Request items for your department. You have{" "}
            {loading ? (
              <span className="inline-block w-12 h-3.5 bg-border animate-pulse rounded align-middle" />
            ) : (
              <span className="font-semibold text-text">{stats?.activeBorrows ?? 0} item{stats?.activeBorrows !== 1 ? "s" : ""}</span>
            )} currently on loan
            {(!loading && stats && stats.overdueAssets > 0) && (
              <> and <span className="font-bold text-status-outofservice-bg dark:text-status-outofservice-text">{stats.overdueAssets} overdue</span></>
            )}.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => openWizard(null)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent shadow-xs"
          >
            <Package className="h-4 w-4" aria-hidden />
            New Request
          </button>
        </div>
      </div>

      {me && !me.departmentId && (
        <div className="rounded-xl border border-status-repair-bg/40 bg-status-repair-bg/10 px-4 py-3 text-xs text-status-repair-text">
          This login is not linked to a department yet. Ask Property Custodian
          to assign a department before submitting requests.
        </div>
      )}

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <section aria-label="Borrowing overview">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <DashStatCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      {/* ── Row 2: Active Items + Recent Requests ──────────────────────── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">

        {/* Active Borrowings (Showing Overdue from Snapshot for now) */}
        <section aria-labelledby="active-borrowings-heading">
          <div className="rounded-xl border border-border bg-card overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h2 id="active-borrowings-heading" className="text-sm font-bold text-text">
                Attention Required (Overdue)
              </h2>
              <Link
                href="/borrower-db/history"
                className="text-xs text-accent font-semibold hover:underline inline-flex items-center gap-1"
              >
                View all history <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="overflow-y-auto">
                <ActiveBorrowCardSkeleton />
                <ActiveBorrowCardSkeleton />
                <ActiveBorrowCardSkeleton />
              </div>
            ) : activeItemsMapped.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-12 text-center px-6">
                <div className="h-12 w-12 rounded-full bg-bg-subtle flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-5 w-5 text-status-active-text" aria-hidden />
                </div>
                <p className="text-sm font-semibold text-text">All caught up!</p>
                <p className="text-xs text-text-secondary mt-1 max-w-xs">
                  You have no overdue items. Check your history for all active borrowings.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto">
                {activeItemsMapped.map((record) => (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  <ActiveBorrowCard key={record.id} record={record as any} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Recent Requests */}
        <section aria-labelledby="recent-requests-heading">
          <div className="rounded-xl border border-border bg-card overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h2 id="recent-requests-heading" className="text-sm font-bold text-text">
                Recent Pending Requests
              </h2>
              <Link
                href="/borrower-db/requests"
                className="text-xs text-accent font-semibold hover:underline inline-flex items-center gap-1"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="overflow-y-auto">
                <PendingRequestCardSkeleton />
                <PendingRequestCardSkeleton />
                <PendingRequestCardSkeleton />
              </div>
            ) : pendingRequestsMapped.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-12 text-center px-6">
                <div className="h-12 w-12 rounded-full bg-bg-subtle flex items-center justify-center mb-3">
                  <Package className="h-5 w-5 text-text-secondary" aria-hidden />
                </div>
                <p className="text-sm font-semibold text-text">No pending requests</p>
                <p className="text-xs text-text-secondary mt-1 max-w-xs">
                  You don&apos;t have any requests waiting for approval.
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto">
                {pendingRequestsMapped.slice(0, 5).map((req) => (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  <PendingRequestCard key={req.id} request={req as any} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
